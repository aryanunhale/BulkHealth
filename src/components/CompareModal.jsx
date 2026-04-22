import { useMemo } from 'react';
import { ratingConfig } from '../data/products';

const CATEGORY_EMOJI = {
  'Protein Powder': '🥛', 'Pre-Workout': '⚡', 'Creatine': '💎',
  'BCAAs': '🔬', 'Mass Gainer': '💪', 'Protein Bar': '🍫',
  'Vitamins': '💊', 'Fat Burner': '🔥', 'Omega-3': '🐟',
  'Glutamine': '🧬', 'ZMA': '🌙', 'Electrolytes': '💧',
};

const getRiskColor = (r) => ({ safe: '#10b981', low: '#f59e0b', moderate: '#f97316', harmful: '#ef4444' }[r] || '#10b981');
const getRiskBg = (r) => ({ safe: 'rgba(16,185,129,0.15)', low: 'rgba(245,158,11,0.15)', moderate: 'rgba(249,115,22,0.15)', harmful: 'rgba(239,68,68,0.15)' }[r] || 'rgba(16,185,129,0.15)');

// Extract a short canonical key for ingredient matching
const ingKey = (name) =>
  name.toLowerCase().replace(/\([^)]*\)/g, '').trim().split(/\s+/).slice(0, 3).join(' ');

const MACRO_LABELS = [
  { key: 'calories', unit: 'kcal', label: 'Calories', lowerBetter: true },
  { key: 'protein', unit: 'g', label: 'Protein', lowerBetter: false },
  { key: 'carbs', unit: 'g', label: 'Carbs', lowerBetter: true },
  { key: 'fat', unit: 'g', label: 'Fat', lowerBetter: true },
];

export default function CompareModal({ products, onRemove, onClose }) {
  const n = products.length;

  // Build shared ingredient keys (present in 2+ products)
  const sharedKeys = useMemo(() => {
    const keyCount = {};
    products.forEach((p) =>
      p.ingredients.forEach((ing) => {
        const k = ingKey(ing.name);
        keyCount[k] = (keyCount[k] || 0) + 1;
      })
    );
    return new Set(Object.entries(keyCount).filter(([, c]) => c >= 2).map(([k]) => k));
  }, [products]);

  // Per-macro: find best and worst values
  const macroExtremes = useMemo(() =>
    MACRO_LABELS.reduce((acc, { key, lowerBetter }) => {
      const vals = products.map((p) => p.macros[key]);
      acc[key] = {
        best: lowerBetter ? Math.min(...vals) : Math.max(...vals),
        worst: lowerBetter ? Math.max(...vals) : Math.min(...vals),
      };
      return acc;
    }, {}),
  [products]);

  const getMacroClass = (key, val) => {
    const { best, worst } = macroExtremes[key];
    if (n < 2) return '';
    if (val === best) return 'compare-macro-best';
    if (val === worst) return 'compare-macro-worst';
    return '';
  };

  // Unique ingredients across all products for the overlap table
  const allIngredients = useMemo(() => {
    const seen = new Map();
    products.forEach((p) =>
      p.ingredients.forEach((ing) => {
        const k = ingKey(ing.name);
        if (!seen.has(k)) seen.set(k, { key: k, displayName: ing.name, risk: ing.risk });
      })
    );
    // Sort: shared first, then by risk severity
    const riskOrder = { harmful: 0, moderate: 1, low: 2, safe: 3 };
    return [...seen.values()].sort((a, b) => {
      const aShared = sharedKeys.has(a.key) ? -1 : 1;
      const bShared = sharedKeys.has(b.key) ? -1 : 1;
      if (aShared !== bShared) return aShared - bShared;
      return (riskOrder[a.risk] || 3) - (riskOrder[b.risk] || 3);
    });
  }, [products, sharedKeys]);

  const productHasIng = (product, key) =>
    product.ingredients.some((i) => ingKey(i.name) === key);

  const getIngRiskForProduct = (product, key) => {
    const ing = product.ingredients.find((i) => ingKey(i.name) === key);
    return ing ? ing.risk : null;
  };

  return (
    <div className="compare-overlay" role="dialog" aria-modal="true" aria-label="Compare Products">
      <div className="compare-modal">
        {/* Header */}
        <div className="compare-header">
          <div className="compare-header-left">
            <span className="compare-header-icon">⚖️</span>
            <div>
              <div className="compare-header-title">Side-by-Side Comparison</div>
              <div className="compare-header-sub">{n} product{n !== 1 ? 's' : ''} selected · Click ✕ on a column to remove</div>
            </div>
          </div>
          <button className="compare-close-btn" onClick={onClose} aria-label="Close comparison">✕ Close</button>
        </div>

        <div className="compare-body">
          {/* Product columns header */}
          <div className="compare-grid" style={{ '--compare-cols': n }}>
            {/* Row: Product identity */}
            <div className="compare-label-col">
              <div className="compare-section-spacer" />
            </div>
            {products.map((p) => {
              const rating = ratingConfig[p.overallRating];
              return (
                <div key={p.id} className="compare-product-header">
                  <button
                    className="compare-col-remove"
                    onClick={() => onRemove(p.id)}
                    aria-label={`Remove ${p.name}`}
                  >✕</button>
                  <div className="compare-col-emoji">{CATEGORY_EMOJI[p.category] || '💊'}</div>
                  <div className="compare-col-brand">{p.brand}</div>
                  <div className="compare-col-name">{p.name}</div>
                  <div className="compare-col-category">{p.category}</div>
                  <div
                    className="compare-col-score"
                    style={{ borderColor: rating.color, color: rating.color, background: rating.bgColor }}
                  >
                    <span className="compare-score-val">{p.safetyScore}</span>
                    <span className="compare-score-sub">/ 100 · {rating.label}</span>
                  </div>
                </div>
              );
            })}

            {/* Row: Macros */}
            <div className="compare-section-header-full">
              <span>📊 Macros per Serving</span>
            </div>
            {MACRO_LABELS.map(({ key, unit, label }) => (
              <>
                <div key={`lbl-${key}`} className="compare-label-col compare-macro-label">{label}</div>
                {products.map((p) => (
                  <div
                    key={`${p.id}-${key}`}
                    className={`compare-macro-cell ${getMacroClass(key, p.macros[key])}`}
                  >
                    <span className="compare-macro-val">{p.macros[key]}</span>
                    <span className="compare-macro-unit">{unit}</span>
                    {n >= 2 && getMacroClass(key, p.macros[key]) === 'compare-macro-best' && (
                      <span className="compare-macro-badge compare-macro-badge-best">Best</span>
                    )}
                    {n >= 2 && getMacroClass(key, p.macros[key]) === 'compare-macro-worst' && (
                      <span className="compare-macro-badge compare-macro-badge-worst">High</span>
                    )}
                  </div>
                ))}
              </>
            ))}

            {/* Row: Ingredients overlap */}
            <div className="compare-section-header-full">
              <span>🧪 Ingredient Overlap</span>
              {sharedKeys.size > 0 && (
                <span className="compare-shared-badge">{sharedKeys.size} shared</span>
              )}
            </div>
            {allIngredients.map((ing) => {
              const isShared = sharedKeys.has(ing.key);
              return (
                <>
                  <div
                    key={`lbl-${ing.key}`}
                    className={`compare-label-col compare-ing-label ${isShared ? 'compare-ing-shared' : ''}`}
                  >
                    <span
                      className="compare-ing-dot"
                      style={{ background: getRiskColor(ing.risk) }}
                    />
                    <span className="compare-ing-name-text">{ing.displayName}</span>
                    {isShared && <span className="compare-shared-chip">Shared</span>}
                  </div>
                  {products.map((p) => {
                    const has = productHasIng(p, ing.key);
                    const risk = getIngRiskForProduct(p, ing.key);
                    return (
                      <div
                        key={`${p.id}-${ing.key}`}
                        className={`compare-ing-cell ${isShared && has ? 'compare-ing-cell-shared' : ''}`}
                      >
                        {has ? (
                          <span
                            className="compare-ing-check"
                            style={{ color: getRiskColor(risk), background: getRiskBg(risk) }}
                          >
                            ✓
                          </span>
                        ) : (
                          <span className="compare-ing-miss">—</span>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })}

            {/* Row: Verdict */}
            <div className="compare-section-header-full"><span>🏆 Verdict</span></div>
            <div className="compare-label-col" />
            {products.map((p) => {
              const isTopScore = p.safetyScore === Math.max(...products.map((x) => x.safetyScore));
              return (
                <div key={`verdict-${p.id}`} className="compare-verdict-cell">
                  {isTopScore && n > 1 && (
                    <div className="compare-verdict-winner">
                      <span>🏆</span> Safest Pick
                    </div>
                  )}
                  {p.saferAlternative && (
                    <div className="compare-verdict-alt">
                      💚 Has safer alternative
                    </div>
                  )}
                  <div className="compare-verdict-tags">
                    {p.tags.slice(0, 2).map((t) => (
                      <span key={t} className="card-tag">{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
