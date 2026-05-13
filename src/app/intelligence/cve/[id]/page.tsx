import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { IntelStatusBar } from '@/components/home/IntelStatusBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { CVEPermalinkActions } from '@/components/intelligence/CVEPermalinkActions'
import {
  getCveById,
  normalizeCveId,
} from '@/lib/intel/cve-detail'
import { formatUTC, formatRelative } from '@/lib/utils/date'
import { severityVarMap, type Severity } from '@/lib/utils/severity'

// CVE records change infrequently after publish, but KEV add-dates can land
// hours after the CVE itself. An hour of revalidation strikes a reasonable
// balance between freshness and Supabase load.
export const revalidate = 3600

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id: rawId } = await params
  const cveId = normalizeCveId(rawId)
  if (!cveId) {
    return { title: 'Not found', robots: { index: false } }
  }
  const cve = await getCveById(cveId)
  if (!cve) {
    return { title: `${cveId}  not found`, robots: { index: false } }
  }
  const sev = cve.severity === 'NONE' ? '' : `${cve.severity} · `
  const score = cve.cvssScore != null ? `CVSS ${cve.cvssScore.toFixed(1)} · ` : ''
  const desc = (cve.description ?? '').slice(0, 180)
  return {
    title: cve.cveId,
    description: `${sev}${score}${desc}`.trim(),
    alternates: {
      canonical: `/intelligence/cve/${cve.cveId}`,
    },
    openGraph: {
      title: `${cve.cveId}  COSMOS Intelligence`,
      description: `${sev}${score}${desc}`.trim(),
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cve.cveId}  COSMOS Intelligence`,
      description: `${sev}${score}${desc}`.trim(),
    },
  }
}

function CVSSRing({
  score,
  severity,
}: {
  score: number | null
  severity: Severity
}) {
  const max = 10
  const safe =
    score != null && !Number.isNaN(score)
      ? Math.max(0, Math.min(max, score))
      : 0
  const pct = Math.round((safe / max) * 100)
  const color = severityVarMap[severity]
  return (
    <div
      className="relative grid h-[148px] w-[148px] place-items-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${pct}%, var(--cosmos-bg-subtle) ${pct}%)`,
      }}
      aria-label={`CVSS score ${safe.toFixed(1)} of ${max}`}
    >
      <div className="grid h-[120px] w-[120px] place-items-center rounded-full bg-[var(--cosmos-bg-elevated)]">
        <div className="text-center">
          <div className="font-mono text-[32px] leading-none text-[var(--cosmos-text)]">
            {score != null ? score.toFixed(1) : ''}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--cosmos-text-dim)]">
            CVSS / 10
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function CVEDetailPage({ params }: PageProps) {
  const { id: rawId } = await params
  const cveId = normalizeCveId(rawId)
  if (!cveId) notFound()

  const cve = await getCveById(cveId)
  if (!cve) notFound()

  const vectorString = cve.cvssVector
  const sourceLabel =
    cve.source === 'supabase' ? 'cached · NVD via COSMOS sync' : 'live · NVD'

  // JSON-LD: TechArticle is the closest schema.org type for an
  // analysed vulnerability advisory. Helps search engines surface the page
  // for "CVE-XXXX-YYYY" queries.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: cve.cveId,
    description: (cve.description ?? '').slice(0, 500),
    datePublished: cve.publishedAt ?? undefined,
    dateModified: cve.modifiedAt ?? cve.publishedAt ?? undefined,
    author: {
      '@type': 'Organization',
      name: 'NIST NVD',
      url: 'https://nvd.nist.gov',
    },
    publisher: {
      '@type': 'Organization',
      name: 'COSMOS',
    },
    mainEntityOfPage: `/intelligence/cve/${cve.cveId}`,
  }

  return (
    <>
      <IntelStatusBar />
      <Navbar />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <article className="px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12 md:px-12 md:pt-16">
          <div className="cosmos-container max-w-4xl">
            <Link
              href="/intelligence"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
            >
              <ChevronLeft size={12} aria-hidden /> All intelligence
            </Link>

            <header className="mt-6 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <SectionLabel>vulnerability record</SectionLabel>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
                  {sourceLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-mono text-[28px] tracking-[-0.01em] text-[var(--cosmos-text)] sm:text-[36px]">
                  {cve.cveId}
                </h1>
                <SeverityBadge level={cve.severity} />
                {cve.isKev ? (
                  <span className="rounded-full border border-[var(--cosmos-critical)] px-2.5 py-[3px] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
                    KEV
                  </span>
                ) : null}
              </div>
              <p className="font-mono text-[11px] text-[var(--cosmos-text-dim)]">
                {cve.publishedAt ? (
                  <>
                    published {formatUTC(cve.publishedAt)} ·{' '}
                    {formatRelative(cve.publishedAt)}
                  </>
                ) : (
                  <>publish date unavailable</>
                )}
                {cve.modifiedAt && cve.modifiedAt !== cve.publishedAt ? (
                  <>
                    {' '}
                    · modified {formatUTC(cve.modifiedAt)}
                  </>
                ) : null}
              </p>
            </header>

            <section className="mt-8 grid grid-cols-1 gap-8 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6 md:grid-cols-[auto_1fr] md:p-8">
              <div className="flex justify-center md:justify-start">
                <CVSSRing score={cve.cvssScore} severity={cve.severity} />
              </div>
              <div>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
                  {'// description'}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--cosmos-text-muted)] sm:text-[15px]">
                  {cve.description ?? 'No description available.'}
                </p>

                {vectorString ? (
                  <div className="mt-4">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
                      {`// cvss ${cve.cvssVersion ?? ''} vector`}
                    </h3>
                    <p className="mt-1 break-all font-mono text-[11px] text-[var(--cosmos-text-muted)]">
                      {vectorString}
                    </p>
                  </div>
                ) : null}

                {cve.isKev && cve.kevAction ? (
                  <div className="mt-4 rounded-[4px] border border-[var(--cosmos-critical)]/40 bg-[var(--cosmos-bg-subtle)] p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-critical)]">
                      {'// required action (CISA KEV)'}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
                      {cve.kevAction}
                    </p>
                    {cve.kevAddedAt ? (
                      <p className="mt-2 font-mono text-[10px] text-[var(--cosmos-text-dim)]">
                        added {formatUTC(cve.kevAddedAt)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            {cve.weaknesses.length > 0 ? (
              <section className="mt-6 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
                  {'// weaknesses (CWE)'}
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {cve.weaknesses.map((w) => (
                    <li
                      key={w}
                      className="rounded-[4px] border border-[var(--cosmos-border)] px-2 py-1 font-mono text-[11px] text-[var(--cosmos-text-muted)]"
                    >
                      {w}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {cve.references.length > 0 ? (
              <section className="mt-6 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-6">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
                  {`// references (${cve.references.length})`}
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {cve.references.map((href) => (
                    <li key={href} className="min-w-0">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 font-mono text-[11px] text-[var(--cosmos-text-muted)] hover:text-[var(--cosmos-text)]"
                      >
                        <ExternalLink
                          size={11}
                          aria-hidden
                          className="flex-shrink-0"
                        />
                        <span className="truncate">{href}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--cosmos-border-dim)] pt-6">
              <CVEPermalinkActions cveId={cve.cveId} />
              <a
                href={`https://nvd.nist.gov/vuln/detail/${cve.cveId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cosmos-btn-primary"
              >
                <ExternalLink size={12} aria-hidden />
                NVD detail
              </a>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
