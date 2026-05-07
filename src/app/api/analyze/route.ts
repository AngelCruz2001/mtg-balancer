import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import type { Player } from '@/types/deck'
import { buildAnalysisPrompt, parseAnalysisResponse } from '@/lib/analysis'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function isValidPlayer(p: unknown): p is Player {
  if (typeof p !== 'object' || p === null) return false
  const player = p as Record<string, unknown>
  return (
    typeof player.seat === 'number' &&
    typeof player.name === 'string' &&
    typeof player.deckRaw === 'string' &&
    Array.isArray(player.cards)
  )
}

function isValidAnalysisRequest(body: unknown): body is { players: Player[] } {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return Array.isArray(b.players) && b.players.every(isValidPlayer)
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isValidAnalysisRequest(body)) {
    return NextResponse.json(
      { error: 'Request must include players array with at least one valid player' },
      { status: 422 }
    )
  }

  const { players } = body

  if (players.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildAnalysisPrompt(players) }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const report = parseAnalysisResponse(content.text)
    return NextResponse.json(report)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
