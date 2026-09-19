export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((success) => resolve(success));
    });
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const success = res.ok;
    onRefreshed(success);
    return success;
  } catch {
    onRefreshed(false);
    return false;
  } finally {
    isRefreshing = false;
  }
}

export async function apiClient<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // Automatically attaches httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle Token Expiry & Silent Refresh
  if (res.status === 401 && !path.includes('/api/auth/login') && !path.includes('/api/auth/refresh')) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      // Retry the original request once
      const retryRes = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!retryRes.ok) {
        const errorData = await retryRes.json().catch(() => ({ message: 'Request failed' }));
        throw new ApiError(retryRes.status, errorData.message || 'Request failed', errorData);
      }
      return retryRes.json();
    }

    // Refresh failed - redirect to login in browser context
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, errorData.message || 'Request failed', errorData);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}
