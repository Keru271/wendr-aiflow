'use client';

import { useState, useEffect } from 'react';
import { Rocket, ShieldCheck, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchDeployments = async () => {
    try {
      const res = await fetch('http://localhost:4000/deployments');
      if (res.ok) {
        const data = await res.json();
        setDeployments(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const handleRollback = async (deploymentId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/deployments/${deploymentId}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN'
        },
        body: JSON.stringify({ reason: 'Operator initiated rollback from dashboard' })
      });
      const data = await res.json();
      setActionMsg(data.message || 'Rollback triggered.');
      fetchDeployments();
    } catch {
      setActionMsg('Failed to trigger rollback.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Rocket className="h-5 w-5 text-amber-400" />
          Environments & Protected Deployments
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Staging verification is automatic. Production promotion strictly requires an authorized human approval gate.
        </p>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-emerald-400">
          {actionMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Environment Status Card: Staging */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <h3 className="font-semibold text-sm text-white">Staging Environment</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono">
              HEALTHY
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Merged task branches automatically deploy here for post-merge smoke tests and synthetic canary probes.
          </p>
          <div className="text-[11px] font-mono text-slate-500">
            Endpoint: <span className="text-slate-300">https://staging.acme.internal/health</span>
          </div>
        </div>

        {/* Environment Status Card: Production */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="font-semibold text-sm text-white">Production Environment</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-900 font-mono">
              APPROVAL GATED
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            AI agents possess zero production credentials. Release requires manual authorization by designated approver.
          </p>
          <div className="text-[11px] font-mono text-slate-500">
            Designated Approvers: <span className="text-slate-300">Alex Murphy, Sarah Connor</span>
          </div>
        </div>
      </div>

      {/* Deployments History Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-200">Deployment History & Verifications</h3>
        </div>

        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-xs font-mono uppercase text-slate-400">
            <tr>
              <th className="py-3 px-4">Environment</th>
              <th className="py-3 px-4">Job Reference</th>
              <th className="py-3 px-4">Artifact Digest</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Approved By</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {deployments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No deployments recorded yet.
                </td>
              </tr>
            ) : (
              deployments.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/20">
                  <td className="py-3.5 px-4 font-sans font-medium uppercase text-slate-200">{d.environment}</td>
                  <td className="py-3.5 px-4 text-blue-400">{d.job?.bug?.jiraIssueKey || d.jobId}</td>
                  <td className="py-3.5 px-4 text-slate-400 truncate max-w-xs">{d.artifactDigest || 'sha256:...'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        d.status === 'SUCCEEDED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                          : d.status === 'ROLLED_BACK'
                          ? 'bg-rose-950 text-rose-400 border border-rose-900'
                          : 'bg-amber-950 text-amber-400 border border-amber-900'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-sans">{d.approvedBy || 'Autonomous CI (Staging)'}</td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    {d.status === 'SUCCEEDED' && (
                      <button
                        onClick={() => handleRollback(d.id)}
                        className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition"
                      >
                        <RotateCcw className="h-3 w-3" /> Rollback
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

