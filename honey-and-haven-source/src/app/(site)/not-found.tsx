import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="menu-hero">
      <div className="container" style={{ display: 'grid', gap: 24, justifyItems: 'center' }}>
        <h1>Page not found</h1>
        <p>This page has wandered off for a coffee.</p>
        <Link href="/" className="btn btn-primary">
          Back home
        </Link>
      </div>
    </section>
  )
}
