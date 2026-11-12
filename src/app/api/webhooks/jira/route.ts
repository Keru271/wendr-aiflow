import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { jiraClient } from '@/lib/jira';
import { orchestrator } from '@/lib/orchestrator';
import { JobStatus } from '@/lib/types';
import { logger } from '@/lib/observability';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature') || req.headers.get('x-atlassian-webhook-signature');

    // Verify signature
    const isValid = jiraClient.verifyWebhookSignature(rawBody, signature || undefined);
    if (!isValid) {
      await logger.warn('Invalid Jira webhook signature rejected');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const issue = payload.issue;
    const webhookEvent = payload.webhookEvent;

    // Log receipt
    const receipt = await db.webhookReceipt.create({
      data: {
        provider: 'JIRA',
        eventId: payload.timestamp ? String(payload.timestamp) : undefined,
        signature: signature || undefined,
        payloadSummary: `${webhookEvent || 'issue_event'} - ${issue?.key || 'unknown'}`
      }
    });

    if (!issue || !issue.key) {
      return NextResponse.json({ message: 'Ignored: No issue object in payload', receiptId: receipt.id });
    }

    // Check opt-in label
    const labels: string[] = issue.fields?.labels || [];
    const hasOptIn = labels.some((l: string) => l.toLowerCase() === 'ai-fix-opt-in' || l.toLowerCase() === 'fixpilot');

    // Resolve project and its repositories
    const projectKey = issue.key.split('-')[0];
    let project = await db.project.findFirst({
      where: { key: projectKey },
      include: { repositories: true }
    });

    if (!project) {
      // Find fallback or create
      project = await db.project.findFirst({
        include: { repositories: true }
      });
      if (!project) {
        return NextResponse.json({ error: 'No matching project found in FixPilot' }, { status: 400 });
      }
    }

    // Determine target repositories for this issue (N repositories)
    let repoConnect: Array<{ id: string }> = [];
    const textToSearch = `${issue.fields?.summary || ''} ${JSON.stringify(issue.fields?.description || '')} ${labels.join(' ')}`.toLowerCase();
    const isAllRepos =
      textToSearch.includes('all repository') ||
      textToSearch.includes('all repositories') ||
      textToSearch.includes('all repos') ||
      textToSearch.includes('throughout the application') ||
      textToSearch.includes('across all');

    if (isAllRepos && project.repositories.length > 0) {
      repoConnect = project.repositories.map((r) => ({ id: r.id }));
    } else {
      const matched = project.repositories.filter((r) => {
        const rName = r.name.toLowerCase();
        const parts = rName.split(/[-_]/).filter((p) => p.length >= 4);
        return (
          labels.some((l: string) => l.toLowerCase() === rName || l.toLowerCase() === `repo:${rName}`) ||
          textToSearch.includes(rName) ||
          parts.some((p) => textToSearch.includes(p))
        );
      });
      if (matched.length > 0) {
        repoConnect = matched.map((r) => ({ id: r.id }));
      } else if (project.repositories.length > 0) {
        repoConnect = [{ id: project.repositories[0].id }];
      }
    }

    // Upsert bug so it is ALWAYS visible in the dashboard
    const bug = await db.bug.upsert({
      where: {
        projectId_jiraIssueId: {
          projectId: project.id,
          jiraIssueId: issue.id || issue.key
        }
      },
      update: {
        title: issue.fields?.summary || issue.key,
        description: issue.fields?.description?.content ? JSON.stringify(issue.fields.description) : (issue.fields?.description || ''),
        status: issue.fields?.status?.name || 'Open',
        labels: JSON.stringify(labels),
        ...(repoConnect.length > 0 ? { repositories: { set: repoConnect } } : {})
      },
      create: {
        projectId: project.id,
        jiraIssueId: issue.id || issue.key,
        jiraIssueKey: issue.key,
        title: issue.fields?.summary || `Bug ${issue.key}`,
        description: typeof issue.fields?.description === 'string' ? issue.fields.description : JSON.stringify(issue.fields?.description || ''),
        status: issue.fields?.status?.name || 'Open',
        priority: issue.fields?.priority?.name || 'High',
        labels: JSON.stringify(labels),
        sourcePayload: JSON.stringify(issue),
        ...(repoConnect.length > 0 ? { repositories: { connect: repoConnect } } : {})
      }
    });

    // Create job with idempotency
    const idempotencyKey = `jira_${issue.key}_${issue.fields?.updated || Date.now()}`;
    const job = await db.agentJob.create({
      data: {
        projectId: project.id,
        bugId: bug.id,
        status: JobStatus.QUEUED,
        idempotencyKey
      }
    });

    await db.webhookReceipt.update({
      where: { id: receipt.id },
      data: { processed: true }
    });

    // Run orchestrator asynchronously if opted in
    if (hasOptIn) {
      orchestrator.runJob(job.id).catch(err => {
        logger.error(`Orchestrator error for job ${job.id}: ${err.message}`, err);
      });
    } else {
      await logger.info(`Jira issue ${issue.key} saved to dashboard in QUEUED status (ready for manual start)`);
    }

    return NextResponse.json({
      message: hasOptIn
        ? 'Jira issue accepted and queued for FixPilot autonomous resolution'
        : 'Jira issue received and logged to dashboard (pending manual start or opt-in label)',
      jobId: job.id,
      jiraKey: issue.key
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
