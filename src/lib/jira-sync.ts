import db from './db';
import { jiraClient } from './jira';
import { orchestrator } from './orchestrator';
import { JobStatus } from './types';
import { logger } from './observability';

/**
 * Automatically fetch recent Jira issues from Jira Cloud and ingest any new ones into FixPilot
 */
export async function autoSyncJiraIssues(): Promise<{
  syncedCount: number;
  newIssueKeys: string[];
}> {
  try {
    // 1. Search Jira Cloud specifically for project WEB with bounded JQL query
    const jiraIssues = await jiraClient.searchIssues('project = "WEB" AND created >= -90d order by created DESC', 20);
    if (!jiraIssues || jiraIssues.length === 0) {
      return { syncedCount: 0, newIssueKeys: [] };
    }

    // 2. Fetch existing bug records in FixPilot database
    const existingBugs = await db.bug.findMany({
      select: { jiraIssueKey: true }
    });
    const existingKeys = new Set(existingBugs.map((b) => b.jiraIssueKey));

    // 3. Filter strictly for genuinely new WEB project issues
    const newIssues = jiraIssues.filter((i) => i.key.startsWith('WEB-') && !existingKeys.has(i.key));
    if (newIssues.length === 0) {
      return { syncedCount: 0, newIssueKeys: [] };
    }

    // 4. Find active project
    const defaultProject = await db.project.findFirst({
      include: { repositories: true }
    });

    if (!defaultProject) {
      await logger.warn('[Auto-Sync] No project found in database to associate with incoming Jira issues.');
      return { syncedCount: 0, newIssueKeys: [] };
    }

    const ingestedKeys: string[] = [];

    for (const issue of newIssues) {
      try {
        const full = await jiraClient.fetchIssue(issue.key);

        const projectKey = full.projectKey || issue.projectKey;
        let project = await db.project.findFirst({
          where: { key: projectKey },
          include: { repositories: true }
        });
        if (!project) {
          project = defaultProject;
        }

        // Determine target repositories
        const searchScope = `${full.summary} ${full.description || ''} ${(full.labels || []).join(' ')}`.toLowerCase();
        const isAll = searchScope.includes('all repo') || searchScope.includes('all repositories') || searchScope.includes('across all');
        
        let targetRepoIds: string[] = [];
        if (isAll) {
          targetRepoIds = project.repositories.map((r) => r.id);
        } else {
          const matched = project.repositories.filter((r) =>
            searchScope.includes(r.name.toLowerCase()) || searchScope.includes(r.name.toLowerCase().replace(/[-_]/g, ' '))
          );
          if (matched.length > 0) {
            targetRepoIds = matched.map((r) => r.id);
          } else {
            // Default to all repositories in project
            targetRepoIds = project.repositories.map((r) => r.id);
          }
        }

        const bug = await db.bug.create({
          data: {
            projectId: project.id,
            jiraIssueId: full.id,
            jiraIssueKey: full.key,
            title: full.summary,
            description: full.description,
            status: full.status || 'Open',
            priority: full.priority || 'Medium',
            labels: JSON.stringify(full.labels || []),
            repositories: {
              connect: targetRepoIds.map((id) => ({ id }))
            }
          }
        });

        const job = await db.agentJob.create({
          data: {
            projectId: project.id,
            bugId: bug.id,
            status: JobStatus.QUEUED,
            idempotencyKey: `auto_jira_${full.key}_${Date.now()}`
          }
        });

        ingestedKeys.push(full.key);
        await logger.info(`[Auto-Sync] Ingested new Jira issue ${full.key} -> Created Job ${job.id}`, { stage: 'JIRA' });

        // Trigger Antigravity orchestrator in background
        orchestrator.runJob(job.id).catch(async (err: any) => {
          await logger.error(`[Auto-Sync] Background run for ${job.id} failed: ${err.message}`, err);
        });
      } catch (err: any) {
        await logger.warn(`[Auto-Sync] Failed to ingest Jira issue ${issue.key}: ${err.message}`);
      }
    }

    return { syncedCount: ingestedKeys.length, newIssueKeys: ingestedKeys };
  } catch (err: any) {
    await logger.warn(`[Auto-Sync] autoSyncJiraIssues failed: ${err.message}`);
    return { syncedCount: 0, newIssueKeys: [] };
  }
}

