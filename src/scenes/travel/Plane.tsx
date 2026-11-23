import { useEffect, useMemo, useRef, useState } from 'react';
import { Btn, Feedback, Instruction, Reward, SceneHeader, Steps, go, starsFor, type Fb } from '../../components/UI';
import { Stage, type Spot } from '../../components/Stage';
import { Talk, type TNode, type Who } from '../../components/Talk';
import { Person, LOOKS } from '../../components/Person';
import { Gayane } from '../../components/Gayane';
import { Drag, Drop } from '../../components/DnD';
import { Announcement, MissionMenu, Pay, type Mission } from '../../components/Life';
import { T, Phrase } from '../../core/translate';
import { sfx } from '../../core/sound';
import { setTrip, useGame } from '../../core/store';
import { levelOk, p, type P } from '../../core/types';
import { numEs } from '../../core/util';
import { SuitcaseArt, TRAVEL_WEAR } from './Airport';

const MISSIONS: Mission[] = [
  { id: 'asiento', icon: '💺', title: p('Encontrar el asiento', 'Գտնել նստատեղը'), desc: p('Fila, letra, equipaje de mano y sentarse.', 'Շարք, տառ, ձեռքի ուղեբեռ և նստել։') },
  { id: 'comida', icon: '🍽️', title: p('Pedir comida y bebida', 'Պատվիրել ուտելիք և խմիչք'), desc: p('La carta, el carrito y la bandeja.', 'Ճաշացանկը, սայլակը և սկուտեղը։') },
  { id: 'azafata', icon: '💬', title: p('Hablar con la azafata', 'Խոսել ուղեկցորդուհու հետ'), desc: p('Preguntas y peticiones durante el vuelo.', 'Հարցեր և խնդրանքներ թռիչքի ընթացքում։') },
  { id: 'vuelo', icon: '☁️', title: p('Durante el vuelo', 'Թռիչքի ընթացքում'), desc: p('Escucha los avisos de la tripulación y actúa.', 'Լսիր անձնակազմի հայտարարությունները և գործիր։') },
  { id: 'llegada', icon: '🛬', title: p('Llegada al destino', 'Ժամանում'), desc: p('Equipaje, información y un taxi.', 'Ուղեբեռ, տեղեկատվություն և տաքսի։') },
];
const AZ: Who = { name: p('Azafata', 'Ուղեկցորդուհի'), icon: '👩🏼‍✈️' };
type Done = { id: string; onNext: () => void; onAgain: () => void };
const Finish = ({ done, mistakes, msg }: { done: Done; mistakes: number; msg: P }) => <Reward id={done.id} stars={starsFor(mistakes)} message={msg} onAgain={done.onAgain} onNext={done.onNext} />;

export function Plane() {
  const [m, setM] = useState<string | null>(null);
  const [k, setK] = useState(0);
  const done = (id: string, next?: string): Done => ({ id: 'plane:' + id, onNext: () => (setM(next ?? null), setK((x) => x + 1)), onAgain: () => setK((x) => x + 1) });
  const title = m ? MISSIONS.find((x) => x.id === m)!.title : p('Dentro del avión', 'Ինքնաթիռում');
  return (
    <div className="scene scene-plane">
      <SceneHeader title={title} icon="🛫" back="title" right={m ? <button className="hdr-btn" onClick={() => setM(null)}>☰ <T p={p('Misiones', 'Առաքելություններ')} /></button> : undefined} />
      {!m && (
        <MissionMenu game="plane" missions={MISSIONS} onPick={(id) => (setM(id), setK((x) => x + 1))}
          intro={
            <div className="travel-intro">
              <div className="ti-art cabin-art"><CabinWindow /></div>
              <div className="ti-text">
                <Phrase p={p('Vuelo AU 482 de Madrid a Lisboa. Gayane busca su asiento, pide algo de comer, habla con la tripulación y llega a su destino.', 'AU 482 չվերթ Մադրիդից Լիսաբոն։ Գայանեն փնտրում է իր նստատեղը, ուտելու բան է պատվիրում, խոսում է անձնակազմի հետ և հասնում իր նպատակակետին։')} />
              </div>
            </div>
          }
          extra={<div className="row-center"><Btn label={p('Volver al aeropuerto', 'Վերադառնալ օդանավակայան')} icon="✈" variant="soft" onClick={() => go('airport')} /><Btn label={p('Ir a la ciudad', 'Գնալ քաղաք')} icon="🏙️" onClick={() => go('city')} /></div>}
        />
      )}
      {m === 'asiento' && <Asiento key={k} done={done('asiento', 'comida')} />}
      {m === 'comida' && <Comida key={k} done={done('comida', 'azafata')} />}
      {m === 'azafata' && <Azafata key={k} done={done('azafata', 'vuelo')} />}
      {m === 'vuelo' && <Vuelo key={k} done={done('vuelo', 'llegada')} />}
      {m === 'llegada' && <Llegada key={k} done={done('llegada')} />}
    </div>
  );
}

export function CabinWindow({ phase = 'day', shade = false }: { phase?: 'day' | 'sunset' | 'night'; shade?: boolean }) {
  return (
    <div className={'cwin ' + phase}>
      <div className="cwin-sky">
        {Array.from({ length: 6 }, (_, i) => <i key={i} className="cloud" style={{ top: 10 + ((i * 37) % 70) + '%', animationDelay: -i * 3 + 's', animationDuration: 10 + (i % 3) * 4 + 's' }} />)}
        <div className="cwin-wing" />
      </div>
      <div className={'cwin-shade ' + (shade ? 'down' : '')} />
    </div>
  );
}

/* ===================================================================== */
/*  1. ENCONTRAR EL ASIENTO                                               */
/* ===================================================================== */
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
function Asiento({ done }: { done: Done }) {
  const seat = useGame((s) => s.trip.seat) || '18A';
  const row = parseInt(seat, 10);
  const letter = seat.replace(/\d+/g, '');
  const level = useGame((s) => s.level);
  const [step, setStep] = useState(0); // 0 greet · 1 walk · 2 bin · 3 seat · 4 sat
  const [talk, setTalk] = useState(false);
  const [binOpen, setBinOpen] = useState(false);
  const [bagIn, setBagIn] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const occupied = useMemo(() => { const o = new Set<string>(); for (let r = 1; r <= 24; r++) for (const L of LETTERS) if ((r * 7 + L.charCodeAt(0)) % 3 === 0 && `${r}${L}` !== seat) o.add(`${r}${L}`); o.add(row + (letter === 'A' ? 'B' : 'D')); return o; }, [seat]);
  const err = (ph: P) => { setMistakes((m) => m + 1); setFb({ ok: false, p: ph }); };
  const side = letter === 'A' || letter === 'F' ? p('junto a la ventanilla', 'պատուհանի մոտ') : p('en el pasillo', 'միջանցքի մոտ');
  const nodes: TNode[] = [
    { id: 's', who: 'az', line: p('Buenas tardes. Bienvenida a bordo.', 'Բարի օր։ Բարի գալուստ ինքնաթիռ։'), opts: [
      { p: p(`Buenas tardes. ¿Me puede indicar dónde está el asiento ${seat}?`, `Բարի օր։ Կարո՞ղ եք ցույց տալ, թե որտեղ է ${seat} նստատեղը։`) },
      { p: p(`Hola, buenas tardes. Tengo el ${seat}. ¿Por dónde voy?`, `Բարև, բարի օր։ Ես ունեմ ${seat}-ը։ Որ կողմով գնամ։`), lv: 'A2' },
      { p: p('Quiero bajar del avión.', 'Ուզում եմ իջնել ինքնաթիռից։'), ok: false, reply: p('Todavía no hemos despegado… ¿Busca su asiento?', 'Դեռ չենք թռել… Ձեր նստատե՞ղն եք փնտրում։') },
    ], next: 'r' },
    { id: 'r', who: 'az', line: p(`Sí, está ${side.es}, en la fila ${numEs(row)}. Siga recto por el pasillo.`, `Այո, այն ${side.hy} է՝ ${row}-րդ շարքում։ Գնացեք ուղիղ միջանցքով։`), opts: [
      { p: p('Muchas gracias.', 'Շատ շնորհակալություն։') },
      { p: p('Perfecto, gracias. ¿Hay sitio arriba para la mochila?', 'Կատարյալ է, շնորհակալություն։ Վերևում տեղ կա՞ ուսապարկի համար։'), lv: 'A2', reply: p('Sí, en el compartimento de su fila suele haber sitio.', 'Այո, ձեր շարքի պահարանում սովորաբար տեղ լինում է։') },
    ] },
  ];
  const spots: Spot[] = [
    { id: 'az', x: 5, bottom: 22, label: p('Azafata', 'Ուղեկցորդուհի'), art: <div className="cabin-crew"><Person look={LOOKS.azafata} /></div>, onArrive: () => step === 0 && setTalk(true) },
    ...Array.from({ length: 24 }, (_, i): Spot => {
      const r = i + 1;
      return {
        id: 'r' + r, x: 14 + i * 9, bottom: 18, label: undefined, z: 1,
        art: <div className={'crow ' + (r === row && step >= 1 ? 'mine' : '')}><b>{r}</b><div className={'cbin ' + (r === row && binOpen ? 'open' : '')}>{r === row && bagIn && <span>🎒</span>}</div><div className="cseats"><i /><i /><i /></div></div>,
        onArrive: () => {
          if (step === 0) return err(p('Primero saluda a la azafata y pregúntale por tu asiento.', 'Նախ բարևիր ուղեկցորդուհուն և հարցրու նստատեղիդ մասին։'));
          if (r !== row) return err(p(`Esta es la fila ${numEs(r)}. Tu asiento está en la fila ${numEs(row)}.`, `Սա ${r}-րդ շարքն է։ Քո նստատեղը ${row}-րդ շարքում է։`));
          if (step === 1) { setStep(2); setFb({ ok: true, p: p(`Fila ${numEs(row)}. Ahora guarda la mochila arriba.`, `${row}-րդ շարք։ Հիմա ուսապարկը դիր վերևում։`) }); }
          else if (step === 3) setPick(r);
        },
      };
    }),
  ];
  const sit = (r: number, L: string) => {
    const s = `${r}${L}`;
    if (s === seat) { sfx.success(); setPick(null); setStep(4); setTrip({ seated: true }); window.setTimeout(() => setFinished(true), 1800); return; }
    if (occupied.has(s)) err(p('Perdone, creo que este es mi asiento.', 'Ներեցեք, կարծում եմ՝ սա իմ տեղն է։'));
    else err(p(`Ese es el ${s}. Tu tarjeta dice ${seat}.`, `Դա ${s}-ն է։ Քո կտրոնում գրված է ${seat}։`));
  };
  const TASKS = [p('Habla con la azafata en la puerta del avión.', 'Խոսիր ուղեկցորդուհու հետ ինքնաթիռի դռան մոտ։'), p(`Camina por el pasillo hasta la fila ${numEs(row)}.`, `Քայլիր միջանցքով մինչև ${row}-րդ շարքը։`), p('Abre el compartimento superior y guarda la mochila.', 'Բաց վերևի պահարանը և դիր ուսապարկը։'), p(`Toca tu fila y elige el asiento ${seat}.`, `Հպիր քո շարքին և ընտրիր ${seat} նստատեղը։`), p('¡Ya estás sentada!', 'Արդեն նստած ես։')];
  return (
    <div className="mission-play">
      <Steps total={5} cur={step} />
      <Instruction p={TASKS[step]} icon="💺" />
      <div className="seat-pass">🎫 <T p={p('Tu asiento', 'Քո նստատեղը')} />: <b>{seat}</b> · <T p={side} /></div>
      <Stage width={240} startX={2} wear={TRAVEL_WEAR} spots={spots} className="stage-cabin" hideGirl={step === 4}
        bg={<div className="cabin-bg"><div className="cabin-windows">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${((14 + i * 9) / 240) * 100}%` }} />)}</div></div>}
        fg={step === 4 ? <div className="seated-girl" style={{ left: `${((14 + (row - 1) * 9) / 240) * 100}%` }}><Gayane wear={['jersey', 'pantalones', 'botas']} /></div> : undefined} />
      {talk && step === 0 && (
        <div className="task-box pop-in talk-with"><Person look={LOOKS.azafata} className="mini-person" /><Talk nodes={nodes} people={{ az: AZ }} onEnd={(m) => { setMistakes((x) => x + m); setTalk(false); setStep(1); }} /></div>
      )}
      {step === 2 && (
        <div className="task-box pop-in bin-task">
          <button className={'bin-big ' + (binOpen ? 'open' : '')} onClick={() => { sfx.click(); setBinOpen((o) => !o); if (bagIn && binOpen) setStep(3); }}>
            <span className="bin-door" /> <T p={binOpen ? p('Cerrar el compartimento', 'Փակել պահարանը') : p('Abrir el compartimento', 'Բացել պահարանը')} />
          </button>
          {binOpen && !bagIn && (
            <Drop id="bin" className="backpack-drop" accept={(pl) => pl.kind === 'mochila'} onDrop={() => { sfx.drop(); setBagIn(true); setFb({ ok: true, p: p('Mochila guardada. Ahora cierra el compartimento.', 'Ուսապարկը տեղավորված է։ Հիմա փակիր պահարանը։') }); }}>
              <T p={p('Compartimento superior', 'Վերևի պահարան')} />
            </Drop>
          )}
          {!bagIn && <Drag kind="mochila" id="mochila" className="bag-item" onTap={() => { if (!binOpen) { setFb({ ok: false, p: p('Primero abre el compartimento.', 'Նախ բաց պահարանը։') }); return; } sfx.drop(); setBagIn(true); setFb({ ok: true, p: p('Mochila guardada. Ahora cierra el compartimento.', 'Ուսապարկը տեղավորված է։ Հիմա փակիր պահարանը։') }); }}><span className="bi-icon">🎒</span><T p={p('la mochila', 'ուսապարկը')} /></Drag>}
          {bagIn && !binOpen && <Btn label={p('Buscar el asiento', 'Փնտրել նստատեղը')} icon="💺" onClick={() => setStep(3)} />}
        </div>
      )}
      {pick !== null && (
        <div className="modal-wrap" onClick={() => setPick(null)}>
          <div className="modal pop-in" onClick={(e) => e.stopPropagation()}>
            <Phrase p={p(`Fila ${numEs(pick)}. ¿Cuál es tu asiento?`, `${pick}-րդ շարք։ Ո՞րն է քո նստատեղը։`)} />
            <div className="seatmap">
              {LETTERS.map((L, i) => (
                <span key={L} style={{ display: 'contents' }}>
                  {i === 3 && <div className="aisle"><T p={p('pasillo', 'միջանցք')} /></div>}
                  <button className={'seatbtn ' + (occupied.has(`${pick}${L}`) ? 'occ' : '')} onClick={() => sit(pick, L)}>
                    <b>{pick}{L}</b>
                    <small><T p={L === 'A' || L === 'F' ? p('ventanilla', 'պատուհան') : L === 'C' || L === 'D' ? p('pasillo', 'միջանցք') : p('centro', 'մեջտեղ')} /></small>
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p(`Gayane está sentada en el ${seat}. ¡Buen vuelo!`, `Գայանեն նստած է ${seat}-ում։ Հաճելի թռիչք։`)} />}
    </div>
  );
}

/* ===================================================================== */
/*  2. PEDIR COMIDA Y BEBIDA                                              */
/* ===================================================================== */
type MItem = { id: string; cat: 'bebida' | 'comida' | 'extra'; icon: string; name: P; art: string; artHy: string; price: number };
const MENU: MItem[] = [
  { id: 'agua', cat: 'bebida', icon: '💧', name: p('agua sin gas', 'չգազավորված ջուր'), art: 'un agua sin gas', artHy: 'չգազավորված ջուր', price: 0 },
  { id: 'aguagas', cat: 'bebida', icon: '🫧', name: p('agua con gas', 'գազավորված ջուր'), art: 'un agua con gas', artHy: 'գազավորված ջուր', price: 0 },
  { id: 'zumo', cat: 'bebida', icon: '🧃', name: p('zumo de naranja', 'նարնջի հյութ'), art: 'un zumo de naranja', artHy: 'նարնջի հյութ', price: 0 },
  { id: 'cafe', cat: 'bebida', icon: '☕', name: p('café', 'սուրճ'), art: 'un café', artHy: 'սուրճ', price: 1.5 },
  { id: 'te', cat: 'bebida', icon: '🍵', name: p('té', 'թեյ'), art: 'un té', artHy: 'թեյ', price: 1.5 },
  { id: 'pollo', cat: 'comida', icon: '🥪', name: p('bocadillo de pollo', 'հավով սենդվիչ'), art: 'el bocadillo de pollo', artHy: 'հավով սենդվիչը', price: 0 },
  { id: 'ensalada', cat: 'comida', icon: '🥗', name: p('ensalada', 'աղցան'), art: 'la ensalada', artHy: 'աղցանը', price: 0 },
  { id: 'vegetariano', cat: 'comida', icon: '🍝', name: p('menú vegetariano', 'բուսակերային ճաշացանկ'), art: 'el menú vegetariano', artHy: 'բուսակերային ճաշացանկը', price: 0 },
  { id: 'galletas', cat: 'extra', icon: '🍪', name: p('galletas', 'թխվածքաբլիթներ'), art: 'unas galletas', artHy: 'թխվածքաբլիթներ', price: 2.5 },
  { id: 'chocolate', cat: 'extra', icon: '🍫', name: p('chocolate', 'շոկոլադ'), art: 'un chocolate', artHy: 'շոկոլադ', price: 2 },
];
const CATS: { id: MItem['cat']; name: P }[] = [
  { id: 'bebida', name: p('Bebidas', 'Խմիչքներ') },
  { id: 'comida', name: p('Comida (incluida)', 'Ուտելիք (ներառված է)') },
  { id: 'extra', name: p('Extras (se pagan aparte)', 'Լրացուցիչ (վճարովի)') },
];
type CSit = 'servilleta' | 'repetir' | 'incluido' | 'cambiar' | 'vaso' | 'proxima';
const SIT_LV: Record<CSit, 'A1' | 'A2' | 'B1'> = { servilleta: 'A1', vaso: 'A1', repetir: 'A2', incluido: 'A2', cambiar: 'B1', proxima: 'B1' };

function Comida({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const sits = useMemo(() => { const av = (Object.keys(SIT_LV) as CSit[]).filter((s) => levelOk(SIT_LV[s], level)); return av.sort(() => Math.random() - 0.5).slice(0, levelOk('B1', level) ? 3 : 2); }, [level]);
  const [phase, setPhase] = useState<'table' | 'greet' | 'menu' | 'order' | 'extra' | 'end'>('table');
  const [tableOpen, setTableOpen] = useState(false);
  const [cart, setCart] = useState(false);
  const [sel, setSel] = useState<MItem[]>([]);
  const [onTable, setOnTable] = useState<string[]>([]);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const drink = sel.find((x) => x.cat === 'bebida');
  const food = sel.find((x) => x.cat === 'comida');
  const extras = sel.filter((x) => x.cat === 'extra');
  const [foodNow, setFoodNow] = useState<MItem | null>(null);
  const put = (icon: string) => { sfx.drop(); setOnTable((t) => [...t, icon]); };

  useEffect(() => { if (phase === 'greet') { const t = window.setTimeout(() => setCart(true), 50); return () => window.clearTimeout(t); } }, [phase]);

  const greet: TNode[] = [
    { id: 's', who: 'az', line: p('Buenas tardes, señora. ¿Desea tomar algo?', 'Բարի օր, տիկին։ Ինչ-որ բան կխմե՞ք։'), opts: [
      { p: p('Sí, por favor. ¿Qué tienen?', 'Այո, խնդրում եմ։ Ի՞նչ ունեք։') },
      { p: p('Sí, gracias. ¿Me deja ver la carta?', 'Այո, շնորհակալություն։ Կթողնե՞ք ճաշացանկը տեսնեմ։'), lv: 'A2' },
      { p: p('No hablo.', 'Չեմ խոսում։'), ok: false, reply: p('Perdone, ¿quiere algo de beber o de comer?', 'Ներեցեք, խմելու կամ ուտելու բան կուզե՞ք։') },
    ], next: 'c' },
    { id: 'c', who: 'az', line: p('Aquí tiene la carta. La comida está incluida; los extras se pagan aparte.', 'Ահա ճաշացանկը։ Ուտելիքը ներառված է, լրացուցիչները վճարովի են։') },
  ];

  const orderNodes = (): TNode[] => {
    if (!drink || !food) return [];
    const otherDrink = MENU.find((x) => x.cat === 'bebida' && x.id !== drink.id)!;
    const n: TNode[] = [
      { id: 's', who: 'az', line: p('Muy bien. ¿Qué le pongo?', 'Շատ լավ։ Ի՞նչ բերեմ ձեզ։'), opts: [
        { p: p(`Me gustaría ${drink.art} y ${food.art}, por favor.`, `Կցանկանայի ${drink.artHy} և ${food.artHy}, խնդրում եմ։`) },
        { p: p(`Quisiera ${drink.art} y ${food.art}.`, `Կցանկանայի ${drink.artHy} և ${food.artHy}։`), lv: 'A2' },
        { p: p(`Me gustaría ${otherDrink.art} y ${food.art}, por favor.`, `Կցանկանայի ${otherDrink.artHy} և ${food.artHy}, խնդրում եմ։`), ok: false, reply: p('Perdone, en su pedido veo otra bebida. ¿Qué prefiere?', 'Ներեցեք, ձեր պատվերում այլ խմիչք եմ տեսնում։ Ի՞նչ եք նախընտրում։') },
      ], next: 'd' },
    ];
    const dn: Record<string, TNode> = {
      zumo: { id: 'd', who: 'az', line: p('¿Lo quiere con hielo o sin hielo?', 'Սառույցո՞վ եք ուզում, թե՞ առանց։'), opts: [{ p: p('Sin hielo, por favor.', 'Առանց սառույցի, խնդրում եմ։') }, { p: p('Con un poco de hielo, gracias.', 'Մի քիչ սառույցով, շնորհակալություն։') }] },
      agua: { id: 'd', who: 'az', line: p('¿Fría o del tiempo?', 'Սառը՞, թե՞ սենյակային ջերմաստիճանի։'), opts: [{ p: p('Del tiempo, por favor. Y sin gas.', 'Սենյակային, խնդրում եմ։ Եվ առանց գազի։') }, { p: p('Fría, gracias.', 'Սառը, շնորհակալություն։') }] },
      aguagas: { id: 'd', who: 'az', line: p('¿Con limón?', 'Կիտրոնո՞վ։'), opts: [{ p: p('Sí, con una rodaja de limón, gracias.', 'Այո, մեկ կտոր կիտրոնով, շնորհակալություն։') }, { p: p('No, sola, gracias.', 'Ոչ, առանց որևէ բանի, շնորհակալություն։') }] },
      cafe: { id: 'd', who: 'az', line: p('¿Con leche y azúcar?', 'Կաթո՞վ և շաքարո՞վ։'), opts: [{ p: p('Con leche, pero sin azúcar, por favor.', 'Կաթով, բայց առանց շաքարի, խնդրում եմ։') }, { p: p('Solo y sin azúcar, gracias.', 'Սև և առանց շաքարի, շնորհակալություն։') }, { p: p('Con hielo.', 'Սառույցով։'), ok: false, reply: p('¿Café con hielo? Lo siento, solo lo tenemos caliente. ¿Con leche?', 'Սուրճ սառույցո՞վ։ Ցավոք, միայն տաք ունենք։ Կաթո՞վ։') }] },
      te: { id: 'd', who: 'az', line: p('¿Té negro o verde?', 'Սև թե՞յ, թե՞ կանաչ։'), opts: [{ p: p('Verde, por favor, sin azúcar.', 'Կանաչ, խնդրում եմ, առանց շաքարի։') }, { p: p('Negro, con un poco de leche.', 'Սև, մի քիչ կաթով։') }] },
    };
    n.push({ ...dn[drink.id], effect: undefined, next: 'f' });
    n[0].opts![0].effect = 'drink';
    n[0].opts!.forEach((o) => { if (o.ok !== false) o.effect = 'drink'; });
    const fnode: Record<string, TNode> = {
      pollo: { id: 'f', who: 'az', line: p('Aquí tiene su bocadillo de pollo. Cuidado, que está caliente.', 'Ահա ձեր հավով սենդվիչը։ Զգույշ, տաք է։'), effect: 'food' },
      ensalada: { id: 'f', who: 'az', line: p('Su ensalada. ¿Quiere aceite y vinagre?', 'Ձեր աղցանը։ Ձեթ և քացախ կուզե՞ք։'), effect: 'food', opts: [{ p: p('Sí, por favor.', 'Այո, խնդրում եմ։') }, { p: p('Solo aceite, gracias.', 'Միայն ձեթ, շնորհակալություն։') }] },
      vegetariano: { id: 'f', who: 'az', lv: 'A1', line: p('¿Pidió el menú vegetariano al comprar el billete?', 'Բուսակերային ճաշացանկը պատվիրե՞լ էիք տոմսը գնելիս։'), opts: [
        { p: p('Sí, lo reservé con el billete.', 'Այո, ամրագրել եմ տոմսի հետ։'), reply: p('Perfecto, aquí lo tiene: pasta con verduras.', 'Կատարյալ է, ահա այն՝ մակարոն բանջարեղենով։'), effect: 'food' },
        { p: p('No, pero soy vegetariana. ¿Le queda alguno?', 'Ոչ, բայց ես բուսակեր եմ։ Մեկը մնացե՞լ է։'), lv: 'A2', reply: p('Me queda uno. Aquí tiene: pasta con verduras.', 'Մեկը մնացել է։ Վերցրեք՝ մակարոն բանջարեղենով։'), effect: 'food' },
      ] },
    };
    n.push({ ...fnode[food.id], next: extras.length ? 'x' : 'end' });
    if (extras.length) {
      const tot = extras.reduce((a, b) => a + b.price, 0);
      n.push({ id: 'x', who: 'az', line: p(`${extras.map((e) => e.name.es).join(' y ')}: son ${String(tot.toFixed(2)).replace('.', ',')} euros. ¿Cómo quiere pagar?`, `${extras.map((e) => e.name.hy).join(' և ')}՝ ${tot.toFixed(2).replace('.', ',')} եվրո։ Ինչպե՞ս եք ուզում վճարել։`), opts: [
        { p: p('Con tarjeta, por favor.', 'Քարտով, խնդրում եմ։'), effect: 'extras', reply: p('Acerque la tarjeta, por favor… Ya está, gracias.', 'Մոտեցրեք քարտը, խնդրում եմ… Պատրաստ է, շնորհակալություն։') },
        { p: p('¿Puedo pagar en efectivo?', 'Կարո՞ղ եմ կանխիկ վճարել։'), effect: 'extras', reply: p('Lo siento, a bordo solo aceptamos tarjeta… Perfecto, ya está.', 'Ցավոք, ինքնաթիռում միայն քարտ ենք ընդունում… Կատարյալ է, պատրաստ է։') },
      ], next: 'end' });
    }
    n.push({ id: 'end', who: 'az', line: p('Que aproveche.', 'Բարի ախորժակ։') });
    return n;
  };

  const sitNodes = (): TNode[] => {
    const all: Record<CSit, TNode[]> = {
      servilleta: [{ id: 'servilleta', who: 'az', line: p('¿Está todo bien?', 'Ամեն ինչ լա՞վ է։'), opts: [
        { p: p('Sí, gracias. ¿Me podría dar otra servilleta, por favor?', 'Այո, շնորհակալություն։ Կարո՞ղ եք ևս մեկ անձեռոցիկ տալ, խնդրում եմ։'), effect: 'napkin', reply: p('Claro, aquí tiene.', 'Իհարկե, վերցրեք։') },
        { p: p('Necesito una servilleta más, por favor.', 'Ինձ ևս մեկ անձեռոցիկ է պետք, խնդրում եմ։'), effect: 'napkin', reply: p('Por supuesto.', 'Իհարկե։') },
      ] }],
      vaso: [{ id: 'vaso', who: 'az', line: p('¿Necesita algo más?', 'Էլի ինչ-որ բան պե՞տք է։'), opts: [
        { p: p('¿Me podría traer también un vaso de agua?', 'Կարո՞ղ եք նաև մի բաժակ ջուր բերել։'), effect: 'water', reply: p('Ahora mismo. Aquí tiene.', 'Հենց հիմա։ Վերցրեք։') },
        { p: p('Sí, un vaso de agua, por favor.', 'Այո, մի բաժակ ջուր, խնդրում եմ։'), effect: 'water', reply: p('Aquí tiene.', 'Վերցրեք։') },
      ] }],
      repetir: [{ id: 'repetir', who: 'az', line: p('¿… desea … más … carrito?', '(Աղմուկ է, լավ չի լսվում) …ցանկանա՞ք … սայլակից։'), opts: [
        { p: p('Perdone, no la he oído bien. ¿Puede repetirlo?', 'Ներեցեք, լավ չլսեցի։ Կարո՞ղ եք կրկնել։'), reply: p('Claro: le pregunto si desea algo más del carrito.', 'Իհարկե՝ հարցնում եմ՝ սայլակից էլի ինչ-որ բան կցանկանա՞ք։'), next: 'repetir2' },
        { p: p('Sí, sí.', 'Այո, այո։'), ok: false, reply: p('¿Sí? ¿Qué desea, entonces?', 'Այո՞։ Ուրեմն ի՞նչ եք ցանկանում։') },
      ] }, { id: 'repetir2', who: 'az', line: p('¿Desea algo más del carrito?', 'Էլի ինչ-որ բան կցանկանա՞ք սայլակից։'), opts: [{ p: p('No, gracias. Está todo perfecto.', 'Ոչ, շնորհակալություն։ Ամեն ինչ կատարյալ է։') }] }],
      incluido: [{ id: 'incluido', who: 'az', line: p('¿Tiene alguna pregunta sobre el servicio?', 'Սպասարկման վերաբերյալ հարց ունե՞ք։'), opts: [
        { p: p('Sí. ¿La comida está incluida en el precio del billete?', 'Այո։ Ուտելիքը ներառվա՞ծ է տոմսի գնի մեջ։'), reply: p('Sí, el menú y las bebidas frías están incluidos. El café, el té y los extras se pagan aparte.', 'Այո, ճաշացանկը և սառը խմիչքները ներառված են։ Սուրճը, թեյը և լրացուցիչները վճարվում են առանձին։') },
        { p: p('No, gracias.', 'Ոչ, շնորհակալություն։') },
      ] }],
      cambiar: [{ id: 'cambiar', who: 'az', line: p('¿Le gusta la comida?', 'Ուտելիքը դուր է գալի՞ս։'), opts: [
        { p: p(`Disculpe, ¿sería posible cambiar ${food?.art ?? 'el plato'} por la ensalada? No me encuentro muy bien.`, `Ներեցեք, հնարավո՞ր է ${food?.artHy ?? 'ճաշատեսակը'} փոխել աղցանով։ Ինձ այնքան էլ լավ չեմ զգում։`), effect: 'swap', next: 'cambiar2' },
        { p: p('Está muy bueno, gracias.', 'Շատ համեղ է, շնորհակալություն։') },
      ] }, { id: 'cambiar2', who: 'az', line: p('Por supuesto. ¿Quiere también una manzanilla?', 'Իհարկե։ Երիցուկի թեյ էլ կուզե՞ք։'), opts: [{ p: p('Sí, se lo agradezco mucho.', 'Այո, շատ շնորհակալ կլինեմ։'), effect: 'tea' }, { p: p('No, con la ensalada es suficiente.', 'Ոչ, աղցանը բավական է։') }] }],
      proxima: [{ id: 'proxima', who: 'az', line: p('Voy a recoger las bandejas en unos minutos.', 'Մի քանի րոպեից սկուտեղները կհավաքեմ։'), opts: [
        { p: p('De acuerdo. ¿Cuándo sirven la próxima comida?', 'Լավ։ Ե՞րբ եք մատուցում հաջորդ ուտելիքը։'), reply: p('Este vuelo es corto, así que no hay otro servicio. Pero puede pedir agua cuando quiera.', 'Այս թռիչքը կարճ է, ուստի այլ սպասարկում չկա։ Բայց կարող եք ջուր խնդրել ցանկացած ժամանակ։') },
        { p: p('Gracias. ¿Me avisa cuando las recoja?', 'Շնորհակալություն։ Կզգուշացնե՞ք, երբ հավաքեք։'), reply: p('Claro, no se preocupe.', 'Իհարկե, մի անհանգստացեք։') },
      ] }],
    };
    const out: TNode[] = [];
    sits.forEach((sit, i) => {
      const after = sits[i + 1] ? all[sits[i + 1]][0].id : undefined;
      all[sit].forEach((nd) => out.push({ ...nd, next: after, opts: nd.opts?.map((o) => (o.next ? o : { ...o, next: after })) }));
    });
    return out;
  };

  const effect = (e: string) => {
    if (e === 'drink' && drink) put(drink.icon);
    if (e === 'food' && food) { setFoodNow(food); put(food.icon); }
    if (e === 'extras') { sfx.coin(); extras.forEach((x) => put(x.icon)); }
    if (e === 'napkin') put('🧻');
    if (e === 'water') put('🥛');
    if (e === 'tea') put('🍵');
    if (e === 'swap') setOnTable((t) => t.map((x) => (x === (foodNow ?? food)?.icon ? '🥗' : x)));
  };

  const choose = (it: MItem) => {
    sfx.click();
    setSel((s) => {
      if (s.includes(it)) return s.filter((x) => x !== it);
      if (it.cat !== 'extra') return [...s.filter((x) => x.cat !== it.cat), it];
      return [...s, it];
    });
  };

  return (
    <div className="mission-play">
      <div className="meal">
        <div className={'meal-scene ' + (cart ? 'cart-in' : '')}>
          <CabinWindow />
          <div className="meal-seat" />
          <div className="meal-girl"><Gayane wear={['jersey', 'pantalones', 'botas']} /></div>
          <button className={'tray-table ' + (tableOpen ? 'open' : '')} onClick={() => { if (phase === 'table') { sfx.click(); setTableOpen(true); setPhase('greet'); } }} aria-label="Mesita">
            <span className="tt-items">{onTable.map((x, i) => <span key={i} className="drop-in">{x}</span>)}</span>
            {!tableOpen && <span className="tt-hint"><T p={p('Toca para abrir la mesita', 'Հպիր՝ սեղանիկը բացելու համար')} /></span>}
          </button>
          <div className="meal-cart"><div className="cart-box"><span>🥤</span><span>🥪</span><span>☕</span></div><div className="cart-az"><Person look={LOOKS.azafata} talking={phase === 'greet' || phase === 'order'} /></div></div>
        </div>
        <div className="meal-panel">
          {phase === 'table' && <Instruction p={p('Prepárate para la comida: abre la mesita del asiento.', 'Պատրաստվիր ուտելուն՝ բաց նստատեղի սեղանիկը։')} icon="🍽️" />}
          {phase === 'greet' && <Talk nodes={greet} people={{ az: AZ }} onEnd={(m) => (setMistakes((x) => x + m), setPhase('menu'))} />}
          {phase === 'menu' && (
            <div className="task-box pop-in">
              <Instruction p={p('Elige una bebida y algo para comer. Si quieres, añade un extra. Después, confirma el pedido.', 'Ընտրիր մեկ խմիչք և ուտելու ինչ-որ բան։ Եթե ուզում ես, ավելացրու լրացուցիչ։ Հետո հաստատիր պատվերը։')} icon="📋" auto={false} />
              <div className="flight-menu">
                <div className="fm-title">AURORA AIR · <T p={p('Carta a bordo', 'Ինքնաթիռի ճաշացանկ')} /></div>
                {CATS.map((c) => (
                  <div key={c.id} className="fm-cat">
                    <div className="fm-cat-name"><T p={c.name} /></div>
                    <div className="fm-items">
                      {MENU.filter((x) => x.cat === c.id).map((x) => (
                        <button key={x.id} className={'fm-item ' + (sel.includes(x) ? 'on' : '')} onClick={() => choose(x)}>
                          <span>{x.icon}</span><T p={x.name} /><small>{x.price ? x.price.toFixed(2).replace('.', ',') + ' €' : <T p={p('incluido', 'ներառված')} />}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-box">
                <div className="ob-title"><T p={p('Tu pedido', 'Քո պատվերը')} /></div>
                {sel.map((x) => <div key={x.id} className="ob-row"><span>{x.icon}</span><T p={x.name} /><b>{x.price ? x.price.toFixed(2).replace('.', ',') + ' €' : '—'}</b></div>)}
              </div>
              <Btn label={p('Confirmar el pedido', 'Հաստատել պատվերը')} icon="✓" disabled={!drink || !food} onClick={() => setPhase('order')} />
              {(!drink || !food) && <T p={p('Necesitas una bebida y un plato.', 'Քեզ պետք է մեկ խմիչք և մեկ ճաշատեսակ։')} className="muted" />}
            </div>
          )}
          {phase === 'order' && <Talk nodes={orderNodes()} people={{ az: AZ }} onEffect={effect} onEnd={(m) => (setMistakes((x) => x + m), setPhase('extra'))} />}
          {phase === 'extra' && <Talk nodes={sitNodes()} people={{ az: AZ }} onEffect={effect} onEnd={(m) => { setMistakes((x) => x + m); setPhase('end'); setCart(false); window.setTimeout(() => setFinished(true), 1500); }} />}
        </div>
      </div>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Tienes la comida y la bebida en la mesita. ¡Que aproveche!', 'Ուտելիքն ու խմիչքը սեղանիկին են։ Բարի ախորժակ։')} />}
    </div>
  );
}

/* ===================================================================== */
/*  3. HABLAR CON LA AZAFATA                                              */
/* ===================================================================== */
type Topic = { id: string; icon: string; t: P; lv: 'A1' | 'A2' | 'B1' | 'B2'; nodes: TNode[]; effect?: string };
const TOPICS: Topic[] = [
  { id: 'cinturon', icon: '🔒', t: p('El cinturón de seguridad', 'Անվտանգության գոտին'), lv: 'A1', nodes: [
    { id: 's', who: 'az', line: p('¿Puedo ayudarla en algo?', 'Կարո՞ղ եմ ինչ-որ բանով օգնել։'), opts: [
      { p: p('Sí, perdone. ¿Cómo se abrocha el cinturón?', 'Այո, ներեցեք։ Ինչպե՞ս է ամրացվում գոտին։'), next: 'b' },
      { p: p('Mi cinturón no se cierra bien. ¿Me puede ayudar?', 'Գոտիս լավ չի փակվում։ Կարո՞ղ եք օգնել։'), lv: 'A2', next: 'b' },
    ] },
    { id: 'b', who: 'az', line: p('Meta la pieza metálica en la hebilla hasta oír «clic». Para soltarlo, levante la tapa.', 'Մետաղյա մասը մտցրեք ճարմանդի մեջ, մինչև լսեք «կլիկ»։ Արձակելու համար բարձրացրեք կափարիչը։'), effect: 'belt', opts: [{ p: p('Ya está, gracias.', 'Պատրաստ է, շնորհակալություն։') }, { p: p('¿Tengo que llevarlo abrochado todo el vuelo?', 'Ամբողջ թռիչքի ընթացքում պե՞տք է ամրացված լինի։'), lv: 'B1', reply: p('Mientras esté sentada, se lo recomendamos, sí.', 'Քանի դեռ նստած եք, այո, խորհուրդ ենք տալիս։') }] },
  ] },
  { id: 'aseo', icon: '🚻', t: p('¿Dónde está el aseo?', 'Որտե՞ղ է զուգարանը'), lv: 'A1', nodes: [
    { id: 's', who: 'az', line: p('Dígame.', 'Ասեք։'), opts: [
      { p: p('Perdone, ¿dónde está el aseo?', 'Ներեցեք, որտե՞ղ է զուգարանը։') },
      { p: p('¿Dónde está el baño, por favor?', 'Որտե՞ղ է զուգարանը, խնդրում եմ։') },
      { p: p('¿Dónde está la cocina?', 'Որտե՞ղ է խոհանոցը։'), ok: false, reply: p('La cocina es solo para la tripulación. ¿Busca otra cosa?', 'Խոհանոցը միայն անձնակազմի համար է։ Ուրիշ բա՞ն եք փնտրում։') },
    ], next: 'r' },
    { id: 'r', who: 'az', line: p('Al fondo del avión, a la izquierda. Ahora está ocupado: cuando la luz esté verde, estará libre.', 'Ինքնաթիռի վերջում, ձախ կողմում։ Հիմա զբաղված է. երբ լույսը կանաչ լինի, ազատ կլինի։'), opts: [{ p: p('De acuerdo, espero. Gracias.', 'Լավ, կսպասեմ։ Շնորհակալություն։') }] },
  ] },
  { id: 'manta', icon: '🧣', t: p('Pedir una manta', 'Վերմակ խնդրել'), lv: 'A1', nodes: [
    { id: 's', who: 'az', line: p('¿Se encuentra bien?', 'Լա՞վ եք։'), opts: [
      { p: p('Tengo un poco de frío. ¿Me podría traer una manta?', 'Մի քիչ մրսում եմ։ Կարո՞ղ եք վերմակ բերել։'), effect: 'blanket', reply: p('Por supuesto. Aquí tiene. Si quiere, cierro la salida de aire.', 'Իհարկե։ Վերցրեք։ Եթե ցանկանում եք, կփակեմ օդափոխիչը։') },
      { p: p('¿Hay mantas a bordo?', 'Ինքնաթիռում վերմակներ կա՞ն։'), effect: 'blanket', reply: p('Sí, aquí tiene una.', 'Այո, ահա մեկը։') },
      { p: p('Tengo calor y frío y hambre.', 'Շոգում եմ, մրսում եմ և սոված եմ։'), ok: false, reply: p('Vamos por partes: ¿qué necesita primero?', 'Եկեք հերթով՝ առաջինը ի՞նչ է ձեզ պետք։') },
    ], next: 'g' },
    { id: 'g', who: 'az', line: p('¿Algo más?', 'Էլի ինչ-որ բան։'), opts: [{ p: p('No, nada más. Muchas gracias.', 'Ոչ, ուրիշ ոչինչ։ Շատ շնորհակալություն։') }] },
  ] },
  { id: 'aterrizaje', icon: '🕒', t: p('¿Cuándo aterrizamos?', 'Ե՞րբ ենք վայրէջք կատարում'), lv: 'A1', nodes: [
    { id: 's', who: 'az', line: p('¿Sí?', 'Այո՞։'), opts: [
      { p: p('Perdone, ¿a qué hora aterrizamos en Lisboa?', 'Ներեցեք, ժամը քանիսի՞ն ենք վայրէջք կատարում Լիսաբոնում։') },
      { p: p('¿Cuánto falta para llegar?', 'Որքա՞ն է մնացել հասնելուն։') },
    ], next: 'r' },
    { id: 'r', who: 'az', line: p('Aterrizamos a las once y cinco, hora local. En Lisboa es una hora menos que en Madrid.', 'Վայրէջք ենք կատարում ժամը տասնմեկն անց հինգին՝ տեղական ժամանակով։ Լիսաբոնում ժամը մեկ ժամ պակաս է, քան Մադրիդում։'), opts: [{ p: p('Ah, entonces tengo que cambiar la hora del reloj.', 'Ա՜, ուրեմն պետք է փոխեմ ժամացույցիս ժամը։'), lv: 'A2' }, { p: p('Perfecto, gracias.', 'Կատարյալ է, շնորհակալություն։') }] },
  ] },
  { id: 'cambiar', icon: '🔁', t: p('¿Puedo cambiarme de asiento?', 'Կարո՞ղ եմ նստատեղս փոխել'), lv: 'A2', nodes: [
    { id: 's', who: 'az', line: p('¿Hay algún problema?', 'Ինչ-որ խնդիր կա՞։'), opts: [
      { p: p('¿Sería posible cambiarme de asiento? Aquí hay mucho ruido.', 'Հնարավո՞ր է նստատեղս փոխել։ Այստեղ շատ աղմուկ է։'), next: 'q' },
      { p: p('Mi compañera de trabajo está en la fila veinte. ¿Podría sentarme con ella?', 'Աշխատակցուհիս քսաներորդ շարքում է։ Կարո՞ղ եմ նրա հետ նստել։'), lv: 'B1', next: 'q' },
    ] },
    { id: 'q', who: 'az', line: p('Hay un asiento libre en la fila veintidós, junto al pasillo. ¿Le parece bien?', 'Քսաներկուերորդ շարքում՝ միջանցքի մոտ, ազատ տեղ կա։ Ձեզ հարմա՞ր է։'), opts: [
      { p: p('Sí, perfecto. Muchas gracias.', 'Այո, կատարյալ է։ Շատ շնորհակալություն։'), reply: p('Coja sus cosas y venga conmigo.', 'Վերցրեք ձեր իրերը և եկեք ինձ հետ։') },
      { p: p('¿No hay nada junto a la ventanilla? Si no, me quedo aquí.', 'Պատուհանի մոտ ոչինչ չկա՞։ Եթե ոչ, կմնամ այստեղ։'), lv: 'B1', reply: p('Lo siento, solo queda ese. Entonces se queda en su asiento, ¿verdad?', 'Ցավոք, միայն այդ մեկն է մնացել։ Ուրեմն մնում եք ձեր տեղում, չէ՞։') },
    ] },
  ] },
  { id: 'ayuda', icon: '🙋🏻‍♀️', t: p('Pedir ayuda', 'Օգնություն խնդրել'), lv: 'A2', nodes: [
    { id: 's', who: 'az', line: p('¿La puedo ayudar?', 'Կարո՞ղ եմ օգնել։'), opts: [
      { p: p('Sí, por favor. No me encuentro muy bien; estoy un poco mareada.', 'Այո, խնդրում եմ։ Ինձ այնքան էլ լավ չեմ զգում, գլուխս մի քիչ պտտվում է։'), next: 'r' },
      { p: p('¿Me puede ayudar a bajar la mochila del compartimento?', 'Կարո՞ղ եք օգնել ուսապարկը իջեցնել պահարանից։'), next: 'm' },
    ] },
    { id: 'r', who: 'az', line: p('Le traigo agua ahora mismo. Respire despacio y mire por la ventanilla. ¿Necesita algo más?', 'Հենց հիմա ջուր կբերեմ։ Դանդաղ շնչեք և նայեք պատուհանից։ Էլի ինչ-որ բան պե՞տք է։'), effect: 'water', opts: [{ p: p('No, gracias. Ya me siento mejor.', 'Ոչ, շնորհակալություն։ Արդեն ավելի լավ եմ զգում։') }] },
    { id: 'm', who: 'az', line: p('Claro. ¿Necesita algo de la mochila?', 'Իհարկե։ Ուսապարկից ինչ-որ բան պե՞տք է։'), opts: [{ p: p('Sí, el libro y los auriculares. Gracias.', 'Այո, գիրքը և ականջակալները։ Շնորհակալություն։') }] },
  ] },
  { id: 'tarjeta', icon: '🎫', t: p('He perdido la tarjeta de embarque', 'Կորցրել եմ նստեցման կտրոնը'), lv: 'B1', nodes: [
    { id: 's', who: 'az', line: p('Dígame, ¿qué ocurre?', 'Ասեք, ի՞նչ է պատահել։'), opts: [
      { p: p('No encuentro mi tarjeta de embarque. ¿Es un problema?', 'Չեմ գտնում նստեցման կտրոնս։ Դա խնդի՞ր է։'), next: 'r' },
      { p: p('Creo que he perdido la tarjeta de embarque. ¿Qué tengo que hacer?', 'Կարծում եմ՝ կորցրել եմ նստեցման կտրոնը։ Ի՞նչ պետք է անեմ։'), next: 'r' },
    ] },
    { id: 'r', who: 'az', line: p('No se preocupe: su nombre está en la lista de pasajeros. ¿Me dice su nombre y su asiento?', 'Մի անհանգստացեք՝ ձեր անունը ուղևորների ցուցակում է։ Կասե՞ք ձեր անունը և նստատեղը։'), opts: [
      { p: p('Me llamo Gayane y estoy en el dieciocho A.', 'Իմ անունը Գայանե է, և նստած եմ տասնութ A-ում։') },
      { p: p('Estoy en el avión.', 'Ինքնաթիռում եմ։'), ok: false, reply: p('Sí, claro… pero ¿en qué asiento?', 'Այո, իհարկե… բայց ո՞ր նստատեղում։') },
    ], next: 'ok' },
    { id: 'ok', who: 'az', line: p('Todo correcto. Además, aquí tiene su tarjeta: estaba en el suelo, debajo del asiento.', 'Ամեն ինչ ճիշտ է։ Բացի այդ, ահա ձեր կտրոնը՝ հատակին էր, նստատեղի տակ։'), effect: 'pass' },
  ] },
  { id: 'conexion', icon: '🔀', t: p('Preguntar por la conexión', 'Հարցնել տրանզիտի մասին'), lv: 'B2', nodes: [
    { id: 's', who: 'az', line: p('¿Tiene alguna duda sobre la llegada?', 'Ժամանման վերաբերյալ հարց ունե՞ք։'), opts: [
      { p: p('Sí. Tengo una conexión a Oporto a las doce. ¿Me dará tiempo si llevamos retraso?', 'Այո։ Տասներկուսին տրանզիտ ունեմ դեպի Պորտու։ Կհասցնե՞մ, եթե ուշանանք։'), next: 'r' },
      { p: p('¿Tendré que volver a pasar el control de seguridad para la conexión?', 'Տրանզիտի համար պետք կլինի՞ նորից անցնել անվտանգության ստուգում։'), next: 'r2' },
    ] },
    { id: 'r', who: 'az', line: p('Vamos con diez minutos de retraso, pero tendrá casi una hora. Siga las pantallas de «Conexiones» al salir.', 'Տասը րոպե ուշանում ենք, բայց համարյա մեկ ժամ կունենաք։ Դուրս գալիս հետևեք «Տրանզիտ» էկրաններին։'), opts: [
      { p: p('Entendido. Y si al final pierdo el vuelo, ¿a quién me dirijo?', 'Հասկացա։ Իսկ եթե ի վերջո ուշանամ չվերթից, ո՞ւմ դիմեմ։'), reply: p('Al mostrador de la compañía: le darán una plaza en el siguiente vuelo sin coste.', 'Ընկերության կետին՝ ձեզ անվճար տեղ կտան հաջորդ չվերթում։') },
      { p: p('Perfecto, muchas gracias por la información.', 'Կատարյալ է, շատ շնորհակալություն տեղեկության համար։') },
    ] },
    { id: 'r2', who: 'az', line: p('No, si es un vuelo de nuestra compañía y no sale de la zona de tránsito.', 'Ոչ, եթե դա մեր ընկերության չվերթ է, և դուք դուրս չեք գալիս տրանզիտային գոտուց։'), opts: [{ p: p('Ah, me quedo más tranquila. Gracias.', 'Ա՜, ավելի հանգիստ եմ։ Շնորհակալություն։') }] },
  ] },
];
const NEED: Record<string, number> = { A1: 3, A2: 4, B1: 5, B2: 6 };

function Azafata({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const topics = TOPICS.filter((t) => levelOk(t.lv, level));
  const need = Math.min(NEED[level], topics.length);
  const [cur, setCur] = useState<Topic | null>(null);
  const [okIds, setOkIds] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [props, setProps] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const effect = (e: string) => {
    const m: Record<string, string> = { blanket: '🧣', water: '🥛', belt: '🔒', pass: '🎫' };
    if (m[e]) { sfx.drop(); setProps((x) => (x.includes(m[e]) ? x : [...x, m[e]])); }
  };
  return (
    <div className="mission-play">
      <div className="talk-seat">
        <div className="ts-art">
          <CabinWindow />
          <div className="ts-girl"><Gayane wear={['jersey', 'pantalones', 'botas']} /></div>
          <div className="ts-az"><Person look={LOOKS.azafata} talking={!!cur} /></div>
          <div className="ts-props">{props.map((x) => <span key={x} className="drop-in">{x}</span>)}</div>
        </div>
        <div className="ts-panel">
          {!cur && (
            <div className="task-box">
              <Instruction p={p(`Pulsa el botón de llamada y habla con la azafata. Completa ${numEs(need)} conversaciones.`, `Սեղմիր կանչի կոճակը և խոսիր ուղեկցորդուհու հետ։ Կատարիր ${need} զրույց։`)} icon="🛎️" auto={false} />
              <div className="topic-grid">
                {topics.map((t) => (
                  <button key={t.id} className={'topic ' + (okIds.includes(t.id) ? 'done' : '')} onClick={() => { sfx.ding(); setCur(t); }}>
                    <span>{t.icon}</span><T p={t.t} />{okIds.includes(t.id) && <i>✓</i>}
                  </button>
                ))}
              </div>
              <div className="muted">{okIds.length} / {need}</div>
            </div>
          )}
          {cur && <Talk key={cur.id} nodes={cur.nodes} people={{ az: AZ }} onEffect={effect} onEnd={(m) => {
            setMistakes((x) => x + m);
            const ids = okIds.includes(cur.id) ? okIds : [...okIds, cur.id];
            setOkIds(ids); setCur(null);
            if (ids.length >= need) window.setTimeout(() => setFinished(true), 600);
          }} />}
        </div>
      </div>
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Has resuelto tus dudas con la tripulación.', 'Անձնակազմի հետ լուծեցիր քո հարցերը։')} />}
    </div>
  );
}

/* ===================================================================== */
/*  4. DURANTE EL VUELO                                                   */
/* ===================================================================== */
type Ctl = 'cinturon' | 'movil' | 'persiana' | 'respaldo' | 'mesita' | 'luz' | 'esperar';
const ANNS: { text: P; need: Ctl[]; phase: 'day' | 'sunset' | 'night'; lv?: 'A2' | 'B1' }[] = [
  { text: p('Señoras y señores, el comandante ha encendido la señal de abrocharse el cinturón. Por favor, abróchense el cinturón.', 'Տիկնայք և պարոնայք, հրամանատարը միացրել է գոտիներն ամրացնելու նշանը։ Խնդրում ենք ամրացնել գոտիները։'), need: ['cinturon'], phase: 'day' },
  { text: p('Les rogamos que pongan sus teléfonos móviles en modo avión.', 'Խնդրում ենք ձեր բջջային հեռախոսները դնել ինքնաթիռի ռեժիմի։'), need: ['movil'], phase: 'day' },
  { text: p('Vamos a atravesar una zona de turbulencias. Permanezcan sentados, por favor.', 'Անցնում ենք տուրբուլենտության գոտով։ Խնդրում ենք մնալ նստած։'), need: ['esperar'], phase: 'sunset', lv: 'A2' },
  { text: p('Atenuamos las luces de la cabina. Si desean descansar, pueden apagar la luz de lectura.', 'Մեղմացնում ենք սրահի լույսերը։ Եթե ցանկանում եք հանգստանալ, կարող եք անջատել ընթերցանության լույսը։'), need: ['luz'], phase: 'night', lv: 'B1' },
  { text: p('Iniciamos el descenso. Pongan el respaldo en posición vertical y plieguen la mesita.', 'Սկսում ենք վայրէջքը։ Դրեք նստատեղի թիկնակը ուղղահայաց դիրքի և ծալեք սեղանիկը։'), need: ['respaldo', 'mesita'], phase: 'sunset' },
  { text: p('Para el aterrizaje, por favor, suban las persianas de las ventanillas.', 'Վայրէջքի համար խնդրում ենք բարձրացնել պատուհանների վարագույրները։'), need: ['persiana'], phase: 'day' },
];

function Vuelo({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const anns = ANNS.filter((a) => !a.lv || levelOk(a.lv, level));
  const [i, setI] = useState(-1);
  const [st, setSt] = useState<Record<Ctl, boolean>>({ cinturon: false, movil: false, persiana: false, respaldo: true, mesita: true, luz: true, esperar: false });
  const [doneNow, setDoneNow] = useState<Ctl[]>([]);
  const [shake, setShake] = useState(false);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const a = i >= 0 ? anns[i] : null;
  // persiana state: true = down; for the last announcement, need = up
  useEffect(() => { if (i >= 0 && anns[i].text.es.includes('turbulencias')) { setShake(true); const t = window.setTimeout(() => setShake(false), 4000); return () => window.clearTimeout(t); } }, [i]);
  const act = (c: Ctl) => {
    if (!a) return;
    sfx.click();
    const target: Record<Ctl, boolean> = { ...st };
    if (c !== 'esperar') target[c] = !st[c];
    const lastPersiana = a.text.es.includes('suban las persianas');
    if (!a.need.includes(c)) { setMistakes((m) => m + 1); setFb({ ok: false, p: p('Eso no es lo que pide el aviso. Escúchalo otra vez.', 'Հայտարարությունը դա չի խնդրում։ Նորից լսիր։') }); return; }
    // check direction
    const wantOn: Record<Ctl, boolean> = { cinturon: true, movil: true, persiana: !lastPersiana, respaldo: true, mesita: false, luz: false, esperar: true };
    if (c !== 'esperar' && target[c] !== wantOn[c]) { setFb({ ok: false, p: p('Al revés: mira el estado del control.', 'Հակառակը՝ նայիր կառավարման վիճակին։') }); setSt(target); return; }
    setSt(target);
    const dn = [...doneNow, c];
    setDoneNow(dn);
    if (a.need.every((n) => dn.includes(n))) {
      sfx.success();
      setFb({ ok: true, p: p('Correcto.', 'Ճիշտ է։') });
      window.setTimeout(() => {
        setDoneNow([]);
        if (i + 1 >= anns.length) setFinished(true);
        else setI(i + 1);
      }, 1400);
    }
  };
  const CTLS: { id: Ctl; icon: string; on: P; off: P }[] = [
    { id: 'cinturon', icon: '🔒', on: p('Cinturón abrochado', 'Գոտին ամրացված է'), off: p('Abrocharse el cinturón', 'Ամրացնել գոտին') },
    { id: 'movil', icon: '📱', on: p('Móvil en modo avión', 'Հեռախոսը ինքնաթիռի ռեժիմում'), off: p('Poner el móvil en modo avión', 'Հեռախոսը դնել ինքնաթիռի ռեժիմի') },
    { id: 'persiana', icon: '🪟', on: p('Persiana bajada', 'Վարագույրն իջեցված է'), off: p('Persiana subida', 'Վարագույրը բարձրացված է') },
    { id: 'luz', icon: '💡', on: p('Luz de lectura encendida', 'Ընթերցանության լույսը միացված է'), off: p('Luz de lectura apagada', 'Ընթերցանության լույսն անջատված է') },
    { id: 'respaldo', icon: '💺', on: p('Respaldo vertical', 'Թիկնակն ուղղահայաց է'), off: p('Respaldo reclinado', 'Թիկնակը թեքված է') },
    { id: 'mesita', icon: '🍽️', on: p('Mesita abierta', 'Սեղանիկը բաց է'), off: p('Mesita plegada', 'Սեղանիկը ծալված է') },
    { id: 'esperar', icon: '🧘🏻‍♀️', on: p('Permanecer sentada', 'Մնալ նստած'), off: p('Permanecer sentada', 'Մնալ նստած') },
  ];
  // starting state: seat reclined, table open (after the meal), light on
  useEffect(() => { setSt((s) => ({ ...s, respaldo: false, mesita: true, luz: true, persiana: true })); }, []);
  return (
    <div className="mission-play">
      <Steps total={anns.length} cur={Math.max(0, i)} />
      <div className={'flight-cabin ' + (a?.phase ?? 'day') + (shake ? ' shake' : '')}>
        <CabinWindow phase={a?.phase ?? 'day'} shade={st.persiana} />
        <div className={'seatbelt-sign ' + (i >= 0 && i < 3 ? 'on' : '')}>🔒 <T p={p('Abróchense el cinturón', 'Ամրացրեք գոտիները')} /></div>
        <div className={'reading-light ' + (st.luz ? 'on' : '')} />
        <div className="fc-girl"><Gayane wear={['jersey', 'pantalones', 'botas']} mood={st.persiana && !st.luz ? 'sleep' : 'happy'} /></div>
      </div>
      {i < 0 ? (
        <div className="task-box"><Instruction p={p('Durante el vuelo la tripulación da avisos. Escucha cada aviso y usa los controles de tu asiento.', 'Թռիչքի ընթացքում անձնակազմը հայտարարություններ է անում։ Լսիր յուրաքանչյուր հայտարարություն և օգտագործիր նստատեղիդ կառավարումը։')} icon="🎧" /><Btn label={p('Empezar el vuelo', 'Սկսել թռիչքը')} icon="✈" onClick={() => setI(0)} /></div>
      ) : (
        <div className="task-box">
          <Announcement key={i} text={a!.text} label={p('Aviso de la tripulación', 'Անձնակազմի հայտարարություն')} />
          <div className="controls">
            {CTLS.map((c) => (
              <button key={c.id} className={'ctl ' + (c.id !== 'esperar' && st[c.id] ? 'on' : '') + (doneNow.includes(c.id) ? ' ok' : '')} onClick={() => act(c.id)}>
                <span>{c.icon}</span><T p={c.id === 'esperar' ? c.on : st[c.id] ? c.on : c.off} />
              </button>
            ))}
          </div>
        </div>
      )}
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Has seguido todas las instrucciones. Estamos llegando a Lisboa.', 'Կատարեցիր բոլոր հրահանգները։ Հասնում ենք Լիսաբոն։')} />}
    </div>
  );
}

/* ===================================================================== */
/*  5. LLEGADA AL DESTINO                                                 */
/* ===================================================================== */
const BAGS = [
  { id: 'mine', color: '#6e1a33', tag: 'LIS · GAYANE' },
  { id: 'b1', color: '#6e1a33', tag: 'LIS · M. LÓPEZ' },
  { id: 'b2', color: '#1f2b46', tag: 'LIS · R. SILVA' },
  { id: 'b3', color: '#3a3440', tag: 'OPO · A. COSTA' },
  { id: 'b4', color: '#b08d6e', tag: 'LIS · J. PEREIRA' },
  { id: 'b5', color: '#6e1a33', tag: 'LIS · C. RUIZ' },
];
function Llegada({ done }: { done: Done }) {
  const [step, setStep] = useState(0); // 0 bye · 1 bags · 2 info · 3 taxi
  const [pos, setPos] = useState(0);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [have, setHave] = useState(false);
  const [finished, setFinished] = useState(false);
  const raf = useRef(0);
  useEffect(() => {
    if (step !== 1 || have) return;
    let last = performance.now();
    const loop = (t: number) => { setPos((x) => (x + (t - last) * 0.035) % 600); last = t; raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [step, have]);
  const bye: TNode[] = [{ id: 's', who: 'az', line: p('Gracias por volar con nosotros. ¡Que disfrute de Lisboa!', 'Շնորհակալություն մեզ հետ թռչելու համար։ Վայելեք Լիսաբոնը։'), opts: [
    { p: p('Gracias a ustedes. Hasta pronto.', 'Ձեզ շնորհակալություն։ Մինչ նոր հանդիպում։') },
    { p: p('Muchas gracias. Ha sido un vuelo muy agradable.', 'Շատ շնորհակալություն։ Շատ հաճելի թռիչք էր։'), lv: 'A2' },
    { p: p('Buenas noches.', 'Բարի գիշեր։'), ok: false, reply: p('Son las once de la mañana… ¡Buenos días y buen viaje!', 'Առավոտյան ժամը տասնմեկն է… Բարի լույս և բարի ճանապարհ։') },
  ] }];
  const info: TNode[] = [
    { id: 's', who: 'e', line: p('Buenos días. ¿En qué puedo ayudarle?', 'Բարի լույս։ Ինչո՞վ կարող եմ օգնել։'), opts: [
      { p: p('Buenos días. ¿Dónde está la parada de taxis, por favor?', 'Բարի լույս։ Որտե՞ղ է տաքսիների կանգառը, խնդրում եմ։') },
      { p: p('Disculpe, ¿cómo puedo ir al centro? ¿Hay taxis cerca?', 'Ներեցեք, ինչպե՞ս կարող եմ գնալ կենտրոն։ Մոտակայքում տաքսի կա՞։'), lv: 'A2' },
    ], next: 'r' },
    { id: 'r', who: 'e', line: p('Salga por la puerta tres y gire a la derecha. La parada está justo enfrente.', 'Դուրս եկեք երրորդ դռնով և թեքվեք աջ։ Կանգառը հենց դիմացն է։'), opts: [
      { p: p('Puerta tres y a la derecha. Muchas gracias.', 'Երրորդ դուռ և աջ։ Շատ շնորհակալություն։') },
      { p: p('Puerta trece y a la izquierda. Gracias.', 'Տասներեքերորդ դուռ և ձախ։ Շնորհակալություն։'), ok: false, reply: p('No, no: puerta tres, y después a la derecha.', 'Ոչ, ոչ՝ երրորդ դուռ, հետո աջ։') },
    ] },
  ];
  const taxi: TNode[] = [
    { id: 's', who: 't', line: p('Buenos días. ¿A dónde la llevo?', 'Բարի լույս։ Ու՞ր տանեմ ձեզ։'), opts: [
      { p: p('Al hotel Miramar, en la calle Augusta, número veinte, por favor.', 'Միրամար հյուրանոց, Աուգուստա փողոց, քսան համար, խնդրում եմ։') },
      { p: p('Al centro, al hotel Miramar.', 'Կենտրոն, Միրամար հյուրանոց։') },
      { p: p('Al aeropuerto, por favor.', 'Օդանավակայան, խնդրում եմ։'), ok: false, reply: p('Pero… ¡si ya estamos en el aeropuerto! ¿A dónde va?', 'Բայց… մենք արդեն օդանավակայանում ենք։ Ու՞ր եք գնում։') },
    ], next: 'p' },
    { id: 'p', who: 't', line: p('Muy bien. ¿Le meto la maleta en el maletero?', 'Շատ լավ։ Ճամպրուկը դնե՞մ բեռնախցիկում։'), opts: [{ p: p('Sí, por favor. Muchas gracias.', 'Այո, խնդրում եմ։ Շատ շնորհակալություն։') }], next: 'q' },
    { id: 'q', who: 't', lv: 'A2', line: p('¿Es la primera vez que viene a Lisboa?', 'Առաջի՞ն անգամ եք գալիս Լիսաբոն։'), opts: [
      { p: p('Sí, vengo por trabajo, pero espero tener tiempo para pasear.', 'Այո, եկել եմ աշխատանքով, բայց հուսով եմ՝ զբոսնելու ժամանակ կունենամ։') },
      { p: p('No, es la segunda vez. ¿Qué me recomienda visitar?', 'Ոչ, երկրորդ անգամն է։ Ի՞նչ եք խորհուրդ տալիս այցելել։'), reply: p('El barrio de Alfama, y coma unos pasteles de nata en Belém.', 'Ալֆամա թաղամասը, և Բելեմում կերեք պաշտեյշ դե նատա։') },
    ], next: 'c' },
    { id: 'c', who: 't', line: p('Ya hemos llegado. Son veinte euros.', 'Արդեն հասանք։ Քսան եվրո է։'), opts: [
      { p: p('Aquí tiene. ¿Me da un recibo, por favor?', 'Վերցրեք։ Կտա՞ք անդորրագիր, խնդրում եմ։'), reply: p('Claro, aquí tiene. ¡Que tenga una buena estancia!', 'Իհարկե, վերցրեք։ Հաճելի մնալ եմ մաղթում։') },
      { p: p('¿Puedo pagar con tarjeta?', 'Կարո՞ղ եմ քարտով վճարել։'), reply: p('Sí, sin problema. Acerque la tarjeta aquí.', 'Այո, խնդիր չկա։ Մոտեցրեք քարտը այստեղ։') },
    ] },
  ];
  const visible = BAGS.map((b, k) => ({ ...b, x: ((k * 100 + pos) % 600) - 60 }));
  return (
    <div className="mission-play">
      <Steps total={4} cur={step} />
      {step === 0 && <div className="task-box talk-with"><Person look={LOOKS.azafata} className="mini-person" /><Talk nodes={bye} people={{ az: AZ }} onEnd={(m) => (setMistakes((x) => x + m), setStep(1))} /></div>}
      {step === 1 && (
        <div className="task-box">
          <Instruction p={p('Busca tu maleta en la cinta: es granate y la etiqueta dice «LIS · GAYANE». Tócala cuando pase.', 'Գտիր քո ճամպրուկը ժապավենի վրա՝ մուգ կարմիր է, իսկ պիտակին գրված է «LIS · GAYANE»։ Հպիր, երբ անցնի։')} icon="🧳" />
          <div className="carousel">
            <div className="carousel-belt" />
            {!have && visible.map((b) => (
              <button key={b.id} className="cbag" style={{ transform: `translateX(${b.x}%)` }} onClick={() => {
                if (b.id === 'mine') { sfx.success(); setHave(true); setTrip({ bagCollected: true }); setFb({ ok: true, p: p('¡Es tu maleta!', 'Սա քո ճամպրուկն է։') }); window.setTimeout(() => setStep(2), 1500); }
                else { setMistakes((m) => m + 1); setFb({ ok: false, p: p(`Esa maleta es de otra persona: la etiqueta dice «${b.tag}».`, `Այդ ճամպրուկն ուրիշինն է՝ պիտակին գրված է «${b.tag}»։`) }); }
              }}>
                <SuitcaseArt color={b.color} tag />
                <span className="cbag-tag">{b.tag}</span>
              </button>
            ))}
            {have && <div className="cbag-have"><SuitcaseArt tag /> ✓</div>}
          </div>
        </div>
      )}
      {step === 2 && <div className="task-box talk-with"><Person look={LOOKS.agente} className="mini-person" /><Talk nodes={info} people={{ e: { name: p('Información', 'Տեղեկատու'), icon: 'i' } }} onEnd={(m) => (setMistakes((x) => x + m), setStep(3))} /></div>}
      {step === 3 && <div className="task-box talk-with"><Person look={LOOKS.taxista} className="mini-person" /><Talk nodes={taxi} people={{ t: { name: p('Taxista', 'Տաքսու վարորդ'), icon: '🚕' } }} onEnd={(m) => { setMistakes((x) => x + m); setFinished(true); }} /></div>}
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Gayane va en taxi a su hotel. ¡Bienvenida a Lisboa!', 'Գայանեն տաքսիով գնում է հյուրանոց։ Բարի գալուստ Լիսաբոն։')} />}
    </div>
  );
}
void Pay; void Drop; void Drag;
