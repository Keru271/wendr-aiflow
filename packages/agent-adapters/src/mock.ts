import { AgentTaskInput, AgentTaskResult } from '@fixpilot/schemas';
import { CodingAgentAdapter } from './types.js';

export class MockAgentAdapter implements CodingAgentAdapter {
  readonly providerName = 'MOCK_ADAPTER';
  private tasks: Map<string, AgentTaskResult> = new Map();

  async startTask(input: AgentTaskInput): Promise<{ providerTaskId: string }> {
    const providerTaskId = `mock-task-${Date.now()}`;
    this.tasks.set(providerTaskId, {
      providerTaskId,
      status: 'completed',
      summary: 'Simulated bugfix applied cleanly with high confidence.',
      changedFiles: ['src/checkout/coupon.ts'],
      tokensUsed: 650
    });
    return { providerTaskId };
  }

  async getStatus(providerTaskId: string): Promise<AgentTaskResult> {
    return (
      this.tasks.get(providerTaskId) || {
        providerTaskId,
        status: 'failed',
        error: 'Task not found'
      }
    );
  }

  async cancel(providerTaskId: string): Promise<void> {
    const task = this.tasks.get(providerTaskId);
    if (task) task.status = 'cancelled';
  }
}

