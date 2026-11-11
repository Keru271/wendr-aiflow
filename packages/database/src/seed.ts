import { db } from './index.js';

export async function seed() {
  console.log('Seeding FixPilot database...');

  // Create Organization
  const org = await db.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'enterprise'
    }
  });

  // Create Users
  const adminUser = await db.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Sarah Connor (Admin)'
    }
  });

  const approverUser = await db.user.upsert({
    where: { email: 'approver@acme.com' },
    update: {},
    create: {
      email: 'approver@acme.com',
      name: 'Alex Murphy (Approver)'
    }
  });

  const devUser = await db.user.upsert({
    where: { email: 'dev@acme.com' },
    update: {},
    create: {
      email: 'dev@acme.com',
      name: 'David Lightman (Developer)'
    }
  });

  // Link Org Members
  await db.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: adminUser.id
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: adminUser.id,
      role: 'ADMIN'
    }
  });

  await db.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: approverUser.id
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: approverUser.id,
      role: 'APPROVER'
    }
  });

  await db.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: devUser.id
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: devUser.id,
      role: 'DEVELOPER'
    }
  });

  // Create Integrations
  await db.integration.upsert({
    where: {
      organizationId_provider: {
        organizationId: org.id,
        provider: 'JIRA'
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      provider: 'JIRA',
      name: 'Acme Atlassian Jira Cloud',
      status: 'CONNECTED',
      metadata: JSON.stringify({ host: 'https://acme-jira.atlassian.net', projectKey: 'WEB' })
    }
  });

  await db.integration.upsert({
    where: {
      organizationId_provider: {
        organizationId: org.id,
        provider: 'GITHUB'
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      provider: 'GITHUB',
      name: 'Acme GitHub App Integration',
      status: 'CONNECTED',
      metadata: JSON.stringify({ installationId: 54321, account: 'acme-corp' })
    }
  });

  // Create Project
  const project = await db.project.upsert({
    where: {
      organizationId_key: {
        organizationId: org.id,
        key: 'WEB'
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Web Ecommerce Checkout',
      key: 'WEB',
      description: 'Core web storefront and checkout flow',
      settings: JSON.stringify({
        autoFixEnabled: true,
        optInLabel: 'ai-auto-fix',
        maxRetries: 3,
        qaTimeoutSeconds: 180,
        riskThreshold: 'high'
      })
    }
  });

  // Connect Repository
  const repo = await db.repository.upsert({
    where: {
      projectId_githubRepoId: {
        projectId: project.id,
        githubRepoId: '98765432'
      }
    },
    update: {},
    create: {
      projectId: project.id,
      githubRepoId: '98765432',
      owner: 'acme-corp',
      name: 'ecommerce-frontend',
      defaultBranch: 'main',
      cloneUrl: 'https://github.com/acme-corp/ecommerce-frontend.git',
      settings: JSON.stringify({
        language: 'typescript',
        packageManager: 'npm',
        installCommand: 'npm ci',
        lintCommand: 'npm run lint',
        typeCheckCommand: 'npx tsc --noEmit',
        testCommand: 'npm test -- --runInBand',
        buildCommand: 'npm run build',
        allowedPaths: ['src/**'],
        restrictedPaths: ['.github/workflows/**', 'credentials/**', 'config/secrets/**']
      })
    }
  });

  // Create Sample Bug
  const sampleBug = await db.bug.upsert({
    where: {
      projectId_jiraIssueId: {
        projectId: project.id,
        jiraIssueId: 'JIRA-10024'
      }
    },
    update: {},
    create: {
      projectId: project.id,
      jiraIssueId: 'JIRA-10024',
      jiraIssueKey: 'WEB-1024',
      title: 'Coupon validation does not handle expired coupon response',
      description: 'When applying an expired coupon code in checkout, the form hangs with an unhandled rejection instead of displaying the invalid coupon error message.',
      status: 'Open',
      priority: 'High',
      labels: JSON.stringify(['ai-auto-fix', 'checkout', 'bug']),
      sourcePayload: JSON.stringify({
        key: 'WEB-1024',
        fields: {
          summary: 'Coupon validation does not handle expired coupon response',
          environment: 'Staging / Chrome 120',
          reproduction: '1. Add item to cart\n2. Go to /checkout\n3. Enter expired coupon EXPIRED2024\n4. Observe uncaught API response error'
        }
      })
    }
  });

  // Initial audit log
  await db.auditLog.create({
    data: {
      organizationId: org.id,
      userId: adminUser.id,
      actorEmail: adminUser.email,
      action: 'SYSTEM_SEEDED',
      targetType: 'SYSTEM',
      targetId: org.id,
      metadata: JSON.stringify({ message: 'FixPilot database seeded with demo tenant and project WEB.' })
    }
  });

  console.log(`Seeding complete! Org ID: ${org.id}, Project ID: ${project.id}, Sample Bug: ${sampleBug.jiraIssueKey}`);
}

// If run directly via tsx
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seed()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => db.$disconnect());
}

