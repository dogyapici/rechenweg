import type { Solution } from './solve.js';

/** Rechenweg als HTML. Enthält nur von der Engine erzeugtes Markup (Zahlen, Brüche, feste Texte). */
export function solHTML(sol: Solution): string {
  if (sol.kind === 'expr') {
    let h = '<ol class="steps">';
    sol.steps.forEach((st, i) => {
      h += `<li class="step"><div class="srule"><span class="snum">${i + 1}</span>${st.rule}</div><div class="math big">${st.before}</div>`;
      h += `<div class="calc">${st.lines.map(l => (l.startsWith('<pre') ? l : `<p>${l}</p>`)).join('')}</div>`;
      h += `<div class="math after">= ${st.after}</div></li>`;
    });
    if (!sol.steps.length) h += `<li class="step"><div class="srule"><span class="snum">1</span>Nichts zu rechnen</div><div class="math big">${sol.inputHTML}</div></li>`;
    h += '</ol>';
    h += `<div class="result"><span class="rl">Ergebnis</span><span class="math big">${sol.resultHTML}</span></div>`;
    if (sol.extra.length) h += `<div class="extra">${sol.extra.map(e => `<p>${e}</p>`).join('')}</div>`;
    return h;
  }
  if (sol.kind === 'eq') {
    let h = '<div class="eqrows">';
    sol.rows.forEach((r, i) => {
      const next = sol.rows[i + 1];
      // Wie im Heft: die Umformung steht rechts neben der Zeile, auf die sie angewendet wird.
      const note = next && next.op && next.op.startsWith('|') ? next.op : '';
      h += `<div class="eqrow${i === 0 ? ' first' : ''}"><div class="math big">${r.eq}</div><div class="note">${note}</div></div>`;
      if (i > 0) h += `<p class="expl">${r.expl}</p>`;
      else if (sol.rows.length > 1) h += '<p class="expl">Ziel: <i>x</i> soll ganz allein auf einer Seite stehen.</p>';
    });
    h += '</div>';
    h += `<div class="result"><span class="rl">Lösung</span><span class="math big">${sol.resultHTML}</span></div>`;
    if (sol.probe) h += `<div class="extra"><p>${sol.probe}</p></div>`;
    return h;
  }
  let h = '<ol class="steps">';
  sol.steps.forEach((st, i) => {
    h += `<li class="step"><div class="srule"><span class="snum">${i + 1}</span>${st.rule}</div><div class="calc">${st.lines.map(l => `<p>${l}</p>`).join('')}</div></li>`;
  });
  h += `</ol><div class="result"><span class="rl">Ergebnis</span><span class="math big">${sol.resultHTML}</span></div>`;
  if (sol.extra && sol.extra.length) h += `<div class="extra">${sol.extra.map(e => `<p>${e}</p>`).join('')}</div>`;
  return h;
}

export function hintHTML(sol: Solution): string {
  if (sol.kind === 'expr') {
    const s = sol.steps[0];
    return s ? `<b>${s.rule}:</b> Beginne mit dem markierten Teil.<div class="math big">${s.before}</div>` : 'Schau dir die Zahl genau an.';
  }
  if (sol.kind === 'eq') {
    const r = sol.rows[1];
    return r ? `<b>Erster Schritt:</b> ${r.expl.split('. ')[0]}.` : '';
  }
  const s = sol.steps[0];
  return `<b>${s.rule}:</b> ${s.lines[0]}`;
}

/** Rechenweg als Klartext (für die KI). Funktioniert ohne DOM, damit es auch im Server läuft. */
export function htmlToText(html: string): string {
  return html
    .replace(/<span class="frac"><span class="fn">(.*?)<\/span><span class="fd">(.*?)<\/span><\/span>/g, (_m, n: string, d: string) => `${n.replace(/<[^>]+>/g, '')}/${d.replace(/<[^>]+>/g, '')}`)
    .replace(/<mark>/g, '[').replace(/<\/mark>/g, ']')
    .replace(/<\/(p|li|div|pre)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#8202;/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}
