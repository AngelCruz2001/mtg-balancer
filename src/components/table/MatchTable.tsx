import type { Player } from '@/types/deck'
import PlayerZone from './PlayerZone'

export function MatchNav({
  playerCount,
  elapsed,
  onBack,
  onLookup,
  onHistory,
}: {
  playerCount: number
  elapsed: string
  onBack: () => void
  onLookup: () => void
  onHistory: () => void
}) {
  return (
    <header style={{
      height: 58, background: 'var(--c-surface)', borderBottom: '1px solid var(--c-sub)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn-ghost" onClick={onBack} style={{ padding: '7px 12px', fontSize: 13 }}>← Setup</button>
        <div style={{ width: 1, height: 20, background: 'var(--c-sub)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--c-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>⚖</div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Deck Balancer</span>
        </div>
        <span className="badge-muted" style={{ fontSize: 10 }}>{playerCount} players</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ padding: '5px 12px', borderRadius: 'var(--rad)', background: 'var(--c-bg)', border: '1px solid var(--c-sub)', fontSize: 13, fontWeight: 600, color: 'var(--c-text2)', fontVariantNumeric: 'tabular-nums', letterSpacing: '.02em' }}>
          ⏱ {elapsed}
        </div>
        <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={onLookup}>🔍 Card Lookup</button>
        <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={onHistory}>📋 History</button>
      </div>
    </header>
  )
}

export default function MatchTable({ players }: { players: Player[] }) {
  const cols = players.length <= 2 ? 2 : players.length === 3 ? 3 : 2
  return (
    <div style={{ padding: '24px 0 0' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="kicker" style={{ marginBottom: 6 }}>Game Table</div>
        <h1 className="df" style={{ fontSize: 40, color: 'var(--c-text)' }}>Match Table</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
        {players.map((p, i) => <PlayerZone key={p.seat} player={p} idx={i} />)}
      </div>
    </div>
  )
}
