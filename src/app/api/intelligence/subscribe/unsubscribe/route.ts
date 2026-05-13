import { createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function htmlResponse(status: number, title: string, body: string): Response {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '')
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}  COSMOS</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
      body{margin:0;background:#070809;color:#e6e6e6;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
      .card{max-width:560px;width:100%;background:#0d0f12;border:1px solid #1c2026;border-radius:6px;padding:32px;}
      .eyebrow{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:2px;color:#7dd3fc;text-transform:uppercase;margin-bottom:10px;}
      h1{font-size:24px;margin:0 0 12px 0;color:#e6e6e6;}
      p{margin:0 0 16px 0;color:#9aa3ad;line-height:1.6;font-size:14px;}
      a.btn{display:inline-block;background:#7dd3fc;color:#070809;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:600;margin-top:10px;}
    </style></head><body><div class="card"><div class="eyebrow">${title}</div>${body}<p><a class="btn" href="${base}/intelligence">→ Back to intelligence</a></p></div></body></html>`,
    {
      status,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    },
  )
}

async function unsubscribe(token: string | null): Promise<Response> {
  if (!token || !/^[a-f0-9]{32,128}$/i.test(token)) {
    return htmlResponse(
      400,
      'invalid link',
      '<h1>That link is invalid.</h1><p>The unsubscribe token is missing or malformed.</p>',
    )
  }

  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch {
    return htmlResponse(
      503,
      'service unavailable',
      '<h1>Try again later.</h1>',
    )
  }

  const { error, count } = await supabase
    .from('saved_searches')
    .delete({ count: 'exact' })
    .eq('unsubscribe_token', token)

  if (error) {
    return htmlResponse(
      500,
      'unsubscribe failed',
      `<h1>Something went wrong.</h1><p>${error.message}</p>`,
    )
  }

  if (!count) {
    return htmlResponse(
      200,
      'already unsubscribed',
      "<h1>You&rsquo;re already unsubscribed.</h1><p>Nothing to do  this subscription was already removed.</p>",
    )
  }

  return htmlResponse(
    200,
    'unsubscribed',
    "<h1>Unsubscribed.</h1><p>You won&rsquo;t receive any more digests for this saved search. Sorry to see you go.</p>",
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  return unsubscribe(url.searchParams.get('token')?.trim() ?? null)
}

// RFC 8058 one-click unsubscribe: mail clients POST when the user clicks
// the inbox-level "Unsubscribe" affordance.
export async function POST(request: Request) {
  const url = new URL(request.url)
  let token = url.searchParams.get('token')?.trim() ?? null
  if (!token) {
    try {
      const form = await request.formData()
      const t = form.get('token')
      if (typeof t === 'string') token = t.trim()
    } catch {
      /* ignore */
    }
  }
  return unsubscribe(token)
}
