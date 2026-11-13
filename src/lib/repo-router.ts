import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import { logger } from './observability';
import { antigravityClient } from './antigravity-client';

export interface RepoManifestEntry {
  name: string;
  purpose: string;
  techStack: string;
  defaultBranch?: string;
  cloneUrl?: string;
  ownedRoutes?: string[];
  components?: string[];
  keywords?: string[];
  owners?: string[];
}

export interface RepoRoutingCandidate {
  repoName: string;
  confidence: number;
  reason: string;
  matchedSignals?: string[];
}

export interface RoutingDecision {
  selectedRepos: string[];
  candidates: RepoRoutingCandidate[];
  requiresHumanInput: boolean;
  confidence: number;
  reasoning: string;
  isMultiRepo: boolean;
  suggestions?: Array<{ repoName: string; reason: string }>;
}

export class RepoRouter {
  private manifestPath: string;
  private cachedManifest: {
    version: string;
    defaultConfidenceThreshold: number;
    repositories: RepoManifestEntry[];
  } | null = null;

  constructor() {
    this.manifestPath = path.join(process.cwd(), 'repos.yaml');
  }

  loadManifest(): {
    version: string;
    defaultConfidenceThreshold: number;
    repositories: RepoManifestEntry[];
  } {
    if (this.cachedManifest) return this.cachedManifest;

    if (fs.existsSync(this.manifestPath)) {
      try {
        const fileContent = fs.readFileSync(this.manifestPath, 'utf8');
        const parsed = YAML.parse(fileContent);
        if (parsed && Array.isArray(parsed.repositories)) {
          this.cachedManifest = {
            version: parsed.version || '1.0',
            defaultConfidenceThreshold: parsed.defaultConfidenceThreshold || 0.8,
            repositories: parsed.repositories
          };
          return this.cachedManifest;
        }
      } catch (err: any) {
        logger.warn(`Failed to parse repos.yaml: ${err.message}. Using default manifest.`);
      }
    }

    // Default fallback manifest
    this.cachedManifest = {
      version: '1.0',
      defaultConfidenceThreshold: 0.8,
      repositories: [
        {
          name: 'CMS_FRONTEND',
          purpose: 'Content Management System admin portal & store setup UI',
          techStack: 'Next.js 14, React, Tailwind CSS, TypeScript',
          ownedRoutes: ['/dashboard', '/store-setup', '/customers', '/orders', '/products'],
          components: ['StoreSetup', 'Sidebar', 'Navbar', 'ProductList'],
          keywords: ['cms', 'store setup', 'store-setup', 'dashboard', 'customer', 'order']
        },
        {
          name: 'CMS_BACKEND',
          purpose: 'Fastify backend API services for CMS',
          techStack: 'Node.js, Fastify, TypeScript, Prisma',
          ownedRoutes: ['/api/cms/*', '/api/products/*', '/api/orders/*'],
          keywords: ['cms backend', 'cms api', 'fastify', 'database', 'api']
        },
        {
          name: 'STOREFRONT_FRONTEND',
          purpose: 'Customer-facing e-commerce storefront',
          techStack: 'Next.js, React, Tailwind CSS, TypeScript',
          ownedRoutes: ['/', '/cart', '/checkout', '/catalog', '/product/*'],
          keywords: ['storefront', 'shop', 'cart', 'checkout', 'catalog']
        },
        {
          name: 'STOREFRONT_BACKEND',
          purpose: 'Customer storefront API and order checkout processing',
          techStack: 'Node.js, Express/Fastify, TypeScript',
          ownedRoutes: ['/api/storefront/*', '/api/cart/*', '/api/checkout/*'],
          keywords: ['storefront api', 'checkout api', 'cart api']
        },
        {
          name: 'MASTER_ADMIN',
          purpose: 'Super-admin console for multi-tenant and system management',
          techStack: 'Next.js, React, TypeScript',
          ownedRoutes: ['/admin/tenants', '/admin/users', '/admin/billing'],
          keywords: ['master admin', 'super admin', 'tenant', 'tenants']
        },
        {
          name: 'wendr_homepage',
          purpose: 'Marketing landing page and public documentation',
          techStack: 'HTML, Static/Next.js',
          ownedRoutes: ['/', '/pricing', '/docs'],
          keywords: ['wendr homepage', 'landing page', 'marketing', 'docs']
        }
      ]
    };
    return this.cachedManifest;
  }

  /**
   * Routes a bug task to one or more target repositories
   * Follows PRD Section 4A:
   * 1. Explicit override (repo:<name>)
   * 2. Manifest match
   * 3. Read-only AI triage
   * 4. Decision with confidence threshold
   */
  async routeBug(input: {
    issueKey: string;
    title: string;
    description: string;
    labels?: string[];
    availableRepos: Array<{ id: string; name: string; cloneUrl?: string | null }>;
  }): Promise<RoutingDecision> {
    const manifest = this.loadManifest();
    const threshold = manifest.defaultConfidenceThreshold || 0.8;
    const labels = (input.labels || []).map((l) => l.trim().toLowerCase());

    // 1. Step: Explicit Override via repo:<name> label
    for (const label of labels) {
      if (label.startsWith('repo:')) {
        const repoName = label.slice(5).trim();
        const matched = input.availableRepos.find(
          (r) => r.name.toLowerCase() === repoName.toLowerCase()
        );
        if (matched) {
          await logger.info(
            `[ROUTER] Explicit label override detected: "${label}". Directing to repository "${matched.name}".`,
            { stage: 'ROUTING' }
          );
          return {
            selectedRepos: [matched.name],
            candidates: [{ repoName: matched.name, confidence: 1.0, reason: `Explicit label "${label}" override.` }],
            requiresHumanInput: false,
            confidence: 1.0,
            reasoning: `Explicit override by label "${label}".`,
            isMultiRepo: false
          };
        }
      }
    }

    // 2. Step: Manifest match scoring
    const fullText = `${input.title} ${input.description}`.toLowerCase();
    const scores: Record<string, { score: number; signals: string[] }> = {};

    for (const repo of manifest.repositories) {
      let score = 0;
      const signals: string[] = [];

      // Check keywords
      for (const kw of repo.keywords || []) {
        if (fullText.includes(kw.toLowerCase())) {
          score += 2;
          signals.push(`keyword:${kw}`);
        }
      }

      // Check owned routes
      for (const route of repo.ownedRoutes || []) {
        const cleanRoute = route.replace(/\/\*$/, '').toLowerCase();
        if (cleanRoute.length > 2 && fullText.includes(cleanRoute)) {
          score += 4;
          signals.push(`route:${route}`);
        }
      }

      // Check components
      for (const comp of repo.components || []) {
        if (fullText.includes(comp.toLowerCase())) {
          score += 3;
          signals.push(`component:${comp}`);
        }
      }

      // Check repo name direct mention
      const cleanRepoName = repo.name.toLowerCase().replace(/[-_]/g, ' ');
      if (fullText.includes(cleanRepoName) || fullText.includes(repo.name.toLowerCase())) {
        score += 5;
        signals.push(`repo_name:${repo.name}`);
      }

      scores[repo.name] = { score, signals };
    }

    // 3. Step: Read-only AI Triage with Antigravity AI
    const manifestContext = manifest.repositories
      .map(
        (r) =>
          `- ${r.name} (${r.techStack}): ${r.purpose}. Routes: ${(r.ownedRoutes || []).join(', ')}. Key components: ${(r.components || []).join(', ')}`
      )
      .join('\n');

    const triagePrompt = `You are the FixPilot Autonomous Multi-Repo Router.
Task: Evaluate which repository or repositories among the project's codebase are affected by this issue and must be fixed.

Issue Key: ${input.issueKey}
Summary: ${input.title}
Description:
"""
${input.description}
"""

Repository Manifest:
${manifestContext}

Initial Signal Matches:
${Object.entries(scores)
  .map(([name, s]) => `- ${name}: score=${s.score}, signals=[${s.signals.join(', ')}]`)
  .join('\n')}

Instructions:
1. Provide a confidence score between 0.0 and 1.0 for each repository.
2. Provide a 1-sentence reason for each candidate repository.
3. If this issue affects multiple repositories (e.g. both frontend UI and backend API), assign confidence >= 0.8 to both.
4. If an issue is strictly isolated to a single component/page (e.g. CMS store setup UI navigation), assign high confidence (>= 0.85) to that single repository and low confidence (< 0.3) to backend, storefront, and landing page repos.

Respond strictly in valid JSON matching this schema:
{
  "candidates": [
    {
      "repoName": "EXACT_REPO_NAME",
      "confidence": 0.95,
      "reason": "Brief 1-sentence reason"
    }
  ]
}`;

    let candidates: RepoRoutingCandidate[] = [];

    try {
      const responseText = await antigravityClient.generateContent(triagePrompt, true);
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed.candidates)) {
        candidates = parsed.candidates.map((c: any) => ({
          repoName: c.repoName,
          confidence: typeof c.confidence === 'number' ? c.confidence : 0.5,
          reason: c.reason || 'Identified via triage',
          matchedSignals: scores[c.repoName]?.signals || []
        }));
      }
    } catch (err: any) {
      await logger.warn(`[ROUTER] AI Triage failed: ${err.message}. Using manifest heuristic score.`);
      // Heuristic fallback
      candidates = manifest.repositories.map((r) => {
        const s = scores[r.name]?.score || 0;
        const confidence = s >= 5 ? 0.9 : s >= 2 ? 0.7 : 0.2;
        return {
          repoName: r.name,
          confidence,
          reason: s >= 5 ? 'Strong manifest signal match' : 'Heuristic scoring',
          matchedSignals: scores[r.name]?.signals || []
        };
      });
    }

    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);

    // 4. Step: Decision Logic
    const highConfidenceCandidates = candidates.filter((c) => c.confidence >= threshold);

    if (highConfidenceCandidates.length > 0) {
      const selectedRepos = highConfidenceCandidates.map((c) => c.repoName);
      const isMultiRepo = selectedRepos.length > 1;
      const reasoning = isMultiRepo
        ? `Multi-repo issue spanning: ${highConfidenceCandidates.map((c) => `${c.repoName} (${Math.round(c.confidence * 100)}%) - ${c.reason}`).join('; ')}`
        : `Target repository confirmed: ${highConfidenceCandidates[0].repoName} (${Math.round(highConfidenceCandidates[0].confidence * 100)}% confidence) - ${highConfidenceCandidates[0].reason}`;

      await logger.info(`[ROUTER] Routing decision: ${reasoning}`, { stage: 'ROUTING' });

      return {
        selectedRepos,
        candidates,
        requiresHumanInput: false,
        confidence: highConfidenceCandidates[0].confidence,
        reasoning,
        isMultiRepo
      };
    }

    // Low confidence: Top 2 candidates
    const top2 = candidates.slice(0, 2);
    const lowConfidenceReason = `Confidence below threshold (${threshold}). Top candidates: ${top2.map((c) => `"${c.repoName}" (${Math.round(c.confidence * 100)}% - ${c.reason})`).join(', ')}.`;

    await logger.warn(`[ROUTER] Ambiguous routing: ${lowConfidenceReason}`, { stage: 'ROUTING' });

    return {
      selectedRepos: top2.map((c) => c.repoName),
      candidates,
      requiresHumanInput: true,
      confidence: top2[0]?.confidence || 0,
      reasoning: lowConfidenceReason,
      isMultiRepo: false,
      suggestions: top2.map((c) => ({ repoName: c.repoName, reason: c.reason }))
    };
  }
}

export const repoRouter = new RepoRouter();

