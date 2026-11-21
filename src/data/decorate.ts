import { p, type Level, type P } from '../core/types';

export interface Furn {
  id: string;
  x: number; // left %
  y: number; // top %
  w: number;
  h: number;
  surf: number; // y of the surface where things can rest
  es: string; // "la mesa"
  hyGen: string; // genitive: "սեղանի"
  wall?: boolean;
}

export const FURN: Furn[] = [
  { id: 'ventana', x: 30, y: 8, w: 22, h: 28, surf: 8, es: 'la ventana', hyGen: 'պատուհանի', wall: true },
  { id: 'cama', x: 2, y: 50, w: 28, h: 30, surf: 61, es: 'la cama', hyGen: 'մահճակալի' },
  { id: 'mesa', x: 40, y: 60, w: 14, h: 20, surf: 60, es: 'la mesa', hyGen: 'սեղանի' },
  { id: 'sofa', x: 56, y: 52, w: 20, h: 28, surf: 66, es: 'el sofá', hyGen: 'բազմոցի' },
  { id: 'estanteria', x: 82, y: 16, w: 13, h: 64, surf: 16, es: 'la estantería', hyGen: 'գրադարակի' },
];

export interface Decor {
  id: string;
  w: number;
  h: number;
  name: P; // "la lámpara"
  hyDef: string; // "Լամպը"
  plural?: boolean;
  flat?: boolean; // rug: always lowest
  level?: Level;
}

export const DECOR: Decor[] = [
  { id: 'lampara', w: 5, h: 15, name: p('la lámpara', 'լամպ'), hyDef: 'Լամպը' },
  { id: 'cojines', w: 8, h: 8, name: p('los cojines', 'բարձիկներ'), hyDef: 'Բարձիկները', plural: true },
  { id: 'libros', w: 6, h: 8, name: p('los libros', 'գրքեր'), hyDef: 'Գրքերը', plural: true },
  { id: 'flores', w: 5, h: 11, name: p('las flores', 'ծաղիկներ'), hyDef: 'Ծաղիկները', plural: true },
  { id: 'alfombra', w: 24, h: 6, name: p('la alfombra', 'գորգ'), hyDef: 'Գորգը', flat: true },
  { id: 'arbol', w: 9, h: 34, name: p('el árbol de Navidad', 'տոնածառ'), hyDef: 'Տոնածառը' },
  { id: 'manta', w: 13, h: 7, name: p('la manta', 'վերմակ'), hyDef: 'Վերմակը' },
  { id: 'velas', w: 5, h: 8, name: p('las velas', 'մոմեր'), hyDef: 'Մոմերը', plural: true },
  { id: 'luces', w: 20, h: 5, name: p('las luces', 'լույսեր'), hyDef: 'Լույսերը', plural: true },
  { id: 'regalo', w: 6, h: 7, name: p('el regalo', 'նվեր'), hyDef: 'Նվերը' },
  { id: 'osito', w: 5, h: 9, name: p('el osito', 'արջուկ'), hyDef: 'Արջուկը' },
];

export const decorById = (id: string) => DECOR.find((d) => d.id === id)!;

export type Rel = 'encima' | 'debajo' | 'al_lado' | 'delante' | 'detras' | 'entre';

export const REL: Record<Rel, { es: string; hy: string }> = {
  encima: { es: 'encima de', hy: 'վրա' },
  debajo: { es: 'debajo de', hy: 'տակ' },
  al_lado: { es: 'al lado de', hy: 'կողքին' },
  delante: { es: 'delante de', hy: 'առջևում' },
  detras: { es: 'detrás de', hy: 'հետևում' },
  entre: { es: 'entre', hy: 'միջև' },
};

export interface Cond {
  item: string;
  rel: Rel;
  ref: string;
  ref2?: string;
}

export interface DTask {
  id: string;
  level: Level;
  instr: P;
  conds: Cond[];
  setup?: { id: string; x: number; y: number }[];
}

export const D_TASKS: DTask[] = [
  { id: 'd1', level: 'A1', instr: p('Pon la lámpara encima de la mesa.', 'Լամպը դիր սեղանի վրա։'), conds: [{ item: 'lampara', rel: 'encima', ref: 'mesa' }] },
  { id: 'd2', level: 'A1', instr: p('Pon los cojines sobre la cama.', 'Բարձիկները դիր մահճակալի վրա։'), conds: [{ item: 'cojines', rel: 'encima', ref: 'cama' }] },
  { id: 'd3', level: 'A1', instr: p('Pon los libros debajo de la mesa.', 'Գրքերը դիր սեղանի տակ։'), conds: [{ item: 'libros', rel: 'debajo', ref: 'mesa' }] },
  { id: 'd4', level: 'A1', instr: p('Pon las flores encima de la estantería.', 'Ծաղիկները դիր գրադարակի վրա։'), conds: [{ item: 'flores', rel: 'encima', ref: 'estanteria' }] },
  { id: 'd5', level: 'A2', instr: p('Coloca la alfombra delante del sofá.', 'Գորգը փռիր բազմոցի առջև։'), conds: [{ item: 'alfombra', rel: 'delante', ref: 'sofa' }] },
  { id: 'd6', level: 'A2', instr: p('Pon el árbol de Navidad al lado de la estantería.', 'Տոնածառը դիր գրադարակի կողքին։'), conds: [{ item: 'arbol', rel: 'al_lado', ref: 'estanteria' }] },
  { id: 'd7', level: 'A2', instr: p('Deja la manta sobre el sofá.', 'Վերմակը թող բազմոցի վրա։'), conds: [{ item: 'manta', rel: 'encima', ref: 'sofa' }] },
  { id: 'd8', level: 'A2', instr: p('Coloca las velas al lado de la lámpara.', 'Մոմերը դիր լամպի կողքին։'), conds: [{ item: 'velas', rel: 'al_lado', ref: 'lampara' }], setup: [{ id: 'lampara', x: 45, y: 60 }] },
  { id: 'd9', level: 'B1', instr: p('Pon el árbol de Navidad entre la cama y la mesa.', 'Տոնածառը դիր մահճակալի և սեղանի միջև։'), conds: [{ item: 'arbol', rel: 'entre', ref: 'cama', ref2: 'mesa' }] },
  { id: 'd10', level: 'B1', instr: p('Esconde el osito detrás del sofá.', 'Արջուկը թաքցրու բազմոցի հետևում։'), conds: [{ item: 'osito', rel: 'detras', ref: 'sofa' }] },
  { id: 'd11', level: 'B1', instr: p('Pon el regalo debajo del árbol.', 'Նվերը դիր տոնածառի տակ։'), conds: [{ item: 'regalo', rel: 'debajo', ref: 'arbol' }], setup: [{ id: 'arbol', x: 35, y: 80 }] },
  { id: 'd12', level: 'B1', instr: p('Coloca las velas encima de la mesa y las flores al lado de las velas.', 'Մոմերը դիր սեղանի վրա, իսկ ծաղիկները՝ մոմերի կողքին։'), conds: [{ item: 'velas', rel: 'encima', ref: 'mesa' }, { item: 'flores', rel: 'al_lado', ref: 'velas' }] },
  { id: 'd13', level: 'B2', instr: p('Me encantaría que colgaras las luces encima de la ventana.', 'Շատ կուզեի, որ լույսերը կախեիր պատուհանի վերևում։'), conds: [{ item: 'luces', rel: 'encima', ref: 'ventana' }] },
  { id: 'd14', level: 'B2', instr: p('Antes de que lleguen mis amigas, coloca la alfombra delante del sofá y pon los cojines encima de él.', 'Մինչ ընկերուհիներս կգան, գորգը փռիր բազմոցի առջև, իսկ բարձիկները դիր դրա վրա։'), conds: [{ item: 'alfombra', rel: 'delante', ref: 'sofa' }, { item: 'cojines', rel: 'encima', ref: 'sofa' }] },
  { id: 'd15', level: 'B2', instr: p('Quiero que el árbol quede entre el sofá y la estantería, con el regalo justo debajo.', 'Ուզում եմ, որ տոնածառը լինի բազմոցի և գրադարակի միջև, իսկ նվերը՝ հենց դրա տակ։'), conds: [{ item: 'arbol', rel: 'entre', ref: 'sofa', ref2: 'estanteria' }, { item: 'regalo', rel: 'debajo', ref: 'arbol' }] },
];

/* ---------------- geometry ---------------- */
export interface Placed {
  id: string;
  x: number; // center %
  y: number; // bottom %
}

interface Box {
  cx: number;
  l: number;
  r: number;
  t: number;
  b: number;
  surf: number;
  wall?: boolean;
  isItem?: boolean;
}

function furnBox(f: Furn): Box {
  return { cx: f.x + f.w / 2, l: f.x, r: f.x + f.w, t: f.y, b: f.y + f.h, surf: f.surf, wall: f.wall };
}
function itemBox(pl: Placed): Box {
  const d = decorById(pl.id);
  return { cx: pl.x, l: pl.x - d.w / 2, r: pl.x + d.w / 2, t: pl.y - d.h, b: pl.y, surf: pl.y - d.h, isItem: true };
}

export function refBox(id: string, placed: Placed[]): Box | null {
  const f = FURN.find((x) => x.id === id);
  if (f) return furnBox(f);
  const it = placed.find((x) => x.id === id);
  return it ? itemBox(it) : null;
}

const within = (a: Box, R: Box, pad = 0) => a.cx > R.l - pad && a.cx < R.r + pad;

export function relHolds(rel: Rel, a: Box, R: Box, R2?: Box | null): boolean {
  switch (rel) {
    case 'encima':
      if (R.isItem) return within(a, R) && Math.abs(a.b - R.t) <= 5;
      return within(a, R) && Math.abs(a.b - R.surf) <= 6;
    case 'debajo':
      if (R.isItem) return within(a, R, 2) && a.b >= R.b - 5 && a.b <= R.b + 8;
      if (R.wall) return within(a, R) && a.t >= R.b - 3;
      return within(a, R) && a.b > R.surf + 6 && a.b <= R.b + 4 && a.t > R.surf - 2;
    case 'delante':
      return within(a, R, 4) && a.b > R.b + 1 && a.b <= R.b + 22;
    case 'detras':
      return within(a, R) && a.b < R.b - 1 && a.b >= R.b - 15 && Math.abs(a.b - R.surf) > 5;
    case 'al_lado': {
      const gap = Math.max(a.l - R.r, R.l - a.r);
      const sameLevel = Math.abs(a.b - R.b) < (R.isItem ? 6 : 10);
      return sameLevel && gap > -3 && gap < 9 && !within(a, R, -2);
    }
    case 'entre': {
      if (!R2) return false;
      const [L, Rt] = R.cx < R2.cx ? [R, R2] : [R2, R];
      const avg = (L.b + Rt.b) / 2;
      return a.cx > L.r - 3 && a.cx < Rt.l + 3 && Math.abs(a.b - avg) < 12;
    }
  }
}

export function condHolds(c: Cond, placed: Placed[]): boolean {
  const it = placed.find((x) => x.id === c.item);
  if (!it) return false;
  const R = refBox(c.ref, placed);
  if (!R) return false;
  return relHolds(c.rel, itemBox(it), R, c.ref2 ? refBox(c.ref2, placed) : null);
}

/** Phrase pieces for a reference: "de la mesa" / "del sofá". */
export function refEs(id: string): string {
  const f = FURN.find((x) => x.id === id);
  return f ? f.es : decorById(id).name.es;
}
export function refHyGen(id: string): string {
  const f = FURN.find((x) => x.id === id);
  if (f) return f.hyGen;
  const map: Record<string, string> = { lampara: 'լամպի', arbol: 'տոնածառի', velas: 'մոմերի', flores: 'ծաղիկների', libros: 'գրքերի', regalo: 'նվերի', cojines: 'բարձիկների', manta: 'վերմակի', alfombra: 'գորգի', luces: 'լույսերի', osito: 'արջուկի' };
  return map[id];
}
const deArt = (es: string) => ('de ' + es).replace(/^de el /, 'del ');

/** Sentence describing where an item is relative to a reference. */
export function describe(itemId: string, rel: Rel | null, ref: string, ref2?: string): P {
  const d = decorById(itemId);
  const verb = d.plural ? 'están' : 'está';
  const hyVerb = d.plural ? 'են' : 'է';
  const subj = d.name.es.charAt(0).toUpperCase() + d.name.es.slice(1);
  if (!rel) return p(`${subj} ${verb} lejos ${deArt(refEs(ref))}.`, `${d.hyDef} ${refHyGen(ref)} մոտ չէ։`);
  if (rel === 'entre') return p(`${subj} ${verb} entre ${refEs(ref)} y ${refEs(ref2!)}.`, `${d.hyDef} ${refHyGen(ref)} և ${refHyGen(ref2!)} միջև ${hyVerb}։`);
  return p(`${subj} ${verb} ${REL[rel].es.replace(/ de$/, '')} ${deArt(refEs(ref))}.`, `${d.hyDef} ${refHyGen(ref)} ${REL[rel].hy} ${hyVerb}։`);
}

/** Which relation does item currently have with ref? */
export function currentRel(itemId: string, ref: string, placed: Placed[], ref2?: string): Rel | null {
  const it = placed.find((x) => x.id === itemId);
  const R = refBox(ref, placed);
  if (!it || !R) return null;
  const a = itemBox(it);
  const R2 = ref2 ? refBox(ref2, placed) : null;
  const order: Rel[] = ['entre', 'encima', 'debajo', 'delante', 'detras', 'al_lado'];
  for (const r of order) if (relHolds(r, a, R, R2)) return r;
  return null;
}

/** z-index so that items sit naturally in depth. */
export function zFor(pl: Placed): number {
  const d = decorById(pl.id);
  if (d.flat) return 5;
  const a = itemBox(pl);
  for (const f of FURN) {
    const R = furnBox(f);
    if (!f.wall && within(a, R) && Math.abs(a.b - R.surf) <= 6) return Math.round(R.b * 10) + 5;
  }
  return Math.round(a.b * 10);
}
export const furnZ = (f: Furn) => (f.wall ? 1 : Math.round((f.y + f.h) * 10));
