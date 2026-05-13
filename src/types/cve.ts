import { z } from 'zod'
import type { Severity } from '@/lib/utils/severity'

/**
 * CosmosCVE  the normalised shape used across the UI. Stored in
 * the `cve_cache` Supabase table.
 */
export interface CosmosCVE {
  id: string
  description: string
  cvssScore: number | null
  cvssVector: string | null
  cvssVersion: string | null
  severity: Severity
  publishedAt: string | null
  modifiedAt: string | null
  isKev: boolean
  kevAddedAt: string | null
  kevAction: string | null
  references: string[]
  weaknesses: string[]
}

/* ---------- NVD API v2 schemas (subset of what we need) ---------- */

const nvdDescriptionSchema = z.object({
  lang: z.string(),
  value: z.string(),
})

const nvdCvssDataSchema = z.object({
  version: z.string().optional(),
  baseScore: z.number().optional(),
  baseSeverity: z.string().optional(),
  vectorString: z.string().optional(),
})

const nvdCvssMetricSchema = z.object({
  cvssData: nvdCvssDataSchema.optional(),
  source: z.string().optional(),
  type: z.string().optional(),
})

const nvdMetricsSchema = z.object({
  cvssMetricV40: z.array(nvdCvssMetricSchema).optional(),
  cvssMetricV31: z.array(nvdCvssMetricSchema).optional(),
  cvssMetricV30: z.array(nvdCvssMetricSchema).optional(),
  cvssMetricV2: z.array(nvdCvssMetricSchema).optional(),
})

const nvdReferenceSchema = z.object({
  url: z.string(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

const nvdWeaknessDescSchema = z.object({
  lang: z.string(),
  value: z.string(),
})

const nvdWeaknessSchema = z.object({
  source: z.string().optional(),
  type: z.string().optional(),
  description: z.array(nvdWeaknessDescSchema).optional(),
})

const nvdCveSchema = z.object({
  id: z.string(),
  published: z.string().optional(),
  lastModified: z.string().optional(),
  vulnStatus: z.string().optional(),
  descriptions: z.array(nvdDescriptionSchema).optional(),
  metrics: nvdMetricsSchema.optional(),
  references: z.array(nvdReferenceSchema).optional(),
  weaknesses: z.array(nvdWeaknessSchema).optional(),
  cisaExploitAdd: z.string().optional(),
  cisaActionDue: z.string().optional(),
  cisaRequiredAction: z.string().optional(),
  cisaVulnerabilityName: z.string().optional(),
})

const nvdVulnerabilityItemSchema = z.object({
  cve: nvdCveSchema,
})

export const nvdResponseSchema = z.object({
  resultsPerPage: z.number(),
  startIndex: z.number(),
  totalResults: z.number(),
  format: z.string().optional(),
  version: z.string().optional(),
  timestamp: z.string().optional(),
  vulnerabilities: z.array(nvdVulnerabilityItemSchema),
})

export type NVDResponse = z.infer<typeof nvdResponseSchema>
export type NVDVulnerabilityItem = z.infer<typeof nvdVulnerabilityItemSchema>
export type NVDCve = z.infer<typeof nvdCveSchema>

/* ---------- CISA KEV schema ---------- */

const cisaKevItemSchema = z.object({
  cveID: z.string(),
  vendorProject: z.string().optional(),
  product: z.string().optional(),
  vulnerabilityName: z.string().optional(),
  dateAdded: z.string().optional(),
  shortDescription: z.string().optional(),
  requiredAction: z.string().optional(),
  dueDate: z.string().optional(),
  knownRansomwareCampaignUse: z.string().optional(),
})

export const cisaKevResponseSchema = z.object({
  title: z.string().optional(),
  catalogVersion: z.string().optional(),
  dateReleased: z.string().optional(),
  count: z.number().optional(),
  vulnerabilities: z.array(cisaKevItemSchema),
})

export type CISAKevItem = z.infer<typeof cisaKevItemSchema>
export type CISAKevResponse = z.infer<typeof cisaKevResponseSchema>
