export interface ScryfallCard {
  id: string
  name: string
  mana_cost: string
  cmc: number
  type_line: string
  colors: string[]
  color_identity: string[]
  image_uris?: { small: string; normal: string; large: string; art_crop: string }
  oracle_text?: string
  card_faces?: Array<{ image_uris?: { small: string; normal: string; large: string; art_crop: string }; oracle_text?: string }>
  prices: { usd: string | null; eur: string | null; tix: string | null }
  legalities: Record<string, string>
}

export interface DeckCard {
  quantity: number
  card: ScryfallCard
}
