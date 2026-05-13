import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { LookupTool } from './LookupTool'

export const metadata: Metadata = {
  title: 'Threat Lookup',
  description:
    'Paste any IP, domain, URL, file hash or email. COSMOS fans out to VirusTotal, AbuseIPDB, Shodan, host.io and Hunter.io in parallel and renders a unified verdict.',
}

export default function LookupPage() {
  return (
    <ToolLayout
      title="Threat Lookup"
      tagline="One input, five intel sources. Paste an IP, domain, URL, file hash, or email — we query VirusTotal, AbuseIPDB, Shodan, host.io and Hunter.io in parallel and surface a unified verdict."
      label="threat tool"
      privacyNote="All API keys are held server-side. Your browser never sees them and queries leave no logged trace beyond the upstream provider."
    >
      <LookupTool />
    </ToolLayout>
  )
}
