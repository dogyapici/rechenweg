import { describe, expect, it } from 'vitest';
import { decide, loginEmail, type CloudData } from './cloud';
import { suggestUser, newPassword } from './components/Schueler';

const server = (at: number) => ({ v: 1, at } as CloudData);

describe('Abgleich beim Anmelden', () => {
  it('lädt den Stand vom Konto, wenn vorher jemand anderes oder niemand angemeldet war', () => {
    expect(decide({ user: null, at: 50, pushed: 0 }, 'mia', server(10), true)).toBe('load');
    expect(decide({ user: 'ben', at: 50, pushed: 50 }, 'mia', server(10), true)).toBe('load');
  });
  it('lädt, wenn auf einem anderen Gerät weitergeübt wurde', () => {
    expect(decide({ user: 'mia', at: 10, pushed: 10 }, 'mia', server(20), true)).toBe('load');
  });
  it('schickt den eigenen Stand, wenn das Gerät neuer ist', () => {
    expect(decide({ user: 'mia', at: 30, pushed: 20 }, 'mia', server(20), true)).toBe('push');
    expect(decide({ user: 'mia', at: 20, pushed: 20 }, 'mia', server(20), true)).toBe('none');
  });
  it('lädt beim ersten Mal den bisherigen Fortschritt hoch, aber nie den eines anderen Kindes', () => {
    expect(decide({ user: null, at: 0, pushed: 0 }, 'mia', null, true)).toBe('push');
    expect(decide({ user: 'ben', at: 9, pushed: 9 }, 'mia', null, true)).toBe('none');
    expect(decide({ user: null, at: 0, pushed: 0 }, 'mia', null, false)).toBe('none');
  });
});

describe('Anmeldenamen', () => {
  it('macht aus Benutzernamen eine interne Adresse', () => {
    expect(loginEmail(' Mia.K ')).toBe('mia.k@schueler.rechenweg.app');
    expect(loginEmail('lehrer@example.org')).toBe('lehrer@example.org');
  });
  it('schlägt einfache Namen und Passwörter vor', () => {
    expect(suggestUser('Jörg Müller-Weiß')).toBe('joerg.mueller.weiss');
    for (let i = 0; i < 20; i++) expect(newPassword()).toMatch(/^[a-z]{4,7}\d{4}$/);
  });
});
