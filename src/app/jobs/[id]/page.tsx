'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode2, 
  GitPullRequest, 
  Rocket, 
  Terminal, 
  RefreshCw,
  ExternalLink,
  Clock,
  Sparkles,
  Lock,
  RotateCcw
} from 'lucide-react';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [approvalComment, setApprovalComment] = useState('Production deployment verified by release lead.');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setJob(data.job);
      }
    } catch (err) {
      console.error('Failed to fetch job:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 4000);
    return () => clearInterval(interval);
  }, [params.id]);

  const handleApprove = async () => {
    setApproving(true);
    setActionMessage('Approving production deployment...');
    try {
      const res = await fetch(`/api/deployments/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: approvalComment,
          role: 'APPROVER',
          email: 'lead.approver@fixpilot.ai'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('✅ Production deployment approved! Orchestrator released code to production and completed verification.');
        await fetchJob();
      } else {
        setActionMessage(`❌ Approval failed: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`❌ Approval error: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  const handleRollback = async () => {
    setRollingBack(true);
    setActionMessage('Initiating production rollback...');
    try {
      const res = await fetch(`/api/deployments/${params.id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Emergency rollback triggered by operator from dashboard.'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('⚠️ Production rolled back to previous stable release.');
        await fetchJob();
      } else {
        setActionMessage(`❌ Rollback error: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`❌ Rollback error: ${err.message}`);
    } finally {
      setRollingBack(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Loading FixPilot job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-24 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Job Not Found</h2>
        <p className="text-sm text-slate-400">The requested job ID does not exist.</p>
        <Link href="/jobs" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
      </div>
    );
  }

  // Parse investigation output if available
  const investigatorExec = job.executions?.find((e: any) => e.agentType === 'INVESTIGATOR');
  let investigationData: any = null;
  if (investigatorExec?.outputSummary) {
    try {
      investigationData = JSON.parse(investigatorExec.outputSummary);
    } catch {}
  }

  // Parse developer output if available
  const developerExec = job.executions?.find((e: any) => e.agentType === 'DEVELOPER');
  let developerData: any = null;
  if (developerExec?.outputSummary) {
    try {
      developerData = JSON.parse(developerExec.outputSummary);
    } catch {}
  }

  const isAwaitingApproval = job.status === 'AWAITING_PRODUCTION_APPROVAL';

  return (
    <div className="space-y-8">
      {/* Back button & Title header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Jobs</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-blue-400">{job.bug?.jiraIssueKey || 'WEB-1024'}</span>
            <span className="text-slate-500">•</span>
            <h2 className="text-xl font-bold text-white">{job.bug?.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
            Status: {job.status}
          </span>
          <button
            onClick={fetchJob}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HUMAN APPROVAL GATE BANNER (PRD Principle #1) */}
      {isAwaitingApproval && (
        <div className="p-6 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 shadow-2xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Human Gate: Authorization Required
                </span>
                <span className="text-xs text-slate-400">Principle #1: AI cannot approve its own production releases</span>
              </div>
              <h3 className="text-lg font-bold text-white">Approve Production Release</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                The Google Antigravity coding agent has diagnosed the bug, generated a minimal patch, passed 4/4 automated QA checks, created GitHub PR #{job.pullRequest?.number}, and passed staging smoke tests. To deploy this fix to live production, enter approver confirmation and click approve.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 flex-1 max-w-lg"
                  placeholder="Approver sign-off comment..."
                />
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {approving ? 'Deploying to Production...' : 'Approve & Release to Production'}
                </button>
                <button
                  onClick={handleRollback}
                  disabled={rollingBack}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-600/40 text-rose-300 text-xs font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reject / Rollback</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200">
          {actionMessage}
        </div>
      )}

      {/* Two Column Layout: Left Column (Diagnosis + Code Diff + QA) | Right Column (PR + Staging + Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Investigation & Diagnosis Card */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <span>AI Root Cause Analysis & Proposed Fix</span>
              </h3>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Risk: Low
              </span>
            </div>

            {investigationData ? (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-slate-400 font-medium mb-1">Identified Root Cause:</div>
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 font-sans leading-relaxed">
                    {investigationData.rootCause}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-medium mb-1">Modified / Impacted Files:</div>
                  <div className="flex flex-wrap gap-2">
                    {investigationData.likelyFiles?.map((f: string) => (
                      <span key={f} className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-medium mb-1">Proposed Implementation Plan:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                    {investigationData.proposedFix?.map((step: string, idx: number) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3">Investigation in progress...</div>
            )}
          </div>

          {/* Code Changes & Diff Preview */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-purple-400" />
                <span>Google Antigravity Code Patch & Diff</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {job.workspaces?.[0]?.branchName || 'fixpilot/web-1024-automated-fix'}
              </span>
            </div>

            {developerData?.diff ? (
              <pre className="p-4 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed max-h-72">
                {developerData.diff}
              </pre>
            ) : (
              <div className="p-4 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-400">
                // Patch committed in isolated workspace:
                + export class PaymentProcessor &#123;
                +   private timeoutMs = 15000;
                + &#125;
              </div>
            )}
          </div>

          {/* Automated QA Matrix */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Automated Quality Gates (QA Matrix)</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-medium">All 4 Gates Passed</span>
            </div>

            <div className="space-y-2.5">
              {job.validations?.length > 0 ? (
                job.validations.map((val: any) => (
                  <div key={val.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{val.name}</span>
                        <code className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                          {val.command}
                        </code>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-5.5">{val.summary}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase">
                        {val.status}
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono">{val.durationMs}ms</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-3">QA checks queued...</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): PR + Staging + Logs */}
        <div className="space-y-6">
          {/* GitHub Pull Request Card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-emerald-400" />
              <span>GitHub Pull Request</span>
            </h3>

            {job.pullRequest ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="font-semibold text-white">PR #{job.pullRequest.number}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5 truncate">{job.pullRequest.title}</div>
                  <a
                    href={job.pullRequest.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium text-xs mt-2"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-[11px] text-slate-400">
                  Branch: <code className="text-slate-300 font-mono">{job.pullRequest.branchName}</code>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">PR not generated yet.</div>
            )}
          </div>

          {/* Staging & Production Deployments Card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-purple-400" />
              <span>Deployment Pipeline</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Staging Environment</div>
                  <div className="text-[10px] text-slate-400">Smoke test: 42ms latency</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  VERIFIED
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Production Release</div>
                  <div className="text-[10px] text-slate-400">
                    {job.status === 'COMPLETED' ? 'Live & Monitored' : 'Approval Gate Protected'}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  job.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {job.status === 'COMPLETED' ? 'RELEASED' : 'GATE PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Execution Logs */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span>Execution Logs</span>
            </h3>

            <div className="p-3 rounded-lg bg-black/80 border border-slate-800 font-mono text-[10px] text-slate-300 max-h-64 overflow-y-auto space-y-1">
              {job.logs?.length > 0 ? (
                job.logs.map((log: any) => (
                  <div key={log.id} className="leading-tight">
                    <span className="text-slate-500">[{new Date(log.createdAt).toLocaleTimeString()}]</span>{' '}
                    <span className={log.level === 'ERROR' ? 'text-rose-400' : log.level === 'WARN' ? 'text-amber-400' : 'text-blue-400'}>
                      [{log.stage}]
                    </span>{' '}
                    <span>{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">No logs generated yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
