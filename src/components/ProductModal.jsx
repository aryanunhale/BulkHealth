import { useState, useMemo, useEffect } from 'react';
import { ratingConfig, products as allProducts, brands } from '../data/products';
import RadarChart from './RadarChart';
import DonutChart from './DonutChart';
import IngredientCrossRef from './IngredientCrossRef';
import { getRadarScores, getDonutData } from '../utils/scoring';

const CATEGORY_EMOJI = {
  'Protein Powder': '🥛',
  'Pre-Workout': '⚡',
  'Creatine': '💎',
  'BCAAs': '🔬',
  'Mass Gainer': '💪',
  'Protein Bar': '🍫',
  'Vitamins': '💊',
  'Fat Burner': '🔥',
  'Omega-3': '🐟',
  'Glutamine': '🧬',
  'ZMA': '🌙',
  'Electrolytes': '💧',
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

const CERT_ICONS = {
  'NSF Certified for Sport': { icon: '🏅', color: '#3b82f6' },
  'Informed Sport': { icon: '✔️', color: '#10b981' },
  'GMP': { icon: '🏭', color: '#8b5cf6' },
  'FSSAI': { icon: '🇮🇳', color: '#f97316' },
  'NSF': { icon: '🏅', color: '#3b82f6' },
  'ISO 22000': { icon: '📋', color: '#06b6d4' },
  'Non-GMO': { icon: '🌿', color: '#10b981' },
  'Vegan': { icon: '🌱', color: '#10b981' },
  'Halal': { icon: '☪️', color: '#10b981' },
  'Kosher': { icon: '✡️', color: '#6366f1' },
};

export default function ProductModal({ product, onClose, onSwitchProduct }) {
  const rating = ratingConfig[product.overallRating];
  const [imgError, setImgError] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState({});
  const [modalTab, setModalTab] = useState('analysis'); // 'analysis' | 'ingredients'

  const brand = brands[product.brand];
  const saferProduct = product.saferAlternative
    ? allProducts.find((p) => p.id === product.saferAlternative.id)
    : null;

  const radarScores = useMemo(() => getRadarScores(product), [product]);
  const donutData = useMemo(() => getDonutData(product), [product]);

  const toggleIngredient = (idx) => {
    setExpandedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const hasDetailForIngredient = (ing) =>
    (ing.whyRisky && ing.whyRisky.trim()) ||
    (ing.clinicalDose && ing.clinicalDose !== 'N/A') ||
    (ing.sideEffects && ing.sideEffects.length > 0);

  const [touchStart, setTouchStart] = useState(null);
  const [xrefIngredient, setXrefIngredient] = useState(null); // ingredient name for cross-ref

  // Track recently viewed in localStorage
  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem('bh-recent') || '[]');
      const next = [product.id, ...prev.filter(id => id !== product.id)].slice(0, 8);
      localStorage.setItem('bh-recent', JSON.stringify(next));
    } catch {}
  }, [product.id]);

  // Keyboard: Escape to close cross-ref or modal
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (xrefIngredient) setXrefIngredient(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [xrefIngredient, onClose]);

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const delta = e.changedTouches[0].clientY - touchStart;
    if (delta > 80) onClose(); // swipe down > 80px = dismiss
    setTouchStart(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (<>
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="modal">
        <div className="modal-header-bar">
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
          <button className="modal-print-btn" onClick={handlePrint} aria-label="Print safety report">
            <span>🖨️</span> Export PDF
          </button>
        </div>
        <div className="modal-swipe-handle" aria-hidden="true" />
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

          {/* Brand Profile Badge */}
          {brand && (
            <div className="modal-brand-profile">
              <div className="brand-profile-row">
                <div className="brand-profile-meta">
                  <span className="brand-profile-origin">
                    {brand.flag || '🌍'} {brand.origin || '—'}{brand.founded ? ` · Est. ${brand.founded}` : ''}
                  </span>
                  <span className="brand-profile-about">{brand.description}</span>
                </div>
              </div>
              {brand.certifications && brand.certifications.length > 0 && (
                <div className="brand-cert-list">
                  {brand.certifications.map((cert) => {
                    const ci = CERT_ICONS[cert];
                    return (
                      <span
                        key={cert}
                        className="brand-cert-chip"
                        style={{ borderColor: ci ? `${ci.color}50` : 'var(--border)', color: ci?.color || 'var(--text-secondary)' }}
                      >
                        {ci?.icon || '✓'} {cert}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tab row ── */}
          <div className="modal-tab-row" role="tablist">
            <button
              className={`modal-tab-btn ${modalTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setModalTab('analysis')}
              role="tab"
              aria-selected={modalTab === 'analysis'}
            >
              📊 Analysis
            </button>
            <button
              className={`modal-tab-btn ${modalTab === 'ingredients' ? 'active' : ''}`}
              onClick={() => setModalTab('ingredients')}
              role="tab"
              aria-selected={modalTab === 'ingredients'}
            >
              🧪 Ingredients
            </button>
          </div>

          {/* ── Analysis Tab ── */}
          {modalTab === 'analysis' && (
            <div className="modal-analysis-tab">
              {/* Safety score card */}
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

              {/* Charts row */}
              <div className="modal-charts-row">
                <div className="modal-chart-block">
                  <div className="modal-chart-title">🕸️ Product Profile</div>
                  <div className="modal-chart-sub">5-axis assessment of quality dimensions</div>
                  <RadarChart scores={radarScores} />
                </div>
                <div className="modal-chart-block">
                  <div className="modal-chart-title">🍩 Ingredient Risk Mix</div>
                  <div className="modal-chart-sub">Ingredient weight distributed by risk level</div>
                  <DonutChart data={donutData} totalIngredients={product.ingredients.length} />
                </div>
              </div>
            </div>
          )}

          {/* ── Ingredients Tab ── */}
          {modalTab === 'ingredients' && (
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
          )}

          {modalTab === 'ingredients' && (<>
          <div className="modal-section">
            <div className="modal-section-title">
              Ingredients Breakdown ({product.ingredients.length} ingredients)
            </div>
            <p className="modal-ingredients-hint">Tap an ingredient to expand details · click 🔗 to see all products sharing it.</p>
            {product.ingredients.map((ing, idx) => {
              const isExpanded = expandedIngredients[idx];
              const hasDetail = hasDetailForIngredient(ing);
              return (
                <div key={idx} className={`ingredient-item ${hasDetail ? 'ingredient-expandable' : ''}`}>
                  <div
                    className="ingredient-header"
                    onClick={() => hasDetail && toggleIngredient(idx)}
                    style={{ cursor: hasDetail ? 'pointer' : 'default' }}
                    role={hasDetail ? 'button' : undefined}
                    aria-expanded={hasDetail ? isExpanded : undefined}
                  >
                    <span className="ingredient-name">
                      {hasDetail && (
                        <span className="ingredient-expand-caret" aria-hidden="true">
                          {isExpanded ? '▾' : '▸'}
                        </span>
                      )}
                      {ing.name}
                    </span>
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
                      <button
                        className="ingredient-xref-btn"
                        onClick={(e) => { e.stopPropagation(); setXrefIngredient(ing.name); }}
                        title={`See all products with ${ing.name}`}
                        aria-label={`Cross-reference: products with ${ing.name}`}
                      >
                        🔗
                      </button>
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

                  {/* Expanded detail panel */}
                  {hasDetail && isExpanded && (
                    <div className="ingredient-detail-panel">
                      {ing.whyRisky && ing.whyRisky.trim() && (
                        <div className="ingredient-detail-block ingredient-why-risky">
                          <span className="detail-label">⚠ Why it's a concern</span>
                          <p>{ing.whyRisky}</p>
                        </div>
                      )}
                      {ing.clinicalDose && ing.clinicalDose !== 'N/A' && !ing.clinicalDose.startsWith('N/A') && (
                        <div className="ingredient-detail-block ingredient-clinical-dose">
                          <span className="detail-label">💊 Clinical dose</span>
                          <p>{ing.clinicalDose}</p>
                        </div>
                      )}
                      {ing.sideEffects && ing.sideEffects.length > 0 && (
                        <div className="ingredient-detail-block ingredient-side-effects">
                          <span className="detail-label">🩺 Side effects</span>
                          <ul>
                            {ing.sideEffects.map((se, i) => (
                              <li key={i}>{se}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
          <div className="modal-section">
            <div className="modal-section-title">Tags</div>
            <div className="card-tags">
              {product.tags.map((tag) => (
                <span key={tag} className="card-tag">{tag}</span>
              ))}
            </div>
          </div>

          {/* Safer Alternative */}
          {saferProduct && product.saferAlternative && (
            <div className="modal-section" style={{ marginBottom: 0 }}>
              <div className="modal-section-title">💚 Safer Alternative</div>
              <div className="safer-alt-card">
                <div className="safer-alt-icon">
                  {CATEGORY_EMOJI[saferProduct.category] || '💊'}
                </div>
                <div className="safer-alt-info">
                  <div className="safer-alt-name">{saferProduct.name}</div>
                  <div className="safer-alt-brand">{saferProduct.brand}</div>
                  <div className="safer-alt-reason">{product.saferAlternative.reason}</div>
                  <div className="safer-alt-score-row">
                    <span
                      className="safer-alt-score"
                      style={{ color: getRiskColor(saferProduct.overallRating) }}
                    >
                      Score: {saferProduct.safetyScore}/100
                    </span>
                    <span
                      className="safer-alt-rating"
                      style={{
                        background: getRiskBg(saferProduct.overallRating),
                        color: getRiskColor(saferProduct.overallRating),
                        border: `1px solid ${getRiskColor(saferProduct.overallRating)}40`,
                      }}
                    >
                      {ratingConfig[saferProduct.overallRating]?.label}
                    </span>
                  </div>
                </div>
                <button
                  className="safer-alt-btn"
                  onClick={() => {
                    onClose();
                    if (onSwitchProduct) onSwitchProduct(saferProduct);
                  }}
                  aria-label={`View ${saferProduct.name}`}
                >
                  View →
                </button>
              </div>
            </div>
          )}
          </>)}
        </div>
      </div>
    </div>

    {/* Ingredient cross-reference overlay */}
    {xrefIngredient && (
      <IngredientCrossRef
        ingredientName={xrefIngredient}
        currentProductId={product.id}
        onProductClick={(p) => { if (onSwitchProduct) onSwitchProduct(p); }}
        onClose={() => setXrefIngredient(null)}
      />
    )}
  </>);
}
