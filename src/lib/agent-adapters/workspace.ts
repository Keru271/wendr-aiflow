import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit, { SimpleGit } from 'simple-git';
import { logger } from '../observability';

export interface WorkspaceConfig {
  jobId: string;
  jiraKey: string;
  repoCloneUrl?: string;
  baseBranch?: string;
}

export class WorkspaceManager {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), '.workspaces');
    if (!fs.existsSync(this.baseDir)) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch (err) {
        this.baseDir = path.join(os.tmpdir(), 'fixpilot-workspaces');
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    }
  }

  getWorkspacePath(jobId: string): string {
    return path.join(this.baseDir, jobId);
  }

  async createWorkspace(config: WorkspaceConfig): Promise<{
    directoryPath: string;
    branchName: string;
    git: SimpleGit;
  }> {
    const dir = this.getWorkspacePath(config.jobId);
    const branchName = `fixpilot/${config.jiraKey.toLowerCase()}-automated-fix`;

    if (fs.existsSync(dir)) {
      await this.destroyWorkspace(config.jobId);
    }
    fs.mkdirSync(dir, { recursive: true });

    const git = simpleGit(dir);

    // Initialize repo or clone
    await git.init();
    await git.addConfig('user.name', 'FixPilot Autonomous Agent');
    await git.addConfig('user.email', 'agent@fixpilot.ai');

    // Create a base file if empty
    const readmePath = path.join(dir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(readmePath, `# Repository Workspace for ${config.jiraKey}\n\nManaged by FixPilot.\n`);
      await git.add('.');
      await git.commit('Initial base commit');
    }

    // Checkout feature branch
    await git.checkoutLocalBranch(branchName);

    await logger.info(`Created isolated workspace at ${dir} on branch ${branchName}`, {
      jobId: config.jobId,
      stage: 'WORKSPACE'
    });

    return { directoryPath: dir, branchName, git };
  }

  async getDiff(jobId: string): Promise<string> {
    const dir = this.getWorkspacePath(jobId);
    if (!fs.existsSync(dir)) return '';
    const git = simpleGit(dir);
    try {
      return await git.diff();
    } catch {
      return '';
    }
  }

  async commitChanges(jobId: string, message: string): Promise<string> {
    const dir = this.getWorkspacePath(jobId);
    const git = simpleGit(dir);
    await git.add('.');
    const commit = await git.commit(message);
    return commit.commit;
  }

  async destroyWorkspace(jobId: string): Promise<void> {
    const dir = this.getWorkspacePath(jobId);
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        await logger.info(`Destroyed workspace for job ${jobId}`, { jobId, stage: 'WORKSPACE' });
      } catch (err) {
        await logger.warn(`Failed to cleanly destroy workspace ${dir}: ${err}`, { jobId, stage: 'WORKSPACE' });
      }
    }
  }
}

export const workspaceManager = new WorkspaceManager();
