'use client'
import { useEffect, useState } from 'react'
import type { Match } from '@/types/match'
import { PLAYER_ACCENTS } from '@/lib/design'
import ReactMarkdown from 'react-markdown'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDuration(secs: number | null): string {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function MatchCard({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false)
  const winner = match.match_players.find(p => p.seat === match.winner_seat)
  const sorted = [...match.match_players].sort((a, b) => a.seat - b.seat)

  return (
    <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-sub)', borderRadius: 'var(--rad-lg)', overflow: 'hidden' }}>
      <div
        style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', whiteSpace: 'nowrap' }}>{fmtDate(match.played_at)}</span>
            {winner && (
              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', background: 'var(--c-green-bg)', border: '1px solid oklch(57% .205 162/.3)', color: 'var(--c-green-hi)', whiteSpace: 'nowrap' }}>
                🏆 {winner.player_name}
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--c-text3)' }}>⏱ {fmtDuration(match.duration_seconds)}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {sorted.map((p, i) => {
              const acc = PLAYER_ACCENTS[i]
              return (
                <span key={p.seat} style={{ fontSize: 11, color: acc.c, fontWeight: 500 }}>
                  {p.player_name}{p.commander ? ` · ${p.commander}` : ''}
                  {p.score != null ? <span style={{ color: 'var(--c-text3)' }}> ({p.score})</span> : null}
                </span>
              )
            })}
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--c-text3)', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--c-sub)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Player details */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(sorted.length, 2)}, 1fr)`, gap: 8 }}>
            {sorted.map((p, i) => {
              const acc = PLAYER_ACCENTS[i]
              return (
                <div key={p.seat} style={{ padding: '10px 14px', background: 'var(--c-bg)', borderRadius: 'var(--rad)', border: `1px solid ${acc.c}33` }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: acc.c, marginBottom: 3 }}>{p.player_name}</div>
                  {p.commander && <div style={{ fontSize: 11, color: 'var(--c-gold)', fontStyle: 'italic', marginBottom: 3 }}>{p.commander}</div>}
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--c-text3)' }}>
                    {p.score != null && <span>Score: <b style={{ color: 'var(--c-text2)' }}>{p.score}</b></span>}
                    {p.life_final != null && <span>Life: <b style={{ color: 'var(--c-text2)' }}>{p.life_final}</b></span>}
                  </div>
                  {p.score_summary && <p style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 4, lineHeight: 1.4 }}>{p.score_summary}</p>}
                </div>
              )
            })}
          </div>

          {/* Analysis */}
          {match.analysis_explanation && (
            <div>
              <div className="kicker" style={{ marginBottom: 8, fontSize: 9 }}>Claude Analysis</div>
              <div style={{ fontSize: 12, color: 'var(--c-text3)', lineHeight: 1.7 }}>
                <ReactMarkdown>{match.analysis_explanation}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setMatches(data)
        else setError(data.error ?? 'Failed to load')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="modal-bg" style={{ justifyContent: 'flex-end', alignItems: 'stretch', background: 'oklch(0% 0 0 / .4)' }} onClick={onClose} />
      <div className="side-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 5 }}>Session Log</div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Match History</h2>
          </div>
          <button className="btn-icon" style={{ flexShrink: 0 }} onClick={onClose}>✕</button>
        </div>

        {loading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--c-text3)', fontSize: 13 }}>
            <div className="spinner" style={{ width: 20, height: 20, margin: '0 auto 12px' }} />
            Loading history…
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 14px', borderRadius: 'var(--rad)', background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', color: 'oklch(68% .18 20)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: .3 }}>📋</div>
            <div style={{ fontSize: 13, color: 'var(--c-text3)', lineHeight: 1.6 }}>
              No matches recorded yet.
              <br />Run an analysis and save the result.
            </div>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </div>
    </>
  )
}
