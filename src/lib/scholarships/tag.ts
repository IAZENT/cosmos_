import {
  SCHOLARSHIP_COUNTRIES,
  type FundingType,
  type ScholarshipCountry,
  type ScholarshipLevel,
} from '@/types/scholarship'

/**
 * Country tagging.
 *
 * We use weighted keyword matching, not single-keyword "contains". A
 * post mentioning "Germany" once in a list of "study destinations" is
 * not actually a Germany scholarship  but one mentioning "DAAD" and
 * "TU Munich" almost certainly is. Each match adds a score; a country
 * is tagged when its score >= MATCH_THRESHOLD.
 *
 * Order matters in COUNTRY_KEYWORDS only insofar as it affects iteration
 * speed; matching itself is order-independent.
 */
interface CountryMatcher {
  country: ScholarshipCountry
  // High-confidence: brand names, ministry acronyms, university names.
  // Each match scores 3.
  strong: string[]
  // Lower-confidence: country / nationality words. Each match scores 1.
  weak: string[]
}

const MATCH_THRESHOLD = 2

const COUNTRY_KEYWORDS: CountryMatcher[] = [
  {
    country: 'Germany',
    strong: [
      'daad',
      'deutschlandstipendium',
      'tu munich',
      'tu münchen',
      'rwth aachen',
      'lmu munich',
      'humboldt',
      'heinrich böll',
      'konrad-adenauer',
      'friedrich naumann',
      'studienkolleg',
      'hochschule',
    ],
    weak: ['germany', 'german', 'deutschland', 'berlin', 'munich', 'frankfurt'],
  },
  {
    country: 'EU',
    strong: ['erasmus mundus', 'marie skłodowska-curie', 'marie sklodowska-curie', 'marie curie', 'horizon europe', 'euraxess'],
    weak: ['european union', 'eu scholarship', 'erasmus'],
  },
  {
    country: 'UK',
    strong: ['chevening', 'commonwealth scholarship', 'gates cambridge', 'rhodes scholarship', 'oxford', 'cambridge', 'imperial college', 'lse '],
    weak: ['united kingdom', 'british', 'scotland', 'wales', 'england', 'london'],
  },
  {
    country: 'USA',
    strong: ['fulbright', 'humphrey fellowship', 'harvard', 'mit ', 'stanford', 'yale university', 'princeton', 'columbia university', 'berkeley'],
    weak: ['united states', 'american', 'us scholarship', 'usa'],
  },
  {
    country: 'Japan',
    strong: ['mext', 'monbukagakusho', 'jasso', 'jica', 'university of tokyo', 'kyoto university'],
    weak: ['japan', 'japanese'],
  },
  {
    country: 'China',
    strong: ['csc scholarship', 'chinese government scholarship', 'confucius institute', 'tsinghua', 'peking university'],
    weak: ['china', 'chinese'],
  },
  {
    country: 'Australia',
    strong: ['australia awards', 'australian government scholarship', 'rtp', 'university of melbourne', 'australian national university'],
    weak: ['australia', 'australian'],
  },
  {
    country: 'Canada',
    strong: ['vanier', 'banting', 'trudeau scholarship', 'mitacs', 'university of toronto', 'mcgill'],
    weak: ['canada', 'canadian'],
  },
  {
    country: 'South Korea',
    strong: ['kgsp', 'global korea scholarship', 'kaist', 'snu '],
    weak: ['south korea', 'korea', 'korean'],
  },
  {
    country: 'Switzerland',
    strong: ['eth zurich', 'epfl', 'swiss government excellence', 'esks'],
    weak: ['switzerland', 'swiss'],
  },
  {
    country: 'Netherlands',
    strong: ['holland scholarship', 'orange tulip', 'tu delft', 'leiden university'],
    weak: ['netherlands', 'dutch', 'amsterdam'],
  },
  {
    country: 'Sweden',
    strong: ['swedish institute', 'kth ', 'lund university', 'karolinska'],
    weak: ['sweden', 'swedish'],
  },
  {
    country: 'Norway',
    strong: ['quota scheme', 'university of oslo', 'ntnu'],
    weak: ['norway', 'norwegian'],
  },
  {
    country: 'Denmark',
    strong: ['danish state scholarship', 'university of copenhagen', 'aarhus university'],
    weak: ['denmark', 'danish'],
  },
  {
    country: 'France',
    strong: ['eiffel scholarship', 'campus france', 'sciences po', 'sorbonne', 'école polytechnique', 'ecole polytechnique'],
    weak: ['france', 'french', 'paris'],
  },
  {
    country: 'Italy',
    strong: ['invest your talent', 'sant anna', 'università bocconi', 'politecnico di milano'],
    weak: ['italy', 'italian'],
  },
  {
    country: 'Spain',
    strong: ['la caixa', 'maec-aecid', 'universidad complutense'],
    weak: ['spain', 'spanish'],
  },
  {
    country: 'Belgium',
    strong: ['vlir-uos', 'ku leuven', 'ghent university'],
    weak: ['belgium', 'belgian'],
  },
  {
    country: 'Austria',
    strong: ['oead', 'university of vienna', 'tu wien'],
    weak: ['austria', 'austrian'],
  },
  {
    country: 'Ireland',
    strong: ['government of ireland scholarship', 'trinity college dublin', 'ucd '],
    weak: ['ireland', 'irish'],
  },
  {
    country: 'New Zealand',
    strong: ['new zealand scholarship', 'university of auckland'],
    weak: ['new zealand'],
  },
  {
    country: 'Singapore',
    strong: ['nus scholarship', 'ntu singapore', 'a*star', 'sgs scholarship'],
    weak: ['singapore'],
  },
  {
    country: 'Turkey',
    strong: ['türkiye bursları', 'turkiye burslari', 'turkey scholarships'],
    weak: ['turkey', 'turkish', 'türkiye', 'turkiye'],
  },
  {
    country: 'Hungary',
    strong: ['stipendium hungaricum'],
    weak: ['hungary', 'hungarian'],
  },
  {
    country: 'Russia',
    strong: ['open doors russia', 'rossotrudnichestvo'],
    weak: ['russia', 'russian'],
  },
  {
    country: 'Brazil',
    strong: ['ciências sem fronteiras', 'capes', 'university of são paulo'],
    weak: ['brazil', 'brazilian'],
  },
  {
    country: 'India',
    strong: ['icssr', 'icmr', 'iit ', 'iisc'],
    weak: ['india', 'indian'],
  },
]

export function detectCountries(text: string): ScholarshipCountry[] {
  const t = text.toLowerCase()
  const matched: ScholarshipCountry[] = []
  for (const m of COUNTRY_KEYWORDS) {
    let score = 0
    for (const kw of m.strong) {
      if (t.includes(kw)) {
        score += 3
        if (score >= MATCH_THRESHOLD) break
      }
    }
    if (score < MATCH_THRESHOLD) {
      for (const kw of m.weak) {
        if (t.includes(kw)) score += 1
        if (score >= MATCH_THRESHOLD) break
      }
    }
    if (score >= MATCH_THRESHOLD) matched.push(m.country)
  }
  return matched.length > 0 ? matched : []
}

/* ------------------------------------------------------------------ *
 * Level detection
 * ------------------------------------------------------------------ */

const LEVEL_KEYWORDS: { level: ScholarshipLevel; kws: string[] }[] = [
  {
    level: 'PhD',
    kws: ['phd', 'doctoral', 'doctorate', 'd.phil', 'dphil'],
  },
  {
    level: 'Postdoc',
    kws: ['postdoc', 'postdoctoral', 'post-doctoral', 'post doc'],
  },
  {
    level: 'Master',
    kws: ['master', 'masters', 'msc', 'm.sc', 'mphil', 'graduate program'],
  },
  {
    level: 'Bachelor',
    kws: [
      'bachelor',
      'undergraduate',
      'b.sc',
      'bsc ',
      'ba ',
      'b.a.',
      'first degree',
    ],
  },
  {
    level: 'Short-term',
    kws: ['summer school', 'short-term', 'short term', 'fellowship program', 'exchange'],
  },
]

export function detectLevels(text: string): ScholarshipLevel[] {
  const t = text.toLowerCase()
  const out: ScholarshipLevel[] = []
  for (const m of LEVEL_KEYWORDS) {
    if (m.kws.some((k) => t.includes(k))) out.push(m.level)
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Funding detection
 * ------------------------------------------------------------------ */

export function detectFunding(text: string): FundingType {
  const t = text.toLowerCase()
  if (
    t.includes('fully funded') ||
    t.includes('fully-funded') ||
    t.includes('full scholarship') ||
    t.includes('full funding') ||
    t.includes('all expenses')
  ) {
    return 'FULL'
  }
  if (
    t.includes('partial') ||
    t.includes('tuition waiver') ||
    t.includes('tuition fee') ||
    t.includes('stipend')
  ) {
    return 'PARTIAL'
  }
  return 'UNKNOWN'
}

/* ------------------------------------------------------------------ *
 * Deadline detection (best-effort)
 *
 * We try to pick out an explicit "Deadline: <date>" pattern. Anything
 * else is left null  the deadline column is purely a UX nicety; the
 * canonical authority is the linked source page.
 * ------------------------------------------------------------------ */

const DEADLINE_RE =
  /(?:deadline|apply by|application(?:s)?\s+(?:close|deadline|due))[\s:]+([a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[a-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})/i

export function detectDeadline(text: string): string | null {
  const m = text.match(DEADLINE_RE)
  if (!m || !m[1]) return null
  const t = Date.parse(m[1])
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

/**
 * Convenience: tag once, return everything.
 */
export function tagAll(text: string) {
  return {
    countries: detectCountries(text),
    levels: detectLevels(text),
    funding: detectFunding(text),
    deadline: detectDeadline(text),
  }
}

// Re-export for places that want the canonical list.
export { SCHOLARSHIP_COUNTRIES }
