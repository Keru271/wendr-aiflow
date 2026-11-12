import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { jiraClient } from '@/lib/jira';
import { orchestrator } from '@/lib/orchestrator';
import { JobStatus } from '@/lib/types';
import { logger } from '@/lib/observability';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issueKey, autoStart = true } = body;

    if (!issueKey) {
      return NextResponse.json({ error: 'Missing required field: issueKey' }, { status: 400 });
    }

    await logger.info(`Importing Jira issue ${issueKey} into FixPilot`, { stage: 'JIRA' });

    // Fetch canonical issue from Jira Cloud
    const issue = await jiraClient.fetchIssue(issueKey.trim());

    // Resolve or create Project
    const projectKey = issue.projectKey || issueKey.split('-')[0] || 'WEB';
    let project = await db.project.findFirst({
      where: { key: projectKey }
    });

    if (!project) {
      // Find fallback or create
      project = await db.project.findFirst();
      if (!project) {
        return NextResponse.json({ error: 'No project configured in FixPilot' }, { status: 400 });
      }
    }

    // Upsert bug
    const bug = await db.bug.upsert({
      where: {
        projectId_jiraIssueId: {
          projectId: project.id,
          jiraIssueId: issue.id || issue.key
        }
      },
      update: {
        title: issue.summary,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        labels: JSON.stringify(issue.labels)
      },
      create: {
        projectId: project.id,
        jiraIssueId: issue.id || issue.key,
        jiraIssueKey: issue.key,
        title: issue.summary,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        labels: JSON.stringify(issue.labels)
      }
    });

    // Create Agent Job
    const idempotencyKey = `import_${issue.key}_${Date.now()}`;
    const job = await db.agentJob.create({
      data: {
        projectId: project.id,
        bugId: bug.id,
        status: JobStatus.QUEUED,
        idempotencyKey
      }
    });

    // If autoStart, trigger orchestrator in background
    if (autoStart) {
      setTimeout(() => {
        orchestrator
          .runJob(job.id)
          .catch((err) => {
            logger.error(`Orchestrator failed for imported job ${job.id}: ${err.message}`, { jobId: job.id });
          });
      }, 50);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully imported ${issue.key} and started AI fix pipeline`,
        bug,
        job
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to import Jira issue' }, { status: 500 });
  }
}

