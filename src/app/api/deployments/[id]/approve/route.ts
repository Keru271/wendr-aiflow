import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { orchestrator } from '@/lib/orchestrator';
import { UserRole, UserSession } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { comment, role = 'APPROVER', email = 'approver@fixpilot.ai' } = body;

    // Check if id is a jobId directly or a deploymentId
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

    // Find or create approver user record
    let user = await db.user.findFirst({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: 'Production Release Approver'
        }
      });
    }

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      organizationId: '',
      role: role as UserRole
    };

    await orchestrator.approveProduction(jobId, session, comment);

    return NextResponse.json({
      message: 'Production deployment approved and initiated successfully',
      jobId
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
