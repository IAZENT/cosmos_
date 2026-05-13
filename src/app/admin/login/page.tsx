import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { LoginForm } from '@/app/admin/login/LoginForm'
import {
  getCurrentUser,
  isAllowedAdminEmail,
  supabaseAuthConfigured,
} from '@/lib/auth/admin'

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'Authenticate to access the COSMOS admin panel.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  const configured = supabaseAuthConfigured()
  const user = configured ? await getCurrentUser() : null
  if (user && isAllowedAdminEmail(user.email ?? null)) {
    redirect('/admin')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="font-mono text-[14px] text-[var(--cosmos-text)] hover:text-[var(--cosmos-accent)]"
        >
          ./cosmos
        </Link>
        <div className="mt-10">
          <SectionLabel>admin access</SectionLabel>
          <h1 className="text-[28px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)]">
            Sign in to continue.
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
            This surface is restricted to COSMOS administrators.
          </p>
        </div>

        <div className="mt-8 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6">
          {configured ? (
            <LoginForm />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
                {'// auth not configured'}
              </p>
              <p className="text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
                Supabase credentials are not set on this deployment. Add
                <code className="mx-1 rounded bg-[var(--cosmos-bg-subtle)] px-1 font-mono text-[11px]">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>
                and
                <code className="mx-1 rounded bg-[var(--cosmos-bg-subtle)] px-1 font-mono text-[11px]">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>
                to <code className="font-mono">.env.local</code>.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 font-mono text-[11px] text-[var(--cosmos-text-dim)]">
          <Link href="/" className="hover:text-[var(--cosmos-text-muted)]">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </main>
  )
}
