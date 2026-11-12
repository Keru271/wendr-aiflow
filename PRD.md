# FixPilot --- AI-Powered Autonomous Bug-Fixing & Deployment Platform

**Product type:** Multi-project SaaS platform\
**Working name:** FixPilot\
**Document type:** Product requirements, system architecture, technical
design, delivery plan, and cost estimate\
**Status:** MVP planning\
**Primary workflow:** Jira → AI investigation → Antigravity coding agent
→ automated QA → GitHub Pull Request → human approval → deployment

------------------------------------------------------------------------

## 1. Executive Summary

FixPilot is a platform that automates the software bug-resolution
lifecycle. It connects a team's Jira project to its GitHub repositories,
uses an AI agent powered by Google Antigravity to investigate and
implement fixes, validates the changes through automated quality checks,
and creates a Pull Request for human review.

After the Pull Request is approved and merged, a controlled deployment
pipeline can deploy the change to staging and production. Production
deployment remains approval-based. AI agents must never approve their
own changes, bypass repository protections, or access production
credentials.

The goal is to reduce the time developers spend reproducing, diagnosing,
fixing, testing, and preparing routine bugs for review---while
preserving human control over code quality and production releases.

### Product principles

1.  **Human-controlled production:** production deployment requires an
    authorized human approval.
2.  **Small, reviewable changes:** agents should make the smallest safe
    change that resolves the issue.
3.  **Test before PR:** automated validation must run before a PR is
    marked ready for review.
4.  **Least privilege:** integrations and agents receive only the
    permissions they need.
5.  **Traceability:** every decision, command, change, test, approval,
    and deployment is auditable.
6.  **Isolation:** each coding task runs in a disposable, isolated
    workspace.
7.  **Graceful escalation:** ambiguous, risky, or repeatedly failing
    tasks are handed to a human.

------------------------------------------------------------------------

## 2. Problem Statement

Software teams receive bugs through issue trackers, but resolving each
issue requires several manual steps:

-   Understand the reported behaviour and expected behaviour.
-   Collect logs, screenshots, reproduction steps, and environment
    details.
-   Find the relevant code in a repository.
-   Identify the root cause.
-   Implement a fix without introducing regressions.
-   Run linting, type checks, tests, and production builds.
-   Prepare a useful Pull Request.
-   Coordinate review, approval, and deployment.
-   Update the issue tracker and communicate the result.

This process can be slow for repetitive and well-scoped bugs. FixPilot
coordinates these activities through an orchestrated AI workflow while
keeping humans in control of consequential decisions.

------------------------------------------------------------------------

## 3. Goals and Non-Goals

### 3.1 Goals

-   Accept eligible Jira issues automatically through webhooks.
-   Retrieve issue descriptions, comments, attachments, and relevant
    metadata.
-   Associate Jira projects with one or more GitHub repositories.
-   Investigate bugs and produce a structured root-cause report.
-   Delegate code changes to Google Antigravity through a replaceable
    agent adapter.
-   Execute coding work in isolated workspaces and feature branches.
-   Run configurable quality gates.
-   Retry bounded, recoverable failures.
-   Create GitHub Pull Requests with test evidence and a clear summary.
-   Update Jira with investigation, PR, test, and deployment status.
-   Support staging deployment and approval-gated production deployment.
-   Verify deployments and support rollback.
-   Provide a dashboard for jobs, logs, PRs, approvals, and deployments.

### 3.2 Non-goals for the MVP

-   Fully autonomous production deployment without human approval.
-   Replacing Jira, GitHub, or a team's CI/CD platform.
-   Guaranteeing that every reported bug can be fixed automatically.
-   Giving an AI agent unrestricted shell, cloud, or production access.
-   Automatically changing application architecture or performing broad
    refactors.
-   Supporting every programming language and build system on day one.
-   Training or fine-tuning a proprietary foundation model.

------------------------------------------------------------------------

## 4. Users and Roles

  -----------------------------------------------------------------------
  Role                                Responsibilities
  ----------------------------------- -----------------------------------
  Organization Owner                  Creates the organization, manages
                                      billing and global settings

  Admin                               Configures Jira, GitHub,
                                      repositories, environments, and
                                      policies

  Developer                           Reviews AI investigation, code
                                      changes, and Pull Requests

  Approver                            Approves production deployment
                                      through protected deployment
                                      controls

  Viewer                              Reads job status, logs, PRs, and
                                      deployment history

  Platform Operator                   Monitors infrastructure, queues,
                                      failures, and platform health
  -----------------------------------------------------------------------

Permissions should be enforced on the backend for every organization and
project resource.

------------------------------------------------------------------------

## 5. Core User Journey

1.  An eligible Jira bug is created or updated.
2.  Jira sends a webhook to FixPilot.
3.  FixPilot verifies the webhook, checks eligibility, and prevents
    duplicate processing.
4.  The issue is queued for investigation.
5.  The investigator retrieves issue context and relevant repository
    information.
6.  The investigator creates a structured diagnosis and proposed
    implementation plan.
7.  The orchestrator checks risk and policy rules.
8.  The coding agent receives a bounded task in an isolated workspace.
9.  The agent creates a task branch and implements the fix.
10. QA runs configured checks.
11. If QA fails, the orchestrator may send bounded feedback to the
    coding agent for another attempt.
12. A reviewer stage inspects the diff, test evidence, and risk
    indicators.
13. FixPilot pushes the branch and opens a GitHub Pull Request.
14. Jira is updated with the diagnosis, status, and PR link.
15. A human reviews and merges the PR under repository branch
    protection.
16. CI builds and deploys the merged commit to staging.
17. Smoke tests and health checks run.
18. An authorized human approves production through the protected GitHub
    environment.
19. The exact validated artifact is promoted to production.
20. Health checks verify the deployment. If verification fails, the
    configured rollback procedure runs.
21. FixPilot records the result and updates Jira.

------------------------------------------------------------------------

## 6. Functional Requirements

### 6.1 Organization and Authentication

-   Users can sign up, sign in, and sign out.
-   Users can create or join an organization.
-   Organization owners can invite members.
-   Role-based access control applies to projects, integrations, jobs,
    and deployments.
-   Support secure session handling and account recovery.
-   Record important account and permission changes in an audit log.

### 6.2 Project Management

-   Create, update, archive, and view projects.
-   Connect a Jira project to a FixPilot project.
-   Connect one or more GitHub repositories.
-   Configure default branch, language, package manager, test commands,
    and build commands.
-   Configure allowed paths and restricted paths.
-   Enable or disable automatic processing per project.
-   Configure risk rules, retry limits, and deployment environments.

### 6.3 Jira Integration

-   Receive Jira webhooks for issue creation and updates.
-   Verify webhook authenticity where supported and reject malformed
    requests.
-   Fetch the canonical issue details from Jira rather than trusting
    webhook payloads alone.
-   Retrieve comments, attachments, labels, issue type, priority,
    status, and custom fields as permitted.
-   Support an opt-in label such as `ai-auto-fix`.
-   Allow an `AI Fix Enabled` custom field as an alternative opt-in.
-   Ignore unsupported issue types and issues outside configured
    projects.
-   Update Jira with investigation summary, job status, PR URL, QA
    result, and deployment result.
-   Prevent duplicate jobs using webhook receipts and an idempotency
    key.

Suggested Jira statuses:

-   Open
-   AI Investigation
-   AI Development
-   AI Testing
-   AI Review
-   Human Review
-   Ready for Deployment
-   Done
-   Blocked

Suggested Jira fields:

-   GitHub Repository
-   AI Fix Enabled
-   AI Job ID
-   AI Root Cause
-   AI Pull Request
-   AI Build Status
-   AI Deployment Status

### 6.4 Investigation Agent

The investigator should:

-   Parse the issue into problem, expected result, actual result,
    reproduction steps, and acceptance criteria.
-   Inspect supplied screenshots, logs, stack traces, and attachments.
-   Search the repository for relevant files and symbols.
-   Identify likely root cause and supporting evidence.
-   Identify missing information and uncertainty.
-   Propose a minimal implementation plan.
-   Estimate risk and identify sensitive areas such as authentication,
    payments, authorization, and data migrations.
-   Return structured output rather than an unbounded narrative.

Example investigation result:

``` json
{
  "summary": "Coupon validation does not handle an expired coupon response.",
  "rootCause": "The API error response is not mapped to the checkout error state.",
  "likelyFiles": ["src/checkout/coupon.ts", "src/checkout/CouponForm.tsx"],
  "proposedFix": [
    "Normalize the expired-coupon API response",
    "Display the validation message",
    "Preserve the current cart state"
  ],
  "acceptanceCriteria": [
    "Expired coupons show a clear validation message",
    "The checkout flow remains usable"
  ],
  "risk": "medium",
  "needsHumanInput": false
}
```

The schema above is illustrative. Validate all agent output against a
strict runtime schema before using it.

### 6.5 Coding Agent --- Google Antigravity

-   Use Google Antigravity as the initial coding-agent provider.
-   Implement an adapter interface so the provider can be replaced
    without rewriting orchestration.
-   Create a disposable workspace for each attempt.
-   Clone only the configured repository and checkout the configured
    base branch.
-   Create a task-specific branch, for example
    `ai-fix/WEB-1024-invalid-coupon`.
-   Provide the issue, diagnosis, acceptance criteria, repository
    instructions, and permitted commands.
-   Ask the agent to make the smallest change that satisfies the
    acceptance criteria.
-   Capture agent status, tool activity where available, output, changed
    files, and errors.
-   Enforce execution time, token, command, and retry limits.
-   Stop the agent when the task is cancelled or exceeds policy limits.
-   Clean up the workspace after the job reaches a terminal state,
    subject to artifact-retention policy.

Example commit message:

`fix(checkout): handle invalid coupon response`

**Integration caveat:** Antigravity SDK, Interactions API, CLI,
authentication, and headless execution capabilities can change. Validate
the current supported integration method before implementation. Prefer
an official API where available; use a controlled CLI adapter only where
its terms and capabilities support the required workflow. Do not assume
an undocumented remote or headless interface exists.

### 6.6 QA and Validation Agent

Run deterministic tools before relying on AI review.

Configurable checks may include:

-   Dependency installation using the repository's lockfile.
-   Formatting or format check.
-   ESLint or equivalent linting.
-   TypeScript check.
-   Unit tests.
-   Integration tests.
-   End-to-end tests where configured.
-   Production build.
-   Dependency and secret scanning.
-   Diff and changed-file policy checks.

Example Node.js checks:

``` bash
npm ci
npm run lint
npx tsc --noEmit
npm test -- --runInBand
npm run build
```

Commands must be configured and reviewed per repository. Do not assume
every repository uses npm or exposes these exact scripts.

QA output should include:

-   Check name and status.
-   Exit code.
-   Start and finish timestamps.
-   Redacted logs.
-   Artifact references.
-   Failure summary.
-   Whether a retry is permitted.

If QA fails, send concise, sanitized failure information to the coding
agent. Limit automatic repair attempts (initial recommendation: three
attempts total). Escalate after the retry limit.

### 6.7 Review Agent

The review stage should evaluate:

-   Whether the change addresses the reported issue.
-   Whether the diff is minimal and relevant.
-   Whether acceptance criteria are covered by tests.
-   Whether error handling and edge cases are considered.
-   Whether security-sensitive code was changed.
-   Whether dependencies, permissions, secrets, or CI configuration were
    modified.
-   Whether generated files or unrelated formatting changes are present.

The review agent can recommend approval or request changes. It must not
approve or merge its own PR.

### 6.8 GitHub Integration

Use a GitHub App rather than a personal access token for the production
integration.

Recommended minimum permissions, adjusted to actual API operations:

-   Repository metadata: read.
-   Contents: read/write for configured repositories.
-   Pull requests: read/write.
-   Checks: read.
-   Commit statuses: read/write only if required.
-   Issues: optional, if needed for comments or links.

Do not request repository administration or broad organization
permissions unless a documented feature requires them.

The platform should:

-   Install the GitHub App on selected repositories.
-   Create task branches.
-   Push validated changes.
-   Open Pull Requests.
-   Add labels and structured descriptions.
-   Read CI/check status.
-   Receive GitHub webhooks for PR and deployment lifecycle events.
-   Record the merged commit SHA and artifact digest where available.

PR template:

``` markdown
## Summary
What this change fixes.

## Jira issue
[WEB-1024](JIRA_ISSUE_URL)

## Root cause
Why the bug occurred.

## Changes
- Relevant code changes.

## Validation
- [ ] Lint
- [ ] Type check
- [ ] Unit tests
- [ ] Integration tests
- [ ] Production build

## Risk and review notes
Potential impact, edge cases, and areas requiring manual review.

## AI execution
FixPilot job ID: JOB_ID
```

Branch protection must require the team's normal checks and human
review. The AI identity must not satisfy required human approval rules.

### 6.9 Deployment Management

Deployment must be controlled by the team's CI/CD system, not by
unrestricted commands in an AI workspace.

Recommended flow:

1.  Merge to the protected main branch.
2.  GitHub Actions builds an immutable artifact.
3.  Publish the artifact to a container registry or deployment target.
4.  Deploy the exact artifact to staging.
5.  Run smoke tests and health checks.
6.  Request approval through a protected GitHub production environment.
7.  Promote the same artifact digest to production.
8.  Run post-deployment verification.
9.  Roll back to the last known-good release if health checks fail and
    rollback is configured.

Rules:

-   Production secrets are available only to the deployment workflow.
-   Coding agents never receive production credentials.
-   The artifact deployed to production must be the artifact that passed
    staging validation.
-   Production approvals must be performed by authorized humans.
-   Record approver, commit SHA, artifact digest, environment,
    timestamps, and deployment result.
-   Rollback should be tested before production use.

### 6.10 Notifications

Support notifications for:

-   New job accepted.
-   Investigation completed or blocked.
-   Coding started or failed.
-   QA passed or failed.
-   PR created.
-   Human review required.
-   Deployment approval required.
-   Deployment succeeded or failed.
-   Rollback performed.

MVP notifications can use Jira comments and email. Slack or Microsoft
Teams can be added later.

### 6.11 Dashboard

Primary screens:

1.  **Overview:** active jobs, success rate, average resolution time,
    failures, deployments.
2.  **Projects:** project settings, Jira connection, repository
    connections.
3.  **Jobs:** searchable job list with status, issue, repository, and
    timestamps.
4.  **Job detail:** timeline, investigation, agent activity, changed
    files, QA results, PR, and artifacts.
5.  **Pull Requests:** PR status, checks, review status, and links to
    GitHub.
6.  **Deployments:** environment, version, approval, health, and
    rollback status.
7.  **Integrations:** Jira and GitHub connection state and permissions.
8.  **Settings:** policies, commands, retry limits, budgets, and
    retention.
9.  **Audit log:** security-sensitive and administrative events.

------------------------------------------------------------------------

## 7. System Architecture

### 7.1 High-Level Architecture

``` mermaid
flowchart TD
    J[Jira] -->|Webhook| API[Fastify API]
    GH[GitHub] -->|Webhooks| API
    API --> DB[(PostgreSQL)]
    API --> Q[Redis / BullMQ]
    Q --> O[Workflow Orchestrator]
    O --> I[Investigation Agent]
    O --> A[Antigravity Adapter]
    A --> W[Isolated Coding Workspace]
    W --> QA[QA Worker]
    QA --> R[Review Stage]
    R --> G[GitHub App]
    G --> PR[Pull Request]
    PR --> H[Human Review and Merge]
    H --> CI[GitHub Actions]
    CI --> S[Staging]
    S --> AP[Protected Production Approval]
    AP --> P[Production]
    P --> V[Health Verification]
    V -->|Failure| RB[Rollback]
    O -->|Status updates| API
    API --> J
    API --> DASH[Next.js Dashboard]
    O --> LOG[Logs and Audit Trail]
```

### 7.2 Recommended Technology Stack

  -----------------------------------------------------------------------
  Layer                   Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Dashboard               Next.js + TypeScript    Web application

  API                     Fastify + TypeScript    REST API and webhooks

  Database                PostgreSQL + Prisma     Persistent application
                                                  data

  Queue                   Redis or Valkey +       Background jobs and
                          BullMQ                  retries

  Agent provider          Google Antigravity      Investigation and
                          adapter                 coding

  Source control          GitHub App              Repository and PR
                                                  operations

  CI/CD                   GitHub Actions          Build, test, deploy,
                                                  approval

  Workspace               Docker containers /     Per-task execution
                          isolated VMs            

  Object storage          S3-compatible storage   Logs and artifacts

  Monitoring              Sentry + structured     Errors and
                          logs                    observability

  Infrastructure          DigitalOcean or AWS     Initial hosting
  -----------------------------------------------------------------------

### 7.3 Service Responsibilities

**Fastify API** - Authentication and authorization. - Organization and
project management. - Jira and GitHub webhook endpoints. - Job creation
and cancellation. - Dashboard APIs. - Integration configuration. - Audit
event creation.

**Workflow Orchestrator** - Owns the job state machine. - Schedules
agent and QA tasks. - Enforces policy and retry limits. - Handles
cancellation, timeouts, and escalation. - Coordinates Jira, GitHub, and
deployment updates.

**Workers** - Jira worker: fetch and normalize issue data. -
Investigation worker: analyze issue and repository context. - Agent
worker: run Antigravity task in a workspace. - QA worker: execute
validation. - GitHub worker: push branch and create/update PR. -
Deployment worker: observe deployment events and verification.

The orchestrator, not an agent, decides which stage runs next.

------------------------------------------------------------------------

## 8. Job State Machine

Suggested states:

-   `RECEIVED`
-   `QUEUED`
-   `INVESTIGATING`
-   `NEEDS_INFO`
-   `READY_TO_FIX`
-   `CODING`
-   `QA`
-   `REVIEWING`
-   `READY_FOR_PR`
-   `PR_CREATED`
-   `HUMAN_REVIEW`
-   `READY_TO_DEPLOY`
-   `DEPLOYING_STAGING`
-   `VERIFYING_STAGING`
-   `AWAITING_PRODUCTION_APPROVAL`
-   `DEPLOYING_PRODUCTION`
-   `VERIFYING_PRODUCTION`
-   `COMPLETED`
-   `ROLLED_BACK`
-   `FAILED`
-   `CANCELLED`

Important transitions:

-   Investigation with missing information → `NEEDS_INFO`.
-   Investigation accepted → `READY_TO_FIX`.
-   Coding starts → `CODING`.
-   Coding complete → `QA`.
-   QA passes → `REVIEWING`.
-   QA fails and retry budget remains → `CODING`.
-   QA fails after retry limit → `HUMAN_REVIEW`.
-   Review passes → `READY_FOR_PR`.
-   PR opened → `PR_CREATED`.
-   Human review/merge required → `HUMAN_REVIEW`.
-   Merged PR → staging deployment.
-   Staging passes → `AWAITING_PRODUCTION_APPROVAL`.
-   Human approval → production deployment.
-   Production healthy → `COMPLETED`.
-   Production unhealthy → rollback and `ROLLED_BACK`.

All state transitions should be validated by the backend and recorded
with actor, timestamp, and reason.

------------------------------------------------------------------------

## 9. Agent Orchestration Design

### 9.1 Agent Roles

  -----------------------------------------------------------------------
  Agent / stage           Input                   Output
  ----------------------- ----------------------- -----------------------
  Investigator            Jira issue,             Root cause and fix plan
                          attachments, repository 
                          context                 

  Developer               Approved plan,          Code changes and branch
                          repository, constraints 

  QA                      Diff and repository     Test results
                          test configuration      

  Reviewer                Issue, plan, diff, QA   Review findings and
                          results                 risk

  Orchestrator            Events and policy       Next state and task
                                                  scheduling
  -----------------------------------------------------------------------

The investigator and reviewer can initially be prompt/configuration
variants of the same model provider. Keep their responsibilities
separate in the workflow.

### 9.2 Agent Adapter Contract

Use a provider-neutral interface:

``` ts
export interface AgentTaskInput {
  jobId: string;
  repositoryUrl: string;
  baseBranch: string;
  workingDirectory: string;
  prompt: string;
  timeoutSeconds: number;
  maxTotalTokens?: number;
}

export interface AgentTaskResult {
  providerTaskId: string;
  status: "completed" | "failed" | "cancelled";
  summary?: string;
  changedFiles?: string[];
  error?: string;
}

export interface CodingAgentAdapter {
  startTask(input: AgentTaskInput): Promise<{ providerTaskId: string }>;
  getStatus(providerTaskId: string): Promise<AgentTaskResult>;
  cancel(providerTaskId: string): Promise<void>;
}
```

This is an application-level contract. Adapt it to the actual supported
Antigravity API or CLI rather than assuming these are native Antigravity
method names.

### 9.3 Workspace Lifecycle

For each job attempt:

1.  Allocate a disposable workspace.
2.  Apply CPU, memory, disk, and time limits.
3.  Clone the configured repository.
4.  Checkout the permitted base commit.
5.  Create a task branch.
6.  Mount only required files and credentials.
7.  Execute the agent under a restricted user.
8.  Collect diff, logs, and test artifacts.
9.  Remove credentials and stop the workspace.
10. Destroy the workspace after retention requirements are met.

Do not mount Docker socket, host filesystem, cloud credentials, or
production secrets into the coding workspace.

------------------------------------------------------------------------

## 10. Security, Safety, and Governance

Security is a core product requirement because the platform executes
code and handles source repositories.

### 10.1 Credential Management

-   Store secrets in a dedicated secret manager where possible.
-   Store only secret references and metadata in PostgreSQL.
-   Encrypt sensitive integration configuration at rest.
-   Use GitHub App installation tokens with short lifetimes.
-   Rotate credentials and support revocation.
-   Never write tokens, passwords, private keys, or sensitive
    environment variables to logs.
-   Do not expose deployment secrets to agents.

### 10.2 Workspace Isolation

-   Use ephemeral containers or VMs.
-   Run as a non-root user.
-   Apply CPU, memory, disk, and execution-time limits.
-   Restrict network egress to required endpoints.
-   Use read-only mounts wherever possible.
-   Do not share workspaces between organizations.
-   Destroy workspaces after task completion or cancellation.

### 10.3 Prompt Injection and Untrusted Content

Treat all Jira descriptions, comments, attachments, screenshots,
repository files, READMEs, test output, and external content as
untrusted data.

-   Never treat issue text or repository instructions as authority to
    change platform security policy.
-   Keep system policy separate from task content.
-   Do not let an agent reveal secrets or alter permissions.
-   Require explicit allowlists for commands and tools.
-   Validate structured agent output.
-   Require human escalation for suspicious instructions or unexpected
    privileged changes.

### 10.4 Protected Operations

Require human review or block automation for:

-   Authentication and authorization changes.
-   Payment and financial transaction code.
-   Secret handling and encryption.
-   Infrastructure and IAM changes.
-   Database schema migrations or destructive data operations.
-   CI/CD workflow changes.
-   Dependency changes with significant security impact.
-   Large or unrelated diffs.
-   Changes to repository protection or deployment configuration.

### 10.5 Audit Trail

Record:

-   User and organization actions.
-   Integration connection and permission changes.
-   Webhook receipt and processing result.
-   Agent provider, model/configuration, and task IDs where available.
-   Agent prompts or prompt version references, with sensitive values
    redacted.
-   Commands executed and exit codes.
-   Changed file paths and commit SHAs.
-   QA checks and results.
-   PR URL and review status.
-   Deployment approvals, artifact digest, and deployment outcome.
-   Cancellation, retry, rollback, and escalation events.

------------------------------------------------------------------------

## 11. Database Design

Use PostgreSQL with Prisma. The following is a logical schema outline;
exact field types, indexes, relations, and tenant constraints should be
finalized during implementation.

### 11.1 Core Entities

  -----------------------------------------------------------------------
  Entity                              Purpose
  ----------------------------------- -----------------------------------
  User                                User identity and authentication
                                      profile

  Organization                        Tenant/account boundary

  OrganizationMember                  User membership and role

  Project                             FixPilot project and policies

  ProjectMember                       Project-level access where needed

  Integration                         Jira/GitHub integration metadata
                                      and secret references

  Repository                          Connected GitHub repository and
                                      build configuration

  Bug                                 Normalized Jira issue

  WebhookReceipt                      Idempotency and webhook processing

  AgentJob                            End-to-end bug-fixing workflow

  AgentExecution                      Individual agent attempt and
                                      provider metadata

  AgentWorkspace                      Isolated workspace lifecycle

  JobLog                              Structured job timeline and logs

  ValidationRun                       Lint, test, build, and scan results

  PullRequest                         GitHub PR metadata

  Approval                            Approval event reference and actor

  Deployment                          Environment deployment and health
                                      status

  Artifact                            Stored log, patch, report, or test
                                      artifact

  AuditLog                            Security and administrative events

  UsageRecord                         Token, execution, and
                                      infrastructure usage for cost
                                      tracking
  -----------------------------------------------------------------------

### 11.2 Suggested Prisma Enums

``` prisma
enum JobStatus {
  RECEIVED
  QUEUED
  INVESTIGATING
  NEEDS_INFO
  READY_TO_FIX
  CODING
  QA
  REVIEWING
  READY_FOR_PR
  PR_CREATED
  HUMAN_REVIEW
  READY_TO_DEPLOY
  DEPLOYING_STAGING
  VERIFYING_STAGING
  AWAITING_PRODUCTION_APPROVAL
  DEPLOYING_PRODUCTION
  VERIFYING_PRODUCTION
  COMPLETED
  ROLLED_BACK
  FAILED
  CANCELLED
}

enum AgentType {
  INVESTIGATOR
  DEVELOPER
  QA
  REVIEWER
}

enum ValidationStatus {
  PENDING
  RUNNING
  PASSED
  FAILED
  SKIPPED
}

enum DeploymentStatus {
  PENDING
  RUNNING
  AWAITING_APPROVAL
  SUCCEEDED
  FAILED
  ROLLED_BACK
  CANCELLED
}
```

### 11.3 Example Prisma Model Skeleton

``` prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members   OrganizationMember[]
  projects  Project[]
}

model OrganizationMember {
  id             String       @id @default(cuid())
  organizationId String
  userId         String
  role           String
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  user           User         @relation(fields: [userId], references: [id])

  @@unique([organizationId, userId])
  @@index([userId])
}

model Project {
  id             String       @id @default(cuid())
  organizationId String
  name           String
  description    String?
  settings       Json?
  isActive       Boolean      @default(true)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  repositories   Repository[]
  bugs           Bug[]
  jobs           AgentJob[]

  @@index([organizationId])
}

model Repository {
  id             String   @id @default(cuid())
  projectId      String
  githubRepoId   String
  owner          String
  name           String
  defaultBranch  String
  settings       Json?
  createdAt      DateTime @default(now())

  project        Project  @relation(fields: [projectId], references: [id])

  @@unique([projectId, githubRepoId])
}

model Bug {
  id              String   @id @default(cuid())
  projectId       String
  jiraIssueId     String
  jiraIssueKey    String
  title           String
  description     String?
  status          String
  priority        String?
  labels          String[]
  sourcePayload   Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  jobs            AgentJob[]

  @@unique([projectId, jiraIssueId])
  @@index([jiraIssueKey])
}

model AgentJob {
  id              String    @id @default(cuid())
  projectId       String
  bugId            String
  status           JobStatus
  idempotencyKey   String    @unique
  retryCount       Int       @default(0)
  maxRetries      Int       @default(3)
  startedAt        DateTime?
  completedAt      DateTime?
  failureReason    String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  project          Project   @relation(fields: [projectId], references: [id])
  bug              Bug       @relation(fields: [bugId], references: [id])
  executions       AgentExecution[]
  logs             JobLog[]
  validations      ValidationRun[]
  pullRequest      PullRequest?
  deployments      Deployment[]

  @@index([projectId, status])
  @@index([createdAt])
}

model AgentExecution {
  id              String    @id @default(cuid())
  jobId            String
  agentType        AgentType
  provider         String
  providerTaskId   String?
  attempt          Int
  status           String
  inputSummary     String?
  outputSummary    String?
  startedAt        DateTime?
  completedAt      DateTime?
  usage            Json?
  error            String?
  createdAt        DateTime  @default(now())

  job              AgentJob  @relation(fields: [jobId], references: [id])

  @@index([jobId, agentType])
}

model JobLog {
  id          String   @id @default(cuid())
  jobId       String
  level       String
  stage       String
  message     String
  metadata    Json?
  createdAt   DateTime @default(now())

  job         AgentJob @relation(fields: [jobId], references: [id])

  @@index([jobId, createdAt])
}

model ValidationRun {
  id          String           @id @default(cuid())
  jobId       String
  name        String
  status      ValidationStatus
  exitCode    Int?
  summary     String?
  artifactKey String?
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime         @default(now())

  job         AgentJob         @relation(fields: [jobId], references: [id])

  @@index([jobId, status])
}

model PullRequest {
  id             String   @id @default(cuid())
  jobId           String   @unique
  githubPrId      String
  number          Int
  url             String
  branchName      String
  commitSha       String?
  status          String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  job             AgentJob @relation(fields: [jobId], references: [id])
}

model Deployment {
  id              String           @id @default(cuid())
  jobId            String
  environment      String
  status           DeploymentStatus
  commitSha        String?
  artifactDigest   String?
  externalId       String?
  approvedBy       String?
  startedAt        DateTime?
  completedAt      DateTime?
  healthResult     Json?
  createdAt        DateTime         @default(now())

  job              AgentJob         @relation(fields: [jobId], references: [id])

  @@index([jobId, environment])
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  memberships OrganizationMember[]
}
```

This is a starting model, not a production-ready migration. Add
`Integration`, `WebhookReceipt`, `AgentWorkspace`, `Artifact`,
`AuditLog`, `UsageRecord`, invitation, session, and project-member
models. Use foreign keys and tenant-scoped authorization consistently.
Never store raw integration tokens in these models.

------------------------------------------------------------------------

## 12. API Design

All endpoints require authentication except validated webhook endpoints.
Apply organization and project authorization to every resource lookup.

### 12.1 Webhooks

  Method   Endpoint             Purpose
  -------- -------------------- -----------------------
  POST     `/webhooks/jira`     Receive Jira events
  POST     `/webhooks/github`   Receive GitHub events

### 12.2 Projects and Integrations

  ------------------------------------------------------------------------------------------
  Method                  Endpoint                              Purpose
  ----------------------- ------------------------------------- ----------------------------
  GET                     `/projects`                           List projects

  POST                    `/projects`                           Create project

  GET                     `/projects/:projectId`                Project detail

  PATCH                   `/projects/:projectId`                Update project

  POST                    `/projects/:projectId/repositories`   Connect repository

  GET                     `/projects/:projectId/repositories`   List repositories

  POST                    `/integrations/jira/connect`          Start Jira connection

  POST                    `/integrations/github/connect`        Start GitHub App
                                                                installation/configuration

  GET                     `/integrations`                       List integrations

  DELETE                  `/integrations/:integrationId`        Disconnect integration
  ------------------------------------------------------------------------------------------

### 12.3 Jobs

  Method   Endpoint                   Purpose
  -------- -------------------------- ------------------------------
  GET      `/jobs`                    List/filter jobs
  GET      `/jobs/:jobId`             Job details
  POST     `/jobs/:jobId/retry`       Retry an eligible failed job
  POST     `/jobs/:jobId/cancel`      Cancel a running job
  GET      `/jobs/:jobId/logs`        Read job timeline/logs
  GET      `/jobs/:jobId/artifacts`   List artifacts

### 12.4 Pull Requests and Deployments

  ------------------------------------------------------------------------------------
  Method                  Endpoint                             Purpose
  ----------------------- ------------------------------------ -----------------------
  GET                     `/pull-requests`                     List PRs

  GET                     `/deployments`                       List deployments

  GET                     `/deployments/:deploymentId`         Deployment details

  POST                    `/deployments/:deploymentId/retry`   Retry an eligible
                                                               deployment

  GET                     `/audit-logs`                        Read authorized audit
                                                               events

  GET                     `/usage`                             Read usage and cost
                                                               estimates
  ------------------------------------------------------------------------------------

Do not implement a dashboard endpoint that directly grants production
approval unless it is integrated with an explicit, auditable approval
system. The preferred source of truth is the protected GitHub
environment.

------------------------------------------------------------------------

## 13. Jira and GitHub Event Handling

### Jira event processing

1.  Receive webhook.
2.  Validate signature/token or configured webhook verification
    mechanism.
3.  Persist a webhook receipt.
4.  Return a fast acknowledgement.
5.  Queue asynchronous processing.
6.  Fetch canonical issue details.
7.  Check project mapping and opt-in policy.
8.  Build idempotency key from Jira issue identity and processing
    version.
9.  Create or update the bug and job.
10. Start orchestration.

### GitHub event processing

Handle relevant events such as:

-   Pull request opened, synchronized, closed, or merged.
-   Check suite and check run completion.
-   Deployment status changes.
-   Installation changes and permission revocations.

Verify webhook signatures, persist delivery IDs, and make processing
idempotent.

------------------------------------------------------------------------

## 14. Suggested Repository Structure

``` text
fixpilot/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── organizations/
│   │       │   ├── projects/
│   │       │   ├── jira/
│   │       │   ├── github/
│   │       │   ├── bugs/
│   │       │   ├── jobs/
│   │       │   ├── agents/
│   │       │   ├── qa/
│   │       │   ├── pull-requests/
│   │       │   ├── deployments/
│   │       │   ├── integrations/
│   │       │   └── audit/
│   │       ├── plugins/
│   │       └── server.ts
│   └── dashboard/
│       └── app/
├── workers/
│   ├── jira-worker/
│   ├── investigation-worker/
│   ├── agent-worker/
│   ├── qa-worker/
│   ├── github-worker/
│   └── deployment-worker/
├── packages/
│   ├── database/
│   ├── shared/
│   ├── schemas/
│   ├── agent-adapters/
│   ├── github-client/
│   ├── jira-client/
│   └── observability/
├── infrastructure/
│   ├── docker/
│   ├── scripts/
│   ├── monitoring/
│   └── deployment/
├── docs/
├── docker-compose.yml
├── package.json
└── README.md
```

Use a monorepo initially to share schemas, types, and clients. Keep
worker processes independently deployable even if they live in the same
repository.

------------------------------------------------------------------------

## 15. Deployment and Infrastructure

### 15.1 MVP Hosting

A cost-conscious first deployment can use:

-   One small application server for API and dashboard.
-   PostgreSQL and Redis/Valkey on the same server for development only,
    or managed services for production reliability.
-   Separate worker process/container.
-   On-demand isolated coding workspaces.
-   Object storage for artifacts.
-   GitHub Actions for CI/CD.

Do not run untrusted agent code in the same security boundary as the
public API.

### 15.2 Production Topology

``` text
Internet
   |
Reverse Proxy / Load Balancer
   |
Next.js Dashboard ---- Fastify API
                           |
             +-------------+-------------+
             |             |             |
         PostgreSQL     Redis/Valkey   Object Storage
                           |
                     BullMQ Queues
                           |
                    Worker Scheduler
                           |
                 Ephemeral Workspaces
                           |
                 GitHub / Antigravity
                           |
                    GitHub Actions
                           |
                    Staging / Production
```

### 15.3 Operational Requirements

-   HTTPS everywhere.
-   Database backups and restore tests.
-   Queue persistence and dead-letter handling.
-   Health and readiness endpoints.
-   Structured logs with correlation IDs.
-   Metrics for queue depth, job duration, retry count, failure rate,
    and agent usage.
-   Alerts for worker crashes, stuck jobs, queue backlog, and deployment
    failures.
-   Workspace cleanup and orphan detection.
-   Rate limits on public endpoints and webhooks.
-   Database migrations in a controlled release process.

------------------------------------------------------------------------

## 16. Cost and Pricing Estimate

All amounts below are planning estimates in Indian rupees, not vendor
quotations. Actual spend depends heavily on agent usage, task duration,
retry count, storage, region, and deployment architecture. Confirm
current vendor pricing before committing to a budget.

### 16.1 Monthly Operating Scenarios

  ------------------------------------------------------------------------
  Scenario                Approximate monthly budget Typical use
  --------------------- ---------------------------- ---------------------
  Local development /                 ₹1,000--₹3,000 Local services,
  prototype                                          limited cloud usage

  Small production MVP               ₹8,000--₹18,000 One small team,
                                                     roughly 100
                                                     jobs/month

  Growing deployment               ₹25,000--₹50,000+ More repositories,
                                                     workers, jobs, and
                                                     stronger managed
                                                     infrastructure
  ------------------------------------------------------------------------

### 16.2 Suggested Initial Budget

  Cost area                     Monthly planning allowance
  --------------------------- ----------------------------
  Application hosting                               ₹3,000
  Database and Redis/Valkey                         ₹2,000
  Agent workspace execution                         ₹1,000
  Antigravity / AI usage                            ₹2,000
  Storage and monitoring                              ₹500
  Contingency                                       ₹1,500
  **Total**                                    **₹10,000**

This is a starting budget, not a guaranteed cap. Agent usage can exceed
the allowance, especially when tasks require large repository context,
long agent loops, or repeated attempts.

### 16.3 Third-Party Services

-   Jira: a free tier may be sufficient for a small initial team; paid
    plans are priced per user.
-   GitHub: Free may be enough for a prototype; Team may be useful for
    organization controls and collaboration.
-   Sentry: start with the free tier if its limits fit.
-   Object storage: budget a small initial allowance and monitor growth.
-   Antigravity: distinguish a consumer subscription from
    API/pay-as-you-go usage. Do not assume a subscription includes
    unlimited automated agent execution.
-   GitHub Actions: monitor included minutes and artifact storage; usage
    can incur charges depending on plan and runner type.

### 16.4 Development Cost

Indicative one-time implementation estimates:

  Delivery approach                                  Planning estimate
  ------------------------------------- ------------------------------
  Build yourself, excluding your time     ₹10,000--₹30,000 cash budget
  Freelancer                                      ₹2.5 lakh--₹5.5 lakh
  Small development team                              ₹5 lakh--₹9 lakh

These are rough planning ranges based on an MVP of approximately 25--37
working days. Scope, quality requirements, integrations, security
review, and production hardening can change the estimate substantially.

### 16.5 Cost-Control Features

-   Limit agent retries (initially three attempts).
-   Set per-job token and execution-time budgets.
-   Use on-demand workspaces instead of always-on coding machines.
-   Keep one coding-agent provider in the MVP.
-   Cache repository metadata and avoid repeatedly sending irrelevant
    files.
-   Stop idle workers.
-   Set organization and project usage limits.
-   Track usage per job and per organization.
-   Alert on unusual token, compute, and retry consumption.

------------------------------------------------------------------------

## 17. Implementation Roadmap

Estimated MVP effort: **25--37 working days**, assuming one experienced
full-stack developer and access to the required Jira, GitHub, and agent
integrations. This is a planning estimate and excludes delays caused by
provider access or API limitations.

### Phase 1 --- Foundation and Integrations (4--6 days)

-   Initialize monorepo and shared TypeScript configuration.
-   Set up Next.js dashboard and Fastify API.
-   Configure PostgreSQL, Prisma, Redis, and BullMQ.
-   Implement authentication and organization/project basics.
-   Configure Jira webhook and issue retrieval.
-   Configure GitHub App installation and repository selection.
-   Implement webhook receipts and idempotency.

**Deliverable:** Jira issues can be securely received and associated
with a project/repository.

### Phase 2 --- Investigation Workflow (4--5 days)

-   Implement job state machine.
-   Implement queue orchestration.
-   Normalize Jira issue details and attachments.
-   Build investigator prompt and structured output schema.
-   Persist investigation results and update Jira.
-   Add failure and escalation states.

**Deliverable:** FixPilot can analyze an eligible issue and produce a
structured diagnosis.

### Phase 3 --- Antigravity Adapter and Workspace (5--8 days)

-   Verify supported Antigravity integration method.
-   Implement provider adapter.
-   Build disposable workspace lifecycle.
-   Clone repository and create task branch.
-   Execute bounded coding task.
-   Capture diff, logs, status, and usage.
-   Add cancellation, timeout, and cleanup.

**Deliverable:** Agent can implement a scoped fix in an isolated
branch/workspace.

### Phase 4 --- QA and Review (4--6 days)

-   Configure repository-specific validation commands.
-   Run lint, type checks, tests, and build.
-   Capture logs and artifacts.
-   Implement bounded retry feedback.
-   Implement review stage and risk rules.
-   Escalate failed or risky jobs.

**Deliverable:** Changes are validated and reviewed before PR creation.

### Phase 5 --- GitHub PR and Deployment (4--6 days)

-   Push branch using GitHub App.
-   Create Pull Request and add validation summary.
-   Update Jira with PR URL and status.
-   Observe PR checks and merge events.
-   Configure staging deployment.
-   Configure protected production environment.
-   Add health checks and rollback procedure.

**Deliverable:** Human-reviewed changes can move through staging and
approval-gated production deployment.

### Phase 6 --- Dashboard, Monitoring, and Hardening (4--6 days)

-   Build job overview and detail screens.
-   Add logs, artifacts, PR, and deployment views.
-   Add audit logs and usage tracking.
-   Add monitoring, alerts, and cleanup jobs.
-   Test retries, cancellation, duplicate webhooks, and failures.
-   Perform security and restore testing.

**Deliverable:** An observable, supportable MVP ready for a controlled
pilot.

------------------------------------------------------------------------

## 18. MVP Scope and Acceptance Criteria

### MVP boundaries

Start with:

-   One organization.
-   One Jira project.
-   One GitHub repository.
-   One application and one supported stack.
-   One Antigravity coding-agent integration.
-   One staging environment and one production environment.
-   One configured validation pipeline.
-   Human review of every PR.
-   Human approval for production deployment.

### Acceptance criteria

The MVP is ready for pilot when:

-   Jira webhook events are authenticated and processed idempotently.
-   Only opted-in issues are eligible for automation.
-   The correct repository and base branch are selected.
-   Investigation output is persisted and visible.
-   Agent execution occurs in an isolated workspace.
-   Agent changes are limited to the task branch.
-   Configured QA checks run and results are recorded.
-   Failed QA triggers only bounded retries.
-   High-risk changes are escalated.
-   A PR is created with issue context and validation evidence.
-   Jira is updated with the PR and job status.
-   Branch protection and required human review remain enabled.
-   Staging deployment and health verification work.
-   Production deployment requires authorized human approval.
-   Failed health checks trigger the configured rollback/escalation
    process.
-   All important events are auditable.
-   Secrets are not exposed to agent workspaces or logs.

------------------------------------------------------------------------

## 19. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                    Impact                  Mitigation
  ----------------------- ----------------------- -----------------------
  Agent makes an          Regression or wasted    Deterministic QA,
  incorrect fix           review time             review agent, human PR
                                                  review

  Agent cannot reproduce  Job stalls              Ask for missing
  bug                                             information and
                                                  escalate

  Prompt injection in     Unsafe actions or data  Treat content as
  issue/repository        exposure                untrusted; enforce tool
                                                  and command policy

  Antigravity API changes Integration breakage    Provider adapter and
                                                  integration contract
                                                  tests

  Long agent loops        Unexpected AI costs     Token, time, and retry
                                                  budgets

  Duplicate Jira webhooks Duplicate jobs          Webhook receipt IDs and
                                                  idempotency keys

  Workspace compromise    Cross-project or        Disposable isolated
                          infrastructure risk     workers and restricted
                                                  egress

  Secret leakage          Credential compromise   Secret manager,
                                                  redaction, short-lived
                                                  credentials

  CI checks are bypassed  Unsafe PR               Protected branches and
                                                  independent required
                                                  checks

  Production deployment   Downtime                Staging, health checks,
  failure                                         immutable artifacts,
                                                  rollback

  Database migration risk Data loss               Human escalation and
                                                  migration review

  Excessive permissions   Security exposure       GitHub App least
                                                  privilege and regular
                                                  permission review
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 20. Metrics and Success Measurement

Track:

-   Number of Jira issues received.
-   Percentage eligible for automation.
-   Investigation completion rate.
-   Percentage of jobs that produce a PR.
-   QA pass rate on first attempt.
-   Average number of coding attempts.
-   PR acceptance and merge rate.
-   Average time from Jira issue to PR.
-   Average time from issue to verified deployment.
-   Regression and rollback rate.
-   Human intervention rate.
-   Average agent cost per job.
-   Infrastructure cost per job.
-   Cost per successfully resolved bug.

Do not optimize only for the number of automatically closed issues.
Quality, safety, review burden, and cost per successful resolution are
equally important.

------------------------------------------------------------------------

## 21. Open Decisions Before Implementation

The following decisions should be confirmed during project kickoff:

1.  Monthly bug volume: 20, 100, 500, or 1,000+.
2.  Initial repository count: 1, 2--5, 5--10, or more than 10.
3.  Hosting preference: DigitalOcean, AWS, or lowest-cost VPS.
4.  Initial application stack(s) to support.
5.  Jira Cloud or Jira Data Center.
6.  GitHub Cloud organization and GitHub App ownership.
7.  Antigravity integration method and account/billing model.
8.  Whether staging deployment is already available in each target
    repository.
9.  Required notification channel: email, Slack, or Microsoft Teams.
10. Data retention and compliance requirements.
11. Whether FixPilot is initially internal tooling or a multi-tenant
    commercial SaaS product.

------------------------------------------------------------------------

## 22. Recommended Build Strategy

Build FixPilot as a controlled automation platform, not as a single
prompt that receives a bug and is allowed to operate freely.

The recommended order is:

1.  Make Jira ingestion and job tracking reliable.
2.  Make investigation output structured and useful.
3.  Prove Antigravity can work reliably in an isolated workspace.
4.  Make validation deterministic and repository-configurable.
5.  Create high-quality PRs with clear evidence.
6.  Integrate protected staging and production deployment.
7.  Add multi-tenant controls, billing, analytics, and additional agent
    providers.

The most important technical decision is to keep the **orchestrator
independent from the coding-agent provider**. Antigravity should be an
adapter behind a stable interface. This makes it possible to change
providers, add fallback agents, or support different models without
redesigning the entire platform.

**Final recommendation:** launch with one Jira project, one GitHub
repository, one application stack, and approval-gated deployment.
Validate reliability and cost per successful bug fix before expanding to
multiple repositories and organizations.