'use client'
import { useState } from 'react'
import { Check, Library } from 'lucide-react'

interface Props {
  deckRaw: string
  commander: string
  colors: string[]
  moxfieldUrl?: string
}

export default function SaveToLibraryForm({ deckRaw, commander, colors, moxfieldUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (saved) return (
    <span style={{ fontSize: 12, color: 'var(--c-green-hi)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Check size={12} /> Saved to library
    </span>
  )

  if (!open) return (
    <button
      className="btn-ghost"
      style={{ fontSize: 12, padding: '5px 10px' }}
      onClick={() => { setName(commander || 'New Deck'); setOpen(true) }}
    >
      <Library size={12} /> Save to Library
    </button>
  )

  async function save() {
    if (!name.trim()) return
    setSaving(true); setErr(null)
    const res = await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), commander: commander || null, colors, moxfield_url: moxfieldUrl || null, deck_raw: deckRaw }),
    })
    const data = await res.json()
    if (!res.ok) { setErr(data.error); setSaving(false) } else setSaved(true)
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        className="mtg-input"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Deck name…"
        style={{ fontSize: 12, padding: '5px 10px', flex: 1, minWidth: 120 }}
        autoFocus
        onKeyDown={e => e.key === 'Enter' && save()}
      />
      <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={save} disabled={!name.trim() || saving}>
        {saving ? '…' : 'Save'}
      </button>
      <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 8px' }} onClick={() => setOpen(false)}>✕</button>
      {err && <div style={{ width: '100%', fontSize: 11, color: 'oklch(68% .18 20)' }}>{err}</div>}
    </div>
  )
}
