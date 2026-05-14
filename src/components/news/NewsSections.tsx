import { ExternalLink, ShieldAlert, Link2, Network } from 'lucide-react'
import { formatRelative } from '@/lib/utils/date'
import { CosmosCard } from '@/components/ui/CosmosCard'
import type { NewsBundle, NewsItem } from '@/lib/api/news'

type SectionConfig = {
  key: keyof Pick<NewsBundle, 'international' | 'nepal' | 'pulses' | 'phish'>
  title: string
  subtitle: string
  Icon: typeof ExternalLink
  emptyMessage: string
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'international',
    title: 'International cyber wires',
    subtitle:
      'The Hacker News · BleepingComputer · Krebs · Dark Reading',
    Icon: ExternalLink,
    emptyMessage:
      'No feeds reachable right now  every upstream returned empty or timed out.',
  },
  {
    key: 'nepal',
    title: 'Nepal · tech & cyber',
    subtitle: 'TechLekh · OnlineKhabar · TechSathi',
    Icon: Network,
    emptyMessage:
      'No Nepali feeds reachable. Add your favourite Nepali tech RSS to NEPAL_FEEDS in src/lib/api/news.ts.',
  },
  {
    key: 'pulses',
    title: 'Threat-intel pulses',
    subtitle: 'AlienVault OTX subscribed feeds',
    Icon: ShieldAlert,
    emptyMessage:
      'OTX returned no pulses. Set OTX_API_KEY (or ALIENVAULT_OTX_KEY) and subscribe to a few pulses.',
  },
  {
    key: 'phish',
    title: 'Live phishing URLs',
    subtitle: 'OpenPhish public feed',
    Icon: Link2,
    emptyMessage:
      'OpenPhish feed unreachable. Set OPENPHISH_FEED_URL in your env.',
  },
]

export function NewsSections({ bundle }: { bundle: NewsBundle }) {
  return (
    <div className="mt-10 flex flex-col gap-16">
      {/* Sticky category jump-nav. Sits below the main Navbar (h-14 = 56px)
       * and below the IntelStatusBar; offset lets each anchor scroll to a
       * comfortable position. Smooth scrolling is enabled site-wide in
       * globals.css. */}
      <nav
        aria-label="News categories"
        className="sticky top-14 z-30 -mx-4 border-y border-[var(--cosmos-border-dim)] bg-[var(--cosmos-bg)]/90 px-4 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-12 md:px-12"
      >
        <ul className="cosmos-scroll-x flex items-center gap-1.5 py-2 whitespace-nowrap">
          {SECTIONS.map((s) => {
            const count = bundle[s.key].length
            return (
              <li key={s.key}>
                <a
                  href={`#news-${s.key}`}
                  className="inline-flex items-center gap-2 rounded-[4px] border border-[var(--cosmos-border)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--cosmos-text-muted)] transition-colors hover:border-[var(--cosmos-text-dim)] hover:text-[var(--cosmos-text)]"
                >
                  <s.Icon
                    size={12}
                    aria-hidden
                    className="text-[var(--cosmos-accent)]"
                  />
                  <span>{s.title}</span>
                  <span className="font-mono text-[10px] tabular-nums text-[var(--cosmos-text-dim)]">
                    {count}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      {SECTIONS.map((s) => {
        const items = bundle[s.key]
        return (
          <section
            key={s.key}
            id={`news-${s.key}`}
            aria-labelledby={`news-${s.key}-h`}
            // scroll-margin-top accounts for the sticky navbar + the
            // sticky category nav above so the heading isn't hidden
            // when the user clicks a chip.
            className="scroll-mt-[140px]"
          >
            <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--cosmos-border-dim)] pb-3">
              <div>
                <h2
                  id={`news-${s.key}-h`}
                  className="flex items-center gap-2 font-sans text-[22px] font-semibold tracking-[-0.01em] text-[var(--cosmos-text)]"
                >
                  <s.Icon
                    size={16}
                    aria-hidden
                    className="text-[var(--cosmos-accent)]"
                  />
                  {s.title}
                </h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
                  {s.subtitle}
                </p>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-[var(--cosmos-text-dim)]">
                {items.length} items
              </span>
            </header>

            {items.length === 0 ? (
              <p className="mt-4 max-w-xl text-[13px] italic text-[var(--cosmos-text-dim)]">
                {s.emptyMessage}
              </p>
            ) : (
              <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <li key={item.id}>
                    <NewsCard item={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}

      <footer className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
        fetched {formatRelative(bundle.fetched_at)} · cache: 5 min server, 10
        min stale-while-revalidate
      </footer>
    </div>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <CosmosCard className="h-full">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full flex-col gap-2 p-4 transition-colors hover:bg-[var(--cosmos-bg-elevated)]"
      >
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--cosmos-text-dim)]">
          <span>{item.source}</span>
          {item.published_at ? (
            <span title={new Date(item.published_at).toISOString()}>
              {formatRelative(item.published_at)}
            </span>
          ) : null}
        </div>
        <h3 className="line-clamp-3 font-sans text-[14px] font-medium leading-[1.35] text-[var(--cosmos-text)]">
          {item.title}
        </h3>
        {item.summary ? (
          <p className="line-clamp-3 text-[12.5px] leading-relaxed text-[var(--cosmos-text-muted)]">
            {item.summary}
          </p>
        ) : null}
        <div className="mt-auto flex items-center gap-1 font-mono text-[10px] text-[var(--cosmos-accent)]">
          read <ExternalLink size={10} aria-hidden />
        </div>
      </a>
    </CosmosCard>
  )
}
