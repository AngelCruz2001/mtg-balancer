import type { Player } from '@/types/deck'
import PlayerZone from './PlayerZone'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MatchTable({ players }: { players: Player[] }) {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">Match Table</h1>
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            ← Back to Setup
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {players.map(p => <PlayerZone key={p.seat} player={p} />)}
      </div>
    </div>
  )
}
