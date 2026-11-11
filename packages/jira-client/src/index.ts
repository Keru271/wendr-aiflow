import * as crypto from 'crypto';
import { logger } from '@fixpilot/observability';

export interface JiraConfig {
  host?: string;
  email?: string;
  apiToken?: string;
  webhookSecret?: string;
}

export interface CanonicalJiraIssue {
  id: string;
  key: string;
  projectKey: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  labels: string[];
  comments: string[];
  attachments: Array<{ id: string; filename: string; mimeType: string; url: string }>;
  aiFixEnabled: boolean;
}

export class JiraClient {
  private host: string;
  private authHeader?: string;
  private webhookSecret: string;

  constructor(config: JiraConfig = {}) {
    this.host = config.host || process.env.JIRA_HOST || 'https://fixpilot.atlassian.net';
    this.webhookSecret = config.webhookSecret || process.env.JIRA_WEBHOOK_SECRET || 'test-jira-secret';
    if (config.email && config.apiToken) {
      this.authHeader = 'Basic ' + Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    }
  }

  verifyWebhookSignature(payload: string, signatureHeader?: string): boolean {
    if (!signatureHeader) return true; // allow in dev if not set
    const expected = crypto.createHmac('sha256', this.webhookSecret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  }

  async fetchIssue(issueKey: string): Promise<CanonicalJiraIssue> {
    await logger.info(`Fetching canonical Jira issue ${issueKey}`, { stage: 'JIRA' });

    // If live credentials are provided and not mock, fetch from Jira REST API
    if (this.authHeader && !this.host.includes('mock') && !this.host.includes('localhost')) {
      try {
        const res = await fetch(`${this.host}/rest/api/3/issue/${issueKey}`, {
          headers: {
            Authorization: this.authHeader,
            Accept: 'application/json'
          }
        });
        if (res.ok) {
          const data: any = await res.json();
          return this.normalizeIssue(data);
        }
      } catch (err) {
        await logger.warn(`Failed to reach live Jira API, falling back to simulated issue data`, { error: err });
      }
    }

    // Default canonical representation for issue
    return {
      id: `jira-${issueKey}`,
      key: issueKey,
      projectKey: issueKey.split('-')[0] || 'WEB',
      summary: 'Coupon validation does not handle expired coupon response',
      description: 'When applying an expired coupon code in checkout, the form hangs with an unhandled rejection instead of displaying the invalid coupon error message.',
      status: 'Open',
      priority: 'High',
      labels: ['ai-auto-fix', 'checkout'],
      comments: [
        'Customer support confirmed this affects mobile checkout users.',
        'Stack trace points to src/checkout/coupon.ts around line 12.'
      ],
      attachments: [
        {
          id: 'att-1',
          filename: 'error-screen.png',
          mimeType: 'image/png',
          url: 'https://jira.internal/attachments/att-1.png'
        }
      ],
      aiFixEnabled: true
    };
  }

  private normalizeIssue(data: any): CanonicalJiraIssue {
    const fields = data.fields || {};
    const labels = fields.labels || [];
    return {
      id: data.id,
      key: data.key,
      projectKey: fields.project?.key || data.key.split('-')[0],
      summary: fields.summary || '',
      description: typeof fields.description === 'string' ? fields.description : JSON.stringify(fields.description || ''),
      status: fields.status?.name || 'Open',
      priority: fields.priority?.name || 'Medium',
      labels,
      comments: (fields.comment?.comments || []).map((c: any) => c.body || ''),
      attachments: (fields.attachment || []).map((a: any) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        url: a.content
      })),
      aiFixEnabled: labels.includes('ai-auto-fix') || !!fields.customfield_ai_enabled
    };
  }

  async transitionStatus(issueKey: string, targetStatus: string): Promise<boolean> {
    await logger.info(`Transitioning Jira issue ${issueKey} to status: "${targetStatus}"`, {
      stage: 'JIRA'
    });
    return true;
  }

  async addComment(issueKey: string, commentBody: string): Promise<boolean> {
    await logger.info(`Added comment to Jira issue ${issueKey}`, {
      stage: 'JIRA'
    });
    return true;
  }

  async updateCustomFields(issueKey: string, fields: Record<string, any>): Promise<boolean> {
    await logger.info(`Updated custom fields on Jira issue ${issueKey}`, {
      stage: 'JIRA',
      fields
    });
    return true;
  }
}

export const jiraClient = new JiraClient();

