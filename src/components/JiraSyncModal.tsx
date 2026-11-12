'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  RefreshCw,
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface JiraIssueItem {
  id: string;
  key: string;
  projectKey: string;
  summary: string;
  status: string;
  priority: string;
  labels: string[];
  created: string;
  hasAiOptIn: boolean;
  isImported: boolean;
  existingBugId: string | null;
  latestJobId: string | null;
  latestJobStatus: string | null;
}

interface JiraSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export default function JiraSyncModal({ isOpen, onClose, onImportSuccess }: JiraSyncModalProps) {
  const [issues, setIssues] = useState<JiraIssueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingKey, setImportingKey] = useState<string | null>(null);
  const [customKey, setCustomKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [targetAllRepos, setTargetAllRepos] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchJiraIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jiraRes, repoRes] = await Promise.all([
        fetch('/api/jira/issues?limit=30'),
        fetch('/api/repositories')
      ]);
      const data = await jiraRes.json();
      const repoData = await repoRes.json();

      if (jiraRes.ok && data.issues) {
        setIssues(data.issues);
      } else {
        setError(data.error || 'Failed to fetch issues from Jira Cloud');
      }

      if (repoRes.ok && repoData.repositories) {
        setRepositories(repoData.repositories);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to Jira API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJiraIssues();
      setMessage(null);
    }
  }, [isOpen]);

  const handleImport = async (keyToImport: string) => {
    const key = keyToImport.trim().toUpperCase();
    if (!key) return;

    setImportingKey(key);
    setMessage(null);

    try {
      const res = await fetch('/api/jira/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueKey: key,
          autoStart: true,
          repositoryIds: targetAllRepos ? [] : selectedRepoIds
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `✅ ${key} successfully imported! Autonomous AI Fix pipeline initiated.`
        });
        await fetchJiraIssues();
        if (onImportSuccess) onImportSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to import issue' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setImportingKey(null);
    }
  };

  if (!isOpen) return null;

  const filteredIssues = issues.filter(
    (i) =>
      i.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-[#0d1322] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sync & Import Jira Issues</h3>
              <p className="text-[11px] text-slate-400">
                Direct integration with your Jira Cloud instance (<span className="font-mono text-slate-300">balakeerthi2710.atlassian.net</span>)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Quick Manual Import Bar */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <input
              type="text"
              placeholder="Import by Jira Key directly (e.g. WEB-3, WEB-2)..."
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleImport(customKey)}
              className="flex-1 bg-slate-950 px-3 py-2 rounded-lg border border-slate-700 text-slate-200 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => handleImport(customKey)}
              disabled={!customKey.trim() || importingKey === customKey.trim().toUpperCase()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{importingKey === customKey.trim().toUpperCase() ? 'Importing...' : 'Import Issue'}</span>
            </button>
          </div>

          {/* Multi-Repository Association (An Issue can relate to N repositories) */}
          {repositories.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span>Target Repositories</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Issue can relate to N repositories)
                  </span>
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-indigo-400">
                  <input
                    type="checkbox"
                    checked={targetAllRepos}
                    onChange={(e) => setTargetAllRepos(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <span>All Repositories / Auto-detection</span>
                </label>
              </div>

              {!targetAllRepos && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {repositories.map((r) => {
                    const isSelected = selectedRepoIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedRepoIds(selectedRepoIds.filter((id) => id !== r.id));
                          } else {
                            setSelectedRepoIds([...selectedRepoIds, r.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {r.owner ? `${r.owner}/${r.name}` : r.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {message && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Search & Refresh Bar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Filter Jira tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            </div>

            <button
              onClick={fetchJiraIssues}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{loading ? 'Fetching...' : 'Refresh Jira Issues'}</span>
            </button>
          </div>

          {/* Issue List */}
          <div className="space-y-2">
            {loading && issues.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p>Loading Jira tickets from balakeerthi2710.atlassian.net...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No Jira tickets found matching &quot;{searchQuery}&quot;.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {issue.key}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {issue.status}
                        </span>
                        {issue.labels?.map((label, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              label.toLowerCase() === 'ai-fix-opt-in' || label.toLowerCase() === 'fixpilot'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            #{label}
                          </span>
                        ))}
                      </div>

                      <p className="font-semibold text-white text-xs truncate">{issue.summary}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Created: {new Date(issue.created).toLocaleString()}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {issue.isImported ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>In Dashboard</span>
                          </span>
                          {issue.latestJobId && (
                            <Link
                              href={`/jobs/${issue.latestJobId}`}
                              onClick={onClose}
                              className="p-1 text-slate-400 hover:text-white text-xs inline-flex items-center gap-0.5"
                            >
                              <span>Job</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleImport(issue.key)}
                          disabled={importingKey === issue.key}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-indigo-600/20"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-200" />
                          <span>{importingKey === issue.key ? 'Starting Fix...' : 'Import & Run AI Fix'}</span>
                        </button>
                      )}

                      <a
                        href={`https://balakeerthi2710.atlassian.net/browse/${issue.key}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
                        title="Open in Jira"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Jira Webhook Setup Accordion */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowWebhookGuide(!showWebhookGuide)}
              className="w-full p-3 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold">How to enable Instant Webhooks from Jira Cloud</span>
              </div>
              {showWebhookGuide ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showWebhookGuide && (
              <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-2.5 text-[11px] text-slate-400">
                <p>
                  To receive new bugs automatically the second they are created in Jira:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>
                    Open Jira Settings → <b>System</b> → <b>WebHooks</b> (or go to <a href="https://balakeerthi2710.atlassian.net/plugins/servlet/webhooks" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Jira WebHooks page</a>).
                  </li>
                  <li>Click <b>Create a WebHook</b>.</li>
                  <li>
                    URL: Set to your live URL: <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-mono">https://&lt;your-site&gt;.netlify.app/api/webhooks/jira</code>
                  </li>
                  <li>
                    Events: Check <b>Issue &gt; created</b> and <b>Issue &gt; updated</b>.
                  </li>
                  <li>Click <b>Save</b>. All new tickets will automatically trigger FixPilot!</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/60">
          <span className="text-[11px] text-slate-400">
            {issues.length} tickets retrieved from Jira
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

