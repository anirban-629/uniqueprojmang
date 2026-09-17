import { FastifySchema } from 'fastify';

export const registerSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Register New User & Organization',
  description: 'Create a new user account, initialize a tenant workspace, and assign owner role.',
  body: {
    type: 'object',
    required: ['email', 'password', 'fullName'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 10 },
      fullName: { type: 'string', minLength: 2 },
      organizationName: { type: 'string', minLength: 2 },
      organizationSlug: { type: 'string', minLength: 2, pattern: '^[a-z0-9-]+$' },
      tenantName: { type: 'string', minLength: 2 },
      tenantSlug: { type: 'string', minLength: 2, pattern: '^[a-z0-9-]+$' }
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

export const getInviteDetailsSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Get Invitation Details',
  description: 'Validates invitation token and returns tenant, inviter, and role details.',
  params: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' }
    }
  }
};

export const forgotPasswordSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Request Password Reset',
  description: 'Initiates password reset process and sends enumeration-safe response.',
  body: {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' }
    }
  }
};

export const resetPasswordSchema: FastifySchema = {
  tags: ['Auth & Users'],
  summary: 'Reset Password with Token',
  description: 'Resets user password and revokes all active sessions.',
  body: {
    type: 'object',
    required: ['token', 'newPassword'],
    additionalProperties: false,
    properties: {
      token: { type: 'string' },
      newPassword: { type: 'string', minLength: 10 }
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

export const listTenantMembersSchema: FastifySchema = {
  tags: ['Auth & Roles (RBAC)'],
  summary: 'List Workspace Members with Roles',
  description: 'Lists all users in workspace with assigned roles. Requires members.view permission.',
  params: {
    type: 'object',
    required: ['tenantId'],
    properties: {
      tenantId: { type: 'string' }
    }
  }
};

export const updateMemberRoleSchema: FastifySchema = {
  tags: ['Auth & Roles (RBAC)'],
  summary: 'Update Member Role',
  description: 'Changes a user role within the workspace. Protected by last-owner guardrail. Requires members.manage permission.',
  params: {
    type: 'object',
    required: ['tenantId', 'userId'],
    properties: {
      tenantId: { type: 'string' },
      userId: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['role'],
    properties: {
      role: { type: 'string', enum: ['owner', 'admin', 'member', 'billing_manager', 'viewer', 'guest'] }
    }
  }
};

export const removeMemberSchema: FastifySchema = {
  tags: ['Auth & Roles (RBAC)'],
  summary: 'Remove Member from Workspace',
  description: 'Removes user access from workspace. Protected by last-owner guardrail. Requires members.remove permission.',
  params: {
    type: 'object',
    required: ['tenantId', 'userId'],
    properties: {
      tenantId: { type: 'string' },
      userId: { type: 'string' }
    }
  }
};

export const listPermissionsSchema: FastifySchema = {
  tags: ['Auth & Roles (RBAC)'],
  summary: 'List All Registered Permissions',
  description: 'Returns the master catalog of all tenant and project permission flags.'
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
