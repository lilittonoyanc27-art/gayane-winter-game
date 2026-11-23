import { useMemo, useState } from 'react';
import { Btn, Feedback, Instruction, type Fb } from '../../components/UI';
import { Talk, type TNode } from '../../components/Talk';
import { Person, LOOKS } from '../../components/Person';
import { Pay, type Mission } from '../../components/Life';
import { T, Phrase } from '../../core/translate';
import { sfx } from '../../core/sound';
import { useGame } from '../../core/store';
import { levelOk, p, type P } from '../../core/types';
import { fmtEuro } from '../../core/util';
import { Finish, LifeGrid, MissionGame, type Done } from './common';

const MISSIONS: Mission[] = [
  { id: 'pedir', icon: '🍷', title: p('Pedir la cena', 'Պատվիրել ընթրիքը'), desc: p('La carta, recomendaciones y alergias.', 'Ճաշացանկը, խորհուրդներ և ալերգիաներ։') },
  { id: 'problema', icon: '🍲', title: p('Un plato frío', 'Սառը ճաշատեսակ'), desc: p('Explica el problema con educación.', 'Քաղաքավարի բացատրիր խնդիրը։') },
  { id: 'cuenta', icon: '🧾', title: p('La cuenta', 'Հաշիվը'), desc: p('Revisa la cuenta, la propina y paga.', 'Ստուգիր հաշիվը, թեյավճարը և վճարիր։') },
];
type Dish = { id: string; sec: 'entrante' | 'principal' | 'postre' | 'bebida'; name: P; price: number; icon: string; tags?: string[] };
const CARTA: Dish[] = [
  { id: 'sopa', sec: 'entrante', name: p('Sopa de verduras', 'Բանջարեղենային ապուր'), price: 6.5, icon: '🥣', tags: ['veg'] },
  { id: 'gambas', sec: 'entrante', name: p('Gambas al ajillo', 'Ծովախեցգետին սխտորով'), price: 9, icon: '🍤', tags: ['marisco'] },
  { id: 'ensalada', sec: 'entrante', name: p('Ensalada de queso de cabra', 'Աղցան այծի պանրով'), price: 8, icon: '🥗', tags: ['veg', 'lacteo'] },
  { id: 'bacalao', sec: 'principal', name: p('Bacalao con patatas', 'Ձողաձուկ կարտոֆիլով'), price: 16, icon: '🐟', tags: ['pescado'] },
  { id: 'pollo', sec: 'principal', name: p('Pollo asado con verduras', 'Տապակած հավ բանջարեղենով'), price: 14, icon: '🍗' },
  { id: 'risotto', sec: 'principal', name: p('Risotto de setas', 'Սնկով ռիզոտո'), price: 13.5, icon: '🍚', tags: ['veg', 'lacteo'] },
  { id: 'flan', sec: 'postre', name: p('Flan casero', 'Տնական ֆլան'), price: 5, icon: '🍮', tags: ['lacteo'] },
  { id: 'fruta', sec: 'postre', name: p('Fruta de temporada', 'Սեզոնային միրգ'), price: 4.5, icon: '🍊', tags: ['veg'] },
  { id: 'agua', sec: 'bebida', name: p('Agua mineral', 'Հանքային ջուր'), price: 2.5, icon: '💧' },
  { id: 'vino', sec: 'bebida', name: p('Copa de vino tinto', 'Մի բաժակ կարմիր գինի'), price: 4.5, icon: '🍷' },
];
const SECS: { id: Dish['sec']; name: P }[] = [
  { id: 'entrante', name: p('Entrantes', 'Նախուտեստներ') },
  { id: 'principal', name: p('Platos principales', 'Հիմնական ուտեստներ') },
  { id: 'postre', name: p('Postres', 'Աղանդեր') },
  { id: 'bebida', name: p('Bebidas', 'Խմիչքներ') },
];

export function Restaurant() {
  const [order, setOrder] = useState<Dish[]>([]);
  return (
    <MissionGame game="restaurant" title={p('En un restaurante', 'Ռեստորանում')} icon="🍽️" missions={MISSIONS}
      intro={<div className="place-intro"><Phrase p={p('Gayane cena en «Casa Lua», un restaurante pequeño del barrio antiguo.', 'Գայանեն ընթրում է «Կասա Լուա»-ում՝ հին թաղամասի մի փոքրիկ ռեստորանում։')} /></div>}
      render={(id, done) => (id === 'pedir' ? <Order done={done} onOrder={setOrder} /> : id === 'problema' ? <Cold done={done} /> : <Bill done={done} order={order} />)} />
  );
}

function Table({ items, children }: { items: string[]; children?: React.ReactNode }) {
  return (
    <div className="resto">
      <div className="resto-wall"><span className="resto-sign">Casa Lua</span><div className="resto-lamps"><i /><i /><i /></div></div>
      <div className="resto-waiter"><Person look={LOOKS.camarero} /></div>
      <div className="resto-table"><span className="rt-items">{items.map((x, i) => <span key={i} className="drop-in">{x}</span>)}</span><i className="candle" /></div>
      {children}
    </div>
  );
}

function Order({ done, onOrder }: { done: Done; onOrder: (d: Dish[]) => void }) {
  const level = useGame((s) => s.level);
  const allergy = levelOk('B1', level);
  const [phase, setPhase] = useState<'greet' | 'menu' | 'talk'>('greet');
  const [sel, setSel] = useState<Dish[]>([]);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [served, setServed] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const greet: TNode[] = [
    { id: 's', who: 'c', line: p('Buenas noches. ¿Tiene reserva?', 'Բարի երեկո։ Ամրագրում ունե՞ք։'), opts: [
      { p: p('Sí, una mesa para una persona a nombre de Gayane.', 'Այո, մեկ հոգու սեղան՝ Գայանե անունով։') },
      { p: p('No, no tengo reserva. ¿Tienen una mesa libre para una persona?', 'Ոչ, ամրագրում չունեմ։ Մեկ հոգու ազատ սեղան ունե՞ք։'), reply: p('Sí, tenemos una junto a la ventana.', 'Այո, ունենք մեկը՝ պատուհանի մոտ։') },
    ], next: 'b' },
    { id: 'b', who: 'c', line: p('Aquí tiene la carta. ¿Le traigo algo de beber mientras decide?', 'Ահա ճաշացանկը։ Խմելու ինչ-որ բան բերե՞մ, մինչ որոշում եք։'), opts: [
      { p: p('Sí, un agua mineral, por favor.', 'Այո, հանքային ջուր, խնդրում եմ։'), effect: 'agua' },
      { p: p('¿Qué vino me recomienda?', 'Ո՞ր գինին եք խորհուրդ տալիս։'), lv: 'A2', reply: p('El tinto de la casa es muy suave. ¿Le pongo una copa?', 'Տան կարմիր գինին շատ նուրբ է։ Մի բաժակ լցնե՞մ։'), effect: 'vino' },
    ] },
  ];
  const ent = sel.find((d) => d.sec === 'entrante');
  const pri = sel.find((d) => d.sec === 'principal');
  const pos = sel.find((d) => d.sec === 'postre');
  const talk = useMemo((): TNode[] => {
    if (!ent || !pri) return [];
    const n: TNode[] = [
      { id: 's', who: 'c', line: p('¿Ya ha decidido? ¿Qué va a tomar?', 'Արդեն որոշե՞լ եք։ Ի՞նչ եք ճաշելու։'), opts: [
        { p: p(`De primero, ${ent.name.es.toLowerCase()}, y de segundo, ${pri.name.es.toLowerCase()}.`, `Առաջինին՝ ${ent.name.hy.toLowerCase()}, իսկ երկրորդին՝ ${pri.name.hy.toLowerCase()}։`), effect: 'order' },
        { p: p(`Para empezar, quisiera ${ent.name.es.toLowerCase()}. Después, ${pri.name.es.toLowerCase()}, por favor.`, `Սկսելու համար կցանկանայի ${ent.name.hy.toLowerCase()}։ Հետո՝ ${pri.name.hy.toLowerCase()}, խնդրում եմ։`), lv: 'A2', effect: 'order' },
        { p: p('Todo, por favor.', 'Ամեն ինչ, խնդրում եմ։'), ok: false, reply: p('¿Todo? Ja, ja… ¿Qué le apetece de primero y de segundo?', 'Ամեն ինչ։ Հա-հա… Առաջինին և երկրորդին ի՞նչ եք ուզում։') },
      ], next: allergy ? 'al' : 'p' },
    ];
    if (allergy) n.push({ id: 'al', who: 'c', line: p('¿Tiene alguna alergia o intolerancia?', 'Ալերգիա կամ անհանդուրժողականություն ունե՞ք։'), opts: [
      { p: p('Sí, soy alérgica al marisco. ¿Los platos que he pedido llevan marisco?', 'Այո, ծովամթերքից ալերգիա ունեմ։ Իմ պատվիրած ճաշատեսակներում ծովամթերք կա՞։'), reply: ent.tags?.includes('marisco') || pri.tags?.includes('marisco') ? p('Las gambas, sí. Le recomiendo cambiarlas por la sopa de verduras.', 'Ծովախեցգետինը՝ այո։ Խորհուրդ եմ տալիս փոխել բանջարեղենային ապուրով։') : p('No, ninguno lleva marisco. Puede estar tranquila.', 'Ոչ, ոչ մեկում ծովամթերք չկա։ Կարող եք հանգիստ լինել։'), effect: 'checkAllergy' },
      { p: p('No, ninguna. Gracias por preguntar.', 'Ոչ, ոչ մի։ Շնորհակալություն հարցնելու համար։') },
    ], next: 'p' });
    n.push({ id: 'p', who: 'c', line: p('Muy bien. ¿Y de postre? Se lo puedo preguntar después, si prefiere.', 'Շատ լավ։ Իսկ աղանդե՞ր։ Եթե նախընտրում եք, կարող եմ հետո հարցնել։'), opts: [
      ...(pos ? [{ p: p(`De postre, ${pos.name.es.toLowerCase()}, por favor.`, `Աղանդերին՝ ${pos.name.hy.toLowerCase()}, խնդրում եմ։`), effect: 'postre' }] : []),
      { p: p('Mejor después, gracias.', 'Ավելի լավ է՝ հետո, շնորհակալություն։') },
      { p: p('¿Qué postre me recomienda?', 'Ո՞ր աղանդերն եք խորհուրդ տալիս։'), lv: 'A2', reply: p('El flan casero es nuestra especialidad.', 'Տնական ֆլանը մեր մասնագիտացումն է։') },
    ], next: 'e' });
    n.push({ id: 'e', who: 'c', line: p('Perfecto. Enseguida le traigo el primero.', 'Կատարյալ է։ Հենց հիմա կբերեմ առաջինը։'), effect: 'serve' });
    return n;
  }, [phase]);
  const effect = (e: string) => {
    if (e === 'agua') setServed((s) => [...s, '💧']);
    if (e === 'vino') setServed((s) => [...s, '🍷']);
    if (e === 'checkAllergy' && ent?.tags?.includes('marisco')) setSel((s) => s.map((d) => (d.id === 'gambas' ? CARTA[0] : d)));
    if (e === 'serve') { sfx.drop(); setServed((s) => [...s, (sel.find((d) => d.sec === 'entrante') ?? CARTA[0]).icon]); }
  };
  const toggle = (d: Dish) => { sfx.click(); setSel((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s.filter((x) => x.sec !== d.sec), d])); };
  return (
    <div className="mission-play">
      <LifeGrid art={<Table items={served} />}>
        {phase === 'greet' && <Talk nodes={greet} people={{ c: { name: p('Camarero', 'Մատուցող'), icon: '🍽️' } }} onEffect={effect} onEnd={(m) => (setMistakes((x) => x + m), setPhase('menu'))} />}
        {phase === 'menu' && (
          <div className="task-box pop-in">
            <Instruction p={p('Elige un entrante y un plato principal. El postre es opcional.', 'Ընտրիր մեկ նախուտեստ և մեկ հիմնական ուտեստ։ Աղանդերը ըստ ցանկության է։')} icon="📖" auto={false} />
            <div className="carta">
              <div className="carta-title">Casa Lua · <T p={p('Carta', 'Ճաշացանկ')} /></div>
              {SECS.filter((s) => s.id !== 'bebida').map((s) => (
                <div key={s.id} className="carta-sec">
                  <div className="carta-sec-name"><T p={s.name} /></div>
                  {CARTA.filter((d) => d.sec === s.id).map((d) => (
                    <button key={d.id} className={'carta-item ' + (sel.includes(d) ? 'on' : '')} onClick={() => toggle(d)}>
                      <span>{d.icon}</span><T p={d.name} /><b>{fmtEuro(d.price)}</b>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <Btn label={p('Llamar al camarero', 'Կանչել մատուցողին')} icon="✋" disabled={!ent || !pri} onClick={() => { onOrder(sel); setPhase('talk'); }} />
          </div>
        )}
        {phase === 'talk' && <Talk nodes={talk} people={{ c: { name: p('Camarero', 'Մատուցող'), icon: '🍽️' } }} onEffect={effect} onEnd={(m) => { setMistakes((x) => x + m); onOrder(sel); setFinished(true); }} />}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Pedido hecho. ¡Buen provecho!', 'Պատվերը կատարված է։ Բարի ախորժակ։')} />}
    </div>
  );
}

function Cold({ done }: { done: Done }) {
  const [steam, setSteam] = useState(false);
  const [touched, setTouched] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const nodes: TNode[] = [
    { id: 's', who: 'c', line: p('¿Qué tal está todo?', 'Ինչպե՞ս է ամեն ինչ։'), opts: [
      { p: p('Perdone, pero el risotto está frío. ¿Me lo podría calentar, por favor?', 'Ներեցեք, բայց ռիզոտոն սառն է։ Կարո՞ղ եք տաքացնել, խնդրում եմ։'), next: 'r' },
      { p: p('Disculpe, la comida está buena, pero el plato ha llegado frío. ¿Sería posible calentarlo?', 'Ներեցեք, ուտելիքը համեղ է, բայց ճաշատեսակը սառն է եկել։ Հնարավո՞ր է տաքացնել։'), lv: 'B1', next: 'r' },
      { p: p('¡Esto es horrible! ¡No voy a pagar!', 'Սա սարսափելի է։ Չեմ վճարելու։'), ok: false, reply: p('Lo siento mucho, señora. Dígame qué ocurre y lo solucionamos.', 'Շատ եմ ցավում, տիկին։ Ասեք՝ ինչ է պատահել, և կլուծենք։') },
      { p: p('Todo perfecto, gracias.', 'Ամեն ինչ կատարյալ է, շնորհակալություն։'), ok: false, reply: p('¿Seguro? Veo que no está comiendo…', 'Համոզվա՞ծ եք։ Տեսնում եմ՝ չեք ուտում…') },
    ] },
    { id: 'r', who: 'c', line: p('Lo siento muchísimo. Se lo cambio ahora mismo por uno recién hecho. ¿Le apetece algo mientras espera?', 'Անչափ ցավում եմ։ Հիմա կփոխեմ թարմ պատրաստվածով։ Սպասելու ընթացքում ինչ-որ բան կուզե՞ք։'), opts: [
      { p: p('No, gracias. No se preocupe.', 'Ոչ, շնորհակալություն։ Մի անհանգստացեք։') },
      { p: p('Un poco más de pan, por favor.', 'Մի քիչ էլ հաց, խնդրում եմ։'), reply: p('Ahora mismo.', 'Հենց հիմա։') },
    ], next: 'e' },
    { id: 'e', who: 'c', line: p('Aquí tiene: recién hecho. Y el postre corre a cuenta de la casa, por las molestias.', 'Վերցրեք՝ թարմ պատրաստված։ Իսկ աղանդերը տան հաշվին է՝ անհարմարության համար։'), effect: 'hot', opts: [
      { p: p('¡Qué amable! Muchas gracias.', 'Ինչ բարի եք։ Շատ շնորհակալություն։') },
      { p: p('No hacía falta, pero se lo agradezco mucho.', 'Պետք չէր, բայց շատ շնորհակալ եմ։'), lv: 'B1' },
    ] },
  ];
  return (
    <div className="mission-play">
      <LifeGrid art={<Table items={['💧', steam ? '🍚♨️' : '🍚']}><button className="plate-touch" onClick={() => { sfx.click(); setTouched(true); }}>🍚 <T p={p('Probar el plato', 'Համտեսել ուտեստը')} /></button></Table>}>
        {!touched ? <div className="task-box"><Instruction p={p('Prueba tu plato principal.', 'Համտեսիր քո հիմնական ուտեստը։')} icon="🍴" /></div>
          : <><Instruction p={p('¡Está frío! Explícaselo al camarero con educación.', 'Սառն է։ Քաղաքավարի բացատրիր մատուցողին։')} icon="🥶" auto={false} />
            <Talk nodes={nodes} people={{ c: { name: p('Camarero', 'Մատուցող'), icon: '🍽️' } }} onEffect={(e) => e === 'hot' && (sfx.sizzle(), setSteam(true))} onEnd={(m) => { setMistakes(m); setFinished(true); }} /></>}
      </LifeGrid>
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Problema resuelto con educación.', 'Խնդիրը լուծված է քաղաքավարի կերպով։')} />}
    </div>
  );
}

function Bill({ done, order }: { done: Done; order: Dish[] }) {
  const items = order.length ? order : [CARTA[0], CARTA[5], CARTA[8]];
  const [phase, setPhase] = useState<'ask' | 'check' | 'talk' | 'pay'>('ask');
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [tip, setTip] = useState(0);
  const [finished, setFinished] = useState(false);
  const extra = { id: 'error', name: p('Gambas al ajillo', 'Ծովախեցգետին սխտորով'), price: 9, icon: '🍤' } as Dish;
  const lines = [...items, extra];
  const sum = (l: Dish[]) => Math.round(l.reduce((a, b) => a + b.price, 0) * 100) / 100;
  const [fixed, setFixed] = useState(false);
  const total = sum(fixed ? items : lines);
  const ask: TNode[] = [{ id: 's', who: 'c', line: p('¿Desea algo más? ¿Un café?', 'Էլի ինչ-որ բան կցանկանա՞ք։ Սուրճ։'), opts: [
    { p: p('No, gracias. ¿Me trae la cuenta, por favor?', 'Ոչ, շնորհակալություն։ Կբերե՞ք հաշիվը, խնդրում եմ։') },
    { p: p('La cuenta, por favor.', 'Հաշիվը, խնդրում եմ։') },
    { p: p('Me voy.', 'Գնում եմ։'), ok: false, reply: p('Perdone… ¿le traigo la cuenta?', 'Ներեցեք… հաշիվը բերե՞մ։') },
  ] }];
  const complain: TNode[] = [{ id: 's', who: 'c', line: p('¿Está todo correcto?', 'Ամեն ինչ ճի՞շտ է։'), opts: [
    { p: p('Perdone, creo que hay un error: yo no he pedido gambas.', 'Ներեցեք, կարծում եմ՝ սխալ կա. ես ծովախեցգետին չեմ պատվիրել։'), effect: 'fix', reply: p('Tiene razón, disculpe. Ahora mismo la corrijo.', 'Իրավացի եք, ներեցեք։ Հենց հիմա կուղղեմ։') },
    { p: p('Sí, todo bien.', 'Այո, ամեն ինչ լավ է։'), ok: false, reply: p('¿Seguro? Revise las líneas, por favor.', 'Համոզվա՞ծ եք։ Ստուգեք տողերը, խնդրում եմ։') },
  ] }];
  return (
    <div className="mission-play">
      <LifeGrid art={<Table items={items.map((d) => d.icon)} />}>
        {phase === 'ask' && <Talk nodes={ask} people={{ c: { name: p('Camarero', 'Մատուցող'), icon: '🍽️' } }} onEnd={(m) => (setMistakes(m), setPhase('check'))} />}
        {(phase === 'check' || phase === 'talk') && (
          <div className="task-box pop-in">
            <Instruction p={p('Revisa la cuenta. Si hay un error, toca la línea equivocada.', 'Ստուգիր հաշիվը։ Եթե սխալ կա, հպիր սխալ տողին։')} icon="🧾" auto={false} />
            <div className="lreceipt big">
              <b>CASA LUA</b>
              {(fixed ? items : lines).map((d, i) => (
                <button key={i} className="rline" onClick={() => {
                  if (phase !== 'check') return;
                  if (d.id === 'error') { sfx.ding(); setPhase('talk'); }
                  else { setMistakes((m) => m + 1); setFb({ ok: false, p: p('Esa línea es correcta: lo has pedido tú.', 'Այդ տողը ճիշտ է՝ դու ես պատվիրել։') }); }
                }}><span>{d.name.es}</span><span>{fmtEuro(d.price)}</span></button>
              ))}
              <div className="rline"><b>TOTAL</b><b>{fmtEuro(total)}</b></div>
            </div>
            {phase === 'talk' && <Talk nodes={complain} people={{ c: { name: p('Camarero', 'Մատուցող'), icon: '🍽️' } }} onEffect={(e) => e === 'fix' && setFixed(true)} onEnd={(m) => (setMistakes((x) => x + m), setPhase('pay'))} />}
          </div>
        )}
        {phase === 'pay' && (
          <div className="task-box pop-in">
            <Phrase p={p('En Portugal y en España la propina es voluntaria. ¿Dejas algo?', 'Պորտուգալիայում և Իսպանիայում թեյավճարը կամավոր է։ Ինչ-որ բան թողնո՞ւմ ես։')} />
            <div className="tip-row">
              {[0, 2, 5].map((t) => <button key={t} className={'lchip ' + (tip === t ? 'on' : '')} onClick={() => setTip(t)}>{t ? `+${t} €` : <T p={p('Sin propina', 'Առանց թեյավճարի')} />}</button>)}
            </div>
            <Pay total={Math.round((total + tip) * 100) / 100} onPaid={() => setFinished(true)} />
          </div>
        )}
      </LifeGrid>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && <Finish done={done} mistakes={mistakes} msg={p('Cuenta revisada y pagada. ¡Buenas noches!', 'Հաշիվը ստուգված է և վճարված։ Բարի գիշեր։')} />}
    </div>
  );
}
