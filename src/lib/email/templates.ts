import { describeFilters, type SavedSearchFilters } from '@/types/saved-search'

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
}

function shell(body: string, preview: string): string {
  // Minimal email-safe HTML: table-based, inline styles only. Hidden
  // preview text gives Gmail/Outlook a meaningful preview line.
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#070809;color:#e6e6e6;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070809;padding:32px 0;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0d0f12;border:1px solid #1c2026;border-radius:6px;">
      <tr><td style="padding:24px 28px;border-bottom:1px solid #1c2026;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;letter-spacing:3px;color:#9aa3ad;text-transform:uppercase;">
        <span style="color:#7dd3fc;">&gt;</span>&nbsp; COSMOS
      </td></tr>
      <tr><td style="padding:28px;font-size:14px;line-height:1.6;color:#e6e6e6;">
        ${body}
      </td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid #1c2026;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#5b6470;">
        cybersecurity intelligence platform
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

/* ------------------------------------------------------------------ *
 * Verification email
 * ------------------------------------------------------------------ */

export function buildVerifyEmail(opts: {
  filters: SavedSearchFilters
  label: string | null
  verifyToken: string
}): { subject: string; text: string; html: string } {
  const base = appUrl()
  const verifyUrl = `${base}/api/intelligence/subscribe/verify?token=${encodeURIComponent(opts.verifyToken)}`
  const summary = describeFilters(opts.filters)
  const niceLabel = opts.label ? `"${opts.label}"` : 'your saved search'

  const subject = 'Confirm your COSMOS CVE digest subscription'
  const text = [
    'Confirm your COSMOS CVE digest',
    '------------------------------',
    '',
    `We received a request to subscribe ${niceLabel} to weekly digests`,
    `matching: ${summary}`,
    '',
    'Confirm by visiting:',
    verifyUrl,
    '',
    'If you did not request this, you can ignore this email  no',
    'subscription will be created until the link is clicked.',
    '',
    ' COSMOS',
  ].join('\n')

  const html = shell(
    `
    <p style="margin:0 0 14px 0;font-size:18px;color:#e6e6e6;">Confirm your CVE digest</p>
    <p style="margin:0 0 18px 0;color:#9aa3ad;">We received a request to subscribe <strong style="color:#e6e6e6;">${escapeHtml(niceLabel)}</strong> to weekly digests of newly-matching CVEs.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="background:#070809;border:1px solid #1c2026;border-radius:4px;margin:0 0 18px 0;">
      <tr><td style="padding:12px 14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#9aa3ad;">
        ${escapeHtml(summary)}
      </td></tr>
    </table>
    <p style="margin:0 0 20px 0;">
      <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#7dd3fc;color:#070809;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;">Confirm subscription</a>
    </p>
    <p style="margin:0;color:#5b6470;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
    `,
    'Confirm your CVE digest subscription',
  )

  return { subject, text, html }
}

/* ------------------------------------------------------------------ *
 * Weekly digest email
 * ------------------------------------------------------------------ */

export interface DigestCveItem {
  cveId: string
  description: string | null
  cvssScore: number | null
  cvssSeverity: string | null
  isKev: boolean
  publishedAt: string | null
}

export function buildDigestEmail(opts: {
  label: string | null
  filters: SavedSearchFilters
  items: DigestCveItem[]
  unsubscribeUrl: string
}): { subject: string; text: string; html: string } {
  const base = appUrl()
  const summary = describeFilters(opts.filters)
  const niceLabel = opts.label?.trim() || 'your saved search'
  const totalLabel = `${opts.items.length} new CVE${opts.items.length === 1 ? '' : 's'}`

  const subject = `COSMOS digest  ${totalLabel} (${niceLabel})`

  const textLines: string[] = []
  textLines.push(`COSMOS digest  ${totalLabel}`)
  textLines.push('----------------------------------')
  textLines.push('')
  textLines.push(`Saved search: ${niceLabel}`)
  textLines.push(`Filter: ${summary}`)
  textLines.push('')
  for (const cve of opts.items) {
    const score =
      cve.cvssScore != null ? `CVSS ${cve.cvssScore.toFixed(1)} ` : ''
    const sev = cve.cvssSeverity ? `[${cve.cvssSeverity}] ` : ''
    const kev = cve.isKev ? '[KEV] ' : ''
    textLines.push(`${cve.cveId}  ${kev}${sev}${score}`)
    if (cve.description) {
      textLines.push(`  ${cve.description.slice(0, 160)}`)
    }
    textLines.push(`  ${base}/intelligence/cve/${cve.cveId}`)
    textLines.push('')
  }
  textLines.push('Unsubscribe:')
  textLines.push(opts.unsubscribeUrl)
  const text = textLines.join('\n')

  const rows = opts.items
    .map((cve) => {
      const sev = (cve.cvssSeverity ?? '').toUpperCase()
      const sevColor =
        sev === 'CRITICAL'
          ? '#f87171'
          : sev === 'HIGH'
            ? '#fb923c'
            : sev === 'MEDIUM'
              ? '#fbbf24'
              : sev === 'LOW'
                ? '#60a5fa'
                : '#5b6470'
      const score = cve.cvssScore != null ? cve.cvssScore.toFixed(1) : ''
      const desc = escapeHtml((cve.description ?? '').slice(0, 220))
      return `
        <tr><td style="padding:14px 0;border-bottom:1px solid #1c2026;">
          <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;">
            <a href="${base}/intelligence/cve/${cve.cveId}" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#e6e6e6;font-size:14px;text-decoration:none;">${cve.cveId}</a>
            ${sev ? `<span style="color:${sevColor};font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">${sev}</span>` : ''}
            ${score ? `<span style="color:#9aa3ad;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;">CVSS ${score}</span>` : ''}
            ${cve.isKev ? `<span style="color:#f87171;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;border:1px solid #f87171;padding:1px 6px;border-radius:999px;">KEV</span>` : ''}
          </div>
          <div style="margin-top:6px;color:#9aa3ad;font-size:13px;line-height:1.5;">${desc}</div>
        </td></tr>`
    })
    .join('')

  const html = shell(
    `
    <p style="margin:0 0 6px 0;font-size:18px;color:#e6e6e6;">${escapeHtml(totalLabel)}</p>
    <p style="margin:0 0 18px 0;color:#9aa3ad;font-size:13px;">matching <strong style="color:#e6e6e6;">${escapeHtml(niceLabel)}</strong>  ${escapeHtml(summary)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows}
    </table>
    <p style="margin:24px 0 0 0;font-size:12px;color:#5b6470;">You're receiving this because you subscribed at <a href="${base}" style="color:#7dd3fc;text-decoration:none;">${escapeHtml(base.replace(/^https?:\/\//, ''))}</a>. <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#9aa3ad;text-decoration:underline;">Unsubscribe</a>.</p>
    `,
    `${totalLabel} matching ${niceLabel}`,
  )

  return { subject, text, html }
}
