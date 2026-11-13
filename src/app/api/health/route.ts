import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { antigravityClient } from '@/lib/antigravity-client';
import { agyCli } from '@/lib/agy-cli';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Quick db check
    await db.$queryRaw`SELECT 1`;

    // 2. Antigravity AI health & auth check (PRD F18)
    const aiHealth = await antigravityClient.checkHealth();

    // 3. Antigravity CLI check
    const cliAvailable = await agyCli.isAvailable();
    const cliPath = agyCli.resolveCliPath();

    const isHealthy = aiHealth.status === 'connected' || cliAvailable;

    return NextResponse.json({
      status: isHealthy ? 'ok' : 'degraded',
      service: 'fixpilot',
      version: '1.0.0',
      database: 'connected',
      antigravityCli: {
        available: cliAvailable,
        path: cliPath,
        primary: cliAvailable
      },
      antigravityAi: {
        status: aiHealth.status,
        model: aiHealth.primaryModel,
        message: aiHealth.message
      },
      timestamp: new Date().toISOString()
    }, { status: isHealthy ? 200 : 200 });
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
