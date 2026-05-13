import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="grid min-h-[70vh] place-items-center px-6">
        <div className="max-w-xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--cosmos-code)]">
            {'// 404'}
          </p>
          <h1 className="mt-4 text-[80px] font-mono leading-none tracking-[-0.02em] text-[var(--cosmos-text)]">
            404
          </h1>
          <p className="mt-3 text-[15px] text-[var(--cosmos-text-muted)]">
            That route is uncharted. The path you followed doesn&apos;t exist
            on this platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="cosmos-btn-primary">
              → Home
            </Link>
            <Link href="/intelligence" className="cosmos-btn-ghost">
              → Intelligence
            </Link>
            <Link href="/tools" className="cosmos-btn-ghost">
              → Tools
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
