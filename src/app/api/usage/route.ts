import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const records = await db.usageRecord.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const totalInputTokens = records.reduce((acc, r) => acc + r.inputTokens, 0);
    const totalOutputTokens = records.reduce((acc, r) => acc + r.outputTokens, 0);
    const totalExecutionMs = records.reduce((acc, r) => acc + r.executionMs, 0);
    const totalCostInr = records.reduce((acc, r) => acc + r.costInr, 0);

    return NextResponse.json({
      summary: {
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalExecutionMs,
        totalCostInr: parseFloat(totalCostInr.toFixed(2)),
        currency: 'INR'
      },
      records
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
