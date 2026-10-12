import { useMemo, useState } from 'react';
import { buildReport, encodeSnapshot, snapshot, SHARE_KEY, type Attempt, type Help, type Snapshot, type TopicRow, type TopicState } from '../journal';
import { TOPICS } from '../topics';
import { CHAPTERS, FINAL } from '../curriculum';
import { look } from '../ui/look';
import { STAGES } from '../stages';
import { Html } from './Html';

const title = (id: string) => TOPICS.find(t => t.id === id)?.title ?? id;
const examName = (id: string) => (id === 'final' ? FINAL.title : id === 'plan' ? 'Probe-Klassenarbeit' : `Klassenarbeit: ${CHAPTERS.find(c => c.id === id)?.title ?? id}`);
const pct = (x: number | null) => (x == null ? '–' : `${Math.round(x * 100)} %`);
const mins = (s: number) => (s < 60 ? (s ? '< 1 Min.' : '0 Min.') : s < 3600 ? `${Math.round(s / 60)} Min.` : `${Math.floor(s / 3600)} Std. ${Math.round((s % 3600) / 60)} Min.`);
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const when = (t: number) => { const d = new Date(t); return `${WD[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}., ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
const day = (iso: string) => { const d = new Date(iso + 'T12:00:00'); return `${WD[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`; };

const STATE: Record<TopicState, { label: string; cls: string }> = {
  hilfe: { label: 'Braucht Hilfe', cls: 'bad' },
  ueben: { label: 'Noch üben', cls: 'warn' },
  gut: { label: 'Läuft', cls: 'ok' },
  stark: { label: 'Sicher', cls: 'top' },
  neu: { label: 'Noch nicht geübt', cls: '' },
};
const HELP: Record<Help, string> = { tipp: '💡 Tipp', heft: '📝 Im Heft', gemeinsam: '🧭 Gemeinsam gelöst', loesung: '👀 Lösung angesehen', ki: '💬 KI gefragt' };

interface Props {
  data: Omit<Snapshot, 'v' | 'made'> & { made?: number };
  /** true, wenn der Bericht über einen geteilten Link geöffnet wurde */
  shared?: boolean;
  /** Fortschritt eines Schülers aus dem Konto (für Lehrer und Eltern) */
  remote?: { name: string; updated: string | null; onRefresh: () => void; loading?: boolean };
  /** Der Lernstand wird ins Konto übertragen */
  synced?: boolean;
  onBack: () => void;
  onOpenTopic?: (id: string) => void;
}

/** Eltern-Ansicht: Wie viel geübt wurde, was sitzt und wo das Kind Hilfe braucht. */
export function Eltern({ data, shared, remote, synced, onBack, onOpenTopic }: Props) {
  const r = useMemo(() => buildReport(data.journal, data.stats, data.act, data.exams, data.profile, data.made ?? Date.now()), [data]);
  const [filter, setFilter] = useState<string>('');
  const [more, setMore] = useState(false);
  const who = r.name || remote?.name || 'Ihr Kind';
  const mistakes = r.mistakes.filter(m => !filter || m.topic === filter);
  const practiced = r.topics.filter(t => t.state !== 'neu');

  const top = Math.max(5, ...r.last14.map(d => d.tasks));
  const W = 14 * 22, H = 100, y = (v: number) => H - (v / top) * H;

  return (
    <div className="eltern">
      <div className="thead">
        <button className="back" onClick={onBack} aria-label={shared ? 'Bericht schließen' : 'Zurück'}>←</button>
        <span className="ticon" aria-hidden="true">👪</span>
        <h1>{remote ? 'Fortschritt' : 'Eltern-Ansicht'}{who !== 'Ihr Kind' ? `: ${who}` : ''}</h1>
      </div>
      {remote && (
        <p className="el-shared">{remote.updated ? `Zuletzt vom Gerät übertragen: ${when(new Date(remote.updated).getTime())}.` : 'Von diesem Konto ist noch kein Fortschritt angekommen.'}{' '}
          <button className="linkbtn" onClick={remote.onRefresh} disabled={remote.loading}>{remote.loading ? 'Lädt …' : 'Aktualisieren'}</button></p>
      )}
      {shared && <p className="el-shared">Geteilter Bericht, Stand {when(r.made)}. Für einen neuen Stand schickt Ihr Kind einfach einen neuen Link.</p>}

      <section className="card panel el-sum">
        <h2 className="h2">Auf einen Blick</h2>
        <p>{summary(r, who)}</p>
        <div className="el-kpis">
          <div><small>Lerntage</small><b>{r.days.active7} von 7</b><em>letzte Woche · {r.days.active30} in 30 Tagen</em></div>
          <div><small>Aufgaben</small><b>{r.tasks.last7}</b><em>letzte 7 Tage · {r.tasks.all} insgesamt</em></div>
          <div><small>Lernzeit</small><b>{mins(r.sec7)}</b><em>letzte 7 Tage · {mins(r.secAll)} insgesamt</em></div>
          <div><small>Ohne Hilfe richtig</small><b>{pct(r.firstRate)}</b><em>beim ersten Versuch</em></div>
        </div>
      </section>

      <section className="card panel">
        <h2 className="h2">Die letzten 14 Tage</h2>
        <svg className="hist el-hist" viewBox={`-4 -16 ${W + 8} ${H + 38}`} role="img" aria-label="Aufgaben pro Tag in den letzten 14 Tagen">
          {r.last14.map((d, k) => (
            <g key={d.day}>
              {d.tasks > 0 && <rect className="all" x={k * 22 + 3} y={y(d.tasks)} width={16} height={H - y(d.tasks)} rx={4} />}
              {d.right > 0 && <rect className="on" x={k * 22 + 3} y={y(Math.min(d.right, d.tasks || d.right))} width={16} height={H - y(Math.min(d.right, d.tasks || d.right))} rx={4} />}
              {d.tasks > 0 && <text className="hist-v" x={k * 22 + 11} y={y(d.tasks) - 3} textAnchor="middle">{d.tasks}</text>}
              <text className="hist-d" x={k * 22 + 11} y={H + 16} textAnchor="middle">{WD[new Date(d.day + 'T12:00:00').getDay()]}</text>
            </g>
          ))}
          <line className="hist-base" x1={0} x2={W} y1={H} y2={H} />
        </svg>
        <p className="el-legend"><i className="on" /> richtig gelöst <i className="all" /> bearbeitet</p>
      </section>

      <section className="card panel">
        <h2 className="h2">Hier braucht {who} Unterstützung</h2>
        {r.weak.length
          ? <ul className="el-weak">{r.weak.map(t => <WeakItem key={t.id} t={t} onErrors={() => { setFilter(t.id); document.getElementById('el-fehler')?.scrollIntoView({ behavior: 'smooth' }); }} onOpen={onOpenTopic} />)}</ul>
          : <p>{practiced.length ? 'Gerade gibt es kein Thema, bei dem es deutlich hakt. 👍' : 'Sobald ein paar Aufgaben gelöst sind, steht hier, wo es hakt.'}</p>}
        {r.weak.length > 0 && (
          <div className="merke el-tips"><span className="merke-l">So können Sie helfen</span><ol>
            <li>Lassen Sie sich eine falsche Aufgabe unten von {who} erklären. Oft fällt der Fehler beim Erklären selbst auf.</li>
            <li>Öffnen Sie das Thema gemeinsam unter „Verstehen“ und „Beispiel“. Die Heft-Ansicht zeigt, wie es auf Papier aussehen soll.</li>
            <li>Lieber jeden Tag 10 Minuten als einmal pro Woche eine Stunde.</li>
          </ol></div>
        )}
      </section>

      <section className="card panel">
        <h2 className="h2">Alle Themen</h2>
        {practiced.length ? (
          <ul className="el-topics">
            {(more ? practiced : practiced.slice(0, 12)).map(t => (
              <li key={t.id}>
                <span className="el-ti" aria-hidden="true">{look(t.id).icon}</span>
                <span className="el-tt"><b>{title(t.id)}</b>
                  <small>Stufe {t.level} ({STAGES[t.level - 1]?.name}) · {t.n} Aufgaben · ohne Hilfe {pct(t.firstRate)}{t.lastAt ? ` · zuletzt ${when(t.lastAt)}` : ''}</small></span>
                <span className={`el-chip ${STATE[t.state].cls}`}>{STATE[t.state].label}</span>
              </li>
            ))}
          </ul>
        ) : <p>Noch kein Thema geübt.</p>}
        {practiced.length > 12 && <button className="linkbtn" onClick={() => setMore(!more)}>{more ? 'Weniger zeigen' : `Alle ${practiced.length} Themen zeigen`}</button>}
      </section>

      <section className="card panel" id="el-fehler">
        <div className="dash-h">
          <h2 className="h2">Fehler und Aufgaben mit Hilfe</h2>
          {r.mistakes.length > 0 && (
            <select className="el-sel" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Nach Thema filtern">
              <option value="">Alle Themen</option>
              {[...new Set(r.mistakes.map(m => m.topic))].map(id => <option key={id} value={id}>{title(id)}</option>)}
            </select>
          )}
        </div>
        {mistakes.length
          ? <ol className="el-mist">{mistakes.slice(0, 30).map((m, i) => <Mistake key={m.t + '-' + i} m={m} />)}</ol>
          : <p>{r.mistakes.length ? 'In diesem Thema gab es keine Fehler.' : 'Noch keine Fehler aufgezeichnet. Die Liste füllt sich ab jetzt mit jeder Aufgabe.'}</p>}
      </section>

      <section className="card panel">
        <h2 className="h2">Klassenarbeiten</h2>
        {r.exams.length ? (
          <ul className="el-exams">{r.exams.slice(0, 10).map(e => (
            <li key={e.t}><b className={`el-note g${e.note}`}>{e.note}</b><span>{e.name}<small>{when(e.t)} · {Math.round(e.p * 100)} % · {mins(e.secs)}</small></span></li>
          ))}</ul>
        ) : r.examBest.length ? (
          <ul className="el-exams">{r.examBest.map(e => (
            <li key={e.id}><b className={`el-note g${e.note}`}>{e.note}</b><span>{examName(e.id)}<small>beste Note · {e.tries}× geschrieben · zuletzt {day(e.at.slice(0, 10))}</small></span></li>
          ))}</ul>
        ) : <p>Noch keine Klassenarbeit geschrieben.</p>}
      </section>

      <section className="card panel">
        <h2 className="h2">Genutzte Hilfen</h2>
        <p className="el-help">{(Object.keys(HELP) as Help[]).map(h => <span key={h}>{HELP[h]}: <b>{r.helpUse[h]}×</b></span>)}</p>
        <p className="lead">Hilfe zu nutzen ist gut. Wenn die Lösung aber oft direkt angesehen wird, lohnt es sich, gemeinsam zu üben.</p>
      </section>

      {!shared && !remote && <Share data={data} who={who} />}
      <p className="foot-note">{remote ? `Diese Daten kommen aus dem Konto von ${remote.name}. Nur Sie als Lehrer und verbundene Eltern sehen sie.` : synced ? 'Der Fortschritt wird im Konto gespeichert, damit Lehrer und Eltern ihn sehen. Ein geteilter Link enthält eine Kopie des Berichts.' : 'Alle Daten bleiben auf diesem Gerät. Nur ein geteilter Link enthält eine Kopie des Berichts.'}</p>
    </div>
  );
}

/** Zwei, drei Sätze in Alltagssprache. */
function summary(r: ReturnType<typeof buildReport>, who: string): string {
  if (!r.tasks.all && !r.exams.length) return `${who} hat noch keine Aufgaben gelöst. Hier erscheint der Fortschritt, sobald es losgeht.`;
  const s: string[] = [];
  s.push(r.days.active7
    ? `${who} hat in den letzten 7 Tagen an ${r.days.active7} ${r.days.active7 === 1 ? 'Tag' : 'Tagen'} gelernt und ${r.tasks.last7} Aufgaben bearbeitet${r.sec7 >= 60 ? ` (etwa ${mins(r.sec7)})` : ''}.`
    : `${who} hat in den letzten 7 Tagen nicht gelernt. Insgesamt sind es ${r.tasks.all} Aufgaben.`);
  if (r.firstRate != null) s.push(`${pct(r.firstRate)} der Aufgaben klappen beim ersten Versuch ohne Hilfe.`);
  const strong = r.topics.filter(t => t.state === 'stark').slice(0, 3).map(t => title(t.id));
  if (strong.length) s.push(`Sicher: ${strong.join(', ')}.`);
  if (r.weak.length) s.push(`Hilfe braucht ${who} vor allem bei: ${r.weak.slice(0, 3).map(t => title(t.id)).join(', ')}.`);
  return s.join(' ');
}

function WeakItem({ t, onErrors, onOpen }: { t: TopicRow; onErrors: () => void; onOpen?: (id: string) => void }) {
  return (
    <li>
      <div className="el-wh"><span aria-hidden="true">{look(t.id).icon}</span><b>{title(t.id)}</b><span className={`el-chip ${STATE[t.state].cls}`}>{STATE[t.state].label}</span></div>
      <p>{t.recentMiss} der letzten {Math.min(10, t.n)} Aufgaben nicht ohne Fehler gelöst · ohne Hilfe richtig: {pct(t.firstRate)} · Stufe {t.level}</p>
      {t.diags.length > 0 && <ul className="el-diag">{t.diags.map(d => <li key={d.text}>„{d.text}“ <small>{d.n}×</small></li>)}</ul>}
      <div className="el-act">
        <button className="btn soft" onClick={onErrors}>Fehler ansehen</button>
        {onOpen && <button className="btn quiet" onClick={() => onOpen(t.id)}>Thema öffnen</button>}
      </div>
    </li>
  );
}

function Mistake({ m }: { m: Attempt }) {
  return (
    <li className={m.ok ? 'helped' : 'wrong'}>
      <div className="er-h"><span aria-hidden="true">{look(m.topic).icon}</span><b>{title(m.topic)}</b></div>
      <small className="el-when">{when(m.t)}{m.src === 'arbeit' ? ' · Klassenarbeit' : ` · Stufe ${m.lv}`}</small>
      <Html as="p" html={m.q} />
      <p className="er-a">
        {m.wrong.length > 0 && <>Eingegeben: <b className="el-w">{m.wrong.join(' · ')}</b> · </>}
        Richtig: <Html as="b" html={m.a} />
        {m.ok && m.wrong.length > 0 && ' · danach selbst gelöst'}
      </p>
      {m.diag && <p className="el-dg">💬 Hinweis der App: {m.diag}</p>}
      {m.help.length > 0 && <p className="el-hs">{m.help.map(h => <span key={h}>{HELP[h]}</span>)}</p>}
    </li>
  );
}

/** Bericht als Link verschicken, z. B. per WhatsApp an die Eltern oder den Nachhilfelehrer. */
function Share({ data, who }: { data: Props['data']; who: string }) {
  const [msg, setMsg] = useState('');
  const share = async () => {
    try {
      const code = await encodeSnapshot(snapshot(data.profile, data.stats, data.exams, data.act, data.journal));
      const url = `${location.origin}${location.pathname}#${SHARE_KEY}=${code}`;
      const text = `Lernbericht von ${who} (Rechenweg)`;
      if (navigator.share) { await navigator.share({ title: text, url }); setMsg('Geteilt.'); return; }
      await navigator.clipboard.writeText(url);
      setMsg('Link kopiert. Sie können ihn jetzt z. B. per WhatsApp oder E-Mail verschicken.');
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') setMsg('Teilen hat nicht geklappt. Bitte noch einmal versuchen.');
    }
  };
  return (
    <section className="card panel el-share">
      <h2 className="h2">Bericht teilen</h2>
      <p>Schicken Sie diesen Bericht als Link an ein anderes Handy, z. B. an den zweiten Elternteil oder die Nachhilfe. Der Link zeigt den Stand von jetzt.</p>
      <button className="btn big" onClick={share}>🔗 Bericht als Link senden</button>
      {msg && <p role="status">{msg}</p>}
    </section>
  );
}
