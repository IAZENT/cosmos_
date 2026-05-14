import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  ShieldAlert,
  Timer,
} from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { CopyButton } from '@/components/tools/CopyButton'
import { SessionRefreshButton } from './SessionRefreshButton'
import {
  getCurrentSession,
  getCurrentUser,
  isAllowedAdminEmail,
  supabaseAuthConfigured,
} from '@/lib/auth/admin'
import {
  decodeJwt,
  secondsUntilExpiry,
  unixToIso,
} from '@/lib/auth/jwt'

export const metadata: Metadata = {
  title: 'Session  COSMOS Admin',
  description: 'Active admin session details, decoded JWT claims and refresh control.',
}

export const dynamic = 'force-dynamic'

function formatDuration(seconds: number): string {
  const sign = seconds < 0 ? '-' : ''
  const s = Math.abs(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const rem = s % 60
  if (h > 0) return `${sign}${h}h ${m}m ${rem}s`
  if (m > 0) return `${sign}${m}m ${rem}s`
  return `${sign}${rem}s`
}

export default async function SessionPage() {
  if (!supabaseAuthConfigured()) redirect('/user2admin/login')
  const [user, session] = await Promise.all([
    getCurrentUser(),
    getCurrentSession(),
  ])
  if (!user || !isAllowedAdminEmail(user.email ?? null)) {
    redirect('/user2admin/login')
  }

  const token = session?.access_token ?? null
  const decoded = token ? decodeJwt(token) : null
  const remaining = decoded ? secondsUntilExpiry(decoded.payload) : null
  const expired = typeof remaining === 'number' && remaining <= 0
  const expiringSoon =
    typeof remaining === 'number' && remaining > 0 && remaining < 300

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-12">
      <SectionLabel>session inspector</SectionLabel>
      <h1 className="mt-2 font-sans text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--cosmos-text)] md:text-[48px]">
        Active session
      </h1>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--cosmos-text-muted)]">
        Supabase issues a fresh JWT each time you log in. We store it in
        an HTTP-only cookie  no JS / XSS can read it. This panel decodes
        it server-side so you can verify the claims, expiry and identity.
      </p>

      {/* ---- status banner ---- */}
      <div
        className={[
          'mt-8 flex items-start gap-3 rounded-[6px] border p-4',
          expired
            ? 'border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 text-[var(--cosmos-critical)]'
            : expiringSoon
              ? 'border-[var(--cosmos-medium)]/40 bg-[var(--cosmos-medium)]/10 text-[var(--cosmos-medium)]'
              : 'border-[var(--cosmos-low)]/40 bg-[var(--cosmos-low)]/10 text-[var(--cosmos-low)]',
        ].join(' ')}
      >
        {expired ? (
          <AlertTriangle size={16} aria-hidden className="mt-0.5" />
        ) : expiringSoon ? (
          <ShieldAlert size={16} aria-hidden className="mt-0.5" />
        ) : (
          <CheckCircle2 size={16} aria-hidden className="mt-0.5" />
        )}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[12px] uppercase tracking-[0.1em]">
            {expired
              ? 'JWT expired'
              : expiringSoon
                ? `Expiring in ${formatDuration(remaining ?? 0)}`
                : token
                  ? `Valid for ${formatDuration(remaining ?? 0)}`
                  : 'No active JWT bound to this request'}
          </span>
          {token ? (
            <span className="font-mono text-[11px] opacity-80">
              Refresh tokens rotate automatically  no action needed during
              normal use.
            </span>
          ) : null}
        </div>
        <div className="ml-auto">
          <SessionRefreshButton />
        </div>
      </div>

      {/* ---- identity ---- */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-sans text-[20px] font-semibold tracking-[-0.01em] text-[var(--cosmos-text)]">
          <Fingerprint
            size={16}
            aria-hidden
            className="text-[var(--cosmos-accent)]"
          />
          Identity
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4 sm:grid-cols-2">
          <Field label="User ID" value={user.id} copy />
          <Field label="Email" value={user.email ?? ''} copy />
          <Field label="Provider" value={user.app_metadata?.provider ?? 'email'} />
          <Field
            label="Last sign-in"
            value={user.last_sign_in_at ?? user.created_at ?? ''}
          />
          <Field label="Email confirmed" value={user.email_confirmed_at ?? ''} />
          <Field
            label="Auth assurance"
            value={(decoded?.payload.aal as string | undefined) ?? 'aal1'}
          />
        </div>
      </section>

      {/* ---- token ---- */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-sans text-[20px] font-semibold tracking-[-0.01em] text-[var(--cosmos-text)]">
          <KeyRound
            size={16}
            aria-hidden
            className="text-[var(--cosmos-accent)]"
          />
          Access token (JWT)
        </h2>
        {token && decoded ? (
          <div className="mt-3 flex flex-col gap-4 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
                  Raw token  paste into jwt.io to verify the signature
                </span>
                <CopyButton value={token} />
              </div>
              <textarea
                readOnly
                rows={4}
                value={token}
                spellCheck={false}
                className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[11px] leading-relaxed text-[var(--cosmos-text)]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <pre className="overflow-x-auto rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[11px] leading-relaxed text-[var(--cosmos-text)]">
                <span className="text-[var(--cosmos-text-dim)]">
                  {'// header\n'}
                </span>
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
              <pre className="overflow-x-auto rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] p-3 font-mono text-[11px] leading-relaxed text-[var(--cosmos-text)]">
                <span className="text-[var(--cosmos-text-dim)]">
                  {'// payload (claims)\n'}
                </span>
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <Field label="Issuer (iss)" value={decoded.payload.iss ?? ''} />
              <Field label="Subject (sub)" value={decoded.payload.sub ?? ''} copy />
              <Field label="Role" value={decoded.payload.role ?? ''} />
              <Field label="Audience (aud)" value={decoded.payload.aud ?? ''} />
              <Field
                label="Issued (iat)"
                value={unixToIso(decoded.payload.iat) ?? ''}
              />
              <Field
                label="Expires (exp)"
                value={unixToIso(decoded.payload.exp) ?? ''}
              />
              <Field
                label="Session ID"
                value={(decoded.payload.session_id as string | undefined) ?? ''}
                copy
              />
              <Field
                label="Algorithm"
                value={(decoded.header.alg as string | undefined) ?? ''}
              />
            </dl>
          </div>
        ) : (
          <p className="mt-3 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4 font-mono text-[12px] text-[var(--cosmos-text-muted)]">
            No JWT bound to this request. Try signing out and back in.
          </p>
        )}
      </section>

      {/* ---- refresh meta ---- */}
      {session ? (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-sans text-[20px] font-semibold tracking-[-0.01em] text-[var(--cosmos-text)]">
            <Timer
              size={16}
              aria-hidden
              className="text-[var(--cosmos-accent)]"
            />
            Session timing
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-4 sm:grid-cols-2">
            <Field
              label="Token type"
              value={session.token_type ?? 'bearer'}
            />
            <Field
              label="Expires at"
              value={unixToIso(session.expires_at) ?? ''}
            />
            <Field
              label="Expires in"
              value={`${session.expires_in ?? 0}s`}
            />
            <Field
              label="Refresh token"
              value={session.refresh_token ? '••••••••' : ''}
              note="Stored HTTP-only  cannot be exposed by design."
            />
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  copy = false,
  note,
}: {
  label: string
  value: string
  copy?: boolean
  note?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        {label}
      </dt>
      <dd className="flex items-center gap-1 font-mono text-[12px] text-[var(--cosmos-text)]">
        <span className="truncate" title={value || ''}>
          {value || ''}
        </span>
        {copy && value ? <CopyButton value={value} /> : null}
      </dd>
      {note ? (
        <span className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
          {note}
        </span>
      ) : null}
    </div>
  )
}
