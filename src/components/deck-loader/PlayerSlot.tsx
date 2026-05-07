'use client'
import { useState } from 'react'
import { useAppStore } from '@/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle } from 'lucide-react'
import type { PlayerSeat } from '@/types/deck'
import type { DeckParseError } from '@/types/deck'

const EMPTY_PARSE_ERRORS: DeckParseError[] = []

export default function PlayerSlot({ seat }: { seat: PlayerSeat }) {
  const [name, setName] = useState(`Player ${seat}`)
  const [raw, setRaw] = useState('')
  
  const addPlayer = useAppStore(s => s.addPlayer)
  const loadDeck = useAppStore(s => s.loadDeck)
  const player = useAppStore(s => s.players.find(p => p.seat === seat))
  const parseErrors = player?.parseErrors ?? EMPTY_PARSE_ERRORS

  async function handleLoad() {
    if (!raw.trim()) return
    addPlayer(seat, name)
    await loadDeck(seat, raw)
  }

  const totalCards = player?.cards.reduce((sum, dc) => sum + dc.quantity, 0) ?? 0

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            Seat {seat}
            {totalCards > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {totalCards} cards
              </Badge>
            )}
          </span>
          {player?.loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow flex flex-col">
        <div className="space-y-1.5">
          <Input
            placeholder="Player name"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => name.trim() && addPlayer(seat, name)}
          />
        </div>
        
        <div className="flex-grow flex flex-col space-y-1.5">
          <Textarea
            placeholder={"4 Lightning Bolt\n20 Mountain\n..."}
            className="flex-grow font-mono text-xs resize-none"
            rows={8}
            value={raw}
            onChange={e => setRaw(e.target.value)}
          />
        </div>

        {player?.error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{player.error}</p>
          </div>
        )}

        {player?.parseErrors && player.parseErrors.length > 0 && (
          <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-sm">
            <p className="font-medium mb-1">Some cards could not be loaded:</p>
            <ul className="list-disc list-inside text-xs space-y-0.5 opacity-90">
              {player.parseErrors.map((err, i) => (
                <li key={i}>{err.line}: {err.reason}</li>
              ))}
            </ul>
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleLoad}
          disabled={!raw.trim() || player?.loading}
        >
          {player?.loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Decks...
            </>
          ) : (
            'Load Deck'
          )}
        </Button>

        {parseErrors.length > 0 && (
          <div className="rounded-md bg-yellow-950/60 border border-yellow-600/40 p-3 space-y-1">
            <p className="text-yellow-400 text-xs font-semibold">
              {parseErrors.length} card{parseErrors.length > 1 ? 's' : ''} could not be found:
            </p>
            <ul className="space-y-0.5">
              {parseErrors.map((err, i) => (
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
