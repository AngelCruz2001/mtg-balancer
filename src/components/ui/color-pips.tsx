const COLOR_MAP: Record<string, { bg: string; border: string; text: string; name: string }> = {
  W: { bg: '#ede8d0', border: '#c4a84a', text: '#3d2e0f', name: 'White' },
  U: { bg: '#1c4f9e', border: '#0d3577', text: '#c0d6f0', name: 'Blue' },
  B: { bg: '#221432', border: '#5c3d8a', text: '#d4b8f0', name: 'Black' },
  R: { bg: '#b52b20', border: '#8a1c16', text: '#fcd5d0', name: 'Red' },
  G: { bg: '#1a5c38', border: '#103d24', text: '#a5e2be', name: 'Green' },
}

export function ColorPips({ colors = [], size = 20 }: { colors: string[]; size?: number }) {
  if (!colors.length) return <span style={{ fontSize: 12, color: 'var(--c-text3)' }}>—</span>
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
      {colors.map(c => {
        const m = COLOR_MAP[c] || COLOR_MAP.W
        return (
          <div key={c} title={m.name} style={{
            width: size, height: size, borderRadius: '50%',
            background: m.bg, border: `2px solid ${m.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: Math.round(size * 0.44), fontWeight: 700,
            color: m.text, fontFamily: 'var(--font-outfit), Outfit, sans-serif',
            flexShrink: 0, userSelect: 'none',
            boxShadow: `0 1px 5px ${m.bg}55`,
          }}>{c}</div>
        )
      })}
    </div>
  )
}
