import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------
  fastify.get('/api/users', {
    schema: {
      tags: ['Auth & Users'],
      summary: 'List Workspace Users',
      description: 'Get list of users in the active company.'
    }
  }, async () => {
    await mockDb.simulateNetwork();
    return mockDb.getUsers();
  });

  fastify.get('/api/users/me', {
    schema: {
      tags: ['Auth & Users'],
      summary: 'Get Current Authenticated User Context'
    }
  }, async (request) => {
    const tenant = request.companyTenant;
    const users = mockDb.getUsers();
    const currentUser = users.find(u => u.id === tenant.userId) || users[0];
    return {
      user: currentUser,
      tenant
    };
  });

  // -------------------------------------------------------------
  // TENANCY & COMPANIES
  // -------------------------------------------------------------
  fastify.get('/api/tenancy/companies', {
    schema: {
      tags: ['Auth & Users'],
      summary: 'List Available Companies (Multi-Tenant)'
    }
  }, async () => {
    return [
      { id: 'a0000000-0000-0000-0000-000000000001', tenantId: 'acme-corp', name: 'Acme Corp', plan: 'pro' },
      { id: 'b0000000-0000-0000-0000-000000000002', tenantId: 'globex', name: 'Globex Inc', plan: 'enterprise' },
      { id: 'c0000000-0000-0000-0000-000000000003', tenantId: 'initech', name: 'Initech Software', plan: 'free' }
    ];
  });
};
