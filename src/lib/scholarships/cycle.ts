import type {
  CycleStatus,
  CycleWithStatus,
  ScholarshipCycle,
} from '@/types/scholarship-cycle'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Build a Date for `month/day` in the given year, using UTC so that
 * server-side rendering and client-side hydration agree regardless of
 * the visitor's timezone. We accept the slight imprecision that 'days
 * until' can be off by one near midnight in extreme timezones  good
 * enough for a 'opens in ~23 days' badge.
 */
function dateOf(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY)
}

/**
 * Determine the next status for a cycle, relative to `now`.
 *
 * Logic:
 *   - If today is within [open_this_year, close_this_year]: OPEN NOW.
 *   - Else if today is before open_this_year: OPENING SOON if within
 *     90 days, otherwise LATER.
 *   - Else (today is after close_this_year): the next opening is next
 *     year  bump and re-evaluate.
 *
 * Cycles that wrap across a year boundary (e.g. opens Nov, closes Feb)
 * are handled by checking if close.month < open.month.
 */
export function statusFor(
  cycle: ScholarshipCycle,
  now: Date = new Date(),
): CycleStatus {
  const year = now.getUTCFullYear()

  // Open dates for this year and last year (the latter is needed when
  // the cycle wraps and we're currently mid-window in January).
  const openThisYear = dateOf(year, cycle.typicalOpen.month, cycle.typicalOpen.day)
  const wraps = cycle.typicalClose.month < cycle.typicalOpen.month
  const closeThisYear = wraps
    ? dateOf(year + 1, cycle.typicalClose.month, cycle.typicalClose.day)
    : dateOf(year, cycle.typicalClose.month, cycle.typicalClose.day)

  // Catch the wrap case: cycle that opened *last* year may still be open.
  const openLastYear = dateOf(
    year - 1,
    cycle.typicalOpen.month,
    cycle.typicalOpen.day,
  )
  const closeLastYear = wraps
    ? dateOf(year, cycle.typicalClose.month, cycle.typicalClose.day)
    : dateOf(
        year - 1,
        cycle.typicalClose.month,
        cycle.typicalClose.day,
      )

  if (now >= openLastYear && now <= closeLastYear) {
    return {
      kind: 'open_now',
      closesAt: closeLastYear,
      daysUntilClose: daysBetween(now, closeLastYear),
    }
  }
  if (now >= openThisYear && now <= closeThisYear) {
    return {
      kind: 'open_now',
      closesAt: closeThisYear,
      daysUntilClose: daysBetween(now, closeThisYear),
    }
  }

  // Pick the next future open date.
  const nextOpen =
    now < openThisYear
      ? openThisYear
      : dateOf(year + 1, cycle.typicalOpen.month, cycle.typicalOpen.day)

  const days = daysBetween(now, nextOpen)
  return days <= 90
    ? { kind: 'opening_soon', opensAt: nextOpen, daysUntilOpen: days }
    : { kind: 'later', opensAt: nextOpen, daysUntilOpen: days }
}

/**
 * Sort order:
 *   1. Open now (closing soonest first)
 *   2. Opening soon (sooner first)
 *   3. Later (sooner first)
 *
 * This mirrors what a student's eye scans for: "what should I act on
 * today, what should I prep for, what's far away".
 */
export function sortByUrgency(items: CycleWithStatus[]): CycleWithStatus[] {
  const order: Record<CycleStatus['kind'], number> = {
    open_now: 0,
    opening_soon: 1,
    later: 2,
  }
  return [...items].sort((a, b) => {
    const oa = order[a.status.kind]
    const ob = order[b.status.kind]
    if (oa !== ob) return oa - ob
    if (a.status.kind === 'open_now' && b.status.kind === 'open_now') {
      return a.status.daysUntilClose - b.status.daysUntilClose
    }
    if (a.status.kind !== 'open_now' && b.status.kind !== 'open_now') {
      return a.status.daysUntilOpen - b.status.daysUntilOpen
    }
    return 0
  })
}

/**
 * Convenience for callers that want a ready-to-render, fully-sorted list.
 */
export function withStatus(
  cycles: ScholarshipCycle[],
  now: Date = new Date(),
): CycleWithStatus[] {
  return sortByUrgency(
    cycles.map((cycle) => ({ cycle, status: statusFor(cycle, now) })),
  )
}

/**
 * Pretty-print a `MM-DD` for display, e.g. "Aug 15".
 */
export function formatMonthDay(month: number, day: number): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  return fmt.format(dateOf(2000, month, day))
}
