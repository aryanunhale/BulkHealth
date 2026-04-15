import { useState, useMemo } from 'react';
import { productCategories, ingredientsEncyclopedia, safetyRatingGuide } from '../data/helpData';
import { ratingConfig } from '../data/products';

const RISK_COLOR = {
  safe: '#10b981', low: '#f59e0b', moderate: '#f97316', harmful: '#ef4444',
};
const RISK_BG = {
  safe: 'rgba(16,185,129,0.12)', low: 'rgba(245,158,11,0.12)',
  moderate: 'rgba(249,115,22,0.12)', harmful: 'rgba(239,68,68,0.12)',
};
const INGREDIENT_CATEGORIES = ['All', 'Protein', 'Amino Acid', 'Performance', 'Stimulant', 'Sweetener', 'Carbohydrate', 'Additive', 'Digestive Aid'];

function CategoryCard({ cat }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`help-cat-card ${open ? 'open' : ''}`}
      style={{ '--cat-color': cat.color }}
    >
      <button
        className="help-cat-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="help-cat-left">
          <div className="help-cat-emoji" style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}40` }}>
            {cat.emoji}
          </div>
          <div>
            <div className="help-cat-name">{cat.name}</div>
            <div className="help-cat-tagline">{cat.tagline}</div>
          </div>
        </div>
        <div
          className="help-cat-chevron"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </div>
      </button>

      {open && (
        <div className="help-cat-body">
          <div className="help-cat-section">
            <div className="help-section-label">What is it?</div>
            <p className="help-section-text">{cat.whatItIs}</p>
          </div>

          <div className="help-cat-section">
            <div className="help-section-label">What is it used for?</div>
            <ul className="help-bullet-list">
              {cat.whatItsFor.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="help-cat-section">
            <div className="help-section-label">Types available</div>
            <div className="help-types-grid">
              {cat.types.map((t, i) => (
                <div key={i} className="help-type-item">
                  <div className="help-type-name">{t.name}</div>
                  <div className="help-type-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="help-who-grid">
            <div className="help-who-card help-who-use">
              <div className="help-who-title">✓ Who should use it</div>
              <p>{cat.whoShouldUse}</p>
            </div>
            <div className="help-who-card help-who-avoid">
              <div className="help-who-title">✕ Who should avoid it</div>
              <p>{cat.whoShouldAvoid}</p>
            </div>
          </div>

          <div
            className="help-tip-box"
            style={{ background: cat.tipColor, border: `1px solid ${cat.color}30` }}
          >
            {cat.tip}
          </div>
        </div>
      )}
    </div>
  );
}

function IngredientCard({ ing }) {
  const [open, setOpen] = useState(false);
  const riskColor = RISK_COLOR[ing.risk] || '#10b981';
  const riskBg = RISK_BG[ing.risk] || 'rgba(16,185,129,0.12)';

  return (
    <div className={`help-ing-card ${open ? 'open' : ''}`}>
      <button
        className="help-ing-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="help-ing-left">
          <div>
            <div className="help-ing-name">{ing.name}</div>
            <div className="help-ing-cat">{ing.category}</div>
          </div>
        </div>
        <div className="help-ing-right">
          <span
            className="help-ing-risk"
            style={{ background: riskBg, color: riskColor, border: `1px solid ${riskColor}40` }}
          >
            {ratingConfig[ing.risk]?.icon} {ratingConfig[ing.risk]?.label || ing.risk}
          </span>
          <div
            className="help-cat-chevron"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', marginLeft: '8px' }}
          >
            ▾
          </div>
        </div>
      </button>

      {open && (
        <div className="help-ing-body">
          <div className="help-ing-grid">
            <div className="help-ing-section">
              <div className="help-section-label">What is it?</div>
              <p className="help-section-text">{ing.whatItIs}</p>
            </div>
            <div className="help-ing-section">
              <div className="help-section-label">Why is it used?</div>
              <p className="help-section-text">{ing.whyUsed}</p>
            </div>
          </div>
          <div className="help-ing-grid">
            <div className="help-ing-section">
              <div className="help-section-label">Side Effects</div>
              <p className="help-section-text">{ing.sideEffects}</p>
            </div>
            <div
              className="help-ing-section help-evidence-box"
              style={{ background: riskBg, border: `1px solid ${riskColor}30` }}
            >
              <div className="help-section-label" style={{ color: riskColor }}>Evidence & Verdict</div>
              <p className="help-section-text">{ing.evidence}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [ingSearch, setIngSearch] = useState('');
  const [ingCategory, setIngCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'ingredients' | 'ratings'

  const filteredIngredients = useMemo(() => {
    let list = [...ingredientsEncyclopedia];
    if (ingCategory !== 'All') list = list.filter((i) => i.category === ingCategory);
    if (ingSearch.trim()) {
      const q = ingSearch.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    return list;
  }, [ingSearch, ingCategory]);

  return (
    <div className="help-page">
      {/* Hero */}
      <section className="help-hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Supplement Education Hub
        </div>
        <h1 className="help-hero-title">
          <span style={{ color: 'var(--text-primary)' }}>Your Complete</span>
          <br />
          <span style={{
            background: 'var(--gradient-accent)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Supplement Guide</span>
        </h1>
        <p className="help-hero-desc">
          Everything you need to know about the products you consume — from what protein powder actually is,
          to which ingredients to watch out for and why.
        </p>
      </section>

      {/* Tab Navigation */}
      <div className="help-tabs">
        {[
          { id: 'products', label: '📦 Product Types', desc: 'What each supplement does' },
          { id: 'ingredients', label: '🔬 Ingredients', desc: 'What\'s inside your supplements' },
          { id: 'ratings', label: '🛡️ Safety Ratings', desc: 'How we score products' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`help-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="help-tab-label">{tab.label}</span>
            <span className="help-tab-desc">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* ===== PRODUCT TYPES TAB ===== */}
      {activeTab === 'products' && (
        <section className="help-section" aria-label="Product types">
          <div className="help-section-header">
            <h2 className="help-section-title">Product Categories Explained</h2>
            <p className="help-section-subtitle">
              Click on any category below to expand a full explanation of what it is, what it does, and who should (or shouldn't) use it.
            </p>
          </div>
          <div className="help-cat-list">
            {productCategories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} />
            ))}
          </div>
        </section>
      )}

      {/* ===== INGREDIENTS TAB ===== */}
      {activeTab === 'ingredients' && (
        <section className="help-section" aria-label="Ingredients encyclopedia">
          <div className="help-section-header">
            <h2 className="help-section-title">Ingredients Encyclopedia</h2>
            <p className="help-section-subtitle">
              A complete breakdown of {ingredientsEncyclopedia.length} common supplement ingredients — what they are, why they're used, and any concerns.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="help-ing-controls">
            <div className="search-wrapper" style={{ maxWidth: '380px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="search"
                className="search-input"
                placeholder="Search ingredients…"
                value={ingSearch}
                onChange={(e) => setIngSearch(e.target.value)}
                aria-label="Search ingredients"
              />
              {ingSearch && (
                <button className="search-clear" onClick={() => setIngSearch('')}>✕</button>
              )}
            </div>
            <div className="filter-tabs" style={{ flexWrap: 'wrap' }}>
              {INGREDIENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`filter-tab ${ingCategory === cat ? 'active' : ''}`}
                  onClick={() => setIngCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="results-count">
              Showing <span>{filteredIngredients.length}</span> of {ingredientsEncyclopedia.length}
            </div>
          </div>

          <div className="help-ing-list">
            {filteredIngredients.length > 0 ? (
              filteredIngredients.map((ing) => (
                <IngredientCard key={ing.id} ing={ing} />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No ingredients found</div>
                <div className="empty-state-desc">Try a different search term or category</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== RATINGS TAB ===== */}
      {activeTab === 'ratings' && (
        <section className="help-section" aria-label="Safety rating guide">
          <div className="help-section-header">
            <h2 className="help-section-title">How We Rate Products</h2>
            <p className="help-section-subtitle">
              Our safety ratings are based on the ingredients inside each product — their scientific backing, regulatory status, and real-world side effect profiles.
            </p>
          </div>

          <div className="help-methodology">
            <div className="help-method-card">
              <div className="help-method-step">01</div>
              <div className="help-method-content">
                <div className="help-method-title">Ingredient Analysis</div>
                <div className="help-method-desc">Every ingredient in a product is assessed individually against peer-reviewed research, regulatory status (FDA, EFSA, FSSAI), and known side effect profiles.</div>
              </div>
            </div>
            <div className="help-method-card">
              <div className="help-method-step">02</div>
              <div className="help-method-content">
                <div className="help-method-title">Risk Classification</div>
                <div className="help-method-desc">Each ingredient is classified into Safe, Low Risk, Moderate Risk, or Harmful based on its individual profile. Harmful ingredients heavily penalize the total score.</div>
              </div>
            </div>
            <div className="help-method-card">
              <div className="help-method-step">03</div>
              <div className="help-method-content">
                <div className="help-method-title">Composite Safety Score</div>
                <div className="help-method-desc">A weighted safety score out of 100 is calculated for the whole product. Products with no artificial additives or harmful ingredients score 90+. Products with multiple concerning ingredients score lower.</div>
              </div>
            </div>
          </div>

          <div className="help-ratings-grid">
            {safetyRatingGuide.map((r) => (
              <div
                key={r.level}
                className="help-rating-card"
                style={{ background: r.bg, border: `1px solid ${r.border}` }}
              >
                <div className="help-rating-header">
                  <div
                    className="help-rating-icon"
                    style={{ color: r.color, background: `${r.color}20`, border: `2px solid ${r.color}50` }}
                  >
                    {r.icon}
                  </div>
                  <div>
                    <div className="help-rating-title" style={{ color: r.color }}>{r.title}</div>
                    <div className="help-rating-score">Score range: {r.score}</div>
                  </div>
                </div>
                <p className="help-rating-desc">{r.description}</p>
                <div className="help-rating-examples">
                  <div className="help-section-label">Example ingredients</div>
                  <div className="card-tags" style={{ marginTop: '8px' }}>
                    {r.examples.map((ex) => (
                      <span key={ex} className="card-tag" style={{ color: r.color, borderColor: `${r.color}30`, background: `${r.color}10` }}>{ex}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="help-disclaimer">
            <div className="help-disclaimer-icon">🩺</div>
            <div className="help-disclaimer-text">
              <strong>Medical Disclaimer</strong>
              <p>Safety ratings on BulkHealth are for educational purposes only and are not medical advice. Individual responses to supplements vary. Always consult a qualified healthcare professional before starting any supplement regimen, especially if you have pre-existing conditions, are pregnant, or are under 18 years of age.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
