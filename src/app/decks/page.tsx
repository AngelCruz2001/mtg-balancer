'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColorPips } from '@/components/ui/color-pips'
import { UserMenu } from '@/components/ui/user-menu'
import { Scale, Trophy, Library, X, Check, Swords, Square, CheckSquare } from 'lucide-react'
import type { SavedDeck } from '@/types/match'

const BRACKET_META: Record<number, { label: string; color: string }> = {
  1: { label: 'B1', color: 'var(--c-text3)' },
  2: { label: 'B2', color: 'var(--c-green)' },
  3: { label: 'B3', color: '#5b8eff' },
  4: { label: 'B4', color: 'oklch(65% .22 20)' },
}

function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: 4,
      background: 'var(--c-bg)', border: `1px solid ${color ?? 'var(--c-sub)'}`,
      color: color ?? 'var(--c-text3)', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

function DeckCard({ deck, selected, onSelect, onDeleted }: {
  deck: SavedDeck
  selected: boolean
  onSelect: (id: string) => void
  onDeleted: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hovered, setHovered] = useState(false)

  const lineCount = deck.deck_raw.split('\n').filter(l => l.trim().match(/^\d+/)).length
  const bracketMeta = deck.bracket ? BRACKET_META[deck.bracket] : null

  async function copyList() {
    await navigator.clipboard.writeText(deck.deck_raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${deck.name}"?`)) return
    setDeleting(true)
    await fetch(`/api/decks?id=${deck.id}`, { method: 'DELETE' })
    onDeleted(deck.id)
  }

  return (
    <div
      className="mtg-card"
      style={{
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
        outline: selected ? '2px solid var(--c-green)' : 'none',
        outlineOffset: -1,
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <button
          onClick={() => onSelect(deck.id)}
          style={{ background: 'none', border: 'none', padding: '2px 0 0', cursor: 'pointer', color: selected ? 'var(--c-green)' : 'var(--c-text3)', flexShrink: 0 }}
          title={selected ? 'Deselect' : 'Select for analysis'}
        >
          {selected ? <CheckSquare size={15} /> : <Square size={15} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {deck.name}
          </div>
          {deck.commander && (
            <div style={{ fontSize: 12, color: 'var(--c-gold)', fontStyle: 'italic', fontFamily: "var(--font-cormorant), serif", marginTop: 2 }}>
              {deck.commander}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {deck.moxfield_url && (
            <a href={deck.moxfield_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} title="Open in Moxfield">↗</a>
          )}
          <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={handleDelete} disabled={deleting}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Color pips */}
      {(deck.colors?.length ?? 0) > 0 && <ColorPips colors={deck.colors!} size={16} />}

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        <Pill>{lineCount} cards</Pill>
        {bracketMeta && <Pill color={bracketMeta.color}>{bracketMeta.label}</Pill>}
        {deck.estimated_value != null && (
          <Pill color="var(--c-gold)">${Number(deck.estimated_value).toFixed(0)}</Pill>
        )}
        {(deck.wins ?? 0) > 0 && (
          <Pill color="var(--c-gold)"><Trophy size={9} />{deck.wins}W</Pill>
        )}
        {deck.profiles?.name && (
          <Pill>@{deck.profiles.name}</Pill>
        )}
      </div>

      {/* Copy button */}
      <button className="btn-primary" style={{ fontSize: 13, marginTop: 2 }} onClick={copyList}>
        {copied ? <><Check size={13} /> Copied!</> : 'Copy Decklist'}
      </button>

      {/* Description tooltip on hover */}
      {hovered && deck.description && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)', left: 0, right: 0,
          background: 'var(--c-surface)', border: '1px solid var(--c-sub)',
          borderRadius: 8, padding: '10px 12px',
          fontSize: 12, lineHeight: 1.6, color: 'var(--c-text2)',
          zIndex: 20, boxShadow: '0 4px 24px rgba(0,0,0,.45)',
          pointerEvents: 'none',
        }}>
          {deck.description}
        </div>
      )}
    </div>
  )
}

export default function DecksPage() {
  const router = useRouter()
  const [decks, setDecks] = useState<SavedDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/decks')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setDecks(d) : setError(d.error ?? 'Failed'))
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = decks.filter(d => {
    const q = search.toLowerCase()
    return !q || d.name.toLowerCase().includes(q) || d.commander?.toLowerCase().includes(q)
  })

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleAnalyze() {
    const ids = Array.from(selected).join(',')
    router.push(`/analysis?decks=${ids}`)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {/* Nav */}
      <header style={{ height: 58, background: 'var(--c-surface)', borderBottom: '1px solid var(--c-sub)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, overflow: 'hidden' }}>
          <button className="btn-ghost" onClick={() => router.push('/')} style={{ padding: '7px 12px', fontSize: 13 }}>← Setup</button>
          <div style={{ width: 1, height: 20, background: 'var(--c-sub)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--c-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(10% 0.025 162)' }}><Scale size={13} /></div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Deck Balancer</span>
          </div>
          <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => router.push('/leaderboard')}><Trophy size={13} /> Leaderboard</button>
        </div>
        <UserMenu />
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', width: '100%', paddingBottom: selected.size > 0 ? 100 : 40 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Shared pool</div>
            <h1 className="df" style={{ fontSize: 48, color: 'var(--c-text)', marginBottom: 8 }}>Deck Library</h1>
            <p style={{ color: 'var(--c-text2)', fontSize: 15 }}>Global decks available to all players. Load any deck into your session.</p>
          </div>
          <input
            className="mtg-input"
            placeholder="Search by name or commander…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 260, maxWidth: '100%' }}
          />
        </div>

        {loading && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--c-text3)' }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 14px' }} />
            <div style={{ fontSize: 14 }}>Loading library…</div>
          </div>
        )}

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 'var(--rad)', background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', color: 'oklch(68% .18 20)', fontSize: 14 }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ marginBottom: 12, opacity: .3, display: 'flex', justifyContent: 'center' }}><Library size={32} /></div>
            <div style={{ fontSize: 14, color: 'var(--c-text3)', lineHeight: 1.7 }}>
              {search ? 'No decks match your search.' : 'No decks saved yet.\nLoad a deck from Moxfield in Setup and save it to the library.'}
            </div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.map(d => (
              <DeckCard
                key={d.id}
                deck={d}
                selected={selected.has(d.id)}
                onSelect={toggleSelect}
                onDeleted={id => setDecks(prev => prev.filter(x => x.id !== id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selection action bar */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--c-surface)', borderTop: '1px solid var(--c-sub)',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          zIndex: 100,
        }}>
          <div style={{ fontSize: 14, color: 'var(--c-text2)' }}>
            <span style={{ fontWeight: 700, color: 'var(--c-text)' }}>{selected.size}</span> deck{selected.size !== 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setSelected(new Set())}>
              Clear
            </button>
            <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleAnalyze}>
              <Swords size={14} /> Analyze with Claude
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
