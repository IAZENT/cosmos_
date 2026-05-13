import * as React from 'react'

/**
 * Shared layout primitive used by every dynamic OG card. Renders the
 * Cosmos brand frame (wordmark + accent rule + footer URL) and slots
 * caller content into the centre.
 *
 * Important runtime constraints (Next.js `next/og` / Satori):
 *   1. Every node must have a flex display when it has > 1 child.
 *   2. No external <img> URLs unless preceded by `ImageResponse`'s
 *      runtime cache  inline SVG is safest.
 *   3. Colours go inline; CSS variables are not resolved here.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = 'image/png'

const COLORS = {
  bg: '#070809',
  bgElevated: '#0d0f12',
  border: '#1c2026',
  text: '#e6e6e6',
  textMuted: '#9aa3ad',
  textDim: '#5b6470',
  accent: '#7dd3fc',
  critical: '#f87171',
  high: '#fb923c',
  medium: '#fbbf24',
  low: '#60a5fa',
} as const

export type OGSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export function severityColor(s: OGSeverity): string {
  switch (s) {
    case 'CRITICAL':
      return COLORS.critical
    case 'HIGH':
      return COLORS.high
    case 'MEDIUM':
      return COLORS.medium
    case 'LOW':
      return COLORS.low
    default:
      return COLORS.textDim
  }
}

export function OGFrame({
  eyebrow,
  children,
  footerHost,
}: {
  eyebrow?: string
  children: React.ReactNode
  footerHost?: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: 'system-ui, "Segoe UI", Helvetica, sans-serif',
        padding: 64,
        position: 'relative',
      }}
    >
      {/* Accent rule at the top, mirroring `cosmos-section` borders */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: COLORS.accent,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 18,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: COLORS.textDim,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace',
          }}
        >
          <span style={{ color: COLORS.accent }}>{'>'}</span>
          <span style={{ color: COLORS.text, letterSpacing: 4 }}>COSMOS</span>
        </div>
        {eyebrow ? (
          <span
            style={{
              fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace',
              fontSize: 16,
            }}
          >
            {eyebrow}
          </span>
        ) : null}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          marginTop: 32,
          marginBottom: 32,
        }}
      >
        {children}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 16,
          color: COLORS.textDim,
          fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace',
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: 20,
        }}
      >
        <span>cybersecurity intelligence platform</span>
        <span>{footerHost ?? 'cosmos.security'}</span>
      </div>
    </div>
  )
}

export { COLORS as OG_COLORS }
