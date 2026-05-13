'use client'

import { useFormStatus } from 'react-dom'
import { publishResourceAction } from '@/app/admin/content-actions'

function Button() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-[var(--cosmos-accent)] hover:underline disabled:opacity-60"
    >
      {pending ? 'Publishing…' : 'Publish'}
    </button>
  )
}

export function PublishResourceForm({ id }: { id: string }) {
  const bound = publishResourceAction.bind(null, id)
  return (
    <form action={bound} className="inline">
      <Button />
    </form>
  )
}
