'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, BellOff, Check, Sparkles, X } from 'lucide-react';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendTaskNotification 
} from '@/lib/notifications';

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const activeJobsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isSupp = isNotificationSupported();
    setSupported(isSupp);
    if (isSupp) {
      const perm = getNotificationPermission();
      setPermission(perm);
      if (perm === 'default') {
        // Show subtle invitation banner after 3 seconds
        const timer = setTimeout(() => {
          const dismissedBefore = localStorage.getItem('fixpilot_notification_prompt_dismissed');
          if (!dismissedBefore) {
            setShowPromptBanner(true);
          }
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Background monitor: Poll active jobs and fire notifications when any task completes
  useEffect(() => {
    if (!supported || permission !== 'granted') return;

    const checkJobStatus = async () => {
      try {
        const res = await fetch('/api/jobs');
        if (!res.ok) return;
        const data = await res.json();
        const jobs: any[] = data.jobs || [];

        const notifiedSet = new Set(JSON.parse(sessionStorage.getItem('fixpilot_notified_jobs') || '[]'));

        for (const job of jobs) {
          const prevStatus = activeJobsRef.current.get(job.id);
          const currentStatus = job.status;

          // If we tracked this job while it was running, and now it finished:
          const wasRunning = prevStatus && ['QUEUED', 'INVESTIGATING', 'READY_TO_FIX', 'CODING', 'QA', 'REVIEWING', 'DEPLOYING_STAGING'].includes(prevStatus);
          const isNowDone = ['AWAITING_PRODUCTION_APPROVAL', 'COMPLETED', 'FAILED'].includes(currentStatus);
          const notificationKey = `${job.id}_${currentStatus}`;

          if (wasRunning && isNowDone && !notifiedSet.has(notificationKey)) {
            notifiedSet.add(notificationKey);
            sessionStorage.setItem('fixpilot_notified_jobs', JSON.stringify(Array.from(notifiedSet)));

            await sendTaskNotification({
              jobId: job.id,
              jiraKey: job.bug?.jiraIssueKey,
              title: job.bug?.title || 'Autonomous Task',
              status: currentStatus,
              prNumber: job.pullRequest?.number || job.pullRequests?.[0]?.number,
              prUrl: job.pullRequest?.url || job.pullRequests?.[0]?.url,
              failureReason: job.failureReason
            });
          }

          // Update active ref
          activeJobsRef.current.set(job.id, currentStatus);
        }
      } catch (err) {
        // silent background check
      }
    };

    // Initial check and recurring interval
    checkJobStatus();
    const interval = setInterval(checkJobStatus, 4000);
    return () => clearInterval(interval);
  }, [supported, permission]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      setShowPromptBanner(false);
    } else {
      setPermission(getNotificationPermission());
    }
  };

  const handleDismissBanner = () => {
    setShowPromptBanner(false);
    setBannerDismissed(true);
    localStorage.setItem('fixpilot_notification_prompt_dismissed', 'true');
  };

  if (!supported) return null;

  return (
    <>
      {/* Header Notification Toggle Pill */}
      <div className="relative inline-flex items-center">
        {permission === 'granted' ? (
          <button
            onClick={() => {
              sendTaskNotification({
                jobId: 'demo-notification',
                jiraKey: 'ALERT',
                title: 'Task Notifications Active',
                status: 'AWAITING_PRODUCTION_APPROVAL',
                prNumber: 42
              });
            }}
            title="Push Notifications Active • Click to test alert sound & notification"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-900/40 transition-colors"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Alerts On</span>
          </button>
        ) : permission === 'denied' ? (
          <div
            title="Notifications are blocked in browser settings"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-500 text-xs font-medium"
          >
            <BellOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Alerts Blocked</span>
          </div>
        ) : (
          <button
            onClick={handleEnableNotifications}
            title="Enable instant push notifications when tasks are done"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition-all hover:scale-105"
          >
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Enable Alerts</span>
          </button>
        )}
      </div>

      {/* Floating Prompt Banner for first-time visitors */}
      {showPromptBanner && !bannerDismissed && (
        <div className="fixed bottom-20 right-4 sm:bottom-4 sm:right-4 z-50 flex items-start gap-3 p-4 rounded-2xl bg-[#0c1222]/95 border border-indigo-500/40 shadow-2xl shadow-indigo-950/80 backdrop-blur-xl max-w-sm animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">Enable Task Notifications</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Get an instant ping when Antigravity completes code patches, finishes QA, or needs human approval.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleEnableNotifications}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                Turn On
              </button>
              <button
                onClick={handleDismissBanner}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismissBanner}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}

