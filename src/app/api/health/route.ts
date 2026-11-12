import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Quick db check
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      service: 'fixpilot',
      version: '1.0.0',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'fixpilot',
        error: err.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
