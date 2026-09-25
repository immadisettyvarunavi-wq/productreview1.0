import React from 'react';
import HeroUpload from '../components/HeroUpload';

export default function HomePage({ onUpload, onOpenCamera, onTestAnalyzing, isProcessing, onSearch }) {
  return (
    <div className="home-page-wrap">
      {/* Hero Section */}
      <HeroUpload
        onUpload={onUpload}
        onOpenCamera={onOpenCamera}
        onTestAnalyzing={onTestAnalyzing}
        onSearch={onSearch}
        isProcessing={isProcessing}
      />

      {/* 6-Card Features Strip */}
      <section className="features-strip-section" id="features">
        <div className="features-grid">
          {/* 1. Upload Product Image */}
          <div className="feature-step-card">
            <div className="feature-icon-box icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <h3 className="feature-card-title">Upload Product Image</h3>
            <p className="feature-card-desc">Just a photo, no barcode needed.</p>
          </div>

          {/* 2. Find the Exact Product */}
          <div className="feature-step-card">
            <div className="feature-icon-box icon-indigo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="feature-card-title">Find the Exact Product</h3>
            <p className="feature-card-desc">Advanced visual search identifies the product.</p>
          </div>

          {/* 3. Real Customer Reviews */}
          <div className="feature-step-card">
            <div className="feature-icon-box icon-purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className="feature-card-title">Real Customer Reviews</h3>
            <p className="feature-card-desc">From trusted sources like Amazon, Flipkart and more.</p>
          </div>

          {/* 4. AI-Powered Insights */}
          <div className="feature-step-card">
            <div className="feature-icon-box icon-cyan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 className="feature-card-title">AI-Powered Insights</h3>
            <p className="feature-card-desc">Understand pros, cons, common issues.</p>
          </div>

          {/* 5. Compare Prices */}
          <div className="feature-step-card">
            <div className="feature-icon-box icon-teal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 3h12M6 8h12M6 13l7.5 8M6 13h4c3.5 0 5-2 5-5s-1.5-5-5-5" />
              </svg>
            </div>
            <h3 className="feature-card-title">Compare Prices</h3>
            <p className="feature-card-desc">Check prices across multiple stores.</p>
          </div>

          {/* 6. Make a Smarter Choice */}
          <div className="feature-step-card">
            <div className="feature-icon-box icon-magenta">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h3 className="feature-card-title">Make a Smarter Choice</h3>
            <p className="feature-card-desc">See the complete report and buy with confidence.</p>
          </div>
        </div>
      </section>

      {/* Bottom Stats Card */}
      <section className="stats-strip-section" id="how-it-works">
        <div className="stats-strip-card">
          {/* Stat 1: 50,000+ Happy Shoppers */}
          <div className="stat-item">
            <div className="stat-icon-wrap stat-icon-purple">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="stat-text-wrap">
              <h2 className="stat-number">50,000+</h2>
              <p className="stat-label">Happy Shoppers</p>
            </div>
          </div>

          {/* Stat 2: 1M+ Product Reviews Analyzed */}
          <div className="stat-item">
            <div className="stat-icon-wrap stat-icon-blue">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="stat-text-wrap">
              <h2 className="stat-number">1M+</h2>
              <p className="stat-label">Product Reviews Analyzed</p>
            </div>
          </div>

          {/* Stat 3: 20+ Trusted Sources */}
          <div className="stat-item">
            <div className="stat-icon-wrap stat-icon-cyan">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="stat-text-wrap">
              <h2 className="stat-number">20+</h2>
              <p className="stat-label">Trusted Sources</p>
            </div>
          </div>

          {/* Stat 4: 99% Accurate Product Matching */}
          <div className="stat-item">
            <div className="stat-icon-wrap stat-icon-green">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div className="stat-text-wrap">
              <h2 className="stat-number">99%</h2>
              <p className="stat-label">Accurate Product Matching</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
