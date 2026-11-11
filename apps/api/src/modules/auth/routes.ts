import { FastifyInstance } from 'fastify';
import { db } from '@fixpilot/database';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (req: any, reply) => {
    const { email } = req.body || {};
    const user = await db.user.findFirst({
      where: { email },
      include: { memberships: { include: { organization: true } } }
    });

    if (!user) {
      return reply.status(401).send({ error: 'User not found' });
    }

    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      organizationId: user.memberships[0]?.organizationId,
      role: user.memberships[0]?.role
    });

    return { token, user };
  });

  fastify.get('/me', async (req, reply) => {
    const user = await db.user.findFirst({
      include: {
        memberships: {
          include: { organization: true }
        }
      }
    });
    return { user };
  });
}

export async function organizationRoutes(fastify: FastifyInstance) {
  fastify.get('/organizations', async () => {
    return await db.organization.findMany({
      include: {
        members: { include: { user: true } },
        projects: true
      }
    });
  });

  fastify.get('/organizations/:id', async (req: any, reply) => {
    const org = await db.organization.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: true } },
        projects: { include: { repositories: true } },
        integrations: true
      }
    });
    if (!org) return reply.status(404).send({ error: 'Organization not found' });
    return org;
  });
}

