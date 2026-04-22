import { useMemo, useState } from 'react';
import { products, ratingConfig, brands } from '../data/products';
import { getBrandLeaderboard } from '../utils/scoring';

const ORIGIN_FLAG = {
  'India': '🇮🇳', 'USA': '🇺🇸', 'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪', 'Australia': '🇦🇺', 'Switzerland': '🇨🇭',
};

const CERT_COLORS = {
  'NSF Certified for Sport': '#3b82f6', 'Informed Sport': '#10b981',
  'GMP': '#8b5cf6', 'FSSAI': '#f97316', 'NSF': '#3b82f6',
  'ISO 22000': '#06b6d4', 'Non-GMO': '#10b981', 'Halal': '#10b981',
  'Kosher': '#6366f1', 'Vegetarian Society': '#10b981',
};

const getRiskColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

export default function BrandsPage({ onProductClick }) {
  const [indiaOnly, setIndiaOnly] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  const [expandedBrand, setExpandedBrand] = useState(null);

  const leaderboard = useMemo(() => getBrandLeaderboard(products), []);

  const displayed = useMemo(() => {
    let list = [...leaderboard];
    if (indiaOnly) {
      list = list.filter((b) => {
        const profile = brands[b.brand];
        return profile?.origin === 'India';
      });
    }
    if (sortBy === 'name') list.sort((a, b) => a.brand.localeCompare(b.brand));
    else if (sortBy === 'products') list.sort((a, b) => b.productCount - a.productCount);
    else list.sort((a, b) => b.avgScore - a.avgScore);
    return list;
  }, [leaderboard, indiaOnly, sortBy]);

  const maxScore = Math.max(...displayed.map((b) => b.avgScore));
  const topScore = displayed[0]?.avgScore;

  return (
    <div className="brands-page">
      {/* Hero */}
      <div className="brands-hero">
        <div className="brands-hero-badge">
          <span>🏆</span> Brand Intelligence
        </div>
        <h1 className="brands-hero-title">Brand Safety Leaderboard</h1>
        <p className="brands-hero-sub">
          Every brand ranked by the average safety score of their analyzed products.
          Scores are calculated from ingredient-level risk assessments — not marketing claims.
        </p>
        <div className="brands-hero-stats">
          <div className="brands-hero-stat">
            <span className="brands-hero-stat-val">{leaderboard.length}</span>
            <span className="brands-hero-stat-label">Brands</span>
          </div>
          <div className="brands-hero-stat">
            <span className="brands-hero-stat-val">{products.length}</span>
            <span className="brands-hero-stat-label">Products</span>
          </div>
          <div className="brands-hero-stat">
            <span className="brands-hero-stat-val" style={{ color: '#10b981' }}>
              {leaderboard.filter((b) => b.avgScore >= 80).length}
            </span>
            <span className="brands-hero-stat-label">Safe Brands</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="brands-controls">
        <div className="brands-toggle-row">
          <button
            className={`brands-toggle-btn ${indiaOnly ? 'active' : ''}`}
            onClick={() => setIndiaOnly((v) => !v)}
          >
            🇮🇳 India Only
          </button>
        </div>
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort brands"
        >
          <option value="score">Sort: Highest Score</option>
          <option value="name">Sort: Name A–Z</option>
          <option value="products">Sort: Most Products</option>
        </select>
        <div className="results-count">
          Showing <span>{displayed.length}</span> brands
        </div>
      </div>

      {/* Leaderboard */}
      <div className="brands-leaderboard">
        {displayed.map((b, idx) => {
          const profile = brands[b.brand];
          const origin = profile?.origin || 'Unknown';
          const flag = ORIGIN_FLAG[origin] || '🌍';
          const isExpanded = expandedBrand === b.brand;
          const barWidth = (b.avgScore / 100) * 100;
          const isTop = b.avgScore === topScore;

          return (
            <div
              key={b.brand}
              className={`brand-row ${isExpanded ? 'brand-row-expanded' : ''} ${isTop ? 'brand-row-top' : ''}`}
            >
              {/* Main row */}
              <div
                className="brand-row-main"
                onClick={() => setExpandedBrand(isExpanded ? null : b.brand)}
                role="button"
                aria-expanded={isExpanded}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setExpandedBrand(isExpanded ? null : b.brand)}
              >
                {/* Rank */}
                <div className="brand-rank">
                  {isTop ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>

                {/* Brand info */}
                <div className="brand-info">
                  <div className="brand-name-row">
                    <span className="brand-name">{b.brand}</span>
                    <span className="brand-flag">{flag}</span>
                    {profile?.certifications?.slice(0, 2).map((cert) => (
                      <span
                        key={cert}
                        className="brand-cert-mini"
                        style={{ color: CERT_COLORS[cert] || '#a0a0b8', borderColor: `${CERT_COLORS[cert] || '#a0a0b8'}40` }}
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                  <div className="brand-meta">
                    {origin}{profile?.founded ? ` · Est. ${profile.founded}` : ''} · {b.productCount} product{b.productCount !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Bar chart */}
                <div className="brand-bar-area">
                  <div className="brand-bar-track">
                    <div
                      className="brand-bar-fill"
                      style={{
                        width: `${barWidth}%`,
                        background: `linear-gradient(90deg, ${getRiskColor(b.avgScore)}80, ${getRiskColor(b.avgScore)})`,
                      }}
                    />
                  </div>
                  <div className="brand-score-range">
                    {b.minScore !== b.maxScore && (
                      <span className="brand-score-range-text">{b.minScore}–{b.maxScore}</span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div
                  className="brand-avg-score"
                  style={{ color: getRiskColor(b.avgScore) }}
                >
                  <span className="brand-avg-val">{b.avgScore}</span>
                  <span className="brand-avg-label">avg</span>
                </div>

                {/* Chevron */}
                <span className="brand-row-chevron">{isExpanded ? '▾' : '▸'}</span>
              </div>

              {/* Expanded: brand profile + products */}
              {isExpanded && (
                <div className="brand-expanded-panel">
                  {profile?.description && (
                    <p className="brand-about-text">{profile.description}</p>
                  )}
                  {profile?.certifications && profile.certifications.length > 0 && (
                    <div className="brand-cert-full-list">
                      {profile.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="brand-cert-chip"
                          style={{ color: CERT_COLORS[cert] || 'var(--text-secondary)', borderColor: `${CERT_COLORS[cert] || '#555'}40` }}
                        >
                          ✓ {cert}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="brand-products-grid">
                    {b.products.map((p) => {
                      const rating = ratingConfig[p.overallRating];
                      return (
                        <button
                          key={p.id}
                          className="brand-product-chip"
                          onClick={(e) => { e.stopPropagation(); onProductClick(p); }}
                          aria-label={`View ${p.name}`}
                        >
                          <span className="brand-product-name">{p.name}</span>
                          <span
                            className="brand-product-score"
                            style={{ color: rating.color, background: rating.bgColor, borderColor: rating.borderColor }}
                          >
                            {p.safetyScore}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
