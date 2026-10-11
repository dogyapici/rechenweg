/* ===== Klasse 5/6: Geometrie zum Anschauen, Drehen und Zeichnen ===== */
import type { GuideStep } from './guide.js';
import { autoGuide, wordTask } from './guide.js';
import { q, type Q, type ExprSolution } from './engine/index.js';
import { M, R, exprTask, genFrom, list, pick, type Task, type Topic } from './gen.js';
import { SOLID_COUNT, SOLID_NAME, solidSVG, type SolidKind } from './solid.js';
import {
  cellsKey, cellsValue, decodePoint, encodePoint, has2x2, isCubeNet, mirrorAnswer, mirrorSVG, netSVG, pointH, randomHexomino, valueCells,
  type Cell, type GridPoint, type MirrorAxis, type Widget,
} from './widgets.js';

const opts = (right: string, wrong: string[]) => [{ html: right, ok: true }, ...wrong.filter(w => w !== right).map(w => ({ html: w, ok: false }))];
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function choose(t: Task & { sol: ExprSolution }, ask: string, right: string, wrong: string[], why: string): Task {
  const g = autoGuide(t.sol); g[0] = { ...g[0], choose: { ask, options: opts(M(right), wrong.map(M)), why } };
  return { ...t, guide: g };
}

/* ---------- Winkel ---------- */
const rad = (d: number) => (d * Math.PI) / 180;
/** Ein Winkel als Bild. Mit `geo` liegt ein Geodreieck darauf, zum Ablesen. */
export function angleFig(deg: number, label = 'α', geo = false): string {
  const cx = 150, cy = deg > 180 || geo ? 150 : 140, r = 110, ex = cx + r * Math.cos(rad(deg)), ey = cy - r * Math.sin(rad(deg));
  let g = '';
  if (geo) {
    g += `<path class="protractor" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z" />`;
    for (let a = 0; a <= 180; a += 5) {
      const r1 = a % 10 === 0 ? r - 11 : r - 6;
      g += `<line class="tick" x1="${cx + r * Math.cos(rad(a))}" y1="${cy - r * Math.sin(rad(a))}" x2="${cx + r1 * Math.cos(rad(a))}" y2="${cy - r1 * Math.sin(rad(a))}" />`;
      if (a % 10 === 0) g += `<text class="tk sm" x="${cx + (r - 19) * Math.cos(rad(a))}" y="${cy - (r - 19) * Math.sin(rad(a)) + 3}" text-anchor="middle">${a}</text>`;
    }
  }
  const ar = 32, arc = `M ${cx + ar} ${cy} A ${ar} ${ar} 0 ${deg > 180 ? 1 : 0} 0 ${cx + ar * Math.cos(rad(deg))} ${cy - ar * Math.sin(rad(deg))}`;
  const lx = cx + (ar + 16) * Math.cos(rad(deg / 2)), ly = cy - (ar + 16) * Math.sin(rad(deg / 2)) + 5;
  const vb = deg > 180 ? '0 20 300 270' : geo ? '20 20 260 145' : `0 ${deg > 90 ? 15 : 15} 300 150`;
  return `<svg class="fig angle-fig" viewBox="${vb}" role="img" aria-label="Winkel ${label}${geo ? ' mit Geodreieck' : ''}">${g}${deg === 90 ? `<rect class="rt" x="${cx}" y="${cy - 18}" width="18" height="18" /><circle class="dot" cx="${cx + 9}" cy="${cy - 9}" r="2" />` : `<path class="arc" d="${arc}" />`}<line class="ray" x1="${cx}" y1="${cy}" x2="${cx + r + 20}" y2="${cy}" /><line class="ray" x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" /><circle class="vertex" cx="${cx}" cy="${cy}" r="3.5" /><text x="${lx}" y="${ly}" text-anchor="middle">${label}</text></svg>`;
}
const ARTEN = ['spitz', 'recht', 'stumpf', 'gestreckt', 'überstumpf'];
const artOf = (d: number) => (d < 90 ? 0 : d === 90 ? 1 : d < 180 ? 2 : d === 180 ? 3 : 4);
function triFig(a: number, b: number, la: string, lb: string, lc: string): string {
  // Dreieck mit den Winkeln a bei A und b bei B, Grundseite 200
  const c = 180 - a - b, base = 200, ac = (base * Math.sin(rad(b))) / Math.sin(rad(c));
  const C = [20 + ac * Math.cos(rad(a)), 0 + ac * Math.sin(rad(a))], s = Math.min(1, 130 / C[1]);
  const P = (x: number, y: number) => `${20 + (x - 20) * s},${160 - y * s}`;
  const [Ax, Ay, Bx, By, Cx, Cy] = [20, 0, 20 + base, 0, C[0], C[1]];
  const lab = (x: number, y: number, tx: number, ty: number, t: string) => { const k = 26; const dx = tx - x, dy = ty - y, l = Math.hypot(dx, dy); return `<text x="${20 + (x + (dx / l) * k - 20) * s}" y="${160 - (y + (dy / l) * k) * s + 5}" text-anchor="middle">${t}</text>`; };
  const mid = (x1: number, y1: number, x2: number, y2: number) => [(x1 + x2) / 2, (y1 + y2) / 2];
  const [m1x, m1y] = mid(Bx, By, Cx, Cy), [m2x, m2y] = mid(Ax, Ay, Cx, Cy), [m3x, m3y] = mid(Ax, Ay, Bx, By);
  return `<svg class="fig" viewBox="0 0 ${Math.max(240, 40 + Math.max(Bx, Cx) * s)} 180" role="img" aria-label="Dreieck mit den Winkeln ${la}, ${lb} und ${lc}"><polygon class="sh" points="${P(Ax, Ay)} ${P(Bx, By)} ${P(Cx, Cy)}" />${lab(Ax, Ay, m1x, m1y, la)}${lab(Bx, By, m2x, m2y, lb)}${lab(Cx, Cy, m3x, m3y, lc)}</svg>`;
}
function nebenFig(a: number, la: string, lb: string): string {
  const cx = 150, cy = 120, r = 100, ex = cx + r * Math.cos(rad(a)), ey = cy - r * Math.sin(rad(a));
  return `<svg class="fig" viewBox="20 10 260 130" role="img" aria-label="Nebenwinkel ${la} und ${lb} an einer Geraden"><line class="ray" x1="${cx - r - 20}" y1="${cy}" x2="${cx + r + 20}" y2="${cy}" /><line class="ray" x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" /><path class="arc" d="M ${cx + 26} ${cy} A 26 26 0 0 0 ${cx + 26 * Math.cos(rad(a))} ${cy - 26 * Math.sin(rad(a))}" /><path class="arc b" d="M ${cx + 34 * Math.cos(rad(a))} ${cy - 34 * Math.sin(rad(a))} A 34 34 0 0 0 ${cx - 34} ${cy}" /><text x="${cx + 44 * Math.cos(rad(a / 2))}" y="${cy - 44 * Math.sin(rad(a / 2)) + 5}" text-anchor="middle">${la}</text><text x="${cx + 52 * Math.cos(rad((a + 180) / 2))}" y="${cy - 52 * Math.sin(rad((a + 180) / 2)) + 5}" text-anchor="middle">${lb}</text></svg>`;
}
const quadFig = (l: string[]) => `<svg class="fig" viewBox="0 0 260 170" role="img" aria-label="Viereck mit den Winkeln ${l.join(', ')}"><polygon class="sh" points="30,140 220,150 190,30 70,40" /><text x="52" y="128">${l[0]}</text><text x="196" y="136">${l[1]}</text><text x="170" y="56">${l[2]}</text><text x="80" y="62">${l[3]}</text><text class="tk" x="130" y="168" text-anchor="middle">Skizze, nicht maßstabsgetreu</text></svg>`;

function winkelGen(level: number): Task | null {
  return genFrom(() => {
    if (level === 1) {
      if (Math.random() < 0.5) {
        const art = R(0, 4), d = [R(2, 8) * 10, 90, R(10, 17) * 10, 180, R(19, 34) * 10][art];
        const w: Widget = { kind: 'pick', options: ARTEN };
        return { prompt: `Was für ein Winkel ist das?${angleFig(d)}`, answer: q(art + 1), widget: w, placeholder: 'Auswahl',
          sol: list([{ rule: 'Vergleichen', lines: ['spitz: kleiner als 90° · recht: genau 90° · stumpf: zwischen 90° und 180° · gestreckt: genau 180° · überstumpf: mehr als 180°', `Der Winkel ist ${d}° groß, also <b>${ARTEN[art]}</b>.`] }], q(art + 1), ARTEN[art]),
          guide: [{ title: 'Mit dem rechten Winkel vergleichen', ask: '<p>Ein rechter Winkel ist wie die Ecke von einem Blatt Papier. Wie viel Grad hat ein rechter Winkel?</p>', answer: q(90), hint: 'Ein Viertel vom Kreis.', explain: 'Ein rechter Winkel hat 90°. Ist dein Winkel kleiner, größer oder genau so groß?' }],
          diag: v => (Number(v.n) === 2 && art !== 1 ? 'Der Winkel ist kein rechter Winkel. Halte ein Blatt Papier mit der Ecke daran.' : null) };
      }
      const d = R(2, 17) * 10;
      return { prompt: `Zeichne einen Winkel von <b>${d}°</b>. Zieh den roten Schenkel, bis er auf ${d} zeigt.`, answer: q(d), widget: { kind: 'angle', max: 180 }, placeholder: 'Winkel',
        sol: list([{ rule: 'Geodreieck anlegen', lines: ['Der Scheitel liegt in der Mitte, der erste Schenkel auf der 0.', `Zähle auf der Skala bis ${d} und zieh den zweiten Schenkel dorthin.`] }], q(d), `${d}°`),
        guide: [{ title: 'Größer oder kleiner als 90°?', ask: `<p>Ein rechter Winkel hat 90°. Um wie viel Grad ist ${d}° ${d < 90 ? 'kleiner' : 'größer'} als 90°?</p>`, answer: q(Math.abs(90 - d)), hint: d < 90 ? `90 − ${d}` : `${d} − 90`, explain: `Dein Winkel ist ${d < 90 ? 'spitz' : d === 90 ? 'recht' : 'stumpf'}. Der Schenkel steht also ${d < 90 ? 'vor' : 'hinter'} der 90.` }].filter(g => g.answer.sign() > 0) };
    }
    if (level === 2) {
      if (Math.random() < 0.6) {
        const d = R(3, 35) * 5;
        return { prompt: `Miss den Winkel α mit dem Geodreieck. Wie groß ist er?${angleFig(d, 'α', true)}`, answer: q(d), placeholder: 'Winkel in °',
          sol: list([{ rule: 'Ablesen', lines: ['Der Scheitel liegt in der Mitte, der untere Schenkel auf der 0.', `Der zweite Schenkel zeigt auf <b>${d}°</b>.`] }], q(d), `${d}°`),
          guide: [{ title: 'Grob schätzen', choose: { ask: 'Ist der Winkel spitz oder stumpf?', options: opts(d < 90 ? 'spitz (kleiner als 90°)' : d === 90 ? 'recht (genau 90°)' : 'stumpf (größer als 90°)', ['spitz (kleiner als 90°)', 'stumpf (größer als 90°)', 'recht (genau 90°)']), why: 'Vergleiche mit der Ecke von einem Blatt Papier.' },
            ask: '<p>Jetzt genau: Auf welche Zahl zeigt der zweite Schenkel? Zwischen zwei Zahlen liegen 10°, jeder kleine Strich sind 5°.</p>', answer: q(d), hint: 'Lies an der Skala ab, die beim ersten Schenkel mit 0 anfängt.', explain: `α = ${d}°` }],
          diag: v => (v.eq(q(180 - d)) ? 'Du hast an der falschen Skala abgelesen. Nimm die Skala, die beim ersten Schenkel bei 0 anfängt.' : null) };
      }
      const d = R(19, 34) * 10;
      return { prompt: `Zeichne einen <b>überstumpfen</b> Winkel von <b>${d}°</b>.`, answer: q(d), widget: { kind: 'angle', max: 360 }, placeholder: 'Winkel',
        sol: list([{ rule: 'Über 180° hinaus', lines: [`${d}° = 180° + ${d - 180}°`, `Zieh den Schenkel über die gestreckte Linie (180°) hinaus, noch ${d - 180}° weiter.`] }], q(d), `${d}°`),
        guide: [{ title: 'In zwei Teilen', ask: `<p>Ein gestreckter Winkel hat 180°. Wie viel fehlt dann noch bis ${d}°?</p>`, answer: q(d - 180), hint: `${d} − 180`, explain: `${d}° = 180° + ${d - 180}°` }] };
    }
    const k = R(0, 2);
    if (k === 0) {
      const a = R(3, 10) * 10 + pick([0, 5]), b = R(3, 10) * 10;
      if (a + b > 160) return null;
      const t = exprTask(`180 − ${a} − ${b}`, { placeholder: 'Winkel in °' });
      t.prompt = `Im Dreieck ist ${M(`α = ${a}°`)} und ${M(`β = ${b}°`)}. Wie groß ist γ?${triFig(a, b, `${a}°`, `${b}°`, 'γ = ?')}`;
      return choose(t, 'Wie rechnest du γ aus?', `180 − ${a} − ${b}`, [`360 − ${a} − ${b}`, `${a} + ${b}`], 'Im Dreieck sind alle drei Winkel zusammen immer 180°.');
    }
    if (k === 1) {
      const a = R(3, 15) * 10 + pick([0, 5]);
      const t = exprTask(`180 − ${a}`, { placeholder: 'Winkel in °' });
      t.prompt = `α und β liegen nebeneinander an einer Geraden (Nebenwinkel). ${M(`α = ${a}°`)}. Wie groß ist β?${nebenFig(a, `${a}°`, 'β')}`;
      return choose(t, 'Wie rechnest du β aus?', `180 − ${a}`, [`90 − ${a}`, `360 − ${a}`], 'Nebenwinkel ergeben zusammen einen gestreckten Winkel: 180°.');
    }
    const a = R(6, 11) * 10, b = R(6, 11) * 10, c = R(6, 11) * 10, d = 360 - a - b - c;
    if (d < 40 || d > 160) return null;
    const t = exprTask(`360 − ${a} − ${b} − ${c}`, { placeholder: 'Winkel in °' });
    t.prompt = `In einem Viereck sind drei Winkel bekannt: ${M(`${a}°`)}, ${M(`${b}°`)} und ${M(`${c}°`)}. Wie groß ist der vierte Winkel δ?${quadFig([`${a}°`, `${b}°`, `${c}°`, 'δ'])}`;
    return choose(t, 'Wie rechnest du δ aus?', `360 − ${a} − ${b} − ${c}`, [`180 − ${a} − ${b} − ${c}`, `${a} + ${b} + ${c}`], 'Im Viereck sind alle vier Winkel zusammen 360°.');
  }, t => t.answer.sign() > 0);
}
const WINKEL: Topic = {
  id: 'winkel', klasse: 5, title: 'Winkel, Dreiecke und Vierecke', short: 'Winkel messen und zeichnen, Winkelarten und Winkelsummen.',
  exampleSol: () => { const t = winkelGen(3)!; return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Ein <b>Winkel</b> entsteht, wenn zwei Strahlen (die <b>Schenkel</b>) von einem Punkt (dem <b>Scheitel</b>) ausgehen. Gemessen wird in <b>Grad</b> (°). Eine ganze Drehung sind 360°.</p>
    <div class="fig-row">${['spitz', 'recht', 'stumpf', 'überstumpf'].map((n, i) => `<figure>${angleFig([50, 90, 130, 240][i], '')}<figcaption><b>${n}</b><br>${['kleiner als 90°', 'genau 90°', '90° bis 180°', 'mehr als 180°'][i]}</figcaption></figure>`).join('')}</div>
    <p><b>Messen mit dem Geodreieck:</b> Lege die Mitte auf den Scheitel und die Linie auf einen Schenkel. Lies dann an der Skala ab, die bei diesem Schenkel mit <b>0</b> anfängt.${angleFig(60, 'α', true)}</p>
    <p>Im <b>Dreieck</b> sind die drei Winkel zusammen immer <b>180°</b>, im <b>Viereck</b> immer <b>360°</b>. Zwei Winkel nebeneinander an einer Geraden (<b>Nebenwinkel</b>) ergeben 180°.</p>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>Spitz &lt; 90° = recht &lt; stumpf &lt; 180° = gestreckt &lt; überstumpf.</li><li>Beim Messen: die Skala nehmen, die beim Schenkel bei 0 beginnt.</li><li>Dreieck 180°, Viereck 360°, Nebenwinkel 180°.</li></ol></div>`,
  gen: winkelGen,
  text: level => genFrom(() => {
    if (level === 4) {
      const h = R(1, 5);
      return wordTask({
        prompt: `Es ist genau ${h} Uhr. Wie groß ist der Winkel zwischen dem großen und dem kleinen Zeiger?`,
        steps: [
          { title: 'Eine Stunde', ask: 'Das Zifferblatt hat 12 Stunden und eine ganze Drehung sind 360°. Wie viel Grad liegen zwischen zwei Stundenzahlen?', calc: '360 : 12', wrong: ['360 : 60', '180 : 12'], why: 'Der ganze Kreis (360°) wird in 12 gleiche Teile geteilt.', unit: '°' },
          { title: `${h} Stunden`, ask: `Der kleine Zeiger steht auf der ${h}, der große auf der 12. Wie groß ist der Winkel?`, calc: `30 · ${h}`, wrong: [`30 + ${h}`], why: `Zwischen 12 und ${h} liegen ${h} Stunden-Abstände.`, unit: '°' },
        ].filter(s => h > 1 || s.title === 'Eine Stunde'),
        unit: '°', sentence: v => `Um ${h} Uhr ist der Winkel ${v} groß.`,
      });
    }
    if (Math.random() < 0.5) {
      const n = pick([20, 24, 30, 36]), k = R(2, n / 2);
      return wordTask({
        prompt: `In der Klasse sind ${n} Kinder. ${k} von ihnen kommen mit dem Fahrrad. Im Kreisdiagramm soll das Fahrrad ein Tortenstück bekommen. Wie groß ist der Winkel?`,
        steps: [
          { title: 'Ein Kind', ask: `Der ganze Kreis (360°) sind alle ${n} Kinder. Wie viel Grad bekommt ein Kind?`, calc: `360 : ${n}`, wrong: [`360 · ${n}`], why: 'Der Kreis wird gerecht aufgeteilt: geteilt.', unit: '°' },
          { title: `${k} Kinder`, ask: `Wie groß ist das Tortenstück für ${k} Kinder?`, calc: `${360 / n} · ${k}`, wrong: [`${360 / n} + ${k}`], unit: '°' },
        ],
        unit: '°', sentence: v => `Das Tortenstück ist ${v} groß.`,
      });
    }
    const g = R(2, 14) * 10;
    if ((180 - g) % 2) return null;
    return wordTask({
      prompt: `Ein Dach sieht von vorne aus wie ein gleichschenkliges Dreieck. Der Winkel oben an der Spitze ist ${g}°. Die beiden Winkel unten sind gleich groß. Wie groß ist einer davon?`,
      steps: [
        { title: 'Beide unten zusammen', ask: 'Wie viel Grad sind die beiden unteren Winkel zusammen?', calc: `180 − ${g}`, wrong: [`360 − ${g}`], why: 'Im Dreieck sind alle Winkel zusammen 180°.', unit: '°' },
        { title: 'Ein Winkel', ask: 'Wie groß ist einer der beiden unteren Winkel?', calc: `${180 - g} : 2`, wrong: [`${180 - g} · 2`], why: 'Beide sind gleich groß: durch 2.', unit: '°' },
      ],
      unit: '°', sentence: v => `Jeder untere Winkel ist ${v} groß.`,
    });
  }, t => t.guide.every(s => s.answer.isInt() && s.answer.sign() > 0)),
};

/* ---------- Symmetrie ---------- */
function blob(w: number, h: number, inside: (x: number, y: number) => boolean, n: number): number[] {
  const free: [number, number][] = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y)) free.push([x, y]);
  const start = free[Math.floor(Math.random() * free.length)], cells: [number, number][] = [start];
  for (let k = 0; k < 200 && cells.length < n; k++) {
    const [x, y] = cells[Math.floor(Math.random() * cells.length)], [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1]]);
    const c: [number, number] = [x + dx, y + dy];
    if (inside(...c) && c[0] >= 0 && c[1] >= 0 && c[0] < w && c[1] < h && !cells.some(o => o[0] === c[0] && o[1] === c[1])) cells.push(c);
  }
  return cells.map(([x, y]) => y * w + x).sort((a, b) => a - b);
}
function mirrorTask(dir: 'v' | 'h' | 'p', story?: string): Task {
  const w = 8, h = 6;
  const axis: MirrorAxis = dir === 'v' ? { dir: 'v', at: 4 } : dir === 'h' ? { dir: 'h', at: 3 } : { dir: 'p', x: 4, y: 3 };
  const given = blob(w, h, (x, y) => (dir === 'v' ? x < 4 : dir === 'h' ? y < 3 : x < 4), R(4, 7));
  const wd: Extract<Widget, { kind: 'mirror' }> = { kind: 'mirror', w, h, axis, given };
  const ans = mirrorAnswer(wd);
  const dist = (c: number) => (dir === 'h' ? 3 - Math.floor(c / w) : 4 - (c % w));
  const far = Math.max(...given.map(dist));
  const name = dir === 'v' ? 'senkrechten Achse' : dir === 'h' ? 'waagerechten Achse' : 'Punkt';
  const guide: GuideStep[] = [
    { title: 'Abstand zur Achse', ask: dir === 'p'
      ? `<p>Beim Spiegeln am Punkt landet jedes Kästchen genau gegenüber, gleich weit vom Punkt entfernt. Das äußerste Kästchen links ist ${far} Kästchen (waagerecht) vom Punkt entfernt. Wie weit rechts vom Punkt liegt sein Bild?</p>`
      : `<p>Das Kästchen, das am weitesten von der Achse weg ist, liegt ${far} Kästchen von der Achse entfernt. Wie weit ist sein Spiegelbild auf der anderen Seite von der Achse entfernt?</p>`,
      answer: q(far), hint: 'Beim Spiegeln bleibt der Abstand gleich.', explain: `Genau ${far} Kästchen, nur auf der anderen Seite${dir === 'p' ? ' und auch oben und unten vertauscht' : ''}.` },
    { title: 'Wie viele Kästchen?', ask: '<p>Wie viele Kästchen musst du insgesamt anmalen?</p>', answer: q(ans.length), hint: 'Jedes Kästchen der Figur bekommt genau ein Spiegelbild.', explain: `${ans.length} Kästchen. Jetzt mal sie oben an!` },
  ];
  return { prompt: story ?? `Spiegle die Figur an der ${dir === 'p' ? 'roten Punkt' : `roten ${name}`}. Male die Kästchen an, die dazugehören.`, answer: q(cellsValue(ans)), widget: wd, guide, placeholder: 'Zeichnung',
    sol: list([{ rule: 'Spiegeln', lines: [dir === 'p' ? 'Jedes Kästchen geht durch den Punkt hindurch genau gleich weit auf die andere Seite.' : 'Jedes Kästchen bekommt auf der anderen Seite der Achse ein Bild, genau gleich weit von der Achse entfernt.', `Das sind ${ans.length} Kästchen.`] }], q(cellsValue(ans)), mirrorSVG(wd, ans)),
    diag: v => { const mine = valueCells(v.n), miss = ans.filter(c => !mine.includes(c)).length, extra = mine.filter(c => !ans.includes(c)).length; return `${miss ? `${miss} ${miss === 1 ? 'Kästchen fehlt' : 'Kästchen fehlen'} noch` : ''}${miss && extra ? ' und ' : ''}${extra ? `${extra} ${extra === 1 ? 'Kästchen ist' : 'Kästchen sind'} zu viel` : ''}. Prüfe bei jedem Kästchen den Abstand zur ${dir === 'p' ? 'Mitte' : 'Achse'}.`; } };
}
const SHAPES: { n: string; a: number; svg: string }[] = [
  { n: 'Quadrat', a: 4, svg: '<rect x="70" y="20" width="120" height="120" />' },
  { n: 'Rechteck', a: 2, svg: '<rect x="30" y="40" width="200" height="90" />' },
  { n: 'gleichseitiges Dreieck', a: 3, svg: '<polygon points="130,15 230,150 30,150" />' },
  { n: 'Raute', a: 2, svg: '<polygon points="130,10 210,80 130,150 50,80" />' },
  { n: 'Parallelogramm', a: 0, svg: '<polygon points="30,140 180,140 230,30 80,30" />' },
  { n: 'gleichschenkliges Trapez', a: 1, svg: '<polygon points="20,140 240,140 180,40 80,40" />' },
  { n: 'Drachenviereck', a: 1, svg: '<polygon points="130,10 200,60 130,155 60,60" />' },
  { n: 'regelmäßiges Sechseck', a: 6, svg: '<polygon points="80,20 180,20 230,85 180,150 80,150 30,85" />' },
];
function axesTask(): Task {
  const s = pick(SHAPES);
  return { prompt: `Wie viele Symmetrieachsen hat ein <b>${s.n}</b>?<svg class="fig" viewBox="0 0 260 165" role="img" aria-label="${s.n}"><g class="sh">${s.svg}</g></svg>`, answer: q(s.a), placeholder: 'Anzahl',
    sol: list([{ rule: 'Falten', lines: ['Eine Symmetrieachse teilt die Figur so, dass beim Falten beide Hälften genau aufeinander passen.', `Ein ${s.n} hat <b>${s.a}</b> ${s.a === 1 ? 'Symmetrieachse' : 'Symmetrieachsen'}.${s.n === 'Rechteck' ? ' Die Diagonalen sind keine Achsen: Faltest du dort, passen die Ecken nicht aufeinander.' : s.n === 'Parallelogramm' ? ' Es ist aber punktsymmetrisch: Dreh es halb herum, dann sieht es gleich aus.' : ''}`] }], q(s.a)),
    guide: [{ title: 'Falten', ask: '<p>Stell dir vor, du schneidest die Figur aus und faltest sie. Bei wie vielen Falten passen beide Hälften genau aufeinander?</p>', answer: q(s.a), hint: 'Probier senkrecht, waagerecht und schräg durch die Ecken.', explain: `${s.a}` }],
    diag: v => (s.n === 'Rechteck' && v.eq(q(4)) ? 'Die Diagonalen sind beim Rechteck keine Symmetrieachsen. Falte ein Blatt Papier an der Diagonale: Die Ecken passen nicht aufeinander.' : s.n === 'Parallelogramm' && v.sign() > 0 ? 'Probier es mit Papier aus: Beim Parallelogramm passt keine Faltung genau.' : null) };
}
const SYM: Topic = {
  id: 'sym', klasse: 5, title: 'Symmetrie und Spiegeln', short: 'Symmetrieachsen finden und Figuren spiegeln, zum Selbst-Anmalen.',
  exampleSol: () => { const t = mirrorTask('v'); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Eine Figur ist <b>achsensymmetrisch</b>, wenn du sie so falten kannst, dass beide Hälften genau aufeinander passen. Die Faltlinie heißt <b>Symmetrieachse</b>.</p>
    <p>Beim <b>Spiegeln</b> an einer Achse bekommt jeder Punkt ein Bild auf der anderen Seite: <b>gleich weit</b> von der Achse entfernt und genau gegenüber.${mirrorSVG({ kind: 'mirror', w: 8, h: 4, axis: { dir: 'v', at: 4 }, given: [2, 3, 10, 11, 9, 19] }, [4, 5, 12, 13, 14, 20])}</p>
    <p>Eine Figur ist <b>punktsymmetrisch</b>, wenn sie nach einer halben Drehung (180°) gleich aussieht. Beim Spiegeln an einem Punkt geht jedes Kästchen durch den Punkt hindurch gleich weit auf die andere Seite.</p>
    <table class="stellen"><tr><th>Figur</th><td>Quadrat</td><td>Rechteck</td><td>Raute</td><td>gleichseitiges Dreieck</td><td>Parallelogramm</td></tr><tr><th>Achsen</th><td>4</td><td>2</td><td>2</td><td>3</td><td>0</td></tr></table>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>Spiegelbild: gleicher Abstand, andere Seite.</li><li>Kästchen zählen hilft beim Spiegeln.</li><li>Rechteck: Die Diagonalen sind keine Achsen!</li></ol></div>`,
  gen(level) {
    if (level === 1) return Math.random() < 0.6 ? mirrorTask('v') : axesTask();
    if (level === 2) return Math.random() < 0.7 ? mirrorTask(pick(['v', 'h'])) : axesTask();
    return mirrorTask(pick(['p', 'p', 'h', 'v']));
  },
  text: level => {
    const t = level === 4
      ? mirrorTask(pick(['v', 'h']), 'Tom legt mit Fliesen ein Mosaik für den Flur. Es soll symmetrisch werden, die rote Linie ist die Mitte. Eine Hälfte ist schon fertig. Male die Fliesen der anderen Hälfte an.')
      : mirrorTask('p', 'Lea zeichnet ein Muster für ein Windrad. Es soll gleich aussehen, wenn man es halb herumdreht (punktsymmetrisch um den roten Punkt). Male die fehlenden Kästchen an.');
    return { ...t, word: true, plain: t.prompt };
  },
};

/* ---------- Körper und Netze ---------- */
const KINDS: SolidKind[] = ['wuerfel', 'quader', 'pyramide', 'prisma'];
const COUNT_NAME = { e: 'Ecken', k: 'Kanten', f: 'Flächen' } as const;
function countTask(): Task {
  const kind = pick(KINDS), what = pick(['e', 'k', 'f'] as const), n = SOLID_COUNT[kind]![what];
  const dims = kind === 'quader' ? [4, 2.5, 2] : kind === 'wuerfel' ? [3] : [3, 2.5, 3];
  const how = { e: 'Ecken sind die Spitzen, an denen Kanten zusammenstoßen.', k: 'Kanten sind die Linien, an denen zwei Flächen zusammenstoßen.', f: 'Flächen sind die ebenen Seiten des Körpers.' }[what];
  return { prompt: `Wie viele <b>${COUNT_NAME[what]}</b> hat ein ${SOLID_NAME[kind]}? Dreh ihn, damit du alle siehst.${solidSVG(kind, dims)}`, answer: q(n), placeholder: 'Anzahl',
    sol: list([{ rule: COUNT_NAME[what], lines: [how, `Ein ${SOLID_NAME[kind]} hat ${SOLID_COUNT[kind]!.e} Ecken, ${SOLID_COUNT[kind]!.k} Kanten und ${SOLID_COUNT[kind]!.f} Flächen.`] }], q(n)),
    guide: [{ title: 'Zählen mit System', ask: `<p>${how} Zähle erst oben, dann unten, dann an der Seite. Wie viele ${COUNT_NAME[what]} hat der ${SOLID_NAME[kind]}?</p>`, answer: q(n), hint: 'Die gestrichelten Linien sind hinten. Die zählen auch!', explain: `${n} ${COUNT_NAME[what]}` }] };
}
/** Welche Würfelseite jedes Feld im Netz wird (0/1, 2/3, 4/5 liegen gegenüber) */
function netFaces(cells: Cell[]): number[] {
  const key = (c: Cell) => `${c[0]},${c[1]}`, idx = new Map(cells.map((c, i) => [key(c), i])), out: number[] = Array(cells.length).fill(-1);
  type O = { B: number; T: number; N: number; S: number; E: number; W: number };
  const roll: [number, number, (o: O) => O][] = [[1, 0, o => ({ ...o, B: o.E, T: o.W, E: o.T, W: o.B })], [-1, 0, o => ({ ...o, B: o.W, T: o.E, W: o.T, E: o.B })], [0, -1, o => ({ ...o, B: o.N, T: o.S, N: o.T, S: o.B })], [0, 1, o => ({ ...o, B: o.S, T: o.N, S: o.T, N: o.B })]];
  const st: [Cell, O][] = [[cells[0], { B: 0, T: 1, N: 2, S: 3, E: 4, W: 5 }]];
  while (st.length) { const [c, o] = st.pop()!; const i = idx.get(key(c))!; if (out[i] >= 0) continue; out[i] = o.B; for (const [dx, dy, f] of roll) { const n: Cell = [c[0] + dx, c[1] + dy]; const j = idx.get(key(n)); if (j !== undefined && out[j] < 0) st.push([n, f(o)]); } }
  return out;
}
function validNet(): Cell[] { for (;;) { const c = randomHexomino(); if (isCubeNet(c)) return c; } }
function netPickTask(): Task {
  const right = validNet(), seen = new Set([cellsKey(right)]), wrong: Cell[][] = [];
  for (let k = 0; k < 500 && wrong.length < 3; k++) { const c = randomHexomino(); if (!isCubeNet(c) && !has2x2(c) && !seen.has(cellsKey(c)) && Math.max(...c.map(x => x[0])) < 5) { seen.add(cellsKey(c)); wrong.push(c); } }
  const all = shuffle([right, ...wrong]), ok = all.indexOf(right);
  return { prompt: 'Welches Netz lässt sich zu einem <b>Würfel</b> falten?', answer: q(ok + 1), widget: { kind: 'pick', options: all.map(c => netSVG(c)) }, placeholder: 'Auswahl',
    sol: list([{ rule: 'In Gedanken falten', lines: ['Nimm ein Quadrat als Boden und klappe die anderen hoch. Kein Quadrat darf doppelt auf derselben Seite landen.', `Nur Netz ${'ABCD'[ok]} ergibt einen Würfel.${netSVG(right)}`] }], q(ok + 1), `Netz ${'ABCD'[ok]}`),
    guide: [{ title: 'Was braucht ein Würfel?', ask: '<p>Beim Falten müssen gegenüberliegende Flächen sich paarweise treffen: oben und unten, vorne und hinten, links und rechts. Wie viele solcher Paare hat ein Würfel?</p>', answer: q(3), hint: 'Ein Würfel hat 6 Flächen.', explain: '3 Paare. Wenn beim Falten zwei Quadrate auf derselben Seite landen, ist es kein Würfelnetz. Jetzt such das richtige Netz aus!' }] };
}
function oppositeTask(): Task {
  const net = validNet(), f = netFaces(net), nums = shuffle([1, 2, 3, 4, 5, 6]), i = R(0, 5), opp = f.indexOf(f[i] ^ 1);
  const s = 30, W = (Math.max(...net.map(c => c[0])) + 1) * s, H = (Math.max(...net.map(c => c[1])) + 1) * s;
  const svg = `<svg class="net big" viewBox="-2 -2 ${W + 4} ${H + 4}" role="img" aria-label="Würfelnetz mit Zahlen">${net.map(([x, y], k) => `<rect x="${x * s}" y="${y * s}" width="${s}" height="${s}" class="${k === i ? 'hl' : ''}" /><text x="${x * s + s / 2}" y="${y * s + s / 2 + 6}" text-anchor="middle">${nums[k]}</text>`).join('')}</svg>`;
  return { prompt: `Aus diesem Netz wird ein Würfel gefaltet. Welche Zahl liegt dann der <b>${nums[i]}</b> gegenüber?${svg}`, answer: q(nums[opp]), placeholder: 'Zahl',
    sol: list([{ rule: 'Gegenüber im Netz', lines: ['Liegen drei Quadrate in einer Reihe, sind das erste und das dritte gegenüber.', `Gegenüber der ${nums[i]} liegt die <b>${nums[opp]}</b>.`] }], q(nums[opp])),
    guide: [{ title: 'Eins überspringen', ask: `<p>In einer geraden Reihe von Quadraten liegen zwei Felder gegenüber, wenn genau eins dazwischen ist. Welche Zahl liegt der ${nums[i]} gegenüber?</p>`, answer: q(nums[opp]), hint: 'Nachbarn im Netz liegen nie gegenüber. Falte in Gedanken.', explain: `${nums[i]} und ${nums[opp]} liegen gegenüber.` }],
    diag: v => { const j = nums.indexOf(Number(v.n)); return j >= 0 && Math.abs(net[j][0] - net[i][0]) + Math.abs(net[j][1] - net[i][1]) === 1 ? 'Die beiden Felder sind im Netz Nachbarn. Nachbarn werden beim Falten auch Nachbarn, nicht gegenüber.' : null; } };
}
function quaderTask(what: 'V' | 'O', cube: boolean): Task {
  const a = R(2, 9), b = cube ? a : R(2, 8), c = cube ? a : R(2, 7);
  const expr = what === 'V' ? `${a} · ${b} · ${c}` : cube ? `6 · ${a} · ${a}` : `2 · (${a} · ${b} + ${a} · ${c} + ${b} · ${c})`;
  const t = exprTask(expr, { placeholder: what === 'V' ? 'Antwort in cm³' : 'Antwort in cm²' });
  const kind: SolidKind = cube ? 'wuerfel' : 'quader';
  t.prompt = `Berechne ${what === 'V' ? 'das <b>Volumen</b>' : 'den <b>Oberflächeninhalt</b>'} von diesem ${SOLID_NAME[kind]}.${solidSVG(kind, cube ? [a] : [a, b, c], cube ? [`${a} cm`] : [`${a} cm`, `${b} cm`, `${c} cm`])}`;
  t.plain = `${SOLID_NAME[kind]} ${cube ? `a = ${a} cm` : `${a} cm, ${b} cm, ${c} cm`}: ${what === 'V' ? 'Volumen' : 'Oberfläche'}`;
  const other = evalOther(what, a, b, c, cube);
  t.diag = v => (v.eq(other) ? (what === 'V' ? 'Das ist die Oberfläche. Das Volumen sagt, wie viel hineinpasst: Länge · Breite · Höhe.' : 'Das ist das Volumen. Die Oberfläche sind alle Flächen außen zusammen.') : null);
  return choose(t, 'Welche Formel passt?', what === 'V' ? (cube ? 'a · a · a' : 'a · b · c') : cube ? '6 · a · a' : '2 · (a · b + a · c + b · c)', what === 'V' ? [cube ? '6 · a · a' : '2 · (a · b + a · c + b · c)', 'a + b + c'] : [cube ? 'a · a · a' : 'a · b · c', '4 · a'], what === 'V' ? 'Volumen: Wie viele 1-cm-Würfel passen hinein? Länge mal Breite mal Höhe.' : cube ? 'Ein Würfel hat 6 gleiche quadratische Flächen.' : 'Ein Quader hat 6 Flächen, je zwei sind gleich groß.');
}
const evalOther = (what: 'V' | 'O', a: number, b: number, c: number, cube: boolean): Q => q(what === 'O' ? a * b * c : cube ? 6 * a * a : 2 * (a * b + a * c + b * c));
const KOERPER: Topic = {
  id: 'koerper', klasse: 5, title: 'Körper und Netze', short: 'Würfel, Quader, Pyramide und Prisma in 3D drehen, Netze falten, Volumen berechnen.',
  exampleSol: () => { const t = quaderTask('V', false); return { prompt: t.prompt, sol: t.sol }; },
  theory: `
    <p>Körper sind <b>räumlich</b>: Sie haben Länge, Breite und Höhe. Zieh mit dem Finger an den Körpern, dann drehen sie sich. Die gestrichelten Linien liegen hinten.</p>
    <div class="fig-row">${(['wuerfel', 'quader', 'pyramide', 'prisma', 'zylinder', 'kegel'] as SolidKind[]).map(k => `<figure>${solidSVG(k, k === 'quader' ? [4, 2.5, 2] : k === 'wuerfel' ? [3] : [3, 2.5, 3])}<figcaption><b>${SOLID_NAME[k]}</b>${SOLID_COUNT[k] ? `<br>${SOLID_COUNT[k]!.e} Ecken, ${SOLID_COUNT[k]!.k} Kanten, ${SOLID_COUNT[k]!.f} Flächen` : k === 'zylinder' ? '<br>2 Kreise und ein gebogener Mantel' : '<br>1 Spitze, 1 Kreis als Grundfläche'}</figcaption></figure>`).join('')}</div>
    <p>Ein <b>Netz</b> ist der Körper aufgeklappt und flach hingelegt. Ein Würfelnetz besteht aus 6 Quadraten. Es gibt genau 11 verschiedene Würfelnetze, zum Beispiel:${netSVG([[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]])}</p>
    <p>Das <b>Volumen</b> sagt, wie viel in einen Körper hineinpasst. Beim Quader: ${M('V = a · b · c')}, gemessen in cm³ (so viele 1-cm-Würfel passen hinein). 1 dm³ = 1 Liter.</p>
    <p>Die <b>Oberfläche</b> sind alle Außenflächen zusammen. Beim Quader: ${M('O = 2 · (a · b + a · c + b · c)')}, beim Würfel ${M('O = 6 · a · a')}.</p>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>Würfel und Quader: 8 Ecken, 12 Kanten, 6 Flächen.</li><li>Im Netz liegen sich zwei Felder gegenüber, wenn in einer Reihe genau eins dazwischen ist.</li><li>Volumen in cm³, Oberfläche in cm².</li></ol></div>`,
  gen(level) {
    if (level === 1) return Math.random() < 0.7 ? countTask() : quaderTask('V', true);
    if (level === 2) return pick([netPickTask, oppositeTask, countTask, () => quaderTask('O', true)])();
    return Math.random() < 0.25 ? oppositeTask() : quaderTask(pick(['V', 'O']), Math.random() < 0.2);
  },
  text: level => genFrom(() => {
    if (level === 4) {
      const a = R(3, 8) * 10, b = R(2, 5) * 10, c = R(2, 5) * 10;
      return wordTask({
        prompt: `Ein Aquarium ist ${a} cm lang, ${b} cm breit und ${c} cm hoch. Wie viele Liter Wasser passen hinein? (1 Liter = 1000 cm³)${solidSVG('quader', [a, b, c], [`${a} cm`, `${b} cm`, `${c} cm`])}`,
        steps: [
          { title: 'Grundfläche', ask: 'Wie groß ist die Grundfläche (Länge mal Breite)?', calc: `${a} · ${b}`, unit: 'cm²' },
          { title: 'Volumen', ask: 'Wie groß ist das Volumen?', calc: `${a * b} · ${c}`, wrong: [`${a * b} + ${c}`], why: 'Volumen: Grundfläche mal Höhe.', unit: 'cm³' },
          { title: 'In Liter', ask: 'Wie viele Liter sind das?', calc: `${a * b * c} : 1000`, wrong: [`${a * b * c} : 100`], why: '1 Liter sind 1000 cm³.', unit: 'l' },
        ],
        unit: 'l', sentence: v => `In das Aquarium passen ${v} Wasser.`,
      });
    }
    const a = R(2, 6), n = R(2, 6), dose = pick([24, 48, 50, 60, 96]);
    if ((6 * a * a * n) % dose) return null;
    return wordTask({
      prompt: `Mia bemalt ${n} Holzwürfel mit der Kantenlänge ${a} cm rundherum. Eine Dose Farbe reicht für ${dose} cm². Wie viele Dosen braucht sie?${solidSVG('wuerfel', [a], [`${a} cm`])}`,
      steps: [
        { title: 'Eine Fläche', ask: 'Wie groß ist eine Fläche eines Würfels?', calc: `${a} · ${a}`, unit: 'cm²' },
        { title: 'Ein Würfel', ask: 'Wie groß ist die ganze Oberfläche eines Würfels?', calc: `6 · ${a * a}`, wrong: [`4 · ${a * a}`], why: 'Ein Würfel hat 6 Flächen.', unit: 'cm²' },
        { title: 'Alle Würfel', ask: `Wie viel Fläche haben alle ${n} Würfel zusammen?`, calc: `${n} · ${6 * a * a}`, unit: 'cm²' },
        { title: 'Dosen', ask: 'Wie viele Dosen braucht Mia?', calc: `${6 * a * a * n} : ${dose}`, wrong: [`${6 * a * a * n} · ${dose}`], why: 'So oft passt eine Dose in die Fläche: geteilt.', unit: 'Dosen' },
      ],
      unit: 'Dosen', sentence: v => `Mia braucht ${v}.`,
    });
  }, t => t.guide.every(s => s.answer.sign() > 0 && s.answer.terminating())),
};

/* ---------- Koordinatensystem ---------- */
function coordSVG(min: number, max: number, pts: GridPoint[], poly = false): string {
  const n = max - min, s = 300 / n, X = (x: number) => (x - min) * s, Y = (y: number) => (max - y) * s;
  let g = '';
  for (let k = 0; k <= n; k++) {
    const v = min + k;
    g += `<line class="${v === 0 ? 'ax' : 'gl'}" x1="${X(v)}" y1="0" x2="${X(v)}" y2="300" /><line class="${v === 0 ? 'ax' : 'gl'}" x1="0" y1="${Y(v)}" x2="300" y2="${Y(v)}" />`;
    if (v !== 0 || min === 0) g += `<text class="tk" x="${X(v)}" y="${Math.min(300, Y(0)) + 16}" text-anchor="middle">${String(v).replace('-', '−')}</text>`;
    if (v !== 0) g += `<text class="tk" x="${Math.max(0, X(0)) - 7}" y="${Y(v) + 4}" text-anchor="end">${String(v).replace('-', '−')}</text>`;
  }
  if (poly) g += `<polygon class="poly" points="${pts.map(p => `${X(p.x)},${Y(p.y)}`).join(' ')}" />`;
  g += pts.map(p => `<g class="pt given"><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5" /><text x="${X(p.x) + 8}" y="${Y(p.y) - 8}">${p.label}</text></g>`).join('');
  return `<svg class="coord" viewBox="-26 -12 340 338" role="img" aria-label="Koordinatensystem mit ${pts.map(p => `${p.label}(${p.x}|${p.y})`).join(', ')}">${g}</svg>`;
}
function pointTask(x: number, y: number, w: Extract<Widget, { kind: 'point' }>, prompt: string, guide: GuideStep[], why: string): Task {
  const v = encodePoint(x, y);
  return { prompt, answer: q(v), widget: w, guide, placeholder: 'Punkt', plain: prompt.replace(/<[^>]+>/g, ''),
    sol: list([{ rule: 'Punkt finden', lines: [why, `Erst ${x} nach ${x < 0 ? 'links' : 'rechts'} (x), dann ${y} nach ${y < 0 ? 'unten' : 'oben'} (y).`] }], q(v), `${w.label}${pointH(x, y)}`),
    diag: a => { const [ax, ay] = decodePoint(Number(a.n)); return ax === y && ay === x && x !== y ? 'Du hast x und y <b>vertauscht</b>. Die erste Zahl (x) geht nach rechts, die zweite (y) nach oben.' : ax === x ? 'Die x-Koordinate stimmt. Prüfe noch, wie weit nach oben (y).' : ay === y ? 'Die y-Koordinate stimmt. Prüfe noch, wie weit nach rechts (x).' : 'Fang bei (0|0) an: erst nach rechts zählen (x), dann nach oben (y).'; } };
}
const xy = (x: number, y: number): GuideStep[] => [
  { title: 'Nach rechts (x)', ask: '<p>Die erste Zahl sagt, wie weit nach rechts. Wie weit gehst du nach rechts?</p>', answer: q(x), hint: 'Die x-Koordinate steht vorne.', explain: `x = ${x}` },
  { title: 'Nach oben (y)', ask: '<p>Die zweite Zahl sagt, wie weit nach oben. Wie weit gehst du nach oben?</p>', answer: q(y), hint: 'Die y-Koordinate steht hinten.', explain: `y = ${y}. Jetzt setz den Punkt!` },
];
function koordGen(level: number): Task | null {
  return genFrom(() => {
    if (level === 1) {
      const x = R(0, 8), y = R(0, 8);
      if (Math.random() < 0.35) {
        const which = pick(['x', 'y'] as const);
        return { prompt: `Welche <b>${which}-Koordinate</b> hat der Punkt A?${coordSVG(0, 8, [{ x, y, label: 'A' }])}`, answer: q(which === 'x' ? x : y), placeholder: `${which} = …`,
          sol: list([{ rule: 'Ablesen', lines: [`Von A senkrecht nach unten: x = ${x}. Waagerecht nach links: y = ${y}.`, `A${pointH(x, y)}`] }], q(which === 'x' ? x : y)),
          diag: v => (v.eq(q(which === 'x' ? y : x)) && x !== y ? `Das ist die ${which === 'x' ? 'y' : 'x'}-Koordinate. x ist nach rechts, y nach oben.` : null) };
      }
      return pointTask(x, y, { kind: 'point', min: 0, max: 8, pts: [], label: 'P' }, `Setze den Punkt ${M(`P${pointH(x, y)}`)} ins Koordinatensystem.`, xy(x, y), `P${pointH(x, y)}`);
    }
    if (level === 2) {
      const x1 = R(0, 4), x2 = R(x1 + 2, 8), y1 = R(0, 4), y2 = R(y1 + 2, 8), sq = Math.random() < 0.3;
      const X2 = sq ? x1 + (y2 - y1) : x2;
      if (X2 > 8) return null;
      const pts = [{ x: x1, y: y1, label: 'A' }, { x: X2, y: y1, label: 'B' }, { x: X2, y: y2, label: 'C' }];
      return pointTask(x1, y2, { kind: 'point', min: 0, max: 8, pts, label: 'D', poly: true },
        `A, B und C sind drei Ecken eines ${sq ? 'Quadrats' : 'Rechtecks'}. Setze die vierte Ecke D.`,
        [{ title: 'x von D', ask: '<p>D liegt genau über A. Welche x-Koordinate hat D?</p>', answer: q(x1), hint: 'Gleiche x-Koordinate wie A.', explain: `x = ${x1}` },
         { title: 'y von D', ask: '<p>D liegt auf derselben Höhe wie C. Welche y-Koordinate hat D?</p>', answer: q(y2), hint: 'Gleiche y-Koordinate wie C.', explain: `y = ${y2}. Jetzt setz D!` }], `D${pointH(x1, y2)}`);
    }
    if (Math.random() < 0.35) {
      const x1 = R(-5, 1), x2 = R(x1 + 2, 5), y1 = R(-5, 1), y2 = R(y1 + 2, 5);
      const t = exprTask(`(${x2} − ${x1 < 0 ? `(−${-x1})` : x1}) · (${y2} − ${y1 < 0 ? `(−${-y1})` : y1})`, { placeholder: 'Antwort in Kästchen' });
      t.prompt = `Das Rechteck hat die Ecken ${M(`A${pointH(x1, y1)}`)}, ${M(`B${pointH(x2, y1)}`)}, ${M(`C${pointH(x2, y2)}`)} und ${M(`D${pointH(x1, y2)}`)}. Wie viele Kästchen ist es groß (Flächeninhalt)?${coordSVG(-5, 5, [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y1, label: 'B' }, { x: x2, y: y2, label: 'C' }, { x: x1, y: y2, label: 'D' }], true)}`;
      return { ...t, guide: [{ title: 'Breite', ask: `<p>Wie viele Kästchen ist es von A nach B?</p><div class="math big">${x2} − ${String(x1).replace('-', '(−') + (x1 < 0 ? ')' : '')} = ?</div>`, answer: q(x2 - x1), hint: 'Zähle die Kästchen oder rechne x von B minus x von A.', explain: `${x2 - x1} Kästchen breit` }, { title: 'Höhe', ask: '<p>Wie viele Kästchen ist es von B nach C?</p>', answer: q(y2 - y1), hint: 'y von C minus y von B.', explain: `${y2 - y1} Kästchen hoch` }, { title: 'Fläche', ask: `<div class="math big">${x2 - x1} · ${y2 - y1} = ?</div>`, answer: q((x2 - x1) * (y2 - y1)), hint: 'Breite mal Höhe.', explain: `${(x2 - x1) * (y2 - y1)} Kästchen` }] };
    }
    const x = R(-5, 5), y = R(-5, 5);
    if (!x || !y) return null;
    if (Math.random() < 0.5) return pointTask(x, y, { kind: 'point', min: -5, max: 5, pts: [], label: 'P' }, `Setze den Punkt ${M(`P${pointH(x, y)}`)}. Negative Zahlen gehen nach links oder unten.`, xy(Math.abs(x), Math.abs(y)).map((g, i) => ({ ...g, ask: `<p>${i ? `Wie viele Kästchen nach ${y < 0 ? 'unten' : 'oben'}?` : `Wie viele Kästchen nach ${x < 0 ? 'links' : 'rechts'}?`}</p>` })), `P${pointH(x, y)}`);
    const axis = pick(['x', 'y'] as const), mx = axis === 'y' ? -x : x, my = axis === 'x' ? -y : y;
    return pointTask(mx, my, { kind: 'point', min: -5, max: 5, pts: [{ x, y, label: 'P' }], label: "P'" }, `Spiegle den Punkt ${M(`P${pointH(x, y)}`)} an der <b>${axis}-Achse</b>. Setze den Bildpunkt P'.`,
      [{ title: 'Was bleibt gleich?', ask: `<p>Beim Spiegeln an der ${axis}-Achse bleibt die ${axis}-Koordinate gleich. Welche ${axis}-Koordinate hat P'?</p>`, answer: q(axis === 'x' ? x : y), hint: `Die ${axis}-Achse ist die Spiegelachse, entlang ihr ändert sich nichts.`, explain: `${axis} = ${axis === 'x' ? x : y}` },
       { title: 'Was dreht sich um?', ask: `<p>Die andere Koordinate bekommt das umgekehrte Vorzeichen. Welche ${axis === 'x' ? 'y' : 'x'}-Koordinate hat P'?</p>`, answer: q(axis === 'x' ? -y : -x), hint: 'Aus plus wird minus, aus minus wird plus.', explain: `P'${pointH(mx, my)}`.replace(/&#8239;/g, ' ') }], `P'${pointH(mx, my)}`);
  }, () => true);
}
const KOORD: Topic = {
  id: 'koord', klasse: 5, title: 'Koordinatensystem', short: 'Punkte ablesen und eintragen, Figuren zeichnen und spiegeln, zum Antippen.',
  exampleSol: () => { const t = koordGen(2)!; return { prompt: t.prompt + coordSVG(0, 8, (t.widget as Extract<Widget, { kind: 'point' }>).pts, true), sol: t.sol }; },
  theory: `
    <p>Im <b>Koordinatensystem</b> beschreiben zwei Zahlen genau, wo ein Punkt liegt. ${M(`A${pointH(3, 2)}`)} heißt: Starte bei (0|0), geh <b>3 nach rechts</b> und dann <b>2 nach oben</b>.${coordSVG(0, 6, [{ x: 3, y: 2, label: 'A' }])}</p>
    <p>Die erste Zahl ist die <b>x-Koordinate</b> (nach rechts, waagerechte Achse). Die zweite ist die <b>y-Koordinate</b> (nach oben, senkrechte Achse). Merkspruch: <b>Erst gehen, dann steigen.</b></p>
    <p>Mit negativen Zahlen geht das Koordinatensystem auch nach <b>links</b> und nach <b>unten</b>: ${M(`B${pointH(-2, -3)}`)} liegt 2 links und 3 unten.</p>
    <p>Spiegelst du einen Punkt an der <b>y-Achse</b>, ändert sich nur das Vorzeichen von x. An der <b>x-Achse</b> ändert sich nur das Vorzeichen von y.</p>
    <div class="merke"><span class="merke-l">Merke</span><ol><li>(x|y): erst nach rechts, dann nach oben.</li><li>Negative Zahlen: nach links oder unten.</li><li>Nicht vertauschen!</li></ol></div>`,
  gen: koordGen,
  text: level => genFrom(() => {
    if (level === 4) {
      const x = R(0, 4), y = R(0, 4), dx = R(1, 4), dy = R(1, 4);
      const t = pointTask(x + dx, y + dy, { kind: 'point', min: 0, max: 8, pts: [{ x, y, label: 'S' }], label: 'Schatz' }, `Schatzkarte: Starte bei der Palme ${M(`S${pointH(x, y)}`)}. Geh ${dx} Schritte nach rechts und ${dy} Schritte nach oben. Dort liegt der Schatz. Markiere ihn!`,
        [{ title: 'Neues x', ask: `<p>Du startest bei x = ${x} und gehst ${dx} nach rechts. Bei welchem x bist du dann?</p><div class="math big">${x} + ${dx} = ?</div>`, answer: q(x + dx), hint: 'Nach rechts: x wird größer.', explain: `x = ${x + dx}` },
         { title: 'Neues y', ask: `<p>Du startest bei y = ${y} und gehst ${dy} nach oben. Bei welchem y bist du dann?</p><div class="math big">${y} + ${dy} = ?</div>`, answer: q(y + dy), hint: 'Nach oben: y wird größer.', explain: `y = ${y + dy}. Jetzt markiere den Schatz!` }], `Schatz${pointH(x + dx, y + dy)}`);
      return { ...t, word: true };
    }
    const x = R(1, 3), y = R(1, 3), a = R(3, 5), b = R(2, 4), c = R(1, a - 1), d = R(1, 3);
    if (x + a > 8 || y + b + d > 8) return null;
    const ex = x + a - c, ey = y + b + d;
    const t = pointTask(ex, ey, { kind: 'point', min: 0, max: 8, pts: [{ x, y, label: 'R' }], label: 'Ziel' }, `Ein Roboter startet bei ${M(`R${pointH(x, y)}`)}. Er fährt ${a} nach rechts, ${b} nach oben, ${c} nach links und noch ${d} nach oben. Wo kommt er an? Markiere das Ziel.`,
      [{ title: 'x am Ende', ask: `<p>Rechts heißt plus, links heißt minus. Wo ist x am Ende?</p><div class="math big">${x} + ${a} − ${c} = ?</div>`, answer: q(ex), hint: 'Nur die Schritte nach rechts und links ändern x.', explain: `x = ${ex}` },
       { title: 'y am Ende', ask: `<p>Wo ist y am Ende?</p><div class="math big">${y} + ${b} + ${d} = ?</div>`, answer: q(ey), hint: 'Nur oben und unten ändern y.', explain: `y = ${ey}. Jetzt markiere das Ziel!` }], `Ziel${pointH(ex, ey)}`);
    return { ...t, word: true };
  }, () => true),
};

export const GEO_TOPICS: Topic[] = [WINKEL, SYM, KOERPER, KOORD];
