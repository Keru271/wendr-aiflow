import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await db.agentJob.findUnique({
      where: { id: params.id },
      include: { bug: true }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Trigger run asynchronously
    setTimeout(() => {
      orchestrator.runJob(params.id).catch(err => {
        console.error(`Error running job ${params.id}:`, err);
      });
    }, 50);

    return NextResponse.json({
      success: true,
      message: `Antigravity fix initiated for ${job.bug?.jiraIssueKey || params.id}`,
      jobId: params.id
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to start job' }, { status: 500 });
  }
}

