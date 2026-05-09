'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile { id: string; name: string }

interface Props {
  value: string
  placeholder?: string
  accentColor?: string
  style?: React.CSSProperties
  onChange: (v: string) => void
}

export default function PlayerNameInput({ value, placeholder, accentColor = 'var(--c-text2)', style, onChange }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles').select('id, name').order('name').then(({ data }) => {
      if (data) setProfiles(data)
    })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = profiles.filter(p =>
    value.length === 0 || p.name.toLowerCase().includes(value.toLowerCase())
  )

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <input
        className="mtg-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => profiles.length > 0 && setOpen(true)}
        autoComplete="off"
        style={{ width: '100%' }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: 'var(--c-surface)', border: '1px solid var(--c-sub)',
          borderRadius: 'var(--rad-lg)', overflow: 'hidden',
          boxShadow: '0 8px 24px oklch(0% 0 0 / .3)',
        }}>
          {filtered.map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={e => {
                e.preventDefault()
                onChange(p.name)
                setOpen(false)
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', transition: 'background 100ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'var(--c-green-bg)', border: `1px solid ${accentColor}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: accentColor,
              }}>
                {p.name[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 14, color: 'var(--c-text)' }}>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
