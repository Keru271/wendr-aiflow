'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Search } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:4000/audit-logs')
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-teal-400" />
          Security & Administrative Audit Trail
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Immutable event log tracking human approvals, deployment promotions, configuration changes, and policy enforcements.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-xs font-mono uppercase text-slate-400">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Target Type</th>
              <th className="py-3 px-4">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/20">
                  <td className="py-3.5 px-4 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-slate-200 font-sans">{log.actorEmail}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-900 font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{log.targetType}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-sans truncate max-w-sm">
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

