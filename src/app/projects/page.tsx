'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  GitBranch,
  Github,
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

interface GitHubRepoItem {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  description?: string;
  isPrivate: boolean;
  cloneUrl: string;
  htmlUrl: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [modalMode, setModalMode] = useState<'fetch' | 'manual'>('fetch');

  // GitHub Auto-Fetch State
  const [githubOwner, setGithubOwner] = useState('Keru271');
  const [githubToken, setGithubToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [showTokenPlain, setShowTokenPlain] = useState(false);

  const [fetchedRepos, setFetchedRepos] = useState<GitHubRepoItem[]>([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tokenWarning, setTokenWarning] = useState<string | null>(null);
  const [selectedRepoFullNames, setSelectedRepoFullNames] = useState<string[]>([]);
  const [repoSearchFilter, setRepoSearchFilter] = useState('');

  // Manual Add Form State
  const [manualOwner, setManualOwner] = useState('Keru271');
  const [manualName, setManualName] = useState('');
  const [manualBranch, setManualBranch] = useState('main');

  // Action status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingRepoId, setDeletingRepoId] = useState<string | null>(null);

  // Load saved token from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('fixpilot_github_token');
      if (savedToken) {
        setGithubToken(savedToken);
        setShowTokenInput(true);
      }
    }
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      const projList = data.projects || [];
      setProjects(projList);
      if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projList[0].id);
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

  // Fetch repositories from GitHub API
  const handleFetchGitHubRepos = async (ownerToFetch?: string, tokenToUse?: string) => {
    const owner = (ownerToFetch !== undefined ? ownerToFetch : githubOwner).trim();
    const token = (tokenToUse !== undefined ? tokenToUse : githubToken).trim();

    setIsFetchingRepos(true);
    setFetchError(null);
    setTokenWarning(null);

    // Save token if entered
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('fixpilot_github_token', token);
      } else {
        localStorage.removeItem('fixpilot_github_token');
      }
    }

    try {
      const queryParams = new URLSearchParams();
      if (owner) queryParams.set('owner', owner);
      if (token) queryParams.set('token', token);

      const res = await fetch(`/api/repositories/github?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.repositories) {
        setFetchedRepos(data.repositories);
        if (data.tokenWarning) {
          setTokenWarning(data.tokenWarning);
        }

        // Auto-select repositories that aren't already connected to the current project
        const currentProject = projects.find((p) => p.id === selectedProjectId);
        const existingNames = new Set(
          currentProject?.repositories?.map((r: any) => `${r.owner}/${r.name}`.toLowerCase()) || []
        );

        setSelectedRepoFullNames((prev) => {
          const fresh = data.repositories
            .map((r: GitHubRepoItem) => r.fullName)
            .filter((fn: string) => !existingNames.has(fn.toLowerCase()));
          return prev.length > 0 ? prev : fresh;
        });
      } else {
        setFetchError(data.error || 'Failed to fetch repositories from GitHub.');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Error connecting to GitHub API');
    } finally {
      setIsFetchingRepos(false);
    }
  };

  // Open modal and auto fetch
  const openModal = (projId?: string) => {
    if (projId) setSelectedProjectId(projId);
    setIsModalOpen(true);
    setMessage(null);
    setFetchError(null);

    if (fetchedRepos.length === 0) {
      handleFetchGitHubRepos(githubOwner, githubToken);
    }
  };

  // Toggle selection for a repository
  const toggleRepoSelection = (fullName: string) => {
    setSelectedRepoFullNames((prev) =>
      prev.includes(fullName) ? prev.filter((fn) => fn !== fullName) : [...prev, fullName]
    );
  };

  const handleSelectAll = (filteredItems: GitHubRepoItem[]) => {
    const currentProject = projects.find((p) => p.id === selectedProjectId);
    const existingNames = new Set(
      currentProject?.repositories?.map((r: any) => `${r.owner}/${r.name}`.toLowerCase()) || []
    );

    const selectable = filteredItems
      .filter((r) => !existingNames.has(r.fullName.toLowerCase()))
      .map((r) => r.fullName);

    setSelectedRepoFullNames(selectable);
  };

  const handleDeselectAll = () => {
    setSelectedRepoFullNames([]);
  };

  // Connect Selected Repositories in Bulk
  const handleConnectSelected = async () => {
    if (!selectedProjectId) {
      setMessage({ type: 'error', text: 'Please select a target Jira project' });
      return;
    }

    const reposToConnect = fetchedRepos
      .filter((r) => selectedRepoFullNames.includes(r.fullName))
      .map((r) => ({
        owner: r.owner,
        name: r.name,
        defaultBranch: r.defaultBranch,
        cloneUrl: r.cloneUrl,
        githubRepoId: String(r.id)
      }));

    if (reposToConnect.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one repository to connect' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          repositories: reposToConnect
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `✅ Successfully connected ${data.count || reposToConnect.length} repositories to project!`
        });
        await fetchProjects();
        setTimeout(() => {
          setIsModalOpen(false);
          setMessage(null);
        }, 1200);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to connect repositories' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Single Repo Add
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !manualOwner.trim() || !manualName.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          owner: manualOwner.trim(),
          name: manualName.trim(),
          defaultBranch: manualBranch.trim() || 'main'
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Repository connected successfully!' });
        setManualName('');
        await fetchProjects();
        setTimeout(() => {
          setIsModalOpen(false);
          setMessage(null);
        }, 1200);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disconnect / Delete a connected repository
  const handleDisconnectRepo = async (repoId: string, repoFullName: string) => {
    if (!confirm(`Are you sure you want to disconnect repository "${repoFullName}" from this project?`)) {
      return;
    }

    setDeletingRepoId(repoId);

    try {
      const res = await fetch(`/api/repositories?id=${encodeURIComponent(repoId)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchProjects();
      } else {
        const data = await res.json();
        alert(`Failed to disconnect: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingRepoId(null);
    }
  };

  // Filter fetched repositories based on search term
  const filteredRepos = fetchedRepos.filter(
    (r) =>
      r.name.toLowerCase().includes(repoSearchFilter.toLowerCase()) ||
      r.fullName.toLowerCase().includes(repoSearchFilter.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(repoSearchFilter.toLowerCase()))
  );

  const currentSelectedProject = projects.find((p) => p.id === selectedProjectId);
  const currentlyConnectedNames = new Set(
    currentSelectedProject?.repositories?.map((r: any) => `${r.owner}/${r.name}`.toLowerCase()) || []
  );

  // Check if any private repo is present in the list
  const hasPrivateRepos = fetchedRepos.some((r) => r.isPrivate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-amber-400" />
            <span>Projects & Repositories</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auto-fetch and select multiple GitHub repositories (microservices, frontend, backend) for each Jira project.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Auto-Fetch & Connect Repos</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading projects & repositories...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            No projects found in database.
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
                  onClick={() => openModal(proj.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-xs font-semibold text-blue-400 border border-blue-500/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connect Repos</span>
                </button>
              </div>

              {/* Connected Repositories Box */}
              <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-400" />
                    <span>Connected Repositories ({proj.repositories?.length || 0}):</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Multi-repo auto routing active</span>
                </div>

                {proj.repositories && proj.repositories.length > 0 ? (
                  <div className="space-y-2">
                    {proj.repositories.map((repo: any) => (
                      <div
                        key={repo.id}
                        className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Github className="w-4 h-4 text-slate-400 shrink-0" />
                          <a
                            href={`https://github.com/${repo.owner}/${repo.name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-slate-200 font-medium hover:text-blue-400 truncate flex items-center gap-1"
                          >
                            <span>{repo.owner}/{repo.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            <GitBranch className="w-3 h-3 text-emerald-400" />
                            {repo.defaultBranch}
                          </span>

                          <button
                            onClick={() => handleDisconnectRepo(repo.id, `${repo.owner}/${repo.name}`)}
                            disabled={deletingRepoId === repo.id}
                            title="Disconnect repository"
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500">
                    No repositories connected yet. Click &quot;Connect Repos&quot; to auto-fetch and select them.
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

      {/* GitHub Repository Selector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-[#0d1322] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Connect Repositories to Project</h3>
                  <p className="text-[11px] text-slate-400">
                    Automatically fetch repositories from GitHub and choose which to link.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Target Project Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Target Jira Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.key}] {p.name} ({p.repositories?.length || 0} repos currently connected)
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Switch Tabs */}
              <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode('fetch')}
                  className={`flex-1 py-1.5 px-3 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    modalMode === 'fetch'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Fetch from GitHub</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('manual')}
                  className={`flex-1 py-1.5 px-3 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    modalMode === 'manual'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manual Entry</span>
                </button>
              </div>

              {/* AUTO-FETCH TAB CONTENT */}
              {modalMode === 'fetch' && (
                <div className="space-y-4">
                  {/* GitHub Owner / Username Input */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] text-slate-400 font-medium">
                          GitHub Username / Organization
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowTokenInput(!showTokenInput)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>{showTokenInput ? 'Hide Token Field' : 'Enter GitHub Token (for Private Repos)'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={githubOwner}
                            onChange={(e) => setGithubOwner(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFetchGitHubRepos()}
                            placeholder="e.g. Keru271 or organization name"
                            className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                          />
                          <Github className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFetchGitHubRepos()}
                          disabled={isFetchingRepos}
                          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 shrink-0 disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRepos ? 'animate-spin text-amber-400' : ''}`} />
                          <span>{isFetchingRepos ? 'Fetching...' : 'Fetch Repos'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Optional GitHub Token Input for Private Backend Repositories */}
                    {showTokenInput && (
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-amber-400" />
                            <span>GitHub Personal Access Token (PAT)</span>
                          </label>
                          <span className="text-[10px] text-slate-500">Requires `repo` scope</span>
                        </div>
                        <div className="relative">
                          <input
                            type={showTokenPlain ? 'text' : 'password'}
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFetchGitHubRepos()}
                            placeholder="ghp_... or github_pat_..."
                            className="w-full pl-3 pr-10 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowTokenPlain(!showTokenPlain)}
                            className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
                          >
                            {showTokenPlain ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Private backend repositories are hidden by GitHub unless queried with a token.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Token Warning Banner */}
                  {tokenWarning && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div className="text-[11px] leading-relaxed">
                        <p className="font-semibold">GitHub Token Authentication Notice</p>
                        <p>{tokenWarning}</p>
                      </div>
                    </div>
                  )}

                  {/* Backend Repos Notice if only public repos were returned */}
                  {!hasPrivateRepos && fetchedRepos.length > 0 && !tokenWarning && (
                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Backend repositories missing? If they are <b>Private</b>, provide a GitHub Token above.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTokenInput(true)}
                        className="underline text-blue-400 hover:text-white shrink-0 font-medium"
                      >
                        Enter Token
                      </button>
                    </div>
                  )}

                  {fetchError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{fetchError}</span>
                    </div>
                  )}

                  {/* Filter and Selection Header */}
                  {fetchedRepos.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <div className="relative flex-1 max-w-xs">
                          <input
                            type="text"
                            value={repoSearchFilter}
                            onChange={(e) => setRepoSearchFilter(e.target.value)}
                            placeholder="Filter by name (e.g. backend, cms)..."
                            className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleSelectAll(filteredRepos)}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            Select All
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="text-slate-400 hover:text-slate-300"
                          >
                            Deselect All
                          </button>
                          <span className="text-slate-600">•</span>
                          <span className="font-semibold text-slate-300">
                            {selectedRepoFullNames.length} selected
                          </span>
                        </div>
                      </div>

                      {/* Repositories Checklist */}
                      <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60">
                        {filteredRepos.length === 0 ? (
                          <div className="p-6 text-center text-slate-500">
                            <p>No repositories match &quot;{repoSearchFilter}&quot;.</p>
                            <p className="text-[10px] mt-1">If your backend repository is private, enter a GitHub Personal Access Token above.</p>
                          </div>
                        ) : (
                          filteredRepos.map((repo) => {
                            const isConnected = currentlyConnectedNames.has(repo.fullName.toLowerCase());
                            const isSelected = selectedRepoFullNames.includes(repo.fullName);

                            return (
                              <label
                                key={repo.id}
                                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                  isConnected
                                    ? 'opacity-60 bg-slate-900/30 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-blue-600/10 hover:bg-blue-600/15'
                                    : 'hover:bg-slate-900/60'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                  <input
                                    type="checkbox"
                                    disabled={isConnected}
                                    checked={isConnected || isSelected}
                                    onChange={() => !isConnected && toggleRepoSelection(repo.fullName)}
                                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 focus:ring-offset-slate-900"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-white text-xs truncate">
                                        {repo.name}
                                      </span>
                                      {repo.isPrivate ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                                          <Lock className="w-2.5 h-2.5" /> Private
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                                          <Unlock className="w-2.5 h-2.5" /> Public
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-mono text-[10px] text-slate-400 block truncate">
                                      {repo.fullName}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                                    <GitBranch className="w-3 h-3 text-emerald-400" />
                                    {repo.defaultBranch}
                                  </span>

                                  {isConnected && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                      <CheckCircle2 className="w-3 h-3" /> Connected
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {fetchedRepos.length === 0 && !isFetchingRepos && !fetchError && (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                      <Github className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p>Enter a GitHub username/org above and click &quot;Fetch Repos&quot;.</p>
                    </div>
                  )}
                </div>
              )}

              {/* MANUAL ENTRY TAB CONTENT */}
              {modalMode === 'manual' && (
                <form id="manual-repo-form" onSubmit={handleManualAdd} className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                    💡 <b>Add Any Backend Repository Manually:</b> Enter your repository name below if it is private or hosted under another organization.
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">GitHub Owner / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Keru271 or organization"
                      value={manualOwner}
                      onChange={(e) => setManualOwner(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Repository Name</label>
                    <input
                      type="text"
                      placeholder="e.g. backend-api, STOREFRONT_BACKEND, auth-service"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Default Base Branch</label>
                    <input
                      type="text"
                      placeholder="master or main"
                      value={manualBranch}
                      onChange={(e) => setManualBranch(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </form>
              )}

              {message && (
                <div
                  className={`p-3 rounded-lg border text-xs font-mono ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
              <span className="text-[11px] text-slate-400">
                {modalMode === 'fetch'
                  ? `${selectedRepoFullNames.length} selected for connection`
                  : 'Manual single repository mode'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>

                {modalMode === 'fetch' ? (
                  <button
                    type="button"
                    onClick={handleConnectSelected}
                    disabled={isSubmitting || selectedRepoFullNames.length === 0}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {isSubmitting
                        ? 'Connecting...'
                        : `Connect ${selectedRepoFullNames.length} Repositories`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="manual-repo-form"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Connecting...' : 'Connect Repository'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
