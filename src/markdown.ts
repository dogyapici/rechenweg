const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Sehr kleiner Markdown-Renderer für KI-Antworten. Escaped zuerst alles, erlaubt dann nur fett und Listen. */
export function md(t: string): string {
  const inl = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<b>$1</b>');
  return esc(t).split(/\n{2,}/).map(b => {
    const ls = b.split('\n').filter(l => l.trim());
    if (!ls.length) return '';
    if (ls.every(l => /^\s*[-*•]\s+/.test(l))) return '<ul>' + ls.map(l => `<li>${inl(l.replace(/^\s*[-*•]\s+/, ''))}</li>`).join('') + '</ul>';
    if (ls.every(l => /^\s*\d+[.)]\s+/.test(l))) return '<ol>' + ls.map(l => `<li>${inl(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('') + '</ol>';
    return `<p>${ls.map(l => inl(l.replace(/^#+\s*/, ''))).join('<br>')}</p>`;
  }).join('');
}
