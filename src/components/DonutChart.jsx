import { useMemo, useEffect, useState } from 'react';

/**
 * Builds a correct closed SVG path for one donut-ring segment.
 *
 * A donut segment has four edges:
 *   1. Outer arc  (clockwise, sweep-flag = 1)
 *   2. Line from outer-end → inner-end
 *   3. Inner arc  (counter-clockwise, sweep-flag = 0)  ← was WRONG before
 *   4. Z closes back to outer-start
 */
function donutSegmentPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const toRad = (deg) => ((deg - 90) * Math.PI) / 180;

  const cos = (deg) => Math.cos(toRad(deg));
  const sin = (deg) => Math.sin(toRad(deg));

  const ox1 = cx + rOuter * cos(startDeg);
  const oy1 = cy + rOuter * sin(startDeg);
  const ox2 = cx + rOuter * cos(endDeg);
  const oy2 = cy + rOuter * sin(endDeg);
  const ix1 = cx + rInner * cos(startDeg);
  const iy1 = cy + rInner * sin(startDeg);
  const ix2 = cx + rInner * cos(endDeg);
  const iy2 = cy + rInner * sin(endDeg);

  const large = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${ox1} ${oy1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${ox2} ${oy2}`, // outer arc CW
    `L ${ix2} ${iy2}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${ix1} ${iy1}`, // inner arc CCW ← fix
    'Z',
  ].join(' ');
}

export default function DonutChart({ data, totalIngredients }) {
  const [animated, setAnimated] = useState(false);
  const [hovered, setHovered] = useState(null);
  const cx = 100, cy = 100, outerR = 75, innerR = 48;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  const segments = useMemo(() => {
    let angle = 0;
    return data.map((d) => {
      const sweep = (d.pct / 100) * 360;
      const start = angle;
      angle += sweep;
      return { ...d, start, end: angle };
    });
  }, [data]);

  if (!data.length) return null;

  const GAP = 1.5; // degrees gap between segments

  return (
    <div className="donut-wrapper">
      <svg viewBox="0 0 200 200" className="donut-svg" aria-label="Risk distribution donut chart" role="img">
        {/* Background ring */}
        <circle
          cx={cx} cy={cy}
          r={(outerR + innerR) / 2}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={outerR - innerR}
        />

        {/* Segments */}
        {segments.map((seg, i) => {
          if (seg.end - seg.start < 0.5) return null;
          const isHov = hovered === i;
          const rO = isHov ? outerR + 4 : outerR;
          const rI = isHov ? innerR - 2 : innerR;
          const s = seg.start + GAP / 2;
          const e = seg.end   - GAP / 2;

          return (
            <path
              key={i}
              d={donutSegmentPath(cx, cy, rO, rI, s, e)}
              fill={seg.color}
              opacity={animated ? (isHov ? 1 : 0.88) : 0}
              style={{ transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.15s ease`, transformOrigin: `${cx}px ${cy}px`, transform: isHov ? 'scale(1.04)' : 'scale(1)' }}
              className="donut-segment"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`${seg.label}: ${seg.pct}%`}
            />
          );
        })}

        {/* Center label */}
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="20" fontWeight="800" fill="white" fontFamily="Outfit, sans-serif">
          {totalIngredients}
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,0.45)" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="0.5">
          INGREDIENTS
        </text>

        {/* Hover tooltip */}
        {hovered !== null && segments[hovered] && (
          <>
            <rect x={cx - 46} y={cy + 18} width="92" height="30" rx="5" fill="#1e1e2e" stroke={segments[hovered].color} strokeWidth="1" opacity="0.95" />
            <text x={cx} y={cy + 35} textAnchor="middle" fontSize="11" fontWeight="700" fill={segments[hovered].color} fontFamily="Inter, sans-serif">
              {segments[hovered].label}: {segments[hovered].pct}%
            </text>
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="donut-legend">
        {data.map((d) => (
          <div key={d.key} className="donut-legend-item">
            <span className="donut-legend-swatch" style={{ background: d.color }} />
            <span className="donut-legend-label">{d.label}</span>
            <span className="donut-legend-pct" style={{ color: d.color }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
