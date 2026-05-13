import { ImageResponse } from 'next/og'
import { OGFrame, OG_SIZE, OG_CONTENT_TYPE, OG_COLORS } from '@/lib/og/Frame'

export const runtime = 'edge'
export const alt =
  'COSMOS  Cybersecurity intelligence, research, and operational infrastructure'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OG() {
  return new ImageResponse(
    (
      <OGFrame eyebrow="// platform">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: OG_COLORS.text,
            }}
          >
            Cybersecurity intelligence,
          </div>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: OG_COLORS.accent,
            }}
          >
            continuously updated.
          </div>
          <div
            style={{
              fontSize: 28,
              marginTop: 16,
              color: OG_COLORS.textMuted,
              maxWidth: 900,
            }}
          >
            Live CVE feeds  CISA KEV catalog  threat lookup  practitioner
            research.
          </div>
        </div>
      </OGFrame>
    ),
    { ...size },
  )
}
