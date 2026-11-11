import { FastifyInstance } from 'fastify';
import { db } from '@fixpilot/database';
import { jiraClient } from '@fixpilot/jira-client';
import { githubClient } from '@fixpilot/github-client';
import { processJiraIngestion } from '@fixpilot/workers';
import { defaultWorkflowQueue } from '@fixpilot/workers';
import { logger } from '@fixpilot/observability';

export async function webhookRoutes(fastify: FastifyInstance) {
  // JIRA WEBHOOK (Section 6.3 & 12.1)
  fastify.post('/webhooks/jira', async (req: any, reply) => {
    const rawPayload = JSON.stringify(req.body);
    const signature = req.headers['x-hub-signature'] as string | undefined;

    // 1. Verify webhook authenticity
    const isValid = jiraClient.verifyWebhookSignature(rawPayload, signature);
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    const issueKey = event.issue?.key;
    const projectKey = event.issue?.fields?.project?.key;

    // 2. Persist webhook receipt for idempotency & audit trail
    await db.webhookReceipt.create({
      data: {
        provider: 'JIRA',
        eventId: event.webhookEvent || 'jira:issue_updated',
        signature,
        payloadSummary: `Issue: ${issueKey}, Event: ${event.webhookEvent}`,
        processed: true
      }
    });

    if (!issueKey) {
      return { status: 'acknowledged', action: 'ignored_missing_issue_key' };
    }

    // 3. Find matching project
    const project = await db.project.findFirst({
      where: { key: projectKey }
    });

    if (!project) {
      return { status: 'acknowledged', action: 'ignored_unregistered_project' };
    }

    // 4. Idempotency key
    const idempotencyKey = `jira-${issueKey}-${Date.now().toString().substring(0, 8)}`;

    // 5. Asynchronous queue processing
    setImmediate(async () => {
      try {
        const job = await processJiraIngestion({
          issueKey,
          projectId: project.id,
          idempotencyKey,
          sourcePayload: event
        });

        if (job) {
          await defaultWorkflowQueue.add('RUN_WORKFLOW', {
            jobId: job.id,
            stage: 'RUN_WORKFLOW'
          });
        }
      } catch (err) {
        logger.error(`Error handling Jira webhook for ${issueKey}`, err);
      }
    });

    return reply.status(202).send({
      status: 'accepted',
      message: `Webhook accepted for issue ${issueKey}`,
      idempotencyKey
    });
  });

  // GITHUB WEBHOOK (Section 6.8 & 12.1)
  fastify.post('/webhooks/github', async (req: any, reply) => {
    const rawPayload = JSON.stringify(req.body);
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    const isValid = githubClient.verifyWebhookSignature(rawPayload, signature);
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid webhook signature' });
    }

    const event = req.headers['x-github-event'] as string;
    const deliveryId = req.headers['x-github-delivery'] as string;

    await db.webhookReceipt.create({
      data: {
        provider: 'GITHUB',
        eventId: event,
        deliveryId,
        signature,
        payloadSummary: `Event: ${event}, Action: ${req.body?.action}`,
        processed: true
      }
    });

    // Handle PR merged event -> trigger staging deployment
    if (event === 'pull_request' && req.body.action === 'closed' && req.body.pull_request?.merged) {
      const prNumber = req.body.pull_request.number;
      const prRecord = await db.pullRequest.findFirst({
        where: { number: prNumber },
        include: { job: true }
      });

      if (prRecord) {
        await db.pullRequest.update({
          where: { id: prRecord.id },
          data: {
            status: 'MERGED',
            mergedAt: new Date(),
            commitSha: req.body.pull_request.merge_commit_sha
          }
        });

        await defaultWorkflowQueue.add('RUN_WORKFLOW', {
          jobId: prRecord.jobId,
          stage: 'STAGING_DEPLOY'
        });
      }
    }

    return reply.status(202).send({ status: 'accepted', event });
  });
}

