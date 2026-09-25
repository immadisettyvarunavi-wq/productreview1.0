import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, signIn } from '../utils/auth';
import { useAuth } from '../hooks/useAuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setError('');
    setSuccess('');
    setFullName('');
    setUsername('');
    setEmail('');
    setLogin('');
    setPassword('');
    setShowPassword(false);
  };

  const switchMode = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp({ username, email, password, fullName });
        setSuccess('Account created successfully!');
      } else {
        await signIn({ login, password });
      }
      refreshAuth();
      setTimeout(() => navigate('/'), 400);
    } catch (err) {
      const msg = typeof err === 'string'
        ? err
        : err?.message || 'Something went wrong';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
        <div className="auth-bg-grid" />
      </div>

      <div className="auth-container">
        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-logo">
            <span className="auth-logo-icon">📸</span>
            <span className="auth-logo-text">Reviewly</span>
          </div>
          <p className="auth-tagline">
            Snap a Product. Know What Real Customers Say.
          </p>
        </div>

        {/* Glass Card */}
        <div className="auth-card">
          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => switchMode('signin')}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
              type="button"
            >
              Sign Up
            </button>
            <div
              className="auth-tab-indicator"
              style={{ transform: mode === 'signup' ? 'translateX(100%)' : 'translateX(0)' }}
            />
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="auth-message auth-error">
              <span className="auth-msg-icon">⚠️</span>
              {error}
            </div>
          )}
          {success && (
            <div className="auth-message auth-success">
              <span className="auth-msg-icon">✅</span>
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <>
                <div className="auth-field">
                  <label htmlFor="fullName">Full Name</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">👤</span>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="username">Username <span className="required">*</span></label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">@</span>
                    <input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="email">Email <span className="required">*</span></label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">✉️</span>
                    <input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'signin' && (
              <div className="auth-field">
                <label htmlFor="login">Username or Email <span className="required">*</span></label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">👤</span>
                  <input
                    id="login"
                    type="text"
                    placeholder="johndoe or john@example.com"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="password">Password <span className="required">*</span></label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
              id="auth-submit-btn"
            >
              <span className="auth-submit-inner">
                {loading ? (
                  <>
                    <span className="auth-spinner" />
                    <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                )}
              </span>
            </button>
          </form>

          {/* Footer toggle */}
          <p className="auth-footer-text">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button type="button" className="auth-link" onClick={() => switchMode('signup')}>
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" className="auth-link" onClick={() => switchMode('signin')}>
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>

        {/* Features */}
        <div className="auth-features">
          <div className="auth-feature">
            <span className="auth-feature-icon">📷</span>
            <span>Snap & Analyze</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">⭐</span>
            <span>Real Reviews</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">🤖</span>
            <span>AI Insights</span>
          </div>
        </div>
      </div>
    </div>
  );
}
