import { NextResponse } from 'next/server'
import { z } from 'zod'
import type {
  ArsenalFallbackResponse,
  ArsenalFallbackResult,
} from '@/types/arsenal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  query: z.string().trim().min(3).max(200),
})

const fallbackSchema = z.object({
  title: z.string().min(1).max(200),
  command: z.string().min(1).max(4000),
  description: z.string().min(1).max(800),
  category: z.string().min(1).max(80),
  tags: z.array(z.string().min(1).max(48)).max(12).optional().default([]),
  note: z.string().max(800).optional().default(''),
  disclaimer: z.string().optional().default('AI-generated  verify before use.'),
})

const SYSTEM_PROMPT = `You are COSMOS ARSENAL  a cybersecurity operator knowledge base.
The user searched for a command or technique that is not in the local database.
Respond with a JSON object ONLY. No markdown, no preamble, no explanation.

Schema:
{
  "title": "short descriptive title",
  "command": "the exact command or technique",
  "description": "what it does in plain English, 1-2 sentences",
  "category": "one of: recon|enumeration|exploitation|post-exploitation|privilege-escalation|web|network|active-directory|reverse-engineering|malware-analysis|forensics|dfir|cryptography|steganography|osint|wireless|ctf|scripting|tools|misc",
  "tags": ["tag1","tag2","tag3"],
  "note": "important caveats, variations, or things to watch out for",
  "disclaimer": "AI-generated  verify before use in real engagements"
}

Rules:
- Only provide commands that are real, documented, and accurate.
- If unsure about exact syntax, say so in the note field.
- Never fabricate tool names or flags that do not exist.
- If the query is not cybersecurity-related, return {"error":"out of scope"}.`

const MODEL =
  process.env.ANTHROPIC_ARSENAL_MODEL?.trim() || 'claude-opus-4-5'

function extractJson(text: string): unknown {
  // Strip code fences if the model returned ```json ... ```
  const trimmed = text.trim()
  const fenced = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed)
  const raw = fenced && fenced[1] ? fenced[1] : trimmed
  // Find the first { ... } block
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid json', source: 'fallback' } satisfies ArsenalFallbackResponse,
      { status: 400 },
    )
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'query must be 3-200 chars', source: 'fallback' } satisfies ArsenalFallbackResponse,
      { status: 400 },
    )
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'AI fallback is not configured. Set ANTHROPIC_API_KEY in the environment to enable web-style search.',
        source: 'fallback',
      } satisfies ArsenalFallbackResponse,
      { status: 503 },
    )
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: parsed.data.query }],
      }),
    })
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '')
      return NextResponse.json(
        {
          error: `upstream ${upstream.status}: ${text.slice(0, 200)}`,
          source: 'fallback',
        } satisfies ArsenalFallbackResponse,
        { status: 502 },
      )
    }
    const json = (await upstream.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    const textBlock = (json.content ?? []).find((b) => b.type === 'text')
    const raw = textBlock?.text ?? ''
    const obj = extractJson(raw)
    if (!obj || typeof obj !== 'object') {
      return NextResponse.json(
        { error: 'model returned no usable JSON', source: 'fallback' } satisfies ArsenalFallbackResponse,
        { status: 502 },
      )
    }
    if ('error' in (obj as Record<string, unknown>)) {
      return NextResponse.json(
        { error: 'out of scope', source: 'fallback' } satisfies ArsenalFallbackResponse,
        { status: 200 },
      )
    }
    const fb = fallbackSchema.safeParse(obj)
    if (!fb.success) {
      return NextResponse.json(
        { error: 'model output failed validation', source: 'fallback' } satisfies ArsenalFallbackResponse,
        { status: 502 },
      )
    }
    const result: ArsenalFallbackResult = {
      ...fb.data,
      disclaimer:
        fb.data.disclaimer || 'AI-generated  verify before use in real engagements.',
    }
    return NextResponse.json(
      { result, source: 'fallback' } satisfies ArsenalFallbackResponse,
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'unknown error',
        source: 'fallback',
      } satisfies ArsenalFallbackResponse,
      { status: 500 },
    )
  }
}
