'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  GitPullRequest, 
  Server, 
  ChevronRight, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Coins
} from 'lucide-react';

export default function DashboardPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    awaitingApproval: 0,
    totalPullRequests: 0,
    totalCostInr: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [jobsRes, prsRes, usageRes] = await Promise.all([
        fetch('/api/jobs?limit=10'),
        fetch('/api/pull-requests'),
        fetch('/api/usage')
      ]);

      const jobsData = await jobsRes.json();
      const prsData = await prsRes.json();
      const usageData = await usageRes.json();

      const jobList = jobsData.jobs || [];
      setJobs(jobList);

      const active = jobList.filter((j: any) => !['COMPLETED', 'FAILED', 'CANCELLED', 'ROLLED_BACK'].includes(j.status)).length;
      const completed = jobList.filter((j: any) => j.status === 'COMPLETED').length;
      const awaiting = jobList.filter((j: any) => j.status === 'AWAITING_PRODUCTION_APPROVAL').length;

      setStats({
        activeJobs: active,
        completedJobs: completed,
        awaitingApproval: awaiting,
        totalPullRequests: prsData.pullRequests?.length || 0,
        totalCostInr: usageData.summary?.totalCostInr || 0
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const triggerLiveDemo = async () => {
    setIsTriggering(true);
    setTriggerMessage('Running autonomous bug fix lifecycle (Jira → Antigravity → QA → PR → Staging)...');
    try {
      const res = await fetch('/api/demo/trigger', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTriggerMessage(`✅ Autonomous fix executed! Job reached "${data.job?.status}". Directing you to approval gate.`);
        await fetchData();
      } else {
        setTriggerMessage(`❌ Error triggering demo: ${data.error}`);
      }
    } catch (err: any) {
      setTriggerMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'AWAITING_PRODUCTION_APPROVAL':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">Human Gate Pending</span>;
      case 'CODING':
      case 'INVESTIGATING':
      case 'QA':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Active: {status}</span>;
      case 'FAILED':
      case 'ROLLED_BACK':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">{status}</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner with 1-Click Action */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Antigravity Autonomous Bug-Fixing Engine</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Autonomous Code Fixes with Human Production Safeguards
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connect Jira issues, let Antigravity investigate and patch in isolated sandboxes, run strict automated QA gates, generate verified GitHub PRs, and retain human sign-off before production.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={triggerLiveDemo}
              disabled={isTriggering}
              className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {isTriggering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Live Fix Demo (WEB-1024)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {triggerMessage && (
          <div className="mt-4 p-3 rounded-lg bg-blue-950/80 border border-blue-800/80 text-xs font-mono text-blue-200">
            {triggerMessage}
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Fix Jobs</span>
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.activeJobs}</div>
          <div className="mt-1 text-[11px] text-slate-500">Executing across sandboxes</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Human Gate Pending</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{stats.awaitingApproval}</div>
          <div className="mt-1 text-[11px] text-slate-500">Production sign-offs required</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>PRs Created</span>
            <GitPullRequest className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.totalPullRequests}</div>
          <div className="mt-1 text-[11px] text-slate-500">With QA evidence tables</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Bugs Completed</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.completedJobs}</div>
          <div className="mt-1 text-[11px] text-slate-500">Verified in production</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>AI Compute Cost</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">₹{stats.totalCostInr.toFixed(2)}</div>
          <div className="mt-1 text-[11px] text-slate-500">INR per token budget</div>
        </div>
      </div>

      {/* End-to-End Autonomous Pipeline Diagram */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/60">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span>Autonomous Fix Lifecycle & Safeguards</span>
          <span className="text-[11px] text-slate-500 font-normal">(20-Stage Orchestration)</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="text-[10px] text-slate-500 font-mono">01</div>
            <div className="font-semibold text-blue-400 mt-1">Jira Intake</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Webhook & Opt-in</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="text-[10px] text-slate-500 font-mono">02</div>
            <div className="font-semibold text-indigo-400 mt-1">Diagnosis</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Root cause & plan</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="text-[10px] text-slate-500 font-mono">03</div>
            <div className="font-semibold text-purple-400 mt-1">Antigravity</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Isolated sandbox</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="text-[10px] text-slate-500 font-mono">04</div>
            <div className="font-semibold text-emerald-400 mt-1">QA Matrix</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Lint, tests, build</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="text-[10px] text-slate-500 font-mono">05</div>
            <div className="font-semibold text-cyan-400 mt-1">GitHub PR</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Summary & diff</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="text-[10px] text-slate-500 font-mono">06</div>
            <div className="font-semibold text-amber-400 mt-1">Staging</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Smoke verified</div>
          </div>
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
            <div className="text-[10px] text-amber-400 font-mono">07</div>
            <div className="font-semibold text-amber-300 mt-1">Human Gate</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Strict Approval</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="text-[10px] text-slate-500 font-mono">08</div>
            <div className="font-semibold text-emerald-400 mt-1">Production</div>
            <div className="text-[10px] text-slate-400 mt-0.5">With rollback</div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1322]/80 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Recent Autonomous Fix Jobs</h3>
            <p className="text-xs text-slate-400">Live tracker for issues processed by Google Antigravity</p>
          </div>
          <Link
            href="/jobs"
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Jobs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Jira Issue</th>
                <th className="py-3 px-5">Summary</th>
                <th className="py-3 px-5">Lifecycle Status</th>
                <th className="py-3 px-5">Pull Request</th>
                <th className="py-3 px-5">Updated</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No jobs recorded yet. Click &quot;Run Live Fix Demo&quot; to test the full pipeline!
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-medium text-blue-400">
                      {job.bug?.jiraIssueKey || 'WEB-1024'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-200 max-w-xs truncate font-medium">
                      {job.bug?.title || 'Payment timeout race condition'}
                    </td>
                    <td className="py-3.5 px-5">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-3.5 px-5">
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
                    <td className="py-3.5 px-5 text-slate-400 font-mono">
                      {new Date(job.updatedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
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
      </div>
    </div>
  );
}
