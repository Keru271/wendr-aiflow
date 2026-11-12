import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const pullRequests = await db.pullRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            bug: true,
            project: true
          }
        }
      }
    });
    return NextResponse.json({ pullRequests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
