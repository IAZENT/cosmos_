/**
 * The canonical list of countries we tag scholarships against. Order
 * matters for the UI dropdown  Germany is first because it's COSMOS's
 * primary scholarship audience right now.
 */
export const SCHOLARSHIP_COUNTRIES = [
  'Germany',
  'EU',
  'UK',
  'USA',
  'Canada',
  'Australia',
  'Japan',
  'South Korea',
  'China',
  'Switzerland',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'France',
  'Italy',
  'Spain',
  'Belgium',
  'Austria',
  'Ireland',
  'New Zealand',
  'Singapore',
  'Turkey',
  'Hungary',
  'Russia',
  'Brazil',
  'India',
  'Other',
] as const

export type ScholarshipCountry = (typeof SCHOLARSHIP_COUNTRIES)[number]

export const SCHOLARSHIP_LEVELS = [
  'Bachelor',
  'Master',
  'PhD',
  'Postdoc',
  'Short-term',
] as const

export type ScholarshipLevel = (typeof SCHOLARSHIP_LEVELS)[number]

export const FLAG_BY_COUNTRY: Record<ScholarshipCountry, string> = {
  Germany: '🇩🇪',
  EU: '🇪🇺',
  UK: '🇬🇧',
  USA: '🇺🇸',
  Canada: '🇨🇦',
  Australia: '🇦🇺',
  Japan: '🇯🇵',
  'South Korea': '🇰🇷',
  China: '🇨🇳',
  Switzerland: '🇨🇭',
  Netherlands: '🇳🇱',
  Sweden: '🇸🇪',
  Norway: '🇳🇴',
  Denmark: '🇩🇰',
  France: '🇫🇷',
  Italy: '🇮🇹',
  Spain: '🇪🇸',
  Belgium: '🇧🇪',
  Austria: '🇦🇹',
  Ireland: '🇮🇪',
  'New Zealand': '🇳🇿',
  Singapore: '🇸🇬',
  Turkey: '🇹🇷',
  Hungary: '🇭🇺',
  Russia: '🇷🇺',
  Brazil: '🇧🇷',
  India: '🇮🇳',
  Other: '🌍',
}

export type FundingType = 'FULL' | 'PARTIAL' | 'UNKNOWN'

export interface ScholarshipNewsRow {
  id: string
  source: string
  source_url: string
  external_guid: string | null
  title: string
  summary: string | null
  countries: ScholarshipCountry[]
  levels: ScholarshipLevel[]
  funding: FundingType
  deadline_at: string | null
  published_at: string | null
  fetched_at: string
  created_at: string
}
