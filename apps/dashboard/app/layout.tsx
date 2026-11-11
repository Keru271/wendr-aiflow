import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import {
  LayoutDashboard,
  FolderGit2,
  Cpu,
  GitPullRequest,
  Rocket,
  Plug,
  ShieldCheck,
  Settings,
  Sparkles
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'FixPilot — AI Autonomous Bug-Fixing Platform',
  description: 'Autonomous bug resolution lifecycle from Jira to verified GitHub PR & Deployment'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10">
                FP
              </div>
              <div>
                <span className="font-semibold text-base tracking-tight text-white block">FixPilot</span>
                <span className="text-[10px] uppercase font-mono text-emerald-400 tracking-wider">Antigravity Core</span>
              </div>
            </div>
          </div>

          {/* Org Selector Badge */}
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Organization</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-medium">Active</span>
            </div>
            <div className="font-medium text-sm text-slate-200 mt-0.5">Acme Corporation</div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-3 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <LayoutDashboard className="h-4 w-4 text-emerald-400" />
              Overview
            </Link>
            <Link
              href="/jobs"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <Cpu className="h-4 w-4 text-cyan-400" />
              Autonomous Jobs
            </Link>
            <Link
              href="/pull-requests"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <GitPullRequest className="h-4 w-4 text-purple-400" />
              Pull Requests
            </Link>
            <Link
              href="/deployments"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <Rocket className="h-4 w-4 text-amber-400" />
              Deployments
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <FolderGit2 className="h-4 w-4 text-blue-400" />
              Projects & Repos
            </Link>
            <Link
              href="/integrations"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <Plug className="h-4 w-4 text-pink-400" />
              Integrations
            </Link>
            <Link
              href="/audit"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              Audit Log
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings & Policy
            </Link>
          </nav>

          {/* Quick Simulation Trigger */}
          <div className="p-4 border-t border-slate-800">
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                Live Demo Mode
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Test the complete autonomous lifecycle from Jira to Production.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header */}
          <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/30 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-slate-100">FixPilot Operations Center</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                System Online
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">
                Approver: <strong className="text-slate-200">Alex Murphy</strong> (Human Gate Active)
              </span>
            </div>
          </header>

          <div className="p-8 flex-1">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

