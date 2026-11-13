import type { Metadata, Viewport } from 'next';
import './globals.css';
import Link from 'next/link';
import PWARegister from '@/components/PWARegister';
import AppNavigation from '@/components/AppNavigation';
import PushNotificationManager from '@/components/PushNotificationManager';
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
  description: 'Jira → AI Investigation → Antigravity Coding Agent → QA Matrix → GitHub PR → Human Approval → Production Deployment',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FixPilot'
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: '#0d1322',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <meta name="theme-color" content="#0d1322" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex antialiased selection:bg-blue-600 selection:text-white">
        <PWARegister />
        
        {/* Responsive App Navigation (Desktop Sidebar, Mobile Top Header, Mobile Drawer, Mobile Bottom Dock) */}
        <AppNavigation />

        {/* Main Content Area */}
        <div className="md:pl-64 flex-1 flex flex-col min-h-screen w-full">
          {/* Desktop Top Header (Hidden on Mobile) */}
          <header className="hidden md:flex h-16 border-b border-slate-800 bg-[#0d1322]/60 backdrop-blur-md px-6 lg:px-8 items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-medium text-slate-300">
                Acme Global FinTech / <span className="text-white font-semibold">Payment Checkout</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Push Notification Manager Pill */}
              <PushNotificationManager />

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Human Gate: Strict
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
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
