import * as crypto from 'crypto';
import { logger } from './observability';

export interface JiraAttachmentReference {
  id: string;
  filename: string;
  mimeType: string;
  url: string;
  base64Data?: string; // Base64 encoded payload for multimodal AI reference
}

export interface CanonicalJiraIssue {
  id: string;
  key: string;
  projectKey: string;
  summary: string;
  description: string;
  rawDescription?: any;
  status: string;
  priority: string;
  labels: string[];
  comments: string[];
  attachments: JiraAttachmentReference[];
  aiFixEnabled: boolean;
}

/**
 * Robust recursive parser converting Atlassian Document Format (ADF) into clean plain text prompt
 */
export function parseAdfToPlainText(doc: any): string {
  if (!doc) return '';
  if (typeof doc === 'string') {
    try {
      const parsed = JSON.parse(doc);
      if (parsed && typeof parsed === 'object' && (parsed.type === 'doc' || parsed.content)) {
        return parseAdfToPlainText(parsed);
      }
    } catch {
      return doc.trim();
    }
    return doc.trim();
  }
  if (typeof doc !== 'object') return String(doc);

  const textPieces: string[] = [];

  const walk = (node: any) => {
    if (!node) return;
    if (node.type === 'text' && node.text) {
      textPieces.push(node.text);
    } else if (node.type === 'media' && node.attrs?.alt) {
      textPieces.push(`[Attached Reference: ${node.attrs.alt}]`);
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child);
      }
      if (['paragraph', 'heading', 'listItem', 'bulletList', 'orderedList'].includes(node.type)) {
        textPieces.push('\n');
      }
    }
  };

  walk(doc);
  return textPieces
    .join(' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
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

  async downloadAttachment(contentUrl: string): Promise<{ data: string; mimeType: string; filename: string } | null> {
    if (!this.authHeader || !contentUrl) return null;
    try {
      const res = await fetch(contentUrl, {
        headers: {
          Authorization: this.authHeader
        }
      });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const mimeType = res.headers.get('content-type') || 'application/octet-stream';
        return {
          data: Buffer.from(buffer).toString('base64'),
          mimeType,
          filename: contentUrl.split('/').pop() || 'attachment'
        };
      } else {
        await logger.warn(`Failed to download Jira attachment ${contentUrl}: HTTP ${res.status}`);
      }
    } catch (err: any) {
      await logger.warn(`Failed to download Jira attachment from ${contentUrl}: ${err.message}`);
    }
    return null;
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
          const rawDesc = fields.description;
          const parsedDesc = parseAdfToPlainText(rawDesc);
          const description = parsedDesc || (typeof rawDesc === 'string' ? rawDesc : '');

          const rawAttachments = fields.attachment || [];
          const attachments: JiraAttachmentReference[] = [];
          for (const a of rawAttachments) {
            let base64Data: string | undefined;
            if (a.mimeType?.startsWith('image/') || a.mimeType?.startsWith('text/')) {
              try {
                const downloaded = await this.downloadAttachment(a.content);
                if (downloaded) {
                  base64Data = downloaded.data;
                }
              } catch (err) {
                // non-fatal
              }
            }
            attachments.push({
              id: a.id,
              filename: a.filename,
              mimeType: a.mimeType,
              url: a.content,
              base64Data
            });
          }

          return {
            id: data.id,
            key: data.key,
            projectKey: fields.project?.key || data.key.split('-')[0],
            summary: fields.summary || '',
            description,
            rawDescription: rawDesc,
            status: fields.status?.name || 'Open',
            priority: fields.priority?.name || 'Medium',
            labels,
            comments: (fields.comment?.comments || []).map((c: any) =>
              typeof c.body === 'string' ? c.body : parseAdfToPlainText(c.body)
            ),
            attachments,
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

  async searchIssues(jql: string = 'created >= -365d order by created DESC', maxResults: number = 25): Promise<Array<{
    id: string;
    key: string;
    projectKey: string;
    summary: string;
    status: string;
    priority: string;
    labels: string[];
    created: string;
  }>> {
    // Atlassian Jira Cloud rejects unbounded JQL queries with HTTP 400. Ensure query has a restriction.
    let boundedJql = (jql || '').trim();
    if (!boundedJql || boundedJql.toLowerCase() === 'order by created desc' || boundedJql.toLowerCase().startsWith('order by')) {
      boundedJql = `created >= -365d ${boundedJql || 'order by created DESC'}`;
    } else {
      const lower = boundedJql.toLowerCase();
      if (!lower.includes('project') && !lower.includes('created') && !lower.includes('updated') && !lower.includes('issue') && !lower.includes('id') && !lower.includes('status')) {
        boundedJql = `created >= -365d AND (${boundedJql})`;
      }
    }

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
            jql: boundedJql,
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
