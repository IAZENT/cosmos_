/**
 * Minimal, hand-maintained subset of Supabase types used in this repo.
 * Replace with auto-generated types via:
 *   `npx supabase gen types typescript --project-id <id> --schema public > src/types/supabase.ts`
 * when the remote project is provisioned.
 */

export interface ResourceRow {
  id: string
  title: string
  url: string
  description: string | null
  category: string | null
  tags: string[]
  trust_rating: number | null
  personal_note: string | null
  published: boolean
  created_at: string
}

export interface ResearchPostRow {
  id: string
  slug: string
  title: string
  summary: string | null
  content: string | null
  category: string | null
  tags: string[]
  mitre_techniques: string[]
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      cve_cache: {
        Row: {
          id: string
          cve_id: string
          description: string | null
          cvss_score: number | null
          cvss_severity: string | null
          cvss_version: string | null
          published_at: string | null
          modified_at: string | null
          is_kev: boolean
          kev_added_at: string | null
          kev_action: string | null
          references: unknown
          weaknesses: unknown
          raw_nvd: unknown
          synced_at: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['cve_cache']['Row']> & {
          cve_id: string
        }
        Update: Partial<Database['public']['Tables']['cve_cache']['Row']>
      }
      intel_stats: {
        Row: {
          id: string
          stat_key: string
          stat_value: number
          updated_at: string
        }
        Insert: { stat_key: string; stat_value?: number }
        Update: Partial<Database['public']['Tables']['intel_stats']['Row']>
      }
      resources: {
        Row: ResourceRow
        Insert: Omit<ResourceRow, 'id' | 'created_at'> &
          Partial<Pick<ResourceRow, 'id' | 'created_at'>>
        Update: Partial<ResourceRow>
      }
      research_posts: {
        Row: ResearchPostRow
        Insert: Omit<ResearchPostRow, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<ResearchPostRow, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<ResearchPostRow>
      }
    }
  }
}
