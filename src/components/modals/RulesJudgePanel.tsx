'use client'
import { useState, useRef, useCallback } from 'react'
import { X, Search, Scale, Loader2 } from 'lucide-react'
import type { Player } from '@/types/deck'

interface CardEntry {
  name: string
  type_line: string
  mana_cost: string
  oracle_text?: string
  owner: string
  key: string // `${seat}-${name}`
}

function buildCardIndex(players: Player[]): CardEntry[] {
  const seen = new Set<string>()
  const entries: CardEntry[] = []
  for (const p of players) {
    for (const { card } of p.cards) {
      const key = `${p.seat}-${card.name}`
      if (!seen.has(key)) {
        seen.add(key)
        entries.push({
          name: card.name,
          type_line: card.type_line ?? '',
          mana_cost: card.mana_cost ?? '',
          oracle_text: card.oracle_text,
          owner: p.name,
          key,
        })
      }
    }
  }
  return entries
}

export default function RulesJudgePanel({
  players,
  onClose,
}: {
  players: Player[]
  onClose: () => void
}) {
  const allCards = buildCardIndex(players)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CardEntry[]>([])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle')
  const abortRef = useRef<AbortController | null>(null)

  const filtered = search.trim().length > 0
    ? allCards.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.owner.toLowerCase().includes(search.toLowerCase()),
      )
    : []

  const toggle = useCallback((card: CardEntry) => {
    setSelected(prev =>
      prev.some(c => c.key === card.key)
        ? prev.filter(c => c.key !== card.key)
        : [...prev, card],
    )
  }, [])

  async function ask() {
    if (!question.trim()) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setAnswer('')
    setStatus('streaming')

    try {
      const res = await fetch('/api/rules-judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: selected, question }),
        signal: ctrl.signal,
      })

      if (!res.ok || !res.body) throw new Error(await res.text())

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setAnswer(prev => prev + dec.decode(value, { stream: true }))
      }
      setStatus('done')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('error')
    }
  }

  function reset() {
    abortRef.current?.abort()
    setAnswer('')
    setStatus('idle')
    setQuestion('')
    setSelected([])
    setSearch('')
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div
        className="afu"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--c-raised)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--rad-xl)',
          width: 'min(620px, 96vw)',
          maxHeight: 'min(90vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '22px 24px 18px',
            borderBottom: '1px solid var(--c-sub)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Scale size={18} color="var(--c-gold)" />
            <span style={{ fontWeight: 700, fontSize: 17 }}>Ask the Judge</span>
            <span className="badge-muted" style={{ fontSize: 10 }}>Claude</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={14} /></button>
        </div>

        <div style={{ padding: '18px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Card picker */}
          <div>
            <div className="kicker" style={{ marginBottom: 8 }}>Cards involved (optional)</div>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text3)', pointerEvents: 'none' }} />
              <input
                className="mtg-input"
                placeholder="Search by card name or player…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>

            {/* Search results */}
            {filtered.length > 0 && (
              <div
                style={{
                  background: 'var(--c-surface)',
                  border: '1px solid var(--c-sub)',
                  borderRadius: 'var(--rad)',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {filtered.slice(0, 30).map(card => {
                  const isOn = selected.some(c => c.key === card.key)
                  return (
                    <button
                      key={card.key}
                      onClick={() => toggle(card)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '8px 12px',
                        background: isOn ? 'var(--c-gold-bg)' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--c-sub)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--c-text)',
                        fontFamily: 'inherit',
                        transition: 'background 120ms',
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          border: `2px solid ${isOn ? 'var(--c-gold)' : 'var(--c-border)'}`,
                          background: isOn ? 'var(--c-gold)' : 'transparent',
                          flexShrink: 0,
                          transition: 'all 120ms',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--c-text3)' }}>{card.owner} · {card.type_line}</div>
                      </div>
                      {card.mana_cost && (
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--c-gold-dim)', flexShrink: 0 }}>{card.mana_cost}</div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Selected chips */}
            {selected.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {selected.map(c => (
                  <button
                    key={c.key}
                    onClick={() => toggle(c)}
                    className="badge-gold"
                    style={{ cursor: 'pointer', border: 'none', fontSize: 11, gap: 5 }}
                  >
                    {c.name}
                    <X size={10} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Question input */}
          <div>
            <div className="kicker" style={{ marginBottom: 8 }}>Your question</div>
            <textarea
              className="mtg-input"
              placeholder="e.g. Does Lightning Bolt resolve before my opponent's instant? Can I sacrifice a creature in response to a destroy effect?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={3}
              style={{ resize: 'vertical', lineHeight: 1.55, fontFamily: 'inherit', fontSize: 14 }}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ask()
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 4 }}>Ctrl+Enter to submit</div>
          </div>

          {/* Answer */}
          {(status === 'streaming' || status === 'done' || status === 'error') && (
            <div
              style={{
                background: 'var(--c-bg)',
                border: '1px solid var(--c-sub)',
                borderRadius: 'var(--rad)',
                padding: '14px 16px',
                fontSize: 14,
                lineHeight: 1.7,
                color: 'var(--c-text2)',
                whiteSpace: 'pre-wrap',
                minHeight: 60,
              }}
            >
              {status === 'error' ? (
                <span style={{ color: 'var(--c-red)' }}>Something went wrong. Try again.</span>
              ) : (
                <>
                  {answer}
                  {status === 'streaming' && (
                    <span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--c-green)', borderRadius: 2, marginLeft: 2, verticalAlign: 'text-bottom', animation: 'mtg-pulse 1s ease infinite' }} />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--c-sub)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {status === 'done' || status === 'error' ? (
            <button className="btn-ghost" onClick={reset} style={{ fontSize: 13 }}>Ask another</button>
          ) : (
            <div />
          )}
          <button
            className="btn-primary"
            onClick={ask}
            disabled={!question.trim() || status === 'streaming'}
            style={{ gap: 8 }}
          >
            {status === 'streaming' ? (
              <><Loader2 size={14} style={{ animation: 'mtg-spin .75s linear infinite' }} /> Thinking…</>
            ) : (
              <><Scale size={14} /> Ask Judge</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
