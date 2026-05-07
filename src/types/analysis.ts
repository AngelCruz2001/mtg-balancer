export interface PlayerScore {
  seat: number
  name: string
  score: number      // integer 0–100
  summary: string    // one-sentence verdict
}

export interface AnalysisReport {
  scores: PlayerScore[]
  explanation: string  // markdown
}
