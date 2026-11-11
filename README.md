# FixPilot — AI-Powered Autonomous Bug-Fixing & Deployment Platform

FixPilot is an end-to-end, multi-project SaaS platform that automates the software bug-resolution lifecycle. It connects Jira projects to GitHub repositories, delegates bounded investigation and coding to Google Antigravity, validates changes via deterministic quality gates, opens structured Pull Requests, and coordinates staging verification and approval-gated production releases.

---

## 1. Key Principles & Guardrails

1. **Human-Controlled Production:** Production deployment strictly requires authorized human approval. AI agents possess zero production credentials.
2. **Small, Reviewable Changes:** Agents make minimal safe changes that address acceptance criteria.
3. **Deterministic Test Before PR:** Lint, type checks, unit tests, and production builds must pass before a PR is opened.
4. **Least Privilege & Isolation:** Coding tasks run in disposable workspaces with CPU, memory, and path boundary constraints.
5. **Graceful Escalation:** Ambiguous, sensitive (auth/payments/database migrations), or repeatedly failing tasks are escalated to humans.

---

## 2. System Architecture

```text
Jira Webhook
     │
     ▼
Fastify API ──▶ PostgreSQL (Prisma)
     │
     ▼
BullMQ / Workflow Orchestrator
     │
     ├─▶ 1. Investigation Agent (Zod schema diagnosis & risk assessment)
     ├─▶ 2. Google Antigravity Adapter (Isolated workspace, branch checkout)
     ├─▶ 3. QA Worker (Lint, Typecheck, Unit Tests, Build, Bounded Retry Loop)
     ├─▶ 4. Reviewer Stage (Diff analysis & security inspection)
     ├─▶ 5. GitHub Worker (Push branch, open PR with evidence checklist)
     ├─▶ 6. Staging Deployment (Post-merge build & synthetic health verification)
     └─▶ 7. Production Gate (Human approval -> Promotion -> Health check -> Auto-rollback)
```

---

## 3. Monorepo Structure

```text
AIFLOW/
├── apps/
│   ├── api/                 # Fastify REST API, webhooks & JWT auth
│   └── dashboard/           # Next.js 15 App Router Operations Dashboard
├── workers/
│   └── orchestrator/        # State machine orchestrator & workers (BullMQ)
├── packages/
│   ├── shared/              # Common enums (20-state machine), types & utils
│   ├── schemas/             # Strict Zod schemas for investigation, agent, PRs
│   ├── database/            # Prisma schema (19 entities), client & seed
│   ├── agent-adapters/      # Google Antigravity adapter & workspace manager
│   ├── jira-client/         # Canonical issue fetcher, status transitions & webhooks
│   ├── github-client/       # GitHub App client, PR template generator & webhooks
│   └── observability/       # Structured logger, audit trail & usage cost metrics
├── infrastructure/
│   └── docker/              # Dockerfiles for API, Dashboard & Worker
├── scripts/
│   └── demo-e2e.ts          # End-to-end autonomous lifecycle simulation script
├── docker-compose.yml       # Production stack (Postgres, Redis, API, Dashboard, Worker)
└── package.json
```

---

## 4. Getting Started

### Prerequisites
- Node.js 22+
- npm 10+
- Git

### Installation

1. Install all dependencies across the monorepo:
   ```bash
   npm install
   ```

2. Generate Prisma Client and prepare local database:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

3. Seed initial demo organization, projects, repos, and sample bug:
   ```bash
   npm run seed
   ```

4. Run the end-to-end automated demo:
   ```bash
   npm run demo:e2e
   ```

---

## 5. Running the Application

### Start the Fastify API (Port 4000)
```bash
npm run dev:api
```

### Start the Next.js Dashboard (Port 3000)
```bash
npm run dev:dashboard
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. End-to-End Workflow & Acceptance Criteria

| Stage | Trigger / Action | Evidence & Verification |
|---|---|---|
| **1. Ingestion** | Jira webhook or manual ticket with `ai-auto-fix` label | Canonical issue fetched, idempotency verified, status -> `AI Investigation` |
| **2. Investigation** | Reasoning analysis of problem, stack trace, and repo files | Structured JSON diagnosis with root cause and acceptance criteria |
| **3. Coding Agent** | Google Antigravity adapter creates isolated workspace | Changes limited to feature branch `ai-fix/WEB-1024-...` |
| **4. QA Gates** | Runs `npm run lint`, `tsc`, `npm test`, and `npm run build` | Zero type errors, tests pass. Up to 3 bounded retries on failure |
| **5. Review Stage** | Diff analyzer verifies changes are minimal and safe | Confirms no changes to secrets, IAM, or workflows |
| **6. GitHub PR** | Opens PR with test evidence and Jira link | Branch protection active; requires human reviewer |
| **7. Staging** | Automated post-merge build deployed to staging | Synthetic canary health checks verified |
| **8. Production Gate** | Human approver (Alex Murphy) clicks Authorize | Promotes verified artifact digest; automatic rollback on health failure |

---

## 7. Cost & Usage Estimates (INR)

- **Local Prototype:** ₹1,000 – ₹3,000 / month
- **MVP Production (100 jobs/month):** ₹8,000 – ₹18,000 / month
- **Allocated Initial Budget:** ₹10,000 / month
- Usage tracked in real-time under `/usage` and visible in the Operations Dashboard.

