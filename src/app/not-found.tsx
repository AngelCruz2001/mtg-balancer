import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="panel-surface max-w-lg rounded-[2rem] p-8 text-center sm:p-10">
        <p className="section-kicker">Page Missing</p>
        <h1 className="font-display mt-3 text-4xl text-white">That page is not part of this pod.</h1>
        <p className="mt-4 text-sm leading-7 text-soft">
          The route you asked for does not exist in the current MTG Deck Balancer app shell.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-[14px] border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.09]"
        >
          Return to the table
        </Link>
      </div>
    </main>
  )
}
