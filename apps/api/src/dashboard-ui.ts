export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FixPilot — AI Autonomous Bug-Fixing Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: { 500: '#10b981', 600: '#059669' }
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #030712; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0b0f19; }
    ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 3px; }
    .pulse-dot { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
  </style>
</head>
<body class="flex h-screen overflow-hidden">

  <!-- Sidebar -->
  <aside class="w-64 border-r border-gray-800 bg-gray-950/70 flex flex-col shrink-0">
    <div class="p-4 border-b border-gray-800 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div>
          <span class="font-bold text-base tracking-tight text-white block">FixPilot</span>
          <span class="text-[10px] uppercase font-mono text-emerald-400 tracking-wider">Antigravity Core</span>
        </div>
      </div>
    </div>

    <!-- Org Badge -->
    <div class="px-4 py-3 border-b border-gray-800/80 bg-gray-900/30">
      <div class="text-[11px] text-gray-400 flex items-center justify-between">
        <span>Organization</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">Active</span>
      </div>
      <div class="font-semibold text-sm text-gray-200 mt-0.5">Acme Corporation</div>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto text-sm">
      <button onclick="switchView('overview')" id="nav-overview" class="nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-emerald-400 bg-gray-800/70 transition">
        <i class="fa-solid fa-chart-pie w-4 text-emerald-400"></i> Overview
      </button>
      <button onclick="switchView('jobs')" id="nav-jobs" class="nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition">
        <i class="fa-solid fa-microchip w-4 text-cyan-400"></i> Autonomous Jobs
      </button>
      <button onclick="switchView('pull-requests')" id="nav-pull-requests" class="nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition">
        <i class="fa-solid fa-code-pull-request w-4 text-purple-400"></i> Pull Requests
      </button>
      <button onclick="switchView('deployments')" id="nav-deployments" class="nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition">
        <i class="fa-solid fa-rocket w-4 text-amber-400"></i> Deployments
      </button>
      <button onclick="switchView('projects')" id="nav-projects" class="nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition">
        <i class="fa-solid fa-folder-tree w-4 text-blue-400"></i> Projects & Repos
      </button>
      <button onclick="switchView('integrations')" id="nav-integrations" class="nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition">
        <i class="fa-solid fa-plug w-4 text-pink-400"></i> Integrations
      </button>
      <button onclick="switchView('audit')" id="nav-audit" class="nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition">
        <i class="fa-solid fa-shield-halved w-4 text-teal-400"></i> Audit Log
      </button>
      <button onclick="switchView('settings')" id="nav-settings" class="nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition">
        <i class="fa-solid fa-sliders w-4 text-gray-400"></i> Settings & Policy
      </button>
    </nav>

    <!-- Bottom Simulation Badge -->
    <div class="p-4 border-t border-gray-800 bg-gray-900/20">
      <div class="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/60 text-xs">
        <div class="flex items-center gap-2 text-emerald-400 font-bold mb-1">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Autonomous Engine
        </div>
        <p class="text-gray-400 text-[11px] leading-relaxed">
          Full Jira → Antigravity → QA → PR → Staging → Human Gate → Production workflow.
        </p>
      </div>
    </div>
  </aside>

  <!-- Main View Area -->
  <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">
    <!-- Top Header -->
    <header className="h-16 border-b border-gray-800 px-8 py-4 flex items-center justify-between bg-gray-950/40 backdrop-blur sticky top-0 z-20">
      <div class="flex items-center gap-3">
        <h1 class="text-base font-bold text-gray-100" id="page-title">Operations Overview</h1>
        <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot"></span> Online
        </span>
      </div>
      <div class="flex items-center gap-4 text-xs">
        <span class="text-gray-400">Designated Approver: <strong class="text-gray-200">Alex Murphy</strong></span>
        <button onclick="triggerDemo()" id="btn-quick-demo" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold transition shadow-lg shadow-emerald-500/20">
          <i class="fa-solid fa-bolt"></i> Run Bug-Fix Demo
        </button>
      </div>
    </header>

    <!-- Dynamic Content Container -->
    <div class="p-8 flex-1" id="main-content">
      <!-- Injected by JavaScript -->
    </div>
  </main>

  <!-- Notification Toast -->
  <div id="toast" class="fixed bottom-6 right-6 z-50 transform transition-all duration-300 translate-y-20 opacity-0 bg-gray-900 border border-gray-700 text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"></div>

  <script>
    let currentView = 'overview';
    let currentJobId = null;
    let allJobs = [];

    async function loadData() {
      try {
        const res = await fetch('/jobs');
        if (res.ok) {
          allJobs = await res.json();
          renderView();
        }
      } catch (e) {
        console.error(e);
      }
    }

    function showToast(msg, isError = false) {
      const toast = document.getElementById('toast');
      toast.className = 'fixed bottom-6 right-6 z-50 transform transition-all duration-300 translate-y-0 opacity-100 bg-gray-900 border ' + (isError ? 'border-rose-700 text-rose-400' : 'border-emerald-700 text-emerald-400') + ' text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3';
      toast.innerHTML = '<i class="fa-solid ' + (isError ? 'fa-triangle-exclamation' : 'fa-circle-check') + '"></i><span>' + msg + '</span>';
      setTimeout(() => {
        toast.className = toast.className.replace('translate-y-0 opacity-100', 'translate-y-20 opacity-0');
      }, 4000);
    }

    function switchView(view, jobId = null) {
      currentView = view;
      currentJobId = jobId;
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.className = 'nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition';
      });
      const activeBtn = document.getElementById('nav-' + view);
      if (activeBtn) activeBtn.className = 'nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-emerald-400 bg-gray-800/70 transition';
      renderView();
    }

    async function triggerDemo() {
      const btn = document.getElementById('btn-quick-demo');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running Autonomous Pipeline...';
      showToast('Ingesting Jira bug WEB-1024 and triggering Google Antigravity fix...');
      try {
        const res = await fetch('/demo/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Coupon validation does not handle expired coupon response',
            description: 'Expired coupon returns 410 status code; checkout crashes without user message.'
          })
        });
        const data = await res.json();
        showToast('Autonomous pipeline complete! Job ' + data.bugKey + ' verified on Staging.');
        await loadData();
        if (data.jobId) switchView('job-detail', data.jobId);
      } catch (err) {
        showToast('Failed to trigger demo', true);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Run Bug-Fix Demo';
      }
    }

    async function approveProduction(jobId, simulateFailure = false) {
      showToast(simulateFailure ? 'Simulating failure and automatic rollback...' : 'Authorizing production release as Alex Murphy (Approver)...');
      try {
        const stagingDep = (allJobs.find(j => j.id === jobId)?.deployments || []).find(d => d.environment === 'staging');
        const depId = stagingDep?.id || 'dep-default';
        const res = await fetch('/deployments/' + depId + '/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': 'APPROVER',
            'x-user-email': 'approver@acme.com',
            'x-user-id': 'user-approver-alex'
          },
          body: JSON.stringify({
            comment: 'Production deployment authorized by designated approver.',
            simulateFailure
          })
        });
        const data = await res.json();
        showToast(data.message || 'Action executed successfully');
        await loadData();
        renderView();
      } catch (e) {
        showToast('Error during approval action', true);
      }
    }

    async function triggerRollback(depId) {
      showToast('Initiating rollback to previous stable release...');
      try {
        const res = await fetch('/deployments/' + depId + '/rollback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
          body: JSON.stringify({ reason: 'Operator initiated rollback' })
        });
        const data = await res.json();
        showToast(data.message || 'Rollback executed');
        await loadData();
        renderView();
      } catch (e) {
        showToast('Rollback error', true);
      }
    }

    function renderView() {
      const container = document.getElementById('main-content');
      const title = document.getElementById('page-title');

      if (currentView === 'overview') {
        title.innerText = 'Operations Overview';
        const activeJobs = allJobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED' && j.status !== 'ROLLED_BACK').length;
        container.innerHTML = \`
          <div class="space-y-8">
            <!-- Hero Banner -->
            <div class="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-gray-900 to-cyan-950/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
              <div class="space-y-1.5">
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium border border-emerald-500/30">
                  Autonomous Engine Ready
                </span>
                <h2 class="text-xl font-bold text-white">FixPilot Autonomous Bug-Fixing Pipeline</h2>
                <p class="text-gray-300 text-sm max-w-2xl leading-relaxed">
                  Jira Bug Webhook → AI Investigation → Google Antigravity Coding → QA Matrix → GitHub Pull Request → Staging Promotion → Human Approval Gate → Production.
                </p>
              </div>
              <button onclick="triggerDemo()" class="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20">
                <i class="fa-solid fa-play"></i> Trigger Live Bug-Fix Demo
              </button>
            </div>

            <!-- Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-2">
                <div class="flex items-center justify-between text-gray-400 text-xs">
                  <span>Active Agent Jobs</span>
                  <i class="fa-solid fa-microchip text-cyan-400"></i>
                </div>
                <div class="text-2xl font-bold text-white">\${activeJobs}</div>
                <div class="text-xs text-gray-400">100% isolated in ephemeral workspaces</div>
              </div>

              <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-2">
                <div class="flex items-center justify-between text-gray-400 text-xs">
                  <span>QA Pass Rate</span>
                  <i class="fa-solid fa-circle-check text-emerald-400"></i>
                </div>
                <div class="text-2xl font-bold text-white">94.2%</div>
                <div class="text-xs text-gray-400">Max 3 retries per policy</div>
              </div>

              <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-2">
                <div class="flex items-center justify-between text-gray-400 text-xs">
                  <span>Avg Resolution Time</span>
                  <i class="fa-solid fa-clock text-amber-400"></i>
                </div>
                <div class="text-2xl font-bold text-white">4m 12s</div>
                <div class="text-xs text-gray-400">Ticket to Staging verification</div>
              </div>

              <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-2">
                <div class="flex items-center justify-between text-gray-400 text-xs">
                  <span>Monthly AI Usage</span>
                  <i class="fa-solid fa-chart-line text-purple-400"></i>
                </div>
                <div class="text-2xl font-bold text-white">₹1,420</div>
                <div class="text-xs text-gray-400">Allowance: <strong class="text-gray-200">₹10,000</strong> (14.2% used)</div>
              </div>
            </div>

            <!-- Recent Jobs -->
            <div class="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
              <div class="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 class="font-bold text-sm text-gray-200">Recent Autonomous Jobs</h3>
                <button onclick="switchView('jobs')" class="text-xs text-emerald-400 hover:underline">View All Jobs</button>
              </div>
              <div class="divide-y divide-gray-800/60">
                \${allJobs.map(job => \`
                  <div class="p-4 flex items-center justify-between hover:bg-gray-800/30 transition">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-bold">\${job.bug?.jiraIssueKey || 'WEB-1024'}</span>
                        <a href="javascript:void(0)" onclick="switchView('job-detail', '\${job.id}')" class="font-medium text-sm text-gray-200 hover:text-emerald-400 transition">\${job.bug?.title || 'Bug fix'}</a>
                      </div>
                      <div class="text-xs text-gray-400">Created: \${new Date(job.createdAt).toLocaleString()} • Project: \${job.project?.name || 'Web Checkout'}</div>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-xs px-2.5 py-1 rounded-full font-mono font-medium border \${getStatusBadgeClass(job.status)}">\${job.status}</span>
                      <button onclick="switchView('job-detail', '\${job.id}')" class="p-1.5 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white transition">
                        <i class="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>
          </div>
        \`;
      } else if (currentView === 'jobs') {
        title.innerText = 'Autonomous Agent Jobs';
        container.innerHTML = \`
          <div class="space-y-6">
            <div class="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
              <table class="w-full text-left text-sm text-gray-300">
                <thead class="bg-gray-950/70 border-b border-gray-800 text-xs uppercase font-mono text-gray-400">
                  <tr>
                    <th class="py-3 px-4">Jira Issue</th>
                    <th class="py-3 px-4">Summary</th>
                    <th class="py-3 px-4">Status</th>
                    <th class="py-3 px-4">Retries</th>
                    <th class="py-3 px-4">Created</th>
                    <th class="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-800/60">
                  \${allJobs.map(job => \`
                    <tr class="hover:bg-gray-800/30 transition">
                      <td class="py-3.5 px-4 font-mono font-bold text-blue-400">\${job.bug?.jiraIssueKey || 'WEB-1024'}</td>
                      <td class="py-3.5 px-4 font-medium text-gray-200 max-w-md truncate">\${job.bug?.title || 'Bug title'}</td>
                      <td class="py-3.5 px-4"><span class="text-xs px-2 py-0.5 rounded-full font-mono font-medium border \${getStatusBadgeClass(job.status)}">\${job.status}</span></td>
                      <td class="py-3.5 px-4 font-mono text-xs text-gray-400">\${job.retryCount || 0} / 3</td>
                      <td class="py-3.5 px-4 text-xs text-gray-400">\${new Date(job.createdAt).toLocaleTimeString()}</td>
                      <td class="py-3.5 px-4 text-right">
                        <button onclick="switchView('job-detail', '\${job.id}')" class="text-xs text-emerald-400 hover:underline font-medium">Inspect</button>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      } else if (currentView === 'job-detail') {
        const job = allJobs.find(j => j.id === currentJobId) || allJobs[0];
        if (!job) {
          container.innerHTML = '<div class="p-8 text-center text-gray-400">No job selected.</div>';
          return;
        }
        title.innerText = 'Job Detail — ' + (job.bug?.jiraIssueKey || job.id);
        const stagingDep = (job.deployments || []).find(d => d.environment === 'staging');

        container.innerHTML = \`
          <div class="space-y-6 max-w-6xl">
            <!-- Back Button -->
            <button onclick="switchView('jobs')" class="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition">
              <i class="fa-solid fa-arrow-left"></i> Back to Jobs
            </button>

            <!-- Banner Header -->
            <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs px-2.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-bold">\${job.bug?.jiraIssueKey}</span>
                  <span class="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border \${getStatusBadgeClass(job.status)}">\${job.status}</span>
                </div>
                <h2 class="text-xl font-bold text-white">\${job.bug?.title}</h2>
                <p class="text-xs text-gray-400">Project: \${job.project?.name || 'Web Platform'} • Target Repo: acme-corp/ecommerce-frontend</p>
              </div>

              <!-- Human Gate Action -->
              \${job.status === 'AWAITING_PRODUCTION_APPROVAL' ? \`
                <div class="flex flex-col sm:flex-row items-center gap-2">
                  <button onclick="approveProduction('\${job.id}', false)" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20">
                    <i class="fa-solid fa-rocket"></i> Authorize Production Release (Alex Murphy)
                  </button>
                  <button onclick="approveProduction('\${job.id}', true)" class="px-3 py-2 rounded-xl border border-rose-800 hover:bg-rose-950/40 text-rose-400 font-medium text-xs transition">
                    Simulate Canary Failure & Rollback
                  </button>
                </div>
              \` : ''}
            </div>

            <!-- State Machine Progression Tracker -->
            <div class="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
              <h4 class="text-xs font-mono uppercase text-gray-400 font-semibold tracking-wider mb-4">Autonomous Lifecycle Progression</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs text-center font-mono">
                <div class="p-2.5 rounded-lg bg-gray-800/60 border border-emerald-500/40 text-emerald-400">✓ 1. Ingestion</div>
                <div class="p-2.5 rounded-lg bg-gray-800/60 border border-emerald-500/40 text-emerald-400">✓ 2. Investigation</div>
                <div class="p-2.5 rounded-lg bg-gray-800/60 border border-emerald-500/40 text-emerald-400">✓ 3. Antigravity Fix</div>
                <div class="p-2.5 rounded-lg bg-gray-800/60 border border-emerald-500/40 text-emerald-400">✓ 4. QA Validated</div>
                <div class="p-2.5 rounded-lg bg-gray-800/60 border border-emerald-500/40 text-emerald-400">✓ 5. Staging Verified</div>
                <div class="p-2.5 rounded-lg border \${job.status === 'COMPLETED' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 font-bold' : (job.status === 'AWAITING_PRODUCTION_APPROVAL' ? 'bg-amber-950/60 border-amber-500 text-amber-400 animate-pulse font-bold' : (job.status === 'ROLLED_BACK' ? 'bg-rose-950 border-rose-800 text-rose-400' : 'bg-gray-900 border-gray-800 text-gray-500'))}">
                  \${job.status === 'COMPLETED' ? '✓ 6. Production Live' : (job.status === 'ROLLED_BACK' ? '6. Rolled Back' : '6. Production Gate')}
                </div>
              </div>
            </div>

            <!-- Detail Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- AI Investigation Diagnosis -->
              <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
                <div class="text-xs font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                  <i class="fa-solid fa-magnifying-glass"></i> AI Root Cause Diagnosis
                </div>
                <p class="text-xs text-gray-300 leading-relaxed">
                  Coupon validation endpoint returns a 400/410 status code on expiration, which is treated as an unhandled rejection rather than being mapped to the user validation error state.
                </p>
                <div class="p-3 rounded-lg bg-gray-950 border border-gray-800 text-xs space-y-1">
                  <div class="text-gray-400 font-mono text-[11px]">Likely Impacted Files:</div>
                  <div class="text-cyan-400 font-mono">src/checkout/coupon.ts</div>
                </div>
              </div>

              <!-- PR Evidence -->
              <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
                <div class="text-xs font-mono uppercase text-purple-400 font-bold flex items-center gap-1.5">
                  <i class="fa-solid fa-code-pull-request"></i> Pull Request & Validation Evidence
                </div>
                <div class="text-xs text-gray-300">
                  PR opened: <strong class="text-white">#400</strong> on branch <code class="text-slate-300 bg-gray-950 px-1.5 py-0.5 rounded font-mono">ai-fix/web-1024-invalid-coupon</code>
                </div>
                <div class="p-3 rounded-lg bg-gray-950 border border-gray-800 text-xs space-y-1 font-mono text-emerald-400">
                  <div>✓ [x] Lint check passed (0 warnings)</div>
                  <div>✓ [x] TypeScript compiler (0 type errors)</div>
                  <div>✓ [x] Unit test suites passed (14/14)</div>
                  <div>✓ [x] Production build bundle successful</div>
                </div>
              </div>
            </div>

            <!-- Code Diff Viewer -->
            <div class="rounded-xl border border-gray-800 bg-gray-950 p-4 font-mono text-xs space-y-1 overflow-x-auto">
              <div class="text-gray-500 pb-1 border-b border-gray-800 flex justify-between">
                <span>diff --git a/src/checkout/coupon.ts b/src/checkout/coupon.ts</span>
                <span class="text-emerald-400">+25 lines / -4 lines</span>
              </div>
              <div class="text-gray-500 pt-2">@@ -1,10 +1,28 @@</div>
              <div class="text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded">- if (!res.ok) throw new Error('API request failed');</div>
              <div class="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">+ if (res.status === 400 || res.status === 404 || res.status === 410) {</div>
              <div class="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">+   const errorData = await res.json().catch(() => ({}));</div>
              <div class="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">+   return { valid: false, message: errorData.message || 'This coupon code has expired or is invalid.' };</div>
              <div class="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">+ }</div>
              <div class="text-gray-400 px-2 py-0.5">  return await res.json();</div>
            </div>
          </div>
        \`;
      } else if (currentView === 'pull-requests') {
        title.innerText = 'Autonomous Pull Requests';
        container.innerHTML = \`
          <div class="space-y-4">
            \${allJobs.filter(j => j.pullRequest || j.status !== 'QUEUED').map(job => \`
              <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-bold">\${job.bug?.jiraIssueKey || 'WEB-1024'}</span>
                    <span class="font-bold text-sm text-gray-200 ml-2">#400 fix(checkout): \${job.bug?.title}</span>
                    <div class="text-xs text-gray-400 mt-1 font-mono">Branch: ai-fix/web-1024-invalid-coupon • Head: ce371117</div>
                  </div>
                  <a href="https://github.com/acme-corp/ecommerce-frontend/pull/400" target="_blank" class="px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white font-medium text-xs transition">
                    View on GitHub <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i>
                  </a>
                </div>
                <div class="p-3 rounded-lg bg-gray-950 border border-gray-800 text-xs font-mono text-emerald-400 space-y-1">
                  <div>✓ [x] Lint check passed</div>
                  <div>✓ [x] TypeScript compiler verified</div>
                  <div>✓ [x] Unit tests passed</div>
                  <div>✓ [x] Production build bundle ready</div>
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
      } else if (currentView === 'deployments') {
        title.innerText = 'Environments & Deployments';
        container.innerHTML = \`
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-2">
                <div class="flex justify-between items-center">
                  <h3 class="font-bold text-sm text-white">Staging Environment</h3>
                  <span class="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono">HEALTHY</span>
                </div>
                <p class="text-xs text-gray-400">Automated smoke test pipeline for verified candidate builds.</p>
                <div class="text-xs font-mono text-gray-400">Endpoint: https://staging.acme.internal/health</div>
              </div>
              <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-2">
                <div class="flex justify-between items-center">
                  <h3 class="font-bold text-sm text-white">Production Environment</h3>
                  <span class="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-900 font-mono">APPROVAL GATED</span>
                </div>
                <p class="text-xs text-gray-400">Release requires manual authorization by designated human approver.</p>
                <div class="text-xs font-mono text-gray-400">Approvers: Alex Murphy, Sarah Connor</div>
              </div>
            </div>

            <!-- Deployments Table -->
            <div class="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
              <div class="p-4 border-b border-gray-800 font-bold text-sm text-gray-200">Deployment History</div>
              <table class="w-full text-left text-sm text-gray-300">
                <thead class="bg-gray-950/70 border-b border-gray-800 text-xs uppercase font-mono text-gray-400">
                  <tr>
                    <th class="py-3 px-4">Environment</th>
                    <th class="py-3 px-4">Artifact Digest</th>
                    <th class="py-3 px-4">Status</th>
                    <th class="py-3 px-4">Approved By</th>
                    <th class="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-800/60 font-mono text-xs">
                  \${allJobs.flatMap(j => (j.deployments || []).map(d => \`
                    <tr class="hover:bg-gray-800/20">
                      <td class="py-3.5 px-4 font-sans font-bold uppercase text-gray-200">\${d.environment}</td>
                      <td class="py-3.5 px-4 text-gray-400 truncate max-w-xs">\${d.artifactDigest || 'sha256:...'}</td>
                      <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded font-bold \${d.status === 'SUCCEEDED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : (d.status === 'ROLLED_BACK' ? 'bg-rose-950 text-rose-400 border border-rose-900' : 'bg-amber-950 text-amber-400 border border-amber-900')}">\${d.status}</span></td>
                      <td class="py-3.5 px-4 text-gray-300 font-sans">\${d.approvedBy || 'Autonomous CI (Staging)'}</td>
                      <td class="py-3.5 px-4 text-right font-sans">
                        \${d.status === 'SUCCEEDED' ? \`<button onclick="triggerRollback('\${d.id}')" class="text-rose-400 hover:underline">Rollback</button>\` : '—'}
                      </td>
                    </tr>
                  \`)).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      } else if (currentView === 'projects') {
        title.innerText = 'Projects & Connected Repositories';
        container.innerHTML = \`
          <div class="space-y-6">
            <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-6 space-y-4">
              <div class="flex justify-between items-center">
                <div>
                  <span class="font-mono text-xs px-2.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-bold">WEB</span>
                  <h3 class="font-bold text-base text-white mt-1">Web Ecommerce Checkout</h3>
                  <p class="text-xs text-gray-400">Core web storefront and checkout flow</p>
                </div>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono">Auto-Fix Active</span>
              </div>
              <div class="p-4 rounded-lg bg-gray-950 border border-gray-800 space-y-2">
                <div class="font-medium text-sm text-gray-200">acme-corp/ecommerce-frontend (Branch: main)</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-1 text-gray-400">
                  <div>QA Checks: npm run lint, npx tsc, npm test, npm run build</div>
                  <div>Restricted Paths: .github/workflows/**, credentials/**</div>
                </div>
              </div>
            </div>
          </div>
        \`;
      } else if (currentView === 'integrations') {
        title.innerText = 'Connected Integrations';
        container.innerHTML = \`
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
              <div class="flex justify-between items-center">
                <h3 class="font-bold text-sm text-white">Atlassian Jira Cloud</h3>
                <span class="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">CONNECTED</span>
              </div>
              <p class="text-xs text-gray-400">Webhook endpoint: /webhooks/jira</p>
              <div class="text-xs font-mono text-blue-400">Opt-in label: ai-auto-fix</div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
              <div class="flex justify-between items-center">
                <h3 class="font-bold text-sm text-white">GitHub App</h3>
                <span class="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">CONNECTED</span>
              </div>
              <p class="text-xs text-gray-400">Webhook endpoint: /webhooks/github</p>
              <div class="text-xs font-mono text-purple-400">Scope: Contents R/W, PRs R/W</div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
              <div class="flex justify-between items-center">
                <h3 class="font-bold text-sm text-white">Google Antigravity</h3>
                <span class="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">ACTIVE</span>
              </div>
              <p class="text-xs text-gray-400">Decoupled CodingAgentAdapter</p>
              <div class="text-xs font-mono text-amber-400">Model: Gemini 3.8 Flash (High)</div>
            </div>
          </div>
        \`;
      } else if (currentView === 'audit') {
        title.innerText = 'Security & Administrative Audit Trail';
        container.innerHTML = \`
          <div class="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
            <div class="p-4 border-b border-gray-800 font-bold text-sm text-gray-200">Immutable Audit Log</div>
            <div class="p-4 text-xs font-mono text-gray-300 space-y-2">
              <div class="p-2.5 rounded bg-gray-950 border border-gray-800 flex justify-between">
                <span>[PROD_DEPLOYMENT_APPROVED] Actor: approver@acme.com • Target: Production Gate</span>
                <span class="text-teal-400">AUTHORIZED</span>
              </div>
              <div class="p-2.5 rounded bg-gray-950 border border-gray-800 flex justify-between">
                <span>[QA_PIPELINE_PASSED] 4 deterministic checks verified (Lint, Types, Unit, Build)</span>
                <span class="text-emerald-400">PASSED</span>
              </div>
              <div class="p-2.5 rounded bg-gray-950 border border-gray-800 flex justify-between">
                <span>[WORKSPACE_DESTROYED] Ephemeral container cleaned up safely</span>
                <span class="text-gray-400">CLEANED</span>
              </div>
            </div>
          </div>
        \`;
      } else if (currentView === 'settings') {
        title.innerText = 'Platform Policies & Safety Settings';
        container.innerHTML = \`
          <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-6 space-y-4 max-w-3xl">
            <h3 class="font-bold text-sm text-white">Enforced Core Platform Principles</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-300">
              <div class="p-3 rounded-lg bg-gray-950 border border-gray-800">
                <strong>Human-Controlled Production:</strong> AI agents can never approve their own PRs or promote artifacts to production.
              </div>
              <div class="p-3 rounded-lg bg-gray-950 border border-gray-800">
                <strong>Isolated Workspaces:</strong> Tasks run in disposable environments with zero credentials to cloud infrastructure.
              </div>
            </div>
            <div class="space-y-3 pt-3">
              <div class="text-xs text-gray-400">Max QA Retries: <strong class="text-white">3</strong></div>
              <div class="text-xs text-gray-400">QA Timeout: <strong class="text-white">180s</strong></div>
              <div class="text-xs text-gray-400">Required Jira Label: <strong class="text-white">ai-auto-fix</strong></div>
            </div>
          </div>
        \`;
      }
    }

    function getStatusBadgeClass(status) {
      if (status === 'COMPLETED') return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      if (status === 'AWAITING_PRODUCTION_APPROVAL') return 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse';
      if (status === 'ROLLED_BACK' || status === 'FAILED') return 'bg-rose-950 text-rose-400 border-rose-800';
      return 'bg-cyan-950 text-cyan-400 border-cyan-800';
    }

    // Polling data every 3 seconds
    loadData();
    setInterval(loadData, 3000);
  </script>
</body>
</html>
`;
}

