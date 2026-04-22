import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { products, categories, ratingConfig } from './data/products';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CompareModal from './components/CompareModal';
import StackPanel from './components/StackPanel';
import AdvFilterPanel, { DEFAULT_FILTERS } from './components/AdvFilterPanel';
import HomepageStats from './components/HomepageStats';
import HelpPage from './pages/HelpPage';
import BrandsPage from './pages/BrandsPage';

const SAVED_TAB = '⭐ Saved';
const ALL_CATEGORIES = [SAVED_TAB, ...categories];

// ── URL helpers ───────────────────────────────────────────────
function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    category: p.get('category') || 'All',
    sort: p.get('sort') || 'default',
    search: p.get('q') || '',
  };
}

function pushUrlParams(category, sort, search) {
  const p = new URLSearchParams();
  if (category && category !== 'All' && category !== SAVED_TAB) p.set('category', category);
  if (sort && sort !== 'default') p.set('sort', sort);
  if (search) p.set('q', search);
  const qs = p.toString();
  window.history.pushState(null, '', qs ? `?${qs}` : window.location.pathname);
}

export default function App() {
  const initialParams = getUrlParams();
  // ─── Core UI state ────────────────────────────────────────────
  const [page, setPage] = useState('home');
  const [pageTransKey, setPageTransKey] = useState(0); // triggers transition
  const [searchQuery, setSearchQuery] = useState(initialParams.search);
  const [activeCategory, setActiveCategory] = useState(initialParams.category);
  const [sortBy, setSortBy] = useState(initialParams.sort);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterKey, setFilterKey] = useState(0); // increments to re-trigger card stagger
  const [touchStart, setTouchStart] = useState(0); // for swipe-to-dismiss

  // ─── URL sync: write  ──────────────────────────────────────────
  useEffect(() => {
    pushUrlParams(activeCategory, sortBy, searchQuery);
    setFilterKey((k) => k + 1); // trigger stagger re-animation
  }, [activeCategory, sortBy, searchQuery]);

  // ─── URL sync: read back on browser back/forward ───────────────
  useEffect(() => {
    const handler = () => {
      const p = getUrlParams();
      setActiveCategory(p.category);
      setSortBy(p.sort);
      setSearchQuery(p.search);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // ─── Page navigation with transition ──────────────────────────
  const navigateTo = useCallback((newPage) => {
    setPageTransKey((k) => k + 1);
    setPage(newPage);
  }, []);

  // ─── Phase 2: Bookmarks (localStorage-persisted) ──────────────
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bh-bookmarks') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('bh-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = useCallback((id) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // ─── Phase 2: Compare ─────────────────────────────────────────
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = useCallback((id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // cap at 3
      return [...prev, id];
    });
  }, []);

  const removeFromCompare = useCallback((id) => {
    setCompareIds((prev) => {
      const next = prev.filter((x) => x !== id);
      if (next.length === 0) setShowCompare(false);
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    setShowCompare(false);
  }, []);

  // ─── Phase 2: Stack ───────────────────────────────────────────
  const [stackIds, setStackIds] = useState([]);
  const [showStack, setShowStack] = useState(false);

  const toggleStack = useCallback((id) => {
    setStackIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // ─── Phase 2: Advanced Filters ────────────────────────────────
  const [advFilters, setAdvFilters] = useState(DEFAULT_FILTERS);
  const [showAdvFilters, setShowAdvFilters] = useState(false);

  const activeAdvFilterCount = useMemo(() => {
    let c = 0;
    if (advFilters.scoreMin > 0 || advFilters.scoreMax < 100) c++;
    if (advFilters.minProtein > 0) c++;
    if (advFilters.maxCalories < 2000) c++;
    c += advFilters.ingInclude.length;
    c += advFilters.ingExclude.length;
    return c;
  }, [advFilters]);

  // ─── Derived data ─────────────────────────────────────────────
  const compareProducts = useMemo(
    () => products.filter((p) => compareIds.includes(p.id)),
    [compareIds]
  );

  const stackProducts = useMemo(
    () => products.filter((p) => stackIds.includes(p.id)),
    [stackIds]
  );

  const filtered = useMemo(() => {
    let list = [...products];

    // Saved tab
    if (activeCategory === SAVED_TAB) {
      list = list.filter((p) => bookmarks.includes(p.id));
    } else if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory);
    }

    // Text search
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

    // Advanced filters
    list = list.filter((p) => {
      if (p.safetyScore < advFilters.scoreMin || p.safetyScore > advFilters.scoreMax) return false;
      if (p.macros.protein < advFilters.minProtein) return false;
      if (advFilters.maxCalories < 2000 && p.macros.calories > advFilters.maxCalories) return false;
      if (advFilters.ingInclude.length > 0) {
        const names = p.ingredients.map((i) => i.name.toLowerCase());
        if (!advFilters.ingInclude.every((inc) => names.some((n) => n.includes(inc.toLowerCase())))) return false;
      }
      if (advFilters.ingExclude.length > 0) {
        const names = p.ingredients.map((i) => i.name.toLowerCase());
        if (advFilters.ingExclude.some((exc) => names.some((n) => n.includes(exc.toLowerCase())))) return false;
      }
      return true;
    });

    if (sortBy === 'safety-asc') list.sort((a, b) => a.safetyScore - b.safetyScore);
    else if (sortBy === 'safety-desc') list.sort((a, b) => b.safetyScore - a.safetyScore);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [searchQuery, activeCategory, sortBy, bookmarks, advFilters]);

  const statCounts = useMemo(() => {
    const counts = { safe: 0, low: 0, moderate: 0, harmful: 0 };
    products.forEach((p) => { if (counts[p.overallRating] !== undefined) counts[p.overallRating]++; });
    return counts;
  }, []);

  // Active filter chips for the indicator bar
  const filterChips = useMemo(() => {
    const chips = [];
    if (advFilters.scoreMin > 0 || advFilters.scoreMax < 100)
      chips.push({ label: `Score ${advFilters.scoreMin}–${advFilters.scoreMax}`, key: 'score' });
    if (advFilters.minProtein > 0)
      chips.push({ label: `Min ${advFilters.minProtein}g protein`, key: 'prot' });
    if (advFilters.maxCalories < 2000)
      chips.push({ label: `Max ${advFilters.maxCalories} kcal`, key: 'cal' });
    advFilters.ingInclude.forEach((t, i) => chips.push({ label: `✅ ${t}`, key: `inc-${i}` }));
    advFilters.ingExclude.forEach((t, i) => chips.push({ label: `❌ ${t}`, key: `exc-${i}` }));
    return chips;
  }, [advFilters]);

  return (
    <div className="app-container">
      {/* ===== NAVBAR ===== */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">
          <button
            className="navbar-logo"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setPage('home')}
            aria-label="BulkHealth Home"
          >
            <div className="navbar-logo-icon" aria-hidden="true">💪</div>
            <div>
              <div className="navbar-logo-text">BulkHealth</div>
              <div className="navbar-logo-sub">Supplement Safety Database</div>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

            {/* Phase 2 navbar actions */}
            <div className="navbar-p2-actions">
              {/* Stack button */}
              <button
                className={`navbar-p2-btn ${showStack ? 'active' : ''}`}
                onClick={() => { setShowStack((v) => !v); setShowAdvFilters(false); }}
                aria-label="Toggle stack panel"
                aria-expanded={showStack}
              >
                🧪
                {stackIds.length > 0 && (
                  <span className="navbar-p2-badge">{stackIds.length}</span>
                )}
              </button>

              {/* Compare button */}
              {compareIds.length > 0 && (
                <button
                  className={`navbar-p2-btn ${showCompare ? 'active' : ''}`}
                  onClick={() => setShowCompare((v) => !v)}
                  aria-label="Open comparison"
                  aria-expanded={showCompare}
                >
                  ⚖️
                  <span className="navbar-p2-badge">{compareIds.length}</span>
                </button>
              )}

              {/* Advanced filters button */}
              <button
                className={`navbar-p2-btn ${showAdvFilters ? 'active' : ''} ${activeAdvFilterCount > 0 ? 'has-filters' : ''}`}
                onClick={() => { setShowAdvFilters((v) => !v); setShowStack(false); }}
                aria-label="Advanced filters"
                aria-expanded={showAdvFilters}
              >
                🎛️
                {activeAdvFilterCount > 0 && (
                  <span className="navbar-p2-badge navbar-p2-badge-filter">{activeAdvFilterCount}</span>
                )}
              </button>
            </div>

            <button
              className={`navbar-help-btn ${page === 'help' ? 'active' : ''}`}
              onClick={() => navigateTo(page === 'help' ? 'home' : 'help')}
              aria-label="Help page"
            >
              <span>📖</span>
              <span>{page === 'help' ? '← Back' : 'Help Guide'}</span>
            </button>
            <button
              className={`navbar-help-btn ${page === 'brands' ? 'active' : ''}`}
              onClick={() => navigateTo(page === 'brands' ? 'home' : 'brands')}
              aria-label="Brand leaderboard"
            >
              <span>🏆</span>
              <span>{page === 'brands' ? '← Back' : 'Brands'}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="content-wrapper">
        <div key={pageTransKey} className="page-transition">
        {page === 'help' ? (
          <HelpPage onBack={() => navigateTo('home')} />
        ) : page === 'brands' ? (
          <BrandsPage onProductClick={setSelectedProduct} onBack={() => navigateTo('home')} />
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

            {/* ===== STATS SECTION ===== */}
            <HomepageStats />

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
                {/* Saved tab */}
                <button
                  className={`filter-tab filter-tab-saved ${activeCategory === SAVED_TAB ? 'active' : ''}`}
                  onClick={() => setActiveCategory(activeCategory === SAVED_TAB ? 'All' : SAVED_TAB)}
                  aria-pressed={activeCategory === SAVED_TAB}
                >
                  ⭐ Saved{bookmarks.length > 0 && ` (${bookmarks.length})`}
                </button>
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

            {/* Active filter chips bar */}
            {filterChips.length > 0 && (
              <div className="active-filter-chips" role="list" aria-label="Active filters">
                {filterChips.map((chip) => (
                  <span key={chip.key} className="active-filter-chip" role="listitem">
                    {chip.label}
                  </span>
                ))}
                <button
                  className="active-filter-clear-all"
                  onClick={() => setAdvFilters(DEFAULT_FILTERS)}
                  aria-label="Clear all advanced filters"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* ===== PRODUCT GRID ===== */}
            {filtered.length > 0 ? (
              <section className="product-grid" aria-label="Supplement products">
                {filtered.map((product, idx) => (
                  <ProductCard
                    key={`${filterKey}-${product.id}`}
                    product={product}
                    onClick={setSelectedProduct}
                    isBookmarked={bookmarks.includes(product.id)}
                    onBookmark={toggleBookmark}
                    inCompare={compareIds.includes(product.id)}
                    onCompare={toggleCompare}
                    compareDisabled={compareIds.length >= 3 && !compareIds.includes(product.id)}
                    inStack={stackIds.includes(product.id)}
                    onStack={toggleStack}
                    staggerIndex={idx}
                  />
                ))}
              </section>
            ) : (
              <div className="empty-state" role="status">
                <div className="empty-state-icon" aria-hidden="true">
                  {activeCategory === SAVED_TAB ? '⭐' : '🔍'}
                </div>
                <h2 className="empty-state-title">
                  {activeCategory === SAVED_TAB ? 'No saved products yet' : 'No products found'}
                </h2>
                <p className="empty-state-desc">
                  {activeCategory === SAVED_TAB
                    ? 'Tap the ❤️ heart on any product card to save it here.'
                    : 'Try adjusting your search or filters.'}
                </p>
              </div>
            )}

            {/* ===== COMPARE BOTTOM BAR ===== */}
            {compareIds.length > 0 && !showCompare && (
              <div className="compare-bar" role="status" aria-label="Compare selection">
                <div className="compare-bar-products">
                  {compareProducts.map((p) => (
                    <div key={p.id} className="compare-bar-chip">
                      <span className="compare-bar-chip-name">{p.name}</span>
                      <button
                        className="compare-bar-chip-remove"
                        onClick={() => removeFromCompare(p.id)}
                        aria-label={`Remove ${p.name} from compare`}
                      >✕</button>
                    </div>
                  ))}
                  {compareIds.length < 2 && (
                    <span className="compare-bar-hint">Add {2 - compareIds.length} more to compare</span>
                  )}
                </div>
                <div className="compare-bar-actions">
                  {compareIds.length >= 2 && (
                    <button
                      className="compare-bar-open-btn"
                      onClick={() => setShowCompare(true)}
                    >
                      ⚖️ Compare Now →
                    </button>
                  )}
                  <button className="compare-bar-clear-btn" onClick={clearCompare}>
                    Clear
                  </button>
                </div>
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
                    onClick={() => navigateTo('help')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-tertiary)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', textDecoration: 'underline' }}
                  >
                    Read our supplement guide →
                  </button>
                </p>
              </div>
            </footer>
          </>
        )}
        </div> {/* end page-transition */}
      </main>

      {/* ===== PRODUCT MODAL ===== */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSwitchProduct={(p) => setSelectedProduct(p)}
        />
      )}

      {/* ===== COMPARE MODAL ===== */}
      {showCompare && compareProducts.length >= 1 && (
        <CompareModal
          products={compareProducts}
          onRemove={removeFromCompare}
          onClose={() => setShowCompare(false)}
        />
      )}

      {/* ===== STACK PANEL ===== */}
      <StackPanel
        stackProducts={stackProducts}
        onRemove={toggleStack}
        onClear={() => setStackIds([])}
        isOpen={showStack}
        onToggle={() => setShowStack((v) => !v)}
      />

      {/* ===== ADVANCED FILTER PANEL ===== */}
      <AdvFilterPanel
        filters={advFilters}
        onChange={setAdvFilters}
        onReset={() => setAdvFilters(DEFAULT_FILTERS)}
        isOpen={showAdvFilters}
        onClose={() => setShowAdvFilters(false)}
        activeCount={activeAdvFilterCount}
      />
    </div>
  );
}
