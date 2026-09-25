/**
 * Authentication API — signup, signin, and token management.
 */

// Live deployed backend URL on Render
const DEFAULT_REMOTE_API = 'https://productreview1-0.onrender.com/api/v1';

let rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
if (rawApiUrl && !rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
  rawApiUrl = `https://${rawApiUrl}`;
}
if (rawApiUrl.endsWith('/')) rawApiUrl = rawApiUrl.slice(0, -1);
if (rawApiUrl && !rawApiUrl.endsWith('/api/v1')) rawApiUrl += '/api/v1';

const isNativeApp = typeof window !== 'undefined' && (
  Boolean(window.Capacitor?.isNativePlatform?.()) ||
  window.location.protocol === 'capacitor:' ||
  (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'))
);

const API_BASE = rawApiUrl
  || (isNativeApp
      ? DEFAULT_REMOTE_API
      : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
          ? `${window.location.origin}/api/v1`
          : 'http://localhost:8000/api/v1'));

const AUTH_BASE = `${API_BASE}/auth`;

// Token storage keys
const TOKEN_KEY = 'reviewly_token';
const USER_KEY = 'reviewly_user';

/**
 * Extract human-readable error string from backend response.
 */
function parseErrorMessage(data, status) {
  if (!data) return `Request failed (HTTP ${status})`;
  if (typeof data === 'string') return data;

  if (data.detail) {
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      // Pydantic validation errors: [{ loc: ["body", "username"], msg: "..." }]
      const parts = data.detail.map((item) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        const field = Array.isArray(item.loc) && item.loc.length > 1 ? item.loc[item.loc.length - 1] : '';
        const msg = (item.msg || '').replace(/^Value error,\s*/i, '');
        return field && field !== 'body' ? `${field}: ${msg}` : msg;
      }).filter(Boolean);
      return parts.join('. ') || `Validation error (HTTP ${status})`;
    }
    if (typeof data.detail === 'object') {
      return JSON.stringify(data.detail);
    }
  }

  if (data.message && typeof data.message === 'string') return data.message;
  return `Request failed (HTTP ${status})`;
}

/**
 * Save auth data to localStorage.
 */
export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get saved token from localStorage.
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get saved user from localStorage.
 */
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear auth data (logout).
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated() {
  return Boolean(getToken());
}

/**
 * Sign up a new user.
 */
export async function signUp({ username, email, password, fullName }) {
  let response;
  try {
    response = await fetch(`${AUTH_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: (username || '').trim(),
        email: (email || '').trim(),
        password,
        full_name: (fullName || '').trim(),
      }),
    });
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        'Unable to reach server. If using Render free tier, server may be waking up. Please retry in a few seconds.'
      );
    }
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, response.status));
  }

  saveAuth(data.access_token, data.user);
  return data;
}

/**
 * Sign in an existing user.
 */
export async function signIn({ login, password }) {
  let response;
  try {
    response = await fetch(`${AUTH_BASE}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: (login || '').trim(),
        password,
      }),
    });
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        'Unable to reach server. If using Render free tier, server may be waking up. Please retry in a few seconds.'
      );
    }
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, response.status));
  }

  saveAuth(data.access_token, data.user);
  return data;
}

/**
 * Log out the current user.
 */
export function logOut() {
  clearAuth();
}
