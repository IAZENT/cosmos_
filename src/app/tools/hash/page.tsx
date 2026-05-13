import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { HashTool } from './HashTool'

export const metadata: Metadata = {
  title: 'Hash Analyzer',
  description:
    'Identify hash types by length and alphabet, or compute hashes in-browser via the Web Crypto API.',
}

export default function HashPage() {
  return (
    <ToolLayout
      title="Hash Analyzer"
      tagline="Identify a hash or compute one. SHA-1, SHA-256, SHA-384, SHA-512 are computed locally via the Web Crypto API."
    >
      <HashTool />
    </ToolLayout>
  )
}
