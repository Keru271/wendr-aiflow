import { NextRequest, NextResponse } from 'next/server';
import { jiraClient } from '@/lib/jira';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jql = searchParams.get('jql') || 'project = "WEB" AND created >= -365d order by created DESC';
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const jiraIssues = (await jiraClient.searchIssues(jql, limit)).filter(i => i.key.startsWith('WEB-'));

    // Check which of these are already in FixPilot DB
    const existingBugs = await db.bug.findMany({
      select: {
        jiraIssueKey: true,
        id: true,
        status: true,
        jobs: {
          select: { id: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const existingMap = new Map();
    for (const b of existingBugs) {
      existingMap.set(b.jiraIssueKey, {
        bugId: b.id,
        bugStatus: b.status,
        latestJob: b.jobs?.[0] || null
      });
    }

    const issues = jiraIssues.map((issue) => {
      const match = existingMap.get(issue.key);
      const hasAiOptIn = (issue.labels || []).some(
        (l: string) => l.toLowerCase() === 'ai-fix-opt-in' || l.toLowerCase() === 'fixpilot'
      );

      return {
        ...issue,
        hasAiOptIn,
        isImported: !!match,
        existingBugId: match?.bugId || null,
        latestJobId: match?.latestJob?.id || null,
        latestJobStatus: match?.latestJob?.status || null
      };
    });

    return NextResponse.json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch Jira issues' }, { status: 500 });
  }
}

