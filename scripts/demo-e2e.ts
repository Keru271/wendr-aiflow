import db from '../src/lib/db';
import { JobStatus, UserRole } from '../src/lib/types';
import { orchestrator } from '../src/lib/orchestrator';

async function runDemo() {
  console.log('===============================================================');
  console.log('🤖 FixPilot Autonomous Bug-Fixing End-to-End Simulation');
  console.log('===============================================================\n');

  // Find project & bug
  const project = await db.project.findFirst({
    where: { key: 'WEB' },
    include: { repositories: true }
  });

  if (!project) {
    throw new Error('Project WEB not found. Run "npm run seed" first.');
  }

  const bug = await db.bug.findFirst({
    where: { projectId: project.id, jiraIssueKey: 'WEB-1024' }
  });

  if (!bug) {
    throw new Error('Bug WEB-1024 not found. Run "npm run seed" first.');
  }

  console.log(`[Step 1] Ingested Jira Bug: [${bug.jiraIssueKey}] ${bug.title}`);
  console.log(`         Labels: ${bug.labels}`);
  console.log(`         Target Repository: ${project.repositories[0]?.owner}/${project.repositories[0]?.name}\n`);

  // Create Job
  const job = await db.agentJob.create({
    data: {
      projectId: project.id,
      bugId: bug.id,
      status: JobStatus.QUEUED,
      idempotencyKey: `cli_demo_${Date.now()}`
    }
  });

  console.log(`[Step 2] Queued Fix Job: ${job.id}`);
  console.log('         Triggering Orchestrator pipeline...\n');

  // Run autonomous stages up to Human Approval Gate
  await orchestrator.runJob(job.id);

  // Check state
  const jobAtGate = await db.agentJob.findUnique({
    where: { id: job.id },
    include: {
      validations: true,
      pullRequests: {
        include: { repository: true }
      },
      deployments: true
    }
  });

  const firstPr = jobAtGate?.pullRequests?.[0];

  console.log('\n---------------------------------------------------------------');
  console.log(`[Step 3] Reached State: ${jobAtGate?.status}`);
  console.log(`         GitHub Pull Requests (${jobAtGate?.pullRequests?.length || 0}):`);
  jobAtGate?.pullRequests?.forEach((pr, i) => {
    console.log(`           [PR #${pr.number} | ${pr.repository?.name || 'repo'}] ${pr.url} (${pr.branchName})`);
  });
  console.log('         Automated QA Results:');
  jobAtGate?.validations.forEach((v) => {
    console.log(`           • [${v.status}] ${v.name} (${v.command}) -> ${v.durationMs}ms`);
  });
  console.log('---------------------------------------------------------------\n');

  if (jobAtGate?.status === JobStatus.AWAITING_PRODUCTION_APPROVAL) {
    console.log('🔒 [Step 4] Human Production Approval Gate Enforced!');
    console.log('           Principle #1: AI agent halted. Production release requires');
    console.log('           explicit sign-off from authorized Approver or Admin.\n');

    console.log('👤 [Step 5] Simulating Human Sign-Off from Sarah Chen (APPROVER)...');
    await orchestrator.approveProduction(job.id, {
      userId: 'user_sarah_chen',
      email: 'lead.approver@fixpilot.ai',
      organizationId: project.organizationId,
      role: UserRole.APPROVER
    }, 'Signed off in FixPilot CLI demonstration.');

    const completedJob = await db.agentJob.findUnique({
      where: { id: job.id },
      include: { deployments: true }
    });

    console.log(`\n🎉 [Step 6] Final Job Status: ${completedJob?.status}`);
    console.log('           Deployments Record:');
    completedJob?.deployments.forEach((d) => {
      console.log(`             - Environment: ${d.environment.toUpperCase()} | Status: ${d.status} | Approved By: ${d.approvedBy || 'N/A'}`);
    });
    console.log('\n===============================================================');
    console.log('✅ FixPilot Autonomous Bug-Fixing Demo Completed Successfully!');
    console.log('===============================================================');
  }
}

runDemo()
  .catch((e) => {
    console.error('Demo error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
