import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { CvssTool } from './CvssTool'

export const metadata: Metadata = {
  title: 'CVSS v3.1 Calculator',
  description:
    'Live CVSS v3.1 base score and vector string from the eight base metrics.',
}

export default function CvssPage() {
  return (
    <ToolLayout
      title="CVSS v3.1 Calculator"
      tagline="Pick each base metric  the score, severity band, and vector string update in real time. Paste an existing CVSS:3.1 vector to import."
    >
      <CvssTool />
    </ToolLayout>
  )
}
