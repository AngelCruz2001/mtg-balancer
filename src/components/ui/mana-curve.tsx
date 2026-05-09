export function ManaCurve({ curve = [], compact = false }: { curve: number[]; compact?: boolean }) {
  const max = Math.max(...curve, 1)
  const barH = compact ? 28 : 44
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: barH + 14 }}>
      {curve.map((count, cmc) => (
        <div
          key={cmc}
          title={count > 0 ? `${count} card${count !== 1 ? 's' : ''} at CMC ${cmc === 7 ? '7+' : cmc}` : `No cards at CMC ${cmc}`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: count > 0 ? 'default' : undefined }}
        >
          <div style={{
            width: '100%', minHeight: 3,
            height: count > 0 ? Math.max(3, Math.round((count / max) * barH)) : 3,
            borderRadius: '3px 3px 0 0',
            background: count > 0
              ? 'linear-gradient(180deg, var(--c-green-hi) 0%, var(--c-gold-dim) 100%)'
              : 'var(--c-sub)',
            transition: 'height 0.55s cubic-bezier(0.16,1,0.3,1)',
          }} />
          <span style={{ fontSize: 11, color: 'var(--c-text3)', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
            {cmc === 7 ? '7+' : cmc}
          </span>
        </div>
      ))}
    </div>
  )
}
