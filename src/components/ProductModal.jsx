import { useState } from 'react';
import { ratingConfig } from '../data/products';

const CATEGORY_EMOJI = {
  'Protein Powder': '🥛',
  'Pre-Workout': '⚡',
  'Creatine': '💎',
  'BCAAs': '🔬',
  'Mass Gainer': '💪',
  'Protein Bar': '🍫',
  'Vitamins': '💊',
};

const getRiskColor = (risk) => {
  const map = { safe: '#10b981', low: '#f59e0b', moderate: '#f97316', harmful: '#ef4444' };
  return map[risk] || '#10b981';
};
const getRiskBg = (risk) => {
  const map = {
    safe: 'rgba(16,185,129,0.12)', low: 'rgba(245,158,11,0.12)',
    moderate: 'rgba(249,115,22,0.12)', harmful: 'rgba(239,68,68,0.12)',
  };
  return map[risk] || 'rgba(16,185,129,0.12)';
};

export default function ProductModal({ product, onClose }) {
  const rating = ratingConfig[product.overallRating];
  const [imgError, setImgError] = useState(false);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label={product.name}>
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Hero Image Banner */}
        <div className="modal-image-banner">
          {product.image && !imgError ? (
            <img
              src={product.image}
              alt={product.name}
              className="modal-product-image"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="modal-image-fallback">
              <span>{CATEGORY_EMOJI[product.category] || '💊'}</span>
            </div>
          )}
          <div className="modal-image-overlay" />
          <div className="modal-image-caption">
            <div className="modal-brand-over">{product.brand}</div>
            <div className="modal-category-over">{product.category}</div>
          </div>
        </div>

        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">{product.name}</h2>
            <p className="modal-description">{product.description}</p>
          </div>

          {/* Overall Safety Score */}
          <div className="modal-section">
            <div className="modal-section-title">Safety Assessment</div>
            <div
              className="overall-score-card"
              style={{ background: rating.bgColor, borderColor: rating.borderColor, color: rating.color }}
            >
              <div className="score-circle" style={{ borderColor: rating.color, color: rating.color }}>
                <span className="score-circle-val">{product.safetyScore}</span>
                <span className="score-circle-label">/ 100</span>
              </div>
              <div className="score-details">
                <div className="score-rating-label">{rating.label}</div>
                <div className="score-rating-desc">{rating.description}</div>
              </div>
              <span style={{ fontSize: '32px' }}>{rating.icon}</span>
            </div>
          </div>

          {/* Ingredients */}
          <div className="modal-section">
            <div className="modal-section-title">
              Ingredients Breakdown ({product.ingredients.length} ingredients)
            </div>
            {product.ingredients.map((ing, idx) => (
              <div key={idx} className="ingredient-item">
                <div className="ingredient-header">
                  <span className="ingredient-name">{ing.name}</span>
                  <div className="ingredient-meta">
                    <span className="ingredient-pct">{ing.percentage}%</span>
                    <span
                      className="ingredient-risk-badge"
                      style={{
                        background: getRiskBg(ing.risk),
                        color: getRiskColor(ing.risk),
                        border: `1px solid ${getRiskColor(ing.risk)}40`,
                      }}
                    >
                      {ratingConfig[ing.risk]?.label || ing.risk}
                    </span>
                  </div>
                </div>
                <div className="ingredient-bar-track">
                  <div
                    className="ingredient-bar-fill"
                    style={{
                      width: `${ing.percentage}%`,
                      background: `linear-gradient(90deg, ${getRiskColor(ing.risk)}70, ${getRiskColor(ing.risk)})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Nutrition / Macros */}
          {(product.macros.calories > 0 || product.macros.protein > 0) && (
            <div className="modal-section">
              <div className="modal-section-title">Nutrition Per Serving ({product.servingSize})</div>
              <div className="macros-grid">
                {[
                  { val: product.macros.calories, unit: 'kcal', label: 'Calories' },
                  { val: product.macros.protein + 'g', unit: '', label: 'Protein' },
                  { val: product.macros.carbs + 'g', unit: '', label: 'Carbs' },
                  { val: product.macros.fat + 'g', unit: '', label: 'Fat' },
                ].map((m, i) => (
                  <div className="macro-card" key={i}>
                    <div className="macro-card-val">{m.val}</div>
                    {m.unit && <div className="macro-card-unit">{m.unit}</div>}
                    <div className="macro-card-label">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="modal-section" style={{ marginBottom: 0 }}>
            <div className="modal-section-title">Tags</div>
            <div className="card-tags">
              {product.tags.map((tag) => (
                <span key={tag} className="card-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
