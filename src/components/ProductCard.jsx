import { useState } from 'react';
import { ratingConfig } from '../data/products';

const CATEGORY_EMOJI = {
  'Protein Powder': '🥛', 'Pre-Workout': '⚡', 'Creatine': '💎',
  'BCAAs': '🔬', 'Mass Gainer': '💪', 'Protein Bar': '🍫',
  'Vitamins': '💊', 'Fat Burner': '🔥', 'Omega-3': '🐟',
  'Glutamine': '🧬', 'ZMA': '🌙', 'Electrolytes': '💧',
};

export default function ProductCard({
  product,
  onClick,
  // Phase 2 props
  isBookmarked,
  onBookmark,
  inCompare,
  onCompare,
  compareDisabled,   // true when compare list is full and this product is NOT in it
  inStack,
  onStack,
  staggerIndex = 0,  // Phase 4: for staggered entry animation
}) {
  const rating = ratingConfig[product.overallRating];
  const [imgError, setImgError] = useState(false);
  const cardStyle = { '--stagger-i': Math.min(staggerIndex, 11) }; // cap at 11 to avoid very long delays

  const handleBookmark = (e) => {
    e.stopPropagation();
    onBookmark(product.id);
  };

  const handleCompare = (e) => {
    e.stopPropagation();
    if (!compareDisabled || inCompare) onCompare(product.id);
  };

  const handleStack = (e) => {
    e.stopPropagation();
    onStack(product.id);
  };

  return (
    <article
      className={`product-card ${inCompare ? 'product-card-comparing' : ''}`}
      style={cardStyle}
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
          {/* Category chip */}
          <div className="card-category-chip">{product.category}</div>

          {/* Bookmark button */}
          <button
            className={`card-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={handleBookmark}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark product'}
            title={isBookmarked ? 'Saved' : 'Save'}
          >
            {isBookmarked ? '❤️' : '🤍'}
          </button>
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

        {/* Safer Alternative indicator */}
        {product.saferAlternative && (
          <div className="card-safer-hint">💚 Safer alternative available</div>
        )}

        {/* Phase 2 action row */}
        <div className="card-actions">
          {/* Compare toggle */}
          <button
            className={`card-action-btn card-compare-btn ${inCompare ? 'active' : ''} ${compareDisabled && !inCompare ? 'disabled' : ''}`}
            onClick={handleCompare}
            aria-pressed={inCompare}
            aria-label={inCompare ? 'Remove from compare' : compareDisabled ? 'Compare list full (max 3)' : 'Add to compare'}
            title={compareDisabled && !inCompare ? 'Max 3 products in compare' : undefined}
          >
            {inCompare ? '⊖ Comparing' : compareDisabled ? '⚖️ Full' : '⚖️ Compare'}
          </button>

          {/* Stack toggle */}
          <button
            className={`card-action-btn card-stack-btn ${inStack ? 'active' : ''}`}
            onClick={handleStack}
            aria-pressed={inStack}
            aria-label={inStack ? 'Remove from stack' : 'Add to stack'}
          >
            {inStack ? '🧪 In Stack' : '🧪 Stack'}
          </button>
        </div>

        {/* Footer */}
        <div className="card-footer">
          <div className="card-serving-info">
            <span className="card-serving-label">Per serving</span>
            <span className="card-serving-val">{product.servingSize}</span>
          </div>
          <button className="card-view-btn">
            View Details <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
