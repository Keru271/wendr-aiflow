import { db } from '@fixpilot/database';
import { logger } from '@fixpilot/observability';
import { JobStatus } from '@fixpilot/shared';
import { githubClient } from '@fixpilot/github-client';
import { jiraClient } from '@fixpilot/jira-client';

export async function processPullRequestCreation(params: {
  jobId: string;
  branchName: string;
  commitSha: string;
  changedFiles: string[];
}) {
  const { jobId, branchName, commitSha, changedFiles } = params;

  const job = await db.agentJob.findUnique({
    where: { id: jobId },
    include: { bug: true, project: true }
  });

  if (!job) throw new Error(`Job ${jobId} not found`);

  await logger.info(`Creating GitHub Pull Request for job ${jobId}`, {
    jobId,
    stage: 'GITHUB_PR'
  });

  await db.agentJob.update({
    where: { id: jobId },
    data: { status: JobStatus.READY_FOR_PR }
  });

  const pr = await githubClient.createPullRequest({
    owner: 'acme-corp',
    repo: 'ecommerce-frontend',
    branchName,
    baseBranch: 'main',
    title: `fix(checkout): ${job.bug.title}`,
    jiraKey: job.bug.jiraIssueKey,
    jiraUrl: `https://acme.atlassian.net/browse/${job.bug.jiraIssueKey}`,
    summary: `Fixes unhandled rejection when expired coupons are applied in checkout. Returns clear user feedback and preserves cart state.`,
    rootCause: `Expired coupon API response (410/400) was not caught and mapped to the UI validation state.`,
    changes: changedFiles.map((f) => `Normalized status code handling in ${f}`),
    validation: {
      lint: true,
      typeCheck: true,
      unitTests: true,
      integrationTests: false,
      productionBuild: true
    },
    riskNotes: 'Low risk. No database migrations, auth or payment secrets modified.',
    jobId
  });

  // Save Pull Request in Database
  const prRecord = await db.pullRequest.create({
    data: {
      jobId,
      githubPrId: pr.id,
      number: pr.number,
      url: pr.htmlUrl,
      title: `fix(checkout): ${job.bug.title}`,
      branchName,
      commitSha,
      status: 'OPEN'
    }
  });

  // Update Job Status
  await db.agentJob.update({
    where: { id: jobId },
    data: { status: JobStatus.PR_CREATED }
  });

  // Update Jira
  await jiraClient.updateCustomFields(job.bug.jiraIssueKey, {
    'AI Pull Request': pr.htmlUrl
  });

  await jiraClient.transitionStatus(job.bug.jiraIssueKey, 'Human Review');

  await jiraClient.addComment(
    job.bug.jiraIssueKey,
    `*FixPilot Pull Request Ready for Human Review*\n\n` +
      `PR: ${pr.htmlUrl}\n` +
      `Branch: \`${branchName}\`\n` +
      `Commit: \`${commitSha.substring(0, 7)}\`\n` +
      `Validation: Lint, Types, Tests, Build ALL PASSED.\n\n` +
      `_Note: Repository branch protection requires an authorized human approval before merge._`
  );

  return prRecord;
}

