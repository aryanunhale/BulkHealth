import { useState } from 'react';

const DEFAULT_FILTERS = {
  scoreMin: 0,
  scoreMax: 100,
  minProtein: 0,
  maxCalories: 2000,
  ingInclude: [],
  ingExclude: [],
};

export default function AdvFilterPanel({ filters, onChange, onReset, isOpen, onClose, activeCount }) {
  const [incInput, setIncInput] = useState('');
  const [excInput, setExcInput] = useState('');

  const update = (key, val) => onChange({ ...filters, [key]: val });

  const addIngTag = (type, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = type === 'include' ? 'ingInclude' : 'ingExclude';
    if (!filters[key].some((x) => x.toLowerCase() === trimmed.toLowerCase())) {
      onChange({ ...filters, [key]: [...filters[key], trimmed] });
    }
    if (type === 'include') setIncInput('');
    else setExcInput('');
  };

  const removeIngTag = (type, idx) => {
    const key = type === 'include' ? 'ingInclude' : 'ingExclude';
    onChange({ ...filters, [key]: filters[key].filter((_, i) => i !== idx) });
  };

  const handleKeyDown = (type, e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIngTag(type, type === 'include' ? incInput : excInput);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="adv-filter-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <aside className="adv-filter-panel" role="complementary" aria-label="Advanced Filters">
        <div className="adv-filter-header">
          <div className="adv-filter-title-row">
            <span className="adv-filter-title">🎛️ Advanced Filters</span>
            {activeCount > 0 && (
              <span className="adv-filter-active-count">{activeCount} active</span>
            )}
          </div>
          <div className="adv-filter-header-actions">
            {activeCount > 0 && (
              <button className="adv-filter-reset-btn" onClick={onReset}>
                Reset all
              </button>
            )}
            <button className="adv-filter-close-btn" onClick={onClose} aria-label="Close filters">✕</button>
          </div>
        </div>

        <div className="adv-filter-body">

          {/* Safety Score Range */}
          <div className="adv-filter-section">
            <div className="adv-filter-label">
              Safety Score
              <span className="adv-filter-range-display">{filters.scoreMin} – {filters.scoreMax}</span>
            </div>
            <div className="adv-filter-dual-range">
              <div className="adv-filter-range-track">
                <div
                  className="adv-filter-range-fill"
                  style={{
                    left: `${filters.scoreMin}%`,
                    width: `${filters.scoreMax - filters.scoreMin}%`,
                  }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={filters.scoreMin}
                onChange={(e) => {
                  const v = Math.min(parseInt(e.target.value), filters.scoreMax - 5);
                  update('scoreMin', v);
                }}
                className="adv-range-input adv-range-min"
                aria-label="Minimum safety score"
              />
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={filters.scoreMax}
                onChange={(e) => {
                  const v = Math.max(parseInt(e.target.value), filters.scoreMin + 5);
                  update('scoreMax', v);
                }}
                className="adv-range-input adv-range-max"
                aria-label="Maximum safety score"
              />
            </div>
            <div className="adv-filter-range-labels">
              <span>0 (Harmful)</span><span>100 (Safest)</span>
            </div>
            {/* Quick preset chips */}
            <div className="adv-filter-presets">
              {[
                { label: 'Safe only', min: 80, max: 100 },
                { label: 'Low risk+', min: 60, max: 100 },
                { label: 'Any', min: 0, max: 100 },
              ].map((p) => (
                <button
                  key={p.label}
                  className={`adv-preset-chip ${filters.scoreMin === p.min && filters.scoreMax === p.max ? 'active' : ''}`}
                  onClick={() => onChange({ ...filters, scoreMin: p.min, scoreMax: p.max })}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min Protein */}
          <div className="adv-filter-section">
            <div className="adv-filter-label">
              Minimum Protein
              <span className="adv-filter-range-display">{filters.minProtein}g+</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={filters.minProtein}
              onChange={(e) => update('minProtein', parseInt(e.target.value))}
              className="adv-range-input adv-range-single"
              aria-label="Minimum protein"
            />
            <div className="adv-filter-range-labels">
              <span>0g</span><span>60g</span>
            </div>
          </div>

          {/* Max Calories */}
          <div className="adv-filter-section">
            <div className="adv-filter-label">
              Maximum Calories
              <span className="adv-filter-range-display">
                {filters.maxCalories >= 2000 ? 'Any' : `≤ ${filters.maxCalories} kcal`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={filters.maxCalories}
              onChange={(e) => update('maxCalories', parseInt(e.target.value))}
              className="adv-range-input adv-range-single"
              aria-label="Maximum calories"
            />
            <div className="adv-filter-range-labels">
              <span>0 kcal</span><span>No limit</span>
            </div>
          </div>

          {/* Ingredient Must Include */}
          <div className="adv-filter-section">
            <div className="adv-filter-label">
              ✅ Must Contain Ingredient
            </div>
            <div className="adv-filter-tag-input-row">
              <input
                type="text"
                className="adv-tag-input"
                placeholder="e.g. Creatine, EPA…"
                value={incInput}
                onChange={(e) => setIncInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown('include', e)}
                aria-label="Add required ingredient"
              />
              <button
                className="adv-tag-add-btn adv-tag-add-include"
                onClick={() => addIngTag('include', incInput)}
                aria-label="Add include ingredient"
              >Add</button>
            </div>
            <div className="adv-tag-list">
              {filters.ingInclude.map((tag, i) => (
                <span key={i} className="adv-tag adv-tag-include">
                  {tag}
                  <button onClick={() => removeIngTag('include', i)} aria-label={`Remove ${tag}`}>✕</button>
                </span>
              ))}
            </div>
            <p className="adv-filter-hint">Shows only products that contain this ingredient.</p>
          </div>

          {/* Ingredient Must Exclude */}
          <div className="adv-filter-section">
            <div className="adv-filter-label">
              ❌ Must Not Contain Ingredient
            </div>
            <div className="adv-filter-tag-input-row">
              <input
                type="text"
                className="adv-tag-input"
                placeholder="e.g. Sucralose, Yohimbine…"
                value={excInput}
                onChange={(e) => setExcInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown('exclude', e)}
                aria-label="Add excluded ingredient"
              />
              <button
                className="adv-tag-add-btn adv-tag-add-exclude"
                onClick={() => addIngTag('exclude', excInput)}
                aria-label="Add exclude ingredient"
              >Add</button>
            </div>
            <div className="adv-tag-list">
              {filters.ingExclude.map((tag, i) => (
                <span key={i} className="adv-tag adv-tag-exclude">
                  {tag}
                  <button onClick={() => removeIngTag('exclude', i)} aria-label={`Remove ${tag}`}>✕</button>
                </span>
              ))}
            </div>
            <p className="adv-filter-hint">Hides products containing this ingredient.</p>
          </div>

        </div>

        {activeCount > 0 && (
          <div className="adv-filter-footer">
            <button className="adv-filter-reset-full-btn" onClick={onReset}>
              🗑️ Reset All Filters
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export { DEFAULT_FILTERS };
