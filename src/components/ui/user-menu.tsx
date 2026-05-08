'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function UserMenu() {
  const router = useRouter()
  const [name, setName] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setName(data.user?.user_metadata?.name ?? data.user?.email ?? null)
    })
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  if (!name) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
          borderRadius: 'var(--rad)', background: 'var(--c-surface)', border: '1px solid var(--c-sub)',
          cursor: 'pointer', fontSize: 13, color: 'var(--c-text2)',
        }}
      >
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--c-green-bg)', border: '1px solid oklch(57% .205 162/.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--c-green-hi)' }}>
          {name[0].toUpperCase()}
        </div>
        <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        <span style={{ fontSize: 10, opacity: .5 }}>▼</span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 100, background: 'var(--c-surface)', border: '1px solid var(--c-sub)', borderRadius: 'var(--rad-lg)', minWidth: 140, padding: 6, boxShadow: '0 8px 24px oklch(0% 0 0/.3)' }}>
            <button
              onClick={signOut}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 'var(--rad)', fontSize: 13, color: 'oklch(68% .18 20)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
