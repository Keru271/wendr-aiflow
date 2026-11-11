import { db } from '@fixpilot/database';
import { AgentWorkspaceManager, getAgentAdapter } from '@fixpilot/agent-adapters';
import { logger, recordUsage } from '@fixpilot/observability';
import { JobStatus, AgentType } from '@fixpilot/shared';
import { jiraClient } from '@fixpilot/jira-client';

export async function processCodingTask(params: {
  jobId: string;
  attempt?: number;
  qaFeedback?: string;
}) {
  const { jobId, attempt = 1, qaFeedback } = params;

  const job = await db.agentJob.findUnique({
    where: { id: jobId },
    include: { bug: true, project: true }
  });

  if (!job) throw new Error(`Job ${jobId} not found`);

  await logger.info(`Starting coding task attempt #${attempt} for job ${jobId}`, {
    jobId,
    stage: 'CODING',
    attempt
  });

  await db.agentJob.update({
    where: { id: jobId },
    data: { status: JobStatus.CODING }
  });

  await jiraClient.transitionStatus(job.bug.jiraIssueKey, 'AI Development');

  const branchName = `ai-fix/${job.bug.jiraIssueKey.toLowerCase()}-invalid-coupon`;
  const workspaceManager = new AgentWorkspaceManager(process.env.WORKSPACE_BASE_DIR || './workspaces');

  // Allocate isolated disposable workspace
  const workspace = await workspaceManager.createWorkspace({
    jobId,
    baseDir: './workspaces',
    branchName
  });

  // Track workspace in DB
  const wsRecord = await db.agentWorkspace.create({
    data: {
      jobId,
      directoryPath: workspace.directory,
      branchName,
      status: 'ACTIVE'
    }
  });

  // Prepare bounded prompt for Antigravity coding agent
  const prompt = `You are the FixPilot Antigravity Coding Agent.
Task: Fix bug ${job.bug.jiraIssueKey}: ${job.bug.title}
Acceptance Criteria:
- Handle expired coupon code in checkout
- Preserve cart state
${qaFeedback ? `\nPREVIOUS QA FAILURE FEEDBACK (Please resolve this):\n${qaFeedback}` : ''}
Rule: Make the smallest safe change that resolves the issue.`;

  const adapter = getAgentAdapter('GOOGLE_ANTIGRAVITY');
  const taskResult = await adapter.startTask({
    jobId,
    repositoryUrl: 'https://github.com/acme-corp/ecommerce-frontend.git',
    baseBranch: 'main',
    workingDirectory: workspace.directory,
    prompt,
    timeoutSeconds: 300,
    maxTotalTokens: 16000
  });

  const finalStatus = await adapter.getStatus(taskResult.providerTaskId);

  // Capture git diff
  const diff = await workspace.getDiff();
  const changedFiles = await workspace.getChangedFiles();

  // Commit changes to feature branch
  const commitSha = await workspace.commitChanges(`fix(checkout): handle invalid coupon response`);

  // Persist execution
  await db.agentExecution.create({
    data: {
      jobId,
      agentType: AgentType.DEVELOPER,
      provider: adapter.providerName,
      providerTaskId: taskResult.providerTaskId,
      attempt,
      status: finalStatus.status,
      inputSummary: prompt.substring(0, 300),
      outputSummary: JSON.stringify({
        changedFiles,
        diffPreview: diff.substring(0, 500),
        commitSha
      }),
      usage: JSON.stringify({ tokensUsed: finalStatus.tokensUsed || 1420 }),
      completedAt: new Date()
    }
  });

  await recordUsage({
    organizationId: job.project.organizationId,
    jobId,
    provider: adapter.providerName,
    inputTokens: 2400,
    outputTokens: 980,
    executionMs: 3400
  });

  await logger.info(`Coding attempt #${attempt} complete. Commit SHA: ${commitSha}`, {
    jobId,
    stage: 'CODING',
    changedFiles
  });

  return {
    workspace,
    wsRecordId: wsRecord.id,
    branchName,
    commitSha,
    diff,
    changedFiles
  };
}

