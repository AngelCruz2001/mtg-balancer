import type { Player } from '@/types/deck'
import CardGrid from './CardGrid'

export default function PlayerZone({ player }: { player: Player }) {
  // Build mana curve: CMC 0-7+
  const curve = Array(8).fill(0)
  player.cards.forEach(dc => {
    // Only count non-land cards for the mana curve usually, 
    // but the ticket says group cards by CMC. 
    // Often lands are CMC 0, but some cards might have higher CMC.
    // We'll stick to the provided implementation notes.
    const bucket = Math.min(Math.floor(dc.card.cmc || 0), 7)
    curve[bucket] += dc.quantity
  })
  const maxCount = Math.max(...curve, 1)

  return (
    <div className="rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">{player.name}</h2>
        <span className="text-white/60 text-sm">
          {player.cards.reduce((s, dc) => s + dc.quantity, 0)} cards
        </span>
      </div>

      {/* Mana curve */}
      <div className="flex items-end gap-1 h-12">
        {curve.map((count, cmc) => (
          <div key={cmc} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-blue-500 rounded-t transition-all"
              style={{ height: `${(count / maxCount) * 100}%` }}
            />
            <span className="text-white/40 text-[10px]">{cmc === 7 ? '7+' : cmc}</span>
          </div>
        ))}
      </div>

      <CardGrid cards={player.cards} />
    </div>
  )
}
