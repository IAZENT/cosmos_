import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { JwtTool } from './JwtTool'

export const metadata: Metadata = {
  title: 'JWT Inspector',
  description:
    'Decode the header and payload of a JSON Web Token in your browser. No verification.',
}

export default function JwtPage() {
  return (
    <ToolLayout
      title="JWT Inspector"
      tagline="Paste a token  see the header, payload, and signature. Decoding only; this does not verify the signature."
    >
      <JwtTool />
    </ToolLayout>
  )
}
