import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { workspaceManager } from '@/lib/agent-adapters/workspace';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await db.agentJob.findUnique({
      where: { id: params.id },
      include: {
        bug: {
          include: { repositories: true }
        },
        project: {
          include: { repositories: true }
        },
        executions: {
          orderBy: { createdAt: 'asc' }
        },
        workspaces: true,
        validations: {
          orderBy: { createdAt: 'asc' }
        },
        pullRequests: {
          include: { repository: true }
        },
        deployments: {
          orderBy: { createdAt: 'desc' }
        },
        approvals: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { timestamp: 'desc' }
        },
        artifacts: true,
        logs: {
          orderBy: { createdAt: 'asc' },
          take: 200
        },
        usageRecords: true
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      job: {
        ...job,
        pullRequest: job.pullRequests?.[0] || null
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await db.agentJob.findUnique({
      where: { id: params.id },
      include: { workspaces: true, bug: true }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Clean up physical workspaces on disk
    if (job.workspaces && job.workspaces.length > 0) {
      for (const ws of job.workspaces) {
        await workspaceManager.destroyWorkspace(ws.jobId).catch(() => {});
      }
    }
    await workspaceManager.destroyWorkspace(params.id).catch(() => {});

    // If bug exists, deleting the bug cascade-deletes the job and all child tables
    if (job.bugId) {
      await db.bug.delete({
        where: { id: job.bugId }
      }).catch(async () => {
        await db.agentJob.delete({ where: { id: params.id } });
      });
    } else {
      await db.agentJob.delete({
        where: { id: params.id }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Issue ${job.bug?.jiraIssueKey || params.id} and associated job removed successfully.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
