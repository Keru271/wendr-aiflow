import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { JobStatus } from '@/lib/types';
import { orchestrator } from '@/lib/orchestrator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const jobs = await db.agentJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        bug: true,
        project: { select: { id: true, name: true, key: true } },
        pullRequest: true,
        deployments: { orderBy: { createdAt: 'desc' }, take: 1 },
        validations: { select: { status: true } }
      }
    });

    return NextResponse.json({ jobs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, jiraIssueKey, title, description, priority } = body;

    if (!projectId || !jiraIssueKey || !title) {
      return NextResponse.json({ error: 'Missing required fields: projectId, jiraIssueKey, title' }, { status: 400 });
    }

    // Upsert bug
    let bug = await db.bug.findFirst({
      where: { projectId, jiraIssueKey }
    });

    if (!bug) {
      bug = await db.bug.create({
        data: {
          projectId,
          jiraIssueId: `jira_${Date.now()}`,
          jiraIssueKey,
          title,
          description: description || '',
          priority: priority || 'High',
          labels: JSON.stringify(['ai-fix-opt-in', 'bug'])
        }
      });
    }

    // Create job
    const job = await db.agentJob.create({
      data: {
        projectId,
        bugId: bug.id,
        status: JobStatus.QUEUED,
        idempotencyKey: `job_${bug.jiraIssueKey}_${Date.now()}`
      }
    });

    // Run orchestrator asynchronously
    orchestrator.runJob(job.id).catch(console.error);

    return NextResponse.json({ job }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
