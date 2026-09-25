/**
 * Authentication API — signup, signin, and token management.
 */

// Reuse the same API base resolution logic from api.js
const DEFAULT_REMOTE_API = 'https://product-review-ghmx.onrender.com/api/v1';

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
  const response = await fetch(`${AUTH_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      password,
      full_name: fullName || '',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Signup failed (HTTP ${response.status})`);
  }

  saveAuth(data.access_token, data.user);
  return data;
}

/**
 * Sign in an existing user.
 */
export async function signIn({ login, password }) {
  const response = await fetch(`${AUTH_BASE}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Sign in failed (HTTP ${response.status})`);
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
