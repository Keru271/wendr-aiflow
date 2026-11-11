import { EventEmitter } from 'events';
import { Queue, Worker, Job } from 'bullmq';
import { logger } from '@fixpilot/observability';

export interface WorkflowJobData {
  jobId: string;
  stage: string;
  payload?: any;
}

export interface JobQueue {
  add(name: string, data: WorkflowJobData): Promise<void>;
  process(handler: (data: WorkflowJobData) => Promise<void>): void;
}

// Memory fallback queue for zero-dependency local dev and testing
class MemoryJobQueue extends EventEmitter implements JobQueue {
  private processing = false;
  private queue: Array<{ name: string; data: WorkflowJobData }> = [];
  private handler?: (data: WorkflowJobData) => Promise<void>;

  async add(name: string, data: WorkflowJobData): Promise<void> {
    this.queue.push({ name, data });
    setImmediate(() => this.runNext());
  }

  process(handler: (data: WorkflowJobData) => Promise<void>): void {
    this.handler = handler;
    setImmediate(() => this.runNext());
  }

  private async runNext() {
    if (this.processing || !this.handler || this.queue.length === 0) return;
    this.processing = true;
    const item = this.queue.shift();
    if (item) {
      try {
        await this.handler(item.data);
      } catch (err) {
        await logger.error(`Error processing job ${item.data.jobId} in memory queue`, err);
      }
    }
    this.processing = false;
    if (this.queue.length > 0) {
      setImmediate(() => this.runNext());
    }
  }
}

export function createJobQueue(queueName: string = 'fixpilot-workflows'): JobQueue {
  const redisUrl = process.env.REDIS_URL;

  // If redis URL is configured and redis is available, create BullMQ queue
  if (redisUrl && !process.env.USE_MEMORY_QUEUE) {
    try {
      const connection = { url: redisUrl, lazyConnect: true, maxRetriesPerRequest: 1 };
      const bullQueue = new Queue<WorkflowJobData>(queueName, { connection: connection as any });

      return {
        async add(name: string, data: WorkflowJobData) {
          try {
            await bullQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
          } catch {
            await memoryQueue.add(name, data);
          }
        },
        process(handler: (data: WorkflowJobData) => Promise<void>) {
          try {
            new Worker<WorkflowJobData>(
              queueName,
              async (job: Job<WorkflowJobData>) => {
                await handler(job.data);
              },
              { connection: connection as any }
            );
          } catch {
            memoryQueue.process(handler);
          }
        }
      };
    } catch {
      // fallback
    }
  }

  const memoryQueue = new MemoryJobQueue();
  return memoryQueue;
}

export const defaultWorkflowQueue = createJobQueue('fixpilot-orchestrator');

