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

    await db.webhookReceipt.update({
      where: { id: receipt.id },
      data: { processed: true }
    });

    return NextResponse.json({ message: 'GitHub webhook processed', event, receiptId: receipt.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
