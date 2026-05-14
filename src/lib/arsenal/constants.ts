// COSMOS ARSENAL  categories and presentation metadata.
// Mirrors the values enforced by the database (see migration 0008).

export const ARSENAL_CATEGORIES = [
  'recon',
  'enumeration',
  'exploitation',
  'post-exploitation',
  'privilege-escalation',
  'web',
  'network',
  'active-directory',
  'reverse-engineering',
  'malware-analysis',
  'forensics',
  'dfir',
  'cryptography',
  'steganography',
  'osint',
  'wireless',
  'ctf',
  'scripting',
  'tools',
  'misc',
] as const

export type ArsenalCategory = (typeof ARSENAL_CATEGORIES)[number]

export const ARSENAL_PLATFORMS = ['linux', 'windows', 'macos', 'any'] as const
export type ArsenalPlatform = (typeof ARSENAL_PLATFORMS)[number]

export const ARSENAL_DIFFICULTIES = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
] as const
export type ArsenalDifficulty = (typeof ARSENAL_DIFFICULTIES)[number]

export const ARSENAL_USE_CASES = ['offensive', 'defensive', 'both'] as const
export type ArsenalUseCase = (typeof ARSENAL_USE_CASES)[number]

export const CATEGORY_LABEL: Record<ArsenalCategory, string> = {
  recon: 'Recon',
  enumeration: 'Enumeration',
  exploitation: 'Exploitation',
  'post-exploitation': 'Post-Exploitation',
  'privilege-escalation': 'PrivEsc',
  web: 'Web',
  network: 'Network',
  'active-directory': 'Active Directory',
  'reverse-engineering': 'Reverse Eng.',
  'malware-analysis': 'Malware Analysis',
  forensics: 'Forensics',
  dfir: 'DFIR',
  cryptography: 'Cryptography',
  steganography: 'Steganography',
  osint: 'OSINT',
  wireless: 'Wireless',
  ctf: 'CTF',
  scripting: 'Scripting',
  tools: 'Tools',
  misc: 'Misc',
}

export const DIFFICULTY_STYLE: Record<
  ArsenalDifficulty,
  { bg: string; fg: string; label: string }
> = {
  beginner: { bg: '#0D2010', fg: 'var(--cosmos-low)', label: 'BEGINNER' },
  intermediate: {
    bg: '#1A1A0A',
    fg: 'var(--cosmos-medium)',
    label: 'INTERMEDIATE',
  },
  advanced: { bg: '#1A0D0A', fg: 'var(--cosmos-high)', label: 'ADVANCED' },
  expert: { bg: '#1A0A0A', fg: 'var(--cosmos-critical)', label: 'EXPERT' },
}

export function isCategory(v: unknown): v is ArsenalCategory {
  return (
    typeof v === 'string' && (ARSENAL_CATEGORIES as readonly string[]).includes(v)
  )
}
export function isPlatform(v: unknown): v is ArsenalPlatform {
  return (
    typeof v === 'string' && (ARSENAL_PLATFORMS as readonly string[]).includes(v)
  )
}
export function isDifficulty(v: unknown): v is ArsenalDifficulty {
  return (
    typeof v === 'string' &&
    (ARSENAL_DIFFICULTIES as readonly string[]).includes(v)
  )
}
export function isUseCase(v: unknown): v is ArsenalUseCase {
  return (
    typeof v === 'string' && (ARSENAL_USE_CASES as readonly string[]).includes(v)
  )
}
