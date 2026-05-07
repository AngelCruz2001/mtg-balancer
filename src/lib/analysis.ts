import type { Player } from '@/types/deck'
import type { AnalysisReport } from '@/types/analysis'

export function buildAnalysisPrompt(players: Player[]): string {
  const sections = players
    .map(p => {
      const cardList = p.cards
        .map(dc => `${dc.quantity}x ${dc.card.name} (CMC ${dc.card.cmc}, ${dc.card.type_line})`)
        .join('\n')
      return `## ${p.name} (Seat ${p.seat})\n${cardList}`
    })
    .join('\n\n')

  return `You are an expert Magic: The Gathering judge analyzing deck balance for a casual multiplayer match.

${sections}

Analyze these decks and respond with ONLY valid JSON in this exact shape:
{
  "scores": [
    { "seat": 1, "name": "Player1", "score": 75, "summary": "One-sentence verdict" }
  ],
  "explanation": "2-4 paragraphs of markdown explaining the power differential, key cards driving imbalance, and suggestions for fair play"
}

Scores are integers 0-100. Higher = stronger deck. Be concise and fair.`
}

export function parseAnalysisResponse(text: string): AnalysisReport {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON object found in analysis response')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('Analysis response contained invalid JSON')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>).scores) ||
    typeof (parsed as Record<string, unknown>).explanation !== 'string'
  ) {
    throw new Error('Analysis response missing required "scores" array or "explanation" string')
  }

  const report = parsed as AnalysisReport

  for (const score of report.scores) {
    if (
      typeof score.seat !== 'number' ||
      typeof score.name !== 'string' ||
      typeof score.score !== 'number' ||
      typeof score.summary !== 'string'
    ) {
      throw new Error('Analysis response contains a malformed score entry')
    }
  }

  return report
}
