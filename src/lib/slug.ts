/**
 * Utilities for generating URL-friendly slugs.
 * Company slugs are derived from ONLY the first word of the company name,
 * transliterated to basic ASCII (Turkish characters to English), lowercased,
 * and stripped of any non-alphanumeric characters.
 */

/**
 * Transliterates common Turkish characters to their closest ASCII equivalents.
 */
export function transliterateTurkishToAscii(input: string): string {
  const map: Record<string, string> = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u',
  };
  return input.replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => map[ch] ?? ch);
}

/**
 * Creates a company slug using only the first word of the name.
 * Example: "Luna Denta Teknoloji" -> "luna", "Aydoğanlar Sağlık" -> "aydoganlar".
 */
export function slugifyCompanyFirstWord(name: string): string {
  if (!name) return '';
  // Take the first whitespace-delimited token
  const firstToken = name.trim().split(/\s+/)[0] || '';
  const ascii = transliterateTurkishToAscii(firstToken);
  // Keep only a-z and 0-9; remove any remaining punctuation/hyphens
  const normalized = ascii.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return normalized;
}


