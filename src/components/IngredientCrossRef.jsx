import { useMemo } from 'react';
import { products, ratingConfig } from '../data/products';

const RISK_ORDER = { safe: 0, low: 1, moderate: 2, harmful: 3 };

export default function IngredientCrossRef({ ingredientName, currentProductId, onProductClick, onClose }) {
  // Fuzzy-match: strip parentheticals and normalise for comparison
  const normName = (s) =>
    s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9\s]/g, '').trim();

  const needle = normName(ingredientName);

  const matches = useMemo(() => {
    return products
      .filter((p) => p.id !== currentProductId)
      .filter((p) =>
        p.ingredients.some((ing) => normName(ing.name).includes(needle) || needle.includes(normName(ing.name)))
      )
      .map((p) => {
        const ing = p.ingredients.find(
          (i) => normName(i.name).includes(needle) || needle.includes(normName(i.name))
        );
        return { product: p, ingredient: ing };
      })
      .sort((a, b) => RISK_ORDER[a.ingredient.risk] - RISK_ORDER[b.ingredient.risk]);
  }, [ingredientName, currentProductId]);

  const riskCounts = useMemo(() => {
    const c = { safe: 0, low: 0, moderate: 0, harmful: 0 };
    matches.forEach(({ ingredient }) => { if (c[ingredient.risk] !== undefined) c[ingredient.risk]++; });
    return c;
  }, [matches]);

  return (
    <div className="xref-overlay" role="dialog" aria-modal="true" aria-label={`Products containing ${ingredientName}`}>
      <div className="xref-panel">
        {/* Header */}
        <div className="xref-header">
          <div className="xref-header-left">
            <div className="xref-back-btn" onClick={onClose} role="button" tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onClose()}
              aria-label="Close ingredient cross-reference">
              ← Back
            </div>
            <div>
              <div className="xref-title">🔗 Ingredient Cross-Reference</div>
              <div className="xref-subtitle">
                Products containing <strong>"{ingredientName}"</strong>
              </div>
            </div>
          </div>
          <button className="xref-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Risk distribution pills */}
        <div className="xref-risk-bar">
          {Object.entries(riskCounts).filter(([, n]) => n > 0).map(([risk, count]) => {
            const cfg = ratingConfig[risk];
            return (
              <span key={risk} className="xref-risk-pill" style={{ background: `${cfg.bgColor}`, borderColor: cfg.borderColor, color: cfg.color }}>
                {cfg.icon} {count} product{count !== 1 ? 's' : ''} — {cfg.label}
              </span>
            );
          })}
          {matches.length === 0 && (
            <span className="xref-risk-pill" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
              Unique to this product
            </span>
          )}
        </div>

        {/* Results */}
        {matches.length === 0 ? (
          <div className="xref-empty">
            <div className="xref-empty-icon">🌟</div>
            <div className="xref-empty-title">Unique ingredient</div>
            <p className="xref-empty-desc">
              No other products in the database contain "<strong>{ingredientName}</strong>".
              This could indicate a proprietary formula or a rare ingredient.
            </p>
          </div>
        ) : (
          <div className="xref-list">
            {matches.map(({ product, ingredient }) => {
              const cfg = ratingConfig[ingredient.risk];
              return (
                <button
                  key={product.id}
                  className="xref-product-row"
                  onClick={() => { onProductClick(product); onClose(); }}
                  aria-label={`Open ${product.name}`}
                >
                  {/* Product image thumbnail */}
                  <div className="xref-thumb">
                    {product.image && !product.image.startsWith('/') ? (
                      <img src={product.image} alt={product.name} className="xref-thumb-img"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className="xref-thumb-fallback" style={{ display: product.image && !product.image.startsWith('/') ? 'none' : 'flex' }}>
                      {product.category === 'Protein Powder' ? '🥛' :
                       product.category === 'Pre-Workout' ? '⚡' :
                       product.category === 'Creatine' ? '💎' :
                       product.category === 'BCAAs' ? '🔬' :
                       product.category === 'Mass Gainer' ? '💪' :
                       product.category === 'Fat Burner' ? '🔥' :
                       product.category === 'Omega-3' ? '🐟' : '💊'}
                    </div>
                  </div>

                  {/* Product info */}
                  <div className="xref-product-info">
                    <div className="xref-product-name">{product.name}</div>
                    <div className="xref-product-brand">{product.brand} · {product.category}</div>
                    <div className="xref-ing-note">
                      <span className="xref-ing-pct">{ingredient.percentage}%</span>
                      <span className="xref-ing-risk-badge"
                        style={{ background: cfg.bgColor, borderColor: cfg.borderColor, color: cfg.color }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {ingredient.percentage > 5 && (
                        <span className="xref-ing-high-flag">High proportion</span>
                      )}
                    </div>
                  </div>

                  {/* Product safety score */}
                  <div className="xref-score" style={{ color: product.safetyScore >= 80 ? 'var(--neon-green)' : product.safetyScore >= 60 ? 'var(--neon-yellow)' : 'var(--neon-orange)' }}>
                    <span className="xref-score-val">{product.safetyScore}</span>
                    <span className="xref-score-label">Score</span>
                  </div>

                  <span className="xref-arrow">›</span>
                </button>
              );
            })}
          </div>
        )}

        {matches.length > 0 && (
          <div className="xref-footer">
            💡 Click any product to open its full safety report
          </div>
        )}
      </div>
    </div>
  );
}
