import type { DeckCard } from '@/types/card'
import Image from 'next/image'

function getImageUrl(card: DeckCard['card']): string {
  return (
    card.image_uris?.small ??
    card.card_faces?.[0]?.image_uris?.small ??
    ''
  )
}

export default function CardGrid({ cards }: { cards: DeckCard[] }) {
  const flat = cards.flatMap(dc => Array(dc.quantity).fill(dc.card))

  return (
    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
      {flat.map((card, i) => {
        const src = getImageUrl(card)
        if (!src) return null
        return (
          <div key={`${card.id}-${i}`} className="flex-shrink-0 relative w-[60px] h-[84px] rounded overflow-hidden hover:scale-110 transition-transform cursor-pointer">
            <Image 
              src={src} 
              alt={card.name} 
              fill 
              className="object-cover" 
              unoptimized 
              sizes="60px"
            />
          </div>
        )
      })}
    </div>
  )
}
