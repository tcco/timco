/**
 * Generates a short, clean, concise URL slug from a title string.
 * - Strips parenthetical subtitles (e.g. '(Finance You Need Now)').
 * - Trims to punchy leading phrase if separated by ':', ',', '|', or em-dash.
 * - Removes diacritics, punctuation, apostrophes, and special characters.
 * - Normalizes to lowercase and joins with hyphens (max words limited).
 */
export function generateSlug(title: string, maxWords = 5): string {
  if (!title) return '';

  // 1. Remove parentheticals like '(Finance You Need Now)'
  let cleaned = title.replace(/\([^)]*\)/g, ' ');

  // 2. If there is a colon, pipe, em-dash, or comma with a punchy leading phrase (2-5 words), use that
  const delimiterMatch = cleaned.split(/[:|—–,]/);
  if (delimiterMatch.length > 1) {
    const firstPartWords = delimiterMatch[0].trim().split(/\s+/).filter(Boolean);
    if (firstPartWords.length >= 2 && firstPartWords.length <= 5) {
      cleaned = delimiterMatch[0];
    }
  }

  // 3. Remove diacritics, apostrophes, and non-alphanumerics
  cleaned = cleaned
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .trim()
    .toLowerCase();

  // 4. Split into words and limit to maxWords
  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, maxWords);

  // 5. Join with hyphen, collapse multiple hyphens, trim ends
  return words.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
