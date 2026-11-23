import { useMemo, useState } from 'react';
import { Btn, Feedback, Instruction, go, type Fb } from '../../components/UI';
import { Talk, type TNode } from '../../components/Talk';
import { Gayane } from '../../components/Gayane';
import { Drag, Drop } from '../../components/DnD';
import { Announcement, type Mission } from '../../components/Life';
import { T, Phrase } from '../../core/translate';
import { sfx } from '../../core/sound';
import { useGame } from '../../core/store';
import { levelOk, p, type P } from '../../core/types';
import { shuffle } from '../../core/util';
import { Finish, LifeGrid, MissionGame, type Done } from './common';

const MISSIONS: Mission[] = [
  { id: 'agenda', icon: '🗓️', title: p('Planificar el día', 'Պլանավորել օրը'), desc: p('Escucha los mensajes y organiza tu agenda.', 'Լսիր հաղորդագրությունները և կազմիր օրակարգդ։') },
  { id: 'cena', icon: '🍳', title: p('Preparar la cena', 'Պատրաստել ընթրիքը'), desc: p('Una tortilla de patatas, paso a paso.', 'Կարտոֆիլով ձվածեղ՝ քայլ առ քայլ։') },
  { id: 'limpieza', icon: '🧽', title: p('Limpiar la casa', 'Մաքրել տունը'), desc: p('Cada tarea con su herramienta.', 'Յուրաքանչյուր գործ՝ իր գործիքով։') },
];

export function Planner() {
  return (
    <MissionGame game="planner" title={p('En casa', 'Տանը')} icon="🏠" missions={MISSIONS}
      intro={<div className="place-intro"><Phrase p={p('Un día normal en casa de Gayane: trabajo, recados, cena y orden.', 'Սովորական օր Գայանեի տանը՝ աշխատանք, գործեր, ընթրիք և կարգուկանոն։')} />
        <Btn label={p('Mi apartamento de invierno', 'Իմ ձմեռային բնակարանը')} icon="❄️" variant="soft" small onClick={() => go('home')} /></div>}
      render={(id, done) => (id === 'agenda' ? <Agenda done={done} /> : id === 'cena' ? <Dinner done={done} /> : <Clean done={done} />)} />
  );
}

/* ---------- agenda ---------- */
type Act = { id: string; icon: string; name: P; slot: string; lv?: 'A2' | 'B1' };
const SLOTS: { id: string; time: string }[] = [{ id: '9', time: '09:00' }, { id: '10', time: '10:00' }, { id: '14', time: '14:00' }, { id: '1730', time: '17:30' }, { id: '19', time: '19:00' }];
const ACTS: Act[] = [
  { id: 'reunion', icon: '💼', name: p('Reunión con el equipo', 'Հանդիպում թիմի հետ'), slot: '10' },
  { id: 'dentista', icon: '🦷', name: p('Cita con el dentista', 'Ատամնաբույժի մոտ այց'), slot: '1730' },
  { id: 'mama', icon: '📞', name: p('Llamar a mi madre', 'Զանգել մայրիկիս'), slot: '14' },
  { id: 'correo', icon: '📧', name: p('Contestar correos', 'Պատասխանել նամակներին'), slot: '9', lv: 'A2' },
  { id: 'yoga', icon: '🧘🏻‍♀️', name: p('Clase de yoga', 'Յոգայի դաս'), slot: '19', lv: 'B1' },
];
const MSGS: (P & { lv?: 'A2' | 'B1' })[] = [
  p('Hola, Gayane. Te recuerdo que mañana tenemos reunión con el equipo a las diez.', 'Բարև, Գայանե։ Հիշեցնում եմ, որ վաղը ժամը տասին թիմի հետ հանդիպում ունենք։'),
  p('Clínica Dental Sonrisa: le confirmamos su cita mañana a las cinco y media de la tarde.', '«Սոնրիսա» ատամնաբուժարան՝ հաստատում ենք ձեր այցը վաղը՝ երեկոյան ժամը հինգն անց կեսին։'),
  p('Hija, llámame mañana después de comer, sobre las dos.', 'Աղջիկս, վաղը ճաշից հետո զանգիր ինձ, մոտ ժամը երկուսին։'),
  { ...p('Antes de la reunión, a primera hora, contesta los correos de los clientes, por favor.', 'Հանդիպումից առաջ, առավոտ շուտ, պատասխանիր հաճախորդների նամակներին, խնդրում եմ։'), lv: 'A2' },
  { ...p('Al final del día, la clase de yoga de las siete sigue en pie.', 'Օրվա վերջում ժամը յոթի յոգայի դասը մնում է ուժի մեջ։'), lv: 'B1' },
];
function Agenda({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const acts = ACTS.filter((a) => !a.lv || levelOk(a.lv, level));
  const msgs = MSGS.filter((m) => !m.lv || levelOk(m.lv, level));
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [armed, setArmed] = useState<string | null>(null);
  const [m, setM] = useState(0);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const place = (id: string, slot: string) => {
    const a = ACTS.find((x) => x.id === id)!;
    if (a.slot !== slot) { setMistakes((k) => k + 1); setFb({ ok: false, p: p('Esa hora no coincide con el mensaje. Escúchalo otra vez.', 'Այդ ժամը չի համապատասխանում հաղորդագրությանը։ Նորից լսիր։') }); return; }
    sfx.drop();
    setArmed(null);
    const np = { ...placed, [a.id]: slot };
    setPlaced(np);
    if (acts.every((x) => np[x.id])) window.setTimeout(() => setFinished(true), 800);
  };
  return (
    <div className="mission-play">
      <Instruction p={p('Escucha los mensajes del móvil y coloca cada actividad en su hora.', 'Լսիր հեռախոսի հաղորդագրությունները և յուրաքանչյուր գործողություն տեղադրիր իր ժամին։')} icon="📱" />
      <LifeGrid art={
        <div className="agenda-big">
          {SLOTS.map((s) => (
            <Drop key={s.id} id={'slot' + s.id} className={'ag-row ' + (armed ? 'want' : '')} accept={(pl) => pl.kind === 'act'} onDrop={(pl) => place(pl.id, s.id)}>
              <button className="ag-tap" onClick={() => armed && place(armed, s.id)} aria-label={s.time} />
              <b>{s.time}</b>
              <span>{acts.filter((a) => placed[a.id] === s.id).map((a) => <span key={a.id} className="ag-act">{a.icon} <T p={a.name} /></span>)}</span>
            </Drop>
          ))}
        </div>
      }>
        <div className="task-box">
          <div className="phone-msgs">
            <div className="muted">📩 {m + 1} / {msgs.length}</div>
            <Announcement key={m} text={msgs[m]} icon="📱" label={p('Mensaje de voz', 'Ձայնային հաղորդագրություն')} />
            <div className="row-center">
              <Btn label={p('Anterior', 'Նախորդը')} small variant="soft" disabled={m === 0} onClick={() => setM(m - 1)} />
              <Btn label={p('Siguiente mensaje', 'Հաջորդ հաղորդագրությունը')} small disabled={m >= msgs.length - 1} onClick={() => setM(m + 1)} />
            </div>
          </div>
          <T p={p('Arrastra cada actividad a su hora, o tócala y después toca la hora.', 'Յուրաքանչյուր գործողություն քաշիր իր ժամին կամ հպիր դրան, հետո՝ ժամին։')} className="muted" />
          <div className="bag-items">{acts.filter((a) => !placed[a.id]).map((a) => <Drag key={a.id} kind="act" id={a.id} className={'bag-item ' + (armed === a.id ? 'armed' : '')} onTap={() => (sfx.click(), setArmed(a.id))}><span className="bi-icon">{a.icon}</span><T p={a.name} /></Drag>)}</div>
        </div>
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Tu agenda de mañana está lista.', 'Վաղվա օրակարգդ պատրաստ է։')} />}
    </div>
  );
}

/* ---------- dinner ---------- */
const STEPS_T: { id: string; t: P; pan: string }[] = [
  { id: 'pelar', t: p('Pelar las patatas', 'Մաքրել կարտոֆիլը'), pan: '🥔' },
  { id: 'cortar', t: p('Cortar las patatas y la cebolla', 'Կտրատել կարտոֆիլը և սոխը'), pan: '🔪' },
  { id: 'freir', t: p('Freírlas a fuego lento', 'Տապակել թույլ կրակի վրա'), pan: '🍟' },
  { id: 'batir', t: p('Batir los huevos con sal', 'Հարել ձվերը աղով'), pan: '🥚' },
  { id: 'mezclar', t: p('Mezclar las patatas con el huevo', 'Խառնել կարտոֆիլը ձվի հետ'), pan: '🥣' },
  { id: 'cuajar', t: p('Cuajar la tortilla en la sartén', 'Եփել ձվածեղը տապակում'), pan: '🍳' },
  { id: 'vuelta', t: p('Darle la vuelta con un plato', 'Ափսեով շրջել այն'), pan: '🥘' },
];
function Dinner({ done }: { done: Done }) {
  const level = useGame((s) => s.level);
  const [n, setN] = useState(0);
  const order = useMemo(() => shuffle(STEPS_T), []);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase] = useState<'cook' | 'call' | 'end'>('cook');
  const [finished, setFinished] = useState(false);
  const call: TNode[] = [
    { id: 's', who: 'a', line: p('¿Sí? ¡Hola, Gayane!', 'Այո՞։ Բարև, Գայանե։'), opts: [
      { p: p('¡Hola, Ana! He hecho tortilla de patatas. ¿Quieres venir a cenar?', 'Բարև, Աննա։ Կարտոֆիլով ձվածեղ եմ պատրաստել։ Ուզո՞ւմ ես գալ ընթրիքի։'), next: 'r' },
      { p: p('Hola. ¿Te apetece cenar en mi casa esta noche? He cocinado.', 'Բարև։ Այս երեկո կցանկանա՞ս ընթրել ինձ մոտ։ Ճաշ եմ պատրաստել։'), lv: 'A2', next: 'r' },
    ] },
    { id: 'r', who: 'a', line: p('¡Qué rica! Llego en media hora. ¿Llevo algo?', 'Ինչ համեղ է։ Կես ժամից կգամ։ Ինչ-որ բան բերե՞մ։'), opts: [
      { p: p('Si quieres, trae pan y algo de postre.', 'Եթե ուզում ես, հաց և աղանդեր բեր։') },
      { p: p('No hace falta, tengo de todo. ¡Hasta ahora!', 'Պետք չէ, ամեն ինչ ունեմ։ Մինչ հանդիպում։') },
    ] },
  ];
  return (
    <div className="mission-play">
      <Instruction p={p('Toca los pasos de la receta en el orden correcto.', 'Հպիր բաղադրատոմսի քայլերին ճիշտ հերթականությամբ։')} icon="📖" />
      <LifeGrid art={
        <div className="kitchen2">
          <div className="k2-wall"><span className="k2-recipe"><T p={p('Tortilla de patatas', 'Կարտոֆիլով ձվածեղ')} /></span></div>
          <div className="k2-stove"><div className={'k2-pan ' + (n >= 3 ? 'hot' : '')}>{n ? STEPS_T[n - 1].pan : '🍳'}</div></div>
          <div className="k2-girl"><Gayane wear={['jersey', 'pantalones']} /></div>
        </div>
      }>
        {phase === 'cook' && (
          <div className="task-box">
            <ol className="done-steps">{STEPS_T.slice(0, n).map((s) => <li key={s.id}><T p={s.t} /></li>)}</ol>
            <div className="step-cards">
              {order.filter((s) => STEPS_T.indexOf(s) >= n).map((s) => (
                <button key={s.id} className="choice" onClick={() => {
                  if (STEPS_T[n].id !== s.id) { setMistakes((m) => m + 1); setFb({ ok: false, p: p('Todavía no. Piensa qué se hace antes.', 'Դեռ ոչ։ Մտածիր՝ ինչ է արվում նախքան դա։') }); return; }
                  sfx.sizzle?.();
                  const k = n + 1; setN(k);
                  if (k === STEPS_T.length) { sfx.success(); setPhase(levelOk('A1', level) ? 'call' : 'end'); }
                }}><T p={s.t} /></button>
              ))}
            </div>
          </div>
        )}
        {phase === 'call' && <><Phrase p={p('¡La tortilla está lista! Llama a Ana para invitarla.', 'Ձվածեղը պատրաստ է։ Զանգիր Աննային՝ հրավիրելու։')} /><Talk nodes={call} people={{ a: { name: p('Ana', 'Աննա'), icon: 'A', tone: 'friend' } }} onEnd={(m) => { setMistakes((x) => x + m); setFinished(true); }} /></>}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('La cena está lista y Ana viene a cenar.', 'Ընթրիքը պատրաստ է, և Աննան գալիս է ընթրելու։')} />}
    </div>
  );
}

/* ---------- cleaning ---------- */
const TASKS = [
  { id: 'alfombra', icon: '🟫', name: p('la alfombra con migas', 'փշրանքներով գորգը'), tool: 'aspiradora' },
  { id: 'suelo', icon: '🟦', name: p('el suelo de la cocina', 'խոհանոցի հատակը'), tool: 'fregona' },
  { id: 'estanteria', icon: '📚', name: p('el polvo de la estantería', 'գրադարակի փոշին'), tool: 'trapo' },
  { id: 'platos', icon: '🍽️', name: p('los platos sucios', 'կեղտոտ ափսեները'), tool: 'lavavajillas' },
  { id: 'ropa', icon: '👕', name: p('la ropa sucia', 'կեղտոտ հագուստը'), tool: 'lavadora' },
];
const TOOLS = [
  { id: 'aspiradora', icon: '🧹', name: p('la aspiradora', 'փոշեկուլը') },
  { id: 'fregona', icon: '🪣', name: p('la fregona', 'հատակի շվաբրը') },
  { id: 'trapo', icon: '🧽', name: p('el trapo', 'լաթը') },
  { id: 'lavavajillas', icon: '🫧', name: p('el lavavajillas', 'աման լվացող մեքենան') },
  { id: 'lavadora', icon: '🌀', name: p('la lavadora', 'լվացքի մեքենան') },
];
function Clean({ done }: { done: Done }) {
  const [clean, setClean] = useState<string[]>([]);
  const [armed, setArmed] = useState<string | null>(null);
  const use = (tool: string, task: (typeof TASKS)[number]) => {
    if (clean.includes(task.id)) return;
    if (tool !== task.tool) { setMistakes((m) => m + 1); setFb({ ok: false, p: p(`Con ${TOOLS.find((x) => x.id === tool)!.name.es} no se puede limpiar ${task.name.es}.`, `${TOOLS.find((x) => x.id === tool)!.name.hy}-ով չի կարելի մաքրել ${task.name.hy}։`) }); return; }
    sfx.sparkle(); setArmed(null);
    const c = [...clean, task.id]; setClean(c);
    if (c.length === TASKS.length) window.setTimeout(() => setFinished(true), 900);
  };
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  return (
    <div className="mission-play">
      <Instruction p={p('Arrastra cada herramienta a la tarea correcta (o tócala y después toca la tarea).', 'Յուրաքանչյուր գործիք քաշիր ճիշտ գործի վրա (կամ հպիր դրան, հետո՝ գործին)։')} icon="🧽" />
      <LifeGrid art={
        <div className="flatx">
          {TASKS.map((t) => (
            <Drop key={t.id} id={'task-' + t.id} className={'flatx-task ' + (clean.includes(t.id) ? 'clean' : 'dirty')} accept={(pl) => pl.kind === 'tool'} onDrop={(pl) => use(pl.id, t)}>
              <button className="ag-tap" onClick={() => armed && use(armed, t)} aria-label={t.name.es} />
              <span className="ft-icon">{t.icon}{clean.includes(t.id) ? '✨' : ''}</span><T p={t.name} />
            </Drop>
          ))}
          <div className="flatx-girl"><Gayane wear={['camiseta', 'pantalones']} /></div>
        </div>
      }>
        <div className="task-box"><div className="bag-items">{TOOLS.map((t) => <Drag key={t.id} kind="tool" id={t.id} className={'bag-item ' + (armed === t.id ? 'armed' : '')} onTap={() => (sfx.click(), setArmed(t.id))}><span className="bi-icon">{t.icon}</span><T p={t.name} /></Drag>)}</div></div>
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('¡La casa está impecable!', 'Տունը մաքուր է ու կոկիկ։')} />}
    </div>
  );
}
