import ReactMarkdown from 'react-markdown'

interface Score {
  seat: number
  name: string
  score: number
  summary: string
}

interface ReportProps {
  report: {
    scores: Score[]
    explanation: string
  }
}

export default function BalanceReport({ report }: ReportProps) {
  return (
    <div className="space-y-6">
      {/* Per-player power bars */}
      <div className="space-y-4">
        {report.scores.map(s => (
          <div key={s.seat} className="space-y-1.5">
            <div className="flex justify-between text-white text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="font-mono text-white/60">{s.score}/100</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${s.score}%` }}
              />
            </div>
            <p className="text-white/40 text-xs italic">{s.summary}</p>
          </div>
        ))}
      </div>

      {/* Explanation markdown */}
      <div className="prose prose-invert prose-sm max-w-none text-white/80 border-t border-white/5 pt-6">
        <ReactMarkdown>{report.explanation}</ReactMarkdown>
      </div>
    </div>
  )
}
