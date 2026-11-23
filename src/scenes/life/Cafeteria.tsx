import { useState } from 'react';
import { Btn, Instruction, Feedback, type Fb } from '../../components/UI';
import { Talk, type TNode, type Who } from '../../components/Talk';
import { Person, LOOKS } from '../../components/Person';
import { Gayane } from '../../components/Gayane';
import type { Mission } from '../../components/Life';
import { T, Phrase } from '../../core/translate';
import { sfx } from '../../core/sound';
import { p, type P } from '../../core/types';
import { Finish, LifeGrid, MissionGame, type Done } from './common';

const MISSIONS: Mission[] = [
  { id: 'pedir', icon: '☕', title: p('Pedir para dos', 'Պատվիրել երկուսի համար'), desc: p('Ana te pide un café: pide para las dos.', 'Աննան սուրճ է խնդրում՝ պատվիրիր երկուսի համար։') },
  { id: 'trabajo', icon: '💼', title: p('Hablar del trabajo', 'Խոսել աշխատանքի մասին'), desc: p('Ana tiene una oferta de trabajo y duda.', 'Աննան աշխատանքի առաջարկ ունի և տատանվում է։') },
  { id: 'planes', icon: '🗓️', title: p('Hacer planes', 'Ծրագրեր կազմել'), desc: p('Quedad para el fin de semana.', 'Պայմանավորվեք շաբաթ-կիրակիի համար։') },
];
const ANA: Who = { name: p('Ana', 'Աննա'), icon: 'A', tone: 'friend' };
const CAM: Who = { name: p('Camarera', 'Մատուցողուհի'), icon: '☕' };

export function Cafeteria() {
  return (
    <MissionGame game="cafe" title={p('En una cafetería', 'Սրճարանում')} icon="☕" missions={MISSIONS}
      intro={<div className="place-intro"><Phrase p={p('Gayane queda con su amiga Ana en una cafetería cerca de la oficina.', 'Գայանեն հանդիպում է ընկերուհու՝ Աննայի հետ գրասենյակի մոտ գտնվող սրճարանում։')} /></div>}
      render={(id, done) => (id === 'pedir' ? <ForTwo done={done} /> : id === 'trabajo' ? <Work done={done} /> : <Plans done={done} />)} />
  );
}

function Cafe({ cups, mood }: { cups: string[]; mood?: 'happy' | 'think' }) {
  return (
    <div className="coffee">
      <div className="cf-wall"><span className="cf-sign">Café Jardín</span><div className="cf-plants"><i /><i /><i /></div></div>
      <div className="cf-ana"><Person look={LOOKS.amiga} /></div>
      <div className="cf-girl"><Gayane wear={['jersey', 'pantalones', 'botas']} mood={mood} /></div>
      <div className="cf-table"><span>{cups.map((c, i) => <span key={i} className="drop-in">{c}</span>)}</span></div>
    </div>
  );
}

const DRINKS = [
  { id: 'cortado', icon: '☕', name: p('un cortado', 'կորտադո (սուրճ մի քիչ կաթով)') },
  { id: 'capuchino', icon: '☕', name: p('un capuchino', 'կապուչինո') },
  { id: 'te', icon: '🍵', name: p('un té rojo', 'կարմիր թեյ') },
  { id: 'zumo', icon: '🧃', name: p('un zumo natural', 'թարմ քամած հյութ') },
];
function ForTwo({ done }: { done: Done }) {
  const [phase, setPhase] = useState<'ana' | 'pick' | 'order'>('ana');
  const [mine, setMine] = useState<string | null>(null);
  const [cups, setCups] = useState<string[]>([]);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const ana: TNode[] = [
    { id: 's', who: 'a', line: p('¡Hola, Gayane! Qué bien verte. ¿Pides tú? Yo quiero un capuchino, por favor.', 'Բարև, Գայանե։ Ինչ լավ է քեզ տեսնել։ Դո՞ւ կպատվիրես։ Ես կապուչինո եմ ուզում, խնդրում եմ։'), opts: [
      { p: p('¡Hola, Ana! Claro, ahora pido. ¿Algo para comer?', 'Բարև, Աննա։ Իհարկե, հիմա կպատվիրեմ։ Ուտելու բա՞ն։'), reply: p('No, gracias, solo el capuchino.', 'Ոչ, շնորհակալություն, միայն կապուչինոն։') },
      { p: p('Hola. Vale, un capuchino para ti.', 'Բարև։ Լավ, մեկ կապուչինո քեզ համար։') },
    ] },
  ];
  const order = (): TNode[] => {
    const d = DRINKS.find((x) => x.id === mine)!;
    return [
      { id: 's', who: 'c', line: p('Hola, buenas. ¿Qué os pongo?', 'Բարև։ Ի՞նչ բերեմ ձեզ։'), opts: [
        { p: p(`Para mí, ${d.name.es}, y para ella, un capuchino, por favor.`, `Ինձ՝ ${d.name.hy}, իսկ նրան՝ կապուչինո, խնդրում եմ։`), effect: 'serve' },
        { p: p(`Un capuchino y ${d.name.es}, por favor.`, `Մեկ կապուչինո և ${d.name.hy}, խնդրում եմ։`), effect: 'serve' },
        { p: p(`Dos ${d.id === 'te' ? 'tés' : 'zumos'}, por favor.`, 'Երկու հատ, խնդրում եմ։'), ok: false, reply: p('¿Dos iguales? Su amiga ha dicho capuchino, ¿no?', 'Երկու նույնը։ Ձեր ընկերուհին կապուչինո ասաց, չէ՞։') },
      ], next: 'm' },
      { id: 'm', who: 'c', lv: 'A2', line: p('¿La leche del capuchino, normal o de avena?', 'Կապուչինոյի կաթը՝ սովորակա՞ն, թե՞ վարսակի։'), opts: [
        { p: p('Un momento, que le pregunto… Ana, ¿leche normal o de avena? … De avena, por favor.', 'Մի րոպե, հարցնեմ… Աննա, սովորական կա՞թ, թե՞ վարսակի։ … Վարսակի, խնդրում եմ։') },
        { p: p('Normal, por favor.', 'Սովորական, խնդրում եմ։') },
      ], next: 'e' },
      { id: 'e', who: 'c', line: p('Enseguida os lo traigo.', 'Հենց հիմա կբերեմ։') },
    ];
  };
  return (
    <div className="mission-play">
      <LifeGrid art={<Cafe cups={cups} />}>
        {phase === 'ana' && <Talk nodes={ana} people={{ a: ANA }} onEnd={(m) => (setMistakes(m), setPhase('pick'))} />}
        {phase === 'pick' && (
          <div className="task-box pop-in">
            <Instruction p={p('¿Qué tomas tú? Elige tu bebida en la pizarra.', 'Իսկ դու ի՞նչ ես խմում։ Ընտրիր քո խմիչքը գրատախտակին։')} icon="🧾" auto={false} />
            <div className="chalk">{DRINKS.map((d) => <button key={d.id} className={'chalk-item ' + (mine === d.id ? 'on' : '')} onClick={() => (sfx.click(), setMine(d.id))}><span>{d.icon}</span><T p={d.name} /></button>)}</div>
            <Btn label={p('Llamar a la camarera', 'Կանչել մատուցողուհուն')} icon="✋" disabled={!mine || mine === 'capuchino'} onClick={() => setPhase('order')} />
            {mine === 'capuchino' && <T p={p('Elige algo diferente para ti.', 'Քեզ համար ուրիշ բան ընտրիր։')} className="muted" />}
          </div>
        )}
        {phase === 'order' && <Talk nodes={order()} people={{ c: CAM }} onEffect={(e) => e === 'serve' && (sfx.drop(), setCups(['☕', DRINKS.find((x) => x.id === mine)!.icon]))} onEnd={(m) => { setMistakes((x) => x + m); setFinished(true); }} />}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Las bebidas ya están en la mesa.', 'Խմիչքներն արդեն սեղանին են։')} />}
    </div>
  );
}

function Work({ done }: { done: Done }) {
  const [mistakes, setMistakes] = useState(0);
  const [mood, setMood] = useState<'happy' | 'think'>('happy');
  const [end, setEnd] = useState<string | null>(null);
  const nodes: TNode[] = [
    { id: 's', who: 'a', line: p('¿Y tú qué tal en el trabajo? Yo tengo una noticia: me han ofrecido un puesto en Barcelona.', 'Իսկ դու ինչպե՞ս ես աշխատանքում։ Ես մի նորություն ունեմ՝ Բարսելոնայում պաշտոն են առաջարկել։'), opts: [
      { p: p('¡Qué buena noticia! ¡Enhorabuena! ¿Es un trabajo mejor?', 'Ինչ լավ նորություն է։ Շնորհավորում եմ։ Ավելի լա՞վ աշխատանք է։'), next: 'q' },
      { p: p('¿De verdad? ¿Y qué vas a hacer? ¿Te quieres ir?', 'Իսկապե՞ս։ Եվ ի՞նչ ես անելու։ Ուզո՞ւմ ես գնալ։'), next: 'q' },
      { p: p('Ah. Yo tengo hambre.', 'Ա՜։ Ես սոված եմ։'), ok: false, reply: p('Ja, ja… Te estoy contando algo importante, ¿eh?', 'Հա-հա… Կարևոր բան եմ պատմում, հա՞։') },
    ] },
    { id: 'q', who: 'a', line: p('El sueldo es más alto y el proyecto es muy interesante, pero no conozco a nadie allí y me da miedo empezar de cero.', 'Աշխատավարձն ավելի բարձր է, և նախագիծը շատ հետաքրքիր է, բայց այնտեղ ոչ ոքի չեմ ճանաչում և վախենում եմ զրոյից սկսել։'), opts: [
      { p: p('Te entiendo. Yo creo que deberías aceptar: es una gran oportunidad.', 'Հասկանում եմ քեզ։ Կարծում եմ՝ պետք է ընդունես. մեծ հնարավորություն է։'), next: 'si', effect: 'think' },
      { p: p('Es normal tener miedo. ¿Por qué no pides unos días para pensarlo?', 'Վախենալը նորմալ է։ Ինչո՞ւ մի քանի օր չես խնդրում մտածելու համար։'), next: 'pensar', effect: 'think', lv: 'A2' },
      { p: p('Si yo fuera tú, hablaría primero con tu jefa: quizá puedas trabajar a distancia.', 'Ես քո տեղը լինեի, նախ կխոսեի ղեկավարիդ հետ. գուցե կարողանաս հեռավար աշխատել։'), next: 'distancia', effect: 'think', lv: 'B2' },
    ] },
    { id: 'si', who: 'a', line: p('Tienes razón. Además, Barcelona está a solo una hora en avión. ¿Vendrías a visitarme?', 'Իրավացի ես։ Բացի այդ, Բարսելոնան ինքնաթիռով ընդամենը մեկ ժամ է։ Կգա՞ս ինձ հյուր։'), opts: [
      { p: p('¡Claro que sí! Me encantaría.', 'Իհարկե։ Շատ կուզենայի։'), next: 'yo', effect: 'happy' },
      { p: p('Por supuesto. Y tú tienes que venir a Madrid a menudo.', 'Իհարկե։ Իսկ դու պետք է հաճախ գաս Մադրիդ։'), next: 'yo', effect: 'happy' },
    ] },
    { id: 'pensar', who: 'a', line: p('Buena idea. Me dan hasta el lunes para contestar. ¿Y tú? ¿Estás contenta en tu trabajo?', 'Լավ միտք է։ Մինչև երկուշաբթի ժամանակ են տալիս պատասխանելու։ Իսկ դու՞։ Գոհ ես աշխատանքիցդ։'), next: 'yo2' },
    { id: 'distancia', who: 'a', line: p('No lo había pensado… Sería perfecto: un par de días en la oficina y el resto desde aquí. Se lo propondré.', 'Չէի մտածել… Կատարյալ կլիներ՝ մի երկու օր գրասենյակում, մնացածը՝ այստեղից։ Կառաջարկեմ։'), effect: 'happy', next: 'yo2' },
    { id: 'yo', who: 'a', line: p('¡Gracias, Gayane! ¿Y tú? ¿Qué tal en tu trabajo?', 'Շնորհակալություն, Գայանե։ Իսկ դու՞։ Ինչպե՞ս ես աշխատանքում։'), next: 'yo2' },
    { id: 'yo2', who: 'a', line: p('Cuéntame algo de ti.', 'Ինձ մի բան պատմիր քո մասին։'), opts: [
      { p: p('Muy bien. Tengo mucho trabajo, pero me gusta mi equipo.', 'Շատ լավ։ Շատ աշխատանք ունեմ, բայց թիմս դուր է գալիս։') },
      { p: p('Bien, aunque estoy un poco cansada. Necesito vacaciones.', 'Լավ, թեև մի քիչ հոգնած եմ։ Արձակուրդ է պետք։'), reply: p('¡Pues vamos a planearlas pronto!', 'Ուրեմն շուտով պլանավորենք։') },
      { p: p('Estoy preparando una presentación importante y estoy un poco nerviosa, pero creo que saldrá bien.', 'Կարևոր ներկայացում եմ պատրաստում և մի քիչ նյարդայնանում եմ, բայց կարծում եմ՝ լավ կանցնի։'), lv: 'B1', reply: p('Seguro que sí. Eres muy buena en eso.', 'Անկասկած։ Դու դրանում շատ լավն ես։') },
    ] },
  ];
  return (
    <div className="mission-play">
      <LifeGrid art={<Cafe cups={['☕', '🍵']} mood={mood} />}>
        <Talk nodes={nodes} people={{ a: ANA }} onEffect={(e) => (e === 'think' || e === 'happy') && setMood(e)} onEnd={(m, id) => { setMistakes(m); setEnd(id); }} />
      </LifeGrid>
      {end && <Finish done={done} mistakes={mistakes} msg={p('Una buena conversación entre amigas.', 'Լավ զրույց ընկերուհիների միջև։')} />}
    </div>
  );
}

const SLOTS = [
  { id: 'sab-m', label: p('Sábado por la mañana', 'Շաբաթ առավոտ') },
  { id: 'sab-t', label: p('Sábado por la tarde', 'Շաբաթ կեսօրից հետո') },
  { id: 'dom-m', label: p('Domingo por la mañana', 'Կիրակի առավոտ') },
];
function Plans({ done }: { done: Done }) {
  const [phase, setPhase] = useState<'talk' | 'cal' | 'end'>('talk');
  const [slot, setSlot] = useState<string | null>(null);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const busy: Record<string, P> = { 'sab-m': p('Sábado por la mañana tienes clase de yoga.', 'Շաբաթ առավոտյան յոգայի դաս ունես։'), 'dom-m': p('Ana trabaja el domingo por la mañana.', 'Աննան կիրակի առավոտյան աշխատում է։') };
  const t1: TNode[] = [
    { id: 's', who: 'a', line: p('Oye, ¿hacemos algo este fin de semana? Hay una exposición de fotografía en el centro.', 'Լսիր, այս շաբաթ-կիրակի ինչ-որ բան անե՞նք։ Կենտրոնում լուսանկարչական ցուցահանդես կա։'), opts: [
      { p: p('¡Me encantaría! ¿Cuándo te viene bien?', 'Շատ կուզենայի։ Քեզ ե՞րբ է հարմար։'), next: 'w' },
      { p: p('Vale. ¿Qué día quedamos?', 'Լավ։ Ո՞ր օրը հանդիպենք։'), next: 'w' },
      { p: p('No me gusta salir.', 'Դուրս գալ չեմ սիրում։'), ok: false, reply: p('¿En serio? Siempre te gustan las exposiciones…', 'Լո՞ւրջ։ Քեզ միշտ դուր են գալիս ցուցահանդեսները…') },
    ] },
    { id: 'w', who: 'a', line: p('Yo el domingo por la mañana trabajo. ¿Y tú? Mira tu agenda.', 'Ես կիրակի առավոտյան աշխատում եմ։ Իսկ դու՞։ Նայիր օրացույցդ։') },
  ];
  const t2: TNode[] = [
    { id: 's', who: 'a', line: p('¿Entonces? ¿Cuándo quedamos?', 'Ուրեմն։ Ե՞րբ հանդիպենք։'), opts: [
      { p: p('¿Quedamos el sábado por la tarde, a las cinco, en la puerta del museo?', 'Հանդիպե՞նք շաբաթ երեկոյան՝ ժամը հինգին, թանգարանի մուտքի մոտ։') },
      { p: p('El sábado por la tarde me viene genial. ¿A las cinco te va bien?', 'Շաբաթ կեսօրից հետո ինձ համար հիանալի է։ Ժամը հինգը քեզ հարմա՞ր է։'), lv: 'A2' },
    ], next: 'e' },
    { id: 'e', who: 'a', line: p('¡Perfecto! Y después podemos cenar algo por allí.', 'Կատարյալ է։ Իսկ հետո կարող ենք այնտեղ ինչ-որ բան ընթրել։'), opts: [{ p: p('¡Genial! Hasta el sábado.', 'Հիանալի է։ Մինչ շաբաթ։') }, { p: p('Muy buena idea. Reservo yo el restaurante.', 'Շատ լավ միտք է։ Ռեստորանը ես կամրագրեմ։'), lv: 'B1' }] },
  ];
  return (
    <div className="mission-play">
      <LifeGrid art={<Cafe cups={['☕', '☕']} />}>
        {phase === 'talk' && <Talk nodes={t1} people={{ a: ANA }} onEnd={(m) => (setMistakes(m), setPhase('cal'))} />}
        {phase === 'cal' && (
          <div className="task-box pop-in">
            <Instruction p={p('Mira tu agenda y elige un momento libre para las dos.', 'Նայիր օրացույցդ և ընտրիր երկուսիդ համար ազատ ժամանակ։')} icon="🗓️" auto={false} />
            <div className="agenda">
              {SLOTS.map((s) => (
                <button key={s.id} className={'ag-slot ' + (slot === s.id ? 'on' : '') + (s.id === 'sab-m' ? ' busy' : '')} onClick={() => {
                  sfx.click();
                  if (busy[s.id]) { setMistakes((m) => m + 1); setFb({ ok: false, p: busy[s.id] }); return; }
                  setSlot(s.id);
                }}>
                  <T p={s.label} />{s.id === 'sab-m' && <small>🧘 <T p={p('Yoga 10:00', 'Յոգա 10:00')} /></small>}
                </button>
              ))}
            </div>
            <Btn label={p('Proponer', 'Առաջարկել')} icon="→" disabled={!slot} onClick={() => setPhase('end')} />
          </div>
        )}
        {phase === 'end' && <Talk nodes={t2} people={{ a: ANA }} onEnd={(m) => { setMistakes((x) => x + m); setFinished(true); }} />}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Plan hecho: sábado a las cinco en el museo.', 'Պլանը կազմված է՝ շաբաթ, ժամը հինգին, թանգարանում։')} />}
    </div>
  );
}
