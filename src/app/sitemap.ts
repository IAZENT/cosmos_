import type { MetadataRoute } from 'next'
import { listPublishedResearch } from '@/lib/content/server-data'

const STATIC_ROUTES = [
  '',
  '/intelligence',
  '/research',
  '/resources',
  '/resources/submit',
  '/tools',
  '/tools/base64',
  '/tools/url',
  '/tools/jwt',
  '/tools/hash',
  '/tools/cvss',
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '')

  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/intelligence' ? 'hourly' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  let researchEntries: MetadataRoute.Sitemap = []
  try {
    const posts = await listPublishedResearch()
    researchEntries = posts.map((p) => ({
      url: `${base}/research/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch {
    /* sitemap should never throw  degrade silently */
  }

  return [...staticEntries, ...researchEntries]
}
