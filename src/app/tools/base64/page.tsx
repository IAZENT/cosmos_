import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { Base64Tool } from './Base64Tool'

export const metadata: Metadata = {
  title: 'Base64 Codec',
  description: 'Encode or decode UTF-8 Base64 strings in your browser.',
}

export default function Base64Page() {
  return (
    <ToolLayout
      title="Base64 Codec"
      tagline="Encode and decode UTF-8 text. Supports the URL-safe variant (RFC 4648 §5)."
    >
      <Base64Tool />
    </ToolLayout>
  )
}
