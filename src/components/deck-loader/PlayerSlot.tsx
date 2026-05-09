'use client'
import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import { ColorPips } from '@/components/ui/color-pips'
import { ColorPicker } from '@/components/ui/color-picker'
import type { PlayerSeat } from '@/types/deck'
import type { SavedDeck } from '@/types/match'
import { PLAYER_ACCENTS, DEMO_LISTS } from '@/lib/design'
import { Check, X, ClipboardList, Link, Library, RotateCcw, Scissors } from 'lucide-react'
import SaveToLibraryForm from '@/components/shared/SaveToLibraryForm'
import DeckTrimmerModal from '@/components/modals/DeckTrimmerModal'

type LoadMode = 'paste' | 'moxfield' | 'library'

interface PlayerSlotProps {
  seat: PlayerSeat
  idx: number
  expanded: boolean
  onToggleExpand: () => void
}

function CommanderInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(v: string) {
    onChange(v)
    if (timer.current) clearTimeout(timer.current)
    if (v.length < 2) { setSuggestions([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(v)}&include_extras=false`)
        const data = await res.json()
        setSuggestions((data.data as string[]).slice(0, 6))
        setOpen(true)
      } catch { /* ignore */ }
    }, 280)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        className="mtg-input"
        placeholder="Commander name (optional)"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{ fontSize: 13, width: '100%' }}
      />
      {open && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, marginTop: 3, background: 'var(--c-surface)', border: '1px solid var(--c-sub)', borderRadius: 'var(--rad)', overflow: 'hidden', boxShadow: '0 8px 24px oklch(0% 0 0/.3)' }}>
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => { onChange(s); setSuggestions([]); setOpen(false) }}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, background: 'none', border: 'none', borderBottom: '1px solid var(--c-sub)', color: 'var(--c-text2)', cursor: 'pointer' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CardErrorRow({ seat, errorLine }: { seat: PlayerSeat; errorLine: string }) {
  const resolveCard = useAppStore(s => s.resolveCard)
  const [value, setValue] = useState(errorLine)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function retry() {
    setStatus('loading')
    setErrorMsg(null)
    const err = await resolveCard(seat, errorLine, value)
    if (err) { setStatus('error'); setErrorMsg(err) }
    // on success the error disappears from the list via store update
  }

  return (
    <li style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          className="mtg-input"
          value={value}
          onChange={e => { setValue(e.target.value); setStatus('idle'); setErrorMsg(null) }}
          onKeyDown={e => e.key === 'Enter' && retry()}
          style={{ flex: 1, fontSize: 12, padding: '5px 10px', fontFamily: 'monospace', borderColor: status === 'error' ? 'var(--c-red)' : undefined }}
        />
        <button
          className="btn-icon"
          onClick={retry}
          disabled={status === 'loading' || !value.trim()}
          title="Retry"
          style={{ width: 28, height: 28, flexShrink: 0 }}
        >
          {status === 'loading'
            ? <div className="spinner" style={{ width: 12, height: 12 }} />
            : <RotateCcw size={12} />}
        </button>
      </div>
      {errorMsg && <span style={{ fontSize: 11, color: 'var(--c-red)', paddingLeft: 2 }}>{errorMsg}</span>}
    </li>
  )
}

function LibraryPicker({ onSelect }: { onSelect: (deck: SavedDeck) => void }) {
  const [decks, setDecks] = useState<SavedDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/decks')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setDecks(d) : null)
      .finally(() => setLoading(false))
  }, [])

  const filtered = decks.filter(d => {
    const q = search.toLowerCase()
    return !q || d.name.toLowerCase().includes(q) || d.commander?.toLowerCase().includes(q)
  })

  if (loading) return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--c-text3)', fontSize: 13 }}><div className="spinner" style={{ width: 16, height: 16, margin: '0 auto 8px' }} />Loading…</div>
  if (decks.length === 0) return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--c-text3)', fontSize: 13 }}>No saved decks yet.<br />Save a deck to the library first.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        className="mtg-input"
        placeholder="Search…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ fontSize: 12 }}
      />
      <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {filtered.length === 0 && <div style={{ textAlign: 'center', color: 'var(--c-text3)', fontSize: 12, padding: '12px 0' }}>No matches</div>}
        {filtered.map(d => (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d)}
            style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 'var(--rad)', background: 'var(--c-bg)', border: '1px solid var(--c-sub)', cursor: 'pointer', transition: 'border-color var(--dur) var(--ease)' }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{d.name}</div>
            {d.commander && <div style={{ fontSize: 11, color: 'var(--c-gold)', fontStyle: 'italic' }}>{d.commander}</div>}
            {d.profiles?.name && <div style={{ fontSize: 10, color: 'var(--c-text3)', marginTop: 2 }}>by {d.profiles.name}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PlayerSlot({ seat, idx, expanded, onToggleExpand }: PlayerSlotProps) {
  const player = useAppStore(s => s.players.find(p => p.seat === seat))
  const updatePlayer = useAppStore(s => s.updatePlayer)
  const loadDeck = useAppStore(s => s.loadDeck)
  const clearPlayer = useAppStore(s => s.clearPlayer)
  const setPlayerCards = useAppStore(s => s.setPlayerCards)

  const [mode, setMode] = useState<LoadMode>('paste')
  const [trimmerOpen, setTrimmerOpen] = useState(false)
  const [moxfieldUrl, setMoxfieldUrl] = useState('')
  const [moxfieldLoading, setMoxfieldLoading] = useState(false)
  const [moxfieldError, setMoxfieldError] = useState<string | null>(null)
  const [sourceMoxfield, setSourceMoxfield] = useState<string | undefined>()

  const acc = PLAYER_ACCENTS[idx]
  const isLoaded = (player?.cards.length ?? 0) > 0
  const isLoading = player?.loading ?? false

  const totalCards = player?.cards.reduce((s, dc) => s + dc.quantity, 0) ?? 0
  const landCount = player?.cards.filter(dc => dc.card.type_line?.includes('Land')).reduce((s, dc) => s + dc.quantity, 0) ?? 0
  const nonLands = player?.cards.filter(dc => !dc.card.type_line?.includes('Land')) ?? []
  const avgCmc = nonLands.length > 0 ? (nonLands.reduce((s, dc) => s + dc.card.cmc * dc.quantity, 0) / nonLands.reduce((s, dc) => s + dc.quantity, 0)).toFixed(1) : '—'
  const deckPrice = player?.cards.reduce((s, dc) => s + (dc.card.prices?.usd ? parseFloat(dc.card.prices.usd) : 0) * dc.quantity, 0) ?? 0

  const deckRaw = player?.deckRaw ?? ''
  const lineCount = deckRaw.split('\n').filter(l => l.trim().match(/^\d+/)).length

  function handleLoad() {
    if (!deckRaw.trim() || isLoading) return
    loadDeck(seat, deckRaw)
  }

  function handleLoadDemo() {
    const demo = DEMO_LISTS[idx % DEMO_LISTS.length]
    updatePlayer(seat, { deckRaw: demo })
    loadDeck(seat, demo)
  }

  async function handleMoxfieldFetch() {
    setMoxfieldLoading(true)
    setMoxfieldError(null)
    try {
      const res = await fetch('/api/decks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: moxfieldUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch deck')
      updatePlayer(seat, {
        deckRaw: data.raw,
        commander: data.commander || '',
        colors: data.colors || [],
      })
      setSourceMoxfield(moxfieldUrl)
      loadDeck(seat, data.raw)
    } catch (e) {
      setMoxfieldError((e as Error).message)
    } finally {
      setMoxfieldLoading(false)
    }
  }

  function handleLibrarySelect(deck: SavedDeck) {
    updatePlayer(seat, {
      deckRaw: deck.deck_raw,
      commander: deck.commander ?? '',
      colors: deck.colors ?? [],
    })
    setSourceMoxfield(deck.moxfield_url ?? undefined)
    loadDeck(seat, deck.deck_raw)
  }

  const TAB_STYLE = (active: boolean) => ({
    flex: 1, padding: '7px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    background: active ? 'var(--c-surface)' : 'transparent',
    border: 'none', borderBottom: active ? `2px solid ${acc.c}` : '2px solid transparent',
    color: active ? acc.c : 'var(--c-text3)', transition: 'all var(--dur) var(--ease)',
  } as React.CSSProperties)

  return (
    <div className="mtg-card" style={{
      padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
      borderColor: isLoaded ? 'oklch(57% .205 162 / .35)' : `${acc.c}44`,
      boxShadow: isLoaded ? '0 0 28px -12px oklch(57% .205 162 / .25)' : 'none',
      transition: 'border-color .3s ease, box-shadow .3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: acc.bg, border: `1.5px solid ${acc.c}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: acc.c, flexShrink: 0 }}>
            {idx + 1}
          </div>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{player?.name || `Player ${idx + 1}`}</span>
        </div>
        {isLoaded && (
          totalCards === 100
            ? <span className="badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={11} /> {totalCards} cards</span>
            : <span className="badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{totalCards} cards · need 100</span>
        )}
        {isLoading && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-text3)' }}><div className="spinner" style={{ width: 14, height: 14 }} /> Resolving…</span>}
      </div>

      {/* Loaded state */}
      {isLoaded ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ColorPips colors={player?.colors ?? []} size={22} />
            {player?.commander && (
              <span style={{ fontSize: 12, color: 'var(--c-gold)', fontStyle: 'italic', fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
                {player.commander}
              </span>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
            {[['Total', totalCards], ['Lands', landCount], ['Avg CMC', avgCmc], ['Value', deckPrice > 0 ? `$${deckPrice.toFixed(0)}` : '—']].map(([l, v]) => (
              <div key={String(l)} style={{ background: 'var(--c-bg)', border: '1px solid var(--c-sub)', borderRadius: 8, padding: '6px 8px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.13em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>

          {player?.error && (
            <div style={{ padding: '8px 12px', borderRadius: 10, background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', fontSize: 12, color: 'oklch(68% .18 20)' }}>
              {player.error}
            </div>
          )}

          {(player?.parseErrors?.length ?? 0) > 0 && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'oklch(22% .08 82/.15)', border: '1px solid oklch(73% .17 82/.2)', fontSize: 11, color: 'var(--c-gold)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {player!.parseErrors.length} card{player!.parseErrors.length > 1 ? 's' : ''} not found — fix &amp; retry
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {player!.parseErrors.map(e => (
                  <CardErrorRow key={e.line} seat={seat} errorLine={e.line} />
                ))}
              </ul>
            </div>
          )}

          {totalCards !== 100 && (
            <button
              className="btn-ghost"
              style={{ fontSize: 12, padding: '7px 14px', borderColor: 'oklch(60% .22 20/.4)', color: 'oklch(68% .18 20)' }}
              onClick={() => setTrimmerOpen(true)}
            >
              <Scissors size={12} /> Trim to 100 cards
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <SaveToLibraryForm deckRaw={deckRaw} commander={player?.commander ?? ''} colors={player?.colors ?? []} moxfieldUrl={sourceMoxfield} />
            <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => { clearPlayer(seat); setMoxfieldUrl(''); setSourceMoxfield(undefined) }}>
              <X size={12} /> Change
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--c-sub)', marginBottom: 2 }}>
            {(['paste', 'moxfield', 'library'] as LoadMode[]).map(m => (
              <button key={m} type="button" style={TAB_STYLE(mode === m)} onClick={() => setMode(m)}>
                {m === 'paste' ? <><ClipboardList size={12} /> Paste</> : m === 'moxfield' ? <><Link size={12} /> Import URL</> : <><Library size={12} /> Library</>}
              </button>
            ))}
          </div>

          {/* Paste mode */}
          {mode === 'paste' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--c-text3)' }}>Color Identity</span>
                <ColorPicker selected={player?.colors ?? []} onChange={c => updatePlayer(seat, { colors: c })} size={24} />
              </div>
              <CommanderInput value={player?.commander ?? ''} onChange={v => updatePlayer(seat, { commander: v })} />

              <div style={{ borderRadius: 'var(--rad)', border: '1px solid var(--c-sub)', overflow: 'hidden' }}>
                <button type="button" onClick={onToggleExpand} style={{ width: '100%', padding: '10px 14px', background: 'var(--c-bg)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--c-text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  <span>{deckRaw ? `${lineCount} lines pasted` : 'Paste decklist…'}</span>
                  <span style={{ fontSize: 11, opacity: .6, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
                </button>
                {expanded && (
                  <textarea
                    className="mtg-textarea"
                    rows={9}
                    placeholder={"1 Sol Ring\n1 Command Tower\n38 Forest\n..."}
                    value={deckRaw}
                    onChange={e => updatePlayer(seat, { deckRaw: e.target.value })}
                    style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--c-sub)', background: 'var(--c-bg)' }}
                  />
                )}
              </div>

              {(player?.parseErrors?.length ?? 0) > 0 && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'oklch(22% .08 82/.15)', border: '1px solid oklch(73% .17 82/.2)', fontSize: 11, color: 'var(--c-gold)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {player!.parseErrors.length} card{player!.parseErrors.length > 1 ? 's' : ''} not found — fix &amp; retry
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {player!.parseErrors.map(e => (
                      <CardErrorRow key={e.line} seat={seat} errorLine={e.line} />
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }} onClick={handleLoadDemo} disabled={isLoading}>
                  Load Demo
                </button>
                <button className="btn-primary" style={{ flex: 1, fontSize: 13 }} onClick={handleLoad} disabled={!deckRaw.trim() || isLoading}>
                  {isLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Loading…</> : 'Load Deck →'}
                </button>
              </div>
            </div>
          )}

          {/* Moxfield mode */}
          {mode === 'moxfield' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--c-text3)', lineHeight: 1.6 }}>
                Paste a public deck URL — Moxfield, Archidekt, or TappedOut.<br />Commander and colors are auto-detected.
              </div>
              <input
                className="mtg-input"
                placeholder="moxfield.com/decks/… · archidekt.com/decks/… · tappedout.net/…"
                value={moxfieldUrl}
                onChange={e => setMoxfieldUrl(e.target.value)}
                style={{ fontSize: 12 }}
                onKeyDown={e => { if (e.key === 'Enter') handleMoxfieldFetch() }}
              />
              {moxfieldError && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', fontSize: 12, color: 'oklch(68% .18 20)' }}>
                  {moxfieldError}
                </div>
              )}
              <button
                className="btn-primary btn-glow"
                style={{ fontSize: 13 }}
                onClick={handleMoxfieldFetch}
                disabled={!moxfieldUrl.trim() || moxfieldLoading}
              >
                {moxfieldLoading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Fetching…</> : 'Import Deck →'}
              </button>
            </div>
          )}

          {/* Library mode */}
          {mode === 'library' && (
            <LibraryPicker onSelect={handleLibrarySelect} />
          )}
        </>
      )}

      {trimmerOpen && player?.cards && (
        <DeckTrimmerModal
          cards={player.cards}
          onClose={() => setTrimmerOpen(false)}
          onConfirm={trimmed => {
            setPlayerCards(seat, trimmed)
            setTrimmerOpen(false)
          }}
        />
      )}
    </div>
  )
}
