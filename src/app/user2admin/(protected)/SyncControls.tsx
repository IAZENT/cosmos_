'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import {
  triggerCveSyncAction,
  triggerKevSyncAction,
  type TriggerSyncState,
} from '@/app/user2admin/actions'

const INITIAL: TriggerSyncState = { status: 'idle' }

function StatusPanel({ state }: { state: TriggerSyncState }) {
  if (state.status === 'idle') return null

  if (state.status === 'error') {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-critical)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-critical)]">
        <AlertCircle size={12} aria-hidden className="mt-0.5" />
        {state.message}
      </p>
    )
  }

  const { result } = state
  return (
    <div className="mt-3 rounded-[4px] border border-[var(--cosmos-low)]/40 bg-[var(--cosmos-low)]/10 px-3 py-2 font-mono text-[11px] text-[var(--cosmos-low)]">
      <p className="flex items-center gap-2">
        <CheckCircle2 size={12} aria-hidden />
        synced {result.synced.toLocaleString('en-US')} rows in{' '}
        {Math.round(result.durationMs)}ms
      </p>
      {result.errors.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1 text-[var(--cosmos-text-muted)]">
          {result.errors.slice(0, 3).map((err, i) => (
            <li key={i} className="truncate">
              · {err}
            </li>
          ))}
          {result.errors.length > 3 ? (
            <li>· +{result.errors.length - 3} more</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}

function TriggerButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cosmos-btn-primary justify-center disabled:opacity-60"
    >
      <RefreshCw
        size={12}
        aria-hidden
        className={pending ? 'animate-spin' : undefined}
      />
      {pending ? 'running…' : label}
    </button>
  )
}

export function SyncControls() {
  const [cveState, cveAction] = useActionState(triggerCveSyncAction, INITIAL)
  const [kevState, kevAction] = useActionState(triggerKevSyncAction, INITIAL)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
          {'// nvd'}
        </p>
        <h3 className="mt-1 text-[18px] text-[var(--cosmos-text)]">
          Sync CVEs
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
          Pulls the last 48 hours of CVEs from NVD and refreshes cache counters.
          Respects NVD rate limits.
        </p>
        <form action={cveAction} className="mt-4">
          <TriggerButton label="Sync CVEs now" />
        </form>
        <StatusPanel state={cveState} />
      </div>

      <div className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
          {'// cisa kev'}
        </p>
        <h3 className="mt-1 text-[18px] text-[var(--cosmos-text)]">
          Sync KEV catalogue
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
          Pulls the full CISA Known Exploited Vulnerabilities feed and marks
          matching CVEs.
        </p>
        <form action={kevAction} className="mt-4">
          <TriggerButton label="Sync KEV now" />
        </form>
        <StatusPanel state={kevState} />
      </div>
    </div>
  )
}
