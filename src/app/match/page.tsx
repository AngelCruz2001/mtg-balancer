'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scale } from 'lucide-react'
import { useAppStore } from '@/store'
import MatchTable, { MatchNav } from '@/components/table/MatchTable'
import AnalyzerPanel from '@/components/analyzer/AnalyzerPanel'
import CardLookupModal from '@/components/modals/CardLookupModal'
import HistoryPanel from '@/components/modals/HistoryPanel'
import RulesJudgePanel from '@/components/modals/RulesJudgePanel'

function useElapsed(startAt: number | null): string {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!startAt) return '0:00'
  const secs = Math.floor((now - startAt) / 1000)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MatchPage() {
  const players = useAppStore(s => s.players)
  const matchStartAt = useAppStore(s => s.matchStartAt)
  const setMatchStartAt = useAppStore(s => s.setMatchStartAt)
  const router = useRouter()
  const [showLookup, setShowLookup] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showJudge, setShowJudge] = useState(false)

  const ready = players.filter(p => p.cards.length > 0)
  const elapsed = useElapsed(matchStartAt)

  useEffect(() => {
    if (ready.length < 2) router.replace('/')
  }, [ready.length, router])

  useEffect(() => {
    if (!matchStartAt) setMatchStartAt(Date.now())
  }, [matchStartAt, setMatchStartAt])

  if (ready.length < 2) return null

  return (
    <div className="afu" style={{ overflowX: 'hidden' }}>
      <MatchNav
        playerCount={ready.length}
        elapsed={elapsed}
        onBack={() => router.push('/')}
        onLookup={() => setShowLookup(true)}
        onHistory={() => setShowHistory(true)}
      />
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 24px 48px' }}>
        <MatchTable players={ready} />
        <AnalyzerPanel players={ready} />
      </div>
      {showLookup && <CardLookupModal onClose={() => setShowLookup(false)} />}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      {showJudge && <RulesJudgePanel players={ready} onClose={() => setShowJudge(false)} />}

      {/* Rules Judge FAB */}
      <button
        onClick={() => setShowJudge(true)}
        title="Ask the Judge"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 80,
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: 'var(--c-gold)',
          color: 'oklch(15% 0.05 82)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px -4px oklch(73% .17 82 / .55)',
          transition: 'all 220ms cubic-bezier(0.16,1,0.3,1)',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.transform = 'scale(1.08) translateY(-2px)'
          el.style.boxShadow = '0 8px 28px -6px oklch(73% .17 82 / .7)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.transform = ''
          el.style.boxShadow = '0 4px 20px -4px oklch(73% .17 82 / .55)'
        }}
      >
        <Scale size={22} />
      </button>
    </div>
  )
}
