'use client';

import React, { useState, useEffect } from 'react';
import { FolderKanban, GitBranch, Github, Plus, RefreshCw, X, CheckCircle2 } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Repository Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
      if (data.projects?.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data.projects[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !repoOwner.trim() || !repoName.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          owner: repoOwner.trim(),
          name: repoName.trim(),
          defaultBranch: defaultBranch.trim() || 'main'
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('✅ Repository connected successfully!');
        setRepoOwner('');
        setRepoName('');
        await fetchProjects();
        setTimeout(() => {
          setIsModalOpen(false);
          setMessage(null);
        }, 1500);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = (projId: string) => {
    setSelectedProjectId(projId);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-amber-400" />
            <span>Projects & Repositories</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect and map multiple GitHub repositories (microservices, frontend, backend) to a single Jira project.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Repository</span>
          </button>

          <button
            onClick={fetchProjects}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Projects and Repositories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading projects & repositories...</p>
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
                    Jira Key: {proj.key}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{proj.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{proj.description || 'Core service suite'}</p>
                </div>
                <button
                  onClick={() => openAddModal(proj.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-blue-400 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Connect Repo</span>
                </button>
              </div>

              {/* Connected Repositories Box */}
              <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-medium">
                  <span>Connected Repositories ({proj.repositories?.length || 0}):</span>
                  <span className="text-[10px] text-slate-500">Auto-routes via Jira labels/tags</span>
                </div>

                {proj.repositories && proj.repositories.length > 0 ? (
                  <div className="space-y-2">
                    {proj.repositories.map((repo: any) => (
                      <div
                        key={repo.id}
                        className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Github className="w-4 h-4 text-slate-300" />
                          <span className="font-mono text-slate-200 font-medium">
                            {repo.owner}/{repo.name}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          <GitBranch className="w-3 h-3" />
                          {repo.defaultBranch}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500">
                    No repositories connected yet. Click &quot;Connect Repo&quot; to add one.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Total Bugs Processed: <b className="text-white">{proj._count?.bugs || 0}</b></span>
                <span>Active Jobs: <b className="text-white">{proj._count?.jobs || 0}</b></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Repository Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl border border-slate-800 bg-[#0d1322] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Github className="w-5 h-5 text-blue-400" />
                <span>Connect GitHub Repository</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRepo} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.key}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">GitHub Owner / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. acme-fintech or Keru271"
                  value={repoOwner}
                  onChange={(e) => setRepoOwner(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Repository Name</label>
                <input
                  type="text"
                  placeholder="e.g. auth-service, web-frontend, payment-api"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Default Base Branch</label>
                <input
                  type="text"
                  placeholder="main or master"
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {message && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200">
                  {message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Connecting...' : 'Connect Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
