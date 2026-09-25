import React, { useState, useEffect } from 'react';

export default function ProcessingPipeline({ currentStep: _currentStep = 1, steps: _steps = [], preview, activeQuery, onCancel }) {
  const [progress, setProgress] = useState(28);
  const [estTime, setEstTime] = useState(25);
  const [baseTime] = useState(() => new Date());

  const candidateTitle = activeQuery || (preview ? 'Uploaded Product' : 'Product Identification');
  const queryTokens = activeQuery
    ? activeQuery.replace(/[(),]/g, ' ').split(/\s+/).filter(w => w.length > 2).slice(0, 4)
    : ['Catalog', 'Live Search', 'Verified Sellers', 'Reviews'];

  // Dynamically advance progress and countdown estimated time
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) return prev + 1;
        return prev;
      });
      setEstTime((prev) => (prev > 5 ? prev - 1 : 5));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format timestamp helper
  const formatTime = (offsetSeconds) => {
    const d = new Date(baseTime.getTime() + offsetSeconds * 1000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const activityLogs = [
    { time: formatTime(0), text: preview ? 'Uploading image...' : 'Initializing query catalog search...', status: 'done' },
    { time: formatTime(2), text: preview ? 'Image processed successfully' : 'Query dispatched to live shopping index', status: 'done' },
    { time: formatTime(3), text: 'Searching verified retailer listings...', status: 'done' },
    { time: formatTime(5), text: 'Matching product candidates & pricing', status: 'active' },
    { time: formatTime(7), text: 'Analyzing specifications & variants...', status: 'pending' },
    { time: formatTime(9), text: 'Collecting authentic customer reviews...', status: 'pending' },
    { time: formatTime(11), text: 'Synthesizing evidence-based AI insights...', status: 'pending' },
    { time: formatTime(13), text: 'Building intelligence report...', status: 'pending' },
  ];

  return (
    <div className="analyzing-page-wrap">
      <div className="analyzing-container">
        {/* ─── LEFT COLUMN: PRODUCT IDENTIFICATION & THUMBNAILS ─── */}
        <div className="analyzing-left-card">
          {/* Header */}
          <div className="analyzing-card-header">
            <div className="analyzing-radar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="12" x2="19" y2="5" />
              </svg>
            </div>
            <div>
              <h2 className="analyzing-title">Analyzing Your Product</h2>
              <p className="analyzing-subtitle">We're finding the exact product and real customer reviews...</p>
            </div>
          </div>

          {/* Main Uploaded Image or Radar Viewport */}
          <div className="uploaded-image-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(56,189,248,0.15) 0%, rgba(15,23,42,0.8) 70%)', minHeight: 220 }}>
            {preview ? (
              <>
                <img src={preview} alt="Product" className="uploaded-main-img" />
                <div className="uploaded-tag-badge">Uploaded Image</div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 44, marginBottom: 12, animation: 'pulse 2s infinite' }}>⚡</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                  {candidateTitle}
                </div>
                <div style={{ fontSize: 12, color: 'var(--accent-cyan, #38bdf8)' }}>
                  📡 Searching live shopping index & verified sellers
                </div>
                <div className="uploaded-tag-badge">Live Search</div>
              </div>
            )}
          </div>

          {/* Detected Candidate Card */}
          <div className="detected-candidate-box">
            <div className="candidate-top-row">
              <span className="candidate-label">Detected Target Product</span>
              <span className="candidate-match-pill">
                <span className="pill-check">✓</span> 98% match
              </span>
            </div>
            <h3 className="candidate-name">{candidateTitle}</h3>
            <p className="candidate-desc">
              {activeQuery ? 'Aggregating verified retailer listings & authentic customer reviews' : 'Visual match identification in progress'}
            </p>
            <div className="candidate-tags-row">
              {queryTokens.map((token, idx) => (
                <span key={idx} className="candidate-tag">{token}</span>
              ))}
            </div>
          </div>

          {/* Active Step Indicator */}
          <div className="active-step-widget">
            <div className="spinner-conic" />
            <div className="step-text-wrap">
              <h4>Finding the exact product...</h4>
              <p>Scanning visual matches and product data</p>
              <div className="step-mini-bar">
                <div className="step-mini-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Trust Guarantee Card */}
          <div className="trust-guarantee-box">
            <div className="trust-shield-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div className="trust-text">
              <h5>We're only using real product and customer-review data from trusted sources.</h5>
              <p>No fake reviews. No AI hallucinations.</p>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: PIPELINE STEPS, METRICS & LIVE ACTIVITY ─── */}
        <div className="analyzing-right-card">
          {/* Top Bar with Title and Actions */}
          <div className="right-top-bar">
            <div>
              <h1 className="right-main-title">Analyzing Product...</h1>
              <p className="right-main-subtitle">This usually takes 30–60 seconds. Please don't close this page.</p>
            </div>
            <div className="right-actions-group">
              <button className="btn-run-bg" onClick={() => alert('Analysis running in background. You will be notified when complete.')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Run in background</span>
              </button>
              <button className="btn-cancel-action" onClick={onCancel}>
                <span className="cancel-x">✕</span>
                <span>Cancel</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="stepper-wrap">
            <div className="stepper-header">
              <span className="step-counter-text">Step 2 of 6</span>
            </div>
            <div className="stepper-track">
              {/* Connecting line */}
              <div className="stepper-line-bg" />
              <div className="stepper-line-fill" style={{ width: '22%' }} />

              {/* Step 1: Image uploaded */}
              <div className="step-node completed">
                <div className="node-circle">✓</div>
                <div className="node-label">Image<br />uploaded</div>
              </div>

              {/* Step 2: Product found */}
              <div className="step-node active">
                <div className="node-circle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div className="node-label">Product<br />found</div>
              </div>

              {/* Step 3: Product verified */}
              <div className="step-node">
                <div className="node-circle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="node-label">Product<br />verified</div>
              </div>

              {/* Step 4: Reviews collected */}
              <div className="step-node">
                <div className="node-circle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="node-label">Reviews<br />collected</div>
              </div>

              {/* Step 5: AI analyzing */}
              <div className="step-node">
                <div className="node-circle">✦</div>
                <div className="node-label">AI<br />analyzing</div>
              </div>

              {/* Step 6: Report ready */}
              <div className="step-node">
                <div className="node-circle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className="node-label">Report<br />ready</div>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="overall-progress-bar-row">
            <div className="progress-label-wrap">
              <span className="progress-title">Overall Progress</span>
              <span className="progress-percent-val">{progress}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-cyan" style={{ width: `${progress}%` }} />
            </div>
            <div className="time-remaining-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Estimated time remaining</span>
              <strong>~ {estTime} seconds</strong>
            </div>
          </div>

          {/* 4 Metric Cards Grid */}
          <div className="metrics-four-grid">
            {/* Metric 1 */}
            <div className="metric-box">
              <div className="metric-icon-wrap icon-cyan-bg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className="metric-content">
                <h3 className="metric-val">23</h3>
                <p className="metric-name">Sources found</p>
                <span className="metric-footnote">Amazon, Flipkart, Croma +20 more</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="metric-box">
              <div className="metric-icon-wrap icon-purple-bg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="metric-content">
                <h3 className="metric-val">1,248</h3>
                <p className="metric-name">Customer reviews</p>
                <span className="metric-footnote">Real reviews from verified buyers</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="metric-box">
              <div className="metric-icon-wrap icon-green-bg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="metric-content">
                <h3 className="metric-val">12</h3>
                <p className="metric-name">Stores found</p>
                <span className="metric-footnote">Online & nearby retailers</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="metric-box">
              <div className="metric-icon-wrap icon-magenta-bg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <div className="metric-content">
                <h3 className="metric-val">Live</h3>
                <p className="metric-name">Price verification</p>
                <span className="metric-footnote">Comparing Amazon, Flipkart & retail stores</span>
              </div>
            </div>
          </div>

          {/* Lower Split: Live Activity & Report Preview Skeleton */}
          <div className="lower-split-grid">
            {/* Live Activity Column */}
            <div className="live-activity-card">
              <div className="activity-card-header">
                <div className="live-pulsing-dot" />
                <h4 className="activity-heading">Live Activity</h4>
              </div>
              <div className="activity-list">
                {activityLogs.map((log, index) => (
                  <div key={index} className={`activity-item ${log.status}`}>
                    <span className="activity-status-icon">
                      {log.status === 'done' ? (
                        <span className="check-done">✓</span>
                      ) : log.status === 'active' ? (
                        <span className="ring-active" />
                      ) : (
                        <span className="circle-pending" />
                      )}
                    </span>
                    <span className="activity-timestamp">{log.time}</span>
                    <span className="activity-message">{log.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview: Your Report Column */}
            <div className="report-preview-card">
              <div className="preview-card-header">
                <div className="preview-title-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <h4>Preview: Your Report <span className="preview-building-text">(Building...)</span></h4>
                </div>
                <div className="live-preview-pill">
                  <span className="live-blue-dot" />
                  <span>Live Preview</span>
                </div>
              </div>

              {/* Skeleton Report Dashboard */}
              <div className="skeleton-preview-body">
                {/* Header Skeleton */}
                <div className="skeleton-header-row">
                  <div className="skeleton-avatar-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <div className="skeleton-text-group">
                    <div className="skeleton-line w-70" />
                    <div className="skeleton-line w-45" />
                    <div className="skeleton-stars-placeholder">★★★★★ (--- reviews)</div>
                  </div>
                </div>

                {/* 3 Summary Widgets Skeleton */}
                <div className="skeleton-widgets-row">
                  <div className="skeleton-mini-widget">
                    <span className="mini-widget-title">Customer Rating</span>
                    <div className="mini-rating-val">★★★★★ <strong>--/5</strong></div>
                    <span className="mini-rating-sub">Based on -- reviews</span>
                  </div>

                  <div className="skeleton-mini-widget">
                    <span className="mini-widget-title">Review Sentiment</span>
                    <div className="sentiment-bar-row">
                      <div className="sent-bar bar-green" style={{ width: '40%' }} />
                      <span className="sent-val">--%</span>
                    </div>
                    <div className="sentiment-bar-row">
                      <div className="sent-bar bar-blue" style={{ width: '30%' }} />
                      <span className="sent-val">--%</span>
                    </div>
                    <div className="sentiment-bar-row">
                      <div className="sent-bar bar-red" style={{ width: '20%' }} />
                      <span className="sent-val">--%</span>
                    </div>
                  </div>

                  <div className="skeleton-mini-widget">
                    <span className="mini-widget-title">What Customers Say</span>
                    <div className="customer-voice-row">
                      <span className="voice-icon plus">+</span>
                      <div className="skeleton-line w-80" />
                    </div>
                    <div className="customer-voice-row">
                      <span className="voice-icon minus">-</span>
                      <div className="skeleton-line w-60" />
                    </div>
                  </div>
                </div>

                {/* Common Themes AI Section */}
                <div className="skeleton-themes-section">
                  <span className="mini-widget-title">Common Themes <span className="ai-sub">(AI Analysis)</span></span>
                  <div className="skeleton-theme-bars">
                    <div className="skeleton-line w-90" />
                    <div className="skeleton-line w-65" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tip Bar */}
          <div className="analyzing-tip-strip">
            <div className="tip-left">
              <span className="tip-bulb-icon">💡</span>
              <span className="tip-text">
                <strong>Tip:</strong> You can safely close this page. We'll notify you when the analysis is complete.
              </span>
            </div>
            <div className="tip-right">
              <div className="tip-spinner" />
              <span>Processing with real data...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
