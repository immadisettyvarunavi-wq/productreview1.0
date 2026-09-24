/**
 * API utility — all communication with the FastAPI backend.
 * API keys are NEVER stored or sent from the frontend.
 */

// Default deployed backend URL on Render
const DEFAULT_REMOTE_API = 'https://productreview1-0.onrender.com/api/v1';

let rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
if (rawApiUrl && !rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
  rawApiUrl = `https://${rawApiUrl}`;
}
if (rawApiUrl.endsWith('/')) rawApiUrl = rawApiUrl.slice(0, -1);
if (rawApiUrl && !rawApiUrl.endsWith('/api/v1')) rawApiUrl += '/api/v1';

// Detect whether app is running natively inside Capacitor (Android/iOS APK)
const isNativeApp = typeof window !== 'undefined' && (
  Boolean(window.Capacitor?.isNativePlatform?.()) ||
  window.location.protocol === 'capacitor:' ||
  (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'))
);

// Resolution priority:
// 1. Explicit VITE_API_URL configured at build/runtime
// 2. If running on Mobile APK (Capacitor), ALWAYS use the live Render backend
// 3. If running on deployed Web (e.g. Render), use the current origin
// 4. Local browser dev (e.g. localhost:5173), use localhost:8000
const API_BASE = rawApiUrl
  || (isNativeApp
      ? DEFAULT_REMOTE_API
      : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
          ? `${window.location.origin}/api/v1`
          : 'http://localhost:8000/api/v1'));

async function handleFetchError(err) {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    throw new Error(
      'Unable to connect to backend server. If using Render free tier, the server may take 30-50s to spin up from sleep. Please wait a moment and try again.'
    );
  }
  throw err;
}

export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${API_BASE}/products/analyze-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (err) {
    return handleFetchError(err);
  }
}

export async function getProduct(productId) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  } catch (err) {
    return handleFetchError(err);
  }
}

export async function getProductReviews(productId, source = null) {
  try {
    let url = `${API_BASE}/products/${productId}/reviews`;
    if (source) url += `?source=${encodeURIComponent(source)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  } catch (err) {
    return handleFetchError(err);
  }
}

export async function analyzeReviews(productId) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}/analyze-reviews`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to analyze reviews');
    return response.json();
  } catch (err) {
    return handleFetchError(err);
  }
}

export async function getProductPrices(productId) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}/prices`);
    if (!response.ok) throw new Error('Failed to fetch prices');
    return response.json();
  } catch (err) {
    return handleFetchError(err);
  }
}

export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  } catch (err) {
    return handleFetchError(err);
  }
}
