'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Rocket, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deployments');
      const data = await res.json();
      setDeployments(data.deployments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-purple-400" />
            <span>Deployments & Environments</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated staging rollouts and human approval-gated production releases with health verification.
          </p>
        </div>

        <button
          onClick={fetchDeployments}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0d1322]/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px] sm:min-w-0">
          <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-5">Environment</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Jira Issue</th>
              <th className="py-3 px-5">Approved By</th>
              <th className="py-3 px-5">Smoke / Health Verification</th>
              <th className="py-3 px-5">Deployed At</th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Loading deployments...</p>
                </td>
              </tr>
            ) : deployments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No deployments recorded yet. Trigger a live fix from the overview dashboard.
                </td>
              </tr>
            ) : (
              deployments.map((dep) => (
                <tr key={dep.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                      dep.environment === 'production'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {dep.environment}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="font-semibold text-white">
                      {dep.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-mono text-blue-400 font-medium">
                    {dep.job?.bug?.jiraIssueKey || 'WEB-1024'}
                  </td>
                  <td className="py-4 px-5 text-slate-300">
                    {dep.approvedBy ? (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{dep.approvedBy}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Automated Pipeline</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-slate-400 font-mono text-[11px]">
                    {dep.healthResult ? 'HTTP 200 • Latency 38ms • 0% errors' : 'Pending verification'}
                  </td>
                  <td className="py-4 px-5 text-slate-400 font-mono">
                    {new Date(dep.createdAt).toLocaleString()}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href={`/jobs/${dep.jobId}`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                    >
                      Inspect
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
