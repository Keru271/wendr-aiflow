'use client';

import React, { useState } from 'react';
import { Plug, CheckCircle2, Copy, Check, ExternalLink, ShieldAlert } from 'lucide-react';

export default function IntegrationsPage() {
  const [copiedJira, setCopiedJira] = useState(false);
  const [copiedGithub, setCopiedGithub] = useState(false);

  const copyToClipboard = (text: string, type: 'jira' | 'github') => {
    navigator.clipboard.writeText(text);
    if (type === 'jira') {
      setCopiedJira(true);
      setTimeout(() => setCopiedJira(false), 2000);
    } else {
      setCopiedGithub(true);
      setTimeout(() => setCopiedGithub(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Plug className="w-5 h-5 text-cyan-400" />
          <span>Integrations & Webhooks</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure Jira Cloud webhook endpoints, GitHub repository access, and the Google Antigravity coding engine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Jira Cloud Card */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                J
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Jira Cloud</h3>
                <span className="text-[11px] text-slate-400">Atlassian webhook listener</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              CONNECTED
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            FixPilot receives bug tickets with label <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded">ai-fix-opt-in</code> and updates comments with investigation and PR links.
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="text-slate-400 font-medium">Webhook URL:</div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
              <span className="truncate flex-1">/api/webhooks/jira</span>
              <button
                onClick={() => copyToClipboard('https://your-domain.netlify.app/api/webhooks/jira', 'jira')}
                className="p-1 hover:text-white text-slate-400"
              >
                {copiedJira ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* GitHub App Card */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold">
                GH
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">GitHub Integration</h3>
                <span className="text-[11px] text-slate-400">Repository & PR Manager</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              CONNECTED
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            FixPilot creates isolated branches, commits minimal verified diffs, and opens Pull Requests with automated QA tables.
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="text-slate-400 font-medium">Webhook URL:</div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
              <span className="truncate flex-1">/api/webhooks/github</span>
              <button
                onClick={() => copyToClipboard('https://your-domain.netlify.app/api/webhooks/github', 'github')}
                className="p-1 hover:text-white text-slate-400"
              >
                {copiedGithub ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Google Antigravity Card */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                AG
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Google Antigravity</h3>
                <span className="text-[11px] text-slate-400">Autonomous Coding Engine</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ACTIVE
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Antigravity agent investigates bugs, navigates codebase repositories, generates scoped fixes, and builds regression tests.
          </p>

          <div className="space-y-1 text-xs text-slate-400">
            <div>• Execution Sandbox: <span className="text-slate-200">Isolated Workspace</span></div>
            <div>• Least Privilege: <span className="text-slate-200">No Prod Credentials</span></div>
            <div>• Token Rate Limiting: <span className="text-slate-200">Enabled</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
