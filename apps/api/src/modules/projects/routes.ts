import { FastifyInstance } from 'fastify';
import { db } from '@fixpilot/database';

export async function projectRoutes(fastify: FastifyInstance) {
  fastify.get('/projects', async () => {
    return await db.project.findMany({
      include: {
        repositories: true,
        _count: { select: { bugs: true, jobs: true } }
      }
    });
  });

  fastify.get('/projects/:id', async (req: any, reply) => {
    const project = await db.project.findUnique({
      where: { id: req.params.id },
      include: {
        repositories: true,
        bugs: { take: 10, orderBy: { createdAt: 'desc' } },
        jobs: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    });
    if (!project) return reply.status(404).send({ error: 'Project not found' });
    return project;
  });

  fastify.post('/projects', async (req: any, reply) => {
    const { organizationId, name, key, description, settings } = req.body;
    const project = await db.project.create({
      data: {
        organizationId,
        name,
        key,
        description,
        settings: settings ? JSON.stringify(settings) : null
      }
    });
    return project;
  });

  fastify.post('/projects/:id/repositories', async (req: any, reply) => {
    const { githubRepoId, owner, name, defaultBranch, cloneUrl, settings } = req.body;
    const repo = await db.repository.create({
      data: {
        projectId: req.params.id,
        githubRepoId,
        owner,
        name,
        defaultBranch: defaultBranch || 'main',
        cloneUrl,
        settings: settings ? JSON.stringify(settings) : null
      }
    });
    return repo;
  });
}

export async function integrationRoutes(fastify: FastifyInstance) {
  fastify.get('/integrations', async () => {
    return await db.integration.findMany();
  });

  fastify.post('/integrations/jira/connect', async (req: any) => {
    const { organizationId, host, projectKey } = req.body;
    return await db.integration.upsert({
      where: { organizationId_provider: { organizationId, provider: 'JIRA' } },
      update: {
        status: 'CONNECTED',
        metadata: JSON.stringify({ host, projectKey })
      },
      create: {
        organizationId,
        provider: 'JIRA',
        name: 'Jira Cloud Integration',
        status: 'CONNECTED',
        metadata: JSON.stringify({ host, projectKey })
      }
    });
  });

  fastify.post('/integrations/github/connect', async (req: any) => {
    const { organizationId, installationId, account } = req.body;
    return await db.integration.upsert({
      where: { organizationId_provider: { organizationId, provider: 'GITHUB' } },
      update: {
        status: 'CONNECTED',
        metadata: JSON.stringify({ installationId, account })
      },
      create: {
        organizationId,
        provider: 'GITHUB',
        name: 'GitHub App Integration',
        status: 'CONNECTED',
        metadata: JSON.stringify({ installationId, account })
      }
    });
  });

  fastify.delete('/integrations/:id', async (req: any) => {
    return await db.integration.delete({
      where: { id: req.params.id }
    });
  });
}

