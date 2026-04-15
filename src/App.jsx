import { useState, useMemo } from 'react';
import { products, categories, ratingConfig } from './data/products';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import HelpPage from './pages/HelpPage';

export default function App() {
  const [page, setPage] = useState('home'); // 'home' | 'help'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'safety-asc') list.sort((a, b) => a.safetyScore - b.safetyScore);
    else if (sortBy === 'safety-desc') list.sort((a, b) => b.safetyScore - a.safetyScore);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [searchQuery, activeCategory, sortBy]);

  const statCounts = useMemo(() => {
    const counts = { safe: 0, low: 0, moderate: 0, harmful: 0 };
    products.forEach((p) => { if (counts[p.overallRating] !== undefined) counts[p.overallRating]++; });
    return counts;
  }, []);

  return (
    <div className="app-container">
      {/* ===== NAVBAR ===== */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">
          <button
            className="navbar-logo"
            style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none' }}
            onClick={() => setPage('home')}
            aria-label="BulkHealth Home"
          >
            <div className="navbar-logo-icon" aria-hidden="true">💪</div>
            <div>
              <div className="navbar-logo-text">BulkHealth</div>
              <div className="navbar-logo-sub">Supplement Safety Database</div>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="navbar-stats" aria-label="Database statistics">
              <div className="navbar-stat">
                <span className="navbar-stat-val">{products.length}</span>
                <span className="navbar-stat-label">Products</span>
              </div>
              <div className="navbar-stat">
                <span className="navbar-stat-val" style={{ color: 'var(--neon-green)' }}>{statCounts.safe}</span>
                <span className="navbar-stat-label">Safe</span>
              </div>
              <div className="navbar-stat">
                <span className="navbar-stat-val" style={{ color: 'var(--neon-orange)' }}>{statCounts.moderate}</span>
                <span className="navbar-stat-label">Moderate</span>
              </div>
            </div>

            <button
              className={`navbar-help-btn ${page === 'help' ? 'active' : ''}`}
              onClick={() => setPage(page === 'help' ? 'home' : 'help')}
              aria-label="Help page"
            >
              <span>📖</span>
              <span>{page === 'help' ? '← Back' : 'Help Guide'}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="content-wrapper">
        {page === 'help' ? (
          <HelpPage />
        ) : (
          <>
            {/* ===== HERO ===== */}
            <section className="hero" aria-labelledby="hero-title">
              <div className="hero-badge">
                <span className="hero-badge-dot" aria-hidden="true" />
                Ingredient Transparency · India's Supplements Rated
              </div>

              <h1 className="hero-title" id="hero-title">
                <span className="hero-title-line1">Know What's Inside</span>
                <br />
                <span className="hero-title-line2">Your Supplements</span>
              </h1>

              <p className="hero-description">
                Every protein powder and workout supplement analyzed for ingredient safety.
                See exactly what you're putting in your body — ranked from safe to harmful.
                Popular Indian brands, fully broken down.
              </p>

              <div className="hero-rating-legend" role="list" aria-label="Safety rating legend">
                {Object.entries(ratingConfig).map(([key, val]) => (
                  <div key={key} className="legend-item" role="listitem">
                    <span className="legend-dot" style={{ background: val.color }} aria-hidden="true" />
                    <span>
                      <strong style={{ color: val.color }}>{val.label}</strong>
                      {' '}— {val.description}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ===== CONTROLS ===== */}
            <div className="controls-bar" role="search">
              <div className="search-wrapper">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                  id="product-search"
                  type="search"
                  className="search-input"
                  placeholder="Search products, brands, ingredients…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search supplements"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">✕</button>
                )}
              </div>

              <div className="filter-tabs" role="group" aria-label="Category filter">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`filter-tab ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                    aria-pressed={activeCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <label htmlFor="sort-select" style={{ display: 'none' }}>Sort by</label>
              <select
                id="sort-select"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
              >
                <option value="default">Default Order</option>
                <option value="safety-desc">Safest First</option>
                <option value="safety-asc">Riskiest First</option>
                <option value="name">Name A–Z</option>
              </select>

              <div className="results-count" aria-live="polite">
                Showing <span>{filtered.length}</span> of {products.length} products
              </div>
            </div>

            {/* ===== PRODUCT GRID ===== */}
            {filtered.length > 0 ? (
              <section className="product-grid" aria-label="Supplement products">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} onClick={setSelectedProduct} />
                ))}
              </section>
            ) : (
              <div className="empty-state" role="status">
                <div className="empty-state-icon" aria-hidden="true">🔍</div>
                <h2 className="empty-state-title">No products found</h2>
                <p className="empty-state-desc">Try adjusting your search or filter to find supplements.</p>
              </div>
            )}

            {/* ===== FOOTER ===== */}
            <footer className="footer">
              <div className="footer-inner">
                <p className="footer-text">
                  <strong>BulkHealth</strong> — Safety ratings are for educational purposes only.
                  Always consult a healthcare professional before starting any supplement regimen.
                  Ingredient percentages are approximate based on label order and disclosed amounts.
                  {' '}
                  <button
                    onClick={() => setPage('help')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-tertiary)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', textDecoration: 'underline' }}
                  >
                    Read our supplement guide →
                  </button>
                </p>
              </div>
            </footer>
          </>
        )}
      </main>

      {/* ===== MODAL ===== */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
