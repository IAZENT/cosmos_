/**
 * Centralised social URLs. Used by Navbar, Footer, and the /about page
 * so links live in one place. Override per-environment via:
 *   NEXT_PUBLIC_GITHUB_URL
 *   NEXT_PUBLIC_LINKEDIN_URL
 *   NEXT_PUBLIC_CONTACT_EMAIL
 *
 * Defaults match the operator profile shown on /about.
 */
export const SOCIAL_LINKS = {
  github:
    process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/IAZENT/',
  linkedin:
    process.env.NEXT_PUBLIC_LINKEDIN_URL ??
    'https://www.linkedin.com/in/rupesh-thakur-aa98702a7/',
  email:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'rupeshkthakur7@gmail.com',
} as const

export type SocialPlatform = keyof typeof SOCIAL_LINKS

/**
 * Convenience: produce a `mailto:` href when given a plain address,
 * or pass-through anything that already looks like a URL.
 */
export function emailHref(address: string): string {
  if (address.startsWith('mailto:') || address.startsWith('http')) return address
  return `mailto:${address}`
}
