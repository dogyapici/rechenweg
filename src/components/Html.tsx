import type { ElementType, Ref } from 'react';

/**
 * Zeigt HTML, das die Recheneinheit oder die Theorie-Texte der App erzeugt haben.
 * Niemals Nutzereingaben oder KI-Text ungefiltert hier hineingeben (KI-Text geht durch `md()`).
 */
export function Html({ html, as: Tag = 'div', className, ref }: { html: string; as?: ElementType; className?: string; ref?: Ref<HTMLDivElement> }) {
  return <Tag className={className} ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
