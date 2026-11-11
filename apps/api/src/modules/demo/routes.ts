import { FastifyInstance } from 'fastify';
import { db } from '@fixpilot/database';
import { orchestrator } from '@fixpilot/workers';
import { JobStatus } from '@fixpilot/shared';

export async function demoRoutes(fastify: FastifyInstance) {
  fastify.post('/demo/trigger', async (req: any, reply) => {
    // 1. Get default project
    let project = await db.project.findFirst({
      where: { key: 'WEB' }
    });

    if (!project) {
      project = await db.project.findFirst();
    }

    if (!project) {
      return reply.status(400).send({ error: 'Please run database seed first' });
    }

    const customKey = `WEB-${Math.floor(1000 + Math.random() * 9000)}`;
    const idempotencyKey = `demo-${customKey}-${Date.now()}`;

    // 2. Create demo Bug
    const bug = await db.bug.create({
      data: {
        projectId: project.id,
        jiraIssueId: `JIRA-${customKey}`,
        jiraIssueKey: customKey,
        title: req.body?.title || 'Coupon validation does not handle expired coupon response',
        description:
          req.body?.description ||
          'When applying an expired coupon code in checkout, the form hangs with an unhandled rejection instead of displaying the invalid coupon error message.',
        status: 'Open',
        priority: 'High',
        labels: JSON.stringify(['ai-auto-fix', 'checkout']),
        sourcePayload: JSON.stringify({
          key: customKey,
          environment: 'Staging / Chrome 120'
        })
      }
    });

    // 3. Create AgentJob
    const job = await db.agentJob.create({
      data: {
        projectId: project.id,
        bugId: bug.id,
        status: JobStatus.QUEUED,
        idempotencyKey,
        startedAt: new Date()
      }
    });

    // 4. Run the autonomous pipeline synchronously or asynchronously
    const isAsync = req.query?.async === 'true';

    if (isAsync) {
      setImmediate(async () => {
        await orchestrator.runEndToEndJob(job.id);
      });
      return {
        status: 'queued',
        jobId: job.id,
        bugKey: customKey,
        message: 'FixPilot autonomous pipeline started in background'
      };
    }

    // Run synchronous demo execution
    const result = await orchestrator.runEndToEndJob(job.id, true);

    const updatedJob = await db.agentJob.findUnique({
      where: { id: job.id },
      include: {
        bug: true,
        executions: true,
        validations: true,
        pullRequest: true,
        deployments: true,
        logs: { take: 50, orderBy: { createdAt: 'desc' } }
      }
    });

    return {
      status: 'completed_staging',
      jobId: job.id,
      bugKey: customKey,
      result,
      job: updatedJob
    };
  });
}

