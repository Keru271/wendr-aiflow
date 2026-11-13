import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { githubClient } from '@/lib/github';
import { logger } from '@/lib/observability';
import { JobStatus } from '@/lib/types';
import { orchestrator } from '@/lib/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || req.headers.get('x-hub-signature');
    const event = req.headers.get('x-github-event') || 'unknown';

    const isValid = githubClient.verifyWebhookSignature(rawBody, signature || undefined);
    if (!isValid) {
      await logger.warn('Invalid GitHub webhook signature rejected');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    const receipt = await db.webhookReceipt.create({
      data: {
        provider: 'GITHUB',
        eventId: req.headers.get('x-github-delivery') || undefined,
        signature: signature || undefined,
        payloadSummary: `github_${event} - pr #${payload.pull_request?.number || payload.check_suite?.id || 'none'}`
      }
    });

    // Handle pull_request event (e.g. human reviewer merged or closed the PR)
    if (event === 'pull_request' && payload.pull_request) {
      const prNumber = payload.pull_request.number;
      const isMerged = payload.pull_request.merged;
      const action = payload.action;

      const existingPr = await db.pullRequest.findFirst({
        where: { number: prNumber },
        include: { job: true }
      });

      if (existingPr) {
        if (action === 'closed' && isMerged) {
          await db.pullRequest.update({
            where: { id: existingPr.id },
            data: { status: 'MERGED', mergedAt: new Date() }
          });
          await orchestrator.transitionStatus(existingPr.jobId, JobStatus.READY_TO_DEPLOY, {
            reason: `GitHub PR #${prNumber} merged by human reviewer`
          });
        }
      }
    }

    // Handle PR review comments & feedback (PRD Section 4 #10 & F9)
    if (
      event === 'pull_request_review_comment' ||
      event === 'issue_comment' ||
      event === 'pull_request_review'
    ) {
      const prNumber = payload.pull_request?.number || payload.issue?.number;
      const commentText = (payload.comment?.body || payload.review?.body || '').trim();
      const isReviewComment = commentText.length > 0;

      if (prNumber && isReviewComment) {
        const existingPr = await db.pullRequest.findFirst({
          where: { number: prNumber },
          include: { job: { include: { bug: true } } }
        });

        if (existingPr) {
          const lowerComment = commentText.toLowerCase();
          const shouldRerun =
            lowerComment.includes('ai, address feedback') ||
            lowerComment.includes('@fixpilot') ||
            lowerComment.includes('address feedback') ||
            payload.review?.state === 'changes_requested';

          if (shouldRerun) {
            await logger.info(
              `[REVIEW_FEEDBACK] Reviewer requested feedback on PR #${prNumber}: "${commentText}". Triggering autonomous re-run on branch ${existingPr.branchName}...`,
              { jobId: existingPr.jobId, stage: 'CODING' }
            );

            // Append reviewer feedback to bug description for the fix run
            if (existingPr.job?.bug) {
              const updatedDesc = `${existingPr.job.bug.description || ''}\n\n[Reviewer Feedback on PR #${prNumber}]:\n${commentText}`;
              await db.bug.update({
                where: { id: existingPr.job.bug.id },
                data: { description: updatedDesc }
              });
            }

            // Reset job to CODING or QUEUED and re-run
            await db.agentJob.update({
              where: { id: existingPr.jobId },
              data: { status: JobStatus.READY_TO_FIX }
            });

            orchestrator.runJob(existingPr.jobId).catch((err) => {
              logger.error(`Re-run on PR review feedback failed: ${err.message}`, err);
            });
          }
        }
      }
    }

    await db.webhookReceipt.update({
      where: { id: receipt.id },
      data: { processed: true }
    });

    return NextResponse.json({ message: 'GitHub webhook processed', event, receiptId: receipt.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
