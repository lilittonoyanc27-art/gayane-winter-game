import { useEffect, useMemo, useRef, useState } from 'react';
import { Btn, Feedback, Instruction, Reward, SceneHeader, Steps, go, starsFor, type Fb } from '../../components/UI';
import { Stage, type Spot } from '../../components/Stage';
import { Talk, type TNode, type Who } from '../../components/Talk';
import { Person, LOOKS } from '../../components/Person';
import { Gayane, type ClothId } from '../../components/Gayane';
import { Drag, Drop } from '../../components/DnD';
import { Announcement, InfoCard, MissionMenu, Pay, type Mission } from '../../components/Life';
import { T, Phrase } from '../../core/translate';
import { speak } from '../../core/speech';
import { sfx } from '../../core/sound';
import { setTrip, useGame } from '../../core/store';
import { levelOk, p, type P } from '../../core/types';
import { fmtEuro, pick, shuffle } from '../../core/util';
import { BOARD, FLIGHT } from './flight';

export const TRAVEL_WEAR: ClothId[] = ['abrigo', 'bufanda', 'pantalones', 'botas'];

const MISSIONS: Mission[] = [
  { id: 'llegada', icon: '🚕', title: p('Llegada al aeropuerto', 'Ժամանում օդանավակայան'), desc: p('Terminal, panel de salidas y mostrador.', 'Տերմինալ, մեկնումների ցուցատախտակ և գրանցման կետ։') },
  { id: 'facturacion', icon: '🧳', title: p('Facturación del equipaje', 'Ուղեբեռի գրանցում'), desc: p('Documentos, báscula y tarjeta de embarque.', 'Փաստաթղթեր, կշեռք և նստեցման կտրոն։') },
  { id: 'seguridad', icon: '🛃', title: p('Control de seguridad', 'Անվտանգության ստուգում'), desc: p('Bandejas, líquidos y el arco detector.', 'Սկուտեղներ, հեղուկներ և դետեկտորային շրջանակ։') },
  { id: 'puerta', icon: '🛫', title: p('Puerta de embarque', 'Նստեցման դարպաս'), desc: p('Escucha los anuncios: la puerta cambia.', 'Լսիր հայտարարությունները՝ դարպասը փոխվում է։') },
  { id: 'cafe', icon: '☕', title: p('Café del aeropuerto', 'Օդանավակայանի սրճարան'), desc: p('Pide, cambia el pedido y paga.', 'Պատվիրիր, փոխիր պատվերը և վճարիր։') },
];

export function Airport() {
  const [m, setM] = useState<string | null>(null);
  const [k, setK] = useState(0);
  const trip = useGame((s) => s.trip);
  const done = (id: string, next?: string) => ({ id: 'airport:' + id, onNext: () => (setM(next ?? null), setK((x) => x + 1)), onAgain: () => setK((x) => x + 1) });
  const title = m ? MISSIONS.find((x) => x.id === m)!.title : p('El aeropuerto', 'Օդանավակայան');
  return (
    <div className="scene scene-airport">
      <SceneHeader title={title} icon="✈" back="title" right={m ? <button className="hdr-btn" onClick={() => setM(null)}>☰ <T p={p('Misiones', 'Առաքելություններ')} /></button> : undefined} />
      {!m && (
        <MissionMenu game="airport" missions={MISSIONS} onPick={(id) => (setM(id), setK((x) => x + 1))}
          intro={
            <div className="travel-intro">
              <div className="ti-art"><AirportBackdrop mini /></div>
              <div className="ti-text">
                <Phrase p={p('Hoy Gayane vuela de Madrid a Lisboa. Tiene que llegar al aeropuerto, facturar, pasar el control y embarcar a tiempo.', 'Այսօր Գայանեն թռչում է Մադրիդից Լիսաբոն։ Նա պետք է հասնի օդանավակայան, գրանցի ուղեբեռը, անցնի ստուգումը և ժամանակին նստի ինքնաթիռ։')} />
                <InfoCard title={p('Tu vuelo', 'Քո չվերթը')} rows={[[p('Vuelo', 'Չվերթ'), FLIGHT.code], [p('Destino', 'Ուղղություն'), 'Lisboa'], [p('Salida', 'Մեկնում'), FLIGHT.dep], [p('Terminal', 'Տերմինալ'), FLIGHT.terminal]]} />
                <div className="trip-status">
                  <span className={trip.bagChecked ? 'ok' : ''}>🧳 <T p={p('Maleta facturada', 'Ճամպրուկը գրանցված է')} /></span>
                  <span className={trip.boardingPass ? 'ok' : ''}>🎫 <T p={p('Tarjeta de embarque', 'Նստեցման կտրոն')} /></span>
                  <span className={trip.passedSecurity ? 'ok' : ''}>🛃 <T p={p('Control pasado', 'Ստուգումն անցած է')} /></span>
                </div>
              </div>
            </div>
          }
          extra={<div className="row-center"><Btn label={p('Subir al avión', 'Նստել ինքնաթիռ')} icon="🛫" onClick={() => go('plane')} /></div>}
        />
      )}
      {m === 'llegada' && <Llegada key={k} done={done('llegada', 'facturacion')} />}
      {m === 'facturacion' && <Facturacion key={k} done={done('facturacion', 'seguridad')} />}
      {m === 'seguridad' && <Seguridad key={k} done={done('seguridad', 'puerta')} />}
      {m === 'puerta' && <Puerta key={k} done={done('puerta', 'cafe')} />}
      {m === 'cafe' && <Cafe key={k} done={done('cafe')} />}
    </div>
  );
}

type Done = { id: string; onNext: () => void; onAgain: () => void };
function Finish({ done, mistakes, msg }: { done: Done; mistakes: number; msg: P; again?: () => void }) {
  return <Reward id={done.id} stars={starsFor(mistakes)} message={msg} onAgain={done.onAgain} onNext={done.onNext} />;
}

/* ===================================================================== */
/*  ART                                                                  */
/* ===================================================================== */
export function AirportBackdrop({ mini }: { mini?: boolean }) {
  return (
    <div className={'ap-backdrop ' + (mini ? 'mini' : '')} aria-hidden>
      <div className="ap-windows">
        {Array.from({ length: mini ? 4 : 14 }, (_, i) => <div key={i} className="ap-win" />)}
      </div>
      <svg className="ap-plane p1" viewBox="0 0 220 60"><PlaneShape /></svg>
      {!mini && <svg className="ap-plane p2" viewBox="0 0 220 60"><PlaneShape /></svg>}
      <div className="ap-floor" />
    </div>
  );
}
export function PlaneShape({ color = '#fff' }: { color?: string }) {
  return (
    <g>
      <path d="M10 34 Q12 26 30 26 L170 24 Q200 24 214 32 Q200 40 170 40 L30 40 Q12 40 10 34 Z" fill={color} stroke="#c9ccd6" />
      <path d="M90 32 L130 32 L150 58 L132 58 Z" fill="#dfe3ea" />
      <path d="M96 26 L128 26 L140 6 L126 6 Z" fill="#dfe3ea" />
      <path d="M18 28 L30 26 L22 6 L12 8 Z" fill="#6e1a33" />
      <rect x="40" y="29" width="120" height="3" rx="1.5" fill="#1f2b46" opacity=".35" />
      <path d="M196 30 L206 31" stroke="#1f2b46" strokeWidth="3" />
    </g>
  );
}
function Sign({ children, tone = 'navy' }: { children: React.ReactNode; tone?: 'navy' | 'gold' | 'wine' }) {
  return <div className={'ap-sign tone-' + tone}>{children}</div>;
}
function Counter({ n, flight }: { n: number; flight?: string }) {
  return (
    <div className="ap-counter">
      <div className="apc-screen"><b>{n}</b><span>{flight}</span></div>
      <div className="apc-desk" />
      <div className="apc-belt" />
    </div>
  );
}

/* ===================================================================== */
/*  1. LLEGADA                                                            */
/* ===================================================================== */
const COUNTERS = [10, 11, 12, 13, 14, 15, 16, 17, 18];
const COUNTER_FLIGHT: Record<number, string> = { 10: 'Roma', 11: 'Roma', 12: 'Roma', 13: '—', 14: 'Lisboa', 15: 'Lisboa', 16: 'Lisboa', 17: 'Viena', 18: 'Viena' };

function Llegada({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const [step, setStep] = useState(0); // 0 terminal · 1 board · 2 questions · 3 direction · 4 counter · 5 done
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [board, setBoard] = useState(false);
  const [q, setQ] = useState(0);
  const [finished, setFinished] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const wrong = (ph: P) => { setMistakes((m) => m + 1); setFb({ ok: false, p: ph }); };
  const right = (ph: P) => setFb({ ok: true, p: ph });

  const QUESTIONS = useMemo(() => {
    const all = [
      { q: p('¿A qué hora sale tu vuelo?', 'Ժամը քանիսի՞ն է մեկնում քո չվերթը։'), a: ['10:45', '10:15', '11:00'], ok: '10:45' },
      { q: p('¿En qué mostradores se factura?', 'Ո՞ր կետերում է կատարվում գրանցումը։'), a: ['14–16', '10–12', '24–26'], ok: '14–16' },
      { q: p('¿Hay otro vuelo a Lisboa? ¿De qué compañía es el tuyo?', 'Լիսաբոն այլ չվերթ կա՞։ Ո՞ր ընկերությանն է քոնը։'), a: ['AU 482', 'TL 590', 'SR 731'], ok: 'AU 482', lv: 'A2' as const },
      { q: p('El vuelo a Roma está retrasado. ¿Afecta a tu viaje?', 'Հռոմի չվերթն ուշանում է։ Դա ազդո՞ւմ է քո ճամփորդության վրա։'), a: ['No, mi vuelo sale a la hora.', 'Sí, mi vuelo también se retrasa.', 'Mi vuelo está cancelado.'], ok: 'No, mi vuelo sale a la hora.', lv: 'B1' as const },
    ];
    return all.filter((x) => !x.lv || levelOk(x.lv, level));
  }, [level]);

  const TASKS: P[] = [
    p('Tu vuelo a Lisboa es internacional. Busca la terminal correcta y entra.', 'Լիսաբոնի չվերթդ միջազգային է։ Գտիր ճիշտ տերմինալը և մտիր։'),
    p('Busca el panel de salidas y encuentra tu vuelo, el AU 482.', 'Գտիր մեկնումների ցուցատախտակը և գտիր քո չվերթը՝ AU 482։'),
    p('Comprueba la información de tu vuelo.', 'Ստուգիր քո չվերթի տեղեկությունները։'),
    p('¿Hacia dónde vas? Mira los carteles de facturación.', 'Ո՞ւր ես գնում։ Նայիր գրանցման ցուցանակներին։'),
    p('Ve al mostrador de tu vuelo: del 14 al 16.', 'Գնա քո չվերթի գրանցման կետ՝ 14-ից 16։'),
  ];

  const spots: Spot[] = [
    { id: 't1', x: 20, bottom: 14, label: p('Terminal 1 · Vuelos nacionales', 'Տերմինալ 1 · Ներքին չվերթներ'), art: <Sign>T1</Sign>, onArrive: () => step === 0 && wrong(p('La Terminal 1 es para vuelos nacionales. Tu vuelo es internacional.', 'Տերմինալ 1-ը ներքին չվերթների համար է։ Քո չվերթը միջազգային է։')) },
    { id: 't2', x: 46, bottom: 14, label: p('Terminal 2 · Vuelos internacionales', 'Տերմինալ 2 · Միջազգային չվերթներ'), art: <Sign tone="wine">T2</Sign>, onArrive: () => { if (step === 0) { sfx.whoosh(); setDoorsOpen(true); right(p('Perfecto: Terminal 2, vuelos internacionales.', 'Կատարյալ է՝ Տերմինալ 2, միջազգային չվերթներ։')); setStep(1); } } },
    { id: 'board', x: 82, bottom: 30, label: p('Panel de salidas', 'Մեկնումների ցուցատախտակ'), art: <div className="ap-board"><div className="apb-title">SALIDAS · DEPARTURES</div>{BOARD.slice(0, 5).map((r) => <div key={r.code} className="apb-row"><span>{r.time}</span><span>{r.city.es}</span><span>{r.code}</span></div>)}</div>, onArrive: () => { if (step >= 1) setBoard(true); else wrong(p('Primero entra en la terminal correcta.', 'Նախ մտիր ճիշտ տերմինալ։')); } },
    { id: 'dirL', x: 112, bottom: 46, label: p('← Facturación 1–12', '← Գրանցում 1–12'), art: <Sign tone="gold">← 1–12</Sign>, onArrive: () => step === 3 && wrong(p('Por ahí están los mostradores del 1 al 12. Tú necesitas el 14.', 'Այնտեղ 1-12 կետերն են։ Քեզ պետք է 14-ը։')) },
    { id: 'dirR', x: 124, bottom: 46, label: p('Facturación 13–24 →', 'Գրանցում 13–24 →'), art: <Sign tone="gold">13–24 →</Sign>, onArrive: () => { if (step === 3) { right(p('Eso es: a la derecha, mostradores del 13 al 24.', 'Այդպես է՝ աջ, 13-ից 24 կետերը։')); setStep(4); } } },
    ...COUNTERS.map((n, i): Spot => ({
      id: 'c' + n, x: 140 + i * 13, bottom: 12, label: p('Mostrador ' + n, 'Կետ ' + n), art: <Counter n={n} flight={COUNTER_FLIGHT[n]} />,
      onArrive: () => {
        if (step < 4) return wrong(p('Antes comprueba tu vuelo en el panel de salidas.', 'Նախ ստուգիր չվերթդ մեկնումների ցուցատախտակին։'));
        if (n >= 14 && n <= 16) { right(p('¡Este es tu mostrador! Vuelo AU 482 a Lisboa.', 'Սա քո կետն է։ AU 482 չվերթ դեպի Լիսաբոն։')); setStep(5); window.setTimeout(() => setFinished(true), 2200); }
        else wrong(p(`Disculpe, este mostrador es para el vuelo a ${COUNTER_FLIGHT[n] === '—' ? 'otro destino' : COUNTER_FLIGHT[n]}. El suyo es el 14, 15 o 16.`, `Ներեցեք, այս կետը ${COUNTER_FLIGHT[n] === '—' ? 'այլ ուղղության' : COUNTER_FLIGHT[n] + 'ի'} չվերթի համար է։ Ձերը 14, 15 կամ 16-ն է։`));
      },
    })),
  ];

  return (
    <div className="mission-play">
      <Steps total={5} cur={step} />
      {step < 5 && <Instruction p={TASKS[Math.min(step, 4)]} icon="🧭" />}
      <Stage width={260} startX={6} wear={TRAVEL_WEAR} holding="🧳" spots={spots} className="stage-airport"
        bg={<><AirportBackdrop /><div className={'ap-doors ' + (doorsOpen ? 'open' : '')}><i /><i /></div></>} />
      {board && (
        <div className="modal-wrap" onClick={() => setBoard(false)}>
          <div className="modal wide pop-in" onClick={(e) => e.stopPropagation()}>
            <h2><T p={p('Salidas', 'Մեկնումներ')} /></h2>
            {step === 1 ? <T p={p('Toca la fila de tu vuelo: AU 482 a Lisboa.', 'Հպիր քո չվերթի տողին՝ AU 482 դեպի Լիսաբոն։')} className="muted" /> : null}
            <FlightBoard onRow={(code) => {
              if (step !== 1) return;
              if (code === FLIGHT.code) { right(p('¡Ahí está tu vuelo!', 'Ահա քո չվերթը։')); setStep(2); }
              else wrong(code === 'TL 590' ? p('Ese también va a Lisboa, pero es otro vuelo: TL 590. El tuyo es el AU 482.', 'Այն նույնպես Լիսաբոն է գնում, բայց ուրիշ չվերթ է՝ TL 590։ Քոնը AU 482-ն է։') : p('Ese no es tu vuelo. Busca el AU 482.', 'Դա քո չվերթը չէ։ Փնտրիր AU 482-ը։'));
            }} />
            {step === 2 && q < QUESTIONS.length && (
              <div className="quiz pop-in" key={q}>
                <Phrase p={QUESTIONS[q].q} />
                <div className="choices">
                  {shuffle(QUESTIONS[q].a).map((a) => (
                    <button key={a} className="choice" onClick={() => {
                      if (a === QUESTIONS[q].ok) { sfx.success(); if (q + 1 >= QUESTIONS.length) { setStep(3); setBoard(false); right(p('Todo comprobado. Ahora busca los mostradores.', 'Ամեն ինչ ստուգված է։ Հիմա գտիր գրանցման կետերը։')); } else setQ(q + 1); }
                      else wrong(p('Mira otra vez la fila del AU 482.', 'Նորից նայիր AU 482-ի տողին։'));
                    }}>{a.length > 6 ? <T p={{ es: a, hy: a === 'No, mi vuelo sale a la hora.' ? 'Ոչ, իմ չվերթը ժամանակին է մեկնում։' : a === 'Sí, mi vuelo también se retrasa.' ? 'Այո, իմ չվերթը նույնպես ուշանում է։' : 'Իմ չվերթը չեղարկված է։' }} /> : a}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="modal-actions"><Btn label={p('Cerrar', 'Փակել')} variant="soft" small onClick={() => setBoard(false)} /></div>
          </div>
        </div>
      )}
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Has encontrado tu mostrador. ¡Ahora a facturar!', 'Գտար քո գրանցման կետը։ Հիմա՝ գրանցման։')} />}
    </div>
  );
}

export function FlightBoard({ onRow, highlightGate }: { onRow?: (code: string) => void; highlightGate?: string }) {
  return (
    <div className="fboard" role="table">
      <div className="fb-row head">
        <T p={p('Hora', 'Ժամ')} /><T p={p('Destino', 'Ուղղություն')} /><T p={p('Vuelo', 'Չվերթ')} /><T p={p('Terminal', 'Տերմինալ')} /><T p={p('Mostrador', 'Գրանցում')} /><T p={p('Puerta', 'Դարպաս')} /><T p={p('Estado', 'Կարգավիճակ')} />
      </div>
      {BOARD.map((r) => (
        <div key={r.code} className={'fb-row ' + (onRow ? 'click' : '')} onClick={() => onRow?.(r.code)} role="row">
          <span>{r.time}</span><T p={r.city} /><span>{r.code}</span><span>{r.term}</span><span>{r.desk}</span>
          <span className={highlightGate && r.code === FLIGHT.code ? 'blink' : ''}>{highlightGate && r.code === FLIGHT.code ? highlightGate : r.gate}</span>
          <T p={r.st} className={'st-' + r.st.es.replace(/\s/g, '')} />
        </div>
      ))}
    </div>
  );
}

/* ===================================================================== */
/*  2. FACTURACIÓN                                                        */
/* ===================================================================== */
const AGENT: Record<string, Who> = { a: { name: p('Agente de facturación', 'Գրանցման աշխատակցուհի'), icon: '👩🏻‍💼' } };

const F_S1: TNode[] = [
  { id: 's', who: 'a', line: p('Buenos días. ¿Me permite su pasaporte y su billete?', 'Բարի լույս։ Կտա՞ք ձեր անձնագիրը և տոմսը։'), opts: [
    { p: p('Sí, por supuesto. Aquí los tiene.', 'Այո, իհարկե։ Ահա դրանք։') },
    { p: p('Claro. El billete lo tengo en el móvil.', 'Իհարկե։ Տոմսը հեռախոսիս մեջ է։'), lv: 'A2' },
    { p: p('No, gracias.', 'Ոչ, շնորհակալություն։'), ok: false, reply: p('Lo necesito para hacer la facturación, señora.', 'Դա ինձ պետք է գրանցում կատարելու համար, տիկին։') },
    { p: p('Quiero un café.', 'Սուրճ եմ ուզում։'), ok: false, reply: p('La cafetería está después del control. Primero necesito su documentación, por favor.', 'Սրճարանը ստուգումից հետո է։ Նախ ինձ պետք են ձեր փաստաթղթերը, խնդրում եմ։') },
  ] },
];
const F_S2: TNode[] = [
  { id: 's', who: 'a', line: p('Gracias. ¿Viaja usted sola?', 'Շնորհակալություն։ Միայնա՞կ եք ճամփորդում։'), opts: [
    { p: p('Sí, viajo sola.', 'Այո, միայնակ եմ ճամփորդում։') },
    { p: p('Sí, hoy viajo sola por trabajo.', 'Այո, այսօր միայնակ եմ ճամփորդում աշխատանքի համար։'), lv: 'B1' },
    { p: p('Viajo a las diez.', 'Ճամփորդում եմ ժամը տասին։'), ok: false, reply: p('Perdone, le pregunto si viaja acompañada o sola.', 'Ներեցեք, հարցնում եմ՝ ուղեկցությամբ եք ճամփորդում, թե միայնակ։') },
  ], next: 'n' },
  { id: 'n', who: 'a', line: p('¿Cuántas maletas va a facturar?', 'Քանի՞ ճամպրուկ եք հանձնելու։'), opts: [
    { p: p('Solo una maleta.', 'Միայն մեկ ճամպրուկ։') },
    { p: p('Una, esta de aquí. La mochila la llevo conmigo.', 'Մեկ՝ այս մեկը։ Ուսապարկը տանում եմ ինձ հետ։'), lv: 'A2' },
    { p: p('Tengo una mochila de mano.', 'Ձեռքի ուսապարկ ունեմ։'), ok: false, reply: p('La mochila puede llevarla en cabina. ¿Y para facturar?', 'Ուսապարկը կարող եք տանել սրահ։ Իսկ հանձնելու համա՞ր։') },
  ], next: 'b' },
  { id: 'b', who: 'a', line: p('Muy bien. Ponga la maleta en la báscula, por favor.', 'Շատ լավ։ Դրեք ճամպրուկը կշեռքի վրա, խնդրում եմ։') },
];
const F_S3: TNode[] = [
  { id: 's', who: 'a', line: p('Su maleta pesa veintiséis kilos con cuatrocientos gramos. El máximo son veintitrés.', 'Ձեր ճամպրուկը կշռում է քսանվեց կիլոգրամ չորս հարյուր գրամ։ Առավելագույնը քսաներեքն է։'), opts: [
    { p: p('¿Cuánto cuesta el exceso de equipaje?', 'Որքա՞ն արժե ավելցուկային ուղեբեռը։'), next: 'precio' },
    { p: p('¿Puedo sacar algunas cosas y llevarlas en la mochila?', 'Կարո՞ղ եմ որոշ իրեր հանել և տանել ուսապարկով։'), next: 'sacar' },
    { p: p('¿Sería posible pagar el exceso con tarjeta?', 'Հնարավո՞ր է ավելցուկի համար վճարել քարտով։'), next: 'pagar', lv: 'B1' },
    { p: p('Está bien, no pasa nada.', 'Լավ է, ոչինչ։'), ok: false, reply: p('Lo siento, con ese peso no puedo facturarla así. ¿Qué prefiere hacer?', 'Ցավում եմ, այդ քաշով չեմ կարող այդպես գրանցել։ Ի՞նչ եք նախընտրում անել։') },
  ] },
  { id: 'precio', who: 'a', line: p('Son cuarenta y cinco euros. También puede sacar algunas cosas, si quiere.', 'Քառասունհինգ եվրո է։ Եթե ցանկանում եք, կարող եք նաև որոշ իրեր հանել։'), opts: [
    { p: p('Prefiero sacar algunas cosas, gracias.', 'Նախընտրում եմ որոշ իրեր հանել, շնորհակալություն։'), next: 'sacar' },
    { p: p('De acuerdo, pago el exceso con tarjeta.', 'Լավ, ավելցուկը կվճարեմ քարտով։'), next: 'pagar' },
  ] },
  { id: 'sacar', who: 'a', line: p('Por supuesto. Hágalo aquí mismo, sin prisa. Recuerde: los líquidos grandes se quedan en la maleta.', 'Իհարկե։ Արեք հենց այստեղ, առանց շտապելու։ Հիշեք՝ մեծ հեղուկները մնում են ճամպրուկում։'), effect: 'unpack', end: true },
  { id: 'pagar', who: 'a', line: p('Muy bien. Acerque la tarjeta al datáfono, por favor.', 'Շատ լավ։ Մոտեցրեք քարտը տերմինալին, խնդրում եմ։'), effect: 'pay', end: true },
];
const F_S4: TNode[] = [
  { id: 's', who: 'a', line: p('Perfecto. Ya está todo en orden. ¿Prefiere ventanilla o pasillo?', 'Կատարյալ է։ Ամեն ինչ կարգին է։ Պատուհանի՞ մոտ եք նախընտրում, թե՞ միջանցքի։'), opts: [
    { p: p('Ventanilla, por favor.', 'Պատուհանի մոտ, խնդրում եմ։'), effect: 'seatA', reply: p('Le doy el 18A, junto a la ventanilla.', 'Ձեզ տալիս եմ 18A-ն՝ պատուհանի մոտ։') },
    { p: p('Pasillo, por favor. Así puedo levantarme sin molestar.', 'Միջանցքի մոտ, խնդրում եմ։ Այդպես կարող եմ վեր կենալ առանց խանգարելու։'), effect: 'seatC', reply: p('Le doy el 18C, en el pasillo.', 'Ձեզ տալիս եմ 18C-ն՝ միջանցքի մոտ։') },
    { p: p('Me da igual. ¿Qué me recomienda?', 'Ինձ համար միևնույնն է։ Ի՞նչ եք խորհուրդ տալիս։'), effect: 'seatA', lv: 'A2', reply: p('Hoy hace buen día: le recomiendo la ventanilla. Le doy el 18A.', 'Այսօր լավ եղանակ է՝ խորհուրդ եմ տալիս պատուհանը։ Տալիս եմ 18A-ն։') },
  ], next: 'bat' },
  { id: 'bat', who: 'a', lv: 'B1', line: p('¿Lleva baterías de litio o un cargador portátil en la maleta facturada?', 'Գրանցված ճամպրուկում լիթիումային մարտկոցներ կամ շարժական լիցքավորիչ ունե՞ք։'), opts: [
    { p: p('No, el cargador portátil lo llevo en el equipaje de mano.', 'Ոչ, շարժական լիցքավորիչը ձեռքի ուղեբեռում եմ տանում։') },
    { p: p('Sí, hay dos baterías en la maleta.', 'Այո, ճամպրուկում երկու մարտկոց կա։'), ok: false, reply: p('Entonces tiene que sacarlas: las baterías siempre viajan en cabina.', 'Ուրեմն պետք է հանեք դրանք՝ մարտկոցները միշտ սրահում են ճամփորդում։') },
  ], next: 'pass' },
  { id: 'pass', who: 'a', line: p('Aquí tiene su tarjeta de embarque. El embarque empieza a las diez y diez por la puerta B14.', 'Ահա ձեր նստեցման կտրոնը։ Նստեցումը սկսվում է ժամը տասն անց տասին՝ B14 դարպասից։'), effect: 'pass', opts: [
    { p: p('Muchas gracias. Que tenga un buen día.', 'Շատ շնորհակալություն։ Լավ օր եք ունենա։') },
    { p: p('Gracias. ¿Dónde está el control de seguridad?', 'Շնորհակալություն։ Որտե՞ղ է անվտանգության ստուգումը։'), reply: p('Al fondo, a la derecha, después de las tiendas. ¡Buen viaje!', 'Խորքում, աջ կողմում, խանութներից հետո։ Բարի ճանապարհ։') },
    { p: p('De nada.', 'Չարժե։'), ok: false, reply: p('Perdone, creo que quería decir «gracias».', 'Ներեցեք, կարծում եմ՝ ուզում էիք ասել «շնորհակալություն»։') },
  ] },
];

const BAG_ITEMS = [
  { id: 'pasaporte', icon: '🛂', name: p('el pasaporte', 'անձնագիրը'), need: true },
  { id: 'billete', icon: '📱', name: p('el billete (en el móvil)', 'տոմսը (հեռախոսում)'), need: true },
  { id: 'llaves', icon: '🔑', name: p('las llaves', 'բանալիները') },
  { id: 'cartera', icon: '👛', name: p('la cartera', 'դրամապանակը') },
  { id: 'gafas', icon: '🕶️', name: p('las gafas de sol', 'արևային ակնոցը') },
];
const SUITCASE = [
  { id: 'botas', icon: '🥾', name: p('las botas de montaña', 'լեռնային կոշիկները'), kg: 1.8 },
  { id: 'libros', icon: '📚', name: p('dos libros', 'երկու գիրք'), kg: 1.4 },
  { id: 'secador', icon: '💨', name: p('el secador de pelo', 'վարսահարդարիչը'), kg: 0.7 },
  { id: 'jersey', icon: '🧶', name: p('un jersey grueso', 'հաստ սվիտեր'), kg: 0.9 },
  { id: 'champu', icon: '🧴', name: p('un champú de 400 ml', '400 մլ շամպուն'), kg: 0.4, liquid: true },
  { id: 'regalo', icon: '🎁', name: p('un regalo para Ana', 'նվեր Աննայի համար'), kg: 1.2 },
];

function Facturacion({ done }: { done: Done }) {
  const [seg, setSeg] = useState(1);
  const [task, setTask] = useState<'' | 'docs' | 'scale' | 'unpack' | 'pay' | 'pass' | 'end'>('');
  const [given, setGiven] = useState<string[]>([]);
  const [onScale, setOnScale] = useState(false);
  const [kg, setKg] = useState(0);
  const [moved, setMoved] = useState<string[]>([]);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [belt, setBelt] = useState(false);
  const [pass, setPass] = useState(false);
  const [kept, setKept] = useState(false);
  const [finished, setFinished] = useState(false);
  const seat = useGame((s) => s.trip.seat);
  const baseKg = 26.4;
  const curKg = Math.round((baseKg - SUITCASE.filter((i) => moved.includes(i.id)).reduce((a, i) => a + i.kg, 0)) * 10) / 10;
  const err = (ph: P) => { setMistakes((m) => m + 1); setFb({ ok: false, p: ph }); };

  // animate scale display
  useEffect(() => {
    if (!onScale) return;
    let v = 0;
    const id = window.setInterval(() => {
      v = Math.min(baseKg, v + 2.3);
      setKg(Math.round(v * 10) / 10);
      if (v >= baseKg) { window.clearInterval(id); sfx.ding(); window.setTimeout(() => setSeg(3), 900); }
    }, 80);
    return () => window.clearInterval(id);
  }, [onScale]);

  const giveDoc = (id: string) => {
    const it = BAG_ITEMS.find((x) => x.id === id)!;
    if (!it.need) return err(p(`No, gracias. No necesito ${it.name.es}. Solo el pasaporte y el billete.`, `Ոչ, շնորհակալություն։ Ինձ պետք չէ ${it.name.hy}։ Միայն անձնագիրը և տոմսը։`));
    sfx.drop();
    const g = [...given, it.id];
    setGiven(g);
    if (g.includes('pasaporte') && g.includes('billete')) { setTask(''); setSeg(2); setFb({ ok: true, p: p('Gracias. Todo correcto.', 'Շնորհակալություն։ Ամեն ինչ ճիշտ է։') }); }
  };
  const unpack = (id: string) => {
    const it = SUITCASE.find((x) => x.id === id)!;
    if (it.liquid) return err(p('Ese champú tiene más de cien mililitros. Tiene que ir en la maleta facturada.', 'Այդ շամպունը հարյուր միլիլիտրից ավելի է։ Այն պետք է մնա գրանցված ճամպրուկում։'));
    sfx.drop(); setMoved((m) => [...m, it.id]);
  };
  const keepPass = () => { if (kept) return; sfx.success(); setKept(true); window.setTimeout(() => setFinished(true), 1200); };
  const effect = (e: string) => {
    if (e === 'seatA') setTrip({ seat: '18A' });
    if (e === 'seatC') setTrip({ seat: '18C' });
    if (e === 'pass') { setPass(true); sfx.pop(); }
    if (e === 'unpack') setTask('unpack');
    if (e === 'pay') setTask('pay');
  };
  const talkEnd = () => {
    if (seg === 1) setTask('docs');
    else if (seg === 2) setTask('scale');
    else if (seg === 4) {
      setTask('pass');
      setBelt(true);
      sfx.whoosh();
      setTrip({ bagChecked: true, boardingPass: true });
    }
  };

  return (
    <div className="mission-play">
      <Steps total={4} cur={seg - 1} />
      <div className="checkin">
        <div className="ci-scene">
          <AirportBackdrop mini />
          <div className="ci-screen"><b>14</b> AU 482 · LISBOA · 10:45</div>
          <div className="ci-agent"><Person look={LOOKS.agente} /></div>
          <Drop id="ci-desk" className={'ci-desk ' + (task === 'docs' ? 'want' : '')} accept={(pl) => pl.kind === 'doc' && task === 'docs'} onDrop={(pl) => giveDoc(pl.id)}>
            <span className="ci-desk-label"><T p={p('Mostrador', 'Գրանցման սեղան')} /></span>
            <span className="ci-docs">{given.map((g) => <span key={g}>{BAG_ITEMS.find((x) => x.id === g)!.icon}</span>)}</span>
          </Drop>
          <Drop id="ci-scale" className={'ci-scale ' + (task === 'scale' ? 'want' : '')} accept={(pl) => pl.kind === 'suitcase' && task === 'scale'} onDrop={() => { sfx.drop(); setOnScale(true); setTask(''); }}>
            <div className={'scale-display ' + (curKg > 23 && onScale ? 'over' : onScale ? 'ok' : '')}>{onScale ? (task === 'unpack' || seg >= 4 ? curKg : kg).toFixed(1) : '0.0'} kg</div>
            {onScale && !belt && <div className="suitcase on-scale" aria-hidden><SuitcaseArt tag={seg >= 4} /></div>}
            <span className="ci-scale-label"><T p={p('Báscula · máx. 23 kg', 'Կշեռք · առավելագույնը 23 կգ')} /></span>
          </Drop>
          <div className="ci-belt">{belt && <div className="suitcase gone"><SuitcaseArt tag /></div>}</div>
          <div className="ci-girl"><Gayane wear={TRAVEL_WEAR} /></div>
          {!onScale && <Drag kind="suitcase" id="maleta" disabled={task !== 'scale'} onTap={() => { if (task === 'scale') { sfx.drop(); setOnScale(true); setTask(''); } }} className={'suitcase onfloor ' + (task === 'scale' ? 'hint' : '')}><SuitcaseArt /></Drag>}
        </div>

        <div className="ci-panel">
          {seg === 1 && task === '' && <Talk key="s1" nodes={F_S1} people={AGENT} onEnd={talkEnd} />}
          {seg === 2 && task === '' && <Talk key="s2" nodes={F_S2} people={AGENT} onEnd={talkEnd} />}
          {seg === 3 && task === '' && <Talk key="s3" nodes={F_S3} people={AGENT} onEffect={effect} onEnd={() => undefined} />}
          {seg === 4 && task === '' && <Talk key="s4" nodes={F_S4} people={AGENT} onEffect={effect} onEnd={talkEnd} />}

          {task === 'docs' && (
            <div className="task-box pop-in">
              <Instruction p={p('Arrastra el pasaporte y el billete al mostrador.', 'Քաշիր անձնագիրը և տոմսը գրանցման սեղանի վրա։')} icon="🛂" />
              <div className="bag-items">
                {BAG_ITEMS.filter((i) => !given.includes(i.id)).map((i) => (
                  <Drag key={i.id} kind="doc" id={i.id} className="bag-item" onTap={() => giveDoc(i.id)}><span className="bi-icon">{i.icon}</span><T p={i.name} /></Drag>
                ))}
              </div>
            </div>
          )}
          {task === 'scale' && <Instruction p={p('Arrastra la maleta a la báscula.', 'Քաշիր ճամպրուկը կշեռքի վրա։')} icon="🧳" />}
          {task === 'unpack' && (
            <div className="task-box pop-in">
              <Instruction p={p('Abre la maleta y pasa cosas a la mochila hasta que pese 23 kilos o menos.', 'Բաց ճամպրուկը և իրեր տեղափոխիր ուսապարկ, մինչև այն կշռի 23 կիլոգրամ կամ պակաս։')} icon="⚖️" />
              <div className="unpack">
                <div className="open-case">
                  <div className="oc-title"><T p={p('La maleta', 'Ճամպրուկը')} /> · <b className={curKg > 23 ? 'txt-bad' : 'txt-good'}>{curKg.toFixed(1)} kg</b></div>
                  <div className="oc-items">
                    {SUITCASE.filter((i) => !moved.includes(i.id)).map((i) => (
                      <Drag key={i.id} kind="case" id={i.id} className="bag-item" onTap={() => unpack(i.id)}><span className="bi-icon">{i.icon}</span><T p={i.name} /><small>{i.kg} kg</small></Drag>
                    ))}
                  </div>
                </div>
                <Drop id="mochila" className="backpack-drop sticky-drop" accept={(pl) => pl.kind === 'case'} onDrop={(pl) => unpack(pl.id)}>
                  <span className="bp-icon">🎒</span>
                  <T p={p('Mochila (equipaje de mano)', 'Ուսապարկ (ձեռքի ուղեբեռ)')} />
                  <span className="bp-items">{moved.map((m) => <span key={m}>{SUITCASE.find((x) => x.id === m)!.icon}</span>)}</span>
                </Drop>
              </div>
              <Btn label={p('Pesar otra vez', 'Նորից կշռել')} icon="⚖️" disabled={curKg > 23} onClick={() => { sfx.ding(); setTask(''); setSeg(4); setFb({ ok: true, p: p(`Ahora pesa ${String(curKg).replace('.', ',')} kilos. ¡Perfecto!`, `Հիմա կշռում է ${String(curKg).replace('.', ',')} կիլոգրամ։ Կատարյալ է։`) }); }} />
            </div>
          )}
          {task === 'pay' && <Pay total={45} cashAllowed={false} onPaid={() => { setTask(''); setSeg(4); }} />}
          {task === 'pass' && (
            <div className="task-box pop-in">
              <div className="bag-system"><span>✓</span> <T p={p('Sistema de equipaje: maleta facturada · destino LIS', 'Ուղեբեռի համակարգ՝ ճամպրուկը գրանցված է · ուղղություն LIS')} /></div>
              {!kept ? (
                <>
                  <Instruction p={p('Guarda la tarjeta de embarque: arrástrala a tu bolso.', 'Պահիր նստեցման կտրոնը՝ քաշիր այն պայուսակիդ մեջ։')} icon="🎫" />
                  <div className="pass-row">
                    <Drag kind="pass" id="pass" className="bpass-drag" onTap={keepPass}><BoardingPass seat={seat} gate={FLIGHT.gate} /></Drag>
                    <Drop id="bolso" className="backpack-drop small" accept={(pl) => pl.kind === 'pass'} onDrop={keepPass}>
                      <span className="bp-icon">👜</span><T p={p('Bolso', 'Պայուսակ')} />
                    </Drop>
                  </div>
                </>
              ) : <Phrase p={p('Tarjeta guardada. Siguiente paso: el control de seguridad.', 'Կտրոնը պահված է։ Հաջորդ քայլը՝ անվտանգության ստուգում։')} />}
            </div>
          )}
          {pass && task !== 'pass' && <div className="pass-preview pop-in"><BoardingPass seat={seat} gate={FLIGHT.gate} /></div>}
        </div>
      </div>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Maleta facturada y tarjeta de embarque en el bolso.', 'Ճամպրուկը գրանցված է, իսկ նստեցման կտրոնը՝ պայուսակում։')} />}
    </div>
  );
}

export function SuitcaseArt({ tag, color = '#6e1a33' }: { tag?: boolean; color?: string }) {
  return (
    <svg viewBox="0 0 80 100" className="suitcase-svg" aria-hidden>
      <rect x="30" y="4" width="20" height="14" rx="4" fill="none" stroke="#3a3440" strokeWidth="4" />
      <rect x="10" y="16" width="60" height="74" rx="9" fill={color} />
      <path d="M24 20 V86 M56 20 V86" stroke="rgba(255,255,255,.25)" strokeWidth="3" />
      <circle cx="20" cy="94" r="5" fill="#2a2230" /><circle cx="60" cy="94" r="5" fill="#2a2230" />
      {tag && <g><path d="M66 30 L76 40" stroke="#c9a24a" strokeWidth="2" /><rect x="68" y="38" width="12" height="20" rx="2" fill="#fff" stroke="#c9a24a" /><text x="74" y="51" fontSize="6" textAnchor="middle" fill="#1f2b46">LIS</text></g>}
    </svg>
  );
}

export function BoardingPass({ seat, gate }: { seat: string; gate: string }) {
  return (
    <div className="bpass">
      <div className="bp-top"><span>AURORA AIR</span><T p={p('Tarjeta de embarque', 'Նստեցման կտրոն')} /></div>
      <div className="bp-route"><b>MAD</b><span>✈</span><b>LIS</b></div>
      <div className="bp-grid">
        <div><small><T p={p('Pasajera', 'Ուղևոր')} /></small><b>GAYANE</b></div>
        <div><small><T p={p('Vuelo', 'Չվերթ')} /></small><b>{FLIGHT.code}</b></div>
        <div><small><T p={p('Puerta', 'Դարպաս')} /></small><b>{gate}</b></div>
        <div><small><T p={p('Embarque', 'Նստեցում')} /></small><b>{FLIGHT.boarding}</b></div>
        <div><small><T p={p('Asiento', 'Նստատեղ')} /></small><b>{seat}</b></div>
        <div><small><T p={p('Salida', 'Մեկնում')} /></small><b>{FLIGHT.dep}</b></div>
      </div>
    </div>
  );
}

/* ===================================================================== */
/*  3. SEGURIDAD                                                          */
/* ===================================================================== */
type SecItem = { id: string; icon: string; name: P };
const SEC_ITEMS: SecItem[] = [
  { id: 'mochila', icon: '🎒', name: p('la mochila', 'ուսապարկը') },
  { id: 'portatil', icon: '💻', name: p('el portátil', 'նոութբուքը') },
  { id: 'liquidos', icon: '🧴', name: p('la bolsa de líquidos', 'հեղուկների տոպրակը') },
  { id: 'botella', icon: '🍶', name: p('la botella de agua (1 litro)', 'ջրի շիշը (1 լիտր)') },
  { id: 'abrigo', icon: '🧥', name: p('el abrigo', 'վերարկուն') },
  { id: 'cinturon', icon: '🪢', name: p('el cinturón', 'գոտին') },
  { id: 'movil', icon: '📱', name: p('el móvil', 'հեռախոսը') },
  { id: 'llaves', icon: '🔑', name: p('las llaves', 'բանալիները') },
  { id: 'reloj', icon: '⌚', name: p('el reloj', 'ժամացույցը') },
];
type SecStep = { say: P; need?: string[]; target?: 'b1' | 'b2' | 'b3' | 'bin'; action?: 'push' | 'arch' | 'collect'; lv?: 'A1' | 'A2' | 'B1' | 'B2' };
const SEC_STEPS: SecStep[] = [
  { say: p('Buenos días. Ponga la mochila en una bandeja, por favor.', 'Բարի լույս։ Դրեք ուսապարկը սկուտեղի մեջ, խնդրում եմ։'), need: ['mochila'], target: 'b1' },
  { say: p('Saque el portátil y póngalo en una bandeja aparte.', 'Հանեք նոութբուքը և դրեք առանձին սկուտեղի մեջ։'), need: ['portatil'], target: 'b2' },
  { say: p('Los líquidos, en la bolsa transparente, también en esa bandeja.', 'Հեղուկները՝ թափանցիկ տոպրակով, նույնպես այդ սկուտեղի մեջ։'), need: ['liquidos'], target: 'b2' },
  { say: p('Esa botella tiene más de cien mililitros. No puede pasar con ella: tírela en el contenedor, por favor.', 'Այդ շիշը հարյուր միլիլիտրից ավելի է։ Չեք կարող անցնել դրանով՝ նետեք այն տարայի մեջ, խնդրում եմ։'), need: ['botella'], target: 'bin', lv: 'A2' },
  { say: p('Quítese el abrigo y el cinturón y déjelos en otra bandeja.', 'Հանեք վերարկուն և գոտին և դրեք մեկ այլ սկուտեղի մեջ։'), need: ['abrigo', 'cinturon'], target: 'b3' },
  { say: p('El móvil y las llaves también, por favor.', 'Հեռախոսը և բանալիները նույնպես, խնդրում եմ։'), need: ['movil', 'llaves'], target: 'b3' },
  { say: p('Gracias. Empuje las bandejas hacia el escáner.', 'Շնորհակալություն։ Հրեք սկուտեղները դեպի սկաները։'), action: 'push' },
  { say: p('Ahora pase por el arco, por favor.', 'Հիմա անցեք շրջանակի միջով, խնդրում եմ։'), action: 'arch' },
  { say: p('Ya puede recoger sus cosas. ¡Buen viaje!', 'Արդեն կարող եք վերցնել ձեր իրերը։ Բարի ճանապարհ։'), action: 'collect' },
];
const BEEP: TNode[] = [
  { id: 's', who: 'g', line: p('Ha sonado el arco. ¿Lleva algo metálico encima?', 'Շրջանակը ազդանշան տվեց։ Ձեզ վրա մետաղական ինչ-որ բան կա՞։'), opts: [
    { p: p('Sí, perdone. Llevo el reloj.', 'Այո, ներեցեք։ Ժամացույց ունեմ։') },
    { p: p('Creo que es mi reloj. ¿Me lo quito?', 'Կարծում եմ՝ ժամացույցս է։ Հանե՞մ։'), lv: 'A2', reply: p('Sí, por favor. Déjelo en la bandeja.', 'Այո, խնդրում եմ։ Թողեք սկուտեղի մեջ։') },
    { p: p('No hablo con usted.', 'Ձեզ հետ չեմ խոսում։'), ok: false, reply: p('Señora, es solo un control. ¿Lleva reloj, monedas o algo de metal?', 'Տիկին, սա պարզապես ստուգում է։ Ժամացույց, մետաղադրամ կամ մետաղյա ինչ-որ բան ունե՞ք։') },
  ] },
];

function Seguridad({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const steps = useMemo(() => SEC_STEPS.filter((s) => !s.lv || levelOk(s.lv, level)), [level]);
  const beepLevel = levelOk('A2', level);
  const [i, setI] = useState(0);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [scanned, setScanned] = useState(false);
  const [girl, setGirl] = useState<'before' | 'arch' | 'after'>('before');
  const [alarm, setAlarm] = useState<'' | 'red' | 'green'>('');
  const [beep, setBeep] = useState(false);
  const [watchOff, setWatchOff] = useState(false);
  const [collected, setCollected] = useState<string[]>([]);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const st = steps[Math.min(i, steps.length - 1)];
  const err = (ph: P) => { setMistakes((m) => m + 1); setFb({ ok: false, p: ph }); };
  const next = () => setI((x) => x + 1);

  const drop = (tray: string, id: string) => {
    if (beep && id === 'reloj' && tray !== 'bin') { sfx.drop(); setPlaced((s) => ({ ...s, reloj: tray })); setWatchOff(true); setBeep(false); setAlarm(''); setGirl('before'); setFb({ ok: true, p: p('Gracias. Pase otra vez, por favor.', 'Շնորհակալություն։ Նորից անցեք, խնդրում եմ։') }); return; }
    if (!st.need) return err(p('Espere, por favor. Escuche la instrucción.', 'Սպասեք, խնդրում եմ։ Լսեք հրահանգը։'));
    if (!st.need.includes(id)) return err(id === 'reloj' ? p('El reloj puede llevarlo puesto por ahora.', 'Ժամացույցը առայժմ կարող եք կրել։') : p('Eso todavía no. ' + st.say.es, 'Դա դեռ ոչ։ ' + st.say.hy));
    if (tray !== st.target) return err(st.target === 'bin' ? p('La botella va al contenedor, no a la bandeja.', 'Շիշը գնում է տարայի մեջ, ոչ թե սկուտեղ։') : p('En otra bandeja, por favor.', 'Մեկ այլ սկուտեղի մեջ, խնդրում եմ։'));
    sfx.drop();
    const np = { ...placed, [id]: tray };
    setPlaced(np);
    if (st.need.every((n) => np[n])) window.setTimeout(next, 500);
  };

  const act = (a: 'push' | 'arch' | 'collect') => {
    if (st.action !== a) return err(a === 'arch' ? p('¡Espere! Todavía no puede pasar.', 'Սպասեք։ Դեռ չեք կարող անցնել։') : p('Escuche bien la instrucción.', 'Ուշադիր լսեք հրահանգը։'));
    if (a === 'push') { sfx.whoosh(); setScanned(true); window.setTimeout(next, 900); }
    if (a === 'arch') {
      setGirl('arch');
      window.setTimeout(() => {
        if (beepLevel && !watchOff) { sfx.beep(); setAlarm('red'); setBeep(true); return; }
        sfx.success(); setAlarm('green');
        window.setTimeout(() => { setGirl('after'); setTrip({ passedSecurity: true }); next(); }, 900);
      }, 900);
    }
  };
  const allIds = Object.keys(placed).filter((k) => placed[k] !== 'bin');
  const collect = (id: string) => {
    if (collected.includes(id)) return;
    sfx.drop();
    const c = [...collected, id];
    setCollected(c);
    if (allIds.filter((x) => x !== 'mochila').every((x) => c.includes(x))) { next(); window.setTimeout(() => setFinished(true), 900); }
  };

  return (
    <div className="mission-play">
      <Steps total={steps.length} cur={i} />
      {!beep && i < steps.length && <Instruction p={st.say} icon="👮🏽" who={p('Agente de seguridad', 'Անվտանգության աշխատակից')} />}
      <div className="security">
        <div className="sec-lane">
          <div className="sec-officer"><Person look={LOOKS.seguridad} /></div>
          <div className={'sec-belt ' + (scanned ? 'scanned' : '')}>
            {(['b1', 'b2', 'b3'] as const).map((b, k) => (
              <Drop key={b} id={'tray-' + b} className="tray" accept={(pl) => pl.kind === 'sec'} onDrop={(pl) => drop(b, pl.id)}>
                <small><T p={p('Bandeja ' + (k + 1), 'Սկուտեղ ' + (k + 1))} /></small>
                <span className="tray-items">{Object.entries(placed).filter(([id, t]) => t === b && !collected.includes(id)).map(([id]) => <span key={id}>{SEC_ITEMS.find((x) => x.id === id)!.icon}</span>)}</span>
              </Drop>
            ))}
            <div className="xray"><span>RAYOS X</span></div>
          </div>
          <Drop id="bin" className="sec-bin" accept={(pl) => pl.kind === 'sec'} onDrop={(pl) => drop('bin', pl.id)}>
            🗑️ <T p={p('Contenedor de líquidos', 'Հեղուկների տարա')} />
          </Drop>
          <div className={'arch ' + alarm} role="button" tabIndex={0} onClick={() => act('arch')}>
            <div className="arch-frame"><i /></div>
            <div className={'arch-girl ' + girl}><Gayane wear={watchOff ? ['camiseta', 'pantalones', 'botas'] : ['jersey', 'pantalones', 'botas']} walking={girl === 'arch'} /></div>
            <span className="arch-label"><T p={p('Arco detector', 'Դետեկտորային շրջանակ')} /></span>
          </div>
        </div>

        {beep ? (
          <div className="task-box pop-in">
            <Talk nodes={BEEP} people={{ g: { name: p('Agente de seguridad', 'Անվտանգության աշխատակից'), icon: '👮🏽' } }} onEnd={() => setFb({ ok: true, p: p('Arrastra el reloj a una bandeja y vuelve a pasar.', 'Քաշիր ժամացույցը սկուտեղի մեջ և նորից անցիր։') })} />
            <div className="bag-items"><Drag kind="sec" id="reloj" className="bag-item" onTap={() => drop('b3', 'reloj')}><span className="bi-icon">⌚</span><T p={SEC_ITEMS[8].name} /></Drag></div>
          </div>
        ) : st.action === 'collect' && i < steps.length ? (
          <div className="task-box pop-in">
            <Instruction p={p('Recoge tus cosas: arrástralas a la mochila.', 'Հավաքիր իրերդ՝ քաշիր դրանք ուսապարկի մեջ։')} icon="🎒" auto={false} />
            <div className="bag-items">
              {allIds.filter((id) => !collected.includes(id) && id !== 'mochila').map((id) => (
                <Drag key={id} kind="back" id={id} className="bag-item" onTap={() => collect(id)}><span className="bi-icon">{SEC_ITEMS.find((x) => x.id === id)!.icon}</span><T p={SEC_ITEMS.find((x) => x.id === id)!.name} /></Drag>
              ))}
            </div>
            <Drop id="back" className="backpack-drop" accept={(pl) => pl.kind === 'back'} onDrop={(pl) => collect(pl.id)}>
              <span className="bp-icon">🎒</span><T p={p('Mi mochila', 'Իմ ուսապարկը')} />
            </Drop>
          </div>
        ) : (
          <div className="task-box">
            <div className="bag-items">
              {SEC_ITEMS.filter((x) => !placed[x.id] && x.id !== 'reloj').map((x) => (
                <Drag key={x.id} kind="sec" id={x.id} className="bag-item" onTap={() => drop(st.target ?? 'b1', x.id)}><span className="bi-icon">{x.icon}</span><T p={x.name} /></Drag>
              ))}
            </div>
            <div className="sec-actions">
              <Btn label={p('Empujar las bandejas', 'Հրել սկուտեղները')} icon="➡" variant="soft" small onClick={() => act('push')} />
              <Btn label={p('Pasar por el arco', 'Անցնել շրջանակով')} icon="🚶‍♀️" variant="soft" small onClick={() => act('arch')} />
            </div>
          </div>
        )}
      </div>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Control de seguridad superado.', 'Անվտանգության ստուգումն անցած է։')} />}
    </div>
  );
}

/* ===================================================================== */
/*  4. PUERTA DE EMBARQUE                                                 */
/* ===================================================================== */
const GATES = ['B10', 'B12', 'B14', 'B16', 'B18', 'B20', 'B22', 'B24'];
const GATE_INFO: Record<string, P> = {
  B10: p('Puerta B10: vuelo a Roma, retrasado.', 'B10 դարպաս՝ Հռոմի չվերթ, ուշանում է։'),
  B12: p('Puerta B12: ahora no hay ningún vuelo.', 'B12 դարպաս՝ հիմա ոչ մի չվերթ չկա։'),
  B16: p('Puerta B16: vuelo a París a las doce.', 'B16 դարպաս՝ Փարիզի չվերթ ժամը տասներկուսին։'),
  B18: p('Puerta B18: el vuelo a Viena está cancelado.', 'B18 դարպաս՝ Վիեննայի չվերթը չեղարկված է։'),
  B20: p('Puerta B20: vuelo a Berlín, embarcando.', 'B20 դարպաս՝ Բեռլինի չվերթ, նստեցում։'),
  B24: p('Puerta B24: vuelo a Atenas.', 'B24 դարպաս՝ Աթենքի չվերթ։'),
};
const ANN = p(
  'Atención, por favor. Pasajeros del vuelo AU cuatro ocho dos con destino Lisboa: la salida se ha cambiado a la puerta B veintidós. El embarque comenzará a las diez y veinte. Tengan preparados la tarjeta de embarque y el pasaporte.',
  'Ուշադրություն, խնդրում ենք։ AU 482 Լիսաբոն չվերթի ուղևորներ՝ մեկնումը տեղափոխվել է B22 դարպաս։ Նստեցումը կսկսվի ժամը տասն անց քսանին։ Պատրաստ պահեք նստեցման կտրոնը և անձնագիրը։',
);
const GATE_TALK: TNode[] = [
  { id: 's', who: 'g', line: p('Buenos días. Tarjeta de embarque y pasaporte, por favor.', 'Բարի լույս։ Նստեցման կտրոնը և անձնագիրը, խնդրում եմ։'), opts: [
    { p: p('Aquí tiene. ¿Es esta la puerta para Lisboa?', 'Վերցրեք։ Սա՞ է Լիսաբոնի դարպասը։'), reply: p('Sí, el vuelo a Lisboa sale ahora por aquí, por la B22.', 'Այո, Լիսաբոնի չվերթն այժմ այստեղից է մեկնում՝ B22-ից։') },
    { p: p('Aquí tiene.', 'Վերցրեք։') },
    { p: p('No tengo tiempo.', 'Ժամանակ չունեմ։'), ok: false, reply: p('Es solo un momento. Necesito ver sus documentos.', 'Ընդամենը մի պահ է։ Պետք է տեսնեմ ձեր փաստաթղթերը։') },
  ], next: 'bag' },
  { id: 'bag', who: 'g', lv: 'B1', line: p('El vuelo va completo. Si quiere, podemos facturar su maleta de mano gratis.', 'Չվերթը լեփ-լեցուն է։ Եթե ցանկանում եք, կարող ենք ձեր ձեռքի ուղեբեռն անվճար գրանցել։'), opts: [
    { p: p('No, gracias. Es una mochila pequeña y cabe debajo del asiento.', 'Ոչ, շնորհակալություն։ Փոքր ուսապարկ է և տեղավորվում է նստատեղի տակ։') },
    { p: p('Muy amable, pero llevo el portátil dentro. Prefiero llevarla conmigo.', 'Շատ բարի եք, բայց ներսում նոութբուքն է։ Նախընտրում եմ ինձ հետ տանել։') },
    { p: p('Sí, y también mi abrigo y mi pasaporte.', 'Այո, նաև վերարկուս և անձնագիրս։'), ok: false, reply: p('El pasaporte debe llevarlo siempre con usted.', 'Անձնագիրը միշտ պետք է ձեզ հետ լինի։') },
  ], next: 'end' },
  { id: 'end', who: 'g', line: p('Perfecto. Puede esperar en la sala; embarcamos en unos minutos.', 'Կատարյալ է։ Կարող եք սպասել սրահում. մի քանի րոպեից նստեցում է։') },
];

function Puerta({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const [step, setStep] = useState(0); // 0 go B14 · 1 listen · 2 go B22 · 3 talk
  const [q, setQ] = useState(0);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const err = (ph: P) => { setMistakes((m) => m + 1); setFb({ ok: false, p: ph }); };
  const QS = [
    { q: p('¿Cuál es la nueva puerta?', 'Ո՞րն է նոր դարպասը։'), a: ['B12', 'B22', 'B2'], ok: 'B22' },
    { q: p('¿A qué hora empieza ahora el embarque?', 'Ժամը քանիսի՞ն է հիմա սկսվում նստեցումը։'), a: ['10:10', '10:20', '10:45'], ok: '10:20' },
    ...(levelOk('B1', level) ? [{ q: p('¿Qué tienen que preparar los pasajeros?', 'Ի՞նչ պետք է պատրաստեն ուղևորները։'), a: ['la tarjeta de embarque y el pasaporte', 'la maleta facturada', 'un café para llevar'], ok: 'la tarjeta de embarque y el pasaporte' }] : []),
  ];
  const HY: Record<string, string> = { 'la tarjeta de embarque y el pasaporte': 'նստեցման կտրոնը և անձնագիրը', 'la maleta facturada': 'գրանցված ճամպրուկը', 'un café para llevar': 'սուրճ տանելու համար' };
  const TASKS = [
    p('Mira la pantalla y ve a tu puerta de embarque: la B14.', 'Նայիր էկրանին և գնա քո նստեցման դարպասը՝ B14։'),
    p('Escucha el anuncio y contesta.', 'Լսիր հայտարարությունը և պատասխանիր։'),
    p('Tu puerta ha cambiado. Ve a la nueva puerta.', 'Քո դարպասը փոխվել է։ Գնա նոր դարպաս։'),
    p('Habla con la agente de la puerta.', 'Խոսիր դարպասի աշխատակցուհու հետ։'),
  ];
  const spots: Spot[] = [
    { id: 'screen', x: 12, bottom: 34, label: p('Pantalla de salidas', 'Մեկնումների էկրան'), art: <div className="ap-board small"><div className="apb-title">SALIDAS</div><div className="apb-row"><span>10:45</span><span>Lisboa</span><span className={step >= 2 ? 'blink' : ''}>{step >= 2 ? 'B22' : 'B14'}</span></div><div className="apb-row"><span>11:20</span><span>Viena</span><span>B18</span></div></div>,
      onArrive: () => setFb({ ok: true, p: step >= 2 ? p('Lisboa, AU 482: puerta B22. ¡Ha cambiado!', 'Լիսաբոն, AU 482՝ B22 դարպաս։ Փոխվել է։') : p('Lisboa, AU 482: puerta B14.', 'Լիսաբոն, AU 482՝ B14 դարպաս։') }) },
    ...GATES.map((g, k): Spot => ({
      id: g, x: 32 + k * 24, bottom: 16, label: p('Puerta ' + g, 'Դարպաս ' + g), art: <div className={'gate ' + ((step < 2 && g === 'B14') || (step >= 2 && g === 'B22') ? 'mine' : '')}><b>{g}</b><div className="gate-door" /><div className="gate-seats"><i /><i /><i /><i /></div></div>,
      onArrive: () => {
        if (step === 0 && g === 'B14') { setStep(1); return; }
        if (step === 2 && g === 'B22') { setStep(3); return; }
        if (step === 1) return;
        if (step === 0 || step === 2) err(GATE_INFO[g] ?? (g === 'B14' ? p('Aquí ya no sale tu vuelo. Escucha el anuncio otra vez.', 'Քո չվերթն այլևս այստեղից չի մեկնում։ Նորից լսիր հայտարարությունը։') : p('Esta no es tu puerta.', 'Սա քո դարպասը չէ։')));
      },
    })),
  ];
  return (
    <div className="mission-play">
      <Steps total={4} cur={step} />
      <Instruction p={TASKS[step]} icon="🛫" />
      <Stage width={240} startX={6} wear={TRAVEL_WEAR} spots={spots} className="stage-gates" bg={<AirportBackdrop />} />
      {step === 1 && (
        <div className="task-box pop-in">
          <Announcement text={ANN} />
          {q < QS.length && (
            <div className="quiz" key={q}>
              <Phrase p={QS[q].q} />
              <div className="choices">
                {QS[q].a.map((a) => (
                  <button key={a} className="choice" onClick={() => {
                    if (a !== QS[q].ok) return err(p('Escucha otra vez el anuncio.', 'Նորից լսիր հայտարարությունը։'));
                    sfx.success();
                    if (q + 1 >= QS.length) { setStep(2); setTrip({ gate: FLIGHT.newGate }); setFb({ ok: true, p: p('Exacto. Nueva puerta: B22. Embarque a las diez y veinte.', 'Ճիշտ է։ Նոր դարպաս՝ B22։ Նստեցումը ժամը տասն անց քսանին։') }); }
                    else setQ(q + 1);
                  }}>{HY[a] ? <T p={{ es: a, hy: HY[a] }} /> : a}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="task-box pop-in">
          <div className="talk-with"><Person look={LOOKS.agente} className="mini-person" /><Talk nodes={GATE_TALK} people={{ g: { name: p('Agente de embarque', 'Նստեցման աշխատակցուհի'), icon: '👩🏻‍💼' } }} onEnd={() => setFinished(true)} /></div>
        </div>
      )}
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Estás en la puerta correcta: B22. ¡Casi a bordo!', 'Ճիշտ դարպասում ես՝ B22։ Համարյա ինքնաթիռում ես։')} />}
    </div>
  );
}

/* ===================================================================== */
/*  5. CAFÉ                                                               */
/* ===================================================================== */
type Prod = { id: string; icon: string; name: P; art: string; artHy: string; price: number; drink?: boolean };
const PRODS: Prod[] = [
  { id: 'cafeleche', icon: '☕', name: p('café con leche', 'կաթով սուրճ'), art: 'un café con leche', artHy: 'մեկ կաթով սուրճ', price: 2.2, drink: true },
  { id: 'solo', icon: '☕', name: p('café solo', 'սև սուրճ'), art: 'un café solo', artHy: 'մեկ սև սուրճ', price: 1.6, drink: true },
  { id: 'te', icon: '🍵', name: p('té verde', 'կանաչ թեյ'), art: 'un té verde', artHy: 'մեկ կանաչ թեյ', price: 1.8, drink: true },
  { id: 'zumo', icon: '🧃', name: p('zumo de naranja', 'նարնջի հյութ'), art: 'un zumo de naranja', artHy: 'մեկ նարնջի հյութ', price: 3, drink: true },
  { id: 'agua', icon: '💧', name: p('agua sin gas', 'չգազավորված ջուր'), art: 'una botella de agua sin gas', artHy: 'մեկ շիշ չգազավորված ջուր', price: 1.5, drink: true },
  { id: 'bocadillo', icon: '🥖', name: p('bocadillo de jamón', 'խոզապուխտով սենդվիչ'), art: 'un bocadillo de jamón', artHy: 'մեկ խոզապուխտով սենդվիչ', price: 4.5 },
  { id: 'vegetal', icon: '🥪', name: p('sándwich vegetal', 'բանջարեղենային սենդվիչ'), art: 'un sándwich vegetal', artHy: 'մեկ բանջարեղենային սենդվիչ', price: 4.2 },
  { id: 'cruasan', icon: '🥐', name: p('cruasán', 'կրուասան'), art: 'un cruasán', artHy: 'մեկ կրուասան', price: 1.9 },
  { id: 'tarta', icon: '🍰', name: p('tarta de queso', 'պանրով տորթ'), art: 'una porción de tarta de queso', artHy: 'մեկ կտոր պանրով տորթ', price: 3.5 },
  { id: 'magdalena', icon: '🧁', name: p('magdalena', 'կեքս'), art: 'una magdalena', artHy: 'մեկ կեքս', price: 1.7 },
];
const joinEs = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]);
const joinHy = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' և ' + a[a.length - 1]);
const orderP = (items: Prod[]): P => ({ es: `Quisiera ${joinEs(items.map((i) => i.art))}, por favor.`, hy: `Կցանկանայի ${joinHy(items.map((i) => i.artHy))}, խնդրում եմ։` });
type Sit = 'agotado' | 'cambio' | 'modificar' | 'tique';

function Cafe({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const sit = useMemo<Sit>(() => pick((['agotado', 'cambio', 'modificar', 'tique'] as Sit[]).filter((s) => s === 'tique' || levelOk(s === 'agotado' ? 'A2' : 'B1', level))), [level]);
  const [phase, setPhase] = useState<'greet' | 'choose' | 'order' | 'pay' | 'after' | 'served'>('greet');
  const [cart, setCart] = useState<Prod[]>([]);
  const [togo, setTogo] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const soldOut = useRef<Prod | null>(null);
  const total = Math.round(cart.reduce((a, b) => a + b.price, 0) * 100) / 100;
  const people: Record<string, Who> = { b: { name: p('Barista', 'Բարիստա'), icon: '🧑🏽‍🍳' } };

  const greet: TNode[] = [
    { id: 's', who: 'b', line: p('Buenos días. ¿Qué desea tomar?', 'Բարի լույս։ Ի՞նչ կցանկանաք խմել։'), opts: [
      { p: p('Un momento, por favor. Estoy mirando la carta.', 'Մի րոպե, խնդրում եմ։ Նայում եմ ճաշացանկը։') },
      { p: p('Buenos días. ¿Qué me recomienda para desayunar?', 'Բարի լույս։ Ի՞նչ եք խորհուրդ տալիս նախաճաշի համար։'), lv: 'A2', reply: p('El café con leche y el cruasán son nuestra especialidad. Tómese su tiempo.', 'Կաթով սուրճը և կրուասանը մեր մասնագիտացումն են։ Շտապելու կարիք չկա։') },
      { p: p('Adiós.', 'Ցտեսություն։'), ok: false, reply: p('¿Ya se va? Si quiere algo, aquí estoy.', 'Արդեն գնո՞ւմ եք։ Եթե ինչ-որ բան ուզեք, ես այստեղ եմ։') },
    ] },
  ];

  const orderNodes = (): TNode[] => {
    const others = PRODS.filter((x) => !cart.includes(x));
    const wrong1 = orderP(cart.map((c, i) => (i === 0 ? pick(others) : c)));
    const n: TNode[] = [
      { id: 's', who: 'b', line: p('Dígame, ¿qué le pongo?', 'Ասեք, ի՞նչ բերեմ ձեզ։'), opts: [
        { p: orderP(cart) },
        { p: wrong1, ok: false, reply: p('Perdone, ¿seguro? Mire su pedido en la pantalla.', 'Ներեցեք, համոզվա՞ծ եք։ Նայեք ձեր պատվերը էկրանին։') },
      ], next: sit === 'agotado' ? 'agot' : sit === 'modificar' ? 'mod' : 'aqui' },
    ];
    if (sit === 'agotado' && soldOut.current) {
      const so = soldOut.current;
      n.push({ id: 'agot', who: 'b', line: p(`Lo siento mucho, ya no nos queda ${so.name.es}. ¿Quiere otra cosa?`, `Շատ եմ ցավում, ${so.name.hy} այլևս չի մնացել։ Ուրիշ բան կուզե՞ք։`), opts: [
        { p: p('Vaya. ¿Qué me recomienda?', 'Ափսոս։ Ի՞նչ եք խորհուրդ տալիս։'), reply: p('La tarta de queso está muy buena hoy.', 'Պանրով տորթն այսօր շատ համեղ է։'), effect: 'replace' },
        { p: p('No pasa nada. Entonces, solo lo demás.', 'Ոչինչ։ Ուրեմն՝ միայն մնացածը։'), effect: 'remove', reply: p('De acuerdo, le quito ese producto.', 'Լավ, այդ ապրանքը հանում եմ։') },
        { p: p('¡Qué mal servicio!', 'Ինչ վատ սպասարկում է։'), ok: false, reply: p('Lo siento de verdad. ¿Le puedo ofrecer otra cosa?', 'Իսկապես ցավում եմ։ Կարո՞ղ եմ ուրիշ բան առաջարկել։') },
      ], next: 'aqui' });
    }
    if (sit === 'modificar') {
      const d = cart.find((c) => c.drink) ?? cart[0];
      n.push({ id: 'mod', who: 'b', line: p('Muy bien. ¿Algo más?', 'Շատ լավ։ Էլի ինչ-որ բան։'), opts: [
        { p: p(`Perdone, ¿podría cambiar ${d.art} por un té verde?`, `Ներեցեք, կարո՞ղ եք ${d.artHy}-ը փոխել կանաչ թեյով։`), effect: 'swap', reply: p('Claro, sin problema. ¿El té, con limón o solo?', 'Իհարկե, խնդիր չկա։ Թեյը՝ կիտրոնո՞վ, թե՞ առանց։'), next: 'limon' },
        { p: p('No, nada más, gracias.', 'Ոչ, ուրիշ ոչինչ, շնորհակալություն։') },
      ], next: 'aqui' });
      n.push({ id: 'limon', who: 'b', line: p('¿Con limón o solo?', 'Կիտրոնո՞վ, թե՞ առանց։'), opts: [
        { p: p('Solo, gracias.', 'Առանց, շնորհակալություն։') },
        { p: p('Con una rodaja de limón, por favor.', 'Մեկ կտոր կիտրոնով, խնդրում եմ։') },
      ], next: 'aqui' });
    }
    n.push({ id: 'aqui', who: 'b', line: p('¿Para tomar aquí o para llevar?', 'Այստե՞ղ եք խմելու, թե՞ տանելու։'), opts: [
      { p: p('Para llevar, gracias. Tengo que embarcar pronto.', 'Տանելու, շնորհակալություն։ Շուտով նստեցում ունեմ։'), effect: 'togo' },
      { p: p('Para tomar aquí, por favor.', 'Այստեղ, խնդրում եմ։'), effect: 'here' },
      { p: p('Para mañana.', 'Վաղվա համար։'), ok: false, reply: p('Perdone, ¿lo toma aquí o se lo lleva?', 'Ներեցեք, այստե՞ղ եք խմում, թե՞ տանում եք։') },
    ], next: 'total' });
    n.push({ id: 'total', who: 'b', line: p('Perfecto. Ahora le digo el total.', 'Կատարյալ է։ Հիմա կասեմ ընդհանուր գումարը։') });
    return n;
  };

  const after: TNode[] = [
    { id: 's', who: 'b', line: p('Aquí tiene su pedido. ¿Necesita algo más?', 'Ահա ձեր պատվերը։ Էլի ինչ-որ բանի կարիք ունե՞ք։'), opts: [
      { p: p('Sí, ¿me da el tique, por favor?', 'Այո, կտա՞ք կտրոնը, խնդրում եմ։'), effect: 'receipt', reply: p('Por supuesto, aquí tiene. ¡Buen viaje!', 'Իհարկե, վերցրեք։ Բարի ճանապարհ։') },
      { p: p('No, gracias. Que tenga un buen día.', 'Ոչ, շնորհակալություն։ Լավ օր եք ունենա։'), ok: sit !== 'tique' ? undefined : false, reply: sit === 'tique' ? p('Un momento: ¿no necesitaba el tique para su empresa?', 'Մի րոպե՝ ձեր ընկերության համար կտրոն պետք չէ՞ր։') : p('Igualmente. ¡Buen viaje!', 'Նմանապես։ Բարի ճանապարհ։') },
    ] },
  ];

  const effect = (e: string) => {
    if (e === 'togo') setTogo(true);
    if (e === 'here') setTogo(false);
    if (e === 'receipt') { setReceipt(true); sfx.pop(); }
    if (e === 'replace' && soldOut.current) { const so = soldOut.current; setCart((c) => c.map((x) => (x === so ? PRODS.find((y) => y.id === 'tarta')! : x))); }
    if (e === 'remove' && soldOut.current) { const so = soldOut.current; setCart((c) => c.filter((x) => x !== so)); }
    if (e === 'swap') setCart((c) => { const d = c.find((x) => x.drink) ?? c[0]; return c.map((x) => (x === d ? PRODS.find((y) => y.id === 'te')! : x)); });
  };

  const toggle = (pr: Prod) => {
    sfx.click();
    setCart((c) => (c.includes(pr) ? c.filter((x) => x !== pr) : c.length >= 3 ? c : [...c, pr]));
  };

  return (
    <div className="mission-play">
      {sit === 'cambio' && phase !== 'served' && <Instruction p={p('En tu cartera solo hay un billete de cincuenta euros y la tarjeta.', 'Դրամապանակումդ միայն հիսուն եվրոյանոց թղթադրամ և քարտ կա։')} icon="👛" auto={false} />}
      {sit === 'tique' && phase !== 'served' && <Instruction p={p('Necesitas el tique: el viaje es de trabajo.', 'Քեզ պետք է կտրոնը՝ ճամփորդությունը աշխատանքային է։')} icon="🧾" auto={false} />}
      <div className="cafe">
        <div className="cafe-scene">
          <div className="cafe-menu-board">
            <div className="cmb-title"><T p={p('Carta', 'Ճաշացանկ')} /></div>
            {PRODS.slice(0, 5).map((x) => <div key={x.id}><T p={x.name} /><span>{fmtEuro(x.price)}</span></div>)}
          </div>
          <div className="cafe-barista"><Person look={LOOKS.barista} talking={phase === 'greet' || phase === 'order'} /></div>
          <div className="cafe-counter">
            <div className="vitrina">
              {PRODS.map((x) => (
                <button key={x.id} className={'vprod ' + (cart.includes(x) ? 'in' : '')} disabled={phase !== 'choose'} onClick={() => toggle(x)} aria-label={x.name.es}>
                  <span className="vprod-icon">{x.icon}</span>
                  <span className="vprod-name"><T p={x.name} /></span>
                  <span className="vprod-price">{fmtEuro(x.price)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="cafe-girl"><Gayane wear={TRAVEL_WEAR} holding={phase === 'served' ? (togo ? '🥤' : '☕') : undefined} /></div>
          {phase === 'served' && (
            <div className="served-tray pop-in">
              {cart.map((c, i) => <span key={i}>{togo && c.drink ? '🥤' : c.icon}</span>)}
              {togo && <span>🛍️</span>}
              {receipt && <span>🧾</span>}
            </div>
          )}
        </div>
        <div className="cafe-panel">
          <div className="order-box">
            <div className="ob-title"><T p={p('Tu pedido', 'Քո պատվերը')} /></div>
            {cart.length === 0 && <T p={p('Todavía no has elegido nada.', 'Դեռ ոչինչ չես ընտրել։')} className="muted" />}
            {cart.map((c, i) => <div key={i} className="ob-row"><span>{c.icon}</span><T p={c.name} /><b>{fmtEuro(c.price)}</b></div>)}
            {cart.length > 0 && <div className="ob-total"><T p={p('Total', 'Ընդամենը')} /> <b>{fmtEuro(total)}</b></div>}
            {receipt && <div className="lreceipt pop-in"><b>TIQUE · CAFÉ AURORA</b>{cart.map((c, i) => <div key={i}><span>{c.name.es}</span><span>{fmtEuro(c.price)}</span></div>)}<div><b>TOTAL</b><b>{fmtEuro(total)}</b></div></div>}
          </div>
          {phase === 'greet' && <Talk nodes={greet} people={people} onEnd={() => setPhase('choose')} />}
          {phase === 'choose' && (
            <div className="task-box pop-in">
              <Instruction p={p('Elige en la vitrina lo que quieres (máximo tres cosas) y pulsa «Pedir».', 'Ցուցափեղկից ընտրիր ուզածդ (առավելագույնը երեք բան) և սեղմիր «Պատվիրել»։')} icon="🧺" />
              <Btn label={p('Pedir', 'Պատվիրել')} icon="🗣" disabled={!cart.length} onClick={() => {
                if (sit === 'agotado') soldOut.current = cart.find((c) => !c.drink) ?? cart[cart.length - 1];
                setPhase('order');
              }} />
            </div>
          )}
          {phase === 'order' && <Talk nodes={orderNodes()} people={people} onEffect={effect} onEnd={(m) => { setMistakes((x) => x + m); setPhase('pay'); }} />}
          {phase === 'pay' && (
            <div className="task-box pop-in">
              <Phrase p={p(`Son ${fmtEuro(total).replace(' €', '')} euros.`, `${fmtEuro(total).replace(' €', '')} եվրո է։`)} />
              <Pay total={total} noChangeFor={sit === 'cambio' ? 50 : 0} onPaid={(how, given) => {
                if (how === 'efectivo' && given > total) setFb({ ok: true, p: p(`Aquí tiene su cambio: ${fmtEuro(Math.round((given - total) * 100) / 100)}.`, `Ահա ձեր մանրը՝ ${fmtEuro(Math.round((given - total) * 100) / 100)}։`) });
                setPhase('after');
              }} />
            </div>
          )}
          {phase === 'after' && <Talk nodes={after} people={people} onEffect={effect} onEnd={(m) => {
            setMistakes((x) => x + m);
            setTrip({ bought: cart.map((c) => c.id) });
            setPhase('served');
            window.setTimeout(() => setFinished(true), 1800);
          }} />}
        </div>
      </div>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={togo ? p('Pedido para llevar. ¡A la puerta de embarque!', 'Պատվերը տանելու համար է։ Դեպի նստեցման դարպաս։') : p('Disfruta del desayuno antes del vuelo.', 'Վայելիր նախաճաշը թռիչքից առաջ։')} />}
    </div>
  );
}
