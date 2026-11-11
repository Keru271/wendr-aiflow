import { db } from '@fixpilot/database';
import { jiraClient } from '@fixpilot/jira-client';
import { logger } from '@fixpilot/observability';
import { JobStatus } from '@fixpilot/shared';

export async function processJiraIngestion(params: {
  issueKey: string;
  projectId: string;
  idempotencyKey: string;
  sourcePayload?: any;
}) {
  const { issueKey, projectId, idempotencyKey, sourcePayload } = params;

  await logger.info(`Processing Jira issue ingestion for ${issueKey}`, {
    stage: 'JIRA_WORKER',
    issueKey,
    projectId
  });

  // 1. Fetch canonical issue from Jira
  const canonical = await jiraClient.fetchIssue(issueKey);

  // 2. Verify opt-in policy (Section 6.3: "ai-auto-fix" label or AI Fix Enabled)
  if (!canonical.aiFixEnabled) {
    await logger.info(`Issue ${issueKey} does not have AI fix opt-in label or flag. Ignoring.`, {
      stage: 'JIRA_WORKER'
    });
    return null;
  }

  // 3. Upsert Bug record
  const bug = await db.bug.upsert({
    where: {
      projectId_jiraIssueId: {
        projectId,
        jiraIssueId: canonical.id
      }
    },
    update: {
      title: canonical.summary,
      description: canonical.description,
      status: canonical.status,
      priority: canonical.priority,
      labels: JSON.stringify(canonical.labels),
      sourcePayload: JSON.stringify(sourcePayload || canonical)
    },
    create: {
      projectId,
      jiraIssueId: canonical.id,
      jiraIssueKey: canonical.key,
      title: canonical.summary,
      description: canonical.description,
      status: canonical.status,
      priority: canonical.priority,
      labels: JSON.stringify(canonical.labels),
      sourcePayload: JSON.stringify(sourcePayload || canonical)
    }
  });

  // 4. Check or create AgentJob with idempotency key
  let job = await db.agentJob.findUnique({
    where: { idempotencyKey }
  });

  if (!job) {
    job = await db.agentJob.create({
      data: {
        projectId,
        bugId: bug.id,
        status: JobStatus.QUEUED,
        idempotencyKey,
        startedAt: new Date()
      }
    });

    await jiraClient.transitionStatus(issueKey, 'AI Investigation');
    await jiraClient.addComment(
      issueKey,
      `FixPilot received this issue and queued autonomous investigation (Job ID: ${job.id}).`
    );
  }

  return job;
}

