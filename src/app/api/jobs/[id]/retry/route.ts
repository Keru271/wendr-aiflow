import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await orchestrator.retryJob(params.id);
    return NextResponse.json({ message: 'Job retry initiated successfully', jobId: params.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
