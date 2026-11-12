import db from '../src/lib/db';

async function main() {
  console.log('🌱 Starting FixPilot database seed...');

  // 1. Create Organization
  const org = await db.organization.upsert({
    where: { slug: 'acme-fintech' },
    update: {},
    create: {
      name: 'Acme Global FinTech',
      slug: 'acme-fintech',
      plan: 'enterprise_pilot'
    }
  });
  console.log(`✓ Organization ready: ${org.name} (${org.id})`);

  // 2. Create Users
  const approverUser = await db.user.upsert({
    where: { email: 'lead.approver@fixpilot.ai' },
    update: {},
    create: {
      email: 'lead.approver@fixpilot.ai',
      name: 'Sarah Chen (Release Approver)'
    }
  });

  const adminUser = await db.user.upsert({
    where: { email: 'admin@fixpilot.ai' },
    update: {},
    create: {
      email: 'admin@fixpilot.ai',
      name: 'Alex Rivera (Platform Admin)'
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
  console.log('✓ Organization members & roles seeded.');

  // 3. Create Project
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
      name: 'Web & Payment Checkout Service',
      key: 'WEB',
      description: 'Core microservice for processing credit card and 3D-secure transactions.'
    }
  });
  console.log(`✓ Project ready: [${project.key}] ${project.name}`);

  // 4. Create Repository
  await db.repository.upsert({
    where: {
      projectId_githubRepoId: {
        projectId: project.id,
        githubRepoId: 'repo_acme_core'
      }
    },
    update: {},
    create: {
      projectId: project.id,
      githubRepoId: 'repo_acme_core',
      owner: 'acme-fintech',
      name: 'payment-service',
      defaultBranch: 'main',
      cloneUrl: 'https://github.com/acme-fintech/payment-service.git'
    }
  });
  console.log('✓ Repository mapped: acme-fintech/payment-service (branch: main)');

  // 5. Create Integrations
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
      name: 'Jira Cloud (Production Workspace)',
      status: 'CONNECTED',
      metadata: JSON.stringify({ host: 'https://fixpilot.atlassian.net', projectKey: 'WEB' })
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
      name: 'GitHub App (Acme Org)',
      status: 'CONNECTED',
      metadata: JSON.stringify({ org: 'acme-fintech', permissions: 'pull_requests:write, contents:write' })
    }
  });
  console.log('✓ Integrations configured: Jira Cloud & GitHub App.');

  // 6. Create Initial Bug WEB-1024
  const bug = await db.bug.upsert({
    where: {
      projectId_jiraIssueId: {
        projectId: project.id,
        jiraIssueId: 'jira_web_1024'
      }
    },
    update: {},
    create: {
      projectId: project.id,
      jiraIssueId: 'jira_web_1024',
      jiraIssueKey: 'WEB-1024',
      title: 'Payment checkout fails with timeout race condition on 3DS callback',
      description: 'Users on 3DS verification report intermittent 504 timeouts. The payment processor drops connection after 3s before bank webhook completes. Missing idempotency causes duplicate charges when retried.',
      status: 'Open',
      priority: 'High',
      labels: JSON.stringify(['ai-fix-opt-in', 'bug', 'payments', 'critical-path'])
    }
  });
  console.log(`✓ Seed bug ready: [${bug.jiraIssueKey}] ${bug.title}`);

  console.log('✨ Seed complete! You can now start the Next.js app or run the e2e demo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
