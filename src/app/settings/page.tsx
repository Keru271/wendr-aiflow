'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Settings, Coins, Cpu, Shield, RefreshCw, Terminal, ExternalLink, Play, Square, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rcStatus, setRcStatus] = useState<any>(null);
  const [rcLoading, setRcLoading] = useState(false);
  const [rcMessage, setRcMessage] = useState<string | null>(null);

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

  const fetchRemoteControl = async () => {
    try {
      const res = await fetch('/api/antigravity/remote-control');
      const data = await res.json();
      setRcStatus(data);
    } catch (err) {
      console.error('Failed to fetch remote control status:', err);
    }
  };

  useEffect(() => {
    fetchUsage();
    fetchRemoteControl();
  }, []);

  const handleRemoteControlAction = async (action: 'start' | 'stop') => {
    setRcLoading(true);
    setRcMessage(null);
    try {
      const res = await fetch('/api/antigravity/remote-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, name: 'fixpilot-agent-vm' })
      });
      const data = await res.json();
      if (res.ok) {
        setRcMessage(`✅ ${data.message}`);
        await fetchRemoteControl();
      } else {
        setRcMessage(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setRcMessage(`❌ Error: ${err.message}`);
    } finally {
      setRcLoading(false);
    }
  };

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

      {/* Antigravity CLI (agy) & Remote Control Setup */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Antigravity CLI (agy) & Remote Control</h3>
              <p className="text-[11px] text-slate-400">
                Local-parity agent execution daemon on host VM/VPS. Control and steer sessions via browser.
              </p>
            </div>
          </div>
          <button
            onClick={fetchRemoteControl}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">CLI Binary (agy):</span>
              <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[11px] ${
                rcStatus?.cliAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {rcStatus?.cliAvailable ? 'READY (PRIMARY)' : 'FALLBACK MODE'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate" title={rcStatus?.cliPath || 'Not found'}>
              Path: {rcStatus?.cliPath || 'Installed via global PATH or ~/.gemini/bin/agy'}
            </div>
            <div className="text-[11px] text-slate-500">
              Version: <span className="text-slate-300">{rcStatus?.version || 'Antigravity CLI v2.0'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Remote Control Daemon:</span>
              <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[11px] ${
                rcStatus?.remoteControl?.daemonStatus === 'running'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {rcStatus?.remoteControl?.daemonStatus?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Instance: <span className="text-slate-200 font-mono">{rcStatus?.remoteControl?.instanceName || 'fixpilot-agent-vm'}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                disabled={rcLoading || !rcStatus?.cliAvailable}
                onClick={() => handleRemoteControlAction('start')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-[11px] font-medium text-white transition-colors"
              >
                <Play className="w-3 h-3" />
                <span>Start Daemon</span>
              </button>
              <button
                disabled={rcLoading || !rcStatus?.cliAvailable}
                onClick={() => handleRemoteControlAction('stop')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[11px] font-medium text-slate-300 transition-colors"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>
              <a
                href="https://antigravity.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors ml-auto"
              >
                <span>antigravity.google.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {rcMessage && (
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
            {rcMessage}
          </div>
        )}
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
