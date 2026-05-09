import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data, error }, { data: winsData }] = await Promise.all([
    supabase.from('decks').select('*, profiles(name)').order('created_at', { ascending: false }),
    supabase.rpc('get_wins_by_commander'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const winsMap: Record<string, number> = {}
  for (const row of (winsData ?? []) as { commander: string; wins: number }[]) {
    winsMap[row.commander] = row.wins
  }

  const enriched = (data ?? []).map(d => ({ ...d, wins: d.commander ? (winsMap[d.commander] ?? 0) : 0 }))
  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { name: string; commander?: string; colors?: string[]; moxfield_url?: string; deck_raw: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.name?.trim() || !body.deck_raw?.trim()) {
    return NextResponse.json({ error: 'name and deck_raw are required' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('decks')
    .insert({
      name: body.name.trim(),
      commander: body.commander || null,
      colors: body.colors ?? null,
      moxfield_url: body.moxfield_url || null,
      deck_raw: body.deck_raw,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
