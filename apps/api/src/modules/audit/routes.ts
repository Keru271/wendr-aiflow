import { FastifyInstance } from 'fastify';
import { db } from '@fixpilot/database';

export async function auditRoutes(fastify: FastifyInstance) {
  fastify.get('/audit-logs', async () => {
    return await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  });
}

export async function usageRoutes(fastify: FastifyInstance) {
  fastify.get('/usage', async () => {
    const records = await db.usageRecord.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const totalInputTokens = records.reduce((acc, r) => acc + r.inputTokens, 0);
    const totalOutputTokens = records.reduce((acc, r) => acc + r.outputTokens, 0);
    const totalCostInr = records.reduce((acc, r) => acc + r.costInr, 0);

    return {
      summary: {
        totalJobsProcessed: records.length,
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalCostInr: Number(totalCostInr.toFixed(2)),
        budgetMonthlyAllowanceInr: 10000,
        budgetUsedPercent: Number(((totalCostInr / 10000) * 100).toFixed(1))
      },
      records: records.slice(0, 50)
    };
  });
}

