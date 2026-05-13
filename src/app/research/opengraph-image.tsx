import { ImageResponse } from 'next/og'
import { OGFrame, OG_SIZE, OG_CONTENT_TYPE, OG_COLORS } from '@/lib/og/Frame'

export const runtime = 'edge'
export const alt = 'COSMOS Research  Practitioner writeups and analyses'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OG() {
  return new ImageResponse(
    (
      <OGFrame eyebrow="// research">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: OG_COLORS.text,
            }}
          >
            Research,
          </div>
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: OG_COLORS.accent,
            }}
          >
            from the field.
          </div>
          <div
            style={{
              fontSize: 26,
              marginTop: 8,
              color: OG_COLORS.textMuted,
              maxWidth: 980,
            }}
          >
            Malware analysis, reverse engineering, DFIR notes, and exploit
            writeups from practitioners.
          </div>
        </div>
      </OGFrame>
    ),
    { ...size },
  )
}
