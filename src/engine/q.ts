/** Exakte rationale Zahl (Bruch) auf Basis von BigInt. Keine Rundungsfehler. */
export class MathError extends Error {}

export const abs = (x: bigint): bigint => (x < 0n ? -x : x);
export const gcd = (a: bigint, b: bigint): bigint => {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1n;
};
export const lcm = (a: bigint, b: bigint): bigint => abs(a * b) / gcd(a, b);

const DIV_ZERO = 'Durch 0 kann man nicht teilen. Das ist in der Mathematik nicht erlaubt.';

export class Q {
  readonly n: bigint;
  readonly d: bigint;

  /** Speichert den Bruch so, wie er ist (ungekürzt), damit der Rechenweg das Kürzen zeigen kann. */
  constructor(n: bigint | number, d: bigint | number = 1n) {
    let N = BigInt(n);
    let D = BigInt(d);
    if (D === 0n) throw new MathError(DIV_ZERO);
    if (D < 0n) {
      N = -N;
      D = -D;
    }
    this.n = N;
    this.d = D;
  }
  red(): Q {
    const g = gcd(this.n, this.d);
    return new Q(this.n / g, this.d / g);
  }
  isRed(): boolean { return gcd(this.n, this.d) === 1n; }
  isInt(): boolean { return this.n % this.d === 0n; }
  isZero(): boolean { return this.n === 0n; }
  sign(): -1 | 0 | 1 { return this.n > 0n ? 1 : this.n < 0n ? -1 : 0; }
  add(o: Q): Q { return new Q(this.n * o.d + o.n * this.d, this.d * o.d).red(); }
  sub(o: Q): Q { return new Q(this.n * o.d - o.n * this.d, this.d * o.d).red(); }
  mul(o: Q): Q { return new Q(this.n * o.n, this.d * o.d).red(); }
  div(o: Q): Q {
    if (o.n === 0n) throw new MathError(DIV_ZERO);
    return new Q(this.n * o.d, this.d * o.n).red();
  }
  neg(): Q { return new Q(-this.n, this.d); }
  eq(o: Q): boolean { return this.n * o.d === o.n * this.d; }
  lt(o: Q): boolean { return this.n * o.d < o.n * this.d; }
  /** Lässt sich der Bruch als endliche Dezimalzahl schreiben? (Nenner nur aus 2 und 5) */
  terminating(): boolean {
    let d = this.red().d;
    while (d % 2n === 0n) d /= 2n;
    while (d % 5n === 0n) d /= 5n;
    return d === 1n;
  }
  /** Dezimalschreibweise mit deutschem Komma, z. B. "6,25". */
  toDec(): string {
    const r = this.red();
    let p = 1n;
    let k = 0;
    while (p % r.d !== 0n) {
      p *= 10n;
      k++;
      if (k > 40) return this.approx();
    }
    const v = r.n * (p / r.d);
    const s = v < 0n ? '-' : '';
    const digits = abs(v).toString().padStart(k + 1, '0');
    return k === 0 ? s + digits : s + digits.slice(0, digits.length - k) + ',' + digits.slice(-k);
  }
  approx(max = 3): string {
    return (Number(this.n) / Number(this.d)).toLocaleString('de-DE', { maximumFractionDigits: max });
  }
  txt(): string { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`; }
}

export const q = (n: bigint | number, d: bigint | number = 1): Q => new Q(n, d);
/** Anzahl der Nachkommastellen der Dezimalschreibweise. */
export const dp = (x: Q): number => {
  const s = x.toDec();
  const i = s.indexOf(',');
  return i < 0 ? 0 : s.length - i - 1;
};
