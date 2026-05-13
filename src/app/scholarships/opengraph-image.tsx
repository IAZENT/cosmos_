import { ImageResponse } from 'next/og'
import { OGFrame, OG_SIZE, OG_CONTENT_TYPE, OG_COLORS } from '@/lib/og/Frame'

export const runtime = 'edge'
export const alt =
  'COSMOS Scholarships  Find your next funding, continuously updated'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OG() {
  return new ImageResponse(
    (
      <OGFrame eyebrow="// scholarship intelligence">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              fontSize: 80,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: OG_COLORS.text,
              maxWidth: 1000,
            }}
          >
            Find your next scholarship,
          </div>
          <div
            style={{
              fontSize: 80,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: OG_COLORS.accent,
            }}
          >
            continuously updated.
          </div>
          <div
            style={{
              fontSize: 26,
              marginTop: 8,
              color: OG_COLORS.textMuted,
              maxWidth: 1000,
            }}
          >
            Bachelor · Master · PhD · Postdoc  aggregated from
            OpportunityDesk, Scholars4Dev, EURAXESS, and Germany-focused feeds.
          </div>
        </div>
      </OGFrame>
    ),
    { ...size },
  )
}
