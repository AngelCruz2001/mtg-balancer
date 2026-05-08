import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div className="mtg-panel" style={{ maxWidth: 480, width: '100%', padding: '40px 36px', textAlign: 'center' }}>
        <div className="kicker" style={{ marginBottom: 10 }}>Page Missing</div>
        <h1 className="df" style={{ fontSize: 40, color: 'var(--c-text)', marginBottom: 16 }}>That page is not part of this pod.</h1>
        <p style={{ fontSize: 14, color: 'var(--c-text2)', lineHeight: 1.7, marginBottom: 28 }}>
          The route you asked for does not exist in the current MTG Deck Balancer app shell.
        </p>
        <Link
          href="/"
          className="btn-ghost"
          style={{ display: 'inline-flex', fontSize: 14 }}
        >
          ← Return to the table
        </Link>
      </div>
    </main>
  )
}
