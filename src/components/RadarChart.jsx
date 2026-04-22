import { useMemo, useState } from 'react';

const AXIS_DESCRIPTIONS = [
  'Quality of protein sources',
  'Freedom from harmful additives & dyes',
  'How fully ingredients are disclosed',
  'Active content per serving',
  'Low risk of adverse side effects',
];

// Convert polar → cartesian
function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function polygonPoints(cx, cy, r, scores, maxScore = 100) {
  const n = scores.length;
  return scores
    .map((s, i) => {
      const angle = (360 / n) * i;
      const pt = polar(cx, cy, (s / maxScore) * r, angle);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
}

function gridPoints(cx, cy, r, n, level) {
  const fraction = level / 4;
  return Array.from({ length: n }, (_, i) => {
    const angle = (360 / n) * i;
    const pt = polar(cx, cy, r * fraction, angle);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

export default function RadarChart({ scores }) {
  const [tooltip, setTooltip] = useState(null);
  const cx = 160, cy = 160, r = 120;
  const n = scores.length;

  const scoreValues = useMemo(() => scores.map((s) => s.score), [scores]);
  const polyPts = useMemo(() => polygonPoints(cx, cy, r, scoreValues), [scoreValues]);

  const axisPoints = useMemo(() =>
    scores.map((s, i) => {
      const angle = (360 / n) * i;
      const tip = polar(cx, cy, r, angle);
      const labelPt = polar(cx, cy, r + 28, angle);
      return { tip, labelPt, ...s };
    }),
  [scores, n]);

  const getRiskColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const fillColor = useMemo(() => {
    const avg = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
    return getRiskColor(avg);
  }, [scoreValues]);

  return (
    <div className="radar-wrapper">
      <svg
        viewBox="0 0 320 320"
        className="radar-svg"
        aria-label="Product radar chart"
        role="img"
      >
        {/* Grid rings */}
        {[1, 2, 3, 4].map((level) => (
          <polygon
            key={level}
            points={gridPoints(cx, cy, r, n, level)}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {axisPoints.map((ax, i) => (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={ax.tip.x} y2={ax.tip.y}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        ))}

        {/* Score polygon */}
        <polygon
          points={polyPts}
          fill={`${fillColor}30`}
          stroke={fillColor}
          strokeWidth="2"
          strokeLinejoin="round"
          className="radar-polygon"
        />

        {/* Score dots */}
        {axisPoints.map((ax, i) => {
          const angle = (360 / n) * i;
          const dot = polar(cx, cy, (ax.score / 100) * r, angle);
          return (
            <g key={i}>
              <circle
                cx={dot.x} cy={dot.y}
                r="5"
                fill={fillColor}
                stroke="#13131c"
                strokeWidth="2"
                className="radar-dot"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setTooltip({ x: dot.x, y: dot.y, ...ax })}
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          );
        })}

        {/* Axis labels */}
        {axisPoints.map((ax, i) => {
          const lines = ax.label.split('\n');
          const isLeft = ax.labelPt.x < cx - 10;
          const isRight = ax.labelPt.x > cx + 10;
          const anchor = isLeft ? 'end' : isRight ? 'start' : 'middle';
          return (
            <text
              key={i}
              x={ax.labelPt.x}
              y={ax.labelPt.y - (lines.length > 1 ? 8 : 0)}
              textAnchor={anchor}
              fontSize="10"
              fill="rgba(255,255,255,0.55)"
              fontFamily="Inter, sans-serif"
              fontWeight="600"
            >
              {lines.map((line, li) => (
                <tspan key={li} x={ax.labelPt.x} dy={li === 0 ? 0 : 13}>{line}</tspan>
              ))}
            </text>
          );
        })}

        {/* Center score */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="20" fontWeight="800" fill="white" fontFamily="Outfit, sans-serif">
          {Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="1">
          AVG
        </text>

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x < cx ? tooltip.x - 115 : tooltip.x + 8}
              y={tooltip.y - 26}
              width="108"
              height="46"
              rx="6"
              fill="#1e1e2e"
              stroke="rgba(124,58,237,0.4)"
              strokeWidth="1"
            />
            <text
              x={tooltip.x < cx ? tooltip.x - 62 : tooltip.x + 62}
              y={tooltip.y - 10}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="white"
              fontFamily="Inter, sans-serif"
            >
              {tooltip.label.replace('\n', ' ')}: {tooltip.score}
            </text>
            <text
              x={tooltip.x < cx ? tooltip.x - 62 : tooltip.x + 62}
              y={tooltip.y + 6}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(255,255,255,0.5)"
              fontFamily="Inter, sans-serif"
            >
              {tooltip.desc}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="radar-legend">
        {scores.map((s) => (
          <div key={s.label} className="radar-legend-item">
            <span
              className="radar-legend-dot"
              style={{ background: getRiskColor(s.score) }}
            />
            <span className="radar-legend-label">{s.label.replace('\n', ' ')}</span>
            <span className="radar-legend-score" style={{ color: getRiskColor(s.score) }}>
              {s.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
