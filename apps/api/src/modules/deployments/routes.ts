import { FastifyInstance } from 'fastify';
import { db } from '@fixpilot/database';
import { processProductionDeployment } from '@fixpilot/workers';
import { requireRole } from '../../plugins/auth.js';
import { UserRole, DeploymentStatus, JobStatus } from '@fixpilot/shared';
import { logger } from '@fixpilot/observability';

export async function pullRequestRoutes(fastify: FastifyInstance) {
  fastify.get('/pull-requests', async () => {
    return await db.pullRequest.findMany({
      include: {
        job: {
          include: {
            bug: true,
            project: true,
            validations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  });
}

export async function deploymentRoutes(fastify: FastifyInstance) {
  fastify.get('/deployments', async () => {
    return await db.deployment.findMany({
      include: {
        job: {
          include: {
            bug: true,
            project: true,
            pullRequest: true,
            approvals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  });

  fastify.get('/deployments/:id', async (req: any, reply) => {
    const deployment = await db.deployment.findUnique({
      where: { id: req.params.id },
      include: {
        job: {
          include: {
            bug: true,
            project: true,
            pullRequest: true,
            approvals: true
          }
        }
      }
    });
    if (!deployment) return reply.status(404).send({ error: 'Deployment not found' });
    return deployment;
  });

  // Human Approval endpoint (Section 6.9 & Section 12.4)
  // Protected operation: requires APPROVER or ADMIN role
  fastify.post(
    '/deployments/:id/approve',
    { preHandler: [requireRole([UserRole.APPROVER, UserRole.ADMIN, UserRole.ORGANIZATION_OWNER])] },
    async (req: any, reply) => {
      const { comment, simulateFailure } = req.body || {};
      const deployment = await db.deployment.findUnique({
        where: { id: req.params.id },
        include: { job: true }
      });

      if (!deployment) return reply.status(404).send({ error: 'Deployment not found' });

      const approverEmail = req.user?.email || 'approver@acme.com';
      const approverUserId = req.user?.userId || 'user-approver-default';

      try {
        const result = await processProductionDeployment({
          jobId: deployment.jobId,
          approverUserId,
          approverEmail,
          comment,
          simulateFailure: !!simulateFailure
        });

        return {
          status: 'success',
          message: simulateFailure ? 'Production verification failed; rollback executed.' : 'Production deployment approved and verified.',
          deployment: result
        };
      } catch (err: any) {
        return reply.status(500).send({ error: err.message });
      }
    }
  );

  // Manual Rollback endpoint
  fastify.post(
    '/deployments/:id/rollback',
    { preHandler: [requireRole([UserRole.APPROVER, UserRole.ADMIN, UserRole.ORGANIZATION_OWNER])] },
    async (req: any, reply) => {
      const deployment = await db.deployment.findUnique({
        where: { id: req.params.id },
        include: { job: true }
      });

      if (!deployment) return reply.status(404).send({ error: 'Deployment not found' });

      await db.deployment.update({
        where: { id: deployment.id },
        data: {
          status: DeploymentStatus.ROLLED_BACK,
          rollbackReason: req.body?.reason || 'Manual rollback initiated by operator.'
        }
      });

      await db.agentJob.update({
        where: { id: deployment.jobId },
        data: { status: JobStatus.ROLLED_BACK }
      });

      return { status: 'success', message: 'Deployment rolled back to previous stable release.' };
    }
  );
}

