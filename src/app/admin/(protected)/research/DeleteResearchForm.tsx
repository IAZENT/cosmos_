'use client'

import { useFormStatus } from 'react-dom'
import { deleteResearchAction } from '@/app/admin/content-actions'

function Button() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-[var(--cosmos-critical)] hover:underline disabled:opacity-60"
      onClick={(e) => {
        if (!window.confirm('Delete this post?')) e.preventDefault()
      }}
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}

export function DeleteResearchForm({ id }: { id: string }) {
  const bound = deleteResearchAction.bind(null, id)
  return (
    <form action={bound} className="inline">
      <Button />
    </form>
  )
}
