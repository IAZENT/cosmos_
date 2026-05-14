import type {
  ArsenalCategory,
  ArsenalDifficulty,
  ArsenalPlatform,
  ArsenalUseCase,
} from '@/lib/arsenal/constants'

export type {
  ArsenalCategory,
  ArsenalDifficulty,
  ArsenalPlatform,
  ArsenalUseCase,
}

export interface ArsenalEntry {
  id: string
  title: string
  command: string
  description: string | null
  category: ArsenalCategory
  subcategory: string | null
  tags: string[]
  platform: ArsenalPlatform[]
  difficulty: ArsenalDifficulty
  mitre_id: string | null
  mitre_name: string | null
  note: string | null
  source_url: string | null
  use_case: ArsenalUseCase
  published: boolean
  pinned: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export interface ArsenalSearchResponse {
  entries: ArsenalEntry[]
  total: number
}

export interface ArsenalSuggestResponse {
  items: Array<
    Pick<
      ArsenalEntry,
      'id' | 'title' | 'category' | 'difficulty' | 'platform'
    > & { commandPreview: string }
  >
}

export interface ArsenalFallbackResult {
  title: string
  command: string
  description: string
  category: ArsenalCategory | string
  tags: string[]
  note: string
  disclaimer: string
}

export interface ArsenalFallbackResponse {
  result?: ArsenalFallbackResult
  error?: string
  source: 'fallback'
}
