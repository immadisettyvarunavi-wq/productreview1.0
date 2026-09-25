export default function ReviewDistribution({ distribution, _totalReviews }) {
  if (!distribution || Object.keys(distribution).length === 0) return null;

  // Ensure all stars are represented
  const stars = ['5', '4', '3', '2', '1'];
  const total = Object.values(distribution).reduce((s, v) => s + v, 0) || 1;

  return (
    <div className="glass-card">
      <div className="section-title">
        <span className="icon">📊</span> Review Distribution
        <span className="data-label">📡 Real data</span>
      </div>
      <div className="star-distribution">
        {stars.map((star) => {
          const count = distribution[star] || 0;
          const percent = Math.round((count / total) * 100);
          return (
            <div key={star} className="star-row">
              <span className="star-label">{star} ★</span>
              <div className="star-bar-bg">
                <div
                  className={`star-bar-fill star-${star}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="star-percent">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
