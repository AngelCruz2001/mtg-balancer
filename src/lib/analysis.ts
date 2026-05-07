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
  // Strip markdown code fences if the model wraps JSON in them
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON object found in analysis response')
  }
  const parsed = JSON.parse(jsonMatch[0]) as AnalysisReport
  if (!Array.isArray(parsed.scores) || typeof parsed.explanation !== 'string') {
    throw new Error('Analysis response does not match expected AnalysisReport shape')
  }
  return parsed
}
