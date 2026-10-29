/**
 * Tokens that are acronyms, not words. Anything shorter than three characters
 * is treated as an acronym too (CR-V, MX-5, F-150).
 */
const KNOWN_ACRONYMS = new Set([
  'BMW',
  'GMC',
  'BYD',
  'MG',
  'MINI',
  'RAM',
  'VW',
  'SUV',
  'MPV',
  'EV',
  'OBD',
]);

/**
 * Makes and models are free text, so the same name can be typed as "Toyota",
 * "toyota" or "TOYOTA". We store one canonical spelling:
 *
 *   toyota          -> Toyota
 *   TOYOTA          -> Toyota
 *   mercedes-benz   -> Mercedes-Benz
 *   bmw             -> BMW
 *   f-150           -> F-150
 *
 * Duplicate protection does not rely on this function — the services also do
 * a case-insensitive lookup before writing, so casing can never produce two
 * rows. This only decides how a brand new name is spelled.
 */
export function toCanonicalName(value: string): string {
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) return name;

  return name.split(' ').map(canonicalWord).join(' ');
}

function canonicalWord(word: string): string {
  if (KNOWN_ACRONYMS.has(word.toUpperCase())) return word.toUpperCase();

  return word
    .split(/([-/])/)
    .map((segment) => {
      if (segment === '-' || segment === '/') return segment;
      if (!segment) return segment;
      if (KNOWN_ACRONYMS.has(segment.toUpperCase()))
        return segment.toUpperCase();
      // Short segments are acronyms or numbers: CR, V, MX, F, 150, 5.
      if (/^[A-Za-z0-9]{1,2}$/.test(segment)) return segment.toUpperCase();

      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join('');
}

/** Plates are stored uppercase, with single spaces. */
export function normalizePlate(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}
