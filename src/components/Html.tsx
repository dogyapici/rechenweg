import { useEffect, useRef, type ElementType, type Ref } from 'react';
import { wireSolids } from '../solid';

/**
 * Zeigt HTML, das die Recheneinheit oder die Theorie-Texte der App erzeugt haben.
 * Niemals Nutzereingaben oder KI-Text ungefiltert hier hineingeben (KI-Text geht durch `md()`).
 * Körper (svg[data-solid]) darin werden drehbar.
 */
export function Html({ html, as: Tag = 'div', className, ref }: { html: string; as?: ElementType; className?: string; ref?: Ref<HTMLDivElement> }) {
  const own = useRef<HTMLDivElement | null>(null);
  useEffect(() => (own.current && html.includes('data-solid') ? wireSolids(own.current) : undefined), [html]);
  const setRef = (el: HTMLDivElement | null) => {
    own.current = el;
    if (typeof ref === 'function') ref(el); else if (ref) (ref as { current: HTMLDivElement | null }).current = el;
  };
  return <Tag className={className} ref={setRef} dangerouslySetInnerHTML={{ __html: html }} />;
}
