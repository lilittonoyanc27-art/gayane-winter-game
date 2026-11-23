import { useMemo, useState } from 'react';
import { Btn, Feedback, Instruction, type Fb } from '../../components/UI';
import { Talk, type TNode, type Who } from '../../components/Talk';
import { Person, LOOKS } from '../../components/Person';
import { Gayane } from '../../components/Gayane';
import { Drag, Drop } from '../../components/DnD';
import type { Mission } from '../../components/Life';
import { T, Phrase } from '../../core/translate';
import { sfx } from '../../core/sound';
import { useGame } from '../../core/store';
import { levelOk, p, type P } from '../../core/types';
import { Finish, LifeGrid, MissionGame, type Done } from './common';

const MISSIONS: Mission[] = [
  { id: 'checkin', icon: '🛎️', title: p('La recepción', 'Ընդունարան'), desc: p('Reserva, documentos y elección de habitación.', 'Ամրագրում, փաստաթղթեր և սենյակի ընտրություն։') },
  { id: 'habitacion', icon: '🛏️', title: p('Un problema en la habitación', 'Խնդիր սենյակում'), desc: p('Revisa la habitación y llama a recepción.', 'Ստուգիր սենյակը և զանգիր ընդունարան։') },
  { id: 'desayuno', icon: '🥐', title: p('El desayuno', 'Նախաճաշ'), desc: p('Prepara tu plato y habla con el camarero.', 'Պատրաստիր ափսեդ և խոսիր մատուցողի հետ։') },
];
const REC: Record<string, Who> = { r: { name: p('Recepcionista', 'Ընդունարանի աշխատակցուհի'), icon: '🛎️' } };

export function Hotel() {
  return (
    <MissionGame game="hotel" title={p('En el hotel', 'Հյուրանոցում')} icon="🏨" missions={MISSIONS}
      intro={<div className="place-intro"><Phrase p={p('Gayane llega al hotel Miramar, en Lisboa. Tiene una reserva para tres noches.', 'Գայանեն հասնում է Լիսաբոնի Միրամար հյուրանոց։ Երեք գիշերվա ամրագրում ունի։')} /></div>}
      render={(id, done) => (id === 'checkin' ? <Checkin done={done} /> : id === 'habitacion' ? <Room done={done} /> : <Breakfast done={done} />)} />
  );
}

function Lobby({ children }: { children?: React.ReactNode }) {
  return (
    <div className="lobby">
      <div className="lobby-wall"><span className="lobby-sign">HOTEL MIRAMAR</span><div className="lobby-keys">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div></div>
      <div className="lobby-rec"><Person look={LOOKS.recepcion} /></div>
      <div className="lobby-desk" />
      {children}
    </div>
  );
}

/* ---------- 1. Check-in ---------- */
const ROOMS = [
  { id: 'rio', name: p('Individual con vistas al río', 'Մեկտեղանոց՝ գետի տեսարանով'), price: 95, icon: '🌊' },
  { id: 'interior', name: p('Individual interior, tranquila', 'Մեկտեղանոց՝ ներքին, հանգիստ'), price: 80, icon: '🌿' },
  { id: 'doble', name: p('Doble con balcón', 'Երկտեղանոց՝ պատշգամբով'), price: 120, icon: '🌇' },
];
function Checkin({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const [step, setStep] = useState(0); // 0 talk · 1 passport · 2 talk2 · 3 room · 4 talk3 · 5 key
  const [room, setRoom] = useState<string | null>(null);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [onDesk, setOnDesk] = useState<string[]>([]);
  const [key, setKey] = useState(false);
  const [finished, setFinished] = useState(false);
  const t1: TNode[] = [
    { id: 's', who: 'r', line: p('Buenas tardes, bienvenida al hotel Miramar. ¿En qué puedo ayudarle?', 'Բարի օր, բարի գալուստ Միրամար հյուրանոց։ Ինչո՞վ կարող եմ օգնել։'), opts: [
      { p: p('Buenas tardes. Tengo una reserva a nombre de Gayane.', 'Բարի օր։ Գայանե անունով ամրագրում ունեմ։') },
      { p: p('Hola. Reservé una habitación por internet para tres noches.', 'Բարև։ Համացանցով սենյակ եմ ամրագրել երեք գիշերով։'), lv: 'A2' },
      { p: p('Quiero comer.', 'Ուզում եմ ուտել։'), ok: false, reply: p('El restaurante abre a las ocho. ¿Viene a registrarse en el hotel?', 'Ռեստորանը բացվում է ժամը ութին։ Եկել եք հյուրանոցում գրանցվելո՞ւ։') },
    ], next: 'd' },
    { id: 'd', who: 'r', line: p('Muy bien. ¿Me permite su pasaporte, por favor?', 'Շատ լավ։ Կտա՞ք ձեր անձնագիրը, խնդրում եմ։'), opts: [{ p: p('Por supuesto, aquí lo tiene.', 'Իհարկե, ահա այն։') }, { p: p('Claro. Un momento, que lo busco.', 'Իհարկե։ Մի րոպե, փնտրեմ։') }] },
  ];
  const t2: TNode[] = [
    { id: 's', who: 'r', line: p('Gracias. Su reserva es para tres noches, con desayuno incluido. Tengo varias habitaciones libres: ¿cuál prefiere?', 'Շնորհակալություն։ Ձեր ամրագրումը երեք գիշերվա համար է՝ նախաճաշը ներառված։ Մի քանի ազատ սենյակ ունեմ՝ ո՞րն եք նախընտրում։'), opts: [
      { p: p('¿Qué me recomienda?', 'Ի՞նչ եք խորհուրդ տալիս։'), reply: p('La habitación con vistas al río es preciosa, pero la interior es más tranquila.', 'Գետի տեսարանով սենյակը հիասքանչ է, բայց ներքինն ավելի հանգիստ է։') },
      { p: p('¿Hay alguna habitación tranquila? Mañana tengo que trabajar temprano.', 'Հանգիստ սենյակ կա՞։ Վաղը պետք է վաղ աշխատեմ։'), lv: 'B1', reply: p('Sí, la interior es muy silenciosa: da a un patio.', 'Այո, ներքինը շատ լուռ է՝ նայում է բակին։') },
    ] },
  ];
  const t3 = (): TNode[] => {
    const r = ROOMS.find((x) => x.id === room)!;
    return [
      { id: 's', who: 'r', line: p(`Perfecto: ${r.name.es.toLowerCase()}, ${r.price} euros la noche. Es la habitación trescientos cuatro, en la tercera planta.`, `Կատարյալ է՝ ${r.name.hy.toLowerCase()}, գիշերը ${r.price} եվրո։ Սա երեք հարյուր չորս սենյակն է, երրորդ հարկում։`), opts: [
        { p: p('Muy bien. ¿A qué hora es el desayuno?', 'Շատ լավ։ Ժամը քանիսի՞ն է նախաճաշը։'), reply: p('De siete a diez y media, en la planta baja.', 'Յոթից տասն անց կես, առաջին հարկում։') },
        { p: p('Perfecto. ¿Hay wifi en la habitación?', 'Կատարյալ է։ Սենյակում վայֆայ կա՞։'), reply: p('Sí, la contraseña está en la tarjeta de la habitación.', 'Այո, գաղտնաբառը սենյակի քարտի վրա է։') },
        { p: p('¿Sería posible dejar la maleta aquí el último día hasta la tarde?', 'Հնարավո՞ր է վերջին օրը ճամպրուկը մինչև երեկո թողնել այստեղ։'), lv: 'B2', reply: p('Por supuesto, tenemos consigna gratuita para nuestros clientes.', 'Իհարկե, մեր հաճախորդների համար անվճար պահարան ունենք։') },
      ], next: 'k' },
      { id: 'k', who: 'r', line: p('Aquí tiene la tarjeta de la habitación. El ascensor está a la derecha. ¡Que disfrute de su estancia!', 'Ահա սենյակի քարտը։ Վերելակն աջ կողմում է։ Հաճելի մնալ։'), opts: [{ p: p('Muchas gracias. Muy amable.', 'Շատ շնորհակալություն։ Շատ բարի եք։') }, { p: p('Gracias, hasta luego.', 'Շնորհակալություն, մինչ հանդիպում։') }] },
    ];
  };
  const giveDoc = (id: string) => {
    if (id !== 'pasaporte') { setMistakes((m) => m + 1); setFb({ ok: false, p: p('Solo necesito el pasaporte, gracias.', 'Ինձ պետք է միայն անձնագիրը, շնորհակալություն։') }); return; }
    sfx.drop(); setOnDesk(['🛂']); setStep(2);
  };
  const keep = () => { sfx.success(); setFinished(true); };
  const DOCS = [{ id: 'pasaporte', icon: '🛂', name: p('el pasaporte', 'անձնագիրը') }, { id: 'tarjeta', icon: '💳', name: p('la tarjeta de crédito', 'վարկային քարտը') }, { id: 'billete', icon: '🎫', name: p('la tarjeta de embarque', 'նստեցման կտրոնը') }];
  const rooms = ROOMS.filter((r) => r.id !== 'doble' || levelOk('A2', level));
  return (
    <div className="mission-play">
      <LifeGrid art={<Lobby>
        <Drop id="hdesk" className={'hdesk-drop ' + (step === 1 ? 'want' : '')} accept={(pl) => pl.kind === 'hdoc' && step === 1} onDrop={(pl) => giveDoc(pl.id)}>{onDesk.join(' ')}{key && ' 🔑'}</Drop>
        <div className="lobby-girl"><Gayane wear={['abrigo', 'bufanda', 'pantalones', 'botas']} /></div>
      </Lobby>}>
        {step === 0 && <Talk nodes={t1} people={REC} onEnd={(m) => (setMistakes((x) => x + m), setStep(1))} />}
        {step === 1 && <div className="task-box pop-in"><Instruction p={p('Dale el pasaporte a la recepcionista: arrástralo al mostrador.', 'Անձնագիրը տուր աշխատակցուհուն՝ քաշիր այն սեղանի վրա։')} icon="🛂" /><div className="bag-items">{DOCS.map((d) => <Drag key={d.id} kind="hdoc" id={d.id} className="bag-item" onTap={() => giveDoc(d.id)}><span className="bi-icon">{d.icon}</span><T p={d.name} /></Drag>)}</div></div>}
        {step === 2 && <Talk nodes={t2} people={REC} onEnd={(m) => (setMistakes((x) => x + m), setStep(3))} />}
        {step === 3 && (
          <div className="task-box pop-in">
            <Instruction p={p('Elige tu habitación.', 'Ընտրիր քո սենյակը։')} icon="🛏️" auto={false} />
            <div className="room-cards">
              {rooms.map((r) => (
                <button key={r.id} className={'room-card ' + (room === r.id ? 'on' : '')} onClick={() => (sfx.click(), setRoom(r.id))}>
                  <span>{r.icon}</span><T p={r.name} /><b>{r.price} € / <T p={p('noche', 'գիշեր')} /></b>
                </button>
              ))}
            </div>
            <Btn label={p('Elegir esta habitación', 'Ընտրել այս սենյակը')} icon="✓" disabled={!room} onClick={() => setStep(4)} />
          </div>
        )}
        {step === 4 && <Talk nodes={t3()} people={REC} onEnd={(m) => { setMistakes((x) => x + m); setKey(true); setStep(5); }} />}
        {step === 5 && (
          <div className="task-box pop-in">
            <Instruction p={p('Guarda la tarjeta de la habitación en el bolso.', 'Սենյակի քարտը պահիր պայուսակում։')} icon="🔑" />
            <div className="pass-row">
              <Drag kind="key" id="key" className="keycard" onTap={keep}><b>304</b><small>MIRAMAR</small></Drag>
              <Drop id="hbag" className="backpack-drop small" accept={(pl) => pl.kind === 'key'} onDrop={keep}><span className="bp-icon">👜</span><T p={p('Bolso', 'Պայուսակ')} /></Drop>
            </div>
          </div>
        )}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Ya tienes la habitación 304. ¡Bienvenida!', 'Արդեն ունես 304 սենյակը։ Բարի գալուստ։')} />}
    </div>
  );
}

/* ---------- 2. Room problem ---------- */
type RObj = { id: string; icon: string; name: P; ok: P; bad?: P };
function Room({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const b1 = levelOk('B1', level);
  const OBJS: RObj[] = [
    { id: 'luz', icon: '💡', name: p('la luz', 'լույսը'), ok: p('La luz funciona bien.', 'Լույսը լավ է աշխատում։') },
    { id: 'cortinas', icon: '🪟', name: p('las cortinas', 'վարագույրները'), ok: p('Abro las cortinas: ¡qué vistas!', 'Բացում եմ վարագույրները՝ ինչ տեսարան է։') },
    { id: 'toallas', icon: '🧺', name: p('el toallero', 'սրբիչակալը'), ok: p('', ''), bad: p('¡No hay toallas en el baño!', 'Լոգարանում սրբիչներ չկան։') },
    { id: 'aire', icon: '❄️', name: p('el aire acondicionado', 'օդորակիչը'), ok: p('El aire acondicionado funciona.', 'Օդորակիչն աշխատում է։'), bad: b1 ? p('El aire acondicionado no funciona y hace mucho calor.', 'Օդորակիչը չի աշխատում, և շատ շոգ է։') : undefined },
    { id: 'armario', icon: '🚪', name: p('el armario', 'պահարանը'), ok: p('Hay perchas suficientes en el armario.', 'Պահարանում բավականաչափ կախիչներ կան։') },
  ];
  const problems = OBJS.filter((o) => o.bad).map((o) => o.id);
  const [checked, setChecked] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [state, setState] = useState<Record<string, boolean>>({ luz: false, cortinas: false });
  const [phase, setPhase] = useState<'look' | 'call' | 'wait' | 'fixed'>('look');
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [fixed, setFixed] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const tap = (o: RObj) => {
    sfx.click();
    setChecked((c) => (c.includes(o.id) ? c : [...c, o.id]));
    if (o.id === 'luz' || o.id === 'cortinas') setState((s) => ({ ...s, [o.id]: !s[o.id] }));
    if (o.bad) { setFound((f) => (f.includes(o.id) ? f : [...f, o.id])); setFb({ ok: false, p: o.bad }); }
    else setFb({ ok: true, p: o.ok });
  };
  const call: TNode[] = useMemo(() => [
    { id: 's', who: 'r', line: p('Recepción, buenas noches. ¿En qué puedo ayudarle?', 'Ընդունարան, բարի երեկո։ Ինչո՞վ կարող եմ օգնել։'), opts: [
      { p: p('Hola, llamo de la habitación trescientos cuatro. No hay toallas en el baño.', 'Բարև, զանգում եմ երեք հարյուր չորս սենյակից։ Լոգարանում սրբիչներ չկան։'), next: problems.includes('aire') ? 'aire' : 'ok' },
      { p: p('Buenas noches. ¿Me podrían subir unas toallas a la trescientos cuatro, por favor?', 'Բարի երեկո։ Կարո՞ղ եք մի քանի սրբիչ բերել երեք հարյուր չորս, խնդրում եմ։'), lv: 'A2', next: problems.includes('aire') ? 'aire' : 'ok' },
      { p: p('Hola. Todo está perfecto.', 'Բարև։ Ամեն ինչ կատարյալ է։'), ok: false, reply: p('Me alegro… pero ¿por qué llama, entonces?', 'Ուրախ եմ… բայց ուրեմն ինչո՞ւ եք զանգում։') },
    ] },
    { id: 'aire', who: 'r', line: p('Disculpe las molestias. Ahora mismo se las subimos. ¿Algo más?', 'Ներողություն անհարմարության համար։ Հենց հիմա կբերենք։ Էլի ինչ-որ բան։'), opts: [
      { p: p('Sí, además el aire acondicionado no funciona y hace mucho calor.', 'Այո, բացի այդ, օդորակիչը չի աշխատում, և շատ շոգ է։'), next: 'aire2' },
      { p: p('No, nada más.', 'Ոչ, ուրիշ ոչինչ։'), ok: false, reply: p('¿Seguro? ¿Funciona todo lo demás?', 'Համոզվա՞ծ եք։ Մնացած ամեն ինչ աշխատո՞ւմ է։') },
    ] },
    { id: 'aire2', who: 'r', line: p('Lo siento mucho. Puedo enviar al técnico ahora o cambiarla de habitación. ¿Qué prefiere?', 'Շատ եմ ցավում։ Կարող եմ հիմա տեխնիկ ուղարկել կամ փոխել ձեր սենյակը։ Ի՞նչ եք նախընտրում։'), opts: [
      { p: p('Prefiero que venga el técnico, porque ya he deshecho la maleta.', 'Նախընտրում եմ, որ տեխնիկը գա, որովհետև արդեն ճամպրուկս դատարկել եմ։'), reply: p('De acuerdo, sube en diez minutos.', 'Լավ, տասը րոպեից կբարձրանա։') },
      { p: p('Si es posible, prefiero cambiar de habitación. Mañana tengo una reunión y necesito descansar.', 'Եթե հնարավոր է, նախընտրում եմ սենյակս փոխել։ Վաղը հանդիպում ունեմ և պետք է հանգստանամ։'), lv: 'B2', reply: p('Entendido. Le preparo la trescientos ocho, que es igual pero más fresca.', 'Հասկացա։ Ձեզ համար կպատրաստեմ երեք հարյուր ութը. նույնն է, բայց ավելի զով։') },
    ], next: 'ok' },
    { id: 'ok', who: 'r', line: p('Enseguida lo solucionamos. Perdone las molestias.', 'Անմիջապես կլուծենք։ Ներեցեք անհարմարության համար։'), opts: [{ p: p('Gracias por su ayuda.', 'Շնորհակալություն օգնության համար։') }, { p: p('No se preocupe. Muchas gracias.', 'Մի անհանգստացեք։ Շատ շնորհակալություն։') }] },
  ], [problems.join()]);
  const allFound = problems.every((x) => found.includes(x));
  return (
    <div className="mission-play">
      <LifeGrid art={
        <div className={'hroom ' + (state.luz ? 'lit' : '') + (state.cortinas ? ' open' : '')}>
          <div className="hr-window"><div className="hr-curtain l" /><div className="hr-curtain r" /></div>
          <div className="hr-bed" />
          <div className="hr-girl"><Gayane wear={['jersey', 'pantalones']} mood={found.length && phase === 'look' ? 'think' : 'happy'} /></div>
          {OBJS.map((o, i) => (
            <button key={o.id} className={'hobj2 o-' + o.id + (checked.includes(o.id) ? ' seen' : '') + (fixed.includes(o.id) ? ' fixed' : '')} onClick={() => tap(o)} disabled={phase !== 'look'} style={{ ['--i' as string]: i }}>
              <span>{o.id === 'toallas' && fixed.includes('toallas') ? '🧺🧻' : o.icon}</span><T p={o.name} />
            </button>
          ))}
        </div>
      }>
        {phase === 'look' && (
          <div className="task-box">
            <Instruction p={p('Revisa la habitación: toca los objetos y busca qué falla.', 'Ստուգիր սենյակը՝ հպիր առարկաներին և գտիր՝ ինչն է անսարք։')} icon="🔎" />
            <div className="muted">{checked.length} / {OBJS.length}</div>
            <Btn label={p('Llamar a recepción', 'Զանգել ընդունարան')} icon="☎️" disabled={!allFound} onClick={() => setPhase('call')} />
          </div>
        )}
        {phase === 'call' && <Talk nodes={call} people={REC} onEnd={(m) => { setMistakes((x) => x + m); setPhase('wait'); window.setTimeout(() => { sfx.bell(); setFixed(problems); setPhase('fixed'); }, 1800); }} />}
        {phase === 'wait' && <div className="task-box"><Phrase p={p('Llaman a la puerta…', 'Դուռը թակում են…')} /></div>}
        {phase === 'fixed' && (
          <div className="task-box pop-in">
            <Phrase p={p('Ya hay toallas limpias en el baño.', 'Լոգարանում արդեն մաքուր սրբիչներ կան։')} />
            <Btn label={p('Perfecto', 'Կատարյալ է')} icon="✓" onClick={() => setFinished(true)} />
          </div>
        )}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Problema resuelto. La habitación está perfecta.', 'Խնդիրը լուծված է։ Սենյակը կատարյալ է։')} />}
    </div>
  );
}

/* ---------- 3. Breakfast ---------- */
const BUFFET = [
  { id: 'cruasan', icon: '🥐', name: p('un cruasán', 'կրուասան'), cat: 'dulce' },
  { id: 'tostada', icon: '🍞', name: p('una tostada', 'տապակած հաց'), cat: 'salado' },
  { id: 'huevos', icon: '🍳', name: p('huevos revueltos', 'ձվածեղ'), cat: 'salado' },
  { id: 'fruta', icon: '🍓', name: p('fruta fresca', 'թարմ միրգ'), cat: 'fruta' },
  { id: 'yogur', icon: '🥣', name: p('un yogur', 'յոգուրտ'), cat: 'fruta' },
  { id: 'queso', icon: '🧀', name: p('queso', 'պանիր'), cat: 'salado' },
  { id: 'pastel', icon: '🥮', name: p('un pastel de nata', 'պաշտեյշ դե նատա'), cat: 'dulce' },
];
function Breakfast({ done }: { done: Done }) {
  const [plate, setPlate] = useState<string[]>([]);
  const [phase, setPhase] = useState<'plate' | 'talk'>('plate');
  const [cup, setCup] = useState<string | null>(null);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const goal = p('Prepara un desayuno equilibrado: algo salado, algo de fruta y algo dulce.', 'Պատրաստիր հավասարակշռված նախաճաշ՝ աղի ինչ-որ բան, միրգ և քաղցր ինչ-որ բան։');
  const cats = new Set(plate.map((x) => BUFFET.find((b) => b.id === x)!.cat));
  const addFood = (id: string) => {
    if (plate.includes(id)) { setPlate((x) => x.filter((y) => y !== id)); return; }
    if (plate.length >= 4) return setFb({ ok: false, p: p('El plato ya está lleno.', 'Ափսեն արդեն լիքն է։') });
    sfx.drop(); setPlate((x) => [...x, id]);
  };
  const talk: TNode[] = [
    { id: 's', who: 'c', line: p('Buenos días. ¿Café o té?', 'Բարի լույս։ Սո՞ւրճ, թե՞ թեյ։'), opts: [
      { p: p('Un café con leche, por favor.', 'Կաթով սուրճ, խնդրում եմ։'), effect: 'cafe' },
      { p: p('Té, por favor. ¿Tienen té verde?', 'Թեյ, խնդրում եմ։ Կանաչ թեյ ունե՞ք։'), effect: 'te', reply: p('Sí, ahora mismo se lo traigo.', 'Այո, հենց հիմա կբերեմ։') },
    ], next: 'n' },
    { id: 'n', who: 'c', line: p('¿Me dice su número de habitación?', 'Կասե՞ք ձեր սենյակի համարը։'), opts: [
      { p: p('La trescientos cuatro.', 'Երեք հարյուր չորսը։') },
      { p: p('La cuatrocientos tres.', 'Չորս հարյուր երեքը։'), ok: false, reply: p('Mmm, en la cuatrocientos tres no hay nadie. ¿Puede mirar la tarjeta?', 'Մմ, չորս հարյուր երեքում ոչ ոք չկա։ Կարո՞ղ եք նայել քարտին։') },
    ], next: 'q' },
    { id: 'q', who: 'c', lv: 'A2', line: p('¿Está todo a su gusto?', 'Ամեն ինչ ձեր ճաշակո՞վ է։'), opts: [
      { p: p('Sí, todo está buenísimo. ¿Hasta qué hora se puede desayunar?', 'Այո, ամեն ինչ շատ համեղ է։ Մինչև ժամը քանիսը կարելի է նախաճաշել։'), reply: p('Hasta las diez y media.', 'Մինչև տասն անց կես։') },
      { p: p('Sí, aunque el zumo está un poco caliente. ¿Me podría traer hielo?', 'Այո, թեև հյութը մի քիչ տաք է։ Կարո՞ղ եք սառույց բերել։'), lv: 'B1', reply: p('Claro, disculpe. Ahora mismo.', 'Իհարկե, ներեցեք։ Հենց հիմա։') },
    ] },
  ];
  return (
    <div className="mission-play">
      <LifeGrid art={
        <div className="buffet">
          <div className="bf-table">
            {BUFFET.map((b) => (
              <Drag key={b.id} kind="food" id={b.id} className={'bf-item ' + (plate.includes(b.id) ? 'taken' : '')} disabled={phase !== 'plate'} onTap={() => addFood(b.id)}>
                <span>{b.icon}</span><T p={b.name} />
              </Drag>
            ))}
          </div>
          <Drop id="plate" className="bf-plate" accept={(pl) => pl.kind === 'food'} onDrop={(pl) => addFood(pl.id)}>
            <span className="plate-items">{plate.map((x) => <span key={x}>{BUFFET.find((b) => b.id === x)!.icon}</span>)}</span>
            {cup && <span className="plate-cup">{cup}</span>}
            <small><T p={p('Tu plato', 'Քո ափսեն')} /></small>
          </Drop>
        </div>
      }>
        {phase === 'plate' && (
          <div className="task-box">
            <Instruction p={goal} icon="🍽️" />
            <div className="bf-check">
              <span className={cats.has('salado') ? 'ok' : ''}>✓ <T p={p('salado', 'աղի')} /></span>
              <span className={cats.has('fruta') ? 'ok' : ''}>✓ <T p={p('fruta', 'միրգ')} /></span>
              <span className={cats.has('dulce') ? 'ok' : ''}>✓ <T p={p('dulce', 'քաղցր')} /></span>
            </div>
            <Btn label={p('Sentarse a la mesa', 'Նստել սեղանի շուրջ')} icon="🪑" onClick={() => {
              if (cats.size < 3) { setMistakes((m) => m + 1); setFb({ ok: false, p: p('Te falta algo: mira la lista.', 'Ինչ-որ բան պակասում է՝ նայիր ցուցակին։') }); return; }
              setPhase('talk');
            }} />
          </div>
        )}
        {phase === 'talk' && <div className="talk-with"><Person look={LOOKS.camarero} className="mini-person" /><Talk nodes={talk} people={{ c: { name: p('Camarero', 'Մատուցող'), icon: '☕' } }} onEffect={(e) => setCup(e === 'cafe' ? '☕' : '🍵')} onEnd={(m) => { setMistakes((x) => x + m); setFinished(true); }} /></div>}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Un buen desayuno para empezar el día.', 'Լավ նախաճաշ՝ օրն սկսելու համար։')} />}
    </div>
  );
}
