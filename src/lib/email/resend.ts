/**
 * Minimal Resend client. Uses fetch directly to avoid pulling in the
 * official SDK (a few hundred KB) just to send 2-3 email shapes.
 *
 * Degrades to console.log when RESEND_API_KEY is unset so local dev
 * never bounces emails into the void. In production set:
 *   RESEND_API_KEY=re_…
 *   DIGEST_FROM_EMAIL="COSMOS <intel@your-domain.com>"
 *
 * The from-address domain must be verified inside Resend before the API
 * accepts sends.
 */

export interface SendEmailInput {
  to: string
  subject: string
  text: string
  html: string
  /**
   * Optional RFC 8058 one-click unsubscribe URL. When present, the
   * generated `List-Unsubscribe-Post` + `List-Unsubscribe` headers turn
   * the "unsubscribe" link in Gmail/Outlook into a one-click action.
   */
  unsubscribeUrl?: string
}

export interface SendEmailResult {
  ok: boolean
  id?: string
  error?: string
  /** True when no provider was configured  the call was logged only. */
  loggedOnly?: boolean
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export function emailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.DIGEST_FROM_EMAIL?.trim(),
  )
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.DIGEST_FROM_EMAIL?.trim()

  if (!apiKey || !from) {
    console.warn(
      '[email] RESEND_API_KEY or DIGEST_FROM_EMAIL not set  logging only',
      { to: input.to, subject: input.subject },
    )
    return { ok: true, loggedOnly: true }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
  // Resend mirrors these headers to the outgoing message when included
  // in the request body's `headers` field.
  const extraHeaders: Record<string, string> = {}
  if (input.unsubscribeUrl) {
    extraHeaders['List-Unsubscribe'] = `<${input.unsubscribeUrl}>`
    extraHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  const body: Record<string, unknown> = {
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  }
  if (Object.keys(extraHeaders).length > 0) body.headers = extraHeaders

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return {
        ok: false,
        error: `resend ${res.status}: ${text.slice(0, 200)}`,
      }
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string }
    return json.id ? { ok: true, id: json.id } : { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown send error',
    }
  } finally {
    clearTimeout(timeout)
  }
}
