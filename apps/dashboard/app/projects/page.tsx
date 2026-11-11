'use client';

import { useState, useEffect } from 'react';
import { FolderGit2, GitBranch, Terminal, ShieldAlert } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:4000/projects')
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FolderGit2 className="h-5 w-5 text-blue-400" />
          Projects & Connected Repositories
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure Jira project mappings, permitted repositories, quality gates, and path boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {projects.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-bold">
                    {p.key}
                  </span>
                  <h3 className="font-bold text-base text-white">{p.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">{p.description}</p>
              </div>

              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono font-medium">
                Auto-Fix Active
              </span>
            </div>

            {/* Repositories */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase font-mono text-slate-400 font-semibold tracking-wider">
                Target Source Repositories
              </h4>
              {p.repositories?.map((r: any) => (
                <div key={r.id} className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm text-slate-200">
                      {r.owner}/{r.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <GitBranch className="h-3.5 w-3.5 text-slate-500" />
                      Base branch: <span className="text-slate-200">{r.defaultBranch}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-1">
                    <div className="space-y-1">
                      <div className="text-slate-400 font-sans font-medium flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-cyan-400" /> Configured QA Validation Pipeline:
                      </div>
                      <div className="text-slate-300 bg-slate-900 p-2 rounded border border-slate-800/80">
                        • npm run lint<br />
                        • npx tsc --noEmit<br />
                        • npm test -- --runInBand<br />
                        • npm run build
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-slate-400 font-sans font-medium flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> Enforced Boundary Restrictions:
                      </div>
                      <div className="text-slate-300 bg-slate-900 p-2 rounded border border-slate-800/80">
                        • Allowed: src/**<br />
                        • Restricted: .github/workflows/**<br />
                        • Restricted: credentials/**, config/secrets/**
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

