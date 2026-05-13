'use client'

import { useFormStatus } from 'react-dom'
import { deleteResourceAction } from '@/app/user2admin/content-actions'

function Button() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-[var(--cosmos-critical)] hover:underline disabled:opacity-60"
      onClick={(e) => {
        if (!window.confirm('Delete this resource?')) e.preventDefault()
      }}
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}

export function DeleteResourceForm({ id }: { id: string }) {
  const bound = deleteResourceAction.bind(null, id)
  return (
    <form action={bound} className="inline">
      <Button />
    </form>
  )
}
