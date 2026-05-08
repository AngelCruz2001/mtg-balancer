'use client'

const ALL_COLORS = ['W', 'U', 'B', 'R', 'G'] as const
const COLOR_MAP: Record<string, { on: string; border: string; text: string; off: string }> = {
  W: { on: '#ede8d0', border: '#c4a84a', text: '#3d2e0f', off: '#1e1a12' },
  U: { on: '#1c4f9e', border: '#0d3577', text: '#c0d6f0', off: '#0d1828' },
  B: { on: '#3d2455', border: '#5c3d8a', text: '#d4b8f0', off: '#160e20' },
  R: { on: '#b52b20', border: '#8a1c16', text: '#fcd5d0', off: '#2a1010' },
  G: { on: '#1a5c38', border: '#103d24', text: '#a5e2be', off: '#0a1e14' },
}

export function ColorPicker({
  selected = [],
  onChange,
  size = 26,
}: {
  selected: string[]
  onChange: (colors: string[]) => void
  size?: number
}) {
  const toggle = (c: string) =>
    onChange(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c])

  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {ALL_COLORS.map(c => {
        const m = COLOR_MAP[c]
        const on = selected.includes(c)
        return (
          <button key={c} type="button" onClick={() => toggle(c)} style={{
            width: size, height: size, borderRadius: '50%',
            background: on ? m.on : m.off,
            border: `2px solid ${on ? m.border : 'rgba(255,255,255,0.1)'}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: Math.round(size * 0.42), fontWeight: 700,
            color: on ? m.text : 'rgba(255,255,255,0.25)',
            fontFamily: 'var(--font-outfit), Outfit, sans-serif',
            transition: 'all 140ms ease', transform: on ? 'scale(1.12)' : 'scale(1)',
            flexShrink: 0,
          }}>{c}</button>
        )
      })}
    </div>
  )
}
