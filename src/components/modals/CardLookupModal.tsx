'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

interface CardResult {
  name: string
  type_line: string
  mana_cost: string
  oracle_text?: string
}

export default function CardLookupModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<CardResult | null>(null)

  async function lookup() {
    if (!query.trim()) return
    setStatus('loading')
    setResult(null)
    try {
      const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(query.trim())}`)
      if (!res.ok) throw new Error('Card not found')
      const data = await res.json()
      setResult({ name: data.name, type_line: data.type_line, mana_cost: data.mana_cost, oracle_text: data.oracle_text })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Card Lookup</h2>
          <button className="btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            className="mtg-input"
            placeholder="Search card name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={lookup} disabled={!query.trim() || status === 'loading'}>
            {status === 'loading' ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '→'}
          </button>
        </div>

        {status === 'done' && result && (
          <div className="afu" style={{ background: 'var(--c-bg)', border: '1px solid var(--c-sub)', borderRadius: 'var(--rad)', padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{result.name}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text3)', marginBottom: 4 }}>{result.type_line}</div>
            {result.mana_cost && <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--c-gold)', marginBottom: 8 }}>{result.mana_cost}</div>}
            {result.oracle_text && <p style={{ fontSize: 13, color: 'var(--c-text2)', lineHeight: 1.6 }}>{result.oracle_text}</p>}
          </div>
        )}

        {status === 'error' && (
          <div className="afu" style={{ padding: '12px 16px', borderRadius: 'var(--rad)', background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', color: 'oklch(68% .18 20)', fontSize: 13 }}>
            Card not found. Try a different spelling.
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 12 }}>Queries the Scryfall API for real-time card data.</p>
      </div>
    </div>
  )
}
