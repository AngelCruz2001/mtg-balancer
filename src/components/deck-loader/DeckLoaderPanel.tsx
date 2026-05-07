'use client'
import { useAppStore } from '@/store'
import PlayerSlot from './PlayerSlot'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const SEATS = [1, 2, 3, 4] as const

export default function DeckLoaderPanel() {
  const players = useAppStore(s => s.players)
  const router = useRouter()
  const readyCount = players.filter(p => p.cards.length > 0).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SEATS.map(seat => <PlayerSlot key={seat} seat={seat} />)}
      </div>
      <div className="flex justify-center">
        <Button
          size="lg"
          disabled={readyCount < 2}
          onClick={() => router.push('/match')}
        >
          Start Match →
        </Button>
      </div>
    </div>
  )
}
