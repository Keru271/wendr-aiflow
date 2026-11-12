import { z } from 'zod';
import { ValidationStatus } from './types';

// Investigation Output Schema (Section 6.4 of PRD)
export const InvestigationResultSchema = z.object({
  summary: z.string().min(5),
  rootCause: z.string().min(5),
  likelyFiles: z.array(z.string()),
  proposedFix: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  risk: z.enum(['low', 'medium', 'high', 'critical']),
  needsHumanInput: z.boolean(),
  uncertainties: z.array(z.string()).optional()
});

export type InvestigationResult = z.infer<typeof InvestigationResultSchema>;

// Review Stage Output Schema (Section 6.7 of PRD)
export const ReviewResultSchema = z.object({
  approved: z.boolean(),
  summary: z.string(),
  minimalDiffConfirmed: z.boolean(),
  acceptanceCriteriaMet: z.boolean(),
  securityReviewPassed: z.boolean(),
  findings: z.array(z.string()),
  risksIdentified: z.array(z.string()),
  suggestedAction: z.enum(['PROCEED_TO_PR', 'RETRY_CODING', 'ESCALATE_TO_HUMAN'])
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;

// Agent Adapter Contract (Section 9.2 of PRD)
export const AgentTaskInputSchema = z.object({
  jobId: z.string(),
  repositoryUrl: z.string(),
  baseBranch: z.string(),
  workingDirectory: z.string(),
  prompt: z.string(),
  timeoutSeconds: z.number().default(300),
  maxTotalTokens: z.number().optional()
});

export type AgentTaskInput = z.infer<typeof AgentTaskInputSchema>;

export const AgentTaskResultSchema = z.object({
  providerTaskId: z.string(),
  status: z.enum(['completed', 'failed', 'cancelled']),
  summary: z.string().optional(),
  changedFiles: z.array(z.string()).optional(),
  diff: z.string().optional(),
  error: z.string().optional(),
  tokensUsed: z.number().optional()
});

export type AgentTaskResult = z.infer<typeof AgentTaskResultSchema>;

// QA Checks & Results (Section 6.6 of PRD)
export const ValidationCheckResultSchema = z.object({
  name: z.string(),
  command: z.string(),
  status: z.nativeEnum(ValidationStatus),
  exitCode: z.number().nullable(),
  durationMs: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  summary: z.string().optional(),
  canRetry: z.boolean()
});

export type ValidationCheckResult = z.infer<typeof ValidationCheckResultSchema>;

export const QASuiteResultSchema = z.object({
  passed: z.boolean(),
  checks: z.array(ValidationCheckResultSchema),
  failureSummary: z.string().optional(),
  canRetry: z.boolean()
});

export type QASuiteResult = z.infer<typeof QASuiteResultSchema>;

// Jira Webhook Schema (Section 6.3 of PRD)
export const JiraWebhookPayloadSchema = z.object({
  webhookEvent: z.string().optional(),
  timestamp: z.number().optional(),
  issue: z.object({
    id: z.string().optional(),
    key: z.string(),
    fields: z.object({
      summary: z.string(),
      description: z.any().optional(),
      status: z.object({
        name: z.string(),
        id: z.string().optional()
      }).optional(),
      priority: z.object({
        name: z.string()
      }).optional(),
      labels: z.array(z.string()).optional(),
      issuetype: z.object({
        name: z.string()
      }).optional(),
      project: z.object({
        id: z.string().optional(),
        key: z.string(),
        name: z.string().optional()
      }).optional(),
      comment: z.object({
        comments: z.array(z.any()).optional()
      }).optional(),
      attachment: z.array(z.any()).optional(),
      customfield_ai_enabled: z.boolean().optional()
    })
  })
});

export type JiraWebhookPayload = z.infer<typeof JiraWebhookPayloadSchema>;

// GitHub Webhook Schema (Section 6.8 & 13 of PRD)
export const GitHubWebhookPayloadSchema = z.object({
  action: z.string().optional(),
  repository: z.object({
    id: z.number().optional(),
    name: z.string().optional(),
    full_name: z.string().optional(),
    clone_url: z.string().optional(),
    default_branch: z.string().optional()
  }).optional(),
  pull_request: z.object({
    id: z.number().optional(),
    number: z.number(),
    title: z.string().optional(),
    state: z.string().optional(),
    merged: z.boolean().optional(),
    merge_commit_sha: z.string().nullable().optional(),
    head: z.object({
      ref: z.string().optional(),
      sha: z.string().optional()
    }).optional(),
    base: z.object({
      ref: z.string().optional()
    }).optional(),
    html_url: z.string().optional()
  }).optional(),
  check_run: z.object({
    id: z.number().optional(),
    name: z.string().optional(),
    status: z.string().optional(),
    conclusion: z.string().nullable().optional(),
    head_sha: z.string().optional()
  }).optional()
});

export type GitHubWebhookPayload = z.infer<typeof GitHubWebhookPayloadSchema>;
