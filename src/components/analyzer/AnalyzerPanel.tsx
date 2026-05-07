'use client'
import { useState } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import type { AnalysisReport } from '@/types/analysis'
import { Loader2, BarChart2, AlertCircle } from 'lucide-react'
import BalanceReport from './BalanceReport'

export default function AnalyzerPanel() {
  const players = useAppStore(s => s.players.filter(p => p.cards.length > 0))
  const setBalanceReport = useAppStore(s => s.setBalanceReport)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AnalysisReport | null>(null)

  async function analyze() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setReport(data as AnalysisReport)
      setBalanceReport(data as AnalysisReport)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl bg-black/40 backdrop-blur-md border border-white/10 p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-white text-xl font-semibold flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-green-400" />
            Balance Analysis
          </h2>
          <p className="text-white/40 text-xs">AI-powered deck comparison and fairness report</p>
        </div>
        <Button
          onClick={analyze}
          disabled={loading || players.length < 2}
          className="bg-green-600 hover:bg-green-500 text-white border-none"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Analyzing...
            </>
          ) : (
            'Analyze Balance'
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {report ? (
        <BalanceReport report={report} />
      ) : (
        !loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-white/5 rounded-lg">
            <BarChart2 className="h-10 w-10 text-white/10" />
            <div className="space-y-1">
              <p className="text-white/40 text-sm">Ready to compare {players.length} decks</p>
              <p className="text-white/20 text-xs text-balance max-w-[280px]">
                Claude will analyze card synergies, power levels, and win conditions to find imbalances.
              </p>
            </div>
          </div>
        )
      )}

      {loading && !report && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-green-500/20 animate-pulse rounded-full" />
            <Loader2 className="h-12 w-12 text-green-500 animate-spin relative" />
          </div>
          <div className="space-y-1">
            <p className="text-white/60 font-medium">Reading decklists...</p>
            <p className="text-white/30 text-xs">This usually takes about 10-15 seconds</p>
          </div>
        </div>
      )}
    </div>
  )
}
