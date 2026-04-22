import { useMemo } from 'react';
import { products } from '../data/products';
import { getHomepageStats } from '../utils/scoring';

const CATEGORY_EMOJI = {
  'Protein Powder': '🥛', 'Pre-Workout': '⚡', 'Creatine': '💎',
  'BCAAs': '🔬', 'Mass Gainer': '💪', 'Protein Bar': '🍫',
  'Vitamins': '💊', 'Fat Burner': '🔥', 'Omega-3': '🐟',
  'Glutamine': '🧬', 'ZMA': '🌙', 'Electrolytes': '💧',
};

const getRiskColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

export default function HomepageStats() {
  const stats = useMemo(() => getHomepageStats(products), []);
  const maxCatScore = Math.max(...stats.categoryAverages.map((c) => c.avgScore));

  return (
    <section className="stats-section" aria-label="Database statistics">
      {/* Top stats bar */}
      <div className="stats-top-bar">
        <div className="stats-top-item">
          <div className="stats-top-val">{products.length}</div>
          <div className="stats-top-label">Products Analyzed</div>
        </div>
        <div className="stats-top-divider" />
        <div className="stats-top-item">
          <div className="stats-top-val">{stats.totalIngredients}</div>
          <div className="stats-top-label">Ingredients Examined</div>
        </div>
        <div className="stats-top-divider" />
        <div className="stats-top-item">
          <div className="stats-top-val" style={{ color: '#10b981' }}>{stats.avgScore}</div>
          <div className="stats-top-label">Avg Safety Score</div>
        </div>
        <div className="stats-top-divider" />
        <div className="stats-top-item">
          <div className="stats-top-val" style={{ color: '#10b981' }}>
            {Math.round((stats.safeCount / products.length) * 100)}%
          </div>
          <div className="stats-top-label">Products Rated Safe</div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="stats-grid">
        {/* Category averages */}
        <div className="stats-card">
          <div className="stats-card-title">📊 Safety by Category</div>
          <div className="stats-cat-list">
            {stats.categoryAverages.map((cat) => (
              <div key={cat.category} className="stats-cat-row">
                <div className="stats-cat-name">
                  <span className="stats-cat-emoji">{CATEGORY_EMOJI[cat.category] || '💊'}</span>
                  <span>{cat.category}</span>
                  <span className="stats-cat-count">({cat.count})</span>
                </div>
                <div className="stats-cat-bar-wrap">
                  <div className="stats-cat-bar-track">
                    <div
                      className="stats-cat-bar-fill"
                      style={{
                        width: `${(cat.avgScore / 100) * 100}%`,
                        background: getRiskColor(cat.avgScore),
                      }}
                    />
                  </div>
                  <span
                    className="stats-cat-score"
                    style={{ color: getRiskColor(cat.avgScore) }}
                  >
                    {cat.avgScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most common risky ingredients */}
        <div className="stats-card">
          <div className="stats-card-title">⚠️ Most Common Risky Ingredients</div>
          <p className="stats-card-sub">Moderate or harmful ingredients found most frequently across all products</p>
          <div className="stats-risky-list">
            {stats.topRiskyIngredients.map((ing, i) => (
              <div key={ing.name} className="stats-risky-row">
                <span className="stats-risky-rank">#{i + 1}</span>
                <span className="stats-risky-name">{ing.name}</span>
                <span className="stats-risky-count">
                  {ing.count} product{ing.count > 1 ? 's' : ''}
                </span>
                <div className="stats-risky-bar-track">
                  <div
                    className="stats-risky-bar-fill"
                    style={{
                      width: `${(ing.count / products.length) * 100}%`,
                      background: ing.count >= 8 ? '#ef4444' : ing.count >= 5 ? '#f97316' : '#f59e0b',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="stats-insight">
            💡 <strong>Insight:</strong> {stats.topRiskyIngredients[0]?.name} is the most widespread
            concern — found in {stats.topRiskyIngredients[0]?.count} of {products.length} products.
          </div>
        </div>
      </div>
    </section>
  );
}
