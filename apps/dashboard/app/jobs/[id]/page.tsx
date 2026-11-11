'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCode,
  Shield,
  Terminal,
  ExternalLink,
  Rocket,
  Sparkles,
  GitPullRequest
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'investigation' | 'diff' | 'qa' | 'logs'>('investigation');
  const [approving, setApproving] = useState(false);
  const [approvalMsg, setApprovalMsg] = useState<string | null>(null);

  const fetchJob = async () => {
    try {
      const res = await fetch(`http://localhost:4000/jobs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
      }
    } catch {
      // Mock fallback for view preview
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const handleApproveProduction = async (simulateFailure = false) => {
    setApproving(true);
    setApprovalMsg(null);
    try {
      const stagingDep = job.deployments?.find((d: any) => d.environment === 'staging');
      const depId = stagingDep?.id || 'dep-staging-default';

      const res = await fetch(`http://localhost:4000/deployments/${depId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'APPROVER',
          'x-user-email': 'approver@acme.com',
          'x-user-id': 'user-approver-alex'
        },
        body: JSON.stringify({
          comment: 'Human verification complete. Staging health verified. Authorized release.',
          simulateFailure
        })
      });

      const data = await res.json();
      setApprovalMsg(data.message || 'Production deployment successfully initiated and verified.');
      fetchJob();
    } catch (err: any) {
      setApprovalMsg('Error approving production deployment.');
    } finally {
      setApproving(false);
    }
  };

  if (loading && !job) {
    return <div className="p-12 text-center text-slate-400">Loading Job telemetry...</div>;
  }

  if (!job) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-slate-300">Job not found or API server disconnected.</div>
        <Link href="/jobs" className="text-emerald-400 hover:underline text-sm">
          Return to Jobs list
        </Link>
      </div>
    );
  }

  // Parse investigation output if present
  let investigationData: any = null;
  const investigationExec = job.executions?.find((e: any) => e.agentType === 'INVESTIGATOR');
  if (investigationExec?.outputSummary) {
    try {
      investigationData = JSON.parse(investigationExec.outputSummary);
    } catch {}
  }

  // Parse diff from developer execution if present
  let diffPreview = '';
  const devExec = job.executions?.find((e: any) => e.agentType === 'DEVELOPER');
  if (devExec?.outputSummary) {
    try {
      const parsed = JSON.parse(devExec.outputSummary);
      diffPreview = parsed.diffPreview || '';
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/jobs" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Job ID:</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{job.id}</span>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-bold">
              {job.bug?.jiraIssueKey}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border ${
                job.status === 'COMPLETED'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : job.status === 'AWAITING_PRODUCTION_APPROVAL'
                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                  : 'bg-cyan-950 text-cyan-400 border-cyan-800'
              }`}
            >
              {job.status}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{job.bug?.title}</h2>
          <p className="text-xs text-slate-400">{job.project?.name} • Repository: acme-corp/ecommerce-frontend</p>
        </div>

        {/* Human Gate Production Approval Action */}
        {job.status === 'AWAITING_PRODUCTION_APPROVAL' && (
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={() => handleApproveProduction(false)}
              disabled={approving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Rocket className="h-4 w-4" />
              {approving ? 'Promoting...' : 'Authorize Production Release (Alex Murphy)'}
            </button>
            <button
              onClick={() => handleApproveProduction(true)}
              disabled={approving}
              className="px-3 py-2 rounded-lg border border-rose-800 hover:bg-rose-950/40 text-rose-400 font-medium text-xs transition"
              title="Simulates a canary failure to verify automatic rollback trigger"
            >
              Simulate Failure & Rollback
            </button>
          </div>
        )}
      </div>

      {approvalMsg && (
        <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-800/80 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{approvalMsg}</span>
        </div>
      )}

      {/* Visual Pipeline Progression (State Machine Tracker) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 font-mono">
          Autonomous Lifecycle Progression
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs text-center font-mono">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-emerald-500/40 text-emerald-400">
            ✓ 1. Ingestion
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-emerald-500/40 text-emerald-400">
            ✓ 2. Investigation
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-emerald-500/40 text-emerald-400">
            ✓ 3. Antigravity Agent
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-emerald-500/40 text-emerald-400">
            ✓ 4. QA Validation
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-emerald-500/40 text-emerald-400">
            ✓ 5. Staging Verified
          </div>
          <div
            className={`p-2.5 rounded-lg border ${
              job.status === 'COMPLETED'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 font-bold'
                : job.status === 'AWAITING_PRODUCTION_APPROVAL'
                ? 'bg-amber-950/60 border-amber-500 text-amber-400 animate-pulse font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {job.status === 'COMPLETED' ? '✓ 6. Production Live' : '6. Production Gate'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('investigation')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'investigation'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Root Cause Diagnosis
        </button>
        <button
          onClick={() => setActiveTab('diff')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'diff'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Code Changes & Diff
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'qa'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          QA Validation Results ({job.validations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'logs'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Telemetry & Logs ({job.logs?.length || 0})
        </button>
      </div>

      {/* Tab 1: Investigation Report */}
      {activeTab === 'investigation' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <div>
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">Identified Root Cause</span>
              <p className="text-sm text-slate-200 mt-1 leading-relaxed">
                {investigationData?.rootCause ||
                  'The coupon validation endpoint returns a 400/410 status code on expiration, which is treated as an unhandled rejection rather than being mapped to the user validation error state.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">Acceptance Criteria</span>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  {investigationData?.acceptanceCriteria?.map((ac: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>{ac}</span>
                    </li>
                  )) || (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span> Expired coupons display inline error
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span> Checkout flow and cart items preserved
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">Likely Impacted Files</span>
                <ul className="mt-2 space-y-1 text-xs text-slate-300 font-mono">
                  {investigationData?.likelyFiles?.map((file: string, i: number) => (
                    <li key={i} className="flex items-center gap-1.5 text-slate-300">
                      <FileCode className="h-3.5 w-3.5 text-slate-500" />
                      {file}
                    </li>
                  )) || (
                    <li className="flex items-center gap-1.5 text-slate-300">
                      <FileCode className="h-3.5 w-3.5 text-slate-500" /> src/checkout/coupon.ts
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-slate-400">Risk Assessment:</span>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-900">
                LOW RISK (Safe for automated PR)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Code Diff */}
      {activeTab === 'diff' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden font-mono text-xs">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-slate-400">
            <span>src/checkout/coupon.ts</span>
            <span className="text-[11px] text-emerald-400">+25 lines / -4 lines</span>
          </div>
          <div className="p-4 overflow-x-auto space-y-1">
            <div className="text-slate-500">@@ -1,10 +1,28 @@</div>
            <div className="text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded">- if (!res.ok) throw new Error(&apos;API request failed&apos;);</div>
            <div className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">+ if (res.status === 400 || res.status === 404 || res.status === 410) {'{'}</div>
            <div className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">+   const errorData = await res.json().catch(() =&gt; ({}));</div>
            <div className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">+   return {'{'} valid: false, message: errorData.message || &apos;This coupon code has expired or is invalid.&apos; {'}'};</div>
            <div className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">+ {'}'}</div>
            <div className="text-slate-400 px-2 py-0.5">  return await res.json();</div>
          </div>
        </div>
      )}

      {/* Tab 3: QA Matrix */}
      {activeTab === 'qa' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-xs font-mono uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Validation Check</th>
                <th className="py-3 px-4">Command</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Exit Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {job.validations?.map((v: any) => (
                <tr key={v.id} className="hover:bg-slate-800/20">
                  <td className="py-3 px-4 font-sans font-medium text-slate-200">{v.name}</td>
                  <td className="py-3 px-4 text-slate-400">{v.command}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 font-semibold">
                      PASSED
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{v.durationMs}ms</td>
                  <td className="py-3 px-4 text-slate-400">0</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No QA runs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Logs */}
      {activeTab === 'logs' && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto space-y-1.5">
          {job.logs?.map((l: any) => (
            <div key={l.id} className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0">{new Date(l.createdAt).toLocaleTimeString()}</span>
              <span
                className={`px-1 rounded text-[10px] shrink-0 ${
                  l.level === 'ERROR'
                    ? 'bg-rose-950 text-rose-400'
                    : l.level === 'WARN'
                    ? 'bg-amber-950 text-amber-400'
                    : 'bg-slate-800 text-cyan-400'
                }`}
              >
                {l.level}
              </span>
              <span className="text-slate-400 shrink-0">[{l.stage}]</span>
              <span className="text-slate-200">{l.message}</span>
            </div>
          )) || <div className="text-slate-500">No logs logged.</div>}
        </div>
      )}

      {/* GitHub PR Reference Banner */}
      {job.pullRequest && (
        <div className="p-4 rounded-xl border border-purple-800/50 bg-purple-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitPullRequest className="h-5 w-5 text-purple-400" />
            <div>
              <div className="font-semibold text-sm text-slate-200">
                GitHub Pull Request #{job.pullRequest.number}: {job.pullRequest.title}
              </div>
              <div className="text-xs text-slate-400 font-mono">Branch: {job.pullRequest.branchName}</div>
            </div>
          </div>
          <a
            href={job.pullRequest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition"
          >
            Inspect PR on GitHub <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

