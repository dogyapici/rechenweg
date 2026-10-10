import { MathError, Q } from './q.js';
import { OPS, qH } from './format.js';

/** Syntaxbaum eines Terms. Ein Knoten wird beim Ausrechnen an Ort und Stelle durch eine Zahl ersetzt. */
export type Op = '+' | '-' | '*' | ':';
export interface Node {
  t: 'num' | 'x' | 'bin' | 'neg';
  v?: Q;
  dec?: boolean;
  frac?: boolean;
  paren?: boolean;
  op?: Op;
  l?: Node;
  r?: Node;
  e?: Node;
  imp?: boolean;
}
export type Token =
  | { t: 'num'; s: string; dec: boolean }
  | { t: 'op'; v: '+' | '-' | '*' | ':' | '/' }
  | { t: '(' }
  | { t: ')' }
  | { t: 'x' }
  | { t: '=' };

export function tokenize(s: string): Token[] {
  const t: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      let dec = false;
      if ((s[j] === ',' || s[j] === '.') && /[0-9]/.test(s[j + 1] || '')) {
        dec = true;
        j++;
        while (j < s.length && /[0-9]/.test(s[j])) j++;
      }
      t.push({ t: 'num', s: s.slice(i, j), dec });
      i = j;
      continue;
    }
    if (c === '+') t.push({ t: 'op', v: '+' });
    else if ('-−–'.includes(c)) t.push({ t: 'op', v: '-' });
    else if ('*·×⋅'.includes(c)) t.push({ t: 'op', v: '*' });
    else if (':÷'.includes(c)) t.push({ t: 'op', v: ':' });
    else if (c === '/') t.push({ t: 'op', v: '/' });
    else if ('(['.includes(c)) t.push({ t: '(' });
    else if (')]'.includes(c)) t.push({ t: ')' });
    else if (c === 'x' || c === 'X') t.push({ t: 'x' });
    else if (c === '=') t.push({ t: '=' });
    else throw new MathError(`Das Zeichen „${c}“ kenne ich nicht. Erlaubt sind Zahlen, + − · : / ( ) und x.`);
    i++;
  }
  return t;
}

export function decToQ(str: string): Q {
  const [a, b = ''] = str.replace(',', '.').split('.');
  return new Q(BigInt(a + b), 10n ** BigInt(b.length));
}

/** Rekursiver Abstieg: Punkt vor Strich steckt in der Grammatik. a/b zwischen zwei ganzen Zahlen ist ein Bruch. */
export function parse(tokens: Token[]): Node {
  let p = 0;
  const peek = (): Token | undefined => tokens[p];
  const eat = (): Token | undefined => tokens[p++];
  const isOp = (k: Token | undefined, ...ops: string[]): boolean => !!k && k.t === 'op' && ops.includes(k.v);

  function expr(): Node {
    let n = term();
    while (isOp(peek(), '+', '-')) {
      const op = (eat() as { v: Op }).v;
      n = { t: 'bin', op, l: n, r: term() };
    }
    return n;
  }
  function term(): Node {
    let n = unary();
    for (;;) {
      const k = peek();
      if (isOp(k, '*', ':', '/')) {
        eat();
        const v = (k as { v: string }).v;
        n = { t: 'bin', op: v === '/' ? ':' : (v as Op), l: n, r: unary() };
      } else if (k && (k.t === 'x' || k.t === '(')) {
        n = { t: 'bin', op: '*', l: n, r: unary(), imp: true };
      } else break;
    }
    return n;
  }
  function unary(): Node {
    const k = peek();
    if (isOp(k, '-')) {
      eat();
      const e = unary();
      if (e.t === 'num' && !e.paren) return { ...e, v: e.v!.neg() };
      return { t: 'neg', e };
    }
    if (isOp(k, '+')) {
      eat();
      return unary();
    }
    return primary();
  }
  function primary(): Node {
    const k = eat();
    if (!k) throw new MathError('Da fehlt noch etwas am Ende.');
    if (k.t === 'num') {
      const n1 = tokens[p + 1];
      if (!k.dec && isOp(peek(), '/') && n1 && n1.t === 'num' && !n1.dec) {
        eat();
        eat();
        if (BigInt(n1.s) === 0n) throw new MathError('Ein Bruch mit Nenner 0 ist nicht erlaubt.');
        return { t: 'num', v: new Q(BigInt(k.s), BigInt(n1.s)), frac: true };
      }
      return k.dec ? { t: 'num', v: decToQ(k.s), dec: true } : { t: 'num', v: new Q(BigInt(k.s)) };
    }
    if (k.t === 'x') return { t: 'x' };
    if (k.t === '(') {
      const e = expr();
      if (!peek() || peek()!.t !== ')') throw new MathError('Eine Klammer wurde nicht geschlossen.');
      eat();
      e.paren = true;
      return e;
    }
    if (k.t === ')') throw new MathError('Da ist eine Klammer zu viel.');
    throw new MathError('Die Aufgabe ist unvollständig. Prüfe, ob zwischen zwei Rechenzeichen eine Zahl fehlt.');
  }

  const n = expr();
  if (p < tokens.length)
    throw new MathError(tokens[p].t === ')' ? 'Da ist eine Klammer zu viel.' : 'Die Aufgabe kann ich so nicht lesen. Prüfe die Rechenzeichen.');
  return n;
}

export const hasX = (n: Node): boolean => n.t === 'x' || (!!n.l && hasX(n.l)) || (!!n.r && hasX(n.r)) || (!!n.e && hasX(n.e));
export const anyDec = (n: Node): boolean => !!n.dec || (!!n.l && anyDec(n.l)) || (!!n.r && anyDec(n.r)) || (!!n.e && anyDec(n.e));

/** Term als HTML. `hl` wird gelb markiert (der Teil, der als Nächstes gerechnet wird). */
export function rH(n: Node, hl: Node | null = null, dec = false): string {
  let s: string;
  if (n.t === 'num') s = qH(n.v!, dec && n.dec !== false);
  else if (n.t === 'x') s = '<i>x</i>';
  else if (n.t === 'neg') {
    const inner = rH(n.e!, hl, dec);
    s = '−' + (n.e!.t === 'num' && n.e!.v!.sign() < 0 ? `(${inner})` : inner);
  } else {
    const L = rH(n.l!, hl, dec);
    let R = rH(n.r!, hl, dec);
    if (n.r!.t === 'num' && n.r!.v!.sign() < 0 && !n.r!.paren) R = `(${R})`;
    s = n.imp ? L + R : `${L} ${OPS[n.op!]} ${R}`;
  }
  if (n.paren) s = `(${s})`;
  if (n === hl) s = `<mark>${s}</mark>`;
  return s;
}
