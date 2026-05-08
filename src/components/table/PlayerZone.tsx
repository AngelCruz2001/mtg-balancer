import type { Player } from '@/types/deck'
import { ColorPips } from '@/components/ui/color-pips'
import { ManaCurve } from '@/components/ui/mana-curve'
import { PLAYER_ACCENTS } from '@/lib/design'
import type { DeckCard } from '@/types/card'

function groupCards(cards: DeckCard[]) {
  const typeOrder = ['Planeswalker', 'Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Other']
  const groups: Record<string, { l: string; n: number; names: string[] }> = {}
  cards.forEach(dc => {
    const typeLine = dc.card.type_line || ''
    const type = typeOrder.find(t => typeLine.includes(t)) || 'Other'
    if (!groups[type]) groups[type] = { l: type + 's', n: 0, names: [] }
    groups[type].n += dc.quantity
    for (let i = 0; i < dc.quantity; i++) groups[type].names.push(dc.card.name)
  })
  return typeOrder.filter(t => groups[t]).map(t => groups[t])
}

function CardSection({ group }: { group: { l: string; n: number; names: string[] } }) {
  return (
    <details style={{ borderRadius: 10, border: '1px solid var(--c-sub)', overflow: 'hidden', marginBottom: 6 }}>
      <summary style={{
        padding: '8px 12px', background: 'var(--c-bg)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: 'var(--c-text2)', fontSize: 12, fontWeight: 500, listStyle: 'none',
        userSelect: 'none',
      }}>
        <span>{group.l}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--c-text3)' }}>{group.n}</span>
      </summary>
      <div style={{ padding: '6px 12px 10px', background: 'var(--c-surface)', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {group.names.map((name, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--c-text2)', padding: '2px 0', borderBottom: '1px solid var(--c-sub)', lineHeight: 1.4 }}>
            {name}
          </div>
        ))}
      </div>
    </details>
  )
}

export default function PlayerZone({ player, idx }: { player: Player; idx: number }) {
  const acc = PLAYER_ACCENTS[idx]
  const total = player.cards.reduce((s, dc) => s + dc.quantity, 0)
  const lands = player.cards.filter(dc => dc.card.type_line?.includes('Land')).reduce((s, dc) => s + dc.quantity, 0)
  const spells = total - lands
  const nonLands = player.cards.filter(dc => !dc.card.type_line?.includes('Land'))
  const avgCmc = nonLands.length > 0
    ? (nonLands.reduce((s, dc) => s + dc.card.cmc * dc.quantity, 0) / nonLands.reduce((s, dc) => s + dc.quantity, 0)).toFixed(1)
    : '0.0'

  const deckPrice = player.cards.reduce((s, dc) => s + (dc.card.prices?.usd ? parseFloat(dc.card.prices.usd) : 0) * dc.quantity, 0)

  const curve = Array(8).fill(0)
  player.cards.forEach(dc => {
    const bucket = Math.min(Math.floor(dc.card.cmc || 0), 7)
    curve[bucket] += dc.quantity
  })

  const groups = groupCards(player.cards)

  return (
    <div className="mtg-card" style={{ display: 'flex', flexDirection: 'column', borderTop: `2px solid ${acc.c}88`, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--c-sub)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: acc.c, marginBottom: 5 }}>Seat {player.seat}</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1 }}>{player.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 4 }}>Deck Size</div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, color: 'var(--c-text)' }}>{total}</div>
          </div>
        </div>

        {/* Commander art */}
        {(() => {
          const cmdCard = player.commander
            ? player.cards.find(dc => dc.card.name.toLowerCase() === player.commander.toLowerCase())?.card
            : undefined
          const artUrl = cmdCard?.image_uris?.art_crop
            ?? cmdCard?.card_faces?.[0]?.image_uris?.art_crop
          return (
            <div style={{
              height: 90, borderRadius: 10, overflow: 'hidden', position: 'relative', marginBottom: 14,
              background: artUrl
                ? `url(${artUrl}) center/cover no-repeat`
                : `repeating-linear-gradient(135deg, ${acc.c}18 0, ${acc.c}18 2px, transparent 2px, transparent 14px)`,
              border: `1px solid ${acc.c}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: artUrl ? 'linear-gradient(180deg, oklch(0% 0 0/.15) 0%, oklch(0% 0 0/.7) 100%)' : 'linear-gradient(180deg, transparent 40%, var(--c-surface) 100%)' }} />
              {player.commander ? (
                <div style={{ position: 'relative', textAlign: 'center', padding: '0 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.13em', textTransform: 'uppercase', color: artUrl ? 'oklch(80% 0 0)' : acc.c, marginBottom: 3, opacity: .85 }}>Commander</div>
                  <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, fontWeight: 600, color: artUrl ? 'white' : 'var(--c-text)', lineHeight: 1.3, textShadow: artUrl ? '0 1px 4px oklch(0% 0 0/.8)' : 'none' }}>{player.commander}</div>
                </div>
              ) : (
                <div style={{ position: 'relative', fontSize: 11, color: 'var(--c-text3)', letterSpacing: '.14em', textTransform: 'uppercase' }}>No commander</div>
              )}
            </div>
          )
        })()}

        <div style={{ marginBottom: 10 }}>
          <ColorPips colors={player.colors} size={22} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
          {[['Lands', lands], ['Spells', spells], ['Avg CMC', avgCmc], ['Value', deckPrice > 0 ? `$${deckPrice.toFixed(0)}` : '—']].map(([l, v]) => (
            <div key={String(l)} style={{ background: 'var(--c-bg)', border: '1px solid var(--c-sub)', borderRadius: 9, padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.13em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 6 }}>Mana Curve</div>
          <ManaCurve curve={curve} compact />
        </div>
      </div>

      <div style={{ padding: '12px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 8 }}>Card Library</div>
        {groups.map(g => <CardSection key={g.l} group={g} />)}
      </div>
    </div>
  )
}
