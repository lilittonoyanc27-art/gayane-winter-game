import type { ClothId } from '../components/Gayane';
import type { Weather } from '../components/Snow';
import { p, type Level, type P } from '../core/types';

export interface Cloth {
  id: ClothId;
  name: P;
  putOn: P;
  takeOff: P;
  slot?: 'top' | 'bottom' | 'outer' | 'feet';
}

export const CLOTHES: Cloth[] = [
  { id: 'abrigo', name: p('el abrigo', 'վերարկու'), putOn: p('Me pongo el abrigo.', 'Հագնում եմ վերարկուն։'), takeOff: p('Me quito el abrigo.', 'Հանում եմ վերարկուն։'), slot: 'outer' },
  { id: 'chaqueta', name: p('la chaqueta', 'բաճկոն'), putOn: p('Me pongo la chaqueta.', 'Հագնում եմ բաճկոնը։'), takeOff: p('Me quito la chaqueta.', 'Հանում եմ բաճկոնը։'), slot: 'outer' },
  { id: 'jersey', name: p('el jersey', 'սվիտեր'), putOn: p('Me pongo el jersey.', 'Հագնում եմ սվիտերը։'), takeOff: p('Me quito el jersey.', 'Հանում եմ սվիտերը։'), slot: 'top' },
  { id: 'camiseta', name: p('la camiseta', 'շապիկ'), putOn: p('Me pongo la camiseta.', 'Հագնում եմ շապիկը։'), takeOff: p('Me quito la camiseta.', 'Հանում եմ շապիկը։'), slot: 'top' },
  { id: 'vestido', name: p('el vestido', 'զգեստ'), putOn: p('Me pongo el vestido.', 'Հագնում եմ զգեստը։'), takeOff: p('Me quito el vestido.', 'Հանում եմ զգեստը։') },
  { id: 'falda', name: p('la falda', 'կիսաշրջազգեստ'), putOn: p('Me pongo la falda.', 'Հագնում եմ կիսաշրջազգեստը։'), takeOff: p('Me quito la falda.', 'Հանում եմ կիսաշրջազգեստը։'), slot: 'bottom' },
  { id: 'pantalones', name: p('los pantalones', 'տաբատ'), putOn: p('Me pongo los pantalones.', 'Հագնում եմ տաբատը։'), takeOff: p('Me quito los pantalones.', 'Հանում եմ տաբատը։'), slot: 'bottom' },
  { id: 'calcetines', name: p('los calcetines', 'գուլպաներ'), putOn: p('Me pongo los calcetines.', 'Հագնում եմ գուլպաները։'), takeOff: p('Me quito los calcetines.', 'Հանում եմ գուլպաները։') },
  { id: 'botas', name: p('las botas', 'երկարաճիտ կոշիկներ'), putOn: p('Me pongo las botas.', 'Հագնում եմ երկարաճիտ կոշիկները։'), takeOff: p('Me quito las botas.', 'Հանում եմ երկարաճիտ կոշիկները։'), slot: 'feet' },
  { id: 'sandalias', name: p('las sandalias', 'սանդալներ'), putOn: p('Me pongo las sandalias.', 'Հագնում եմ սանդալները։'), takeOff: p('Me quito las sandalias.', 'Հանում եմ սանդալները։'), slot: 'feet' },
  { id: 'bufanda', name: p('la bufanda', 'շարֆ'), putOn: p('Me pongo la bufanda.', 'Կապում եմ շարֆը։'), takeOff: p('Me quito la bufanda.', 'Հանում եմ շարֆը։') },
  { id: 'guantes', name: p('los guantes', 'ձեռնոցներ'), putOn: p('Me pongo los guantes.', 'Հագնում եմ ձեռնոցները։'), takeOff: p('Me quito los guantes.', 'Հանում եմ ձեռնոցները։') },
  { id: 'gorro', name: p('el gorro', 'գլխարկ'), putOn: p('Me pongo el gorro.', 'Դնում եմ գլխարկը։'), takeOff: p('Me quito el gorro.', 'Հանում եմ գլխարկը։') },
  { id: 'gafas', name: p('las gafas de sol', 'արևային ակնոց'), putOn: p('Me pongo las gafas de sol.', 'Դնում եմ արևային ակնոցը։'), takeOff: p('Me quito las gafas de sol.', 'Հանում եմ արևային ակնոցը։') },
];

export const clothById = (id: ClothId) => CLOTHES.find((c) => c.id === id)!;

/** Equip a garment, replacing whatever occupies the same slot. */
export function equip(cur: ClothId[], id: ClothId): ClothId[] {
  if (cur.includes(id)) return cur;
  const c = clothById(id);
  let next = cur.filter((x) => x !== 'pijama');
  if (id === 'vestido') next = next.filter((x) => !['falda', 'pantalones', 'jersey', 'camiseta'].includes(x));
  if (c.slot) {
    next = next.filter((x) => clothById(x)?.slot !== c.slot);
    if (c.slot === 'top' || c.slot === 'bottom') next = next.filter((x) => x !== 'vestido');
  }
  return [...next, id];
}

export type Occasion = 'paseo' | 'cafe' | 'amiga' | 'montana' | 'cita';

export const WEATHER_P: Record<Weather, P> = {
  soleado: p('Hace sol, pero hace fresco.', 'Արևոտ է, բայց զով է։'),
  frio: p('Hace mucho frío.', 'Շատ ցուրտ է։'),
  nevando: p('Está nevando.', 'Ձյուն է գալիս։'),
  ventoso: p('Hace mucho viento.', 'Շատ քամի է։'),
};

export const OCCASION: Record<Occasion, { icon: string; name: P }> = {
  paseo: { icon: '🌲', name: p('un paseo', 'զբոսանք') },
  cafe: { icon: '☕', name: p('el café', 'սրճարան') },
  amiga: { icon: '👭', name: p('una amiga', 'ընկերուհի') },
  montana: { icon: '🏔️', name: p('la montaña', 'լեռներ') },
  cita: { icon: '💗', name: p('una cita', 'ժամադրություն') },
};

export interface WTask {
  id: string;
  level: Level;
  weather: Weather;
  occasion: Occasion;
  prompt: P;
}

export const W_TASKS: WTask[] = [
  { id: 'w1', level: 'A1', weather: 'nevando', occasion: 'paseo', prompt: p('Hoy está nevando. Vístete para salir.', 'Այսօր ձյուն է գալիս։ Հագնվիր դուրս գալու համար։') },
  { id: 'w2', level: 'A1', weather: 'soleado', occasion: 'cafe', prompt: p('Hoy hace sol, pero hace fresco. Voy al café.', 'Այսօր արևոտ է, բայց զով է։ Գնում եմ սրճարան։') },
  { id: 'w3', level: 'A1', weather: 'frio', occasion: 'amiga', prompt: p('Hace mucho frío. Voy a casa de mi amiga.', 'Շատ ցուրտ է։ Գնում եմ ընկերուհուս տուն։') },
  { id: 'w4', level: 'A2', weather: 'ventoso', occasion: 'paseo', prompt: p('Hace mucho viento y quiero pasear por el parque.', 'Շատ քամի է, և ուզում եմ զբոսնել այգում։') },
  { id: 'w5', level: 'A2', weather: 'nevando', occasion: 'montana', prompt: p('Este fin de semana vamos a la montaña y está nevando.', 'Այս հանգստյան օրերին գնում ենք լեռներ, և ձյուն է գալիս։') },
  { id: 'w6', level: 'A2', weather: 'frio', occasion: 'cita', prompt: p('Esta noche tengo una cita, pero hace frío.', 'Այս երեկո ժամադրություն ունեմ, բայց ցուրտ է։') },
  { id: 'w7', level: 'B1', weather: 'soleado', occasion: 'montana', prompt: p('Hoy hace sol y vamos de excursión a la montaña. Tengo que protegerme del sol y caminar mucho.', 'Այսօր արևոտ է, և արշավի ենք գնում լեռներ։ Պետք է պաշտպանվեմ արևից և շատ քայլեմ։') },
  { id: 'w8', level: 'B1', weather: 'ventoso', occasion: 'cita', prompt: p('Tengo una cita en un restaurante, pero dicen que va a hacer mucho viento.', 'Ժամադրություն ունեմ ռեստորանում, բայց ասում են, որ շատ քամի է լինելու։') },
  { id: 'w9', level: 'B2', weather: 'nevando', occasion: 'cita', prompt: p('Aunque esté nevando, quiero ir elegante a mi cita. Eso sí, no quiero pasar frío.', 'Թեև ձյուն է գալիս, ուզում եմ էլեգանտ գնալ ժամադրության։ Բայց չեմ ուզում մրսել։') },
  { id: 'w10', level: 'B2', weather: 'frio', occasion: 'cafe', prompt: p('Si hace tanto frío como ayer, me abrigaré bien antes de ir a la cafetería con mis compañeras.', 'Եթե երեկվա պես ցուրտ լինի, լավ տաք կհագնվեմ՝ նախքան գործընկերուհիներիս հետ սրճարան գնալը։') },
];

/** Returns the list of problems (empty array = perfect outfit). */
export function checkOutfit(wear: ClothId[], t: WTask): P[] {
  const w = new Set(wear);
  const out: P[] = [];
  const dress = w.has('vestido');
  const skirtish = dress || w.has('falda');
  const cold = t.weather !== 'soleado';

  if (!dress && !w.has('jersey') && !w.has('camiseta'))
    out.push(p('Te falta algo arriba: un jersey, una camiseta o un vestido.', 'Վերևում ինչ-որ բան պակասում է՝ սվիտեր, շապիկ կամ զգեստ։'));
  if (!dress && !w.has('falda') && !w.has('pantalones'))
    out.push(p('Te falta la parte de abajo: una falda o unos pantalones.', 'Ներքևի մասը պակասում է՝ կիսաշրջազգեստ կամ տաբատ։'));
  if (!w.has('botas') && !w.has('sandalias')) out.push(p('¡No puedes salir descalza! Ponte unos zapatos.', 'Չես կարող ոտաբոբիկ դուրս գալ։ Կոշիկ հագիր։'));
  if (w.has('sandalias')) out.push(p('Es invierno: con sandalias vas a tener los pies helados.', 'Ձմեռ է. սանդալներով ոտքերդ կսառչեն։'));

  if (t.weather === 'nevando') {
    if (!w.has('abrigo'))
      out.push(
        w.has('chaqueta')
          ? p('Está nevando: la chaqueta no es suficiente, necesitas un abrigo.', 'Ձյուն է գալիս. բաճկոնը բավարար չէ, քեզ վերարկու է պետք։')
          : p('Está nevando: ponte un abrigo calentito.', 'Ձյուն է գալիս. տաք վերարկու հագիր։'),
      );
    if (!w.has('botas') && !w.has('sandalias')) {
      /* already reported */
    } else if (!w.has('botas')) out.push(p('Con tanta nieve necesitas botas.', 'Այսքան ձյան մեջ քեզ երկարաճիտ կոշիկներ են պետք։'));
    if (!w.has('gorro')) out.push(p('Te falta el gorro: la cabeza también tiene frío.', 'Գլխարկը պակասում է. գլուխն էլ է մրսում։'));
    if (!w.has('guantes')) out.push(p('Sin guantes, vas a tener las manos frías.', 'Առանց ձեռնոցների ձեռքերդ կմրսեն։'));
    if (!w.has('bufanda')) out.push(p('No olvides la bufanda.', 'Շարֆը մի մոռացիր։'));
  }
  if (t.weather === 'frio') {
    if (!w.has('abrigo') && !w.has('chaqueta')) out.push(p('Hace frío: ponte un abrigo o una chaqueta.', 'Ցուրտ է. վերարկու կամ բաճկոն հագիր։'));
    if (!w.has('bufanda')) out.push(p('Hace mucho frío: no olvides la bufanda.', 'Շատ ցուրտ է. շարֆը մի մոռացիր։'));
    if (!w.has('guantes')) out.push(p('Con este frío, necesitas guantes.', 'Այս ցրտին քեզ ձեռնոցներ են պետք։'));
  }
  if (t.weather === 'ventoso') {
    if (!w.has('abrigo') && !w.has('chaqueta')) out.push(p('Hace viento: necesitas una chaqueta o un abrigo.', 'Քամի է. քեզ բաճկոն կամ վերարկու է պետք։'));
    if (!w.has('bufanda')) out.push(p('Con este viento, una bufanda te protege el cuello.', 'Այս քամուն շարֆը կպաշտպանի վիզդ։'));
  }
  if (t.weather === 'soleado') {
    if (!w.has('jersey') && !w.has('chaqueta') && !w.has('abrigo'))
      out.push(p('Hace sol, pero es invierno: ponte un jersey o una chaqueta.', 'Արևոտ է, բայց ձմեռ է. սվիտեր կամ բաճկոն հագիր։'));
  }
  if (cold && skirtish && !w.has('calcetines'))
    out.push(p('Con falda y este tiempo, necesitas calcetines largos.', 'Կիսաշրջազգեստով և այս եղանակին քեզ երկար գուլպաներ են պետք։'));

  if (t.occasion === 'cita' && !skirtish) out.push(p('Es una cita especial: ponte un vestido o una falda bonita.', 'Սա հատուկ ժամադրություն է. հագիր զգեստ կամ գեղեցիկ կիսաշրջազգեստ։'));
  if (t.occasion === 'montana') {
    if (!w.has('pantalones')) out.push(p('Para la montaña, los pantalones son más cómodos.', 'Լեռների համար տաբատն ավելի հարմար է։'));
    if (!w.has('botas') && !w.has('sandalias')) {
      /* reported */
    } else if (!w.has('botas') && t.weather !== 'nevando') out.push(p('Para caminar por la montaña necesitas botas.', 'Լեռներում քայլելու համար քեզ երկարաճիտ կոշիկներ են պետք։'));
    if (t.weather === 'soleado' && !w.has('gafas')) out.push(p('En la montaña con sol, necesitas gafas de sol.', 'Արևոտ լեռներում քեզ արևային ակնոց է պետք։'));
  }
  return out;
}
