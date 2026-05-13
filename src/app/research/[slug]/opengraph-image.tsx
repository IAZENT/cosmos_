import { ImageResponse } from 'next/og'
import { OGFrame, OG_SIZE, OG_CONTENT_TYPE, OG_COLORS } from '@/lib/og/Frame'
import { getResearchBySlug } from '@/lib/content/server-data'

// Uses Supabase (cookies()), so Node runtime is required.
export const runtime = 'nodejs'
export const alt = 'Research post'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function ResearchOG({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getResearchBySlug(params.slug).catch(() => null)
  const title = post?.title ?? 'Research'
  const summary = post?.summary ?? ''
  const category = post?.category ?? 'research'

  // Clamp title to a length that won't overflow the 1200×630 canvas at
  // 72px. Slightly aggressive  Satori wraps unbalanced lines awkwardly.
  const clampedTitle = title.length > 110 ? `${title.slice(0, 107)}...` : title
  const clampedSummary =
    summary.length > 220 ? `${summary.slice(0, 217)}...` : summary

  return new ImageResponse(
    (
      <OGFrame eyebrow={`// ${category}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: clampedTitle.length > 60 ? 56 : 72,
              lineHeight: 1.1,
              letterSpacing: -1,
              color: OG_COLORS.text,
              maxWidth: 1050,
            }}
          >
            {clampedTitle}
          </div>
          {clampedSummary ? (
            <div
              style={{
                fontSize: 24,
                lineHeight: 1.4,
                color: OG_COLORS.textMuted,
                maxWidth: 1000,
              }}
            >
              {clampedSummary}
            </div>
          ) : null}
        </div>
      </OGFrame>
    ),
    { ...size },
  )
}
