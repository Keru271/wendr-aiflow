import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { 
  Bot, 
  Layers, 
  GitPullRequest, 
  Rocket, 
  FolderKanban, 
  Plug, 
  ShieldCheck, 
  Settings, 
  Activity,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'FixPilot | Autonomous Bug-Fixing & Deployment Platform',
  description: 'Jira → AI Investigation → Antigravity Coding Agent → QA Matrix → GitHub PR → Human Approval → Production Deployment'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex antialiased selection:bg-blue-600 selection:text-white">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-[#0d1322]/80 backdrop-blur-xl flex flex-col shrink-0 fixed inset-y-0 z-30">
          {/* Logo & Brand */}
          <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  FixPilot
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    AI Agent
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 font-medium">Autonomous Fix Engine</p>
              </div>
            </Link>
          </div>

          {/* Project Switcher / Current Scope */}
          <div className="p-3 mx-3 mt-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-200">WEB (Payment Checkout)</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-mono bg-slate-800 px-1 rounded">Prod</span>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Overview</span>
            </Link>

            <Link
              href="/jobs"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Fix Jobs</span>
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                Live
              </span>
            </Link>

            <Link
              href="/pull-requests"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <GitPullRequest className="w-4 h-4 text-emerald-400" />
              <span>Pull Requests</span>
            </Link>

            <Link
              href="/deployments"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Rocket className="w-4 h-4 text-purple-400" />
              <span>Deployments & Gates</span>
            </Link>

            <div className="pt-4 pb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Platform & Setup
            </div>

            <Link
              href="/projects"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <FolderKanban className="w-4 h-4 text-amber-400" />
              <span>Projects & Repos</span>
            </Link>

            <Link
              href="/integrations"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Plug className="w-4 h-4 text-cyan-400" />
              <span>Integrations</span>
            </Link>

            <Link
              href="/audit"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Audit Trail</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings & Cost</span>
            </Link>
          </nav>

          {/* User / Agent status footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200">Google Antigravity</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Adapter Ready
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="pl-64 flex-1 flex flex-col min-h-screen">
          {/* Top Header */}
          <header className="h-16 border-b border-slate-800 bg-[#0d1322]/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-medium text-slate-300">
                Acme Global FinTech / <span className="text-white font-semibold">Payment Checkout</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Human Approval Gate: Strict
              </div>

              <Link
                href="https://fixpilot.atlassian.net"
                target="_blank"
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                Jira Cloud
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </header>

          {/* Page View Body */}
          <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
