import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import { authRoutes, organizationRoutes } from './modules/auth/routes.js';
import { projectRoutes, integrationRoutes } from './modules/projects/routes.js';
import { webhookRoutes } from './modules/webhooks/routes.js';
import { bugRoutes, jobRoutes } from './modules/jobs/routes.js';
import { pullRequestRoutes, deploymentRoutes } from './modules/deployments/routes.js';
import { auditRoutes, usageRoutes } from './modules/audit/routes.js';
import { demoRoutes } from './modules/demo/routes.js';
import { getDashboardHtml } from './dashboard-ui.js';
import { logger } from '@fixpilot/observability';

export async function buildServer() {
  const server = Fastify({
    logger: false,
    bodyLimit: 10485760 // 10MB
  });

  // Plugins
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  });

  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-fixpilot-key-32-characters-minimum'
  });

  await server.register(sensible);

  // Health and Readiness Check (Section 15.3)
  server.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'fixpilot-api',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  });

  // Operations Dashboard UI (Section 6.11)
  server.get('/', async (req, reply) => {
    reply.type('text/html').send(getDashboardHtml());
  });

  server.get('/dashboard', async (req, reply) => {
    reply.type('text/html').send(getDashboardHtml());
  });

  // Register Modules
  await server.register(authRoutes);
  await server.register(organizationRoutes);
  await server.register(projectRoutes);
  await server.register(integrationRoutes);
  await server.register(webhookRoutes);
  await server.register(bugRoutes);
  await server.register(jobRoutes);
  await server.register(pullRequestRoutes);
  await server.register(deploymentRoutes);
  await server.register(auditRoutes);
  await server.register(usageRoutes);
  await server.register(demoRoutes);

  return server;
}

export async function start() {
  const server = await buildServer();
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = '0.0.0.0';

  try {
    await server.listen({ port, host });
    console.log(`FixPilot Fastify API listening on http://${host}:${port}`);
    await logger.info(`FixPilot API server started on port ${port}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  start();
}

