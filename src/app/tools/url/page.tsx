import type { Metadata } from 'next'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { UrlTool } from './UrlTool'

export const metadata: Metadata = {
  title: 'URL Codec',
  description: 'Percent-encode and decode URL strings in your browser.',
}

export default function UrlPage() {
  return (
    <ToolLayout
      title="URL Codec"
      tagline="Toggle between encodeURIComponent (strict) and encodeURI (preserves reserved characters)."
    >
      <UrlTool />
    </ToolLayout>
  )
}
