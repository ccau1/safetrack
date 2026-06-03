/**
 * SafeTrack API Client
 *
 * Features:
 * - Cookie-based authentication (httpOnly cookies sent automatically)
 * - Exponential backoff retry for transient failures
 * - Offline request queue (mutating requests are queued when offline)
 * - 401 handling with token refresh and request replay
 * - 403 handling with permission-denied message
 */

import {
  enqueue,
  dequeue,
  getQueue,
  incrementRetry,
  shouldRetry,
  isOnline,
  type QueuedRequest,
} from './offlineQueue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// In-memory state for refresh handling
let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

function subscribeRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function clearAuthAndRedirect() {
  // Dispatch event so AuthContext can react
  window.dispatchEvent(new Event('safetrack:auth:logout'));
  // Redirect to login if not already there
  if (window.location.pathname !== '/login') {
    window.location.href = '/login?reason=session_expired';
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  // Network errors, timeouts, 5xx server errors
  if (error instanceof TypeError) return true; // Network failure
  return false;
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

interface ApiOptions {
  skipAuth?: boolean;
  skipRetry?: boolean;
  skipOfflineQueue?: boolean;
  retries?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

export interface BackendError {
  code: string;
  message: string;
  reason: string;
  path: string;
  timestamp: string;
  status: number;
}

export class ApiError extends Error {
  status: number;
  code: string;
  reason: string;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;

    // Parse standardized backend error format
    const err = data as Partial<BackendError> | undefined;
    this.code = err?.code ?? 'UNKNOWN';
    this.reason = err?.reason ?? message;
  }
}

/**
 * Perform an authenticated API request with retries and offline support.
 * Auth is handled via httpOnly cookies sent automatically by the browser.
 */
export async function apiRequest<T = unknown>(
  method: string,
  endpoint: string,
  body?: unknown,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { skipRetry = false, skipOfflineQueue = false, retries = 3 } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  // Check offline state for mutating requests
  const isMutating = method !== 'GET' && method !== 'HEAD';
  if (!isOnline() && isMutating && !skipOfflineQueue) {
    const queued = enqueue({
      method,
      url: endpoint,
      body: body ? JSON.stringify(body) : null,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return {
      data: { queued: true, id: queued.id } as unknown as T,
      status: 202,
      headers: new Headers(),
    };
  }

  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (body !== undefined) {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  let lastError: Error | undefined;
  const maxAttempts = skipRetry ? 1 : retries + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        if (isRefreshing) {
          // Wait for refresh to complete and retry
          const refreshed = await new Promise<boolean>((resolve) => {
            subscribeRefresh((success) => resolve(success));
          });
          if (refreshed) {
            continue; // Retry with new cookie
          } else {
            clearAuthAndRedirect();
            throw new ApiError('Session expired. Please log in again.', 401, null);
          }
        }

        isRefreshing = true;
        try {
          const refreshed = await attemptRefresh();
          if (refreshed) {
            onRefreshed(true);
            continue; // Retry original request
          }
        } finally {
          isRefreshing = false;
        }

        onRefreshed(false);
        clearAuthAndRedirect();
        throw new ApiError('Session expired. Please log in again.', 401, null);
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        throw new ApiError('You do not have permission to perform this action.', 403, null);
      }

      // Handle empty body for 204
      if (response.status === 204) {
        return { data: undefined as unknown as T, status: 204, headers: response.headers };
      }

      // Parse JSON response
      const text = await response.text();
      let data: T;
      try {
        data = JSON.parse(text);
      } catch {
        data = text as unknown as T;
      }

      if (!response.ok) {
        const errData = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
        const message = errData?.message
          ? String(errData.message)
          : `HTTP ${response.status}`;
        throw new ApiError(message, response.status, data);
      }

      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      lastError = error as Error;

      // Don't retry auth errors or client errors (4xx except 408/429)
      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) throw error;
        if (error.status >= 400 && error.status < 500 && !isRetryableStatus(error.status)) throw error;
      }

      const isLastAttempt = attempt === maxAttempts - 1;
      if (isLastAttempt) break;

      // Only retry on network errors or retryable statuses
      const retryable = error instanceof ApiError
        ? isRetryableStatus(error.status)
        : isRetryableError(error);

      if (!retryable) throw error;

      // Exponential backoff: 1s, 2s, 4s
      const backoff = Math.pow(2, attempt) * 1000;
      await sleep(backoff);
    }
  }

  throw lastError || new ApiError('Request failed after retries', 0, null);
}

/**
 * Attempt to refresh the access token using the httpOnly refresh cookie.
 */
async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Replay all queued offline requests.
 * Called automatically when the browser comes back online.
 */
export async function replayOfflineQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  const failed: QueuedRequest[] = [];

  for (const request of queue) {
    try {
      await apiRequest(
        request.method,
        request.url,
        request.body ? JSON.parse(request.body) : undefined,
        { skipOfflineQueue: true }
      );
      dequeue(request.id);
    } catch (error) {
      const updated = incrementRetry(request.id);
      if (!updated || !shouldRetry(updated)) {
        dequeue(request.id);
        console.error(`Offline request ${request.id} failed permanently:`, error);
      } else {
        failed.push(updated);
      }
    }
  }

  if (failed.length > 0) {
    window.dispatchEvent(
      new CustomEvent('safetrack:offline:sync:partial', { detail: { failed: failed.length } })
    );
  } else if (queue.length > 0) {
    window.dispatchEvent(new Event('safetrack:offline:sync:complete'));
  }
}

// Auto-replay queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    replayOfflineQueue();
  });
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, opts?: ApiOptions) => apiRequest<T>('GET', endpoint, undefined, opts),
  post: <T>(endpoint: string, body?: unknown, opts?: ApiOptions) => apiRequest<T>('POST', endpoint, body, opts),
  patch: <T>(endpoint: string, body?: unknown, opts?: ApiOptions) => apiRequest<T>('PATCH', endpoint, body, opts),
  put: <T>(endpoint: string, body?: unknown, opts?: ApiOptions) => apiRequest<T>('PUT', endpoint, body, opts),
  delete: <T>(endpoint: string, opts?: ApiOptions) => apiRequest<T>('DELETE', endpoint, undefined, opts),
};
