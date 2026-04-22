import { useMemo } from 'react';
import { ratingConfig } from '../data/products';

const CATEGORY_EMOJI = {
  'Protein Powder': '🥛', 'Pre-Workout': '⚡', 'Creatine': '💎',
  'BCAAs': '🔬', 'Mass Gainer': '💪', 'Protein Bar': '🍫',
  'Vitamins': '💊', 'Fat Burner': '🔥', 'Omega-3': '🐟',
  'Glutamine': '🧬', 'ZMA': '🌙', 'Electrolytes': '💧',
};

const extractCaffeine = (product) => {
  for (const ing of product.ingredients) {
    if (ing.name.toLowerCase().includes('caffeine')) {
      const m = ing.name.match(/(\d+)\s*mg/i);
      if (m) return parseInt(m[1]);
    }
  }
  return 0;
};

const hasIngredient = (product, keyword) =>
  product.ingredients.some((i) => i.name.toLowerCase().includes(keyword.toLowerCase()));

export default function StackPanel({ stackProducts, onRemove, onClear, isOpen, onToggle }) {
  const totals = useMemo(() => ({
    protein: stackProducts.reduce((s, p) => s + p.macros.protein, 0),
    carbs: stackProducts.reduce((s, p) => s + p.macros.carbs, 0),
    fat: stackProducts.reduce((s, p) => s + p.macros.fat, 0),
    calories: stackProducts.reduce((s, p) => s + p.macros.calories, 0),
    caffeine: stackProducts.reduce((s, p) => s + extractCaffeine(p), 0),
  }), [stackProducts]);

  const riskFlags = useMemo(() => {
    const flags = [];
    if (stackProducts.length < 1) return flags;

    // Caffeine
    if (totals.caffeine > 400) {
      flags.push({ level: 'danger', msg: `Total caffeine ${totals.caffeine}mg — exceeds safe daily limit (400mg). Risk of anxiety, palpitations.` });
    } else if (totals.caffeine > 250) {
      flags.push({ level: 'warn', msg: `Total caffeine ${totals.caffeine}mg — approaching safe limit. Avoid other caffeine sources.` });
    }

    // Yohimbine + Caffeine
    const yohimbineProducts = stackProducts.filter((p) => hasIngredient(p, 'yohimbine'));
    if (yohimbineProducts.length > 0 && totals.caffeine > 0) {
      flags.push({ level: 'danger', msg: 'Yohimbine + Caffeine combination — elevated risk of anxiety, hypertension, and cardiac events.' });
    }

    // Multiple pre-workouts
    const preworkouts = stackProducts.filter((p) => p.category === 'Pre-Workout');
    if (preworkouts.length >= 2) {
      flags.push({ level: 'danger', msg: 'Multiple pre-workouts in stack — severe stimulant stacking risk. Never combine.' });
    }

    // Multiple fat burners
    const fatBurners = stackProducts.filter((p) => p.category === 'Fat Burner');
    if (fatBurners.length >= 2) {
      flags.push({ level: 'warn', msg: 'Multiple fat burners — high likelihood of overlapping stimulants and thermogenics.' });
    }

    // High sweetener exposure
    const sucraloseProds = stackProducts.filter((p) => hasIngredient(p, 'sucralose'));
    if (sucraloseProds.length >= 3) {
      flags.push({ level: 'warn', msg: `${sucraloseProds.length} products contain Sucralose — high daily artificial sweetener exposure.` });
    }

    // Duplicate categories (other than safe stackable ones)
    const unsafeToStack = ['Pre-Workout', 'Fat Burner'];
    unsafeToStack.forEach((cat) => {
      const count = stackProducts.filter((p) => p.category === cat).length;
      if (count >= 2) return; // already caught above
    });

    // ZMA at night + Pre-workout (stimulant) warning
    const hasZMA = stackProducts.some((p) => p.category === 'ZMA');
    const hasPre = stackProducts.some((p) => p.category === 'Pre-Workout');
    if (hasZMA && hasPre) {
      flags.push({ level: 'info', msg: 'ZMA and Pre-Workout in same stack: take ZMA before bed, pre-workout before training — do not take together.' });
    }

    // Creatine already in a pre-workout + standalone creatine
    const creatineAlreadyInPre = stackProducts
      .filter((p) => p.category === 'Pre-Workout')
      .some((p) => hasIngredient(p, 'creatine'));
    const hasStandaloneCreatine = stackProducts.some((p) => p.category === 'Creatine');
    if (creatineAlreadyInPre && hasStandaloneCreatine) {
      flags.push({ level: 'info', msg: 'Your pre-workout already contains creatine. Standalone creatine may result in a double dose — check total daily intake.' });
    }

    return flags;
  }, [stackProducts, totals]);

  if (stackProducts.length === 0 && !isOpen) return null;

  const n = stackProducts.length;

  return (
    <div className={`stack-panel ${isOpen ? 'stack-panel-open' : 'stack-panel-closed'}`}>
      {/* Toggle pill */}
      <button
        className="stack-toggle-btn"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="Toggle stack panel"
      >
        <span className="stack-toggle-icon">🧪</span>
        <span className="stack-toggle-label">My Stack</span>
        {n > 0 && <span className="stack-count-badge">{n}</span>}
        {riskFlags.some((f) => f.level === 'danger') && (
          <span className="stack-danger-dot" title="Stack has risk flags" />
        )}
        <span className="stack-toggle-chevron">{isOpen ? '▾' : '▴'}</span>
      </button>

      {/* Drawer content */}
      {isOpen && (
        <div className="stack-drawer">
          <div className="stack-drawer-header">
            <span className="stack-drawer-title">Your Supplement Stack</span>
            {n > 0 && (
              <button className="stack-clear-btn" onClick={onClear} aria-label="Clear all stack items">
                Clear all
              </button>
            )}
          </div>

          {n === 0 ? (
            <div className="stack-empty">
              <div className="stack-empty-icon">🧪</div>
              <p>No supplements in your stack yet.</p>
              <p className="stack-empty-hint">Click "Add to Stack" on any product card.</p>
            </div>
          ) : (
            <>
              {/* Product list */}
              <div className="stack-products-list">
                {stackProducts.map((p) => {
                  const caffeine = extractCaffeine(p);
                  const rating = ratingConfig[p.overallRating];
                  return (
                    <div key={p.id} className="stack-product-row">
                      <div className="stack-product-emoji">
                        {CATEGORY_EMOJI[p.category] || '💊'}
                      </div>
                      <div className="stack-product-info">
                        <div className="stack-product-name">{p.name}</div>
                        <div className="stack-product-meta">
                          <span style={{ color: rating.color }}>{rating.label}</span>
                          {caffeine > 0 && (
                            <span className="stack-caffeine-chip">☕ {caffeine}mg</span>
                          )}
                          <span>{p.macros.protein}g protein</span>
                        </div>
                      </div>
                      <button
                        className="stack-product-remove"
                        onClick={() => onRemove(p.id)}
                        aria-label={`Remove ${p.name} from stack`}
                      >✕</button>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="stack-totals">
                <div className="stack-totals-title">Stack Totals</div>
                <div className="stack-totals-grid">
                  {[
                    { label: 'Calories', val: totals.calories, unit: 'kcal', color: 'var(--text-primary)' },
                    { label: 'Protein', val: totals.protein, unit: 'g', color: '#10b981' },
                    { label: 'Carbs', val: totals.carbs, unit: 'g', color: '#f59e0b' },
                    { label: 'Fat', val: totals.fat, unit: 'g', color: '#94a3b8' },
                    {
                      label: 'Caffeine',
                      val: totals.caffeine,
                      unit: 'mg',
                      color: totals.caffeine > 400 ? '#ef4444' : totals.caffeine > 250 ? '#f97316' : '#06b6d4',
                    },
                  ].map((t) => (
                    <div key={t.label} className="stack-total-item">
                      <div className="stack-total-val" style={{ color: t.color }}>
                        {t.val}<span className="stack-total-unit">{t.unit}</span>
                      </div>
                      <div className="stack-total-label">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Flags */}
              {riskFlags.length > 0 && (
                <div className="stack-flags">
                  <div className="stack-flags-title">⚠ Stacking Warnings</div>
                  {riskFlags.map((f, i) => (
                    <div key={i} className={`stack-flag stack-flag-${f.level}`}>
                      <span className="stack-flag-icon">
                        {f.level === 'danger' ? '🔴' : f.level === 'warn' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span className="stack-flag-msg">{f.msg}</span>
                    </div>
                  ))}
                </div>
              )}

              {riskFlags.length === 0 && (
                <div className="stack-flags-ok">
                  <span>✅</span> No stacking conflicts detected
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
