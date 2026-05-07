import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import type { Player } from '@/types/deck'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function buildPrompt(players: Player[]): string {
  const sections = players.map(p => {
    const cardList = p.cards
      .map(dc => `${dc.quantity}x ${dc.card.name} (CMC ${dc.card.cmc}, ${dc.card.type_line})`)
      .join('\n')
    return `## ${p.name} (Seat ${p.seat})\n${cardList}`
  }).join('\n\n')

  return `You are an expert Magic: The Gathering judge analyzing deck balance for a casual multiplayer match.

${sections}

Analyze these decks and respond with ONLY valid JSON in this exact shape:
{
  "scores": [
    { "seat": 1, "name": "Player1", "score": 75, "summary": "One-sentence verdict" },
    ...
  ],
  "explanation": "2-4 paragraphs of markdown explaining the power differential, key cards driving imbalance, and suggestions for fair play"
}

Scores are integers 0-100. Higher = stronger deck. Be concise and fair.`
}

export async function POST(req: Request) {
  try {
    const { players } = (await req.json()) as { players: Player[] }

    if (!players || players.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(players) }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const text = content.text
    // Try to find JSON in the response if it's wrapped in markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : text
    const result = JSON.parse(jsonString)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
