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
    const { issueKey, autoStart = true, repositoryIds } = body;

    if (!issueKey) {
      return NextResponse.json({ error: 'Missing required field: issueKey' }, { status: 400 });
    }

    await logger.info(`Importing Jira issue ${issueKey} into FixPilot`, { stage: 'JIRA' });

    // Fetch canonical issue from Jira Cloud
    const issue = await jiraClient.fetchIssue(issueKey.trim());

    // Resolve or create Project
    const projectKey = issue.projectKey || issueKey.split('-')[0] || 'WEB';
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
        return NextResponse.json({ error: 'No project configured in FixPilot' }, { status: 400 });
      }
    }

    // Determine target repositories for this issue (N repositories)
    let repoConnect: Array<{ id: string }> = [];
    if (Array.isArray(repositoryIds) && repositoryIds.length > 0) {
      repoConnect = repositoryIds.map((id: string) => ({ id }));
    } else {
      const textToSearch = `${issue.summary} ${issue.description || ''} ${(issue.labels || []).join(' ')}`.toLowerCase();
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
            (issue.labels || []).some((l: string) => l.toLowerCase() === rName || l.toLowerCase() === `repo:${rName}`) ||
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
    }

    // Upsert bug and associate with N repositories
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
        labels: JSON.stringify(issue.labels),
        ...(repoConnect.length > 0 ? { repositories: { set: repoConnect } } : {})
      },
      create: {
        projectId: project.id,
        jiraIssueId: issue.id || issue.key,
        jiraIssueKey: issue.key,
        title: issue.summary,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        labels: JSON.stringify(issue.labels),
        ...(repoConnect.length > 0 ? { repositories: { connect: repoConnect } } : {})
      },
      include: {
        repositories: true
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

    // If autoStart, execute orchestrator lifecycle
    if (autoStart) {
      try {
        await orchestrator.runJob(job.id);
      } catch (err: any) {
        logger.error(`Orchestrator failed for imported job ${job.id}: ${err.message}`, { jobId: job.id });
      }
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

