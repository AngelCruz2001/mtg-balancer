'use client'
import { useState } from 'react'
import { useAppStore } from '@/store'
import type { Player } from '@/types/deck'
import type { AnalysisReport } from '@/types/analysis'
import type { SaveMatchPayload } from '@/types/match'
import { PLAYER_ACCENTS } from '@/lib/design'
import BalanceReport from './BalanceReport'
import { Check, Scale } from 'lucide-react'

const LOADING_MSGS = [
  'Mapping synergy vectors…',
  'Reading the mana base…',
  'Weighing threat density…',
  'Consulting the Oracle…',
  'Calculating power spread…',
]

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function SaveMatchForm({ report, players }: { report: AnalysisReport; players: Player[] }) {
  const matchStartAt = useAppStore(s => s.matchStartAt)
  const durationSeconds = matchStartAt ? Math.floor((Date.now() - matchStartAt) / 1000) : 0

  const [winnerSeat, setWinnerSeat] = useState<number | null>(null)
  const [lifeTotals, setLifeTotals] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (winnerSeat == null) return
    setSaving(true)
    setError(null)

    const payload: SaveMatchPayload = {
      winner_seat: winnerSeat,
      duration_seconds: durationSeconds > 0 ? durationSeconds : undefined,
      analysis_explanation: report.explanation,
      players: players.map(p => {
        const score = report.scores.find(s => s.seat === p.seat)
        return {
          seat: p.seat,
          player_name: p.name,
          commander: p.commander,
          colors: p.colors,
          deck_raw: p.deckRaw,
          score: score?.score ?? 0,
          score_summary: score?.summary ?? '',
          life_final: lifeTotals[p.seat] ? parseInt(lifeTotals[p.seat]) : undefined,
        }
      }),
    }

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaved(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div style={{ padding: '16px 20px', borderRadius: 'var(--rad-lg)', background: 'var(--c-green-bg)', border: '1px solid oklch(57% .205 162/.3)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Check size={18} style={{ color: 'var(--c-green-hi)', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--c-green-hi)' }}>Match saved</div>
          <div style={{ fontSize: 12, color: 'var(--c-text3)', marginTop: 2 }}>Find it in History → Match Log</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-sub)', borderRadius: 'var(--rad-lg)', padding: '20px 24px' }}>
      <div className="kicker" style={{ marginBottom: 14 }}>Save this Match</div>

      {/* Winner */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 10 }}>Winner</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {players.map((p, i) => {
            const acc = PLAYER_ACCENTS[i]
            const selected = winnerSeat === p.seat
            return (
              <button
                key={p.seat}
                type="button"
                onClick={() => setWinnerSeat(p.seat)}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--rad)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: selected ? acc.bg : 'var(--c-surface)',
                  border: `1.5px solid ${selected ? acc.c + '88' : 'var(--c-sub)'}`,
                  color: selected ? acc.c : 'var(--c-text2)',
                  transition: 'all var(--dur) var(--ease)',
                }}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Life totals (optional) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 10 }}>
          Final Life Totals <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(players.length, 4)}, 1fr)`, gap: 8 }}>
          {players.map((p, i) => {
            const acc = PLAYER_ACCENTS[i]
            return (
              <div key={p.seat}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: acc.c, marginBottom: 5 }}>{p.name}</div>
                <input
                  className="mtg-input"
                  type="number"
                  placeholder="—"
                  min={-999}
                  max={999}
                  value={lifeTotals[p.seat] ?? ''}
                  onChange={e => setLifeTotals(prev => ({ ...prev, [p.seat]: e.target.value }))}
                  style={{ width: '100%', textAlign: 'center' }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Duration */}
      {durationSeconds > 0 && (
        <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--c-text3)' }}>
          Match duration: <span style={{ color: 'var(--c-text2)', fontWeight: 600 }}>{fmtDuration(durationSeconds)}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--rad)', background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', color: 'oklch(68% .18 20)', fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button
        className="btn-primary"
        onClick={handleSave}
        disabled={winnerSeat == null || saving}
      >
        {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : 'Save Match'}
      </button>
    </div>
  )
}

export default function AnalyzerPanel({ players }: { players: Player[] }) {
  const setBalanceReport = useAppStore(s => s.setBalanceReport)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [msgIdx, setMsgIdx] = useState(0)
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    setStatus('loading')
    setError(null)
    let i = 0
    const interval = setInterval(() => { i++; setMsgIdx(i % LOADING_MSGS.length) }, 600)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      clearInterval(interval)
      setReport(data as AnalysisReport)
      setBalanceReport(data as AnalysisReport)
      setStatus('done')
    } catch (e) {
      clearInterval(interval)
      setError((e as Error).message)
      setStatus('idle')
    }
  }

  return (
    <div className="mtg-panel" style={{ padding: '28px 32px', marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="kicker" style={{ marginBottom: 8 }}>Balance Analysis</div>
          <h2 className="df" style={{ fontSize: 36, color: 'var(--c-text)' }}>Oracle Verdict</h2>
        </div>
        <button
          className={`btn-primary${status === 'idle' ? ' btn-glow' : ''}`}
          onClick={analyze}
          disabled={status === 'loading' || players.length < 2}
        >
          {status === 'loading'
            ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Analyzing…</>
            : status === 'done' ? 'Re-run Analysis' : 'Analyze Balance →'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--rad)', background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', color: 'oklch(68% .18 20)', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {status === 'idle' && !report && (
        <div style={{ border: '1px dashed var(--c-sub)', borderRadius: 'var(--rad-lg)', padding: '32px 24px', textAlign: 'center', color: 'var(--c-text3)' }}>
          <div style={{ marginBottom: 8, opacity: .4, display: 'flex', justifyContent: 'center' }}><Scale size={28} /></div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Run the analysis once the pod looks right.</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            {['Power compression', 'Mana velocity', 'Threat density', 'Synergy ceiling'].map(t => (
              <span key={t} className="badge-muted">{t}</span>
            ))}
          </div>
        </div>
      )}

      {status === 'loading' && (
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

      {status === 'done' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <BalanceReport report={report} animate={true} />
          <SaveMatchForm report={report} players={players} />
        </div>
      )}
    </div>
  )
}
