'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Search, 
  Filter, 
  GitPullRequest, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle,
  Play,
  FolderKanban,
  Sparkles
} from 'lucide-react';
import JiraSyncModal from '@/components/JiraSyncModal';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs?limit=50');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    if (filter === 'ACTIVE') {
      if (['COMPLETED', 'FAILED', 'CANCELLED', 'ROLLED_BACK'].includes(job.status)) return false;
    } else if (filter === 'AWAITING') {
      if (job.status !== 'AWAITING_PRODUCTION_APPROVAL') return false;
    } else if (filter === 'COMPLETED') {
      if (job.status !== 'COMPLETED') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchKey = job.bug?.jiraIssueKey?.toLowerCase().includes(q);
      const matchTitle = job.bug?.title?.toLowerCase().includes(q);
      return matchKey || matchTitle;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Autonomous Fix Jobs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete lifecycle history of Jira bug investigations, agent workspaces, QA checks, and production gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsJiraModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all"
          >
            <FolderKanban className="w-4 h-4 text-indigo-200" />
            <span>Sync from Jira</span>
          </button>

          <button
            onClick={fetchJobs}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-[#0d1322]/80">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Jira key (e.g. WEB-1024, WEB-3) or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {['ALL', 'ACTIVE', 'AWAITING', 'COMPLETED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab === 'AWAITING' ? 'Human Gate Pending' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1322]/80 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-5">Jira Ticket</th>
              <th className="py-3 px-5">Summary</th>
              <th className="py-3 px-5">Project</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Pull Request</th>
              <th className="py-3 px-5">Created</th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Loading jobs...</p>
                </td>
              </tr>
            ) : filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No matching jobs found. Click &quot;Sync from Jira&quot; to import tickets.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-5 font-mono font-medium text-blue-400">
                    {job.bug?.jiraIssueKey || 'WEB-1024'}
                  </td>
                  <td className="py-4 px-5 text-slate-200 max-w-sm truncate font-medium">
                    {job.bug?.title || 'Bug Description'}
                  </td>
                  <td className="py-4 px-5 text-slate-400 font-mono">
                    {job.project?.key || 'WEB'}
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {job.status}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {job.pullRequest ? (
                      <a
                        href={job.pullRequest.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                      >
                        <GitPullRequest className="w-3.5 h-3.5" />
                        <span>PR #{job.pullRequest.number}</span>
                      </a>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-slate-400 font-mono">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-medium transition-colors"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Jira Sync Modal */}
      <JiraSyncModal
        isOpen={isJiraModalOpen}
        onClose={() => setIsJiraModalOpen(false)}
        onImportSuccess={fetchJobs}
      />
    </div>
  );
}
