'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserMenu } from '@/components/ui/user-menu'

interface LeaderboardEntry {
  player_name: string
  matches: number
  wins: number
  win_rate: number
  avg_score: number
  top_commander: string | null
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setEntries(d) : setError(d.error ?? 'Failed to load'))
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

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
        </div>
        <UserMenu />
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        <div style={{ marginBottom: 36 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>All time</div>
          <h1 className="df" style={{ fontSize: 48, color: 'var(--c-text)', marginBottom: 8 }}>Leaderboard</h1>
          <p style={{ color: 'var(--c-text2)', fontSize: 15 }}>Ranked by wins across all recorded matches.</p>
        </div>

        {loading && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--c-text3)' }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 14px' }} />
            <div style={{ fontSize: 14 }}>Loading stats…</div>
          </div>
        )}

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 'var(--rad)', background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', color: 'oklch(68% .18 20)', fontSize: 14 }}>
            {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: .3 }}>🏆</div>
            <div style={{ fontSize: 14, color: 'var(--c-text3)', lineHeight: 1.7 }}>No matches recorded yet.<br />Save a match result to start tracking stats.</div>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map((e, i) => {
              const isTop = i < 3
              const barWidth = entries[0].wins > 0 ? (e.wins / entries[0].wins) * 100 : 0
              return (
                <div
                  key={e.player_name}
                  className="mtg-panel"
                  style={{
                    padding: '18px 22px',
                    borderLeft: isTop ? `3px solid ${['oklch(80% .20 82)', 'oklch(72% .14 250)', 'oklch(62% .18 50)'][i]}` : '3px solid var(--c-sub)',
                    animation: `fadeUp 300ms ${i * 60}ms var(--ease) both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {/* Rank */}
                    <div style={{ minWidth: 36, textAlign: 'center' }}>
                      {i < 3 ? (
                        <span style={{ fontSize: 22 }}>{MEDALS[i]}</span>
                      ) : (
                        <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: 'var(--c-text3)' }}>#{i + 1}</span>
                      )}
                    </div>

                    {/* Name + commander */}
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{e.player_name}</div>
                      {e.top_commander && (
                        <div style={{ fontSize: 11, color: 'var(--c-gold)', fontStyle: 'italic', fontFamily: "var(--font-cormorant), serif" }}>
                          {e.top_commander}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                      {[
                        { l: 'Wins', v: e.wins, hi: true },
                        { l: 'Matches', v: e.matches },
                        { l: 'Win %', v: `${e.win_rate}%` },
                        { l: 'Avg Score', v: e.avg_score },
                      ].map(({ l, v, hi }) => (
                        <div key={l} style={{ textAlign: 'center', minWidth: 52 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 3 }}>{l}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: hi ? 'var(--c-green-hi)' : 'var(--c-text)' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Win bar */}
                  <div style={{ marginTop: 14, height: 3, borderRadius: 99, background: 'var(--c-sub)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barWidth}%`, background: isTop ? 'var(--c-green)' : 'var(--c-sub)', borderRadius: 99, transition: 'width 1s var(--ease)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
