'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Settings, Coins, Cpu, Shield, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/usage');
      const data = await res.json();
      setUsage(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Settings & Cost Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compute budget controls, token tracking, and enterprise approval policies.
          </p>
        </div>

        <button
          onClick={fetchUsage}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Cost & Compute Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Compute Cost</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            ₹{usage?.summary?.totalCostInr?.toFixed(2) || '0.00'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Billed in Indian Rupees (INR)</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tokens Consumed</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {usage?.summary?.totalTokens?.toLocaleString() || '0'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {usage?.summary?.totalInputTokens || 0} in / {usage?.summary?.totalOutputTokens || 0} out
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Execution Runtime</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {((usage?.summary?.totalExecutionMs || 0) / 1000).toFixed(1)}s
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Total sandbox run duration</div>
        </div>
      </div>

      {/* Policy and Safety Rules */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
        <h3 className="text-sm font-semibold text-white">Production Safety & Policy Configuration</h3>
        
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-white">Principle #1: Human-Controlled Production Gate</div>
              <div className="text-slate-400 text-[11px]">Require authorized Approver or Admin user click before production rollout.</div>
            </div>
            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold self-start sm:self-auto">
              ENFORCED
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-white">Isolated Disposable Sandboxes</div>
              <div className="text-slate-400 text-[11px]">Each job executes in a temporary, destroyed-on-completion workspace.</div>
            </div>
            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold self-start sm:self-auto">
              ENFORCED
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-white">Bounded Retries Limit</div>
              <div className="text-slate-400 text-[11px]">Maximum number of autonomous fix retries before human escalation.</div>
            </div>
            <span className="font-mono text-white font-semibold bg-slate-800 px-2.5 py-1 rounded self-start sm:self-auto">
              3 Retries Max
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
