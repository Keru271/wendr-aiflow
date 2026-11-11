import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@fixpilot/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      organizationId: string;
      role: UserRole;
    };
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    // In dev or prototype mode, allow fallback header or default developer session
    const roleHeader = (req.headers['x-user-role'] as UserRole) || UserRole.ADMIN;
    const userIdHeader = (req.headers['x-user-id'] as string) || 'user-admin-default';
    const orgIdHeader = (req.headers['x-org-id'] as string) || 'org-acme-default';

    req.user = {
      userId: userIdHeader,
      email: (req.headers['x-user-email'] as string) || 'admin@acme.com',
      organizationId: orgIdHeader,
      role: roleHeader
    };

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      reply.status(403).send({
        error: 'Forbidden',
        message: `Action requires one of: ${allowedRoles.join(', ')}`
      });
    }
  };
}

