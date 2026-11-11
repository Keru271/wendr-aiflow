import { AgentTaskInput, AgentTaskResult } from '@fixpilot/schemas';

export interface CodingAgentAdapter {
  readonly providerName: string;
  startTask(input: AgentTaskInput): Promise<{ providerTaskId: string }>;
  getStatus(providerTaskId: string): Promise<AgentTaskResult>;
  cancel(providerTaskId: string): Promise<void>;
}

export interface WorkspaceConfig {
  jobId: string;
  baseDir: string;
  branchName: string;
  repoUrl?: string;
  defaultBranch?: string;
}

export interface WorkspaceInstance {
  id: string;
  jobId: string;
  directory: string;
  branchName: string;
  cleanup: () => Promise<void>;
  getDiff: () => Promise<string>;
  getChangedFiles: () => Promise<string[]>;
  commitChanges: (message: string) => Promise<string>;
}

