import { logger } from './observability';

export interface EligibilityResult {
  isEligible: boolean;
  reason: string;
  category?: 'ELIGIBLE' | 'BLOCKED_AREA' | 'MISSING_INFO' | 'UNMAPPED_PROJECT';
  missingFields?: string[];
}

export class EligibilityChecker {
  // Blocked areas per PRD v1: Security, payments, auth, DB migrations, infra
  private static BLOCKED_KEYWORDS = [
    'security',
    'vulnerability',
    'cve',
    'exploit',
    'xss',
    'injection',
    'payment',
    'billing',
    'stripe',
    'paypal',
    'credit card',
    'auth',
    'oauth',
    'jwt',
    'password',
    'login session',
    'credential',
    'migration',
    'database migration',
    'schema migration',
    'infra',
    'terraform',
    'kubernetes',
    'k8s',
    'helm',
    'dockerfile'
  ];

  private static BLOCKED_LABELS = new Set([
    'security',
    'payments',
    'payment',
    'auth',
    'authentication',
    'migration',
    'migrations',
    'infra',
    'infrastructure'
  ]);

  /**
   * Validates if a bug task meets the criteria for autonomous AI fixing
   */
  static checkEligibility(input: {
    issueKey: string;
    title: string;
    description: string;
    labels?: string[];
    repositoriesCount: number;
  }): EligibilityResult {
    // 1. Verify project has mapped repositories
    if (input.repositoriesCount === 0) {
      return {
        isEligible: false,
        category: 'UNMAPPED_PROJECT',
        reason: `Project has no connected repositories in FixPilot. Cannot route or fix task.`
      };
    }

    // 2. Check for blocked labels
    const labels = (input.labels || []).map((l) => l.toLowerCase().trim());
    for (const label of labels) {
      if (this.BLOCKED_LABELS.has(label)) {
        return {
          isEligible: false,
          category: 'BLOCKED_AREA',
          reason: `Issue contains blocked label "${label}". As per PRD v1, security, payments, auth, migrations, and infra require manual human engineering.`
        };
      }
    }

    // 3. Check for blocked keyword areas in title and description
    const fullText = `${input.title} ${input.description}`.toLowerCase();
    for (const kw of this.BLOCKED_KEYWORDS) {
      // Look for whole-word or distinctive boundaries
      const regex = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (regex.test(fullText)) {
        // Exclude false positives for benign UI words like "auth token" vs "payment button text"
        const isCriticalBlocked =
          kw === 'security' ||
          kw === 'cve' ||
          kw === 'exploit' ||
          kw === 'payment' ||
          kw === 'stripe' ||
          kw === 'paypal' ||
          kw === 'credit card' ||
          kw === 'migration' ||
          kw === 'terraform' ||
          kw === 'kubernetes';

        if (isCriticalBlocked) {
          return {
            isEligible: false,
            category: 'BLOCKED_AREA',
            reason: `Issue mentions "${kw}" (blocked domain). Security, payments, auth, database migrations, and infra bugs are protected from autonomous changes in v1.`
          };
        }
      }
    }

    // 4. Validate description quality (steps/expected/actual or sufficient detail)
    const cleanDesc = input.description.trim();
    if (!cleanDesc || cleanDesc.length < 15) {
      return {
        isEligible: false,
        category: 'MISSING_INFO',
        missingFields: ['description'],
        reason: `Issue description is empty or too brief (${cleanDesc.length} chars). Autonomous fixing requires description with reproduction steps or expected vs actual behavior.`
      };
    }

    return {
      isEligible: true,
      category: 'ELIGIBLE',
      reason: 'Bug task is eligible for autonomous AI resolution.'
    };
  }
}

