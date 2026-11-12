import { AgentTaskInput, AgentTaskResult } from '../schemas';

export interface AgentTaskStatus {
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  message?: string;
}

export interface CodingAgentAdapter {
  name: string;
  runTask(input: AgentTaskInput): Promise<AgentTaskResult>;
  cancelTask?(taskId: string): Promise<void>;
  getStatus?(taskId: string): Promise<AgentTaskStatus>;
}
