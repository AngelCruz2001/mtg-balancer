import { describe, it, expect } from 'vitest'
import { buildAnalysisPrompt, parseAnalysisResponse } from './analysis'
import type { Player } from '@/types/deck'

const mockPlayer = (seat: number, name: string): Player => ({
  seat: seat as 1 | 2 | 3 | 4,
  name,
  commander: '',
  colors: [],
  deckRaw: '',
  cards: [
    { quantity: 4, card: { id: 'a', name: 'Lightning Bolt', mana_cost: '{R}', cmc: 1, type_line: 'Instant', colors: ['R'], color_identity: ['R'], prices: { usd: '0.50', eur: null, tix: null }, legalities: {} } },
  ],
  parseErrors: [],
  loading: false,
  error: null,
})

describe('buildAnalysisPrompt', () => {
  it('includes player names and card names', () => {
    const prompt = buildAnalysisPrompt([mockPlayer(1, 'Alice'), mockPlayer(2, 'Bob')])
    expect(prompt).toContain('Alice')
    expect(prompt).toContain('Bob')
    expect(prompt).toContain('Lightning Bolt')
  })

  it('includes JSON shape instruction', () => {
    const prompt = buildAnalysisPrompt([mockPlayer(1, 'Alice'), mockPlayer(2, 'Bob')])
    expect(prompt).toContain('"scores"')
    expect(prompt).toContain('"explanation"')
  })
})

describe('parseAnalysisResponse', () => {
  const validReport = JSON.stringify({
    scores: [
      { seat: 1, name: 'Alice', score: 80, summary: 'Strong aggro deck' },
      { seat: 2, name: 'Bob', score: 60, summary: 'Midrange' },
    ],
    explanation: 'Alice has more efficient spells.',
  })

  it('parses a valid report', () => {
    const report = parseAnalysisResponse(validReport)
    expect(report.scores).toHaveLength(2)
    expect(report.scores[0].name).toBe('Alice')
    expect(report.explanation).toBe('Alice has more efficient spells.')
  })

  it('parses JSON wrapped in markdown code fences', () => {
    const fenced = `\`\`\`json\n${validReport}\n\`\`\``
    const report = parseAnalysisResponse(fenced)
    expect(report.scores).toHaveLength(2)
  })

  it('throws when response has no JSON', () => {
    expect(() => parseAnalysisResponse('Here is my analysis: ...')).toThrow('No JSON')
  })

  it('throws when scores field is missing', () => {
    expect(() =>
      parseAnalysisResponse(JSON.stringify({ explanation: 'text' }))
    ).toThrow()
  })

  it('throws when explanation is not a string', () => {
    expect(() =>
      parseAnalysisResponse(JSON.stringify({ scores: [], explanation: 42 }))
    ).toThrow()
  })
})
