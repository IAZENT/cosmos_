import type { LucideIcon } from 'lucide-react'
import {
  FileCode2,
  Fingerprint,
  Gauge,
  KeyRound,
  Link2,
  Radar,
} from 'lucide-react'

export interface ToolDef {
  num: string
  slug: string
  title: string
  blurb: string
  Icon: LucideIcon
}

export const TOOLS: ToolDef[] = [
  {
    num: '01',
    slug: 'base64',
    title: 'Base64 Codec',
    blurb: 'Encode and decode UTF-8 strings. Toggle URL-safe variant.',
    Icon: FileCode2,
  },
  {
    num: '02',
    slug: 'url',
    title: 'URL Codec',
    blurb: 'Percent-encode / decode query strings and path segments.',
    Icon: Link2,
  },
  {
    num: '03',
    slug: 'jwt',
    title: 'JWT Inspector',
    blurb: 'Decode the header and payload of a JSON Web Token. No verification.',
    Icon: KeyRound,
  },
  {
    num: '04',
    slug: 'hash',
    title: 'Hash Analyzer',
    blurb:
      'Identify a hash by length and alphabet. Compute SHA-1 / SHA-256 / SHA-512 in-browser.',
    Icon: Fingerprint,
  },
  {
    num: '05',
    slug: 'cvss',
    title: 'CVSS v3.1 Calculator',
    blurb: 'Live base score + vector string from the eight base metrics.',
    Icon: Gauge,
  },
  {
    num: '06',
    slug: 'lookup',
    title: 'Threat Lookup',
    blurb:
      'Paste any IP, domain, URL, hash or email. Fans out to VirusTotal, AbuseIPDB, Shodan, host.io, Hunter.io and urlscan.io in parallel  with an inline live-scan + screenshot for URLs.',
    Icon: Radar,
  },
]
