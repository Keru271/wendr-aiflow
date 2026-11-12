import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await db.agentJob.findUnique({
      where: { id: params.id },
      include: {
        bug: true,
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
        pullRequest: true,
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

    return NextResponse.json({ job });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
