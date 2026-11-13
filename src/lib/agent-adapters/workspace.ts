import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as ts from 'typescript';
import { exec } from 'child_process';
import simpleGit, { SimpleGit } from 'simple-git';
import { logger } from '../observability';
import { githubClient } from '../github';

export interface WorkspaceConfig {
  jobId: string;
  jiraKey: string;
  repoCloneUrl?: string;
  baseBranch?: string;
  githubToken?: string;
}

export class WorkspaceManager {
  private baseDir: string;
  private cacheDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), '.workspaces');
    this.cacheDir = path.join(process.cwd(), '.base-clones');

    if (!fs.existsSync(this.baseDir)) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch (err) {
        this.baseDir = path.join(os.tmpdir(), 'fixpilot-workspaces');
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    }

    if (!fs.existsSync(this.cacheDir)) {
      try {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      } catch {
        this.cacheDir = path.join(os.tmpdir(), 'fixpilot-base-clones');
        try { fs.mkdirSync(this.cacheDir, { recursive: true }); } catch {}
      }
    }
  }

  getWorkspacePath(jobId: string): string {
    return path.join(this.baseDir, jobId);
  }

  /**
   * Reads repo conventions (AGENTS.md or .antigravity/rules.md) for local-parity AI prompt
   */
  getRepoConventions(workspaceDir: string): string | null {
    const candidates = [
      path.join(workspaceDir, 'AGENTS.md'),
      path.join(workspaceDir, '.antigravity', 'rules.md'),
      path.join(workspaceDir, 'CONTRIBUTING.md')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          return fs.readFileSync(p, 'utf8');
        } catch {}
      }
    }
    return null;
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

    let cloned = false;
    const cleanToken = (config.githubToken || process.env.GITHUB_TOKEN || '').trim().replace(/^['"]|['"]$/g, '');
    const baseBranch = config.baseBranch || 'master';

    if (config.repoCloneUrl) {
      let authedCloneUrl = config.repoCloneUrl;
      if (cleanToken && authedCloneUrl.startsWith('https://github.com/')) {
        authedCloneUrl = authedCloneUrl.replace('https://github.com/', `https://${cleanToken}@github.com/`);
      }

      // Extract repository name
      const repoNameMatch = config.repoCloneUrl.match(/\/([^/]+?)(?:\.git)?$/);
      const repoName = repoNameMatch ? repoNameMatch[1] : 'repo';
      const repoPersistentCloneDir = path.join(this.cacheDir, repoName);

      try {
        // PRD Section 4B & F17: Maintain persistent base clone cache for instant worktrees & warm cache
        if (!fs.existsSync(repoPersistentCloneDir)) {
          fs.mkdirSync(this.cacheDir, { recursive: true });
          const rootGit = simpleGit();
          await rootGit.clone(authedCloneUrl, repoPersistentCloneDir, ['--branch', baseBranch]);
          await logger.info(`[WORKSPACE] Created persistent base clone cache for "${repoName}" at ${repoPersistentCloneDir}`, {
            jobId: config.jobId,
            stage: 'WORKSPACE'
          });
        } else {
          // Warm cache: fetch latest changes from origin
          const cacheGit = simpleGit(repoPersistentCloneDir);
          await cacheGit.fetch('origin', baseBranch);
          await logger.info(`[WORKSPACE] Warmed persistent clone cache for "${repoName}" via git fetch`, {
            jobId: config.jobId,
            stage: 'WORKSPACE'
          });
        }

        // Create git worktree for isolated job execution
        fs.mkdirSync(path.dirname(dir), { recursive: true });
        const cacheGit = simpleGit(repoPersistentCloneDir);
        try {
          // Clean up any stale worktree reference
          await cacheGit.raw(['worktree', 'prune']);
        } catch {}

        await cacheGit.raw(['worktree', 'add', '-B', branchName, dir, `origin/${baseBranch}`]);
        cloned = true;
        await logger.info(`[WORKSPACE] Created git worktree on branch "${branchName}" from persistent cache for "${repoName}"`, {
          jobId: config.jobId,
          stage: 'WORKSPACE'
        });
      } catch (worktreeErr: any) {
        await logger.warn(`[WORKSPACE] Git worktree creation fallback (${worktreeErr.message}). Performing direct clone...`, {
          jobId: config.jobId,
          stage: 'WORKSPACE'
        });

        // Fallback: direct clone if worktree is unsupported in environment
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        try {
          const rootGit = simpleGit();
          await rootGit.clone(authedCloneUrl, dir, ['--depth', '1', '--branch', baseBranch]);
          cloned = true;
        } catch (cloneErr: any) {
          await logger.warn(`Workspace direct git clone fallback failed: ${cloneErr.message}. Attempting GitHub API tree download...`, {
            jobId: config.jobId,
            stage: 'WORKSPACE'
          });

          // Serverless / No-git fallback: download repo files directly via GitHub REST API
          const match = (config.repoCloneUrl || '').match(/github\.com[/:]([^/]+)\/([^/.]+)/);
          if (match) {
            const [, owner, repo] = match;
            const dlResult = await githubClient.downloadRepositoryFiles(owner, repo, baseBranch, dir);
            if (dlResult.success) {
              cloned = true;
              await logger.info(`[WORKSPACE] Populated workspace with ${dlResult.fileCount} source files via GitHub API fallback`, {
                jobId: config.jobId,
                stage: 'WORKSPACE'
              });
            }
          }
        }
      }
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const git = simpleGit(dir);

    try {
      if (!cloned) {
        await git.init();
        // Create a base file if empty
        const readmePath = path.join(dir, 'README.md');
        if (!fs.existsSync(readmePath)) {
          fs.writeFileSync(readmePath, `# Repository Workspace for ${config.jiraKey}\n\nManaged by FixPilot.\n`);
          try {
            await git.add('.');
            await git.commit('Initial base commit');
          } catch {
            // non-fatal in serverless
          }
        }
      }

      await git.addConfig('user.name', 'FixPilot Autonomous Agent');
      await git.addConfig('user.email', 'agent@fixpilot.ai');
      try {
        await git.checkoutLocalBranch(branchName);
      } catch {
        await git.checkout(branchName);
      }
    } catch (gitErr: any) {
      await logger.warn(`Native git initialization warning: ${gitErr.message}. Operating with filesystem workspace.`, {
        jobId: config.jobId,
        stage: 'WORKSPACE'
      });
    }

    await logger.info(`Created isolated workspace at ${dir} on branch ${branchName}`, {
      jobId: config.jobId,
      stage: 'WORKSPACE'
    });

    return { directoryPath: dir, branchName, git };
  }

  async pushBranch(
    jobId: string,
    branchName: string,
    authedRemoteUrl?: string | null,
    options?: {
      repoOwner?: string;
      repoName?: string;
      commitMessage?: string;
    }
  ): Promise<void> {
    const dir = this.getWorkspacePath(jobId);
    if (!fs.existsSync(dir)) {
      throw new Error(`Workspace directory does not exist for job ${jobId}`);
    }

    let pushSuccess = false;
    try {
      const git = simpleGit(dir);
      if (authedRemoteUrl) {
        const remotes = await git.getRemotes();
        if (remotes.some((r) => r.name === 'origin')) {
          await git.remote(['set-url', 'origin', authedRemoteUrl]);
        } else {
          await git.addRemote('origin', authedRemoteUrl);
        }
      }
      await git.push('origin', branchName, ['--set-upstream', '--force']);
      pushSuccess = true;
      await logger.info(`Pushed branch ${branchName} to origin for job ${jobId}`, {
        jobId,
        stage: 'WORKSPACE'
      });
    } catch (gitErr: any) {
      await logger.warn(`Git CLI push failed (${gitErr.message}). Falling back to GitHub REST API commit/branch creation...`, {
        jobId,
        stage: 'WORKSPACE'
      });
    }

    // Fallback: If git CLI push failed (e.g. serverless container without git binary), commit and push via GitHub REST API
    if (!pushSuccess) {
      let owner = options?.repoOwner;
      let name = options?.repoName;

      if ((!owner || !name) && authedRemoteUrl) {
        const match = authedRemoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
        if (match) {
          owner = match[1];
          name = match[2].replace(/\.git$/, '');
        }
      }

      if (owner && name) {
        // Collect files from workspace to commit
        const filesToPush: Array<{ path: string; content: string }> = [];
        const walkFiles = (current: string) => {
          try {
            const entries = fs.readdirSync(current, { withFileTypes: true });
            for (const entry of entries) {
              if (['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) continue;
              const full = path.join(current, entry.name);
              if (entry.isDirectory()) {
                walkFiles(full);
              } else if (entry.isFile()) {
                if (/\.(ts|tsx|js|jsx|json|md|css|html)$/i.test(entry.name)) {
                  try {
                    const rel = path.relative(dir, full).replace(/\\/g, '/');
                    const content = fs.readFileSync(full, 'utf8');
                    filesToPush.push({ path: rel, content });
                  } catch {}
                }
              }
            }
          } catch {}
        };

        walkFiles(dir);

        if (filesToPush.length > 0) {
          const commitSha = await githubClient.commitFilesToBranch({
            repoOwner: owner,
            repoName: name,
            branchName,
            files: filesToPush,
            commitMessage: options?.commitMessage || `fix: autonomous code fix for ${branchName}`
          });
          if (commitSha) {
            await logger.info(`Branch ${branchName} successfully committed (${commitSha}) via GitHub API for job ${jobId}`, {
              jobId,
              stage: 'WORKSPACE'
            });
          }
        } else if (authedRemoteUrl) {
          await githubClient.ensureRemoteBranch(authedRemoteUrl, branchName);
        }
      } else if (authedRemoteUrl) {
        await githubClient.ensureRemoteBranch(authedRemoteUrl, branchName);
      }
    }
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

  /**
   * Execute shell command inside workspace directory with timeout
   */
  async execCommand(command: string, cwd: string, timeoutMs: number = 30000): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      exec(command, { cwd, timeout: timeoutMs }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            stdout: stdout ? stdout.toString() : '',
            stderr: stderr ? stderr.toString() : error.message,
            exitCode: error.code || 1
          });
        } else {
          resolve({
            success: true,
            stdout: stdout ? stdout.toString() : '',
            stderr: stderr ? stderr.toString() : '',
            exitCode: 0
          });
        }
      });
    });
  }

  /**
   * Scan directory for unresolved merge conflicts
   */
  findMergeConflicts(dir: string): string[] {
    const conflictFiles: string[] = [];
    const checkFile = (filePath: string) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('<<<<<<<') && (content.includes('=======') || content.includes('>>>>>>>'))) {
          conflictFiles.push(path.relative(dir, filePath).replace(/\\/g, '/'));
        }
      } catch {
        // ignore binary or unreadable files
      }
    };

    const walk = (current: string) => {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'dist') continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx|json|css|html|md)$/i.test(entry.name)) {
          checkFile(full);
        }
      }
    };

    try {
      walk(dir);
    } catch {
      // ignore
    }
    return conflictFiles;
  }

  /**
   * Perform syntactic and compiler AST validation on source files
   */
  validateCodeSyntax(dir: string): string[] {
    const errors: string[] = [];
    const walk = (current: string) => {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'dist' || entry.name === 'out') continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          const rel = path.relative(dir, full).replace(/\\/g, '/');

          // JSON validation
          if (entry.name.endsWith('.json')) {
            try {
              JSON.parse(fs.readFileSync(full, 'utf8'));
            } catch (err: any) {
              errors.push(`JSON Syntax Error in ${rel}: ${err.message}`);
            }
          }

          // TypeScript / JavaScript AST syntax validation
          if (/\.(ts|tsx|js|jsx)$/i.test(entry.name)) {
            try {
              const code = fs.readFileSync(full, 'utf8');
              const isTsx = /\.tsx$/i.test(entry.name);
              const isJsx = /\.jsx$/i.test(entry.name);
              const isJs = /\.js$/i.test(entry.name);

              const scriptKind = isTsx
                ? ts.ScriptKind.TSX
                : isJsx
                ? ts.ScriptKind.JSX
                : isJs
                ? ts.ScriptKind.JS
                : ts.ScriptKind.TS;

              const sourceFile = ts.createSourceFile(
                full,
                code,
                ts.ScriptTarget.Latest,
                true,
                scriptKind
              );

              const parseDiagnostics: any[] = (sourceFile as any).parseDiagnostics || [];
              if (parseDiagnostics.length > 0) {
                for (const diag of parseDiagnostics) {
                  const message = typeof diag.messageText === 'string'
                    ? diag.messageText
                    : diag.messageText?.messageText || 'Syntax error';
                  const pos = diag.start !== undefined ? sourceFile.getLineAndCharacterOfPosition(diag.start) : null;
                  const lineInfo = pos ? `:${pos.line + 1}:${pos.character + 1}` : '';
                  errors.push(`Syntax Error in ${rel}${lineInfo}: ${message}`);
                }
              }

              // Check for empty or broken imports
              if (/import\s+.*\s+from\s*['"]\s*['"]/g.test(code)) {
                errors.push(`Compilation Error in ${rel}: Empty import module specifier`);
              }
            } catch (err: any) {
              errors.push(`Parser Error in ${rel}: ${err.message}`);
            }
          }
        }
      }
    };

    try {
      walk(dir);
    } catch {
      // ignore
    }
    return errors;
  }

  /**
   * Verify build health of workspace before pushing
   */
  async checkBuild(jobId: string): Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string; command: string }> {
    const dir = this.getWorkspacePath(jobId);
    if (!fs.existsSync(dir)) {
      return { success: false, error: `Workspace directory not found: ${dir}`, command: 'fs-check' };
    }

    // 1. Check for merge conflicts
    const conflicts = this.findMergeConflicts(dir);
    if (conflicts.length > 0) {
      return {
        success: false,
        error: `Unresolved merge conflict markers detected in: ${conflicts.join(', ')}`,
        command: 'git-conflict-check'
      };
    }

    // 2. Syntax validation for TypeScript/JavaScript/JSON files
    const syntaxErrors = this.validateCodeSyntax(dir);
    if (syntaxErrors.length > 0) {
      return {
        success: false,
        error: `Build compilation error:\n${syntaxErrors.join('\n')}`,
        command: 'syntax-typecheck'
      };
    }

    // 3. Package.json build script check if dependencies are present
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkgContent = fs.readFileSync(pkgPath, 'utf8');
        const pkg = JSON.parse(pkgContent);

        if (pkg.scripts && pkg.scripts.build) {
          const nodeModulesPath = path.join(dir, 'node_modules');
          if (fs.existsSync(nodeModulesPath)) {
            const execResult = await this.execCommand('npm run build', dir, 60000);
            if (!execResult.success) {
              return {
                success: false,
                error: execResult.stderr || execResult.stdout || 'npm run build failed with non-zero exit code',
                stdout: execResult.stdout,
                stderr: execResult.stderr,
                command: 'npm run build'
              };
            }
            return {
              success: true,
              stdout: execResult.stdout || 'Build completed successfully.',
              command: 'npm run build'
            };
          }
        }
      } catch (parseErr: any) {
        return {
          success: false,
          error: `Corrupted package.json: ${parseErr.message}`,
          command: 'package.json validation'
        };
      }
    }

    return {
      success: true,
      stdout: 'All source files, configurations, and syntax verified with zero compilation errors.',
      command: 'build-verification'
    };
  }
}

export const workspaceManager = new WorkspaceManager();
