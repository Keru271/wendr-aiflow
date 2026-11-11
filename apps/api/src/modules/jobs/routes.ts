import { FastifyInstance } from 'fastify';
import { db } from '@fixpilot/database';
import { defaultWorkflowQueue } from '@fixpilot/workers';
import { JobStatus } from '@fixpilot/shared';

export async function bugRoutes(fastify: FastifyInstance) {
  fastify.get('/bugs', async () => {
    return await db.bug.findMany({
      include: {
        project: true,
        jobs: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
  });

  fastify.get('/bugs/:id', async (req: any, reply) => {
    const bug = await db.bug.findUnique({
      where: { id: req.params.id },
      include: {
        project: { include: { repositories: true } },
        jobs: {
          include: {
            executions: true,
            validations: true,
            pullRequest: true,
            deployments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!bug) return reply.status(404).send({ error: 'Bug not found' });
    return bug;
  });
}

export async function jobRoutes(fastify: FastifyInstance) {
  fastify.get('/jobs', async (req: any) => {
    const { status, projectId } = req.query || {};
    const where: any = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    return await db.agentJob.findMany({
      where,
      include: {
        bug: true,
        project: true,
        pullRequest: true,
        deployments: true,
        _count: { select: { executions: true, validations: true, logs: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  });

  fastify.get('/jobs/:id', async (req: any, reply) => {
    const job = await db.agentJob.findUnique({
      where: { id: req.params.id },
      include: {
        bug: true,
        project: { include: { repositories: true } },
        executions: { orderBy: { createdAt: 'asc' } },
        validations: { orderBy: { createdAt: 'asc' } },
        logs: { orderBy: { createdAt: 'asc' }, take: 200 },
        pullRequest: true,
        deployments: { orderBy: { createdAt: 'desc' } },
        approvals: true,
        usageRecords: true
      }
    });
    if (!job) return reply.status(404).send({ error: 'Job not found' });
    return job;
  });

  // Retry eligible failed job (Section 12.3)
  fastify.post('/jobs/:id/retry', async (req: any, reply) => {
    const job = await db.agentJob.findUnique({ where: { id: req.params.id } });
    if (!job) return reply.status(404).send({ error: 'Job not found' });

    await db.agentJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.QUEUED,
        failureReason: null
      }
    });

    await defaultWorkflowQueue.add('RUN_WORKFLOW', {
      jobId: job.id,
      stage: 'RUN_WORKFLOW'
    });

    return { status: 'queued', message: 'Job retry initiated.' };
  });

  // Cancel running job (Section 12.3)
  fastify.post('/jobs/:id/cancel', async (req: any, reply) => {
    const job = await db.agentJob.findUnique({ where: { id: req.params.id } });
    if (!job) return reply.status(404).send({ error: 'Job not found' });

    await db.agentJob.update({
      where: { id: job.id },
      data: { status: JobStatus.CANCELLED }
    });

    return { status: 'cancelled', message: 'Job has been cancelled.' };
  });

  // Read job logs timeline (Section 12.3)
  fastify.get('/jobs/:id/logs', async (req: any, reply) => {
    const logs = await db.jobLog.findMany({
      where: { jobId: req.params.id },
      orderBy: { createdAt: 'asc' }
    });
    return logs;
  });
}

