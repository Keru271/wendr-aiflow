'use client';

import { useState, useEffect } from 'react';
import { Plug, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:4000/integrations')
      .then((res) => res.json())
      .then((data) => setIntegrations(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Plug className="h-5 w-5 text-pink-400" />
          Connected Integrations & Providers
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Manage Jira webhooks, GitHub App authentication, and Google Antigravity agent adapter configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Jira Cloud Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-white">Atlassian Jira Cloud</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono">
              CONNECTED
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Receives issue creation and update webhooks. Transitions ticket status and updates custom AI fields.
          </p>
          <div className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-slate-300 space-y-1">
            <div className="text-slate-500 text-[11px]">Webhook Endpoint:</div>
            <div className="text-emerald-400 truncate">http://localhost:4000/webhooks/jira</div>
            <div className="text-slate-500 text-[11px] pt-1">Required Opt-In Label:</div>
            <div className="text-blue-400">ai-auto-fix</div>
          </div>
        </div>

        {/* GitHub App Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-white">GitHub App Integration</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono">
              CONNECTED
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manages isolated task branches, opens Pull Requests with validation checklists, and monitors CI check suites.
          </p>
          <div className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-slate-300 space-y-1">
            <div className="text-slate-500 text-[11px]">Webhook Endpoint:</div>
            <div className="text-emerald-400 truncate">http://localhost:4000/webhooks/github</div>
            <div className="text-slate-500 text-[11px] pt-1">Least-Privilege Scope:</div>
            <div className="text-purple-400">Contents: R/W • Pull Requests: R/W</div>
          </div>
        </div>

        {/* Google Antigravity Agent Provider Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-white">Google Antigravity</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono">
              ACTIVE PROVIDER
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Decoupled coding agent provider adapter. Runs bounded investigations and targeted fixes inside ephemeral containers.
          </p>
          <div className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-slate-300 space-y-1">
            <div className="text-slate-500 text-[11px]">Provider Architecture:</div>
            <div className="text-cyan-400">CodingAgentAdapter Interface</div>
            <div className="text-slate-500 text-[11px] pt-1">Model / Adapter:</div>
            <div className="text-amber-400">Gemini 3.8 Flash (High)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

