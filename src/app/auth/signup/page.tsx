'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Scale } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', overflowX: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--c-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(10% 0.025 162)' }}><Scale size={13} /></div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '.02em' }}>Deck Balancer</span>
        </div>

        <div className="mtg-panel" style={{ padding: '32px 28px' }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Create account</div>
          <h1 className="df" style={{ fontSize: 32, color: 'var(--c-text)', marginBottom: 28 }}>Sign Up</h1>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 8 }}>
                Name
              </label>
              <input
                className="mtg-input"
                type="text"
                autoComplete="name"
                required
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 8 }}>
                Email
              </label>
              <input
                className="mtg-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--c-text3)', marginBottom: 8 }}>
                Password
              </label>
              <input
                className="mtg-input"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--rad)', background: 'oklch(18% .08 20/.18)', border: '1px solid oklch(60% .22 20/.28)', color: 'oklch(68% .18 20)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary btn-glow"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Creating account…</> : 'Create Account →'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--c-text3)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: 'var(--c-green-hi)', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
