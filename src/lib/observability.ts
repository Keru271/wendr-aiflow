import db from './db';

export interface LogContext {
  jobId?: string;
  stage?: string;
  [key: string]: any;
}

export class Logger {
  constructor(private defaultContext: LogContext = {}) {}

  private format(level: string, message: string, context?: LogContext) {
    const merged = { ...this.defaultContext, ...context, timestamp: new Date().toISOString() };
    const prefix = `[${merged.timestamp}] [${level.toUpperCase()}]${merged.jobId ? ` [job:${merged.jobId}]` : ''}${merged.stage ? ` [${merged.stage}]` : ''}`;
    return { prefix, message, metadata: merged };
  }

  async info(message: string, context?: LogContext) {
    const formatted = this.format('INFO', message, context);
    console.log(`${formatted.prefix}: ${formatted.message}`);
    await this.persist('INFO', message, context);
  }

  async warn(message: string, context?: LogContext) {
    const formatted = this.format('WARN', message, context);
    console.warn(`${formatted.prefix}: ${formatted.message}`);
    await this.persist('WARN', message, context);
  }

  async error(message: string, err?: any, context?: LogContext) {
    const formatted = this.format('ERROR', message, context);
    const errMessage = err ? (err.stack || err.message || JSON.stringify(err)) : '';
    console.error(`${formatted.prefix}: ${formatted.message} ${errMessage}`);
    await this.persist('ERROR', `${message} ${errMessage}`.trim(), context);
  }

  private async persist(level: string, message: string, context?: LogContext) {
    const jobId = context?.jobId || this.defaultContext.jobId;
    const stage = context?.stage || this.defaultContext.stage || 'GENERAL';
    if (!jobId) return;

    try {
      await db.jobLog.create({
        data: {
          jobId,
          level,
          stage,
          message,
          metadata: JSON.stringify(context || {})
        }
      });
    } catch {
      // Safe fallback if db not reachable
    }
  }
}

export const logger = new Logger();

export async function recordAuditLog(params: {
  organizationId: string;
  userId?: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    return await db.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        actorEmail: params.actorEmail || 'system@fixpilot.io',
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function recordUsage(params: {
  organizationId?: string;
  jobId?: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  executionMs: number;
}) {
  const tokenCostInr = ((params.inputTokens + params.outputTokens) / 1000) * 0.15;
  const executionCostInr = (params.executionMs / 1000) * 0.01;
  const costInr = Number((tokenCostInr + executionCostInr).toFixed(2));

  try {
    let orgId = params.organizationId;
    if (!orgId && params.jobId) {
      const job = await db.agentJob.findUnique({
        where: { id: params.jobId },
        include: { project: true }
      });
      if (job) orgId = job.project.organizationId;
    }
    if (!orgId) {
      const org = await db.organization.findFirst();
      if (org) orgId = org.id;
    }

    if (!orgId) return;

    return await db.usageRecord.create({
      data: {
        organizationId: orgId,
        jobId: params.jobId,
        provider: params.provider,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        executionMs: params.executionMs,
        costInr
      }
    });
  } catch (err) {
    console.error('Failed to record usage metrics:', err);
  }
}
