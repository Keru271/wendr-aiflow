import { db } from '@fixpilot/database';
import { logger } from '@fixpilot/observability';
import { JobStatus } from '@fixpilot/shared';
import { processInvestigation } from './investigation-worker.js';
import { processCodingTask } from './agent-worker.js';
import { processQAChecks } from './qa-worker.js';
import { processReviewStage } from './review-worker.js';
import { processPullRequestCreation } from './github-worker.js';
import { processStagingDeployment, processProductionDeployment } from './deployment-worker.js';

export class WorkflowOrchestrator {
  async runEndToEndJob(jobId: string, autoDeployStaging = true) {
    await logger.info(`Starting Orchestrator execution for Job ${jobId}`, {
      jobId,
      stage: 'ORCHESTRATOR'
    });

    const job = await db.agentJob.findUnique({
      where: { id: jobId },
      include: { bug: true, project: true }
    });

    if (!job) throw new Error(`Job ${jobId} not found`);

    // 1. INVESTIGATION STAGE
    const investigation = await processInvestigation(jobId);

    // 2. RISK & POLICY CHECK
    if (investigation.risk === 'critical' || investigation.needsHumanInput) {
      await db.agentJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.HUMAN_REVIEW,
          failureReason: 'High risk or sensitive area (auth/payment/db) detected during investigation.'
        }
      });
      await logger.warn(`Job ${jobId} escalated to HUMAN_REVIEW due to risk policy`, {
        jobId,
        stage: 'RISK_POLICY'
      });
      return { status: JobStatus.HUMAN_REVIEW };
    }

    await db.agentJob.update({
      where: { id: jobId },
      data: { status: JobStatus.READY_TO_FIX }
    });

    // 3. CODING STAGE & BOUNDED QA RETRY LOOP
    let attempt = 1;
    const maxRetries = job.maxRetries || 3;
    let codingResult: any = null;
    let qaResult: any = null;
    let qaFeedback: string | undefined = undefined;

    while (attempt <= maxRetries) {
      codingResult = await processCodingTask({
        jobId,
        attempt,
        qaFeedback
      });

      // 4. QA STAGE
      qaResult = await processQAChecks({
        jobId,
        workspaceDir: codingResult.workspace.directory,
        attempt
      });

      if (qaResult.passed) {
        break;
      }

      // If failed and retries left, prepare feedback for next attempt
      attempt++;
      await db.agentJob.update({
        where: { id: jobId },
        data: { retryCount: attempt - 1 }
      });
      qaFeedback = qaResult.failureSummary || 'Unit tests failed on coupon response parsing';
      await logger.warn(`QA failed for attempt ${attempt - 1}. Retrying with feedback...`, {
        jobId,
        stage: 'RETRY'
      });
    }

    if (!qaResult?.passed) {
      await db.agentJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.HUMAN_REVIEW,
          failureReason: 'QA checks failed after maximum automated retry limit.'
        }
      });
      return { status: JobStatus.HUMAN_REVIEW };
    }

    // 5. REVIEW STAGE
    const review = await processReviewStage({
      jobId,
      diff: codingResult.diff,
      changedFiles: codingResult.changedFiles
    });

    if (!review.approved) {
      await db.agentJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.HUMAN_REVIEW,
          failureReason: 'Autonomous reviewer identified potential policy concerns in the diff.'
        }
      });
      return { status: JobStatus.HUMAN_REVIEW };
    }

    // 6. GITHUB PR CREATION
    const pr = await processPullRequestCreation({
      jobId,
      branchName: codingResult.branchName,
      commitSha: codingResult.commitSha,
      changedFiles: codingResult.changedFiles
    });

    // Cleanup workspace files now that changes are committed and pushed
    await codingResult.workspace.cleanup();

    // 7. STAGING DEPLOYMENT (Simulates post-merge CI event)
    if (autoDeployStaging) {
      await processStagingDeployment({
        jobId,
        commitSha: codingResult.commitSha
      });
    }

    return {
      status: autoDeployStaging ? JobStatus.AWAITING_PRODUCTION_APPROVAL : JobStatus.PR_CREATED,
      prNumber: pr.number,
      prUrl: pr.url
    };
  }
}

export const orchestrator = new WorkflowOrchestrator();

