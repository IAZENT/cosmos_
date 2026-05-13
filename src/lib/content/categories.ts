export const RESOURCE_CATEGORIES = [
  'Forensics',
  'Malware',
  'Reverse Engineering',
  'OSINT',
  'Cryptography',
  'Learning',
  'Bug Bounty',
  'Tooling',
  'Other',
] as const

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number]

export const RESEARCH_CATEGORIES = [
  'Malware Analysis',
  'Reverse Engineering',
  'DFIR',
  'Exploit Research',
  'CTF',
  'Other',
] as const

export type ResearchCategory = (typeof RESEARCH_CATEGORIES)[number]
