'use client'
import { useState } from 'react'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import type { PlayerSeat } from '@/types/deck'

export default function PlayerSlot({ seat }: { seat: PlayerSeat }) {
  const [name, setName] = useState(`Player ${seat}`)
  const [raw, setRaw] = useState('')
  const addPlayer = useAppStore(s => s.addPlayer)
  const loadDeck = useAppStore(s => s.loadDeck)
  const player = useAppStore(s => s.players.find(p => p.seat === seat))

  async function handleLoad() {
    addPlayer(seat, name)
    await loadDeck(seat, raw)
  }

  const totalCards = player?.cards.reduce((sum, dc) => sum + dc.quantity, 0) ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Seat {seat}
          {totalCards > 0 && <Badge variant="secondary">{totalCards} cards</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Player name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <Textarea
          placeholder={"4 Lightning Bolt\n20 Mountain\n..."}
          rows={8}
          value={raw}
          onChange={e => setRaw(e.target.value)}
          className="font-mono text-sm"
        />
        {player?.error && (
          <p className="text-destructive text-sm">{player.error}</p>
        )}
        <Button
          className="w-full"
          onClick={handleLoad}
          disabled={!raw.trim() || player?.loading}
        >
          {player?.loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
          {player?.loading ? 'Loading…' : 'Load Deck'}
        </Button>

        {player?.parseErrors && player.parseErrors.length > 0 && (
          <div className="rounded-md bg-yellow-950/60 border border-yellow-600/40 p-3 space-y-1">
            <p className="text-yellow-400 text-xs font-semibold">
              {player.parseErrors.length} card{player.parseErrors.length > 1 ? 's' : ''} could not be found:
            </p>
            <ul className="space-y-0.5">
              {player.parseErrors.map((err, i) => (
                <li key={i} className="text-yellow-300/80 text-xs font-mono">
                  {err.line}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
