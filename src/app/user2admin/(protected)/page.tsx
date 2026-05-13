import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Network, ShieldAlert } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SyncControls } from './SyncControls'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getLastSyncedAtServer,
  getIntelStatsServer,
} from '@/lib/intel/server-data'
import { formatRelative, formatUTC } from '@/lib/utils/date'
import { supabaseAuthConfigured } from '@/lib/auth/admin'

export const metadata: Metadata = {
  title: 'Admin',
  description: 'COSMOS operational surface.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface DashboardCounts {
  cves: number
  resources: number
  research: number
}

async function getDashboardCounts(): Promise<DashboardCounts> {
  const empty: DashboardCounts = { cves: 0, resources: 0, research: 0 }
  if (!supabaseAuthConfigured()) return empty
  try {
    const supabase = await createServerSupabaseClient()
    const [cves, resources, research] = await Promise.all([
      supabase
        .from('cve_cache')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('resources')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('research_posts')
        .select('*', { count: 'exact', head: true }),
    ])
    return {
      cves: cves.count ?? 0,
      resources: resources.count ?? 0,
      research: research.count ?? 0,
    }
  } catch {
    return empty
  }
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        {label}
      </p>
      <p className="mt-2 font-mono text-[32px] leading-none text-[var(--cosmos-text)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 font-mono text-[11px] text-[var(--cosmos-text-dim)]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export default async function AdminDashboardPage() {
  if (!supabaseAuthConfigured()) {
    return (
      <div className="mx-auto max-w-cosmos px-6 py-16 md:px-12">
        <SectionLabel>admin dashboard</SectionLabel>
        <h1 className="text-[32px] text-[var(--cosmos-text)]">
          Admin surface unavailable.
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
          Supabase credentials are not configured. Populate
          <code className="mx-1 rounded bg-[var(--cosmos-bg-subtle)] px-1 font-mono text-[11px]">
            NEXT_PUBLIC_SUPABASE_URL
          </code>
          and
          <code className="mx-1 rounded bg-[var(--cosmos-bg-subtle)] px-1 font-mono text-[11px]">
            SUPABASE_SERVICE_ROLE_KEY
          </code>
          in <code className="font-mono">.env.local</code> and redeploy.
        </p>
      </div>
    )
  }

  const [counts, stats, lastSynced] = await Promise.all([
    getDashboardCounts(),
    getIntelStatsServer(),
    getLastSyncedAtServer(),
  ])

  return (
    <div className="mx-auto max-w-cosmos px-6 py-12 md:px-12">
      <SectionLabel>admin dashboard</SectionLabel>
      <h1 className="text-[32px] leading-[1.1] tracking-[-0.01em] text-[var(--cosmos-text)] md:text-[40px]">
        Operational surface.
      </h1>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--cosmos-text-muted)]">
        Trigger data syncs, review platform telemetry, and jump into content
        management.
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
          {'// platform telemetry'}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="CVEs cached"
            value={counts.cves.toLocaleString('en-US')}
            hint={`${stats.critical_cves_24h.toLocaleString('en-US')} critical · 24h`}
          />
          <StatCard
            label="KEV entries"
            value={stats.kev_total.toLocaleString('en-US')}
            hint="cross-referenced against NVD"
          />
          <StatCard
            label="Resources"
            value={counts.resources.toLocaleString('en-US')}
            hint="curated links (Phase 4)"
          />
          <StatCard
            label="Research posts"
            value={counts.research.toLocaleString('en-US')}
            hint="published + drafts (Phase 3)"
          />
        </div>
        <p className="mt-4 font-mono text-[11px] text-[var(--cosmos-text-dim)]">
          last cve sync: {lastSynced ? formatRelative(lastSynced) : ''}
          {lastSynced ? ` · ${formatUTC(lastSynced)}` : ''}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
          {'// manual sync'}
        </h2>
        <div className="mt-4">
          <SyncControls />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--cosmos-code)]">
          {'// content management'}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/user2admin/research"
            className="group flex flex-col gap-2 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5 transition-colors hover:border-[var(--cosmos-text-dim)]"
          >
            <BookOpen
              size={18}
              className="text-[var(--cosmos-text-dim)] group-hover:text-[var(--cosmos-accent)]"
              aria-hidden
            />
            <h3 className="text-[16px] text-[var(--cosmos-text)]">
              Research posts
            </h3>
            <p className="text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Draft, edit, and publish markdown writeups.
            </p>
            <span className="mt-1 font-mono text-[11px] text-[var(--cosmos-accent)]">
              → Manage
            </span>
          </Link>
          <Link
            href="/user2admin/resources"
            className="group flex flex-col gap-2 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5 transition-colors hover:border-[var(--cosmos-text-dim)]"
          >
            <Network
              size={18}
              className="text-[var(--cosmos-text-dim)] group-hover:text-[var(--cosmos-accent)]"
              aria-hidden
            />
            <h3 className="text-[16px] text-[var(--cosmos-text)]">
              Resource network
            </h3>
            <p className="text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Add, edit, and review curated links and tooling.
            </p>
            <span className="mt-1 font-mono text-[11px] text-[var(--cosmos-accent)]">
              → Manage
            </span>
          </Link>
          <Link
            href="/intelligence"
            className="group flex flex-col gap-2 rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5 transition-colors hover:border-[var(--cosmos-text-dim)]"
          >
            <ShieldAlert
              size={18}
              className="text-[var(--cosmos-text-dim)] group-hover:text-[var(--cosmos-accent)]"
              aria-hidden
            />
            <h3 className="text-[16px] text-[var(--cosmos-text)]">
              Intelligence feed
            </h3>
            <p className="text-[12px] leading-relaxed text-[var(--cosmos-text-muted)]">
              Public CVE + KEV surface. Verify sync output here.
            </p>
            <span className="mt-1 font-mono text-[11px] text-[var(--cosmos-accent)]">
              → Open
            </span>
          </Link>
        </div>
      </section>
    </div>
  )
}
