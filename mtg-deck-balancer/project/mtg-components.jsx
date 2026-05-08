// mtg-components.jsx — shared UI primitives for MTG Deck Balancer
const { useState, useEffect } = React;

// ─── Color Identity Pips ─────────────────────────────────────────────────────
function ColorPips({ colors = [], size = 20 }) {
  const MAP = {
    W: { bg: '#ede8d0', border: '#c4a84a', text: '#3d2e0f' },
    U: { bg: '#1c4f9e', border: '#0d3577', text: '#c0d6f0' },
    B: { bg: '#221432', border: '#5c3d8a', text: '#d4b8f0' },
    R: { bg: '#b52b20', border: '#8a1c16', text: '#fcd5d0' },
    G: { bg: '#1a5c38', border: '#103d24', text: '#a5e2be' },
  };
  if (!colors.length) return <span style={{ fontSize: 12, color: 'var(--c-text3)' }}>—</span>;
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
      {colors.map(c => {
        const m = MAP[c] || MAP.W;
        return (
          <div key={c} title={c} style={{
            width: size, height: size, borderRadius: '50%',
            background: m.bg, border: `2px solid ${m.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: Math.round(size * 0.44), fontWeight: 700,
            color: m.text, fontFamily: 'Outfit, sans-serif',
            flexShrink: 0, userSelect: 'none',
            boxShadow: `0 1px 5px ${m.bg}55`,
          }}>{c}</div>
        );
      })}
    </div>
  );
}

// ─── Color Picker (toggleable) ───────────────────────────────────────────────
function ColorPicker({ selected = [], onChange, size = 26 }) {
  const ALL = ['W', 'U', 'B', 'R', 'G'];
  const MAP = {
    W: { on: '#ede8d0', border: '#c4a84a', text: '#3d2e0f', off: '#1e1a12' },
    U: { on: '#1c4f9e', border: '#0d3577', text: '#c0d6f0', off: '#0d1828' },
    B: { on: '#3d2455', border: '#5c3d8a', text: '#d4b8f0', off: '#160e20' },
    R: { on: '#b52b20', border: '#8a1c16', text: '#fcd5d0', off: '#2a1010' },
    G: { on: '#1a5c38', border: '#103d24', text: '#a5e2be', off: '#0a1e14' },
  };
  const toggle = c => onChange(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c]);
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {ALL.map(c => {
        const m = MAP[c]; const on = selected.includes(c);
        return (
          <button key={c} onClick={() => toggle(c)} style={{
            width: size, height: size, borderRadius: '50%',
            background: on ? m.on : m.off,
            border: `2px solid ${on ? m.border : 'rgba(255,255,255,0.1)'}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: Math.round(size * 0.42), fontWeight: 700,
            color: on ? m.text : 'rgba(255,255,255,0.25)',
            fontFamily: 'Outfit, sans-serif',
            transition: 'all 140ms ease', transform: on ? 'scale(1.12)' : 'scale(1)',
            flexShrink: 0,
          }}>{c}</button>
        );
      })}
    </div>
  );
}

// ─── Mana Curve ──────────────────────────────────────────────────────────────
function ManaCurve({ curve = [], compact = false }) {
  const max = Math.max(...curve, 1);
  const barH = compact ? 28 : 44;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: barH + 14 }}>
      {curve.map((count, cmc) => (
        <div key={cmc} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%', minHeight: 3,
            height: count > 0 ? Math.max(3, Math.round((count / max) * barH)) : 3,
            borderRadius: '3px 3px 0 0',
            background: count > 0
              ? 'linear-gradient(180deg, var(--c-green-hi) 0%, var(--c-gold-dim) 100%)'
              : 'var(--c-sub)',
            transition: 'height 0.55s cubic-bezier(0.16,1,0.3,1)',
          }} />
          <span style={{ fontSize: 9, color: 'var(--c-text3)', fontFamily: 'Outfit', lineHeight: 1 }}>
            {cmc === 7 ? '7+' : cmc}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────
function RadarChart({ players = [], size = 220 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.34;
  const axes = ['Power', 'Speed', 'Resilience', 'Interaction', 'Synergy'];
  const n = axes.length;
  const playerColors = [
    'oklch(65% 0.22 162)', 'oklch(72% 0.17 82)',
    'oklch(62% 0.18 220)', 'oklch(62% 0.20 20)',
  ];
  function pt(i, rad) {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  }
  const rings = [0.25, 0.5, 0.75, 1].map(s =>
    axes.map((_, i) => pt(i, r * s).join(',')).join(' ')
  );
  const axisEnds = axes.map((_, i) => pt(i, r));
  const labels = axes.map((ax, i) => ({ ax, p: pt(i, r + 22) }));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {rings.map((pts, gi) => (
        <polygon key={gi} points={pts} fill="none" stroke="oklch(20% 0.022 160)" strokeWidth={0.8} />
      ))}
      {axisEnds.map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="oklch(22% 0.022 160)" strokeWidth={0.8} />
      ))}
      {labels.map(({ ax, p: [x, y] }) => (
        <text key={ax} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          fill="oklch(50% 0.020 160)" fontSize={9} fontFamily="Outfit" fontWeight={500} letterSpacing="0.04em">
          {ax}
        </text>
      ))}
      {players.map((pl, pi) => {
        const dims = pl.dimensions || axes.map(() => 0.6);
        const pts = dims.map((v, i) => pt(i, r * v).join(',')).join(' ');
        const col = playerColors[pi % playerColors.length];
        return (
          <React.Fragment key={pi}>
            <polygon points={pts} fill={col} fillOpacity={0.13} stroke={col} strokeWidth={1.8} strokeOpacity={0.9} strokeLinejoin="round" />
            {dims.map((v, i) => { const [x, y] = pt(i, r * v); return <circle key={i} cx={x} cy={y} r={2.5} fill={col} opacity={0.9} />; })}
          </React.Fragment>
        );
      })}
    </svg>
  );
}

// ─── Count-Up Number ─────────────────────────────────────────────────────────
function CountUp({ to, duration = 1100 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const raf = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [to, duration]);
  return <>{val}</>;
}

// ─── Score Bar ───────────────────────────────────────────────────────────────
function ScoreBar({ score, animate = false }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (animate) { setTimeout(() => setWidth(score), 80); }
    else setWidth(score);
  }, [score, animate]);
  const color = score >= 75 ? 'oklch(68% 0.19 25)' : score >= 60 ? 'var(--c-green)' : 'var(--c-gold)';
  return (
    <div style={{ height: 5, borderRadius: 99, background: 'var(--c-sub)', overflow: 'hidden', marginTop: 8 }}>
      <div style={{
        height: '100%', borderRadius: 99,
        background: color, width: `${width}%`,
        transition: animate ? 'width 1.1s cubic-bezier(0.16,1,0.3,1)' : 'none',
      }} />
    </div>
  );
}

Object.assign(window, { ColorPips, ColorPicker, ManaCurve, RadarChart, CountUp, ScoreBar });
