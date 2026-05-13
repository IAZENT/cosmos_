// Document importer for the markdown editor.
//
// Accepts a multipart/form-data upload of a PDF, DOCX, plain text or HTML
// file and returns `{ markdown }`. Used by the admin MarkdownEditor's
// "Import" button so authors can draft in Word / Docs / a PDF report and
// drop it straight into the editor.
//
// Auth: gated by `getCurrentUser` + email allow-list, same pattern as
// every other admin server action.

import { NextResponse } from 'next/server'
import { getCurrentUser, isAllowedAdminEmail } from '@/lib/auth/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// PDF + DOCX parsers are CPU-bound; raise the default body limit so a
// 10 MB Word doc isn't truncated.
export const maxDuration = 30

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

function htmlToMarkdown(html: string): string {
  // turndown is CommonJS-only; keep the import lazy so cold start
  // stays cheap when this route isn't hit.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TurndownService = require('turndown') as typeof import('turndown')
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '_',
  })
  // Drop Word's giant inline style soup before conversion.
  td.remove(['style', 'script'])
  // Strip empty paragraphs that Word loves to emit.
  td.addRule('drop-empty-p', {
    filter: (node) =>
      node.nodeName === 'P' &&
      (node.textContent ?? '').trim() === '' &&
      !node.querySelector('img'),
    replacement: () => '',
  })
  return td.turndown(html)
}

// Tuning knobs picked to keep the importer well below the Vercel
// serverless 50 MB body / 30 s timeout, and well below Next dev's
// single-worker tolerance for blocking work.
const IMAGE_MAX_WIDTH = 900 // px on the long edge after resize
const IMAGE_MAX_COUNT = 12 // hard cap per document
const IMAGE_MIN_DIM = 100 // skip <100 px decorative glyphs
const IMAGE_TOTAL_BUDGET = 3 * 1024 * 1024 // 3 MB inlined across all images
const IMAGE_RAW_LIMIT = 60 * 1024 * 1024 // skip raw buffers > 60 MB
const PER_IMAGE_TIMEOUT_MS = 4000 // sharp is fast; 4 s = "something's wrong"
const PDF_AUTO_DISABLE_BYTES = 8 * 1024 * 1024 // skip image pass on PDFs > 8 MB

/** Yield to the event loop so the Next.js worker can service other requests. */
const yieldToLoop = () => new Promise<void>((r) => setImmediate(r))

/** Race a promise against a wall-clock timeout. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

async function encodeImage(
  data: Uint8Array | Buffer,
  raw?: { width: number; height: number; channels: 1 | 2 | 3 | 4 },
): Promise<string | null> {
  // Reject pathologically huge raw buffers before they ever reach sharp.
  if (data.byteLength > IMAGE_RAW_LIMIT) return null
  try {
    const sharp = (await import('sharp')).default
    const pipeline = raw ? sharp(data, { raw }) : sharp(data)
    const png = await withTimeout(
      pipeline
        .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer(),
      PER_IMAGE_TIMEOUT_MS,
      'sharp encode',
    )
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}

async function pdfToMarkdown(
  bytes: Uint8Array,
  extractImagesEnabled: boolean,
): Promise<string> {
  const { extractText, extractImages, getDocumentProxy } = await import('unpdf')
  const pdf = await getDocumentProxy(bytes)
  const { totalPages, text } = await extractText(pdf, { mergePages: true })

  // Text first, with paragraph-shaping heuristics that un-wrap PDF
  // column line breaks while preserving double-newline paragraph splits.
  const md = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/([^\n])\n(?!\n)/g, '$1 ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Caller opted out of image extraction.
  if (!extractImagesEnabled) return md
  // Skip the (expensive) image pass on big PDFs by default. Authors can
  // re-import a stripped-down version or use DOCX if they need images.
  if (bytes.byteLength > PDF_AUTO_DISABLE_BYTES) return md

  const imageBlocks: string[] = []
  let extracted = 0
  let bytesUsed = 0

  for (
    let pageNum = 1;
    pageNum <= totalPages &&
    extracted < IMAGE_MAX_COUNT &&
    bytesUsed < IMAGE_TOTAL_BUDGET;
    pageNum++
  ) {
    await yieldToLoop()
    let pageImages: Awaited<ReturnType<typeof extractImages>> = []
    try {
      pageImages = await withTimeout(
        extractImages(pdf, pageNum),
        PER_IMAGE_TIMEOUT_MS,
        `extractImages page ${pageNum}`,
      )
    } catch {
      // Encrypted / inline / corrupt image stream  skip the page.
      continue
    }

    for (
      let i = 0;
      i < pageImages.length &&
      extracted < IMAGE_MAX_COUNT &&
      bytesUsed < IMAGE_TOTAL_BUDGET;
      i++
    ) {
      const img = pageImages[i]
      if (!img) continue
      // Filter decorative thumbnails / page-corner glyphs.
      if (img.width < IMAGE_MIN_DIM || img.height < IMAGE_MIN_DIM) continue
      const channels = (img.channels ?? 3) as 1 | 2 | 3 | 4
      const view = new Uint8Array(
        img.data.buffer,
        img.data.byteOffset,
        img.data.byteLength,
      )
      const dataUrl = await encodeImage(view, {
        width: img.width,
        height: img.height,
        channels,
      })
      // Yield even on failure so a long string of bad images can't hog
      // the worker.
      await yieldToLoop()
      if (!dataUrl) continue

      // Stop accepting once the cumulative payload would push us past
      // budget. We approximate the byte cost from the data-URI string.
      const cost = dataUrl.length
      if (bytesUsed + cost > IMAGE_TOTAL_BUDGET) break

      bytesUsed += cost
      extracted += 1
      imageBlocks.push(
        `![pdf-image-${extracted} (page ${pageNum})](${dataUrl})`,
      )
    }
  }

  if (imageBlocks.length === 0) return md
  return [
    md,
    '',
    `## Embedded images (${imageBlocks.length})`,
    '',
    imageBlocks.join('\n\n'),
  ].join('\n')
}

async function docxToMarkdown(bytes: Buffer): Promise<string> {
  const mammoth = (await import('mammoth')).default
  // mammoth's image converter receives each embedded image  we re-encode
  // through sharp for consistent sizing/compression and emit a data URI
  // that turndown will preserve as a Markdown image link.
  const { value: html } = await mammoth.convertToHtml(
    { buffer: bytes },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const buffer = await image.read()
        const dataUrl = await encodeImage(buffer)
        // ImageAttributes only carries `src`. Empty src = turndown drops
        // the <img> element entirely, which is exactly what we want on
        // an encode failure.
        return { src: dataUrl ?? '' }
      }),
    },
  )
  return htmlToMarkdown(html)
}

export async function POST(request: Request) {
  // Auth gate.
  const user = await getCurrentUser()
  if (!user || !isAllowedAdminEmail(user.email ?? null)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with a `file` field.' },
      { status: 400 },
    )
  }
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing `file` field.' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File exceeds the ${MAX_BYTES / 1024 / 1024} MB limit.` },
      { status: 413 },
    )
  }

  const name = file.name.toLowerCase()
  const buf = Buffer.from(await file.arrayBuffer())
  // Honour ?images=0 (or form field `images=0`) so authors can opt out
  // of the expensive PDF image pass when text-only is enough.
  const url = new URL(request.url)
  const imagesEnabled =
    url.searchParams.get('images') !== '0' &&
    String(form.get('images') ?? '') !== '0'

  try {
    let markdown: string
    if (name.endsWith('.pdf') || file.type === 'application/pdf') {
      markdown = await pdfToMarkdown(new Uint8Array(buf), imagesEnabled)
    } else if (
      name.endsWith('.docx') ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      markdown = await docxToMarkdown(buf)
    } else if (
      name.endsWith('.html') ||
      name.endsWith('.htm') ||
      file.type === 'text/html'
    ) {
      markdown = htmlToMarkdown(buf.toString('utf8'))
    } else if (
      name.endsWith('.md') ||
      name.endsWith('.markdown') ||
      name.endsWith('.txt') ||
      file.type.startsWith('text/')
    ) {
      markdown = buf.toString('utf8')
    } else {
      return NextResponse.json(
        {
          error:
            'Unsupported file type. Use .pdf, .docx, .html, .md or plain text.',
        },
        { status: 415 },
      )
    }
    return NextResponse.json({
      markdown,
      filename: file.name,
      bytes: file.size,
    })
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Parse failed: ${err.message}`
            : 'Parse failed.',
      },
      { status: 500 },
    )
  }
}
