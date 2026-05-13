import { ImageResponse } from 'next/og'
import {
  OGFrame,
  OG_SIZE,
  OG_CONTENT_TYPE,
  OG_COLORS,
  severityColor,
  type OGSeverity,
} from '@/lib/og/Frame'
import { getCveById, normalizeCveId } from '@/lib/intel/cve-detail'

// `getCveById` does server-side fetches with Node-only APIs (Supabase
// client uses cookies()). Edge runtime would break it  use Node here.
export const runtime = 'nodejs'
export const alt = 'CVE detail card'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function CVEOG({
  params,
}: {
  params: { id: string }
}) {
  const cveId = normalizeCveId(params.id) ?? params.id.toUpperCase()
  const cve = await getCveById(cveId).catch(() => null)

  // Defensive: even on miss, render a branded placeholder rather than
  // 500ing  social crawlers cache 5xx responses for hours.
  const sev: OGSeverity =
    cve?.severity && cve.severity !== 'INFO' && cve.severity !== 'NONE'
      ? (cve.severity as OGSeverity)
      : 'NONE'
  const score = cve?.cvssScore ?? null
  const desc = (cve?.description ?? 'Vulnerability record').slice(0, 220)
  const isKev = Boolean(cve?.isKev)

  return new ImageResponse(
    (
      <OGFrame eyebrow="// vulnerability record">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontFamily:
                  'ui-monospace, "SFMono-Regular", Menlo, monospace',
                fontSize: 76,
                color: OG_COLORS.text,
                letterSpacing: -1,
              }}
            >
              {cveId}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                border: `2px solid ${severityColor(sev)}`,
                color: severityColor(sev),
                fontFamily:
                  'ui-monospace, "SFMono-Regular", Menlo, monospace',
                fontSize: 22,
                letterSpacing: 2,
              }}
            >
              {sev === 'NONE' ? 'UNSCORED' : sev}
            </div>
            {isKev ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 8,
                  paddingBottom: 8,
                  border: `2px solid ${OG_COLORS.critical}`,
                  color: OG_COLORS.critical,
                  fontFamily:
                    'ui-monospace, "SFMono-Regular", Menlo, monospace',
                  fontSize: 22,
                  letterSpacing: 2,
                }}
              >
                KEV
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
            }}
          >
            <div
              style={{
                fontFamily:
                  'ui-monospace, "SFMono-Regular", Menlo, monospace',
                fontSize: 96,
                color: severityColor(sev),
                lineHeight: 1,
              }}
            >
              {score != null ? score.toFixed(1) : '?'}
            </div>
            <div
              style={{
                fontFamily:
                  'ui-monospace, "SFMono-Regular", Menlo, monospace',
                fontSize: 22,
                color: OG_COLORS.textDim,
                letterSpacing: 2,
              }}
            >
              CVSS / 10
            </div>
          </div>

          <div
            style={{
              fontSize: 26,
              lineHeight: 1.4,
              color: OG_COLORS.textMuted,
              maxWidth: 1050,
              display: 'block',
            }}
          >
            {desc}
          </div>
        </div>
      </OGFrame>
    ),
    { ...size },
  )
}
