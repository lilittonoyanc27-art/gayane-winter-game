import { useEffect, useMemo, useRef, useState } from 'react';
import { Btn, Feedback, Instruction, type Fb } from '../../components/UI';
import { Talk, type TNode } from '../../components/Talk';
import { Person, LOOKS } from '../../components/Person';
import { Gayane } from '../../components/Gayane';
import { Drag, Drop } from '../../components/DnD';
import { Announcement, Pay, type Mission } from '../../components/Life';
import { T, Phrase } from '../../core/translate';
import { speak } from '../../core/speech';
import { sfx } from '../../core/sound';
import { useGame } from '../../core/store';
import { levelOk, p, type P } from '../../core/types';
import { fmtEuro, pick } from '../../core/util';
import { Finish, LifeGrid, MissionGame, type Done } from './common';

const MISSIONS: Mission[] = [
  { id: 'billete', icon: '🎟️', title: p('Comprar el billete', 'Տոմս գնել'), desc: p('La máquina de billetes y el torno.', 'Տոմսերի ավտոմատը և պտտադուռը։') },
  { id: 'ruta', icon: '🗺️', title: p('Buscar la ruta', 'Գտնել երթուղին'), desc: p('Pregunta, mira el plano y haz transbordo.', 'Հարցրու, նայիր քարտեզին և փոխիր գիծը։') },
  { id: 'tranvia', icon: '🚋', title: p('Bajar en la parada correcta', 'Իջնել ճիշտ կանգառում'), desc: p('Escucha los anuncios del tranvía.', 'Լսիր տրամվայի հայտարարությունները։') },
];

export function City() {
  return (
    <MissionGame game="city" title={p('En la ciudad', 'Քաղաքում')} icon="🏙️" missions={MISSIONS}
      intro={<div className="place-intro"><Phrase p={p('Gayane se mueve por la ciudad en metro y en tranvía.', 'Գայանեն քաղաքում տեղաշարժվում է մետրոյով և տրամվայով։')} /></div>}
      render={(id, done) => (id === 'billete' ? <Ticket done={done} /> : id === 'ruta' ? <Route done={done} /> : <Tram done={done} />)} />
  );
}

/* ---------- 1. ticket machine ---------- */
const TICKETS = [
  { id: 'sencillo', name: p('Billete sencillo', 'Միակողմանի տոմս'), price: 1.8 },
  { id: 'idavuelta', name: p('Ida y vuelta', 'Գնալ-վերադառնալ'), price: 3.4 },
  { id: 'bono', name: p('Bono de 10 viajes', '10 ուղևորության աբոնեմենտ'), price: 12.2 },
  { id: 'dia', name: p('Tarjeta de 24 horas', '24 ժամվա քարտ'), price: 8.4 },
];
function Ticket({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const goal = useMemo(() => pick([
    { t: p('Solo vas al museo. No vas a volver en metro.', 'Միայն թանգարան ես գնում։ Մետրոյով չես վերադառնալու։'), ok: 'sencillo' },
    { t: p('Vas al centro y vuelves al hotel por la tarde.', 'Գնում ես կենտրոն և երեկոյան վերադառնում հյուրանոց։'), ok: 'idavuelta' },
    ...(levelOk('A2', level) ? [{ t: p('Hoy vas a hacer seis o siete viajes por toda la ciudad.', 'Այսօր վեց-յոթ ուղևորություն ես անելու ամբողջ քաղաքով։'), ok: 'dia' }] : []),
    ...(levelOk('B1', level) ? [{ t: p('Te quedas una semana y vas a usar el metro unas diez veces en total.', 'Մեկ շաբաթ ես մնում և ընդհանուր առմամբ մոտ տասը անգամ մետրո ես օգտվելու։'), ok: 'bono' }] : []),
  ]), [level]);
  const [phase, setPhase] = useState<'choose' | 'pay' | 'print' | 'gate'>('choose');
  const [sel, setSel] = useState<string | null>(null);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [open, setOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const t = TICKETS.find((x) => x.id === sel);
  const pass = () => { if (open) return; sfx.ding(); setOpen(true); setPhase('gate'); window.setTimeout(() => setFinished(true), 1600); };
  return (
    <div className="mission-play">
      <Instruction p={goal.t} icon="🎯" />
      <LifeGrid art={
        <div className="metro-hall">
          <div className="mh-sign">Ⓜ METRO</div>
          <div className="machine">
            <div className="mc-screen">
              {phase === 'choose' && <><b><T p={p('Elija su billete', 'Ընտրեք ձեր տոմսը')} /></b>{TICKETS.map((x) => (
                <button key={x.id} className={'mc-opt ' + (sel === x.id ? 'on' : '')} onClick={() => (sfx.click(), setSel(x.id))}><T p={x.name} /><span>{fmtEuro(x.price)}</span></button>
              ))}</>}
              {phase === 'pay' && t && <><b><T p={t.name} /></b><span><T p={p('Introduzca el importe', 'Մուտքագրեք գումարը')} />: {fmtEuro(t.price)}</span></>}
              {(phase === 'print' || phase === 'gate') && <b>✓ <T p={p('Recoja su billete', 'Վերցրեք ձեր տոմսը')} /></b>}
            </div>
            <div className="mc-slot">{phase === 'print' && <Drag kind="ticket" id="t" className="ticket-paper" onTap={pass}>🎟️ <small>{t?.name.es}</small></Drag>}</div>
          </div>
          <Drop id="torno" className={'turnstile ' + (open ? 'open' : '') + (phase === 'print' ? ' want' : '')} accept={(pl) => pl.kind === 'ticket'} onDrop={pass}>
            <i /><i /><small><T p={p('Torno', 'Պտտադուռ')} /></small>
          </Drop>
          <div className={'mh-girl ' + (open ? 'through' : '')}><Gayane wear={['abrigo', 'bufanda', 'pantalones', 'botas']} walking={open} /></div>
        </div>
      }>
        {phase === 'choose' && (
          <div className="task-box">
            <Instruction p={p('Elige en la pantalla el billete más adecuado.', 'Էկրանին ընտրիր ամենահարմար տոմսը։')} icon="🖥️" auto={false} />
            <Btn label={p('Aceptar', 'Հաստատել')} icon="✓" disabled={!sel} onClick={() => {
              if (sel !== goal.ok) { setMistakes((m) => m + 1); setFb({ ok: false, p: p('Ese billete no es el mejor para tu plan. Lee otra vez la situación.', 'Այդ տոմսը լավագույնը չէ քո պլանի համար։ Նորից կարդա իրավիճակը։') }); return; }
              setPhase('pay');
            }} />
          </div>
        )}
        {phase === 'pay' && t && <Pay total={t.price} onPaid={() => { sfx.success(); setPhase('print'); }} />}
        {phase === 'print' && <div className="task-box pop-in"><Instruction p={p('Coge el billete y pásalo por el torno.', 'Վերցրու տոմսը և անցկացրու պտտադռնով։')} icon="🎟️" /></div>}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Billete comprado. ¡Al andén!', 'Տոմսը գնված է։ Դեպի կառամատույց։')} />}
    </div>
  );
}

/* ---------- 2. route ---------- */
type St = { id: string; name: string; x: number; y: number; lines: string[] };
const STATIONS: St[] = [
  { id: 'norte', name: 'Estación Norte', x: 12, y: 18, lines: ['L1'] },
  { id: 'opera', name: 'Ópera', x: 30, y: 36, lines: ['L1'] },
  { id: 'plaza', name: 'Plaza Mayor', x: 50, y: 52, lines: ['L1', 'L2'] },
  { id: 'museo', name: 'Museo', x: 72, y: 70, lines: ['L1'] },
  { id: 'uni', name: 'Universidad', x: 22, y: 80, lines: ['L2'] },
  { id: 'puerto', name: 'Puerto', x: 76, y: 30, lines: ['L2'] },
  { id: 'hospital', name: 'Hospital', x: 90, y: 14, lines: ['L2'] },
];
const ROUTE = ['norte', 'opera', 'plaza', 'puerto'];
function Route({ done }: { done: Done }) {
  const [phase, setPhase] = useState<'ask' | 'map' | 'end'>('ask');
  const [path, setPath] = useState<string[]>(['norte']);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const ask: TNode[] = [
    { id: 's', who: 'v', line: p('¿Sí? Dígame.', 'Այո՞։ Ասեք։'), opts: [
      { p: p('Perdone, ¿cómo puedo ir al Puerto en metro?', 'Ներեցեք, ինչպե՞ս կարող եմ մետրոյով գնալ Նավահանգիստ։'), next: 'r' },
      { p: p('Disculpe, ¿sabe si hay que hacer transbordo para ir al Puerto?', 'Ներեցեք, գիտե՞ք՝ Նավահանգիստ գնալու համար պե՞տք է գիծ փոխել։'), lv: 'B1', next: 'r' },
      { p: p('¿Dónde está mi hotel?', 'Որտե՞ղ է իմ հյուրանոցը։'), ok: false, reply: p('Uy, no sé cuál es su hotel… ¿A dónde quiere ir?', 'Ու՜յ, չգիտեմ՝ որն է ձեր հյուրանոցը… Ու՞ր եք ուզում գնալ։') },
    ] },
    { id: 'r', who: 'v', line: p('Coja la línea uno, la roja, hasta Plaza Mayor. Allí cambie a la línea dos, la azul, y baje en Puerto.', 'Նստեք մեկ գիծը՝ կարմիրը, մինչև Պլասա Մայոր։ Այնտեղ փոխեք երկու գծի՝ կապույտի, և իջեք Նավահանգիստ կանգառում։'), opts: [
      { p: p('Línea uno hasta Plaza Mayor y luego la dos. Muchas gracias.', 'Մեկ գիծը մինչև Պլասա Մայոր, հետո երկուսը։ Շատ շնորհակալություն։') },
      { p: p('Perdone, ¿puede repetir más despacio?', 'Ներեցեք, կարո՞ղ եք կրկնել ավելի դանդաղ։'), reply: p('Claro: línea uno… hasta Plaza Mayor… y después, línea dos hasta Puerto.', 'Իհարկե՝ մեկ գիծ… մինչև Պլասա Մայոր… հետո՝ երկու գիծ մինչև Նավահանգիստ։') },
    ] },
  ];
  const tap = (s: St) => {
    const last = STATIONS.find((x) => x.id === path[path.length - 1])!;
    const nextOk = ROUTE[path.length];
    if (path.includes(s.id)) return;
    if (s.id !== nextOk) {
      setMistakes((m) => m + 1);
      setFb({ ok: false, p: last.id === 'plaza' && s.lines.includes('L1') ? p('En Plaza Mayor tienes que cambiar a la línea azul.', 'Պլասա Մայորում պետք է փոխես կապույտ գծի։') : p('Esa no es la siguiente estación de tu ruta.', 'Դա քո երթուղու հաջորդ կայարանը չէ։') });
      return;
    }
    sfx.pop();
    const np = [...path, s.id];
    setPath(np);
    if (s.id === 'plaza') setFb({ ok: true, p: p('Transbordo: de la línea uno a la línea dos.', 'Փոխանցում՝ մեկ գծից երկու գիծ։') });
    if (np.length === ROUTE.length) { sfx.success(); window.setTimeout(() => setFinished(true), 1200); }
  };
  return (
    <div className="mission-play">
      <Instruction p={p('Estás en Estación Norte. Quieres ir al Puerto.', 'Գտնվում ես Հյուսիսային կայարանում։ Ուզում ես գնալ Նավահանգիստ։')} icon="🎯" />
      <LifeGrid art={
        <div className="metro-map">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mm-lines">
            <polyline points="12,18 30,36 50,52 72,70" className="l1" />
            <polyline points="22,80 50,52 76,30 90,14" className="l2" />
            {path.length > 1 && <polyline points={path.map((id) => { const s = STATIONS.find((x) => x.id === id)!; return `${s.x},${s.y}`; }).join(' ')} className="mine" />}
          </svg>
          {STATIONS.map((s) => (
            <button key={s.id} className={'mm-st ' + (path.includes(s.id) ? 'on' : '') + (s.lines.length > 1 ? ' hub' : '')} style={{ left: `calc(6% + ${s.x * 0.88}%)`, top: `calc(6% + ${s.y * 0.88}%)` }} disabled={phase !== 'map'} onClick={() => tap(s)}>
              <i /><span>{s.name}</span>
            </button>
          ))}
          <div className="mm-legend"><span className="lg1">L1</span> <T p={p('roja', 'կարմիր')} /> · <span className="lg2">L2</span> <T p={p('azul', 'կապույտ')} /></div>
        </div>
      }>
        {phase === 'ask' && <div className="talk-with"><Person look={LOOKS.pasajero} className="mini-person" /><Talk nodes={ask} people={{ v: { name: p('Un señor', 'Մի պարոն'), icon: '🧔🏻' } }} onEnd={(m) => (setMistakes(m), setPhase('map'))} /></div>}
        {phase === 'map' && <div className="task-box pop-in"><Instruction p={p('Toca en el plano las estaciones de tu ruta, en orden.', 'Քարտեզին հպիր քո երթուղու կայարաններին՝ հերթականությամբ։')} icon="🗺️" auto={false} /><div className="muted">{path.map((id) => STATIONS.find((x) => x.id === id)!.name).join(' → ')}</div></div>}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Ruta correcta: línea uno, transbordo en Plaza Mayor y línea dos.', 'Ճիշտ երթուղի՝ մեկ գիծ, փոխանցում Պլասա Մայորում և երկու գիծ։')} />}
    </div>
  );
}

/* ---------- 3. tram ---------- */
const STOPS = ['Catedral', 'Mercado', 'Teatro Real', 'Museo de Arte', 'Jardín Botánico', 'Puerto'];
function Tram({ done }: { done: Done }) {
  const target = useMemo(() => pick(['Museo de Arte', 'Jardín Botánico', 'Teatro Real']), []);
  const [i, setI] = useState(-1);
  const [requested, setRequested] = useState(false);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const timer = useRef<number>();
  const stop = i >= 0 ? STOPS[i] : null;
  const ann: P | null = stop ? p(`Próxima parada: ${stop}.`, `Հաջորդ կանգառը՝ ${stop}։`) : null;
  useEffect(() => {
    if (i < 0 || finished) return;
    timer.current = window.setTimeout(() => {
      if (STOPS[i] === target) {
        if (requested) { sfx.ding(); setFinished(true); return; }
        setMistakes((m) => m + 1);
        setFb({ ok: false, p: p(`¡Te has pasado tu parada! Era ${target}. Vuelve a intentarlo en la siguiente vuelta.`, `Անցար քո կանգառը։ Դա ${target}-ն էր։ Նորից փորձիր հաջորդ շրջանում։`) });
      }
      setRequested(false);
      setI((x) => (x + 1) % STOPS.length);
    }, 6500);
    return () => window.clearTimeout(timer.current);
  }, [i, requested, finished]);
  return (
    <div className="mission-play">
      <Instruction p={p(`Vas al ${target}. Escucha los anuncios y pulsa «Solicitar parada» cuando anuncien tu parada.`, `Գնում ես ${target}։ Լսիր հայտարարությունները և սեղմիր «Պահանջել կանգառ», երբ հայտարարեն քո կանգառը։`)} icon="🚋" />
      <LifeGrid art={
        <div className={'tram ' + (i >= 0 ? 'moving' : '')}>
          <div className="tram-window"><div className="tram-city" /></div>
          <div className={'tram-stop-light ' + (requested ? 'on' : '')}><T p={p('Parada solicitada', 'Կանգառը պահանջված է')} /></div>
          <div className="tram-girl"><Gayane wear={['abrigo', 'bufanda', 'pantalones', 'botas']} /></div>
        </div>
      }>
        {i < 0 ? <Btn label={p('Subir al tranvía', 'Նստել տրամվայ')} icon="🚋" onClick={() => setI(0)} /> : (
          <div className="task-box">
            {ann && <Announcement key={i} text={ann} label={p('Anuncio del tranvía', 'Տրամվայի հայտարարություն')} />}
            <Btn label={p('Solicitar parada', 'Պահանջել կանգառ')} icon="🔔" variant={requested ? 'soft' : 'primary'} onClick={() => {
              if (requested) return;
              sfx.ding();
              if (stop !== target) { setMistakes((m) => m + 1); setFb({ ok: false, p: p(`Todavía no: esta parada es ${stop}.`, `Դեռ ոչ՝ այս կանգառը ${stop}-ն է։`) }); return; }
              setRequested(true);
            }} />
          </div>
        )}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p(`Has bajado en ${target}.`, `Իջար ${target}-ում։`)} />}
    </div>
  );
}
void speak;
