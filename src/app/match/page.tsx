'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import MatchTable from '@/components/table/MatchTable'
import AnalyzerPanel from '@/components/analyzer/AnalyzerPanel'

export default function MatchPage() {
  const players = useAppStore(s => s.players)
  const router = useRouter()
  
  // A player is "ready" if they have cards loaded
  const ready = players.filter(p => p.cards.length > 0)

  useEffect(() => {
    // If fewer than 2 players are ready, redirect to setup
    if (ready.length < 2) {
      router.replace('/')
    }
  }, [ready.length, router])

  if (ready.length < 2) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-6 space-y-6">
      <MatchTable players={ready} />
      <AnalyzerPanel />
    </main>
  )
}
