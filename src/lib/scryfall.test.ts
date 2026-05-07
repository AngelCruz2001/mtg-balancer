import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetchCard before importing fetchDeck
vi.mock('./scryfall', async importOriginal => {
  const mod = await importOriginal<typeof import('./scryfall')>()
  return {
    ...mod,
    fetchCard: vi.fn(),
  }
})

import { fetchDeck, fetchCard } from './scryfall'
import type { ScryfallCard } from '@/types/card'

const mockCard = (name: string): ScryfallCard => ({
  id: name,
  name,
  mana_cost: '{1}',
  cmc: 1,
  type_line: 'Instant',
  colors: [],
  color_identity: [],
  prices: { usd: null, eur: null, tix: null },
  legalities: {},
})

beforeEach(() => vi.clearAllMocks())

describe('fetchDeck', () => {
  it('returns resolved cards and no errors for valid lines', async () => {
    vi.mocked(fetchCard).mockResolvedValue(mockCard('Lightning Bolt'))
    const { cards, errors } = await fetchDeck(['4 Lightning Bolt'])
    expect(cards).toHaveLength(1)
    expect(cards[0].quantity).toBe(4)
    expect(errors).toHaveLength(0)
  })

  it('collects errors for failed card lookups and still returns valid cards', async () => {
    vi.mocked(fetchCard)
      .mockResolvedValueOnce(mockCard('Lightning Bolt'))
      .mockRejectedValueOnce(new Error('Card not found: Fake Card'))
    const { cards, errors } = await fetchDeck(['4 Lightning Bolt', '1 Fake Card'])
    expect(cards).toHaveLength(1)
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe('1 Fake Card')
    expect(errors[0].reason).toContain('Card not found')
  })

  it('skips blank lines and lines without a leading quantity', async () => {
    vi.mocked(fetchCard).mockResolvedValue(mockCard('Sol Ring'))
    const { cards } = await fetchDeck(['', '  ', '1 Sol Ring', 'No quantity here'])
    expect(cards).toHaveLength(1)
  })
})
