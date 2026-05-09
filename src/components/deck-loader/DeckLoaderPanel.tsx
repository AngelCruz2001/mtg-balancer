'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import PlayerSlot from './PlayerSlot'
import { PLAYER_ACCENTS } from '@/lib/design'
import { UserMenu } from '@/components/ui/user-menu'
import { Scale, Zap, Library, Trophy } from 'lucide-react'
import type { PlayerSeat } from '@/types/deck'

const SEAT_NAMES = ['Alex', 'Sam', 'Jamie', 'Morgan']

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          height: 7, borderRadius: 99,
          width: i === current - 1 ? 24 : 7,
          background: i < current ? (i === current - 1 ? 'var(--c-gold)' : 'var(--c-gold-dim)') : 'var(--c-sub)',
          transition: 'all .3s var(--ease)',
        }} />
      ))}
    </div>
  )
}

export default function DeckLoaderPanel() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [count, setCount] = useState(2)
  const [names, setNames] = useState(['', '', '', ''])
  const [expanded, setExpanded] = useState([false, false, false, false])

  const players = useAppStore(s => s.players)
  const addPlayer = useAppStore(s => s.addPlayer)
  const setMatchStartAt = useAppStore(s => s.setMatchStartAt)
  const router = useRouter()

  const activePlayers = players.filter(p => (p.cards.length > 0) && p.seat <= count)
  const readyCount = activePlayers.length

  function commitNames() {
    for (let i = 0; i < count; i++) {
      const seat = (i + 1) as PlayerSeat
      const name = names[i].trim() || SEAT_NAMES[i]
      addPlayer(seat, name)
    }
  }

  function goToStep2() {
    commitNames()
    setStep(2)
  }

  function toggleExpand(idx: number) {
    setExpanded(prev => prev.map((v, i) => (i === idx ? !v : v)))
  }

  const canStep1 = true
  const canStep3 = readyCount >= 2

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 24px', overflowX: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--c-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(10% 0.025 162)' }}><Scale size={13} /></div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '.02em' }}>Deck Balancer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
            <StepDots current={step} total={3} />
            <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => router.push('/pod')}><Zap size={13} /> Pod</button>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => router.push('/decks')}><Library size={13} /> Library</button>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => router.push('/leaderboard')}><Trophy size={13} /> Board</button>
            <UserMenu />
          </div>
        </div>

        {/* Step 1 — Build the Pod */}
        {step === 1 && (
          <div className="afu" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <div className="kicker" style={{ marginBottom: 10 }}>Step 1 of 3</div>
              <h1 className="df" style={{ fontSize: 52, color: 'var(--c-text)', marginBottom: 12 }}>Build the Pod</h1>
              <p style={{ color: 'var(--c-text2)', fontSize: 16, maxWidth: 440 }}>How many players are sitting down? Name each seat before continuing.</p>
            </div>

            <div style={{ display: 'flex', gap: 12, maxWidth: 480 }}>
              {[2, 3, 4].map((n, i) => (
                <button key={n} type="button" onClick={() => setCount(n)} style={{
                  flex: 1, padding: '16px 12px', borderRadius: 'var(--rad-lg)', cursor: 'pointer',
                  background: count === n ? 'var(--c-green-bg)' : 'var(--c-surface)',
                  border: `1.5px solid ${count === n ? 'oklch(57% .205 162 / .45)' : 'var(--c-sub)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  color: count === n ? 'var(--c-green-hi)' : 'var(--c-text2)',
                  transition: 'all var(--dur) var(--ease)',
                }}>
                  <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{n}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '.05em' }}>{['Two', 'Three', 'Four'][i]} players</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 12, maxWidth: 700 }}>
              {Array.from({ length: count }, (_, i) => (
                <div key={i}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: PLAYER_ACCENTS[i].c, marginBottom: 8 }}>
                    Player {i + 1}
                  </label>
                  <input
                    className="mtg-input"
                    placeholder={`e.g. ${SEAT_NAMES[i]}`}
                    value={names[i]}
                    onChange={e => setNames(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-gold" onClick={goToStep2} disabled={!canStep1}>
                Load the Lists <span style={{ opacity: .7 }}>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Load the Lists */}
        {step === 2 && (
          <div className="afu" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="kicker" style={{ marginBottom: 10 }}>Step 2 of 3</div>
                <h1 className="df" style={{ fontSize: 48, color: 'var(--c-text)', marginBottom: 8 }}>Load the Lists</h1>
                <p style={{ color: 'var(--c-text2)', fontSize: 15 }}>Paste each decklist or hit <em>Load Demo</em> to try sample decks.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--c-text3)' }}>{readyCount}/{count} ready</div>
                <div style={{ width: 80, height: 5, borderRadius: 99, background: 'var(--c-sub)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(readyCount / count) * 100}%`, background: 'var(--c-green)', borderRadius: 99, transition: 'width .5s var(--ease)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count === 4 ? 2 : count}, 1fr)`, gap: 14 }}>
              {Array.from({ length: count }, (_, i) => (
                <PlayerSlot
                  key={i + 1}
                  seat={(i + 1) as PlayerSeat}
                  idx={i}
                  expanded={expanded[i]}
                  onToggleExpand={() => toggleExpand(i)}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-gold" onClick={() => setStep(3)} disabled={!canStep3}>
                Review Pod <span style={{ opacity: .7 }}>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Review the Pod */}
        {step === 3 && (
          <div className="afu" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div className="kicker" style={{ marginBottom: 10 }}>Step 3 of 3</div>
              <h1 className="df" style={{ fontSize: 48, color: 'var(--c-text)', marginBottom: 8 }}>Review the Pod</h1>
              <p style={{ color: 'var(--c-text2)', fontSize: 15 }}>Everything look right? Launch the match table to compare and analyze.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, 2)}, 1fr)`, gap: 14 }}>
              {activePlayers.map((p, i) => {
                const acc = PLAYER_ACCENTS[i]
                const total = p.cards.reduce((s, dc) => s + dc.quantity, 0)
                const lands = p.cards.filter(dc => dc.card.type_line?.includes('Land')).reduce((s, dc) => s + dc.quantity, 0)
                const nonL = p.cards.filter(dc => !dc.card.type_line?.includes('Land'))
                const avgCmc = nonL.length > 0 ? (nonL.reduce((s, dc) => s + dc.card.cmc * dc.quantity, 0) / nonL.reduce((s, dc) => s + dc.quantity, 0)).toFixed(1) : '—'
                return (
                  <div key={p.seat} className="mtg-card" style={{ padding: 20, borderColor: `${acc.c}44` }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: `repeating-linear-gradient(45deg, var(--c-sub) 0, var(--c-sub) 2px, transparent 2px, transparent 10px)`, border: '1px solid var(--c-border)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                        {p.colors.length > 0 && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {p.colors.map(c => <span key={c} style={{ fontSize: 11, color: acc.c }}>{c}</span>)}
                          </div>
                        )}
                        {p.commander && <div style={{ fontSize: 12, color: 'var(--c-gold)', fontStyle: 'italic', fontFamily: "var(--font-cormorant), serif", marginTop: 5 }}>{p.commander}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[['Cards', total], ['Lands', lands], ['Avg CMC', avgCmc]].map(([l, v]) => (
                        <div key={String(l)} style={{ flex: 1, background: 'var(--c-bg)', border: '1px solid var(--c-sub)', borderRadius: 10, padding: '7px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 4 }}>{l}</div>
                          <div style={{ fontSize: 16, fontWeight: 600 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button className="btn-gold" onClick={() => { setMatchStartAt(Date.now()); router.push('/match') }} style={{ padding: '14px 36px', fontSize: 16 }}>
                Launch Match →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
