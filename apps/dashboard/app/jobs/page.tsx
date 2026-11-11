'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, Search, ArrowRight, RefreshCw, Filter } from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch {
      // Fallback sample
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesText =
      job.bug?.jiraIssueKey?.toLowerCase().includes(filter.toLowerCase()) ||
      job.bug?.title?.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
    return matchesText && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            Autonomous Agent Jobs
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time tracking of AI investigations, coding tasks, quality checks, and deployments.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-300 text-sm font-medium transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Jira key (e.g. WEB-1024) or bug title..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All States</option>
          <option value="QUEUED">QUEUED</option>
          <option value="INVESTIGATING">INVESTIGATING</option>
          <option value="CODING">CODING</option>
          <option value="QA">QA</option>
          <option value="PR_CREATED">PR_CREATED</option>
          <option value="AWAITING_PRODUCTION_APPROVAL">AWAITING_APPROVAL</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      {/* Jobs Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-xs uppercase text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">Jira Issue</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Retries</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No jobs match your criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-blue-400">
                      {job.bug?.jiraIssueKey || 'WEB-1024'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-medium max-w-md truncate">
                      {job.bug?.title || 'Bug title'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : job.status === 'AWAITING_PRODUCTION_APPROVAL'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : job.status === 'FAILED' || job.status === 'ROLLED_BACK'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-cyan-950 text-cyan-400 border-cyan-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      {job.retryCount || 0} / {job.maxRetries || 3}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        Inspect <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

