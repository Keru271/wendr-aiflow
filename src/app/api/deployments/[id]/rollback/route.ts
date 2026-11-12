import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { orchestrator } from '@/lib/orchestrator';
import { UserRole, UserSession } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { reason = 'Emergency Rollback triggered via Dashboard', email = 'operator@fixpilot.ai', role = 'ADMIN' } = body;

    let jobId = params.id;
    const directJob = await db.agentJob.findUnique({ where: { id: jobId } });
    if (!directJob) {
      const deployment = await db.deployment.findUnique({ where: { id: params.id } });
      if (deployment) {
        jobId = deployment.jobId;
      } else {
        return NextResponse.json({ error: `Job or deployment not found: ${params.id}` }, { status: 404 });
      }
    }

    const session: UserSession = {
      userId: 'user_operator',
      email,
      organizationId: '',
      role: role as UserRole
    };

    await orchestrator.rollbackProduction(jobId, reason, session);

    return NextResponse.json({
      message: 'Rollback triggered successfully',
      jobId
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
