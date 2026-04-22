// ─────────────────────────────────────────────────────────────────────────────
// BulkHealth · Radar axis score computation (Phase 3)
// All scores return 0–100
// ─────────────────────────────────────────────────────────────────────────────

const ingName = (i) => i.name.toLowerCase();

// 1. Protein Quality ──────────────────────────────────────────────────────────
// Looks for the highest-quality protein source in the ingredient list
export function proteinQualityScore(product) {
  const ings = product.ingredients;
  const hasIng = (kw) => ings.some((i) => ingName(i).includes(kw));

  if (hasIng('hydrolyz') || hasIng('hydrolised')) return 95;
  if (hasIng('isolate') || hasIng('wpi')) return 92;
  if (hasIng('egg') || hasIng('albumin')) return 88;
  if (hasIng('concentrate') || hasIng('wpc')) return 78;
  if (hasIng('casein') || hasIng('caseinate')) return 75;
  if (hasIng('pea protein')) return 70;
  if (hasIng('soy protein')) return 62;
  if (hasIng('epa') || hasIng('dha') || hasIng('omega')) return 60; // omega-3 — not protein but quality fat
  if (hasIng('creatine')) return 0;      // not a protein product
  if (hasIng('glutamine')) return 0;     // amino, not complete protein
  if (hasIng('caffeine')) return 0;      // pre-workout / fat burner

  // Mass gainers / bars with protein blend
  if (product.macros.protein >= 20) return 68;
  if (product.macros.protein >= 10) return 50;
  return 20; // supplements with negligible protein
}

// 2. Additive Load ────────────────────────────────────────────────────────────
// Higher = fewer/less severe additives (100 = perfectly clean)
export function additiveLoadScore(product) {
  let score = 100;
  const ings = product.ingredients;
  const hasIng = (kw) => ings.some((i) => ingName(i).includes(kw));

  if (hasIng('titanium dioxide') || hasIng('tio2') || hasIng('e171')) score -= 45;
  if (hasIng('fd&c') || hasIng('red 40') || hasIng('blue 1') || hasIng('artificial col')) score -= 25;
  if (hasIng('carrageenan')) score -= 20;
  if (hasIng('sucralose')) score -= 12;
  if (hasIng('acesulfame') || hasIng('ace-k')) score -= 10;
  if (hasIng('maltodextrin')) score -= 8;
  if (hasIng('soy lecithin')) score -= 5;
  if (hasIng('silicon dioxide')) score -= 3;
  if (hasIng('yohimbine')) score -= 20; // significant stimulant concern

  return Math.max(0, score);
}

// 3. Transparency ─────────────────────────────────────────────────────────────
// More disclosed ingredients = more transparent label
// Bonus for products with no proprietary blend tags
export function transparencyScore(product) {
  const count = product.ingredients.length;
  const base = Math.min(count * 9, 85);

  // Bonus: products with "transparent" or "zero additives" type tags
  const hasTransparencyTag = product.tags.some((t) =>
    ['transparent', 'zero additives', 'pure', 'unflavored', 'no proprietary blend'].some((kw) =>
      t.toLowerCase().includes(kw)
    )
  );
  const bonus = hasTransparencyTag ? 15 : 0;

  // Penalty for proprietary blends (would hide exact doses)
  const hasPropBlend = product.tags.some((t) => t.toLowerCase().includes('proprietary'));
  const penalty = hasPropBlend ? -25 : 0;

  return Math.min(100, Math.max(0, base + bonus + penalty));
}

// 4. Value ────────────────────────────────────────────────────────────────────
// Proxy: how much protein (or active content) per serving relative to category
// For non-protein products use safety score as value proxy
const VALUE_TARGETS = {
  'Protein Powder': 30,
  'Mass Gainer': 50,
  'Protein Bar': 20,
  'BCAAs': 10,
  'Pre-Workout': 0,
  'Creatine': 0,
  'Vitamins': 0,
  'Fat Burner': 0,
  'Omega-3': 0,
  'Glutamine': 5,
  'ZMA': 0,
  'Electrolytes': 0,
};

export function valueScore(product) {
  const target = VALUE_TARGETS[product.category];
  if (target > 0) {
    return Math.min(100, Math.round((product.macros.protein / target) * 100));
  }
  // For non-protein categories, use safety score as value indicator
  return product.safetyScore;
}

// 5. Side Effect Risk ─────────────────────────────────────────────────────────
// 100 = no side effect risk; 0 = all harmful
// Weighted by ingredient percentage
export function sideEffectRiskScore(product) {
  const WEIGHTS = { safe: 100, low: 72, moderate: 35, harmful: 0 };
  const ings = product.ingredients;
  if (!ings.length) return product.safetyScore;

  let totalPct = 0;
  let weightedSum = 0;
  ings.forEach((ing) => {
    const pct = ing.percentage || 0;
    totalPct += pct;
    weightedSum += (WEIGHTS[ing.risk] ?? 50) * pct;
  });
  if (totalPct === 0) return product.safetyScore;
  return Math.round(weightedSum / totalPct);
}

// Master function ─────────────────────────────────────────────────────────────
export function getRadarScores(product) {
  return [
    { label: 'Protein\nQuality',   score: proteinQualityScore(product),  desc: 'Quality of protein sources used' },
    { label: 'Additive\nLoad',     score: additiveLoadScore(product),     desc: 'Freedom from harmful additives & dyes' },
    { label: 'Label\nTransparency',score: transparencyScore(product),     desc: 'How fully ingredients are disclosed' },
    { label: 'Value',              score: valueScore(product),            desc: 'Active content per serving' },
    { label: 'Side Effect\nRisk',  score: sideEffectRiskScore(product),   desc: 'Low risk of adverse effects (100 = safest)' },
  ];
}

// Donut chart data ─────────────────────────────────────────────────────────────
export function getDonutData(product) {
  const buckets = { safe: 0, low: 0, moderate: 0, harmful: 0 };
  let total = 0;
  product.ingredients.forEach((ing) => {
    const pct = ing.percentage || 0;
    total += pct;
    if (buckets[ing.risk] !== undefined) buckets[ing.risk] += pct;
  });
  // Normalize to make sure they sum to 100
  const COLORS = {
    safe:     { color: '#10b981', label: 'Safe' },
    low:      { color: '#f59e0b', label: 'Low Risk' },
    moderate: { color: '#f97316', label: 'Moderate' },
    harmful:  { color: '#ef4444', label: 'Harmful' },
  };
  return Object.entries(buckets)
    .filter(([, v]) => v > 0)
    .map(([key, val]) => ({
      key,
      pct: total > 0 ? Math.round((val / total) * 100) : 0,
      raw: val,
      ...COLORS[key],
    }));
}

// Brand leaderboard data ───────────────────────────────────────────────────────
export function getBrandLeaderboard(products) {
  const map = {};
  products.forEach((p) => {
    if (!map[p.brand]) map[p.brand] = { brand: p.brand, scores: [], products: [] };
    map[p.brand].scores.push(p.safetyScore);
    map[p.brand].products.push(p);
  });
  return Object.values(map)
    .map(({ brand, scores, products: prods }) => ({
      brand,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      productCount: prods.length,
      products: prods,
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
}

// Homepage stats ───────────────────────────────────────────────────────────────
export function getHomepageStats(products) {
  // 1. Risky ingredient frequency
  const ingCount = {};
  products.forEach((p) =>
    p.ingredients.forEach((i) => {
      if (i.risk === 'moderate' || i.risk === 'harmful') {
        const key = i.name.split('(')[0].trim(); // strip parenthetical
        ingCount[key] = (ingCount[key] || 0) + 1;
      }
    })
  );
  const topRiskyIngredients = Object.entries(ingCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // 2. Category averages
  const catMap = {};
  products.forEach((p) => {
    if (!catMap[p.category]) catMap[p.category] = [];
    catMap[p.category].push(p.safetyScore);
  });
  const categoryAverages = Object.entries(catMap)
    .map(([cat, scores]) => ({
      category: cat,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // 3. Overall stats
  const totalIngredients = products.reduce((s, p) => s + p.ingredients.length, 0);
  const safeCount = products.filter((p) => p.overallRating === 'safe').length;
  const avgScore = Math.round(products.reduce((s, p) => s + p.safetyScore, 0) / products.length);

  return { topRiskyIngredients, categoryAverages, totalIngredients, safeCount, avgScore };
}
