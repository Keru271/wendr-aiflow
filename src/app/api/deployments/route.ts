import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const deployments = await db.deployment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            bug: true,
            project: true,
            approvals: true
          }
        }
      }
    });
    return NextResponse.json({ deployments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
