import { SectionLabel } from '@/components/ui/SectionLabel'
import { formatRelative } from '@/lib/utils/date'
import { getKevHighlightsServer } from '@/lib/intel/server-data'

export async function KEVHighlights() {
  const items = await getKevHighlightsServer(5)
  return (
    <section className="rounded-[6px] border border-[var(--cosmos-border)] bg-[var(--cosmos-bg-elevated)] p-5">
      <SectionLabel>kev highlights</SectionLabel>
      {items.length === 0 ? (
        <p className="font-mono text-[11px] text-[var(--cosmos-text-dim)]">
          No KEV entries cached yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((kev) => (
            <li
              key={kev.id}
              className="border-l-2 border-[var(--cosmos-critical)] pl-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[12px] text-[var(--cosmos-text)]">
                  {kev.cveId}
                </span>
                <span className="font-mono text-[10px] text-[var(--cosmos-text-dim)]">
                  {formatRelative(kev.kevAddedAt)}
                </span>
              </div>
              {kev.description ? (
                <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[var(--cosmos-text-muted)]">
                  {kev.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
