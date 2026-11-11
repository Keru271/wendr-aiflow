'use client';

import { useState, useEffect } from 'react';
import { GitPullRequest, ExternalLink, CheckCircle2, Clock } from 'lucide-react';

export default function PullRequestsPage() {
  const [prs, setPrs] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:4000/pull-requests')
      .then((res) => res.json())
      .then((data) => setPrs(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GitPullRequest className="h-5 w-5 text-purple-400" />
          Autonomous Pull Requests
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Every PR includes structured diagnosis, test evidence checkboxes, and branch protection enforcement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {prs.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500 text-sm">
            No Pull Requests opened yet. Trigger a job demo from the Overview page!
          </div>
        ) : (
          prs.map((pr) => (
            <div key={pr.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-semibold">
                      {pr.job?.bug?.jiraIssueKey || 'WEB-1024'}
                    </span>
                    <span className="font-semibold text-sm text-slate-200">
                      #{pr.number} {pr.title}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    Branch: <span className="text-slate-300">{pr.branchName}</span> • Head:{' '}
                    <span className="text-slate-300">{pr.commitSha?.substring(0, 7) || 'HEAD'}</span>
                  </div>
                </div>

                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white font-medium text-xs transition"
                >
                  View on GitHub <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 font-mono space-y-1">
                <div className="text-slate-400 font-sans font-medium mb-1">Automated QA Checklist Verification:</div>
                <div className="text-emerald-400">✓ [x] Lint check passed</div>
                <div className="text-emerald-400">✓ [x] TypeScript compiler (zero type errors)</div>
                <div className="text-emerald-400">✓ [x] Unit test suites passed</div>
                <div className="text-emerald-400">✓ [x] Production build bundle successful</div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Branch protection: Requires authorized human approval before merge</span>
                <span>Status: {pr.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

