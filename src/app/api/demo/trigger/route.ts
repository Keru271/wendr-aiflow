import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { JobStatus } from '@/lib/types';
import { orchestrator } from '@/lib/orchestrator';

export async function POST() {
  try {
    // 1. Ensure Org exists
    let org = await db.organization.findFirst();
    if (!org) {
      org = await db.organization.create({
        data: {
          name: 'Acme Global FinTech',
          slug: 'acme-fintech',
          plan: 'enterprise_pilot'
        }
      });
    }

    // 2. Ensure Project exists
    let project = await db.project.findFirst({
      where: { key: 'WEB' }
    });
    if (!project) {
      project = await db.project.create({
        data: {
          organizationId: org.id,
          name: 'Web & Payment Checkout Service',
          key: 'WEB',
          description: 'Core microservice for handling customer card and 3D-secure transactions.'
        }
      });
    }

    // 3. Ensure Repository exists
    let repo = await db.repository.findFirst({
      where: { projectId: project.id }
    });
    if (!repo) {
      repo = await db.repository.create({
        data: {
          projectId: project.id,
          githubRepoId: 'repo_acme_core',
          owner: 'acme-fintech',
          name: 'payment-service',
          defaultBranch: 'main',
          cloneUrl: 'https://github.com/acme-fintech/payment-service.git'
        }
      });
    }

    // 4. Upsert Bug WEB-1024
    let bug = await db.bug.findFirst({
      where: { projectId: project.id, jiraIssueKey: 'WEB-1024' }
    });
    if (!bug) {
      bug = await db.bug.create({
        data: {
          projectId: project.id,
          jiraIssueId: 'jira_web_1024',
          jiraIssueKey: 'WEB-1024',
          title: 'Payment checkout fails with timeout race condition on 3DS callback',
          description: 'Users on 3DS verification report intermittent 504 timeouts. The payment processor drops connection after 3s before bank webhook completes. Missing idempotency causes duplicate charges when retried.',
          status: 'Open',
          priority: 'High',
          labels: JSON.stringify(['ai-fix-opt-in', 'bug', 'payments', 'critical-path'])
        }
      });
    }

    // 5. Create new Job
    const job = await db.agentJob.create({
      data: {
        projectId: project.id,
        bugId: bug.id,
        status: JobStatus.QUEUED,
        idempotencyKey: `demo_job_WEB-1024_${Date.now()}`
      }
    });

    // Run orchestrator synchronously up to Awaiting Production Approval so caller gets full result
    await orchestrator.runJob(job.id);

    // Fetch refreshed job with all relations
    const finalJob = await db.agentJob.findUnique({
      where: { id: job.id },
      include: {
        bug: true,
        project: true,
        executions: true,
        validations: true,
        pullRequests: {
          include: { repository: true }
        },
        deployments: true,
        logs: { take: 50, orderBy: { createdAt: 'desc' } }
      }
    });

    return NextResponse.json({
      message: 'Autonomous bug resolution completed up to Human Production Approval Gate!',
      job: finalJob
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
