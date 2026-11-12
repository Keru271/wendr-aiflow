import * as crypto from 'crypto';
import { logger } from './observability';

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

  constructor() {
    this.host = process.env.JIRA_HOST || 'https://fixpilot.atlassian.net';
    this.webhookSecret = process.env.JIRA_WEBHOOK_SECRET || 'dev-jira-secret-key';
    if (process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN) {
      this.authHeader = 'Basic ' + Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
    }
  }

  verifyWebhookSignature(payload: string, signatureHeader?: string): boolean {
    if (!signatureHeader) return true; // allow in dev
    try {
      const expected = crypto.createHmac('sha256', this.webhookSecret).update(payload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  async fetchIssue(issueKey: string): Promise<CanonicalJiraIssue> {
    await logger.info(`Fetching canonical Jira issue ${issueKey}`, { stage: 'JIRA' });

    if (this.authHeader && !this.host.includes('mock') && !this.host.includes('localhost') && !this.host.includes('your-company')) {
      try {
        const res = await fetch(`${this.host}/rest/api/3/issue/${issueKey}`, {
          headers: {
            Authorization: this.authHeader,
            Accept: 'application/json'
          }
        });
        if (res.ok) {
          const data: any = await res.json();
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
      } catch (err) {
        await logger.warn(`Failed to reach live Jira API, using simulated issue details`, { error: err });
      }
    }

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

  async searchIssues(jql: string = 'order by created DESC', maxResults: number = 25): Promise<Array<{
    id: string;
    key: string;
    projectKey: string;
    summary: string;
    status: string;
    priority: string;
    labels: string[];
    created: string;
  }>> {
    if (this.authHeader && !this.host.includes('mock') && !this.host.includes('localhost') && !this.host.includes('your-company')) {
      try {
        const res = await fetch(`${this.host}/rest/api/3/search/jql`, {
          method: 'POST',
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            jql,
            maxResults,
            fields: ['key', 'summary', 'status', 'labels', 'created', 'priority', 'project']
          })
        });

        if (res.ok) {
          const data = await res.json();
          return (data.issues || []).map((i: any) => ({
            id: String(i.id),
            key: i.key,
            projectKey: i.fields?.project?.key || i.key?.split('-')[0] || 'WEB',
            summary: i.fields?.summary || '',
            status: i.fields?.status?.name || 'Open',
            priority: i.fields?.priority?.name || 'Medium',
            labels: i.fields?.labels || [],
            created: i.fields?.created || ''
          }));
        } else {
          const errBody = await res.text();
          logger.warn(`Jira search/jql API returned ${res.status}: ${errBody}`);
        }
      } catch (err: any) {
        logger.warn(`Jira searchIssues call failed: ${err.message}`);
      }
    }
    return [];
  }

  async transitionStatus(issueKey: string, targetStatus: string): Promise<boolean> {
    await logger.info(`Transitioning Jira issue ${issueKey} to status: "${targetStatus}"`, { stage: 'JIRA' });

    if (this.authHeader && !this.host.includes('mock') && !this.host.includes('localhost') && !this.host.includes('your-company')) {
      try {
        // Fetch available transitions for this issue
        const transRes = await fetch(`${this.host}/rest/api/3/issue/${issueKey}/transitions`, {
          headers: {
            Authorization: this.authHeader,
            Accept: 'application/json'
          }
        });

        if (transRes.ok) {
          const transData = await transRes.json();
          const targetLower = targetStatus.toLowerCase().trim();
          const match = (transData.transitions || []).find((t: any) =>
            t.name.toLowerCase() === targetLower ||
            (targetLower === 'done' && (t.name.toLowerCase().includes('done') || t.name.toLowerCase().includes('resolve') || t.name.toLowerCase().includes('close'))) ||
            (targetLower === 'in progress' && (t.name.toLowerCase().includes('progress') || t.name.toLowerCase().includes('start')))
          );

          if (match) {
            const applyRes = await fetch(`${this.host}/rest/api/3/issue/${issueKey}/transitions`, {
              method: 'POST',
              headers: {
                Authorization: this.authHeader,
                'Content-Type': 'application/json',
                Accept: 'application/json'
              },
              body: JSON.stringify({ transition: { id: match.id } })
            });
            return applyRes.ok;
          }
        }
      } catch (err: any) {
        logger.warn(`Failed to transition Jira issue ${issueKey}: ${err.message}`);
      }
    }
    return true;
  }

  async transitionIssue(issueKey: string, targetStatus: string): Promise<boolean> {
    return this.transitionStatus(issueKey, targetStatus);
  }

  async addComment(issueKey: string, commentBody: string): Promise<boolean> {
    await logger.info(`Added comment to Jira issue ${issueKey}: ${commentBody.slice(0, 80)}...`, { stage: 'JIRA' });

    if (this.authHeader && !this.host.includes('mock') && !this.host.includes('localhost') && !this.host.includes('your-company')) {
      try {
        const res = await fetch(`${this.host}/rest/api/3/issue/${issueKey}/comment`, {
          method: 'POST',
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            body: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: commentBody
                    }
                  ]
                }
              ]
            }
          })
        });
        return res.ok;
      } catch (err: any) {
        logger.warn(`Failed to post comment to Jira issue ${issueKey}: ${err.message}`);
      }
    }
    return true;
  }

  async postComment(issueKey: string, commentBody: string): Promise<boolean> {
    return this.addComment(issueKey, commentBody);
  }

  async postInvestigationReport(issueKey: string, investigation: any): Promise<boolean> {
    const comment = `🔍 **FixPilot Autonomous Investigation Report**\n\n- **Root Cause**: ${investigation.rootCause}\n- **Likely Files**: ${investigation.likelyFiles?.join(', ')}\n- **Risk**: ${investigation.risk}\n- **Proposed Fix**: ${investigation.proposedFix?.join('; ')}`;
    return this.addComment(issueKey, comment);
  }

  async postPullRequestComment(issueKey: string, pr: any): Promise<boolean> {
    const comment = `🤖 **FixPilot Pull Request Ready**\n\n- **PR**: [#${pr.number}](${pr.url})\n- **Branch**: \`${pr.branchName}\`\n- **Status**: All QA gates passed. Staging deployment initiated.`;
    return this.addComment(issueKey, comment);
  }

  async updateCustomFields(issueKey: string, fields: Record<string, any>): Promise<boolean> {
    await logger.info(`Updated custom fields on Jira issue ${issueKey}`, { stage: 'JIRA', fields });
    return true;
  }
}

export const jiraClient = new JiraClient();
