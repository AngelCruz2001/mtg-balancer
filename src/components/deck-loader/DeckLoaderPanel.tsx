'use client'
import { useAppStore } from '@/store'
import PlayerSlot from './PlayerSlot'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const SEATS = [1, 2, 3, 4] as const

export default function DeckLoaderPanel() {
  const players = useAppStore(s => s.players)
  const router = useRouter()
  
  // A seat is ready if it has at least one card loaded
  const readyCount = players.filter(p => p.cards.length > 0).length

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SEATS.map(seat => (
          <PlayerSlot key={seat} seat={seat} />
        ))}
      </div>
      
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          disabled={readyCount < 2}
          onClick={() => router.push('/match')}
          className="px-12 py-6 text-lg"
        >
          {readyCount < 2 ? 'Load at least 2 decks to start' : 'Start Match →'}
        </Button>
      </div>
    </div>
  )
}
