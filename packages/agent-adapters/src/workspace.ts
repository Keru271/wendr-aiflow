import * as fs from 'fs';
import * as path from 'path';
import { simpleGit, SimpleGit } from 'simple-git';
import { WorkspaceConfig, WorkspaceInstance } from './types.js';
import { logger } from '@fixpilot/observability';

export class AgentWorkspaceManager {
  private baseDir: string;

  constructor(baseDir: string = './workspaces') {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async createWorkspace(config: WorkspaceConfig): Promise<WorkspaceInstance> {
    const workspaceId = `ws-${config.jobId}-${Date.now()}`;
    const workspaceDir = path.join(this.baseDir, workspaceId);

    fs.mkdirSync(workspaceDir, { recursive: true });
    const git: SimpleGit = simpleGit(workspaceDir);

    try {
      await git.init();
      await git.addConfig('user.name', 'FixPilot Antigravity Agent');
      await git.addConfig('user.email', 'agent@fixpilot.io');

      // Create initial dummy structure representing the repo
      const srcDir = path.join(workspaceDir, 'src', 'checkout');
      fs.mkdirSync(srcDir, { recursive: true });

      const sampleCouponFile = path.join(srcDir, 'coupon.ts');
      if (!fs.existsSync(sampleCouponFile)) {
        fs.writeFileSync(
          sampleCouponFile,
          `// Coupon validation logic\nexport async function validateCoupon(code: string) {\n  const res = await fetch('/api/coupons/' + code);\n  if (!res.ok) {\n    // Bug: throws unhandled error instead of normalizing expired coupon response\n    throw new Error('API request failed');\n  }\n  return await res.json();\n}\n`,
          'utf-8'
        );
      }

      const samplePackageJson = path.join(workspaceDir, 'package.json');
      if (!fs.existsSync(samplePackageJson)) {
        fs.writeFileSync(
          samplePackageJson,
          JSON.stringify(
            {
              name: 'ecommerce-frontend',
              version: '1.0.0',
              scripts: {
                lint: 'echo "Running lint check... Passed."',
                typecheck: 'echo "Running typescript compiler... Passed."',
                test: 'echo "Running unit tests... 14 passed, 0 failed."',
                build: 'echo "Building production bundle... Done."'
              }
            },
            null,
            2
          ),
          'utf-8'
        );
      }

      await git.add('.');
      await git.commit('Initial commit [base]');
      await git.checkoutLocalBranch(config.branchName);

      await logger.info(`Workspace created at ${workspaceDir} on branch ${config.branchName}`, {
        jobId: config.jobId,
        stage: 'WORKSPACE'
      });

      return {
        id: workspaceId,
        jobId: config.jobId,
        directory: workspaceDir,
        branchName: config.branchName,
        cleanup: async () => {
          try {
            if (fs.existsSync(workspaceDir)) {
              fs.rmSync(workspaceDir, { recursive: true, force: true });
              await logger.info(`Workspace cleaned up: ${workspaceDir}`, {
                jobId: config.jobId,
                stage: 'WORKSPACE'
              });
            }
          } catch (err) {
            await logger.warn(`Error cleaning up workspace ${workspaceDir}`, {
              jobId: config.jobId,
              error: err
            });
          }
        },
        getDiff: async () => {
          return await git.diff();
        },
        getChangedFiles: async () => {
          const status = await git.status();
          return status.files.map((f) => f.path);
        },
        commitChanges: async (message: string) => {
          await git.add('.');
          const commitResult = await git.commit(message);
          return commitResult.commit;
        }
      };
    } catch (err: any) {
      await logger.error(`Failed to initialize workspace for job ${config.jobId}`, err);
      throw err;
    }
  }
}

