'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColorPips } from '@/components/ui/color-pips'
import { UserMenu } from '@/components/ui/user-menu'
import { useAppStore } from '@/store'
import type { SavedDeck } from '@/types/match'

interface SuggestedDeck {
  id: string
  name: string
  commander: string | null
  colors: string[] | null
  deck_raw: string
  power_score: number | null
}

interface PodSuggestion {
  decks: SuggestedDeck[]
  spread: number | null
  has_history: boolean
}

const SEAT_COLORS = ['oklch(65% 0.22 162)', 'oklch(72% 0.17 82)', 'oklch(62% 0.18 225)', 'oklch(62% 0.20 20)']

function ScoreChip({ score }: { score: number | null }) {
  if (score == null) return <span style={{ fontSize: 10, color: 'var(--c-text3)', fontStyle: 'italic' }}>No data</span>
  const color = score >= 75 ? 'oklch(62% .20 20)' : score >= 60 ? 'var(--c-green-hi)' : 'var(--c-gold)'
  return <span style={{ fontSize: 11, fontWeight: 700, color }}>{score}</span>
}

function SpreadBadge({ spread, hasHistory }: { spread: number | null; hasHistory: boolean }) {
  if (!hasHistory || spread == null) {
    return <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'var(--c-surface)', border: '1px solid var(--c-sub)', color: 'var(--c-text3)' }}>No history</span>
  }
  const bg = spread <= 10 ? 'var(--c-green-bg)' : spread <= 22 ? 'oklch(22% .08 82/.15)' : 'oklch(18% .08 20/.18)'
  const border = spread <= 10 ? 'oklch(57% .205 162/.3)' : spread <= 22 ? 'oklch(73% .17 82/.3)' : 'oklch(62% .20 20/.3)'
  const color = spread <= 10 ? 'var(--c-green-hi)' : spread <= 22 ? 'var(--c-gold)' : 'oklch(68% .18 20)'
  const label = spread <= 10 ? 'Well balanced' : spread <= 22 ? 'Minor gap' : 'Significant gap'
  return (
    <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: bg, border: `1px solid ${border}`, color }}>
      {label} · {spread}pt spread
    </span>
  )
}

export default function PodPage() {
  const router = useRouter()
  const preloadFromPod = useAppStore(s => s.preloadFromPod)
  const setMatchStartAt = useAppStore(s => s.setMatchStartAt)

  const [library, setLibrary] = useState<SavedDeck[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [suggestions, setSuggestions] = useState<PodSuggestion[]>([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [suggesting, setSuggesting] = useState(false)
  const [loading, setLoading] = useState<number | null>(null)  // index of pod being loaded

  useEffect(() => {
    fetch('/api/decks')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLibrary(d) })
      .finally(() => setLibraryLoading(false))
  }, [])

  function toggleDeck(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSuggestions([])
  }

  async function suggest() {
    setSuggesting(true)
    setSuggestions([])
    const res = await fetch('/api/pod-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deck_ids: [...selected] }),
    })
    const data = await res.json()
    if (Array.isArray(data)) setSuggestions(data)
    setSuggesting(false)
  }

  async function loadPod(pod: PodSuggestion, idx: number) {
    setLoading(idx)
    await preloadFromPod(pod.decks.map(d => ({
      name: d.commander ?? d.name,
      commander: d.commander ?? '',
      colors: d.colors ?? [],
      deck_raw: d.deck_raw,
    })))
    setMatchStartAt(Date.now())
    router.push('/match')
  }

  const canSuggest = selected.size >= 2

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <header style={{ height: 58, background: 'var(--c-surface)', borderBottom: '1px solid var(--c-sub)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn-ghost" onClick={() => router.push('/')} style={{ padding: '7px 12px', fontSize: 13 }}>← Setup</button>
          <div style={{ width: 1, height: 20, background: 'var(--c-sub)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--c-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>⚖</div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Deck Balancer</span>
          </div>
          <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => router.push('/decks')}>📚 Library</button>
          <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => router.push('/leaderboard')}>🏆 Leaderboard</button>
        </div>
        <UserMenu />
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        <div style={{ marginBottom: 36 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>Tonight's pool</div>
          <h1 className="df" style={{ fontSize: 48, color: 'var(--c-text)', marginBottom: 8 }}>Pod Builder</h1>
          <p style={{ color: 'var(--c-text2)', fontSize: 15 }}>Select which decks are available tonight. The system will suggest the most balanced 4-player combination based on past match scores.</p>
        </div>

        {/* Step 1 — Select decks */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div className="kicker" style={{ marginBottom: 4 }}>Step 1</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Which decks are in the pool?</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {selected.size > 0 && (
                <span className="badge-muted" style={{ fontSize: 11 }}>{selected.size} selected</span>
              )}
              <button
                className={`btn-primary${canSuggest ? ' btn-glow' : ''}`}
                style={{ fontSize: 13 }}
                onClick={suggest}
                disabled={!canSuggest || suggesting}
              >
                {suggesting
                  ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Calculating…</>
                  : `Suggest Pod${selected.size >= 4 ? 's' : ''} →`}
              </button>
            </div>
          </div>

          {libraryLoading && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--c-text3)', fontSize: 13 }}>
              <div className="spinner" style={{ width: 20, height: 20, margin: '0 auto 10px' }} />Loading library…
            </div>
          )}

          {!libraryLoading && library.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: .3 }}>📚</div>
              <div style={{ fontSize: 13, color: 'var(--c-text3)', lineHeight: 1.7 }}>No decks in the library yet.<br />Add decks via Setup → Moxfield tab → Save to Library.</div>
            </div>
          )}

          {!libraryLoading && library.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {library.map(deck => {
                const isSelected = selected.has(deck.id)
                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => toggleDeck(deck.id)}
                    style={{
                      textAlign: 'left', padding: '14px 16px', borderRadius: 'var(--rad-lg)', cursor: 'pointer',
                      background: isSelected ? 'var(--c-green-bg)' : 'var(--c-surface)',
                      border: `1.5px solid ${isSelected ? 'oklch(57% .205 162/.45)' : 'var(--c-sub)'}`,
                      transition: 'all var(--dur) var(--ease)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? 'var(--c-green-hi)' : 'var(--c-text)', flex: 1, marginRight: 6 }}>{deck.name}</div>
                      {isSelected && <span style={{ fontSize: 13, color: 'var(--c-green-hi)', flexShrink: 0 }}>✓</span>}
                    </div>
                    {deck.commander && <div style={{ fontSize: 11, color: 'var(--c-gold)', fontStyle: 'italic', fontFamily: "var(--font-cormorant), serif", marginBottom: 5 }}>{deck.commander}</div>}
                    {(deck.colors?.length ?? 0) > 0 && <ColorPips colors={deck.colors!} size={16} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Step 2 — Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div className="kicker" style={{ marginBottom: 4 }}>Step 2</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Suggested Pods</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {suggestions.map((pod, podIdx) => (
                <div
                  key={podIdx}
                  className="mtg-panel"
                  style={{
                    padding: '20px 24px',
                    borderLeft: podIdx === 0 ? '3px solid var(--c-green)' : '3px solid var(--c-sub)',
                    animation: `fadeUp 300ms ${podIdx * 80}ms var(--ease) both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {podIdx === 0 && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-green-hi)' }}>Best match</span>}
                      <SpreadBadge spread={pod.spread} hasHistory={pod.has_history} />
                    </div>
                    <button
                      className={podIdx === 0 ? 'btn-primary btn-glow' : 'btn-ghost'}
                      style={{ fontSize: 13 }}
                      onClick={() => loadPod(pod, podIdx)}
                      disabled={loading != null}
                    >
                      {loading === podIdx
                        ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Loading decks…</>
                        : 'Launch this pod →'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                    {pod.decks.map((deck, di) => (
                      <div key={deck.id} style={{ padding: '12px 14px', borderRadius: 'var(--rad)', background: 'var(--c-bg)', border: `1px solid ${SEAT_COLORS[di]}33` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: SEAT_COLORS[di], marginBottom: 4 }}>Seat {di + 1}</div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{deck.name}</div>
                        {deck.commander && <div style={{ fontSize: 11, color: 'var(--c-gold)', fontStyle: 'italic', marginBottom: 5 }}>{deck.commander}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {(deck.colors?.length ?? 0) > 0 && <ColorPips colors={deck.colors!} size={14} />}
                          <ScoreChip score={deck.power_score} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
