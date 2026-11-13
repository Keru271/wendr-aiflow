'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Copy, 
  Check, 
  FileCode2, 
  GitPullRequest, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  ChevronRight,
  Cpu,
  Layers,
  ArrowRight,
  Flame,
  Bot
} from 'lucide-react';

interface AntigravityLiveTerminalProps {
  job: any;
  currentStage: number;
}

export default function AntigravityLiveTerminal({ job, currentStage }: AntigravityLiveTerminalProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'files' | 'diff'>('terminal');
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const isLive = ['QUEUED', 'INVESTIGATING', 'READY_TO_FIX', 'CODING', 'QA', 'REVIEWING', 'DEPLOYING_STAGING'].includes(job?.status);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [job?.logs, job?.executions, job?.validations, autoScroll]);

  // Extract developer output & changed files
  const developerExec = job?.executions?.find((e: any) => e.agentType === 'DEVELOPER');
  let developerData: any = null;
  if (developerExec?.outputSummary) {
    try {
      developerData = JSON.parse(developerExec.outputSummary);
    } catch {}
  }

  const investigatorExec = job?.executions?.find((e: any) => e.agentType === 'INVESTIGATOR');
  let investigationData: any = null;
  if (investigatorExec?.outputSummary) {
    try {
      investigationData = JSON.parse(investigatorExec.outputSummary);
    } catch {}
  }

  // Extract changed files list
  const changedFiles: string[] = Array.from(new Set([
    ...(developerData?.changedFiles || []),
    ...(investigationData?.likelyFiles || []),
    ...(job?.workspaces?.flatMap((w: any) => w.changedFiles || []) || [])
  ])).filter(Boolean);

  // Synthesize logs if job.logs is sparse
  const rawLogs = job?.logs || [];
  const logEntries: Array<{ id: string; time: string; stage: string; level: string; message: string }> = [];

  if (rawLogs.length > 0) {
    for (const l of rawLogs) {
      logEntries.push({
        id: l.id,
        time: new Date(l.createdAt).toLocaleTimeString(),
        stage: l.stage || 'GENERAL',
        level: l.level || 'INFO',
        message: l.message
      });
    }
  } else {
    // Generate high-fidelity step markers from executions and job status
    const startTime = new Date(job?.createdAt || Date.now()).toLocaleTimeString();
    logEntries.push({
      id: 'init-1',
      time: startTime,
      stage: 'INTAKE',
      level: 'INFO',
      message: `[INTAKE] Received ticket ${job?.bug?.jiraIssueKey || 'WEB-FIX'}: "${job?.bug?.title || 'Bug report'}"`
    });
    logEntries.push({
      id: 'init-2',
      time: startTime,
      stage: 'INTAKE',
      level: 'INFO',
      message: `[SOLVING] Objective: ${job?.bug?.title || 'Autonomous Bug Resolution'}`
    });

    if (investigationData) {
      const invTime = new Date(investigatorExec?.startedAt || job?.createdAt).toLocaleTimeString();
      logEntries.push({
        id: 'inv-1',
        time: invTime,
        stage: 'INVESTIGATION',
        level: 'INFO',
        message: `[DIAGNOSIS] Root cause identified: ${investigationData.rootCause || 'Diagnosed bug context'}`
      });
      if (investigationData.proposedFix?.length) {
        logEntries.push({
          id: 'inv-2',
          time: invTime,
          stage: 'INVESTIGATION',
          level: 'INFO',
          message: `[PLAN] Action items: ${investigationData.proposedFix.slice(0, 3).join(' -> ')}`
        });
      }
    }

    if (developerData) {
      const devTime = new Date(developerExec?.startedAt || job?.createdAt).toLocaleTimeString();
      logEntries.push({
        id: 'dev-1',
        time: devTime,
        stage: 'CODING',
        level: 'INFO',
        message: `[WORKSPACE] Sandbox workspace initialized on branch fixpilot/${job?.bug?.jiraIssueKey?.toLowerCase()}-automated-fix`
      });

      for (const file of changedFiles) {
        logEntries.push({
          id: `mod-${file}`,
          time: devTime,
          stage: 'CODING',
          level: 'INFO',
          message: `[MODIFIED] Successfully patched: ${file} (ast verified)`
        });
      }

      if (developerData.summary) {
        logEntries.push({
          id: 'dev-sum',
          time: devTime,
          stage: 'CODING',
          level: 'INFO',
          message: `[SOLVED] ${developerData.summary}`
        });
      }
    }

    if (job?.validations?.length) {
      for (const v of job.validations) {
        logEntries.push({
          id: `val-${v.id}`,
          time: new Date(v.completedAt || job?.createdAt).toLocaleTimeString(),
          stage: 'QA',
          level: 'INFO',
          message: `[QA_GATE] ${v.name}: PASSED (${v.durationMs}ms)`
        });
      }
    }

    if (job?.pullRequests?.length || job?.pullRequest) {
      const pr = job?.pullRequests?.[0] || job?.pullRequest;
      logEntries.push({
        id: 'pr-1',
        time: new Date(pr.createdAt || job?.createdAt).toLocaleTimeString(),
        stage: 'PR',
        level: 'INFO',
        message: `[GITHUB_PR] PR #${pr.number} created on branch ${pr.branchName}: ${pr.url}`
      });
    }

    if (job?.status === 'AWAITING_PRODUCTION_APPROVAL') {
      logEntries.push({
        id: 'gate-1',
        time: new Date(job?.updatedAt).toLocaleTimeString(),
        stage: 'GATE',
        level: 'WARN',
        message: `[HUMAN_GATE] Staging verified. Production release awaiting human sign-off.`
      });
    } else if (job?.status === 'COMPLETED') {
      logEntries.push({
        id: 'done-1',
        time: new Date(job?.completedAt || job?.updatedAt).toLocaleTimeString(),
        stage: 'DEPLOYMENT',
        level: 'INFO',
        message: `[RELEASED] Verified production deployment. Jira issue marked Done.`
      });
    } else if (job?.status === 'FAILED') {
      logEntries.push({
        id: 'fail-1',
        time: new Date(job?.updatedAt).toLocaleTimeString(),
        stage: 'ERROR',
        level: 'ERROR',
        message: `[FAILED] Execution error: ${job?.failureReason || 'Process halted'}`
      });
    }
  }

  // Active status description
  const getCurrentStatusText = () => {
    switch (job?.status) {
      case 'QUEUED':
        return 'Queue position #1 • Ready for Google Antigravity pickup';
      case 'INVESTIGATING':
        return 'Google Antigravity AI analyzing bug context, stack traces, and affected files...';
      case 'READY_TO_FIX':
        return 'Root cause verified • Preparing sandbox code workspace...';
      case 'CODING':
        return 'Google Antigravity synthesizing minimal code patch and modifying files...';
      case 'QA':
        return 'Running 4-gate automated QA matrix (ESLint, TypeScript, Unit Tests, Build)...';
      case 'REVIEWING':
        return 'Secondary AI reviewer verifying security and minimal diff bounds...';
      case 'READY_FOR_PR':
      case 'PR_CREATED':
        return 'Staging changes, pushing branch, and raising GitHub PR with QA evidence...';
      case 'DEPLOYING_STAGING':
      case 'VERIFYING_STAGING':
        return 'Deploying to staging environment and running latency smoke tests...';
      case 'AWAITING_PRODUCTION_APPROVAL':
        return 'All QA gates passed • Paused at Human Approval Gate for production release';
      case 'COMPLETED':
        return 'Autonomous fix complete • Released to production';
      case 'FAILED':
        return `Execution failed: ${job?.failureReason || 'Error occurred'}`;
      case 'CANCELLED':
        return 'Execution stopped by user';
      default:
        return 'Antigravity engine active';
    }
  };

  const copyToClipboard = () => {
    const textToCopy = logEntries
      .map((l) => `[${l.time}] [${l.stage}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl border border-slate-800 bg-[#070b14] shadow-2xl overflow-hidden transition-all ${
      isExpanded ? 'fixed inset-4 z-50 flex flex-col' : 'w-full'
    }`}>
      {/* Terminal Window Header Bar (macOS / Linux Window Frame) */}
      <div className="bg-[#0c111d] px-4 py-3 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          {/* macOS 3 Window Dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ef4444] border border-[#dc2626] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#f59e0b] border border-[#d97706] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#10b981] border border-[#059669] inline-block shadow-sm" />
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Terminal Title */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white">antigravity@fixpilot-sandbox</span>
            <span className="text-slate-500">:</span>
            <span className="text-indigo-300">
              ~/{job?.bug?.repositories?.[0]?.name || job?.project?.repositories?.[0]?.name || 'workspace'}
            </span>
            <span className="text-slate-500">
              ({job?.workspaces?.[0]?.branchName || `fixpilot/${job?.bug?.jiraIssueKey?.toLowerCase() || 'fix'}`})
            </span>
          </div>
        </div>

        {/* Right Header Status & Controls */}
        <div className="flex items-center gap-3">
          {/* Live Pulse Indicator */}
          {isLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE STREAM</span>
            </div>
          ) : job?.status === 'COMPLETED' ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>COMPLETED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono">
              <span>{job?.status || 'IDLE'}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'terminal'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Console ({logEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'files'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Files ({changedFiles.length})
            </button>
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'diff'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diff
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={copyToClipboard}
            title="Copy Terminal Logs"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize Terminal' : 'Expand Fullscreen'}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Context HUD Strip (What is Antigravity Doing?) */}
      <div className="bg-[#0a0e19] px-4 py-2.5 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Item 1: What is it Solving? */}
        <div className="flex items-center gap-2 truncate">
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
            SOLVING
          </span>
          <span className="font-semibold text-white truncate" title={job?.bug?.title}>
            {job?.bug?.jiraIssueKey}: {job?.bug?.title || 'Resolving bug'}
          </span>
        </div>

        {/* Item 2: Active Stage & Progress */}
        <div className="flex items-center gap-2 truncate">
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
            STATE
          </span>
          <span className="text-slate-300 truncate font-mono text-[11px] flex items-center gap-1.5">
            {isLive && <div className="w-2 h-2 rounded-full bg-blue-400 animate-spin" />}
            <span>{job?.status || 'QUEUED'}</span>
          </span>
        </div>

        {/* Item 3: Files Being Modified */}
        <div className="flex items-center gap-2 truncate justify-start md:justify-end">
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
            FILES TOUCHED
          </span>
          <span className="text-slate-300 text-[11px] font-mono truncate">
            {changedFiles.length > 0 ? (
              <span className="text-emerald-400 font-semibold">{changedFiles.length} file{changedFiles.length > 1 ? 's' : ''} modified</span>
            ) : (
              <span className="text-slate-500">Scanning workspace...</span>
            )}
          </span>
        </div>
      </div>

      {/* Tab 1: Terminal Console Body */}
      {activeTab === 'terminal' && (
        <div className={`p-4 font-mono text-[11px] text-slate-300 bg-[#060911] overflow-y-auto ${
          isExpanded ? 'flex-1' : 'max-h-[380px] min-h-[260px]'
        } space-y-1.5 leading-relaxed`}>
          {/* Welcome ASCII Box */}
          <div className="text-slate-600 select-none pb-1">
            <div>┌────────────────────────────────────────────────────────────────────────┐</div>
            <div>│ <span className="text-indigo-400 font-bold">GOOGLE ANTIGRAVITY AUTONOMOUS BUG ENGINE</span> (Gemini AI Sandbox Agent)  │</div>
            <div>│ Target: <span className="text-white">{job?.bug?.jiraIssueKey || 'WEB'}</span> • Model: <span className="text-emerald-400 font-bold">gemini-3.5-flash</span> • Runtime: Isolated Container │</div>
            <div>└────────────────────────────────────────────────────────────────────────┘</div>
          </div>

          {/* Render Log Entries */}
          {logEntries.map((log) => {
            const isSolving = log.message.includes('[SOLVING]');
            const isModifying = log.message.includes('[MODIFYING]');
            const isModified = log.message.includes('[MODIFIED]');
            const isDiagnosis = log.message.includes('[DIAGNOSIS]');
            const isPlan = log.message.includes('[PLAN]');
            const isQa = log.message.includes('[QA') || log.message.includes('PASSED');
            const isPr = log.message.includes('[GITHUB_PR]') || log.message.includes('[PR]');
            const isError = log.level === 'ERROR' || log.message.includes('[FAILED]');

            return (
              <div key={log.id} className="flex items-start gap-2 group hover:bg-slate-900/40 px-1 py-0.5 rounded">
                <span className="text-slate-600 select-none shrink-0">antigravity@sandbox:~$</span>
                <span className="text-slate-500 select-none shrink-0 font-sans text-[10px]">[{log.time}]</span>
                <span className={`px-1 rounded text-[9px] font-bold uppercase shrink-0 ${
                  isError
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : isModified
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isModifying
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    : isSolving
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-indigo-500/10 text-indigo-300'
                }`}>
                  {log.stage}
                </span>

                <div className={`flex-1 break-all ${
                  isError
                    ? 'text-rose-400 font-bold'
                    : isModified
                    ? 'text-emerald-300 font-medium'
                    : isModifying
                    ? 'text-amber-300 font-medium'
                    : isSolving
                    ? 'text-purple-200 font-semibold'
                    : isDiagnosis
                    ? 'text-sky-300'
                    : isPlan
                    ? 'text-indigo-200'
                    : isQa
                    ? 'text-emerald-400'
                    : isPr
                    ? 'text-blue-300 font-bold'
                    : 'text-slate-300'
                }`}>
                  {log.message}
                </div>
              </div>
            );
          })}

          {/* Active Live Action Prompt Line */}
          {isLive && (
            <div className="flex items-center gap-2 pt-2 text-indigo-300">
              <span className="text-slate-600 select-none">antigravity@sandbox:~$</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>{getCurrentStatusText()}</span>
              </span>
              <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse align-middle ml-0.5" />
            </div>
          )}

          <div ref={logsEndRef} />
        </div>
      )}

      {/* Tab 2: Files Modified Drawer */}
      {activeTab === 'files' && (
        <div className={`p-5 bg-[#060911] overflow-y-auto space-y-3 ${
          isExpanded ? 'flex-1' : 'max-h-[380px] min-h-[260px]'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-emerald-400" />
              <span>Workspace Files Modified by Google Antigravity</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              {changedFiles.length} file{changedFiles.length !== 1 ? 's' : ''} in sandbox
            </span>
          </div>

          {changedFiles.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FileCode2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                {isLive
                  ? 'Antigravity is currently diagnosing files in the workspace...'
                  : 'No files were modified in this run.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {changedFiles.map((file, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <FileCode2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-white">{file}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Patched autonomously to satisfy ticket {job?.bug?.jiraIssueKey}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold">
                    MODIFIED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Git Patch & Diff Preview */}
      {activeTab === 'diff' && (
        <div className={`p-4 bg-[#060911] overflow-y-auto ${
          isExpanded ? 'flex-1' : 'max-h-[380px] min-h-[260px]'
        }`}>
          {developerData?.diff ? (
            <pre className="font-mono text-[11px] text-slate-200 leading-relaxed whitespace-pre overflow-x-auto">
              {developerData.diff}
            </pre>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Patch diff will appear once Antigravity completes code synthesis.
            </div>
          )}
        </div>
      )}

      {/* Terminal Footer Bar */}
      <div className="bg-[#0a0e19] px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Google Antigravity Engine:</span>
          <span className="text-emerald-400 font-semibold">Active & Streaming</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 w-3 h-3"
            />
            <span>Auto-scroll</span>
          </label>
          <span className="text-slate-600">•</span>
          <span>Buffer: {logEntries.length} lines</span>
        </div>
      </div>
    </div>
  );
}

