import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface SelectedCard {
  name: string
  type_line: string
  mana_cost?: string
  oracle_text?: string
  owner: string
}

function isValidBody(b: unknown): b is { cards: SelectedCard[]; question: string } {
  if (typeof b !== 'object' || b === null) return false
  const body = b as Record<string, unknown>
  return typeof body.question === 'string' && Array.isArray(body.cards)
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!isValidBody(body)) {
    return new Response('Body must include question (string) and cards (array)', { status: 422 })
  }

  const { cards, question } = body

  if (!question.trim()) {
    return new Response('Question is required', { status: 422 })
  }

  const cardContext = cards.length > 0
    ? cards
        .map(c =>
          `- **${c.name}** (${c.owner}) — ${c.type_line}${c.mana_cost ? `  ${c.mana_cost}` : ''}\n  ${c.oracle_text ?? '(no oracle text)'}`,
        )
        .join('\n')
    : null

  const prompt = [
    'You are a Magic: The Gathering rules judge assisting players mid-game in a Commander pod.',
    'Be concise, precise, and practical. Reference card oracle text directly.',
    '',
    cardContext ? `Cards in question:\n${cardContext}\n` : '',
    `Player question: ${question}`,
    '',
    'Answer clearly. If a specific rule number is relevant, mention it briefly. Keep the response short enough to read at the table.',
  ]
    .filter(l => l !== null)
    .join('\n')

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(enc.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
    cancel() {
      stream.abort()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
