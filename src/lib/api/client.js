/**
 * Unified API Fetch Client
 * Handles cookie-based auth (credentials: 'include'), tenant header, FormData upload, and automatic 401 refresh retry.
 * Defaults to relative '/api/v1' path routed through Next.js dev reverse-proxy (app/api/[...path]/route.js)
 * to ensure httpOnly cookies are stored as FIRST-PARTY cookies on localhost.
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
const TENANT  = (process.env.NEXT_PUBLIC_HEADER || 'ecommerce').trim();

let isRefreshingPromise = null;
let onUnauthorizedCallback = null;

export function registerUnauthorizedHandler(handler) {
  onUnauthorizedCallback = handler;
}

export async function apiFetch(endpoint, options = {}) {
  let cleanEndpoint = endpoint;
  if (!cleanEndpoint.startsWith('http') && !cleanEndpoint.startsWith('/')) {
    cleanEndpoint = `/${cleanEndpoint}`;
  }
  const SERVER_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.shayegandesign.com').trim();
  let url;
  if (cleanEndpoint.startsWith('http')) {
    url = cleanEndpoint;
  } else if (typeof window === 'undefined') {
    url = `${SERVER_BASE_URL}${cleanEndpoint}`;
  } else {
    url = `${API_URL}${cleanEndpoint}`;
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    'X-Tenant-ID': TENANT,
    'x-lang': 'fa',
    ...(options.headers || {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Ensure legacy Authorization header is never sent
  delete headers['Authorization'];

  const config = {
    ...options,
    headers,
    credentials: 'include', // Automatically send and receive httpOnly cookies
  };

  let res;
  try {
    res = await fetch(url, config);
  } catch (netErr) {
    throw netErr;
  }

  // Handle 401 Unauthorized for non-auth endpoints with single auto-refresh retry
  if (
    res.status === 401 &&
    !options._retried &&
    !cleanEndpoint.includes('/auth/refresh') &&
    !cleanEndpoint.includes('/auth/mobile/') &&
    !cleanEndpoint.includes('/auth/login')
  ) {
    try {
      if (!isRefreshingPromise) {
        isRefreshingPromise = (async () => {
          const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-ID': TENANT,
              'x-lang': 'fa',
            },
            credentials: 'include',
          });
          return refreshRes.ok;
        })();
      }

      const refreshedSuccessfully = await isRefreshingPromise;
      isRefreshingPromise = null;

      if (refreshedSuccessfully) {
        // Retry original request with credentials (new cookie set by backend)
        res = await fetch(url, { ...config, _retried: true });
      } else {
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      }
    } catch (refreshErr) {
      isRefreshingPromise = null;
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
  }

  return res;
}
