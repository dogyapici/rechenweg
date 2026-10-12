/**
 * Supabase-Adresse so annehmen, wie sie oft eingefügt wird: ohne https://, mit / am Ende
 * oder mit /rest/v1. Ergibt null, wenn es keine Adresse ist.
 */
export function supaUrl(raw: string | undefined): string | null {
  let s = (raw ?? '').trim().replace(/^["']|["']$/g, '');
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    return u.hostname.includes('.') || u.hostname === 'localhost' ? u.origin : null;
  } catch { return null; }
}
/** Schlüssel ohne Leerzeichen und Anführungszeichen. */
export const supaKey = (raw: string | undefined) => (raw ?? '').trim().replace(/^["']|["']$/g, '') || null;
