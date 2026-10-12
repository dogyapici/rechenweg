import { describe, expect, it } from 'vitest';
import { supaKey, supaUrl } from './supaUrl';

describe('Supabase-Adresse', () => {
  it('nimmt eingefügte Adressen in jeder üblichen Form', () => {
    for (const s of ['abc.supabase.co', 'https://abc.supabase.co', 'https://abc.supabase.co/', ' https://abc.supabase.co/rest/v1/ ', '"https://abc.supabase.co"'])
      expect(supaUrl(s)).toBe('https://abc.supabase.co');
  });
  it('lehnt Unsinn ab, statt die App abstürzen zu lassen', () => {
    expect(supaUrl('')).toBeNull();
    expect(supaUrl(undefined)).toBeNull();
    expect(supaUrl('eyJhbGciOi')).toBeNull();
    expect(supaKey(' "eyJx" ')).toBe('eyJx');
  });
});
