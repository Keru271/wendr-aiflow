import { db } from '@fixpilot/database';

export interface LogContext {
  jobId?: string;
  orgId?: string;
  stage?: string;
  userId?: string;
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
    await this.persistToJobLog('INFO', message, context);
  }

  async warn(message: string, context?: LogContext) {
    const formatted = this.format('WARN', message, context);
    console.warn(`${formatted.prefix}: ${formatted.message}`);
    await this.persistToJobLog('WARN', message, context);
  }

  async error(message: string, err?: any, context?: LogContext) {
    const formatted = this.format('ERROR', message, context);
    const errMessage = err ? (err.stack || err.message || JSON.stringify(err)) : '';
    console.error(`${formatted.prefix}: ${formatted.message} ${errMessage}`);
    await this.persistToJobLog('ERROR', `${message} ${errMessage}`.trim(), context);
  }

  async debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      const formatted = this.format('DEBUG', message, context);
      console.debug(`${formatted.prefix}: ${formatted.message}`);
    }
  }

  private async persistToJobLog(level: string, message: string, context?: LogContext) {
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
      // In case DB is unavailable or disconnected during crash
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
  organizationId: string;
  jobId?: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  executionMs: number;
}) {
  // Cost calculation based on planning allowance (~₹2000 per 100 jobs or ₹0.15 per 1K tokens)
  const tokenCostInr = ((params.inputTokens + params.outputTokens) / 1000) * 0.15;
  const executionCostInr = (params.executionMs / 1000) * 0.01;
  const costInr = Number((tokenCostInr + executionCostInr).toFixed(2));

  try {
    return await db.usageRecord.create({
      data: {
        organizationId: params.organizationId,
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

