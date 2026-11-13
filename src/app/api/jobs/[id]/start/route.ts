import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';
import { logger } from '@/lib/observability';
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

    // Reset job state for fresh run
    await db.agentJob.update({
      where: { id: params.id },
      data: {
        status: 'QUEUED',
        failureReason: null,
        updatedAt: new Date()
      }
    });

    // Execute orchestrator lifecycle asynchronously in background
    // (Prevents HTTP gateway timeouts and connection drops)
    orchestrator.runJob(params.id).catch(async (err: any) => {
      await logger.error(`Orchestrator error for job ${params.id}: ${err.message}`, err);
    });

    return NextResponse.json({
      success: true,
      message: `Antigravity fix started for ${job.bug?.jiraIssueKey || params.id}`,
      jobId: params.id
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to start job' }, { status: 500 });
  }
}

