/**
 * Web Push and Browser Notification Service for FixPilot
 * Alerts users when an Antigravity autonomous task completes, passes QA, or requires human approval.
 */

export interface TaskNotificationPayload {
  jobId: string;
  jiraKey?: string;
  title: string;
  status: 'AWAITING_PRODUCTION_APPROVAL' | 'COMPLETED' | 'FAILED' | 'QA_PASSED' | string;
  prNumber?: number;
  prUrl?: string;
  failureReason?: string;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Play a short pleasant test ping
      playNotificationSound('success');
      // Show confirmation notification
      showNotificationDirect('🔔 FixPilot Notifications Enabled', {
        body: 'You will receive instant alerts when Antigravity completes tasks, passes QA gates, and raises PRs.',
        icon: '/icons/icon-192x192.png',
        tag: 'fixpilot-welcome'
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Notifications] Error requesting permission:', err);
    return false;
  }
}

/**
 * Synthesizes an auditory notification chime using Web Audio API
 */
export function playNotificationSound(type: 'success' | 'alert' | 'error' = 'success') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'success') {
      // Friendly two-tone ascending chime (C5 -> G5)
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.15 },
        { freq: 783.99, time: 0.14, dur: 0.28 }
      ];
      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + dur + 0.05);
      });
    } else if (type === 'alert') {
      // Attention chime (E5 -> A5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Ignore audio autoplay policy restrictions
  }
}

/**
 * Triggers a task notification via Service Worker or Native Notification API
 */
export async function sendTaskNotification(payload: TaskNotificationPayload): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const issueLabel = payload.jiraKey ? `[${payload.jiraKey}] ` : '';
  let title = '🎉 Task Completed';
  let body = `${issueLabel}${payload.title} has been resolved!`;
  const url = `/jobs/${payload.jobId}`;

  if (payload.status === 'AWAITING_PRODUCTION_APPROVAL') {
    title = `🛡️ Approval Required: ${issueLabel}Fix Verified`;
    body = `Antigravity completed patch${payload.prNumber ? ` & GitHub PR #${payload.prNumber}` : ''}. QA gates passed on staging. Ready for your sign-off!`;
    playNotificationSound('alert');
  } else if (payload.status === 'COMPLETED') {
    title = `🚀 Task Released: ${issueLabel}Fix Complete`;
    body = `Production deployment confirmed and verified. Jira status updated to Done.`;
    playNotificationSound('success');
  } else if (payload.status === 'FAILED') {
    title = `⚠️ Task Failed: ${issueLabel}Antigravity Error`;
    body = payload.failureReason || 'An error occurred during autonomous repair. Click to view logs.';
    playNotificationSound('alert');
  } else {
    title = `✅ Task Done: ${issueLabel}`;
    body = `Google Antigravity finished ${payload.title}.`;
    playNotificationSound('success');
  }

  // 1. Try sending through registered Service Worker (works in background & mobile PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon.svg',
          vibrate: [200, 100, 200, 100, 200],
          tag: `task-${payload.jobId}-${payload.status}`,
          renotify: true,
          data: { url, jobId: payload.jobId },
          actions: [
            { action: 'view', title: '🔍 View Task' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        } as any);
        return true;
      }
    } catch (swErr) {
      console.warn('[Notifications] ServiceWorker notification failed, falling back:', swErr);
    }
  }

  // 2. Direct Window Notification Fallback
  return showNotificationDirect(title, {
    body,
    icon: '/icons/icon-192x192.png',
    tag: `task-${payload.jobId}-${payload.status}`,
    data: { url }
  }, url);
}

function showNotificationDirect(title: string, options: NotificationOptions, clickUrl?: string): boolean {
  try {
    const notif = new Notification(title, options);
    if (clickUrl) {
      notif.onclick = () => {
        window.focus();
        window.location.href = clickUrl;
        notif.close();
      };
    }
    return true;
  } catch (err) {
    console.warn('[Notifications] Direct notification failed:', err);
    return false;
  }
}

