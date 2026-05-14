'use client'

import { useFormStatus } from 'react-dom'
import {
  deleteArsenalAction,
  togglePinnedArsenalAction,
  togglePublishedArsenalAction,
} from '@/app/user2admin/arsenal/actions'

function PendingButton({
  children,
  className,
  confirm,
}: {
  children: React.ReactNode
  className?: string
  confirm?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault()
      }}
    >
      {pending ? '…' : children}
    </button>
  )
}

export function DeleteArsenalForm({ id }: { id: string }) {
  const bound = deleteArsenalAction.bind(null, id)
  return (
    <form action={bound} className="inline">
      <PendingButton
        className="text-[var(--cosmos-critical)] hover:underline disabled:opacity-60"
        confirm="Delete this entry?"
      >
        Delete
      </PendingButton>
    </form>
  )
}

export function TogglePublishForm({
  id,
  current,
}: {
  id: string
  current: boolean
}) {
  const bound = togglePublishedArsenalAction.bind(null, id, !current)
  return (
    <form action={bound} className="inline">
      <PendingButton className="text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)] disabled:opacity-60">
        {current ? 'Unpublish' : 'Publish'}
      </PendingButton>
    </form>
  )
}

export function TogglePinForm({
  id,
  current,
}: {
  id: string
  current: boolean
}) {
  const bound = togglePinnedArsenalAction.bind(null, id, !current)
  return (
    <form action={bound} className="inline">
      <PendingButton className="text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-accent)] disabled:opacity-60">
        {current ? 'Unpin' : 'Pin'}
      </PendingButton>
    </form>
  )
}
