'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction, type LoginActionState } from '@/app/admin/actions'

const INITIAL: LoginActionState = { error: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cosmos-btn-primary w-full justify-center disabled:opacity-60"
    >
      {pending ? 'Signing in…' : '→ Sign in'}
    </button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, INITIAL)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-email"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
        >
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[13px] text-[var(--cosmos-text)] placeholder:text-[var(--cosmos-text-dim)] focus:border-[var(--cosmos-accent)] focus:outline-none"
          placeholder="you@example.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-password"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]"
        >
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-[4px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-subtle)] px-3 py-2 font-mono text-[13px] text-[var(--cosmos-text)] focus:border-[var(--cosmos-accent)] focus:outline-none"
        />
      </div>
      {state.error ? (
        <p
          role="alert"
          className="rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]"
        >
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  )
}
