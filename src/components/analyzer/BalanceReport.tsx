'use client'
import { ScoreBar } from '@/components/ui/score-bar'
import { CountUp } from '@/components/ui/count-up'
import { RadarChart } from '@/components/ui/radar-chart'
import type { AnalysisReport, PlayerScore } from '@/types/analysis'
import ReactMarkdown from 'react-markdown'
import { AlertTriangle, Scale } from 'lucide-react'

function ScoreCard({ score, idx, animate }: { score: PlayerScore; idx: number; animate: boolean }) {
  const sc = score.score
  const color = sc >= 75 ? 'oklch(62% .20 20)' : sc >= 60 ? 'var(--c-green)' : 'var(--c-gold)'
  const labelBg = sc >= 75 ? 'oklch(18% .08 20/.2)' : sc >= 60 ? 'var(--c-green-bg)' : 'var(--c-gold-bg)'
  const labelBorder = sc >= 75 ? 'oklch(62% .20 20/.3)' : sc >= 60 ? 'oklch(57% .205 162/.3)' : 'oklch(73% .17 82/.3)'
  const labelColor = sc >= 75 ? 'oklch(68% .18 20)' : sc >= 60 ? 'var(--c-green-hi)' : 'var(--c-gold)'
  const label = sc >= 75 ? 'Overpowered' : sc >= 60 ? 'Balanced' : 'Underpowered'

  return (
    <div style={{
      padding: '16px 20px', background: 'var(--c-bg)', border: '1px solid var(--c-sub)', borderRadius: 'var(--rad)',
      display: 'flex', gap: 16, alignItems: 'flex-start',
      animation: animate ? `fadeUp 350ms ${idx * 120}ms var(--ease) both` : 'none',
    }}>
      <div style={{ minWidth: 56 }}>
        <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, color, fontFamily: 'monospace' }}>
          {animate ? <CountUp to={sc} duration={1200} /> : sc}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--c-text3)', marginTop: 2 }}>/ 100</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{score.name}</span>
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '.05em', background: labelBg, border: `1px solid ${labelBorder}`, color: labelColor }}>{label}</span>
        </div>
        <ScoreBar score={sc} animate={animate} />
        {score.summary && <p style={{ marginTop: 7, fontSize: 12, color: 'var(--c-text3)', lineHeight: 1.5 }}>{score.summary}</p>}
      </div>
    </div>
  )
}

export default function BalanceReport({ report, animate = false }: { report: AnalysisReport; animate?: boolean }) {
  const sorted = [...report.scores].sort((a, b) => b.score - a.score)
  const allScores = report.scores.map(s => s.score)
  const spread = Math.max(...allScores) - Math.min(...allScores)

  const verdictBg = spread > 22 ? 'oklch(18% .08 20/.18)' : spread > 10 ? 'var(--c-gold-bg)' : 'var(--c-green-bg)'
  const verdictBorder = spread > 22 ? 'oklch(62% .20 20/.3)' : spread > 10 ? 'oklch(73% .17 82/.3)' : 'oklch(57% .205 162/.3)'
  const verdict = spread <= 10
    ? `Pod looks well-matched — only a ${spread}-point spread.`
    : spread <= 22
    ? `${sorted[0]?.name} has a meaningful edge. The spread is ${spread} points.`
    : `${sorted[0]?.name}'s deck significantly outpaces the table — ${spread}-point spread.`

  const radarPlayers = sorted.map(s => ({ name: s.name }))

  return (
    <div className="afu" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Verdict banner */}
      <div style={{ padding: '16px 22px', borderRadius: 'var(--rad-lg)', background: verdictBg, border: `1px solid ${verdictBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        {spread > 22 ? <AlertTriangle size={20} style={{ flexShrink: 0 }} /> : <Scale size={20} style={{ flexShrink: 0 }} />}
        <span style={{ fontWeight: 500, fontSize: 15, color: 'var(--c-text)' }}>{verdict}</span>
      </div>

      {/* Radar + scores */}
      <div style={{ display: 'grid', gridTemplateColumns: report.scores.length <= 2 ? '280px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
        {report.scores.length <= 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 8 }}>
            <RadarChart players={radarPlayers} size={220} />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {sorted.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--c-text2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ['oklch(65% .22 162)', 'oklch(72% .17 82)'][i] }} />
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map((s, i) => <ScoreCard key={s.seat} score={s} idx={i} animate={animate} />)}
        </div>
      </div>

      {report.scores.length > 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 4 }}>
          <RadarChart players={radarPlayers} size={260} />
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {sorted.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--c-text2)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ['oklch(65% .22 162)', 'oklch(72% .17 82)', 'oklch(62% .18 220)', 'oklch(62% .20 20)'][i] }} />
                {s.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div style={{ background: 'var(--c-bg)', border: '1px solid var(--c-sub)', borderRadius: 'var(--rad)', padding: '16px 20px' }}>
        <div className="kicker" style={{ marginBottom: 10 }}>Analysis</div>
        <div style={{ fontSize: 13, color: 'var(--c-text2)', lineHeight: 1.75 }}>
          <ReactMarkdown>{report.explanation}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
