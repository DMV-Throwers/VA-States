/**
 * Shared social-link normalization for public competitor/spectator/staff
 * profiles. Mirrors the logic in components/DirectoryClient.tsx so results
 * pages and the directory render identical URLs from the same raw input
 * (handle or full URL, with or without a leading @).
 */

export interface Socials {
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  other?: string | null;
}

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'other';

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  other: 'Link',
};

export function socialUrl(platform: SocialPlatform, value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  switch (platform) {
    case 'instagram': return `https://instagram.com/${handle}`;
    case 'tiktok':    return `https://tiktok.com/@${handle}`;
    case 'youtube':   return `https://youtube.com/@${handle}`;
    default:          return trimmed;
  }
}

/** Non-empty social links for a profile, in a fixed display order. */
export function getSocialLinks(socials: Socials | null | undefined): { platform: SocialPlatform; label: string; url: string }[] {
  if (!socials) return [];
  const platforms: SocialPlatform[] = ['instagram', 'tiktok', 'youtube', 'other'];
  const links: { platform: SocialPlatform; label: string; url: string }[] = [];
  for (const platform of platforms) {
    const value = socials[platform];
    if (value && value.trim()) {
      links.push({ platform, label: PLATFORM_LABELS[platform], url: socialUrl(platform, value) });
    }
  }
  return links;
}
