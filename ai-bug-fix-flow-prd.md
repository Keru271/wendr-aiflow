# PRD: AI Bug-to-PR Automation Flow

**Status:** Draft v1 · **Date:** 13 Nov 2026

## 1. Problem

Small and medium bugs sit in the backlog because engineers are busy with feature work. Each one still costs triage, context switching, a fix, tests and a PR. Goal: when a bug task is created, an AI agent does the first full pass and a human only reviews a ready PR.

## 2. Goals and non-goals

**Goals**

- Bug task created → draft PR on GitHub with no human typing code.
- Median time from task to PR under 30 minutes.
- At least 40% of eligible bugs produce a PR that merges with minor or no edits (target after 3 months).
- Human review always required before merge.

**Non-goals (v1)**

- Auto-merge to main.
- Security, payments, auth, DB migrations or infra bugs.
- Feature work or large refactors.

## 3. Users

- **Reporter** (QA, PM, dev): creates the bug task.
- **Reviewer** (dev): reviews the AI's PR.
- **Admin** (tech lead): configures repos, limits, labels and budget.

## 4. How the flow works

1. **Trigger.** A task is created in the tracker (Jira, Linear or GitHub Issues) with type `Bug` and label `ai-fix`. A webhook fires to the orchestrator.
2. **Eligibility check.** The orchestrator validates: project mapped to its repo set, description has steps/expected/actual, not in the blocked-area list. If info is missing, it comments on the task asking for it and stops.
3. **Repo routing.** The router decides which of the project's repositories (5 in this setup) the bug belongs to. See section 4A. Output: one or more target repos with confidence scores, or a request for human input.
4. **Job queued.** One job per target repo, with retry and concurrency limits.
5. **Workspace prep.** The local-parity agent machine (section 4B) uses its persistent clone of the selected repo(s), fetches the latest default branch, creates a git worktree on branch `ai/bug-<ID>-<slug>`, installs dependencies and runs the baseline tests.
6. **Agent run.** The orchestrator calls Antigravity headlessly (CLI `agy` headless mode on the local-parity agent machine, with the same install, login, settings, rules and MCP servers as a developer's local Antigravity; SDK as fallback) with a prompt built from: bug title, description, logs/screenshots, repo conventions file (`AGENTS.md`), and rules (minimal diff, add a regression test, don't touch unrelated files).
7. **Verify.** The runner executes lint, type-check, unit tests and build. If they fail, the agent gets the error output and retries (max 3 loops).
8. **Raise PR.** The orchestrator pushes the branch and opens a **draft PR** through the GitHub API, with: root-cause summary, files changed, tests added, risk notes, and a link back to the task.
9. **Sync back.** The task is moved to "In Review" and every PR link is posted on it (cross-linked if more than one repo). Reviewers are auto-assigned via CODEOWNERS.
10. **Human review.** Reviewer comments → optional "AI, address feedback" re-run on the same branch. Reviewer merges.
11. **Failure path.** If the agent can't reproduce or fix within limits, it posts its findings on the task, removes `ai-fix` and tags a human.

```
Bug task → Webhook → Orchestrator → Eligibility
        → Repo router (manifest + triage) → 1..n target repos
        → Local-parity agent machine (persistent clone, worktree, tests)
        → Antigravity agent (fix + test) ⇄ verify loop
        → Push branch → Draft PR → Task updated → Human review
```

## 4A. Repo routing (multi-repo projects)

One project spans five repositories, so the flow must pick the right repo(s) before any code is changed.

**Inputs**

- **Repo manifest** (`repos.yaml`, maintained by the Admin): per repo, name, purpose, tech stack, owned routes/APIs/components, keywords, owners.
- **Task signals:** explicit `repo:<name>` label or field, stack traces, file paths, URLs, API endpoints, error messages, screenshots/logs.

**Routing steps**

1. **Explicit override.** If the task carries a `repo:` label, use it and skip triage.
2. **Manifest match.** Score each repo against the task text using routes, components and keywords from the manifest.
3. **Read-only triage.** Clone all five repos into one read-only workspace. The agent searches them (error strings, routes, component names, recent commits) and returns ranked candidates, each with a confidence score and a one-line reason. No writes at this stage.
4. **Decision.**
   - *One repo, confidence at or above threshold (default 0.8):* proceed to the fix.
   - *Several repos affected (e.g. frontend and API):* run one fix job per repo, open one PR each, cross-link the PRs and post them all on the task.
   - *Low confidence:* comment on the task with the top 2 candidates and reasons, then wait for a human to add a `repo:` label, which re-triggers the flow.
5. **Audit.** Post the routing decision and reasoning as a task comment and store it with the run logs.

**Guardrails**

- Fix jobs get write access only to the repos the router selected.
- A wrong routing decision can be corrected by relabeling and re-running; the old branch/PR is closed automatically.
- Threshold and ranking prompts are configurable per project.

## 4B. Local-parity Antigravity setup

The agent must behave exactly like Antigravity on a developer's own machine, so results are predictable and any dev can reproduce an AI run locally.

**What "local-parity" means**

- **Same product and version:** the Antigravity CLI (`agy`) installed on a dedicated, always-on agent machine (VM, mini PC or workstation), not a throwaway container. The version is pinned to the one the team uses locally.
- **Same login:** authenticated once interactively (browser OAuth), exactly like a local install, with credentials persisted on the machine. Headless runs that are not authenticated exit with an auth error instead of hanging, so a health check can catch it. Prefer a dedicated service Google account/plan over a personal one.
- **Same settings:** model choice, verbosity and other CLI settings (kept in the CLI settings file, e.g. `~/.gemini/antigravity-cli/settings.json`) come from one shared template applied to every dev machine and the agent machine.
- **Same project context:** `AGENTS.md`/rules, MCP servers and any skills or customizations live in the repo or the shared template, so the agent sees what a local run sees.
- **Same repos and toolchain:** persistent clones of all five repos in a fixed workspace folder, `git fetch` before every run, one git worktree per job so jobs never collide, warm dependency caches, the same Node/package-manager versions, dev-only env files, and the same lint/test/build commands as local.

**How a run executes**

1. Orchestrator sends the job to a small agent daemon (or SSH) on the machine.
2. Daemon creates the worktree and runs `agy` in headless mode inside it with the built prompt, capturing machine-readable output.
3. Verify loop, push and PR creation run from the same machine.
4. Prompt, conversation ID, artifacts, logs and diff are stored so a dev can check out the branch and rerun the same prompt locally.

**Operations**

- Health check every few minutes (a trivial prompt); alert on expired auth or empty output.
- Pinned-version upgrade process, tested on one dev machine first.
- Concurrency: one active agent run per machine at the start, more worktrees later.
- Backups or an image of the machine so it can be rebuilt quickly.

**Known risk and fallback:** community reports say `agy` print mode can return empty output when no terminal is attached, and the CLI's API-key auth was not supported at the time of writing. Mitigation: run it through a pseudo-terminal wrapper, or fall back to the Antigravity SDK while keeping the same settings and rules.

## 5. Functional requirements

| # | Requirement | Priority |
| --- | --- | --- |
| F1 | Trigger from tracker webhook (label + type) | P0 |
| F2 | Repo manifest per project/board (multiple repos) | P0 |
| F3 | Agent run on the dedicated agent machine, no prod secrets, restricted network | P0 |
| F4 | Mandatory test/lint/build gate before PR | P0 |
| F5 | Draft PR with structured description | P0 |
| F6 | Two-way sync of status and links with tracker | P0 |
| F7 | Blocked paths/labels (auth, payments, migrations) | P0 |
| F8 | Per-job timeout, retry cap, daily job cap, budget cap | P0 |
| F9 | Re-run on PR review comments | P1 |
| F10 | Dashboard: success rate, cost per PR, time to PR | P1 |
| F11 | Slack/Teams notifications | P2 |
| F12 | Repo router: manifest match + read-only triage across all project repos | P0 |
| F13 | Confidence threshold; below it, ask a human with top candidates | P0 |
| F14 | Multi-repo bugs: one PR per repo, cross-linked on the task | P1 |
| F15 | `repo:` label override and re-route/re-run after relabel | P1 |
| F16 | Local-parity agent machine: same Antigravity version, login, settings, rules and MCP as dev setup | P0 |
| F17 | Persistent clones of all repos, one git worktree per job | P0 |
| F18 | Health check and alerts for expired auth or empty agent output | P0 |
| F19 | Store prompt, conversation ID and artifacts so any run can be reproduced locally | P1 |

## 6. Non-functional requirements

- **Security:** least-privilege GitHub App (contents + pull requests only), no direct push to protected branches, secrets in a vault, the agent machine runs as a dedicated OS user with no production credentials and outbound access limited to allow-listed hosts (GitHub, Google, package registries, the tracker).
- **Auditability:** store the prompt, agent artifacts, logs and diff for every run.
- **Reliability:** jobs idempotent per task ID; duplicate webhooks ignored.
- **Privacy:** confirm code-use/data terms of the chosen Antigravity plan before sending client code (important for client projects).

## 7. Tech approach

- **Orchestrator:** small Node/TypeScript service (or n8n/GitHub Actions workflow for v0) + queue (e.g., BullMQ/Redis or SQS).
- **Agent runtime:** Antigravity CLI headless mode (`agy`, machine-readable output, exits with an auth error in CI if not authenticated) or the Antigravity SDK. Known caveat: community reports show the CLI's print mode can return empty output when not attached to a terminal, and the CLI's API-key auth wasn't supported at the time of writing; Google pointed API-key use cases to the SDK. **Spike this first.**
- **GitHub:** GitHub App for auth, Octokit for branch/PR.
- **Agent machine:** a dedicated always-on machine set up like a developer's local environment (section 4B). GitHub Actions can still run the PR checks, but the agent itself does not run in ephemeral CI.

## 8. Pricing (verify before budgeting)

Antigravity pricing changed several times in 2026 and sources disagree on exact numbers, so treat these as planning figures.

**A. Antigravity access**

| Option | Cost | Fit |
| --- | --- | --- |
| Free tier | $0, weekly-refreshing limited quota | Prototype only |
| Google AI Pro | \~$20/month (bundled; quota refreshes every 5h up to a weekly cap) | 1 dev / small pilot |
| Google AI Ultra tiers | \~$100 and \~$200/month (store prices $99.99 / $199.99) | Heavy usage, higher limits |
| Overage credits | \~$25 per 2,500 credits, only after quota is exhausted | Burst usage |
| Enterprise / pay-as-you-go | Consumption-based via a Google Cloud project | **Best fit for an automated, multi-user flow** |

Note: consumer plans are per-person subscriptions and metered by agent work, not per prompt. For a shared server-side bot, the Google Cloud pay-as-you-go route (or the SDK) is the more sensible and policy-safe path. Confirm with Google that running a bot on a personal subscription is permitted. A local-parity setup normally uses the same OAuth login as a local install, so this check matters even more; per community answers from the Antigravity team, a pay-as-you-go Google Cloud project can also be attached to the CLI.

**B. Other running costs (approximate)**

| Item | Estimate |
| --- | --- |
| Agent machine (always-on) | Existing machine, or roughly $20–60/month for a cloud VM (estimate) |
| GitHub Actions (PR checks only) | Free minutes included on most plans, then roughly $0.006–0.008/min on Linux |
| Orchestrator hosting + queue | $5–25/month (small VPS/serverless) |
| Tracker (Jira/Linear/GitHub Issues) | Existing |
| Storage/logs | Under $5/month at pilot scale |

**C. Illustrative monthly budget (assumptions, not quotes)**

| Scenario | Bugs/month | Estimated total |
| --- | --- | --- |
| Pilot (1 dev) | 20–40 | \~$25–50 (AI Pro + hosting) |
| Small team | 100–200 | \~$150–400 (higher plan or pay-as-you-go + CI) |
| Larger org | 500+ | Custom GCP enterprise pricing |

The router's read-only triage adds a small agent run per task (searching five repos), so budget slightly more usage per bug; the manifest and explicit labels reduce this by skipping triage when routing is obvious.

Rule of thumb to track: **cost per merged PR = (AI + CI + hosting) ÷ merged PRs.** If it is lower than \~30 minutes of developer time, the flow pays for itself.

## 9. Success metrics

- PR creation rate (eligible bugs → PR)
- Merge rate without major edits
- Median time task → PR
- Cost per merged PR
- Regression rate (bugs reopened within 14 days)
- Reviewer satisfaction (monthly 1–5 survey)
- Routing accuracy (share of bugs sent to the correct repo first time) and share needing human routing

## 10. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Wrong or risky fix | Draft PRs only, required tests, human review, blocked areas |
| Poor bug reports → poor fixes | Eligibility check, template enforcement |
| Cost runaway | Daily job cap, per-job token/time cap, budget alerts |
| Prompt injection via bug text | Treat task text as untrusted, sandbox, no secrets, restricted network |
| Antigravity CLI headless/auth limits | Early spike; fall back to SDK or another agent runtime |
| Plan/quota changes | Abstract the agent behind an interface so the engine can be swapped |
| Client code privacy | Review data terms; use enterprise plan for client repos |
| Bug routed to the wrong repo | Manifest + triage, confidence threshold, human fallback, `repo:` override, routing accuracy metric |
| Bug spans several repos | One PR per repo, cross-linked, reviewed together |
| Agent machine is a single point of failure | Health checks, machine image/backup, documented rebuild |
| Login expires or config drifts from dev setup | Alert on auth errors, shared settings template, pinned version |
| Always-on machine holds repo access | Dedicated OS user, no prod secrets, restricted network, protected branches |

## 11. Rollout

- **Phase 0 (1 week):** Spike headless Antigravity on one repo, one hand-written bug.
- **Phase 1 (2–3 weeks):** Webhook → draft PR on a single repo, `ai-fix` label only.
- **Phase 2 (3–4 weeks):** Verify loop, tracker sync, review-feedback re-runs, dashboard.
- **Phase 3:** Expand to more repos, tune prompts from merge/reject data.

## 12. Open questions

- Which tracker is the source of truth?
- Personal subscription vs Google Cloud billing for the bot?
- Which repos and bug categories are in scope first?
- Who maintains `repos.yaml`, and how is it kept current as repos change?
- Should bugs spanning several repos be fixed in parallel or in a set order (e.g. API first)?
- Where will the agent machine run (office machine, cloud VM or a developer workstation), and who maintains it?
- Who owns reviewing AI PRs (rotation vs CODEOWNERS)?