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

export default function ProductCard({ product, onClick }) {
  const rating = ratingConfig[product.overallRating];
  const [imgError, setImgError] = useState(false);

  return (
    <article
      className="product-card"
      onClick={() => onClick(product)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${product.name}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick(product)}
    >
      <div className="card-header">
        {/* Product Image */}
        <div className="card-image-area">
          {product.image && !imgError ? (
            <img
              src={product.image}
              alt={product.name}
              className="card-product-image"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="card-image-placeholder">
              <span style={{ fontSize: '56px' }}>
                {CATEGORY_EMOJI[product.category] || '💊'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {product.type}
              </span>
            </div>
          )}
          {/* Category chip over image */}
          <div className="card-category-chip">
            {product.category}
          </div>
        </div>

        <div className="card-brand">{product.brand}</div>
        <h3 className="card-name">{product.name}</h3>
        <div className="card-type">{product.servingSize} per serving</div>

        <div className="card-tags">
          {product.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="card-tag">{tag}</span>
          ))}
        </div>
      </div>

      <div className="card-body">
        {/* Safety Badge */}
        <div
          className="card-safety-badge"
          style={{
            background: rating.bgColor,
            borderColor: rating.borderColor,
            color: rating.color,
          }}
        >
          <span className="safety-badge-icon">{rating.icon}</span>
          <div className="safety-badge-info">
            <div className="safety-badge-label">{rating.label}</div>
            <div className="safety-badge-desc">
              {product.ingredients.length} ingredients analyzed
            </div>
          </div>
          <div className="safety-score-ring">
            <div className="safety-score-val">{product.safetyScore}</div>
            <div className="safety-score-label">Score</div>
          </div>
        </div>

        {/* Macros */}
        <div className="card-macros">
          {[
            { val: `${product.macros.calories}`, label: 'kcal' },
            { val: `${product.macros.protein}g`, label: 'Protein' },
            { val: `${product.macros.carbs}g`, label: 'Carbs' },
            { val: `${product.macros.fat}g`, label: 'Fat' },
          ].map((m) => (
            <div key={m.label} className="macro-item">
              <div className="macro-val">{m.val}</div>
              <div className="macro-label">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Footer (no price) */}
        <div className="card-footer">
          <div className="card-serving-info">
            <span className="card-serving-label">Per serving</span>
            <span className="card-serving-val">{product.servingSize}</span>
          </div>
          <button className="card-view-btn">
            View Details
            <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
