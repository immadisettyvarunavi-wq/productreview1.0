import React, { useRef, useState, useCallback } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

export default function HeroUpload({ onUpload, onOpenCamera, onTestAnalyzing, onSearch, isProcessing }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Maximum size: ${MAX_SIZE_MB} MB.`);
      return;
    }

    onUpload(file);
  }, [onUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const triggerUpload = () => {
    if (!isProcessing) fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  // Handler for demo button / clicking the identified sample product
  const handleLoadSampleProduct = async () => {
    try {
      const response = await fetch('/assets/headphones_table.jpg');
      const blob = await response.blob();
      const sampleFile = new File([blob], 'sony_wh1000xm5.jpg', { type: 'image/jpeg' });
      onUpload(sampleFile);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    }
  };

  const handleThumbnailClick = async (assetName, fileName) => {
    try {
      const response = await fetch(`/assets/${assetName}`);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      onUpload(file);
    } catch (err) {
      console.error('Failed to load thumbnail product:', err);
    }
  };

  return (
    <section className="hero-section">
      {/* Background glow effects */}
      <div className="hero-glow-blue" />
      <div className="hero-glow-purple" />

      <div className="hero-container">
        {/* Left Column: Headline, Description & Actions */}
        <div className="hero-left">
          {/* Pill Badge */}
          <div className="hero-badge">
            <span className="badge-sparkle">✦</span>
            <span>AI-Powered Product Insights</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-title">
            Snap a Product.<br />
            <span className="text-cyan">Know What</span><br />
            <span className="text-purple">Real Customers Say.</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Upload a product photo and instantly discover real customer reviews,
            ratings, prices from multiple stores, and AI-powered insights — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="hero-actions">
            <button
              className="btn-upload-primary"
              onClick={onOpenCamera || triggerUpload}
              disabled={isProcessing}
              title="Click directly with camera"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Take Photo / Scan</span>
              <span className="btn-arrow">📸</span>
            </button>

            <button
              className="btn-take-photo-camera"
              onClick={triggerUpload}
              disabled={isProcessing}
              title="Upload existing image from gallery"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Choose Photo</span>
            </button>

            <button
              className="btn-watch-demo"
              onClick={() => {
                if (onTestAnalyzing) onTestAnalyzing();
                else setShowDemoModal(true);
              }}
            >
              <div className="demo-play-circle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div className="demo-text-wrap">
                <span className="demo-title">Watch Demo</span>
                <span className="demo-duration">1 min</span>
              </div>
            </button>
          </div>

          {/* Quick Trending Live Searches */}
          <div className="hero-trending-chips" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', margin: '18px 0 10px 0' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>⚡ Try live search:</span>
            {['Sony WH-1000XM5', 'Colgate MaxFresh', 'boAt Rockerz 450', 'Nike Air Force 1', 'iPhone 15 Pro'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSearch && onSearch(term)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e2e8f0',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)';
                  e.currentTarget.style.borderColor = '#c084fc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
              >
                {term}
              </button>
            ))}
          </div>

          {/* Social Proof */}
          <div className="hero-social-proof">
            <div className="avatar-group">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                alt="Shopper 1"
                className="avatar-img"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                alt="Shopper 2"
                className="avatar-img"
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                alt="Shopper 3"
                className="avatar-img"
              />
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80"
                alt="Shopper 4"
                className="avatar-img"
              />
            </div>
            <span className="social-proof-text">Trusted by 50,000+ smart shoppers</span>
          </div>
        </div>

        {/* Right Column: 3D Smartphone & Identified Product Showcase */}
        <div className="hero-right">
          <div
            className={`mockup-showcase ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* Left Vertical Stream of Floating Product Cards */}
            <div className="floating-products-stream">
              <div
                className="floating-product-card"
                title="White Headphones"
                onClick={() => handleThumbnailClick('headphones_isolated.jpg', 'headphones.jpg')}
              >
                <img src="/assets/headphones_isolated.jpg" alt="Headphones" />
              </div>
              <div
                className="floating-product-card"
                title="Smart Watch"
                onClick={() => handleThumbnailClick('smartwatch.jpg', 'smartwatch.jpg')}
              >
                <img src="/assets/smartwatch.jpg" alt="Smart Watch" />
              </div>
              <div
                className="floating-product-card"
                title="Running Sneaker"
                onClick={() => handleThumbnailClick('sneaker.jpg', 'sneaker.jpg')}
              >
                <img src="/assets/sneaker.jpg" alt="Sneaker" />
              </div>
              <div
                className="floating-product-card"
                title="Luxury Perfume"
                onClick={() => handleThumbnailClick('perfume.jpg', 'perfume.jpg')}
              >
                <img src="/assets/perfume.jpg" alt="Perfume" />
              </div>
            </div>

            {/* Center: Smartphone Frame with Live Viewfinder */}
            <div className="phone-wrapper" onClick={onOpenCamera || triggerUpload} title="Click to open camera">
              <div className="phone-body">
                {/* Speaker Island */}
                <div className="phone-notch">
                  <span className="phone-lens" />
                  <span className="phone-speaker" />
                </div>

                {/* Camera Screen */}
                <div className="phone-screen">
                  <img
                    src="/assets/headphones_table.jpg"
                    alt="Product in Viewfinder"
                    className="viewfinder-bg"
                  />

                  {/* Viewfinder Target Overlay */}
                  <div className="viewfinder-frame">
                    <div className="corner corner-tl" />
                    <div className="corner corner-tr" />
                    <div className="corner corner-bl" />
                    <div className="corner corner-br" />
                  </div>

                  {/* Prompt Text */}
                  <div className="viewfinder-caption">
                    <h4>Capture the product!</h4>
                    <p>Upload or take a photo</p>
                  </div>

                  {/* Shutter Button */}
                  <div className="camera-shutter-wrap">
                    <div className="camera-shutter-outer">
                      <div className="camera-shutter-inner" />
                    </div>
                  </div>

                  {/* Phone Home Bar */}
                  <div className="phone-home-indicator" />
                </div>
              </div>
            </div>

            {/* Glowing Flow Arrow from Phone to Card */}
            <div className="flow-arrow-wrap">
              <svg width="44" height="28" viewBox="0 0 60 40" fill="none">
                <path
                  d="M5 25 C20 5, 40 35, 52 15"
                  stroke="url(#arrow-grad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M44 12 L54 15 L50 25"
                  stroke="url(#arrow-grad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="arrow-grad" x1="0" y1="0" x2="60" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a855f7" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Right: Glassmorphic Identified Product Card */}
            <div className="identified-product-card">
              {/* Top Identified Badge */}
              <div className="identified-badge">
                <span className="green-dot">●</span>
                <span>Identified Product</span>
              </div>

              {/* Floating Product Image in Top Right */}
              <div className="identified-product-img">
                <img src="/assets/headphones_isolated.jpg" alt="Sony WH-1000XM5" />
              </div>

              {/* Product Info */}
              <div className="identified-details">
                <h3 className="identified-name">Sony WH-1000XM5</h3>
                <p className="identified-category">Wireless Noise Cancelling Headphones</p>

                {/* Rating */}
                <div className="identified-rating-row">
                  <div className="stars-gold">★★★★★</div>
                  <span className="rating-score">4.5/5</span>
                  <span className="rating-count">(12,543 reviews)</span>
                </div>
              </div>

              {/* Store Prices */}
              <div className="stores-price-grid">
                {/* Amazon */}
                <div className="store-pill">
                  <span className="store-name amazon-text">amazon</span>
                  <span className="store-price">₹24,999</span>
                  <span className="store-stock">In stock</span>
                </div>

                {/* Flipkart */}
                <div className="store-pill">
                  <span className="store-name flipkart-text">
                    Flipkart <span className="flipkart-bag">🛍️</span>
                  </span>
                  <span className="store-price">₹27,990</span>
                  <span className="store-stock">In stock</span>
                </div>

                {/* Croma */}
                <div className="store-pill">
                  <span className="store-name croma-text">croma</span>
                  <span className="store-price">₹29,990</span>
                  <span className="store-stock">In stock</span>
                </div>
              </div>

              {/* Full Report CTA */}
              <button
                className="btn-view-report"
                onClick={handleLoadSampleProduct}
                disabled={isProcessing}
              >
                <span>View Full Review Report</span>
                <span className="report-arrow">→</span>
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept=".jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="modal-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reviewly Interactive Demo</h3>
              <button className="btn-close" onClick={() => setShowDemoModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                Reviewly automatically identifies products from real camera photos using Google Lens,
                extracts real buyer reviews from Amazon & stores, and produces verified evidence summaries.
              </p>
              <div style={{ textAlign: 'center' }}>
                <button
                  className="btn-upload-primary"
                  onClick={() => {
                    setShowDemoModal(false);
                    handleLoadSampleProduct();
                  }}
                >
                  🚀 Run Live Demo Analysis (Sony WH-1000XM5)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
