export function sanitizeText(input: unknown, { maxLength = 500 }: { maxLength?: number } = {}): string {
  let s = String(input ?? '');
  s = s.replace(/[\u0000-\u001F\u007F]/g, ''); // remove control chars
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length > maxLength) s = s.slice(0, maxLength);
  return s;
}

export function sanitizeUrl(input: unknown): string {
  let s = String(input ?? '').trim();
  if (!s) return '';
  try {
    const url = new URL(s, 'http://localhost'); // base for relative
    const protocol = url.protocol.replace(':', '');
    if (protocol === 'http' || protocol === 'https') {
      // return absolute or the original if relative
      return s;
    }
    return '';
  } catch {
    // allow simple relative paths without protocol
    if (s.startsWith('/') || s.startsWith('./') || s.startsWith('../')) return s;
    return '';
  }
}
