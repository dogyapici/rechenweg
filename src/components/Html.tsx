import type { ElementType } from 'react';

/**
 * Zeigt HTML, das die Recheneinheit oder die Theorie-Texte der App erzeugt haben.
 * Niemals Nutzereingaben oder KI-Text ungefiltert hier hineingeben (KI-Text geht durch `md()`).
 */
export function Html({ html, as: Tag = 'div', className }: { html: string; as?: ElementType; className?: string }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
