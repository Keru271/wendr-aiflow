'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Rocket,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function OverviewPage() {
  const [stats, setStats] = useState({
    activeJobs: 1,
    successRate: '94.2%',
    avgResolutionTime: '4m 12s',
    totalDeployments: 18,
    costInr: '₹1,420',
    budgetMonthly: '₹10,000'
  });

  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('http://localhost:4000/jobs');
      if (res.ok) {
        const data = await res.json();
        setRecentJobs(data.slice(0, 5));
      }
    } catch {
      // Mock data for initial view
      setRecentJobs([
        {
          id: 'job-sample-1',
          bug: { jiraIssueKey: 'WEB-1024', title: 'Coupon validation does not handle expired coupon response' },
          project: { name: 'Web Ecommerce Checkout' },
          status: 'AWAITING_PRODUCTION_APPROVAL',
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const triggerLiveDemo = async () => {
    setLoading(true);
    setDemoStatus('Triggering autonomous pipeline for new Jira bug...');
    try {
      const res = await fetch('http://localhost:4000/demo/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Coupon validation does not handle expired coupon response',
          description: 'Applying expired coupon throws unhandled exception in checkout form'
        })
      });
      const data = await res.json();
      setDemoStatus(`Complete! Job created: ${data.bugKey}. PR opened and deployed to Staging.`);
      fetchJobs();
    } catch (err: any) {
      setDemoStatus('Failed to trigger demo API. Ensure API server is running on port 4000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero / Banner with 1-click Demo */}
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium border border-emerald-500/30 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autonomous Engine Ready
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">FixPilot Autonomous Bug-Fixing Pipeline</h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            From incoming Jira bug webhook to AI investigation, Google Antigravity coding, deterministic QA checks, GitHub Pull Request, and approval-gated deployment.
          </p>
        </div>
        <button
          onClick={triggerLiveDemo}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? 'Processing Flow...' : 'Trigger Live Bug-Fix Demo'}
        </button>
      </div>

      {demoStatus && (
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 text-sm text-emerald-400 flex items-center justify-between">
          <span>{demoStatus}</span>
          <button onClick={() => setDemoStatus(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Agent Jobs</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">1</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">100% isolated</span> in disposable containers
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>QA Pass Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.successRate}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">Max 3 retries</span> per job policy
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Resolution Time</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.avgResolutionTime}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            Jira ticket to Staging verification
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Monthly AI Usage</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.costInr}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            Allowance: <span className="text-slate-200">{stats.budgetMonthly}</span> (14.2% used)
          </div>
        </div>
      </div>

      {/* Recent Autonomous Jobs */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <h3 className="font-semibold text-sm text-slate-200">Recent Autonomous Jobs</h3>
          </div>
          <Link href="/jobs" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1">
            View all jobs <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800/60">
          {recentJobs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No jobs executed yet. Click &quot;Trigger Live Bug-Fix Demo&quot; to test the system!
            </div>
          ) : (
            recentJobs.map((job) => (
              <div key={job.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-semibold">
                      {job.bug?.jiraIssueKey || 'JIRA'}
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-medium text-sm text-slate-200 hover:text-emerald-400 transition"
                    >
                      {job.bug?.title || 'Autonomous Bug Investigation & Resolution'}
                    </Link>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>Project: {job.project?.name || 'Acme Web Store'}</span>
                    <span>•</span>
                    <span>Created: {new Date(job.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium border ${
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
                  <Link
                    href={`/jobs/${job.id}`}
                    className="p-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

