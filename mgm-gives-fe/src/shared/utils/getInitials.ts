/**
 * Extracts initials from a display name.
 * Returns up to 2 uppercase characters from the first and last name parts.
 *
 * @example
 * getInitials('John Doe')    // 'JD'
 * getInitials('Alice')       // 'A'
 * getInitials(null)          // '?'
 * getInitials(null, 'MG')    // 'MG'
 */
export function getInitials(name?: string | null, fallback = '?'): string {
  if (!name) return fallback;
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
