/* ===== Körper in 3D: als SVG gezeichnet, mit dem Finger drehbar ===== */
export type SolidKind = 'wuerfel' | 'quader' | 'pyramide' | 'prisma' | 'zylinder' | 'kegel';
type V3 = [number, number, number];
interface Mesh { v: V3[]; f: { i: number[]; smooth?: boolean }[]; labels: { a: number; b: number; text: string }[] }

export const SOLID_NAME: Record<SolidKind, string> = { wuerfel: 'Würfel', quader: 'Quader', pyramide: 'Pyramide', prisma: 'Prisma', zylinder: 'Zylinder', kegel: 'Kegel' };
/** Ecken, Kanten, Flächen der eckigen Körper */
export const SOLID_COUNT: Partial<Record<SolidKind, { e: number; k: number; f: number }>> = {
  wuerfel: { e: 8, k: 12, f: 6 }, quader: { e: 8, k: 12, f: 6 }, pyramide: { e: 5, k: 8, f: 5 }, prisma: { e: 6, k: 9, f: 5 },
};

function mesh(kind: SolidKind, d: number[], lab: string[]): Mesh {
  const [a, b, c] = kind === 'wuerfel' ? [d[0], d[0], d[0]] : [d[0] ?? 3, d[1] ?? 2, d[2] ?? 2];
  if (kind === 'wuerfel' || kind === 'quader') {
    const x = a / 2, z = b / 2, y = c / 2;
    const v: V3[] = [[-x, -y, z], [x, -y, z], [x, -y, -z], [-x, -y, -z], [-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]];
    const f = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]].map(i => ({ i }));
    return { v, f, labels: [{ a: 0, b: 1, text: lab[0] }, { a: 1, b: 2, text: lab[1] }, { a: 1, b: 5, text: lab[2] }].filter(l => l.text) };
  }
  if (kind === 'pyramide') {
    const x = a / 2, z = a / 2, y = c / 2;
    const v: V3[] = [[-x, -y, z], [x, -y, z], [x, -y, -z], [-x, -y, -z], [0, y, 0]];
    return { v, f: [[0, 1, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]].map(i => ({ i })), labels: [{ a: 0, b: 1, text: lab[0] }].filter(l => l.text) };
  }
  if (kind === 'prisma') {
    const x = a / 2, z = b / 2, y = c * 0.45;
    const v: V3[] = [[-x, -y, z], [x, -y, z], [0, y, z], [-x, -y, -z], [x, -y, -z], [0, y, -z]];
    return { v, f: [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]].map(i => ({ i })), labels: [] };
  }
  // Zylinder und Kegel als Vielecke mit glatter Mantelfläche
  const n = 28, r = a / 2, y = c / 2, v: V3[] = [];
  for (let k = 0; k < n; k++) { const t = (2 * Math.PI * k) / n; v.push([r * Math.cos(t), -y, r * Math.sin(t)]); }
  const bottom = { i: v.map((_, k) => k) };
  if (kind === 'kegel') {
    v.push([0, y, 0]);
    return { v, f: [bottom, ...Array.from({ length: n }, (_, k) => ({ i: [k, (k + 1) % n, n], smooth: true }))], labels: [] };
  }
  for (let k = 0; k < n; k++) { const t = (2 * Math.PI * k) / n; v.push([r * Math.cos(t), y, r * Math.sin(t)]); }
  return { v, f: [bottom, { i: Array.from({ length: n }, (_, k) => n + k) }, ...Array.from({ length: n }, (_, k) => ({ i: [k, (k + 1) % n, n + (k + 1) % n, n + k], smooth: true }))], labels: [] };
}

/** Zeichnet den Körper von einer Blickrichtung aus. Rückseiten gestrichelt, wie im Mathebuch. */
export function renderSolid(kind: SolidKind, d: number[], lab: string[], rx: number, ry: number): string {
  const m = mesh(kind, d, lab);
  const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
  const p = m.v.map(([x, y, z]) => { const x1 = x * cy + z * sy, z1 = -x * sy + z * cy; return [x1, y * cx - z1 * sx, y * sx + z1 * cx] as V3; });
  const size = Math.max(...m.v.map(v => Math.hypot(...v))) || 1;
  const k = 85 / size;
  const P = (v: V3) => `${(v[0] * k).toFixed(1)},${(-v[1] * k).toFixed(1)}`;
  const center = p.reduce((s, v) => [s[0] + v[0] / p.length, s[1] + v[1] / p.length, s[2] + v[2] / p.length] as V3, [0, 0, 0] as V3);
  const faces = m.f.map(f => {
    const pts = f.i.map(i => p[i]);
    const c = pts.reduce((s, v) => [s[0] + v[0] / pts.length, s[1] + v[1] / pts.length, s[2] + v[2] / pts.length] as V3, [0, 0, 0] as V3);
    // Zeigt die Fläche zum Betrachter? (Richtung von der Körpermitte zur Flächenmitte, z zeigt nach vorn)
    const [u, w] = [pts[1].map((x, j) => x - pts[0][j]), pts[2].map((x, j) => x - pts[0][j])];
    let nz = u[0] * w[1] - u[1] * w[0];
    const nx = u[1] * w[2] - u[2] * w[1], ny = u[2] * w[0] - u[0] * w[2];
    if (nx * (c[0] - center[0]) + ny * (c[1] - center[1]) + nz * (c[2] - center[2]) < 0) nz = -nz;
    return { f, pts, front: nz > 1e-9, depth: c[2] };
  });
  const back = faces.filter(x => !x.front && !x.f.smooth).map(x => `<polygon class="bk" points="${x.pts.map(P).join(' ')}" />`).join('');
  const front = faces.filter(x => x.front).sort((a, b) => a.depth - b.depth).map(x => `<polygon class="${x.f.smooth ? 'fr sm' : 'fr'}" points="${x.pts.map(P).join(' ')}" />`).join('');
  const labels = m.labels.map(l => {
    const a = p[l.a], b = p[l.b], mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const dx = mid[0] - center[0], dy = mid[1] - center[1], len = Math.hypot(dx, dy) || 1;
    const x = mid[0] * k + (dx / len) * 24, y = -mid[1] * k - (dy / len) * 24;
    return `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle">${l.text}</text>`;
  }).join('');
  return back + front + labels;
}

/** SVG-Text für Theorie und Aufgaben. Die Seite macht es drehbar (siehe wireSolids). */
export function solidSVG(kind: SolidKind, d: number[] = [], lab: string[] = [], rx = -0.45, ry = 0.6): string {
  const label = `${SOLID_NAME[kind]}, zum Drehen ziehen`;
  return `<span class="solid-wrap"><svg class="solid" viewBox="-115 -110 230 220" role="img" aria-label="${label}" data-solid="${kind}" data-d="${d.join(',')}" data-l="${lab.join('|')}" data-rx="${rx}" data-ry="${ry}">${renderSolid(kind, d, lab, rx, ry)}</svg><small class="solid-hint">↔ zum Drehen ziehen</small></span>`;
}

/** Macht alle Körper in einem Bereich drehbar. Gibt eine Aufräum-Funktion zurück. */
export function wireSolids(root: HTMLElement): () => void {
  const offs: (() => void)[] = [];
  root.querySelectorAll<SVGSVGElement>('svg[data-solid]').forEach(svg => {
    const kind = svg.dataset.solid as SolidKind;
    const d = (svg.dataset.d || '').split(',').filter(Boolean).map(Number);
    const lab = (svg.dataset.l || '').split('|');
    let rx = Number(svg.dataset.rx), ry = Number(svg.dataset.ry), start: [number, number, number, number] | null = null;
    const draw = () => { svg.innerHTML = renderSolid(kind, d, lab, rx, ry); };
    const down = (e: PointerEvent) => { start = [e.clientX, e.clientY, rx, ry]; svg.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!start) return;
      ry = start[3] + (e.clientX - start[0]) / 70;
      rx = Math.max(-1.5, Math.min(1.5, start[2] - (e.clientY - start[1]) / 70));
      draw();
    };
    const up = () => { start = null; };
    const key = (e: KeyboardEvent) => {
      const step = 0.15;
      if (e.key === 'ArrowLeft') ry -= step; else if (e.key === 'ArrowRight') ry += step; else if (e.key === 'ArrowUp') rx = Math.max(-1.5, rx - step); else if (e.key === 'ArrowDown') rx = Math.min(1.5, rx + step); else return;
      e.preventDefault(); draw();
    };
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('pointerdown', down); svg.addEventListener('pointermove', move); svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up); svg.addEventListener('keydown', key);
    offs.push(() => { svg.removeEventListener('pointerdown', down); svg.removeEventListener('pointermove', move); svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', up); svg.removeEventListener('keydown', key); });
  });
  return () => offs.forEach(f => f());
}
