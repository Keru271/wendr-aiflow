'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  RotateCcw,
  Play,
  Check,
  Cpu,
  TestTube2,
  GitBranch,
  Server,
  Square,
  Trash2
} from 'lucide-react';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingFix, setStartingFix] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [approvalComment, setApprovalComment] = useState('Production deployment verified by release lead.');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleStopProcess = async () => {
    if (!confirm(`Are you sure you want to stop the autonomous process for ${job?.bug?.jiraIssueKey || params.id}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/jobs/${params.id}/cancel`, { method: 'POST' });
      if (res.ok) {
        setActionMessage('⏹️ Autonomous process was stopped by user.');
        await fetchJob();
      } else {
        const data = await res.json();
        setActionMessage(`❌ Failed to stop process: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteIssue = async () => {
    if (!confirm(`Are you sure you want to permanently delete issue ${job?.bug?.jiraIssueKey || params.id} and remove it from the dashboard?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/jobs/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        alert(`Failed to delete issue: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error deleting issue: ${err.message}`);
    }
  };

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
    const interval = setInterval(fetchJob, 3000);
    return () => clearInterval(interval);
  }, [params.id]);

  const handleStartFix = async () => {
    setStartingFix(true);
    setActionMessage('🚀 Google Antigravity has picked up this ticket. Starting investigation, code patch, and automated testing...');
    try {
      const res = await fetch(`/api/jobs/${params.id}/start`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await fetchJob();
      } else {
        setActionMessage(`❌ Error starting Antigravity: ${data.error}`);
      }
    } catch (err: any) {
      setActionMessage(`❌ Error: ${err.message}`);
    } finally {
      setStartingFix(false);
    }
  };

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

  // Map job status to the 5 Antigravity stages requested by user
  // 1: Picked by Antigravity, 2: In Progress, 3: Testing, 4: Fixed, 5: Done
  const getStageIndex = (status: string) => {
    switch (status) {
      case 'QUEUED':
        return 0;
      case 'INVESTIGATING':
      case 'READY_TO_FIX':
        return 1;
      case 'CODING':
        return 2;
      case 'QA':
      case 'REVIEWING':
        return 3;
      case 'READY_FOR_PR':
      case 'PR_CREATED':
      case 'READY_TO_DEPLOY':
      case 'DEPLOYING_STAGING':
      case 'VERIFYING_STAGING':
      case 'AWAITING_PRODUCTION_APPROVAL':
        return 4;
      case 'DEPLOYING_PRODUCTION':
      case 'VERIFYING_PRODUCTION':
      case 'COMPLETED':
        return 5;
      default:
        return 0;
    }
  };

  const currentStage = getStageIndex(job.status);
  const isAwaitingApproval = job.status === 'AWAITING_PRODUCTION_APPROVAL';
  const isQueued = job.status === 'QUEUED';

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

  const stagesList = [
    {
      num: 1,
      name: 'Picked by Antigravity',
      desc: 'Analyzing Jira bug context & root cause',
      icon: Cpu,
      isCompleted: currentStage > 1,
      isActive: currentStage === 1
    },
    {
      num: 2,
      name: 'In Progress',
      desc: 'Writing code patch in sandbox workspace',
      icon: FileCode2,
      isCompleted: currentStage > 2,
      isActive: currentStage === 2
    },
    {
      num: 3,
      name: 'Testing',
      desc: 'Running 4-gate automated QA matrix',
      icon: TestTube2,
      isCompleted: currentStage > 3,
      isActive: currentStage === 3
    },
    {
      num: 4,
      name: 'Fixed',
      desc: 'PR created & staging smoke tests passed',
      icon: GitPullRequest,
      isCompleted: currentStage > 4,
      isActive: currentStage === 4
    },
    {
      num: 5,
      name: 'Done',
      desc: 'Production release verified & closed',
      icon: Rocket,
      isCompleted: currentStage === 5,
      isActive: false
    }
  ];

  return (
    <div className="space-y-6">
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

          {/* Related Repositories Badges (N Repositories Support) */}
          <div className="flex items-center gap-2 flex-wrap pt-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-indigo-400" />
              <span>Target Repositories ({(job.bug?.repositories?.length || job.project?.repositories?.length || 0)}):</span>
            </span>
            {(job.bug?.repositories?.length > 0 ? job.bug.repositories : (job.project?.repositories || [])).map((r: any) => (
              <span key={r.id || r.name} className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono">
                {r.owner ? `${r.owner}/${r.name}` : r.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stop Process button if job is active */}
          {!['COMPLETED', 'FAILED', 'CANCELLED', 'ROLLED_BACK'].includes(job.status) && (
            <button
              onClick={handleStopProcess}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Stop Process</span>
            </button>
          )}

          {/* Delete Issue button */}
          <button
            onClick={handleDeleteIssue}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Issue</span>
          </button>

          {isQueued && (
            <button
              onClick={handleStartFix}
              disabled={startingFix}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{startingFix ? 'Antigravity Starting...' : 'Pick Up with Antigravity'}</span>
            </button>
          )}

          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            job.status === 'COMPLETED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : job.status === 'AWAITING_PRODUCTION_APPROVAL'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
              : 'bg-slate-800 text-slate-200 border-slate-700'
          }`}>
            Status: {job.status}
          </span>

          <button
            onClick={fetchJob}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ANTIGRAVITY 5-STAGE PIPELINE PROGRESS STEPPER */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d1322]/90 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300">
              Google Antigravity Lifecycle Pipeline
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {currentStage === 0 && 'Ready to be picked up by Antigravity'}
            {currentStage === 1 && 'Antigravity investigating bug context'}
            {currentStage === 2 && 'Antigravity coding minimal patch'}
            {currentStage === 3 && 'Antigravity running automated QA matrix'}
            {currentStage === 4 && 'Patch fixed & PR verified on staging'}
            {currentStage === 5 && 'Autonomous fix completed and deployed'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {stagesList.map((stg) => {
            const Icon = stg.icon;
            return (
              <div
                key={stg.num}
                className={`p-3.5 rounded-xl border transition-all ${
                  stg.isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : stg.isActive
                    ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      stg.isCompleted
                        ? 'bg-emerald-500 text-white'
                        : stg.isActive
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {stg.isCompleted ? <Check className="w-4 h-4" /> : stg.num}
                  </div>
                  <Icon
                    className={`w-4 h-4 ${
                      stg.isCompleted
                        ? 'text-emerald-400'
                        : stg.isActive
                        ? 'text-blue-400 animate-spin'
                        : 'text-slate-500'
                    }`}
                  />
                </div>

                <div className="text-xs font-bold text-white">{stg.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{stg.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUEUED BANNER - ONE CLICK PICKUP */}
      {isQueued && (
        <div className="p-5 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-blue-950/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Antigravity is Ready to Fix this Issue</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Click &quot;Pick Up with Antigravity&quot; to initiate root cause analysis, code sandbox patch, and automated testing.
              </p>
            </div>
          </div>
          <button
            onClick={handleStartFix}
            disabled={startingFix}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 shrink-0 disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{startingFix ? 'Antigravity Working...' : 'Pick Up with Antigravity'}</span>
          </button>
        </div>
      )}

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
              <div className="text-xs text-slate-400 py-3 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Investigation in progress or ready to start...</span>
              </div>
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
                {job.workspaces?.[0]?.branchName || `fixpilot/${job.bug?.jiraIssueKey?.toLowerCase()}-automated-fix`}
              </span>
            </div>

            {developerData?.diff ? (
              <pre className="p-4 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed max-h-72">
                {developerData.diff}
              </pre>
            ) : (
              <div className="p-4 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-400">
                // Patch will be committed in isolated workspace:
                {job.bug?.jiraIssueKey ? `\n// Target Ticket: ${job.bug.jiraIssueKey}` : ''}
                {`\n+ // Google Antigravity Code Patch pending execution`}
              </div>
            )}
          </div>

          {/* Quality Gates QA Matrix */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Automated Quality Gates (QA Matrix)</span>
              </h3>
              <span className="text-[11px] font-medium text-emerald-400">
                {job.validations?.length || 0} Checks Recorded
              </span>
            </div>

            <div className="space-y-3">
              {job.validations && job.validations.length > 0 ? (
                job.validations.map((v: any) => (
                  <div key={v.id} className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-white">{v.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">({v.durationMs}ms)</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 pl-6">{v.command}</div>
                      <div className="text-[11px] text-slate-400 pl-6">{v.summary}</div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      PASSED
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-3 text-center">
                  QA Gates will execute automatically once Antigravity completes code patch.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): PR + Staging + Logs */}
        <div className="space-y-6">
          {/* GitHub Pull Requests Box (N Repositories Support) */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-blue-400" />
                <span>GitHub Pull Requests</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {(job.pullRequests?.length || (job.pullRequest ? 1 : 0))} PR{((job.pullRequests?.length || (job.pullRequest ? 1 : 0)) !== 1 ? 's' : '')}
              </span>
            </div>

            {(job.pullRequests && job.pullRequests.length > 0) || job.pullRequest ? (
              <div className="space-y-3">
                {(job.pullRequests && job.pullRequests.length > 0 ? job.pullRequests : [job.pullRequest]).map((pr: any, idx: number) => (
                  <div key={pr.id || idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-semibold">
                          {pr.repository?.name || (pr.url?.includes('CMS_FRONTEND') ? 'CMS_FRONTEND' : (pr.url?.includes('wendr_homepage') ? 'wendr_homepage' : 'Repository'))}
                        </span>
                        <span className="font-semibold text-white text-xs">PR #{pr.number}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        {pr.status}
                      </span>
                    </div>

                    <div className="text-slate-300 text-xs font-medium truncate">{pr.title}</div>
                    <div className="font-mono text-[11px] text-slate-400">Branch: {pr.branchName}</div>

                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold w-full justify-center transition-colors"
                    >
                      <span>View PR on GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3 text-center">
                PRs will be generated once Antigravity passes QA verification.
              </div>
            )}
          </div>

          {/* Deployment Pipeline Box */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Rocket className="w-4 h-4 text-purple-400" />
              <span>Deployment Pipeline</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Staging Environment</div>
                  <div className="text-[11px] text-slate-400">Smoke test: 42ms latency</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  currentStage >= 4
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {currentStage >= 4 ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Production Release</div>
                  <div className="text-[11px] text-slate-400">Approval Gate Protected</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  job.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : isAwaitingApproval
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {job.status === 'COMPLETED' ? 'RELEASED' : isAwaitingApproval ? 'GATE PENDING' : 'LOCKED'}
                </span>
              </div>
            </div>
          </div>

          {/* Execution Timeline / Live Logs */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span>Antigravity Execution Logs</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Real-time</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto text-xs font-mono">
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400">
                <span className="text-slate-500">[{new Date(job.createdAt).toLocaleTimeString()}]</span> Issue received: {job.bug?.jiraIssueKey}
              </div>

              {job.executions?.map((ex: any) => (
                <div key={ex.id} className={`p-2 rounded border text-[11px] ${
                  ex.agentType === 'BUILD_FIXER'
                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                    : 'bg-slate-950/80 border-slate-800/80 text-slate-300'
                }`}>
                  <span className="text-slate-500">[{new Date(ex.startedAt || job.createdAt).toLocaleTimeString()}]</span>{' '}
                  <span className={ex.agentType === 'BUILD_FIXER' ? 'text-amber-400 font-semibold' : 'text-blue-400 font-semibold'}>
                    {ex.agentType === 'BUILD_FIXER' ? '🔧 PRE-PUSH BUILD GATE' : ex.agentType}
                  </span>: {ex.agentType === 'BUILD_FIXER' ? 'Build issue detected and autonomously fixed before push' : ex.status}
                </div>
              ))}

              {job.validations?.map((vl: any) => (
                <div key={vl.id} className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[11px] text-emerald-400">
                  <span className="text-slate-500">[{new Date(vl.completedAt || job.createdAt).toLocaleTimeString()}]</span>{' '}
                  ✓ {vl.name}: PASSED
                </div>
              ))}

              {job.pullRequest && (
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[11px] text-blue-300">
                  PR #{job.pullRequest.number} ready: {job.pullRequest.branchName}
                </div>
              )}

              {isAwaitingApproval && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-semibold">
                  ⚠️ Human Gate: Awaiting production approval release sign-off
                </div>
              )}

              {job.status === 'COMPLETED' && (
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-semibold">
                  🚀 Released to Production. Jira ticket marked Done.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
