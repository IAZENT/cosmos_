import { ImageResponse } from 'next/og'
import { OGFrame, OG_SIZE, OG_CONTENT_TYPE, OG_COLORS } from '@/lib/og/Frame'

export const runtime = 'edge'
export const alt = 'COSMOS Intelligence  Live threat data from NVD and CISA KEV'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OG() {
  return new ImageResponse(
    (
      <OGFrame eyebrow="// intelligence feed">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: OG_COLORS.text,
              maxWidth: 1000,
            }}
          >
            Live threat data,
          </div>
          <div
            style={{
              fontSize: 84,
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
              marginTop: 12,
              color: OG_COLORS.textMuted,
              maxWidth: 980,
            }}
          >
            Normalised CVEs from NVD, cross-referenced with the CISA Known
            Exploited Vulnerabilities catalog.
          </div>
        </div>
      </OGFrame>
    ),
    { ...size },
  )
}
