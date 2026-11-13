'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ExternalLink,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import PushNotificationManager from './PushNotificationManager';

interface AppNavigationProps {
  children?: React.ReactNode;
}

export default function AppNavigation() {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const mainNavLinks = [
    { href: '/', label: 'Overview', icon: Activity },
    { href: '/jobs', label: 'Fix Jobs', icon: Layers, badge: 'Live' },
    { href: '/pull-requests', label: 'Pull Requests', icon: GitPullRequest },
    { href: '/deployments', label: 'Deployments & Gates', icon: Rocket },
  ];

  const secondaryNavLinks = [
    { href: '/projects', label: 'Projects & Repos', icon: FolderKanban },
    { href: '/integrations', label: 'Integrations', icon: Plug },
    { href: '/audit', label: 'Audit Trail', icon: ShieldCheck },
    { href: '/settings', label: 'Settings & Cost', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 1. DESKTOP SIDEBAR (Visible on md+ screens)                 */}
      {/* ============================================================ */}
      <aside className="hidden md:flex w-64 border-r border-slate-800 bg-[#0d1322]/80 backdrop-blur-xl flex-col shrink-0 fixed inset-y-0 z-30">
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

        {/* Desktop Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainNavLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
                {link.badge && (
                  <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 pb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Platform & Setup
          </div>

          {secondaryNavLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
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

      {/* ============================================================ */}
      {/* 2. MOBILE TOP HEADER (Sticky full-width on screens < md)    */}
      {/* ============================================================ */}
      <header className="flex md:hidden w-full border-b border-slate-800 bg-[#0c111e]/95 backdrop-blur-xl flex-col sticky top-0 z-30">
        {/* Main Header Bar */}
        <div className="h-14 px-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-white">FixPilot</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Push notification toggle */}
            <PushNotificationManager />

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Strict</span>
            </div>
          </div>
        </div>

        {/* Mobile Quick-Navigation Horizontal Tab Strip */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-slate-800/60 bg-[#080c16]/80 overflow-x-auto text-[11px] font-medium no-scrollbar">
          <Link
            href="/"
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              isActive('/') ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </Link>
          <Link
            href="/jobs"
            className={`px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
              isActive('/jobs') ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Fix Jobs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </Link>
          <Link
            href="/pull-requests"
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              isActive('/pull-requests') ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pull Requests
          </Link>
          <Link
            href="/deployments"
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              isActive('/deployments') ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deployments
          </Link>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="px-2.5 py-1 rounded-lg shrink-0 text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <span>More</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 3. MOBILE SLIDE-OUT DRAWER                                   */}
      {/* ============================================================ */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-[#0c1220] border-r border-slate-800 flex flex-col h-full z-10 shadow-2xl">
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-white">FixPilot Navigation</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope badge */}
            <div className="p-3 mx-3 my-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-medium text-slate-200 truncate">WEB • Payment Checkout</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-mono bg-slate-800 px-1 rounded shrink-0">Prod</span>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Core
              </div>
              {mainNavLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </div>
                    {link.badge ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                        {link.badge}
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                    )}
                  </Link>
                );
              })}

              <div className="pt-4 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Platform & Setup
              </div>
              {secondaryNavLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] truncate">
                  <div className="font-semibold text-slate-200">Google Antigravity</div>
                  <div className="text-emerald-400 font-medium">Live AI Agent Engine</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
