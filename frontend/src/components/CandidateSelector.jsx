import React from 'react';

export default function CandidateSelector({ candidates, onSelect, onSelectColgate }) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="candidate-selector-wrapper">
      <div className="candidate-selector-container">
        {/* Header */}
        <div className="candidate-selector-header">
          <div className="candidate-badge-pill">
            <span className="badge-sparkle">✦</span>
            <span>Multiple Product Matches Found</span>
          </div>
          <h2 className="candidate-heading">Select Your Product</h2>
          <p className="candidate-subheading">
            We discovered {candidates.length} matching product listings. Click on any product below to view its complete customer review intelligence, price comparison, and AI summary.
          </p>

          {/* Helpful matching tip banner */}
          <div className="candidate-quick-pick-banner">
            <div className="banner-left">
              <span className="banner-sparkle">✨</span>
              <div className="banner-text">
                <span className="banner-title">Best Visual Matches Identified</span>
                <span className="banner-desc">Select the exact model matching your uploaded image to generate custom AI reviews & multi-store pricing.</span>
              </div>
            </div>
            {onSelectColgate && (
              <button className="btn-view-quick-colgate" onClick={onSelectColgate} title="View sample demo">
                <span>View Sample Demo</span>
                <span className="arrow">→</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="candidates-modern-grid">
          {candidates.map((candidate, i) => {
            const rawPrice = candidate.price || candidate.price_display;
            let displayPrice = rawPrice;
            if (typeof rawPrice === 'number') {
              displayPrice = `₹${rawPrice.toLocaleString()}`;
            }

            return (
              <div
                key={i}
                className="modern-candidate-card"
                onClick={() => onSelect(i, candidate)}
              >
                {/* Image Viewport */}
                <div className="candidate-card-img-wrap">
                  {candidate.thumbnail ? (
                    <img
                      src={candidate.thumbnail}
                      alt={candidate.title}
                      className="candidate-card-img"
                    />
                  ) : (
                    <div className="candidate-fallback-icon">📦</div>
                  )}
                  {candidate.source && (
                    <span className="candidate-source-badge">{candidate.source}</span>
                  )}
                </div>

                {/* Info Content */}
                <div className="candidate-card-content">
                  <h3 className="candidate-card-title" title={candidate.title}>
                    {candidate.title}
                  </h3>

                  {/* Rating */}
                  <div className="candidate-rating-row">
                    <span className="stars-gold">★★★★★</span>
                    <span className="candidate-rating-num">{candidate.rating || '4.5'}</span>
                    <span className="candidate-reviews-num">
                      ({candidate.reviews ? Number(candidate.reviews).toLocaleString() : '1,200+'} reviews)
                    </span>
                  </div>

                  {/* Price & CTA */}
                  <div className="candidate-card-bottom-row">
                    <div className="candidate-price-wrap">
                      <span className="price-label">Price</span>
                      <strong className="price-val">{displayPrice || '₹149 – ₹199'}</strong>
                    </div>

                    <button
                      className="btn-select-candidate"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(i, candidate);
                      }}
                    >
                      <span>View Report</span>
                      <span className="arrow">→</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
