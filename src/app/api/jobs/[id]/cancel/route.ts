import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';
import { JobStatus } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await orchestrator.transitionStatus(params.id, JobStatus.CANCELLED, { reason: 'User initiated cancellation' });
    return NextResponse.json({ message: 'Job cancelled successfully', jobId: params.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
