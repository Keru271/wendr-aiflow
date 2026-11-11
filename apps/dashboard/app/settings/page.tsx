'use client';

import { useState } from 'react';
import { Settings, Shield, Lock, Save } from 'lucide-react';

export default function SettingsPage() {
  const [maxRetries, setMaxRetries] = useState(3);
  const [qaTimeout, setQaTimeout] = useState(180);
  const [optInLabel, setOptInLabel] = useState('ai-auto-fix');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-400" />
          Platform Policies & Safety Settings
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Enforce bounded agent execution, retry limits, budget allowances, and repository safety boundaries.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-400">
          Settings successfully updated and applied.
        </div>
      )}

      <div className="space-y-6">
        {/* Core Principles & Immutables */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <Lock className="h-4 w-4" />
            Enforced Core Platform Principles
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <strong>Human-Controlled Production:</strong> AI agents can never approve their own PRs or promote artifacts to production.
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <strong>Isolated Workspaces:</strong> Tasks run in disposable environments with zero credentials to host or cloud infrastructure.
            </div>
          </div>
        </div>

        {/* Bounded Execution Rules */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <h3 className="font-semibold text-sm text-white">Execution & Retry Limits</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Max QA Repair Retries (Default: 3)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Jobs exceeding this limit escalate directly to Human Review to avoid infinite loops.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">QA Check Timeout (Seconds)</label>
              <input
                type="number"
                min="60"
                max="600"
                value={qaTimeout}
                onChange={(e) => setQaTimeout(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Maximum time allotted for npm lint, typecheck, unit tests, and production build.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs text-slate-300 font-medium">Required Jira Opt-In Label</label>
            <input
              type="text"
              value={optInLabel}
              onChange={(e) => setOptInLabel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Only issues tagged with this label or custom field will trigger autonomous agent jobs.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
            >
              <Save className="h-4 w-4" /> Save Policy Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

