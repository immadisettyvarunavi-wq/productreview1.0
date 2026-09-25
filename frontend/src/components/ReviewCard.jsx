export default function ReviewCard({ review, isHighlighted, _onEvidenceClick }) {
  const fullStars = Math.floor(review.rating || 0);
  const emptyStars = 5 - fullStars;

  return (
    <div className={`review-card ${isHighlighted ? 'highlighted' : ''}`} id={`review-${review.review_id}`}>
      <div className="review-header">
        <div className="review-rating">
          <div className="review-stars">
            {Array(fullStars).fill(0).map((_, i) => (
              <span key={`f${i}`} style={{ color: 'var(--accent-amber)' }}>★</span>
            ))}
            {Array(Math.max(0, emptyStars)).fill(0).map((_, i) => (
              <span key={`e${i}`} style={{ color: 'var(--accent-amber)', opacity: 0.2 }}>★</span>
            ))}
          </div>
          {review.rating && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {review.rating}/5
            </span>
          )}
        </div>
        <div className="review-meta">
          {review.verified_purchase && (
            <span className="verified-badge">✓ Verified Purchase</span>
          )}
          {review.date && <span>{review.date}</span>}
          {review.source && (
            <span className={`source-badge ${getSourceClass(review.source)}`}>
              {review.source}
            </span>
          )}
        </div>
      </div>

      {review.title && (
        <div className="review-title">{review.title}</div>
      )}

      <div className="review-content">{review.content}</div>

      <div className="review-footer">
        <div className="review-meta">
          {review.helpful_votes != null && (
            <span>👍 {review.helpful_votes} found helpful</span>
          )}
          {review.product_variant && (
            <span>📱 {review.product_variant}</span>
          )}
        </div>
        {review.source_url && (
          <a
            href={review.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="review-source-link"
          >
            View original →
          </a>
        )}
      </div>
    </div>
  );
}

function getSourceClass(source) {
  const s = source.toLowerCase();
  if (s.includes('amazon')) return 'amazon';
  if (s.includes('flipkart')) return 'flipkart';
  if (s.includes('google')) return 'google';
  return 'default';
}
