'use client';

import React, { useState, useEffect } from 'react';
import { FolderKanban, GitBranch, Github, Plus, RefreshCw } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-amber-400" />
            <span>Projects & Repositories</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Map Jira project keys to GitHub target repositories, default branches, and QA check presets.
          </p>
        </div>

        <button
          onClick={fetchProjects}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            No projects found.
          </div>
        ) : (
          projects.map((proj) => (
            <div key={proj.id} className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Key: {proj.key}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{proj.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{proj.description || 'Core service repository'}</p>
                </div>
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Active
                </span>
              </div>

              <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                <div className="text-slate-400 font-medium">Associated GitHub Repositories:</div>
                {proj.repositories?.length > 0 ? (
                  proj.repositories.map((repo: any) => (
                    <div key={repo.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Github className="w-4 h-4 text-slate-300" />
                        <span className="font-mono text-slate-200">{repo.owner}/{repo.name}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <GitBranch className="w-3 h-3" />
                        {repo.defaultBranch}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4 text-slate-300" />
                      <span className="font-mono text-slate-200">acme-fintech/payment-service</span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <GitBranch className="w-3 h-3" />
                      main
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Total Bugs Processed: <b className="text-white">{proj._count?.bugs || 1}</b></span>
                <span>Active Jobs: <b className="text-white">{proj._count?.jobs || 1}</b></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
