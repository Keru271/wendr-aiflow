'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs?limit=50');
      const data = await res.json();
      setLogs(data.auditLogs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
            <span>Compliance & Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all job state transitions, human approvals, config updates, and rollback actions.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0d1322]/80 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-5">Timestamp</th>
              <th className="py-3 px-5">Action</th>
              <th className="py-3 px-5">Actor / User</th>
              <th className="py-3 px-5">Target</th>
              <th className="py-3 px-5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="inline-block w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Loading audit trail...</p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-5 font-mono font-medium text-rose-300">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-5 text-slate-200">
                    {log.actorEmail || log.user?.email || 'SYSTEM_ORCHESTRATOR'}
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                    {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 10)}...)` : ''}
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                    {log.metadata || '—'}
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
