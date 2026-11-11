import { defaultWorkflowQueue } from './queue.js';
import { orchestrator } from './orchestrator.js';
import { logger } from '@fixpilot/observability';

export * from './queue.js';
export * from './jira-worker.js';
export * from './investigation-worker.js';
export * from './agent-worker.js';
export * from './qa-worker.js';
export * from './review-worker.js';
export * from './github-worker.js';
export * from './deployment-worker.js';
export * from './orchestrator.js';

export function startWorker() {
  logger.info('FixPilot background workers initialized and listening for jobs...');

  defaultWorkflowQueue.process(async (data) => {
    logger.info(`Worker picked up job ${data.jobId} [stage: ${data.stage}]`);
    if (data.stage === 'RUN_WORKFLOW') {
      await orchestrator.runEndToEndJob(data.jobId);
    }
  });
}

// If run directly
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  startWorker();
}

