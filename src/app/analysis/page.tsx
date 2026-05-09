'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ColorPips } from '@/components/ui/color-pips'
import { UserMenu } from '@/components/ui/user-menu'
import BalanceReport from '@/components/analyzer/BalanceReport'
import { fetchDeck } from '@/lib/scryfall'
import { Scale, Trophy, Swords, AlertTriangle } from 'lucide-react'
import type { SavedDeck } from '@/types/match'
import type { Player, PlayerSeat } from '@/types/deck'
import type { AnalysisReport } from '@/types/analysis'

const LOADING_MSGS = [
  'Mapping synergy vectors…',
  'Reading the mana base…',
  'Weighing threat density…',
  'Consulting the Oracle…',
  'Calculating power spread…',
]

function DeckSummaryCard({ deck }: { deck: SavedDeck }) {
  const lineCount = deck.deck_raw.split('\n').filter(l => l.trim().match(/^\d+/)).length
  return (
    <div className="mtg-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deck.name}</div>
      {deck.commander && (
        <div style={{ fontSize: 12, color: 'var(--c-gold)', fontStyle: 'italic', fontFamily: "var(--font-cormorant), serif" }}>{deck.commander}</div>
      )}
      {(deck.colors?.length ?? 0) > 0 && <ColorPips colors={deck.colors!} size={15} />}
      <div style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 2 }}>{lineCount} cards</div>
    </div>
  )
}

function AnalysisContent() {
  const router = useRouter()
  const params = useSearchParams()
  const deckIds = (params.get('decks') ?? '').split(',').filter(Boolean)

  const [decks, setDecks] = useState<SavedDeck[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading-decks' | 'ready' | 'analyzing' | 'done' | 'error'>('loading-decks')
  const [msgIdx, setMsgIdx] = useState(0)
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  useEffect(() => {
    if (deckIds.length < 2) {
      setLoadError('Select at least 2 decks from the library to compare.')
      setStatus('error')
      return
    }
    fetch('/api/decks')
      .then(r => r.json())
      .then((all: SavedDeck[]) => {
        const found = deckIds.map(id => all.find(d => d.id === id)).filter(Boolean) as SavedDeck[]
        if (found.length < 2) {
          setLoadError('Could not find the selected decks. They may have been deleted.')
          setStatus('error')
        } else {
          setDecks(found)
          setStatus('ready')
        }
      })
      .catch(() => {
        setLoadError('Network error loading decks.')
        setStatus('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runAnalysis() {
    setStatus('analyzing')
    setAnalyzeError(null)

    let tick = 0
    const interval = setInterval(() => { tick++; setMsgIdx(tick % LOADING_MSGS.length) }, 650)

    try {
      const players: Player[] = await Promise.all(
        decks.map(async (deck, i) => {
          const lines = deck.deck_raw.split('\n')
          const { cards, errors } = await fetchDeck(lines)
          return {
            seat: (i + 1) as PlayerSeat,
            name: deck.name,
            commander: deck.commander ?? '',
            colors: deck.colors ?? [],
            deckRaw: deck.deck_raw,
            cards,
            parseErrors: errors,
            loading: false,
            error: null,
          }
        })
      )

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players }),
      })
      const data = await res.json()
      clearInterval(interval)
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed')
      setReport(data as AnalysisReport)
      setStatus('done')
    } catch (e) {
      clearInterval(interval)
      setAnalyzeError((e as Error).message)
      setStatus('ready')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {/* Nav */}
      <header style={{ height: 58, background: 'var(--c-surface)', borderBottom: '1px solid var(--c-sub)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, overflow: 'hidden' }}>
          <button className="btn-ghost" onClick={() => router.push('/decks')} style={{ padding: '7px 12px', fontSize: 13 }}>← Library</button>
          <div style={{ width: 1, height: 20, background: 'var(--c-sub)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--c-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(10% 0.025 162)' }}><Scale size={13} /></div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Deck Balancer</span>
          </div>
          <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => router.push('/leaderboard')}><Trophy size={13} /> Leaderboard</button>
        </div>
        <UserMenu />
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        <div style={{ marginBottom: 32 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>Balance Check</div>
          <h1 className="df" style={{ fontSize: 44, color: 'var(--c-text)', marginBottom: 8 }}>Deck Analysis</h1>
          <p style={{ color: 'var(--c-text2)', fontSize: 15 }}>Claude evaluates the selected decks and scores their relative power level.</p>
        </div>

        {/* Loading decks */}
        {status === 'loading-decks' && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--c-text3)' }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 14px' }} />
            <div style={{ fontSize: 14 }}>Loading decks…</div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 18px', borderRadius: 'var(--rad)', background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', color: 'oklch(68% .18 20)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={16} />
              {loadError}
            </div>
            <button className="btn-ghost" style={{ fontSize: 13, alignSelf: 'flex-start' }} onClick={() => router.push('/decks')}>← Back to Library</button>
          </div>
        )}

        {/* Ready + Analyzing + Done */}
        {(status === 'ready' || status === 'analyzing' || status === 'done') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Deck grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {decks.map(d => <DeckSummaryCard key={d.id} deck={d} />)}
            </div>

            {/* Analyze button / error */}
            {analyzeError && (
              <div style={{ padding: '12px 16px', borderRadius: 'var(--rad)', background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', color: 'oklch(68% .18 20)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} />{analyzeError}
              </div>
            )}

            {status !== 'done' && (
              <button
                className={`btn-primary${status === 'ready' ? ' btn-glow' : ''}`}
                style={{ fontSize: 14, alignSelf: 'flex-start', padding: '10px 22px' }}
                disabled={status === 'analyzing'}
                onClick={runAnalysis}
              >
                {status === 'analyzing'
                  ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Analyzing…</>
                  : <><Swords size={14} /> Analyze with Claude</>}
              </button>
            )}

            {/* Spinner + rotating messages while analyzing */}
            {status === 'analyzing' && (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--c-green-bg)', animation: 'mtg-pulse 1.5s ease infinite' }} />
                  <div style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', background: 'var(--c-green-bg)', border: '1px solid oklch(57% .205 162 / .3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 24, height: 24, border: '2px solid var(--c-sub)', borderTopColor: 'var(--c-green)', borderRadius: '50%', animation: 'mtg-spin .75s linear infinite' }} />
                  </div>
                </div>
                <div className="df" style={{ fontSize: 28, color: 'var(--c-text)', marginBottom: 6 }}>Consulting the Oracle…</div>
                <div style={{ fontSize: 13, color: 'var(--c-text3)', animation: 'mtg-pulse 1s ease infinite' }}>{LOADING_MSGS[msgIdx]}</div>
              </div>
            )}

            {/* Result */}
            {status === 'done' && report && (
              <div className="mtg-panel" style={{ padding: '28px 32px' }}>
                <div style={{ marginBottom: 24 }}>
                  <div className="kicker" style={{ marginBottom: 8 }}>Oracle Verdict</div>
                  <h2 className="df" style={{ fontSize: 32, color: 'var(--c-text)' }}>Balance Report</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <BalanceReport report={report} animate />
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 13, alignSelf: 'flex-start', marginTop: 4 }}
                    onClick={runAnalysis}
                  >
                    <Swords size={13} /> Re-run Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text3)' }}>
        <div className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  )
}
