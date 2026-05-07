export interface PlayerScore {
  seat: number
  name: string
  score: number
  summary: string
}

export interface AnalysisReport {
  scores: PlayerScore[]
  explanation: string
}
