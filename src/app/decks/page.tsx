'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColorPips } from '@/components/ui/color-pips'
import { UserMenu } from '@/components/ui/user-menu'
import type { SavedDeck } from '@/types/match'

function DeckCard({ deck, onDeleted }: { deck: SavedDeck; onDeleted: (id: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const lineCount = deck.deck_raw.split('\n').filter(l => l.trim().match(/^\d+/)).length

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
    <div className="mtg-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deck.name}</div>
          {deck.commander && (
            <div style={{ fontSize: 12, color: 'var(--c-gold)', fontStyle: 'italic', fontFamily: "var(--font-cormorant), serif", marginBottom: 6 }}>{deck.commander}</div>
          )}
          {(deck.colors?.length ?? 0) > 0 && <ColorPips colors={deck.colors!} size={18} />}
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {deck.moxfield_url && (
            <a
              href={deck.moxfield_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              style={{ fontSize: 11, padding: '5px 9px' }}
              title="Open in Moxfield"
            >
              ↗
            </a>
          )}
          <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 9px' }} onClick={handleDelete} disabled={deleting}>
            ✕
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: 'var(--c-bg)', border: '1px solid var(--c-sub)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 2 }}>Cards</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{lineCount}</div>
        </div>
        {deck.profiles?.name && (
          <div style={{ flex: 1, background: 'var(--c-bg)', border: '1px solid var(--c-sub)', borderRadius: 8, padding: '6px 10px', textAlign: 'center', overflow: 'hidden' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 2 }}>Added by</div>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deck.profiles.name}</div>
          </div>
        )}
      </div>

      <button className="btn-primary" style={{ fontSize: 13 }} onClick={copyList}>
        {copied ? '✓ Copied!' : 'Copy Decklist'}
      </button>
    </div>
  )
}

export default function DecksPage() {
  const router = useRouter()
  const [decks, setDecks] = useState<SavedDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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
          <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => router.push('/leaderboard')}>🏆 Leaderboard</button>
        </div>
        <UserMenu />
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
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
            style={{ width: 260 }}
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
            <div style={{ fontSize: 32, marginBottom: 12, opacity: .3 }}>📚</div>
            <div style={{ fontSize: 14, color: 'var(--c-text3)', lineHeight: 1.7 }}>
              {search ? 'No decks match your search.' : 'No decks saved yet.\nLoad a deck from Moxfield in Setup and save it to the library.'}
            </div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.map(d => (
              <DeckCard key={d.id} deck={d} onDeleted={id => setDecks(prev => prev.filter(x => x.id !== id))} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
