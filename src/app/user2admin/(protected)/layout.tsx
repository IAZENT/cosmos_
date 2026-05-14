import Link from 'next/link'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/app/user2admin/actions'
import {
  getCurrentUser,
  isAllowedAdminEmail,
  supabaseAuthConfigured,
} from '@/lib/auth/admin'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!supabaseAuthConfigured()) {
    // Child page renders a friendly "not configured" message instead of
    // looping through a redirect.
    return <>{children}</>
  }
  const user = await getCurrentUser()
  if (!user || !isAllowedAdminEmail(user.email ?? null)) {
    redirect('/user2admin/login')
  }

  return (
    <div className="min-h-screen bg-[var(--cosmos-bg)]">
      <header className="border-b border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg-elevated)]">
        <div className="mx-auto flex h-14 max-w-cosmos items-center justify-between px-6 md:px-12">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-mono text-[14px] text-[var(--cosmos-text)] hover:text-[var(--cosmos-accent)]"
            >
              ./cosmos
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
              {'// admin'}
            </span>
            <nav
              aria-label="Admin"
              className="hidden items-center gap-4 md:flex"
            >
              <Link
                href="/user2admin"
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
              >
                Dashboard
              </Link>
              <Link
                href="/user2admin/research"
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
              >
                Research
              </Link>
              <Link
                href="/user2admin/resources"
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
              >
                Resources
              </Link>
              <Link
                href="/user2admin/arsenal"
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
              >
                Arsenal
              </Link>
              <Link
                href="/user2admin/session"
                className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
              >
                Session
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[11px] text-[var(--cosmos-text-muted)] sm:inline">
              {user.email ?? user.id}
            </span>
            <form action={logoutAction}>
              <button type="submit" className="cosmos-btn-ghost">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
