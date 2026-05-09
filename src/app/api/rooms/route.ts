import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export interface RoomPlayer {
  seat: number
  name: string
  commander: string
  colors: string[]
  deck_raw: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let body: { players: RoomPlayer[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.players?.length) {
    return NextResponse.json({ error: 'No players provided' }, { status: 422 })
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const { data, error } = await supabase
      .from('rooms')
      .insert({ code, players: body.players, created_by: user?.id ?? null })
      .select('code')
      .single()

    if (!error && data) return NextResponse.json({ code: data.code }, { status: 201 })
    if (error?.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 })
}
