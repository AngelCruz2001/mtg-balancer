import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RoomPlayer } from '../route'

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('players')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  let body: { players: RoomPlayer[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { error } = await supabase
    .from('rooms')
    .update({ players: body.players })
    .eq('code', code.toUpperCase())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
