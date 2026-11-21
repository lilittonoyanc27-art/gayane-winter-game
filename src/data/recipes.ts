import { p, type Level, type P } from '../core/types';

export type CKind = 'olla' | 'taza' | 'bol' | 'bandeja' | 'horno' | 'tostadora' | 'plato' | 'tetera' | 'molde';

export interface CState {
  fill: number; // 0..1
  color: string;
  bits: string[]; // floating pieces
  top: string[]; // decorations on top
  on: boolean; // stove / appliance on
  hot: boolean;
  inside?: string; // a container placed inside (oven)
  baked?: boolean;
  swirl?: boolean;
}

export const emptyC = (): CState => ({ fill: 0, color: '#fff', bits: [], top: [], on: false, hot: false });
export type KState = Record<string, CState>;

export interface Ing {
  id: string;
  icon: string;
  name: P;
  liquid?: boolean;
}

export const INGS: Record<string, Ing> = {
  leche: { id: 'leche', icon: '🥛', name: p('la leche', 'կաթ'), liquid: true },
  agua: { id: 'agua', icon: '💧', name: p('el agua', 'ջուր'), liquid: true },
  chocolate: { id: 'chocolate', icon: '🍫', name: p('el chocolate', 'շոկոլադ') },
  azucar: { id: 'azucar', icon: '🍬', name: p('el azúcar', 'շաքար') },
  sal: { id: 'sal', icon: '🧂', name: p('la sal', 'աղ') },
  nata: { id: 'nata', icon: '🍦', name: p('la nata', 'սերուցք') },
  malvaviscos: { id: 'malvaviscos', icon: '☁️', name: p('los malvaviscos', 'մարշմելոու') },
  canela: { id: 'canela', icon: '🪵', name: p('la canela', 'դարչին') },
  pan: { id: 'pan', icon: '🍞', name: p('el pan', 'հաց') },
  mantequilla: { id: 'mantequilla', icon: '🧈', name: p('la mantequilla', 'կարագ') },
  mermelada: { id: 'mermelada', icon: '🍓', name: p('la mermelada de fresa', 'ելակի ջեմ') },
  te: { id: 'te', icon: '🍵', name: p('la bolsita de té', 'թեյի տոպրակ') },
  limon: { id: 'limon', icon: '🍋', name: p('el limón', 'կիտրոն') },
  miel: { id: 'miel', icon: '🍯', name: p('la miel', 'մեղր') },
  zanahoria: { id: 'zanahoria', icon: '🥕', name: p('la zanahoria', 'գազար') },
  patata: { id: 'patata', icon: '🥔', name: p('la patata', 'կարտոֆիլ') },
  cebolla: { id: 'cebolla', icon: '🧅', name: p('la cebolla', 'սոխ') },
  tomate: { id: 'tomate', icon: '🍅', name: p('el tomate', 'լոլիկ') },
  queso: { id: 'queso', icon: '🧀', name: p('el queso', 'պանիր') },
  harina: { id: 'harina', icon: '🌾', name: p('la harina', 'ալյուր') },
  huevo: { id: 'huevo', icon: '🥚', name: p('el huevo', 'ձու') },
  aceite: { id: 'aceite', icon: '🫒', name: p('el aceite', 'ձեթ'), liquid: true },
  levadura: { id: 'levadura', icon: '📦', name: p('la levadura', 'փխրեցուցիչ') },
  pescado: { id: 'pescado', icon: '🐟', name: p('el pescado', 'ձուկ') },
};

export const CONTAINER_NAMES: Record<CKind, P> = {
  olla: p('la olla', 'կաթսա'),
  taza: p('la taza', 'բաժակ'),
  bol: p('el bol', 'աման'),
  bandeja: p('la bandeja', 'սկուտեղ'),
  horno: p('el horno', 'ջեռոց'),
  tostadora: p('la tostadora', 'տոստեր'),
  plato: p('el plato', 'ափսե'),
  tetera: p('la tetera', 'թեյնիկ'),
  molde: p('los moldes', 'կաղապարներ'),
};

export interface Container {
  id: string;
  kind: CKind;
  stove?: boolean; // sits on a burner that can be switched on
  draggable?: boolean;
}

export type Fx = (s: KState, item?: string) => KState;

export interface Step {
  instr: P;
  type: 'pick' | 'drop' | 'tap' | 'stir';
  ids?: string[]; // pick
  item?: string | string[]; // drop: ingredient id or container id
  target?: string; // drop/tap/stir: container id
  count?: number; // drop: exact amount, confirmed with "Listo"
  fx?: Fx;
  wait?: number; // tap: ms to wait (heating)
  done: P;
}

export interface Recipe {
  id: string;
  level: Level;
  icon: string;
  name: P;
  containers: Container[];
  shelf: string[];
  steps: Step[];
  final: P;
}

/* ---------- effect helpers ---------- */
const up = (s: KState, id: string, patch: Partial<CState> | ((c: CState) => Partial<CState>)): KState => {
  const c = s[id];
  const ptch = typeof patch === 'function' ? patch(c) : patch;
  return { ...s, [id]: { ...c, ...ptch } };
};
const fill = (id: string, level: number, color: string): Fx => (s) => up(s, id, { fill: level, color });
const bit = (id: string, e: string): Fx => (s) => up(s, id, (c) => ({ bits: [...c.bits, e] }));
const top = (id: string, e: string): Fx => (s) => up(s, id, (c) => ({ top: [...c.top, e] }));
const heat = (id: string): Fx => (s) => up(s, id, { hot: true });
const on = (id: string): Fx => (s) => up(s, id, { on: true });
const dissolve = (id: string, color: string): Fx => (s) => up(s, id, { bits: [], color, swirl: false });
const pour = (from: string, to: string, level = 0.75): Fx => (s) => {
  const f = s[from];
  return up(up(s, to, { fill: level, color: f.color, hot: f.hot, bits: [...s[to].bits, ...f.bits] }), from, { fill: 0, bits: [], hot: false, on: false });
};
const moveBits = (from: string, to: string, bits?: string[]): Fx => (s) => up(up(s, to, (c) => ({ bits: bits || [...c.bits, ...s[from].bits] })), from, { bits: [], fill: 0 });
const into = (what: string, oven: string): Fx => (s) => up(s, oven, { inside: what });
const bake = (oven: string, tray: string, from: string, to: string): Fx => (s) =>
  up(up(s, tray, (c) => ({ bits: c.bits.map((b) => (b === from ? to : b)), baked: true, hot: true })), oven, { on: true, hot: true });
const chain = (...f: Fx[]): Fx => (s) => f.reduce((acc, fn) => fn(acc), s);

/* ---------- recipes ---------- */
export const RECIPES: Recipe[] = [
  {
    id: 'chocolate',
    level: 'A1',
    icon: '☕',
    name: p('Chocolate caliente', 'Տաք շոկոլադ'),
    containers: [
      { id: 'olla', kind: 'olla', stove: true, draggable: true },
      { id: 'taza', kind: 'taza' },
    ],
    shelf: ['leche', 'chocolate', 'azucar', 'nata', 'malvaviscos', 'zanahoria', 'queso', 'sal'],
    steps: [
      { type: 'pick', ids: ['leche', 'chocolate', 'azucar', 'malvaviscos'], instr: p('Elige los ingredientes: la leche, el chocolate, el azúcar y los malvaviscos.', 'Ընտրիր բաղադրիչները՝ կաթը, շոկոլադը, շաքարը և մարշմելոուն։'), done: p('¡Ya tengo todos los ingredientes!', 'Արդեն ունեմ բոլոր բաղադրիչները։') },
      { type: 'drop', item: 'leche', target: 'olla', fx: fill('olla', 0.65, '#fbf8f2'), instr: p('Vierte la leche en la olla.', 'Կաթը լցրու կաթսայի մեջ։'), done: p('He vertido la leche.', 'Կաթը լցրել եմ։') },
      { type: 'drop', item: 'chocolate', target: 'olla', fx: bit('olla', '🍫'), instr: p('Añade el chocolate.', 'Ավելացրու շոկոլադը։'), done: p('He añadido el chocolate.', 'Շոկոլադն ավելացրել եմ։') },
      { type: 'drop', item: 'azucar', target: 'olla', count: 2, fx: bit('olla', '✨'), instr: p('Ahora añade dos cucharadas de azúcar.', 'Հիմա ավելացրու երկու գդալ շաքար։'), done: p('Dos cucharadas de azúcar. ¡Perfecto!', 'Երկու գդալ շաքար։ Կատարյալ է։') },
      { type: 'tap', target: 'olla', wait: 2200, fx: on('olla'), instr: p('Enciende el fuego para calentar la mezcla.', 'Միացրու կրակը՝ խառնուրդը տաքացնելու համար։'), done: p('¡La mezcla ya está caliente!', 'Խառնուրդն արդեն տաք է։') },
      { type: 'stir', target: 'olla', fx: dissolve('olla', '#6b3a24'), instr: p('Remueve con una cuchara hasta que el chocolate se derrita.', 'Խառնիր գդալով, մինչև շոկոլադը հալվի։'), done: p('El chocolate se ha derretido.', 'Շոկոլադը հալվել է։') },
      { type: 'drop', item: 'olla', target: 'taza', fx: pour('olla', 'taza'), instr: p('Sirve el chocolate caliente en la taza.', 'Տաք շոկոլադը լցրու բաժակի մեջ։'), done: p('¡Mmm, qué bien huele!', 'Մմմ, ինչ լավ է բուրում։') },
      { type: 'drop', item: 'malvaviscos', target: 'taza', fx: top('taza', '☁️'), count: 3, instr: p('Decóralo con tres malvaviscos.', 'Զարդարիր երեք մարշմելոուով։'), done: p('¡Qué bonito ha quedado!', 'Ինչ գեղեցիկ ստացվեց։') },
    ],
    final: p('¡Qué rico! El chocolate caliente está listo.', 'Ինչ համեղ է։ Տաք շոկոլադը պատրաստ է։'),
  },
  {
    id: 'tostadas',
    level: 'A1',
    icon: '🍞',
    name: p('Tostadas con mermelada', 'Տոստեր ջեմով'),
    containers: [
      { id: 'tostadora', kind: 'tostadora' },
      { id: 'plato', kind: 'plato' },
    ],
    shelf: ['pan', 'mantequilla', 'mermelada', 'leche', 'pescado', 'cebolla', 'miel'],
    steps: [
      { type: 'pick', ids: ['pan', 'mantequilla', 'mermelada'], instr: p('Elige el pan, la mantequilla y la mermelada.', 'Ընտրիր հացը, կարագը և ջեմը։'), done: p('¡Todo listo para el desayuno!', 'Ամեն ինչ պատրաստ է նախաճաշի համար։') },
      { type: 'drop', item: 'pan', target: 'tostadora', count: 2, fx: bit('tostadora', '🍞'), instr: p('Pon dos rebanadas de pan en la tostadora.', 'Երկու կտոր հաց դիր տոստերի մեջ։'), done: p('Dos rebanadas. ¡Muy bien!', 'Երկու կտոր։ Շատ լավ է։') },
      { type: 'tap', target: 'tostadora', wait: 2200, fx: chain(on('tostadora'), heat('tostadora')), instr: p('Enciende la tostadora.', 'Միացրու տոստերը։'), done: p('¡Clic! Las tostadas están listas.', 'Չրխկ։ Տոստերը պատրաստ են։') },
      { type: 'tap', target: 'plato', fx: (s) => moveBits('tostadora', 'plato', ['🍞', '🍞'])({ ...s, tostadora: { ...s.tostadora, on: false } }), instr: p('Pon las tostadas en el plato.', 'Տոստերը դիր ափսեի մեջ։'), done: p('Las tostadas están en el plato.', 'Տոստերն ափսեի մեջ են։') },
      { type: 'drop', item: 'mantequilla', target: 'plato', fx: top('plato', '🧈'), instr: p('Unta mantequilla en las tostadas.', 'Կարագ քսիր տոստերին։'), done: p('Ahora tienen mantequilla.', 'Հիմա կարագ ունեն։') },
      { type: 'drop', item: 'mermelada', target: 'plato', fx: top('plato', '🍓'), instr: p('Añade un poco de mermelada de fresa.', 'Ավելացրու մի քիչ ելակի ջեմ։'), done: p('¡Qué buena pinta!', 'Ինչ ախորժելի տեսք ունի։') },
    ],
    final: p('¡El desayuno está servido!', 'Նախաճաշը մատուցված է։'),
  },
  {
    id: 'te',
    level: 'A2',
    icon: '🍋',
    name: p('Té con limón', 'Կիտրոնով թեյ'),
    containers: [
      { id: 'tetera', kind: 'tetera', stove: true, draggable: true },
      { id: 'taza', kind: 'taza' },
    ],
    shelf: ['agua', 'te', 'limon', 'miel', 'chocolate', 'zanahoria', 'queso', 'leche'],
    steps: [
      { type: 'pick', ids: ['agua', 'te', 'limon', 'miel'], instr: p('Necesitas agua, una bolsita de té, un limón y miel.', 'Քեզ պետք են ջուր, թեյի տոպրակ, կիտրոն և մեղր։'), done: p('Tengo todo lo necesario.', 'Ունեմ ամեն անհրաժեշտ բան։') },
      { type: 'drop', item: 'agua', target: 'tetera', fx: fill('tetera', 0.7, '#dff1fb'), instr: p('Llena la tetera de agua.', 'Թեյնիկը լցրու ջրով։'), done: p('La tetera está llena.', 'Թեյնիկը լիքն է։') },
      { type: 'tap', target: 'tetera', wait: 2400, fx: on('tetera'), instr: p('Pon la tetera al fuego.', 'Թեյնիկը դիր կրակին։'), done: p('¡El agua está hirviendo!', 'Ջուրը եռում է։') },
      { type: 'drop', item: 'te', target: 'taza', fx: bit('taza', '🍵'), instr: p('Pon una bolsita de té en la taza.', 'Թեյի տոպրակը դիր բաժակի մեջ։'), done: p('La bolsita ya está en la taza.', 'Տոպրակն արդեն բաժակի մեջ է։') },
      { type: 'drop', item: 'tetera', target: 'taza', fx: chain(pour('tetera', 'taza'), (s) => up(s, 'taza', { color: '#c9852f', bits: [] })), instr: p('Vierte el agua caliente en la taza.', 'Տաք ջուրը լցրու բաժակի մեջ։'), done: p('El té tiene un color precioso.', 'Թեյը հրաշալի գույն ունի։') },
      { type: 'drop', item: 'limon', target: 'taza', fx: top('taza', '🍋'), instr: p('Añade una rodaja de limón.', 'Ավելացրու մի շերտ կիտրոն։'), done: p('Con limón está más rico.', 'Կիտրոնով ավելի համեղ է։') },
      { type: 'drop', item: 'miel', target: 'taza', count: 1, fx: bit('taza', '🍯'), instr: p('Y solo una cucharadita de miel.', 'Եվ միայն մեկ թեյի գդալ մեղր։'), done: p('Una cucharadita, ni más ni menos.', 'Մեկ թեյի գդալ՝ ոչ ավել, ոչ պակաս։') },
      { type: 'stir', target: 'taza', fx: dissolve('taza', '#d39a3c'), instr: p('Remuévelo un poco para que se disuelva la miel.', 'Մի քիչ խառնիր, որ մեղրը լուծվի։'), done: p('¡Listo para beber!', 'Պատրաստ է խմելու համար։') },
    ],
    final: p('Un té con limón perfecto para un día frío.', 'Կատարյալ կիտրոնով թեյ ցուրտ օրվա համար։'),
  },
  {
    id: 'sopa',
    level: 'A2',
    icon: '🥣',
    name: p('Sopa caliente', 'Տաք ապուր'),
    containers: [
      { id: 'olla', kind: 'olla', stove: true, draggable: true },
      { id: 'plato', kind: 'bol' },
    ],
    shelf: ['agua', 'zanahoria', 'patata', 'cebolla', 'sal', 'chocolate', 'malvaviscos', 'mermelada', 'tomate'],
    steps: [
      { type: 'pick', ids: ['agua', 'zanahoria', 'patata', 'cebolla', 'sal'], instr: p('Para la sopa necesitamos agua, zanahorias, patatas, una cebolla y sal.', 'Ապուրի համար պետք են ջուր, գազար, կարտոֆիլ, մեկ սոխ և աղ։'), done: p('¡Verduras frescas!', 'Թարմ բանջարեղեն։') },
      { type: 'drop', item: 'agua', target: 'olla', fx: fill('olla', 0.7, '#e3f2f7'), instr: p('Echa el agua en la olla.', 'Ջուրը լցրու կաթսայի մեջ։'), done: p('Ya hay agua en la olla.', 'Կաթսայում արդեն ջուր կա։') },
      { type: 'drop', item: 'zanahoria', target: 'olla', count: 2, fx: bit('olla', '🥕'), instr: p('Corta dos zanahorias y échalas a la olla.', 'Կտրատիր երկու գազար և գցիր կաթսայի մեջ։'), done: p('Dos zanahorias.', 'Երկու գազար։') },
      { type: 'drop', item: 'patata', target: 'olla', count: 3, fx: bit('olla', '🥔'), instr: p('Ahora añade tres patatas.', 'Հիմա ավելացրու երեք կարտոֆիլ։'), done: p('Tres patatas. ¡Muy bien!', 'Երեք կարտոֆիլ։ Շատ լավ է։') },
      { type: 'drop', item: 'cebolla', target: 'olla', fx: bit('olla', '🧅'), instr: p('Pon también una cebolla.', 'Դիր նաև մեկ սոխ։'), done: p('La cebolla le da mucho sabor.', 'Սոխը շատ համ է տալիս։') },
      { type: 'drop', item: 'sal', target: 'olla', fx: (s) => s, instr: p('Echa una pizca de sal.', 'Մի պտղունց աղ ավելացրու։'), done: p('Solo un poco de sal.', 'Միայն մի քիչ աղ։') },
      { type: 'tap', target: 'olla', wait: 2400, fx: on('olla'), instr: p('Enciende el fuego y deja que hierva.', 'Միացրու կրակը և թող եռա։'), done: p('¡La sopa está hirviendo!', 'Ապուրը եռում է։') },
      { type: 'stir', target: 'olla', fx: (s) => up(s, 'olla', { color: '#f2c879' }), instr: p('Remueve la sopa de vez en cuando.', 'Ժամանակ առ ժամանակ խառնիր ապուրը։'), done: p('Huele de maravilla.', 'Հրաշալի բուրմունք ունի։') },
      { type: 'drop', item: 'olla', target: 'plato', fx: pour('olla', 'plato', 0.8), instr: p('Sirve la sopa en el plato.', 'Ապուրը լցրու ափսեի մեջ։'), done: p('¡A comer!', 'Սեղան նստենք։') },
    ],
    final: p('Una sopa caliente para entrar en calor.', 'Տաք ապուր՝ տաքանալու համար։'),
  },
  {
    id: 'galletas',
    level: 'B1',
    icon: '🍪',
    name: p('Galletas de chocolate', 'Շոկոլադե թխվածքաբլիթներ'),
    containers: [
      { id: 'bol', kind: 'bol', draggable: true },
      { id: 'bandeja', kind: 'bandeja', draggable: true },
      { id: 'horno', kind: 'horno' },
    ],
    shelf: ['harina', 'mantequilla', 'azucar', 'huevo', 'chocolate', 'zanahoria', 'queso', 'limon', 'pescado'],
    steps: [
      { type: 'pick', ids: ['harina', 'mantequilla', 'azucar', 'huevo', 'chocolate'], instr: p('Saca la harina, la mantequilla, el azúcar, un huevo y el chocolate.', 'Հանիր ալյուրը, կարագը, շաքարը, մեկ ձու և շոկոլադը։'), done: p('Vamos a hacer galletas.', 'Թխվածքաբլիթներ ենք պատրաստելու։') },
      { type: 'drop', item: 'mantequilla', target: 'bol', fx: chain(fill('bol', 0.25, '#fbe7a1'), bit('bol', '🧈')), instr: p('Primero, echa la mantequilla en el bol.', 'Նախ կարագը գցիր ամանի մեջ։'), done: p('La mantequilla está blandita.', 'Կարագը փափուկ է։') },
      { type: 'drop', item: 'azucar', target: 'bol', count: 3, fx: bit('bol', '✨'), instr: p('Añade tres cucharadas de azúcar.', 'Ավելացրու երեք գդալ շաքար։'), done: p('Tres cucharadas exactas.', 'Ճիշտ երեք գդալ։') },
      { type: 'drop', item: 'huevo', target: 'bol', fx: bit('bol', '🥚'), instr: p('Ahora rompe un huevo y añádelo a la mezcla.', 'Հիմա կոտրիր մեկ ձու և ավելացրու խառնուրդին։'), done: p('¡Crac! Huevo añadido.', 'Ճռթ։ Ձուն ավելացված է։') },
      { type: 'drop', item: 'harina', target: 'bol', count: 2, fx: chain(fill('bol', 0.55, '#f6e3c0'), bit('bol', '🌾')), instr: p('Incorpora dos tazas de harina poco a poco.', 'Աստիճանաբար ավելացրու երկու բաժակ ալյուր։'), done: p('La harina está dentro.', 'Ալյուրը ներսում է։') },
      { type: 'stir', target: 'bol', fx: dissolve('bol', '#e9cf9f'), instr: p('Mezcla bien hasta conseguir una masa suave.', 'Լավ խառնիր, մինչև փափուկ խմոր ստացվի։'), done: p('¡Qué masa tan suave!', 'Ինչ փափուկ խմոր է։') },
      { type: 'drop', item: 'chocolate', target: 'bol', fx: bit('bol', '🍫'), instr: p('Añade trocitos de chocolate a la masa.', 'Շոկոլադի կտորներ ավելացրու խմորին։'), done: p('Con chocolate, ¡mucho mejor!', 'Շոկոլադով շատ ավելի լավ է։') },
      { type: 'drop', item: 'bol', target: 'bandeja', fx: moveBits('bol', 'bandeja', ['🟤', '🟤', '🟤', '🟤', '🟤', '🟤']), instr: p('Forma las galletas y colócalas en la bandeja.', 'Ձևավորիր թխվածքաբլիթները և դասավորիր սկուտեղին։'), done: p('Seis galletas en la bandeja.', 'Վեց թխվածքաբլիթ սկուտեղին։') },
      { type: 'drop', item: 'bandeja', target: 'horno', fx: into('bandeja', 'horno'), instr: p('Mete la bandeja en el horno.', 'Սկուտեղը դիր ջեռոցի մեջ։'), done: p('La bandeja está en el horno.', 'Սկուտեղը ջեռոցում է։') },
      { type: 'tap', target: 'horno', wait: 2600, fx: bake('horno', 'bandeja', '🟤', '🍪'), instr: p('Enciende el horno a ciento ochenta grados y espera.', 'Միացրու ջեռոցը հարյուր ութսուն աստիճանի վրա և սպասիր։'), done: p('¡Las galletas ya están doradas!', 'Թխվածքաբլիթներն արդեն ոսկեգույն են։') },
    ],
    final: p('¡Galletas recién hechas! Toda la casa huele a chocolate.', 'Թարմ թխված թխվածքաբլիթներ։ Ամբողջ տունը շոկոլադի բույր ունի։'),
  },
  {
    id: 'magdalenas',
    level: 'B2',
    icon: '🧁',
    name: p('Magdalenas de limón', 'Կիտրոնով մաֆիններ'),
    containers: [
      { id: 'bol', kind: 'bol', draggable: true },
      { id: 'molde', kind: 'molde', draggable: true },
      { id: 'horno', kind: 'horno' },
    ],
    shelf: ['huevo', 'azucar', 'aceite', 'leche', 'harina', 'limon', 'levadura', 'queso', 'tomate', 'pan', 'sal'],
    steps: [
      { type: 'pick', ids: ['huevo', 'azucar', 'aceite', 'leche', 'harina', 'limon', 'levadura'], instr: p('Reúne todo lo que vas a necesitar: huevos, azúcar, aceite, leche, harina, un limón y levadura.', 'Հավաքիր այն ամենը, ինչ քեզ պետք կգա՝ ձու, շաքար, ձեթ, կաթ, ալյուր, մեկ կիտրոն և փխրեցուցիչ։'), done: p('Ya está todo sobre la encimera.', 'Ամեն ինչ արդեն սեղանին է։') },
      { type: 'drop', item: 'huevo', target: 'bol', count: 3, fx: chain(fill('bol', 0.2, '#ffe9a6'), bit('bol', '🥚')), instr: p('Casca tres huevos en el bol, con cuidado de que no caiga ninguna cáscara.', 'Զգուշությամբ երեք ձու կոտրիր ամանի մեջ, որ ոչ մի կեղև չընկնի։'), done: p('Tres huevos, sin cáscaras.', 'Երեք ձու՝ առանց կեղևի։') },
      { type: 'drop', item: 'azucar', target: 'bol', count: 4, fx: bit('bol', '✨'), instr: p('Añade cuatro cucharadas de azúcar.', 'Ավելացրու չորս գդալ շաքար։'), done: p('Cuatro cucharadas.', 'Չորս գդալ։') },
      { type: 'stir', target: 'bol', fx: dissolve('bol', '#fff2c4'), instr: p('Bate los huevos con el azúcar hasta que la mezcla blanquee.', 'Հարիր ձվերը շաքարով, մինչև խառնուրդը սպիտակի։'), done: p('La mezcla está espumosa.', 'Խառնուրդը փրփրուն է։') },
      { type: 'drop', item: 'aceite', target: 'bol', fx: fill('bol', 0.35, '#fff0b8'), instr: p('Vierte un chorrito de aceite sin dejar de remover.', 'Մի քիչ ձեթ լցրու՝ առանց խառնելը դադարեցնելու։'), done: p('Un chorrito de aceite.', 'Մի քիչ ձեթ։') },
      { type: 'drop', item: 'leche', target: 'bol', fx: fill('bol', 0.45, '#fff6d8'), instr: p('Después, incorpora un vaso de leche.', 'Հետո ավելացրու մեկ բաժակ կաթ։'), done: p('La leche ya está dentro.', 'Կաթն արդեն ներսում է։') },
      { type: 'drop', item: 'limon', target: 'bol', fx: bit('bol', '🍋'), instr: p('Ralla la piel de un limón para que las magdalenas tengan más aroma.', 'Քերիր կիտրոնի կեղևը, որ մաֆիններն ավելի բուրավետ լինեն։'), done: p('¡Qué bien huele a limón!', 'Ինչ լավ է կիտրոնի բույր գալիս։') },
      { type: 'drop', item: 'harina', target: 'bol', fx: fill('bol', 0.6, '#f6e3c0'), instr: p('Incorpora la harina tamizada…', 'Ավելացրու մաղած ալյուրը…'), done: p('La harina, hecho.', 'Ալյուրը՝ արված է։') },
      { type: 'drop', item: 'levadura', target: 'bol', fx: (s) => s, instr: p('…junto con el sobre de levadura.', '…փխրեցուցիչի տոպրակի հետ միասին։'), done: p('Sin levadura, no subirían.', 'Առանց փխրեցուցիչի չէին բարձրանա։') },
      { type: 'stir', target: 'bol', fx: dissolve('bol', '#f3d9a4'), instr: p('Mezcla con suavidad para que la masa no pierda aire.', 'Նրբորեն խառնիր, որ խմորը օդը չկորցնի։'), done: p('La masa ha quedado perfecta.', 'Խմորը կատարյալ է ստացվել։') },
      { type: 'drop', item: 'bol', target: 'molde', fx: moveBits('bol', 'molde', ['🟡', '🟡', '🟡', '🟡', '🟡', '🟡']), instr: p('Rellena los moldes solo hasta la mitad, ya que la masa subirá en el horno.', 'Կաղապարները լցրու միայն մինչև կեսը, քանի որ խմորը ջեռոցում կբարձրանա։'), done: p('Seis moldes llenos a medias.', 'Վեց կաղապար՝ կիսով չափ լցված։') },
      { type: 'drop', item: 'molde', target: 'horno', fx: into('molde', 'horno'), instr: p('Mete los moldes en el horno, que ya debería estar precalentado.', 'Կաղապարները դիր ջեռոցի մեջ, որն արդեն պետք է նախապես տաքացված լինի։'), done: p('Ahora, paciencia.', 'Հիմա՝ համբերություն։') },
      { type: 'tap', target: 'horno', wait: 2800, fx: bake('horno', 'molde', '🟡', '🧁'), instr: p('Hornéalas durante veinte minutos y no abras la puerta del horno mientras tanto.', 'Թխիր քսան րոպե և այդ ընթացքում ջեռոցի դուռը մի բացիր։'), done: p('¡Han subido muchísimo!', 'Շատ են բարձրացել։') },
    ],
    final: p('¡Unas magdalenas esponjosas, como las de la abuela!', 'Փափկամազ մաֆիններ՝ տատիկի պատրաստածների պես։'),
  },
];

export const C_LABEL = (c: Container) => CONTAINER_NAMES[c.kind];
