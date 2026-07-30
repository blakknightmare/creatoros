/**
 * Watermark utility for free-tier content.
 *
 * Free users get "— Generated with CreatorOS ✨" appended to clipboard output
 * on every copy action. Pro/Agency users never get watermarks.
 */

export const WATERMARK_TEXT = '\n\n— Generated with CreatorOS ✨';

/**
 * Appends the watermark to text if the user is on the free tier.
 * Returns the original text unchanged for paid tiers.
 */
export function addWatermark(text: string, tier: string): string {
  if (tier === 'free') {
    return text + WATERMARK_TEXT;
  }
  return text;
}
