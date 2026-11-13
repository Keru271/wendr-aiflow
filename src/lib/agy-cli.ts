import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import simpleGit from 'simple-git';
import { logger } from './observability';

const execAsync = promisify(exec);

export interface AgyTaskInput {
  jobId: string;
  issueKey: string;
  title: string;
  description: string;
  workingDirectory: string;
  repositoryName: string;
  conventions?: string;
  attachments?: Array<{ filename?: string; mimeType: string; data?: string; base64Data?: string; url?: string }>;
  timeoutSeconds?: number;
}

export interface AgyTaskOutput {
  conversationId: string;
  status: 'SUCCESS' | 'FAILED';
  summary: string;
  changedFiles: string[];
  diff: string;
  durationSeconds: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface AgyRemoteControlStatus {
  available: boolean;
  cliPath: string | null;
  version?: string;
  daemonStatus: string;
  instanceName?: string;
  rawOutput: string;
}

export class AntigravityCliService {
  private cachedCliPath: string | null = null;

  /**
   * Resolve the path to the agy / agy.exe CLI binary on the host machine
   */
  resolveCliPath(): string | null {
    if (this.cachedCliPath && fs.existsSync(this.cachedCliPath)) {
      return this.cachedCliPath;
    }

    if (process.env.ANTIGRAVITY_CLI_PATH && fs.existsSync(process.env.ANTIGRAVITY_CLI_PATH)) {
      this.cachedCliPath = process.env.ANTIGRAVITY_CLI_PATH;
      return this.cachedCliPath;
    }

    const homeDir = os.homedir();
    const isWindows = process.platform === 'win32';
    const binaryName = isWindows ? 'agy.exe' : 'agy';

    const candidatePaths = [
      path.join(homeDir, '.gemini', 'bin', binaryName),
      'C:\\Users\\Nikhil\\.gemini\\bin\\agy.exe',
      path.join(homeDir, '.antigravity', 'bin', binaryName),
      path.join(homeDir, 'bin', binaryName),
      '/usr/local/bin/agy',
      '/usr/bin/agy',
      '/opt/antigravity/bin/agy'
    ];

    for (const cand of candidatePaths) {
      if (fs.existsSync(cand)) {
        this.cachedCliPath = cand;
        return cand;
      }
    }

    return null;
  }

  /**
   * Check if agy CLI is installed and executable
   */
  async isAvailable(): Promise<boolean> {
    const cliPath = this.resolveCliPath();
    if (!cliPath) return false;

    return new Promise((resolve) => {
      execFile(cliPath, ['--help'], { timeout: 10000 }, (error, stdout) => {
        if (!error && (stdout.includes('Usage of agy') || stdout.includes('remote-control') || stdout.includes('Usage: agy'))) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  /**
   * Get version information of agy CLI
   */
  async getVersion(): Promise<string | null> {
    const cliPath = this.resolveCliPath();
    if (!cliPath) return null;

    // Check version json file next to binary
    const versionFile = path.join(path.dirname(cliPath), 'agy.version.json');
    if (fs.existsSync(versionFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
        if (data.version) return data.version;
      } catch {}
    }

    return 'Antigravity CLI v2.0';
  }

  /**
   * Query agy remote-control status
   */
  async getRemoteControlStatus(): Promise<AgyRemoteControlStatus> {
    const cliPath = this.resolveCliPath();
    if (!cliPath) {
      return {
        available: false,
        cliPath: null,
        daemonStatus: 'CLI not found on host',
        rawOutput: 'The Antigravity CLI (agy) is not installed on this machine.'
      };
    }

    const version = (await this.getVersion()) || undefined;

    return new Promise((resolve) => {
      execFile(cliPath, ['remote-control', 'status'], { timeout: 15000 }, (error, stdout, stderr) => {
        const output = (stdout || stderr || '').trim();
        let daemonStatus = 'unknown';
        let instanceName: string | undefined;

        if (output.includes('not registered')) {
          daemonStatus = 'not_registered';
        } else if (output.includes('running') || output.includes('active')) {
          daemonStatus = 'running';
        } else if (output.includes('stopped')) {
          daemonStatus = 'stopped';
        }

        const nameMatch = output.match(/Instance name:\s*([^\r\n]+)/i);
        if (nameMatch && !nameMatch[1].includes('not assigned')) {
          instanceName = nameMatch[1].trim();
        }

        resolve({
          available: true,
          cliPath,
          version,
          daemonStatus,
          instanceName,
          rawOutput: output
        });
      });
    });
  }

  /**
   * Start agy remote-control daemon
   */
  async startRemoteControl(instanceName?: string): Promise<{ success: boolean; output: string }> {
    const cliPath = this.resolveCliPath();
    if (!cliPath) {
      throw new Error('Antigravity CLI (agy) is not installed on this host.');
    }

    const args = ['remote-control', 'start'];
    if (instanceName) {
      args.push('--name', instanceName);
    }

    return new Promise((resolve, reject) => {
      execFile(cliPath, args, { timeout: 30000 }, (error, stdout, stderr) => {
        const out = stdout || stderr || '';
        if (error) {
          reject(new Error(`Failed to start remote-control daemon: ${error.message}\n${out}`));
        } else {
          resolve({ success: true, output: out });
        }
      });
    });
  }

  /**
   * Stop agy remote-control daemon
   */
  async stopRemoteControl(): Promise<{ success: boolean; output: string }> {
    const cliPath = this.resolveCliPath();
    if (!cliPath) {
      throw new Error('Antigravity CLI (agy) is not installed on this host.');
    }

    return new Promise((resolve, reject) => {
      execFile(cliPath, ['remote-control', 'stop'], { timeout: 15000 }, (error, stdout, stderr) => {
        const out = stdout || stderr || '';
        if (error) {
          reject(new Error(`Failed to stop remote-control daemon: ${error.message}\n${out}`));
        } else {
          resolve({ success: true, output: out });
        }
      });
    });
  }

  /**
   * Build the prompt for headless agy CLI execution
   */
  private buildPrompt(input: AgyTaskInput): string {
    const sections: string[] = [];

    sections.push(`# TASK: Fix Bug ${input.issueKey} in ${input.repositoryName}`);
    sections.push(`**Title:** ${input.title}`);
    if (input.description && input.description.trim().length > 0) {
      sections.push(`\n**Description & Reproduction Context:**\n${input.description.trim()}`);
    }

    if (input.attachments && input.attachments.length > 0) {
      sections.push(`\n**Visual Reference Attachments:**`);
      for (const a of input.attachments) {
        sections.push(`- Attachment: ${a.filename || 'reference_image'} (${a.mimeType})`);
      }
    }

    if (input.conventions) {
      sections.push(`\n**Repository Conventions (AGENTS.md):**\n${input.conventions}`);
    }

    sections.push(`\n**Autonomous Execution Guardrails:**`);
    sections.push(`1. Inspect the codebase in the current working directory to locate the exact cause of ${input.issueKey}.`);
    sections.push(`2. Make targeted, high-precision edits directly to the relevant file(s).`);
    sections.push(`3. Keep diffs minimal and preserve existing formatting and style.`);
    sections.push(`4. Do NOT modify unrelated files or delete existing functionality.`);
    sections.push(`5. If tests exist for the affected component, update or add a regression test to verify the fix.`);
    sections.push(`6. When done, provide a clear explanation summarizing the root cause, what was changed, and why.`);

    return sections.join('\n');
  }

  /**
   * Execute an autonomous bug fix task using the Antigravity CLI (`agy`) in headless print mode
   */
  async runAgyTask(input: AgyTaskInput): Promise<AgyTaskOutput> {
    const cliPath = this.resolveCliPath();
    if (!cliPath) {
      throw new Error('Antigravity CLI (agy) not found on host.');
    }

    const workDir = input.workingDirectory;
    const prompt = this.buildPrompt(input);
    const timeoutMs = (input.timeoutSeconds || 300) * 1000;

    await logger.info(
      `[AGY_CLI] Spawning Antigravity CLI (${path.basename(cliPath)}) in headless mode inside ${workDir}`,
      { jobId: input.jobId, stage: 'CODING_AGENT' }
    );

    // Baseline git status before running agy
    let baselineFiles: Set<string> = new Set();
    try {
      const git = simpleGit(workDir);
      const status = await git.status();
      status.files.forEach((f) => baselineFiles.add(f.path));
    } catch {}

    const args = [
      '-p', prompt,
      '--dangerously-skip-permissions',
      '--output-format', 'json',
      '--mode', 'auto'
    ];

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      execFile(
        cliPath,
        args,
        {
          cwd: workDir,
          timeout: timeoutMs,
          maxBuffer: 50 * 1024 * 1024,
          env: {
            ...process.env,
            // Ensure child process operates cleanly in UTF-8
            PYTHONIOENCODING: 'utf-8'
          }
        },
        async (error, stdout, stderr) => {
          const durationSeconds = (Date.now() - startTime) / 1000;

          if (error && error.killed) {
            return reject(new Error(`Antigravity CLI timed out after ${input.timeoutSeconds || 300}s`));
          }

          let responseText = stdout || '';
          let parsedJson: any = null;

          // Attempt to parse JSON response from agy --output-format json
          try {
            // Locate JSON object in stdout (in case of preceding warnings)
            const jsonStart = responseText.indexOf('{');
            const jsonEnd = responseText.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const rawJson = responseText.slice(jsonStart, jsonEnd + 1);
              parsedJson = JSON.parse(rawJson);
            }
          } catch {}

          const conversationId = parsedJson?.conversation_id || `agy_${Date.now()}`;
          const summary = parsedJson?.response || responseText.slice(0, 500) || `Fix applied autonomously by Antigravity CLI for ${input.issueKey}`;
          const usage = parsedJson?.usage ? {
            inputTokens: parsedJson.usage.input_tokens,
            outputTokens: parsedJson.usage.output_tokens,
            totalTokens: parsedJson.usage.total_tokens
          } : undefined;

          // Detect changed files via git status
          let changedFiles: string[] = [];
          let diff = '';
          try {
            const git = simpleGit(workDir);
            const currentStatus = await git.status();
            changedFiles = currentStatus.files.map((f) => f.path);
            diff = await git.diff();
          } catch (gitErr: any) {
            await logger.warn(`[AGY_CLI] Git diff detection warning: ${gitErr.message}`, {
              jobId: input.jobId
            });
          }

          await logger.info(
            `[AGY_CLI] Headless session completed (${durationSeconds.toFixed(1)}s, convId: ${conversationId}). ${changedFiles.length} file(s) modified.`,
            { jobId: input.jobId, stage: 'CODING_AGENT' }
          );

          resolve({
            conversationId,
            status: error ? 'FAILED' : 'SUCCESS',
            summary,
            changedFiles,
            diff,
            durationSeconds,
            usage
          });
        }
      );
    });
  }
}

export const agyCli = new AntigravityCliService();

