import type { P } from './types';

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
export const sample = <T,>(arr: T[], n: number) => shuffle(arr).slice(0, n);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/* ---------------- numbers ---------------- */
const ES_U = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const ES_T = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
export function numEs(n: number, fem = false): string {
  let s: string;
  if (n < 30) s = ES_U[n];
  else if (n < 100) s = ES_T[Math.floor(n / 10)] + (n % 10 ? ' y ' + ES_U[n % 10] : '');
  else s = String(n);
  if (!fem) s = s.replace(/uno$/, 'un').replace(/veintiun$/, 'veintiún');
  else s = s.replace(/uno$/, 'una').replace(/veintiuna$/, 'veintiuna');
  return s;
}
const HY_U = ['զրո', 'մեկ', 'երկու', 'երեք', 'չորս', 'հինգ', 'վեց', 'յոթ', 'ութ', 'ինը'];
const HY_T = ['', 'տասն', 'քսան', 'երեսուն', 'քառասուն', 'հիսուն', 'վաթսուն', 'յոթանասուն', 'ութսուն', 'իննսուն'];
export function numHy(n: number): string {
  if (n < 10) return HY_U[n];
  if (n === 10) return 'տաս';
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return t === 1 ? 'տաս' : HY_T[t];
    return HY_T[t] + HY_U[u];
  }
  return String(n);
}

/** 12.5 → "doce euros con cincuenta" */
export function priceP(v: number): P {
  const cents = Math.round(v * 100);
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  const esE = e === 1 ? 'un euro' : `${numEs(e)} euros`;
  const hyE = `${numHy(e)} եվրո`;
  if (!c) return { es: esE, hy: hyE };
  if (!e) return { es: `${numEs(c)} céntimos`, hy: `${numHy(c)} ցենտ` };
  return { es: `${esE} con ${numEs(c)}`, hy: `${hyE} ${numHy(c)} ցենտ` };
}

export const fmtEuro = (v: number) => v.toFixed(2).replace('.', ',') + ' €';
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
