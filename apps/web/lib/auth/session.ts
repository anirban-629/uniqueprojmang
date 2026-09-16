import { cookies } from 'next/headers';
import type { User, TenantRole } from '@flowline/types';

export interface ServerSession {
  userId: string | null;
  tenantId: string | null;
  role: TenantRole | null;
  isAuthenticated: boolean;
}

/**
 * Server-side helper to read the current session state from request cookies.
 * Used in Server Components and Next.js Route Handlers.
 */
export async function getServerSession(): Promise<ServerSession> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('flowline_session')?.value 
    || cookieStore.get('access_token')?.value;

  if (!sessionToken) {
    return {
      userId: null,
      tenantId: null,
      role: null,
      isAuthenticated: false,
    };
  }

  // Session token exists in cookies
  return {
    userId: cookieStore.get('flowline_user_id')?.value || null,
    tenantId: cookieStore.get('flowline_tenant_id')?.value || null,
    role: (cookieStore.get('flowline_role')?.value as TenantRole) || null,
    isAuthenticated: true,
  };
}
