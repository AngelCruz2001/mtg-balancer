'use client'
import { useState, useMemo } from 'react'
import { X, Minus, Plus, Check } from 'lucide-react'
import type { DeckCard } from '@/types/card'

const COMMANDER_TARGET = 100

interface Props {
  cards: DeckCard[]
  onClose: () => void
  onConfirm: (trimmed: DeckCard[]) => void
}

function cardImage(dc: DeckCard): string {
  return (
    dc.card.image_uris?.normal ??
    dc.card.card_faces?.[0]?.image_uris?.normal ??
    ''
  )
}

function typeOrder(typeLine: string): number {
  if (/legendary.*creature/i.test(typeLine)) return 0
  if (/creature/i.test(typeLine)) return 1
  if (/planeswalker/i.test(typeLine)) return 2
  if (/instant/i.test(typeLine)) return 3
  if (/sorcery/i.test(typeLine)) return 4
  if (/enchantment/i.test(typeLine)) return 5
  if (/artifact/i.test(typeLine)) return 6
  if (/land/i.test(typeLine)) return 7
  return 8
}

export default function DeckTrimmerModal({ cards, onClose, onConfirm }: Props) {
  // Map from card id → included quantity
  const [quantities, setQuantities] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>()
    for (const dc of cards) m.set(dc.card.id, dc.quantity)
    return m
  })

  const sorted = useMemo(
    () => [...cards].sort((a, b) => typeOrder(a.card.type_line) - typeOrder(b.card.type_line) || a.card.name.localeCompare(b.card.name)),
    [cards],
  )

  const totalSelected = useMemo(
    () => [...quantities.values()].reduce((s, q) => s + q, 0),
    [quantities],
  )
  const over = totalSelected - COMMANDER_TARGET
  const exact = over === 0

  function setQty(id: string, delta: number) {
    setQuantities(prev => {
      const next = new Map(prev)
      const cur = next.get(id) ?? 0
      const orig = cards.find(c => c.card.id === id)?.quantity ?? 1
      const clamped = Math.max(0, Math.min(orig, cur + delta))
      next.set(id, clamped)
      return next
    })
  }

  function toggleCard(id: string) {
    setQuantities(prev => {
      const next = new Map(prev)
      const cur = next.get(id) ?? 0
      const orig = cards.find(c => c.card.id === id)?.quantity ?? 1
      next.set(id, cur === 0 ? orig : 0)
      return next
    })
  }

  function handleConfirm() {
    const trimmed: DeckCard[] = []
    for (const dc of cards) {
      const qty = quantities.get(dc.card.id) ?? 0
      if (qty > 0) trimmed.push({ ...dc, quantity: qty })
    }
    onConfirm(trimmed)
  }

  const counterColor = exact
    ? 'var(--c-green-hi)'
    : over > 0
    ? 'oklch(68% .18 20)'
    : 'oklch(68% .18 20)'

  return (
    <div
      className="modal-bg"
      onClick={onClose}
      style={{ alignItems: 'flex-start', paddingTop: 24, paddingBottom: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--c-raised)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--rad-xl)',
          width: 'min(960px, 96vw)',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeUp 280ms var(--ease)',
          overflow: 'hidden',
        }}
      >
        {/* Sticky header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--c-sub)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexShrink: 0,
          background: 'var(--c-raised)',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Trim Deck to 100</div>
            <div style={{ fontSize: 12, color: 'var(--c-text3)' }}>
              Click a card to exclude it · use +/− for basic lands
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: counterColor,
              minWidth: 90,
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {totalSelected}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text3)', marginLeft: 4 }}>/ 100</span>
            </div>
            {!exact && (
              <div style={{
                fontSize: 12,
                color: counterColor,
                background: over > 0 ? 'oklch(18% .08 20/.18)' : 'oklch(18% .08 20/.18)',
                border: `1px solid ${over > 0 ? 'oklch(60% .22 20/.28)' : 'oklch(60% .22 20/.28)'}`,
                padding: '4px 10px',
                borderRadius: 99,
                fontWeight: 600,
              }}>
                {over > 0 ? `Remove ${over} more` : `Add ${Math.abs(over)} more`}
              </div>
            )}
            <button
              className="btn-primary"
              style={{ fontSize: 13, padding: '9px 20px' }}
              disabled={!exact}
              onClick={handleConfirm}
            >
              <Check size={14} /> Confirm
            </button>
            <button className="btn-icon" onClick={onClose} style={{ flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Card grid */}
        <div style={{
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
          gap: 12,
        }}>
          {sorted.map(dc => {
            const qty = quantities.get(dc.card.id) ?? 0
            const excluded = qty === 0
            const img = cardImage(dc)

            return (
              <div key={dc.card.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {/* Card image */}
                <div
                  style={{ position: 'relative', cursor: 'pointer', borderRadius: 8, overflow: 'hidden' }}
                  onClick={() => toggleCard(dc.card.id)}
                  title={excluded ? `Include ${dc.card.name}` : `Exclude ${dc.card.name}`}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={dc.card.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        aspectRatio: '63 / 88',
                        objectFit: 'cover',
                        display: 'block',
                        borderRadius: 8,
                        transition: 'opacity var(--dur) var(--ease)',
                        opacity: excluded ? 0.22 : 1,
                        border: excluded ? '2px solid oklch(60% .22 20/.5)' : '2px solid transparent',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      aspectRatio: '63 / 88',
                      background: 'var(--c-sub)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      color: 'var(--c-text3)',
                      padding: 8,
                      textAlign: 'center',
                      opacity: excluded ? 0.3 : 1,
                    }}>
                      {dc.card.name}
                    </div>
                  )}

                  {/* Excluded overlay */}
                  {excluded && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                    }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'oklch(18% .08 20/.85)',
                        border: '2px solid oklch(60% .22 20/.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <X size={18} color="oklch(68% .18 20)" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card name */}
                <div style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: excluded ? 'var(--c-text3)' : 'var(--c-text2)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'color var(--dur) var(--ease)',
                }}>
                  {dc.card.name}
                </div>

                {/* Quantity stepper — only shown for multi-copy cards */}
                {dc.quantity > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}>
                    <button
                      onClick={() => setQty(dc.card.id, -1)}
                      disabled={qty === 0}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--c-bg)',
                        border: '1px solid var(--c-sub)',
                        color: 'var(--c-text2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: qty === 0 ? 0.3 : 1,
                        padding: 0,
                      }}
                    >
                      <Minus size={10} />
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 700, minWidth: 20, textAlign: 'center', color: excluded ? 'var(--c-text3)' : 'var(--c-text)' }}>
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(dc.card.id, +1)}
                      disabled={qty >= dc.quantity}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--c-bg)',
                        border: '1px solid var(--c-sub)',
                        color: 'var(--c-text2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: qty >= dc.quantity ? 0.3 : 1,
                        padding: 0,
                      }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
