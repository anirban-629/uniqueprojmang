import { FastifySchema } from 'fastify';

export const registerSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Register New User & Organization',
  description: 'Create a new user account, initialize a tenant workspace, and assign owner role.',
  body: {
    type: 'object',
    required: ['email', 'password', 'fullName', 'organizationName'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 10 },
      fullName: { type: 'string', minLength: 2 },
      organizationName: { type: 'string', minLength: 2 },
      organizationSlug: { type: 'string', minLength: 2, pattern: '^[a-z0-9-]+$' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' }
          }
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'string' },
        tenant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            name: { type: 'string' },
            plan: { type: 'string' },
            role: { type: 'string' }
          }
        },
        memberships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tenantId: { type: 'string' },
              companyId: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              role: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

export const loginSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Authenticate User & Issue Tokens',
  description: 'Validates email and password, issuing access JWT and rotating refresh token.',
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        user: { type: 'object', additionalProperties: true },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'string' },
        tenant: { type: 'object', additionalProperties: true },
        memberships: { type: 'array', items: { type: 'object', additionalProperties: true } }
      }
    }
  }
};

export const refreshSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Rotate Refresh Token & Mint New Access Token',
  description: 'Validates refresh token, detects reuse theft attempts, and rotates tokens.',
  body: {
    type: 'object',
    required: ['refreshToken'],
    additionalProperties: false,
    properties: {
      refreshToken: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'string' }
      }
    }
  }
};

export const switchTenantSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Switch Active Organization Context',
  description: 'Validates membership in target tenant and mints updated access token.',
  body: {
    type: 'object',
    required: ['targetTenantId'],
    additionalProperties: false,
    properties: {
      targetTenantId: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        tenant: { type: 'object', additionalProperties: true },
        expiresIn: { type: 'string' }
      }
    }
  }
};

export const inviteUserSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Invite Member to Current Organization',
  description: 'Owner/Admin only: generates single-use 7-day invitation token.',
  body: {
    type: 'object',
    required: ['email', 'role'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['owner', 'admin', 'member', 'viewer'] }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        invitationId: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        token: { type: 'string' }
      }
    }
  }
};

export const acceptInviteSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Accept Organization Invitation',
  description: 'Consumes single-use invitation token and creates or binds user.',
  body: {
    type: 'object',
    required: ['token'],
    additionalProperties: false,
    properties: {
      token: { type: 'string' },
      password: { type: 'string', minLength: 10 },
      fullName: { type: 'string' }
    }
  }
};

export const listSessionsSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'List Active User Sessions / Devices',
  description: 'Returns active session families for current authenticated user.'
};

export const logoutSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Logout Active Session',
  description: 'Revokes access token jti and invalidates refresh token.'
};

export const logoutAllSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Logout All Sessions',
  description: 'Revokes all active refresh token families for user.'
};

export const listUsersSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'List Workspace Users',
  description: 'Get list of users in the active company.'
};

export const getCurrentUserSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Get Current Authenticated User Context'
};

export const listCompaniesSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'List Available Companies (Multi-Tenant)'
};
