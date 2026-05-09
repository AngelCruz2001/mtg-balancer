const AXES = ['Power', 'Speed', 'Resilience', 'Interaction', 'Synergy']
const AXIS_DESCRIPTIONS: Record<string, string> = {
  Power: 'Raw card strength and win conditions',
  Speed: 'How fast the deck can execute its gameplan',
  Resilience: 'Ability to recover from removal and board wipes',
  Interaction: 'Counterspells, removal, and disruption',
  Synergy: 'How well cards work together as a package',
}
const PLAYER_COLORS = [
  'oklch(65% 0.22 162)',
  'oklch(72% 0.17 82)',
  'oklch(62% 0.18 220)',
  'oklch(62% 0.20 20)',
]

function pt(i: number, r: number, n: number, cx: number, cy: number) {
  const a = (2 * Math.PI * i) / n - Math.PI / 2
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number]
}

export function RadarChart({
  players = [],
  size = 220,
}: {
  players: { name: string; dimensions?: number[] }[]
  size?: number
}) {
  const cx = size / 2, cy = size / 2, r = size * 0.34
  const n = AXES.length
  const rings = [0.25, 0.5, 0.75, 1].map(s =>
    AXES.map((_, i) => pt(i, r * s, n, cx, cy).join(',')).join(' ')
  )
  const axisEnds = AXES.map((_, i) => pt(i, r, n, cx, cy))
  const labels = AXES.map((ax, i) => ({ ax, p: pt(i, r + 26, n, cx, cy) }))

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
          fill="oklch(50% 0.020 160)" fontSize={11} fontFamily="Outfit" fontWeight={500} letterSpacing="0.03em"
          style={{ cursor: 'help' }}>
          <title>{ax}: {AXIS_DESCRIPTIONS[ax]}</title>
          {ax}
        </text>
      ))}
      {players.map((pl, pi) => {
        const dims = pl.dimensions || AXES.map(() => 0.6)
        const pts = dims.map((v, i) => pt(i, r * v, n, cx, cy).join(',')).join(' ')
        const col = PLAYER_COLORS[pi % PLAYER_COLORS.length]
        return (
          <g key={pi}>
            <polygon points={pts} fill={col} fillOpacity={0.13} stroke={col} strokeWidth={1.8} strokeOpacity={0.9} strokeLinejoin="round" />
            {dims.map((v, i) => {
              const [x, y] = pt(i, r * v, n, cx, cy)
              return <circle key={i} cx={x} cy={y} r={2.5} fill={col} opacity={0.9} />
            })}
          </g>
        )
      })}
    </svg>
  )
}
