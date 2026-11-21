import { useState } from 'react';
import { Gayane } from '../components/Gayane';
import { WeatherWindow } from '../components/Snow';
import { Dialogue, type Script } from '../components/Dialogue';
import { Btn, Feedback, Instruction, Reward, SceneHeader, Steps, type Fb } from '../components/UI';
import { useDraggable, useDropTarget } from '../core/dnd';
import { T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { markDifficult } from '../core/store';
import { p, type P } from '../core/types';

/* -------------------- 1. tidy up -------------------- */
const MESS: { id: string; icon: string; name: P; dest: string; instr: P; x: number; y: number }[] = [
  { id: 'calcetines', icon: '🧦', name: p('los calcetines', 'գուլպաները'), dest: 'cesto', instr: p('Recoge los calcetines y ponlos en el cesto de la ropa.', 'Հավաքիր գուլպաները և դիր լվացքի զամբյուղի մեջ։'), x: 18, y: 76 },
  { id: 'libros', icon: '📚', name: p('los libros', 'գրքերը'), dest: 'estanteria', instr: p('Coloca los libros en la estantería.', 'Գրքերը դասավորիր գրադարակում։'), x: 52, y: 80 },
  { id: 'taza', icon: '☕', name: p('la taza sucia', 'կեղտոտ բաժակը'), dest: 'fregadero', instr: p('Lleva la taza sucia al fregadero.', 'Կեղտոտ բաժակը տար լվացարան։'), x: 70, y: 58 },
  { id: 'papeles', icon: '📄', name: p('los papeles', 'թղթերը'), dest: 'papelera', instr: p('Tira los papeles a la papelera.', 'Թղթերը նետիր աղբամանը։'), x: 36, y: 64 },
  { id: 'camiseta', icon: '👕', name: p('la camiseta', 'շապիկը'), dest: 'cesto', instr: p('La camiseta también va al cesto de la ropa.', 'Շապիկն էլ է գնում լվացքի զամբյուղ։'), x: 84, y: 82 },
];
const DESTS: { id: string; icon: string; name: P }[] = [
  { id: 'cesto', icon: '🧺', name: p('el cesto de la ropa', 'լվացքի զամբյուղ') },
  { id: 'estanteria', icon: '🗄️', name: p('la estantería', 'գրադարակ') },
  { id: 'fregadero', icon: '🚰', name: p('el fregadero', 'լվացարան') },
  { id: 'papelera', icon: '🗑️', name: p('la papelera', 'աղբաման') },
];

function MessItem({ m }: { m: (typeof MESS)[number] }) {
  const down = useDraggable({ kind: 'mess', id: m.id }, { onStart: () => speak(m.name) });
  return (
    <span className="mess drag-src" style={{ left: m.x + '%', top: m.y + '%' }} onPointerDown={down}>
      {m.icon}
    </span>
  );
}
function Dest({ d, onDrop }: { d: (typeof DESTS)[number]; onDrop: (item: string) => void }) {
  const ref = useDropTarget('dest-' + d.id, (pl) => pl.kind === 'mess', (pl) => onDrop(pl.id));
  return (
    <div className="dest" ref={ref}>
      <span className="dest-icon">{d.icon}</span>
      <T p={d.name} />
    </div>
  );
}

/* -------------------- 2. table -------------------- */
type Zone = 'centro' | 'izq' | 'der' | 'detras' | 'delante';
const TABLE: { id: string; icon: string; name: P; zone: Zone; instr: P }[] = [
  { id: 'plato', icon: '🍽️', name: p('el plato', 'ափսե'), zone: 'centro', instr: p('Pon el plato en el centro de la mesa.', 'Ափսեն դիր սեղանի կենտրոնում։') },
  { id: 'tenedor', icon: '🍴', name: p('el tenedor', 'պատառաքաղ'), zone: 'izq', instr: p('Pon el tenedor a la izquierda del plato.', 'Պատառաքաղը դիր ափսեի ձախ կողմում։') },
  { id: 'cuchara', icon: '🥄', name: p('la cuchara', 'գդալ'), zone: 'der', instr: p('La cuchara va a la derecha del plato.', 'Գդալը դրվում է ափսեի աջ կողմում։') },
  { id: 'taza', icon: '🫖', name: p('la tetera', 'թեյնիկ'), zone: 'detras', instr: p('Coloca la tetera detrás del plato.', 'Թեյնիկը դիր ափսեի հետևում։') },
  { id: 'servilleta', icon: '🧻', name: p('la servilleta', 'անձեռոցիկ'), zone: 'delante', instr: p('Deja la servilleta delante del plato.', 'Անձեռոցիկը թող ափսեի առջև։') },
  { id: 'galletas', icon: '🍪', name: p('las galletas', 'թխվածքաբլիթներ'), zone: 'centro', instr: p('Por último, pon las galletas encima del plato.', 'Վերջում թխվածքաբլիթները դիր ափսեի վրա։') },
];
function TableItem({ t }: { t: (typeof TABLE)[number] }) {
  const down = useDraggable({ kind: 'table', id: t.id }, { onStart: () => speak(t.name) });
  return (
    <div className="ing">
      <div className="ing-icon drag-src" onPointerDown={down}>
        {t.icon}
      </div>
      <T p={t.name} className="ing-name" />
    </div>
  );
}
function ZoneBox({ z, items, onDrop }: { z: Zone; items: string[]; onDrop: (id: string, z: Zone) => void }) {
  const ref = useDropTarget('zone-' + z, (pl) => pl.kind === 'table', (pl) => onDrop(pl.id, z));
  return (
    <div className={'zone z-' + z} ref={ref}>
      {items.map((i) => (
        <span key={i} className="pop-in">
          {TABLE.find((t) => t.id === i)!.icon}
        </span>
      ))}
    </div>
  );
}

/* -------------------- 3. conversation -------------------- */
const CHAT: Script = {
  start: {
    who: 'm',
    line: p('¡Hola, Gayane! ¡Qué casa tan bonita! Huele a galletas.', 'Բարև, Գայանե։ Ինչ գեղեցիկ տուն է։ Թխվածքաբլիթի բույր է գալիս։'),
    options: [
      { text: p('¡Bienvenidas! Pasad, pasad. Las he hecho yo.', 'Բարի գալուստ։ Ներս եկեք։ Ես եմ թխել։'), next: 'coats', points: 1 },
      { text: p('Gracias. Quitaos los abrigos, aquí hace calor.', 'Շնորհակալություն։ Հանեք վերարկուները, այստեղ տաք է։'), next: 'coats', points: 1 },
      { text: p('¿Qué queréis?', 'Ի՞նչ եք ուզում։'), next: 'coats', points: -1, reply: p('Eh… ¿merendar contigo? ¡Nos invitaste tú, jaja!', 'Է… քեզ հետ թեյ խմե՞լ։ Դու ես մեզ հրավիրել, հա-հա։') },
    ],
  },
  coats: {
    who: 'l',
    line: p('¡Qué frío hace fuera! Llevo tres capas de ropa.', 'Ինչ ցուրտ է դրսում։ Երեք շերտ հագուստ եմ հագել։'),
    options: [
      { text: p('Sí, dicen que mañana va a nevar todavía más.', 'Այո, ասում են՝ վաղն ավելի շատ ձյուն է գալու։'), next: 'weather', points: 1 },
      { text: p('Pues aquí dentro se está muy bien, al lado de la chimenea.', 'Իսկ այստեղ՝ ներսում, բուխարու կողքին շատ լավ է։'), next: 'weather', points: 1 },
      { text: p('A mí me gusta más el verano.', 'Ինձ ավելի շատ ամառն է դուր գալիս։'), next: 'weather', points: 0 },
    ],
  },
  weather: {
    who: 'm',
    line: p('Si nieva, el sábado podemos ir a la montaña a esquiar. ¿Te apuntas?', 'Եթե ձյուն գա, շաբաթ օրը կարող ենք գնալ լեռներ դահուկ քշելու։ Միանո՞ւմ ես։'),
    options: [
      { text: p('¡Claro que sí! Me encanta esquiar.', 'Իհարկե։ Շատ եմ սիրում դահուկ քշել։'), next: 'ski_yes', points: 1 },
      { text: p('No sé esquiar, pero puedo aprender.', 'Չգիտեմ դահուկ քշել, բայց կարող եմ սովորել։'), next: 'ski_learn', points: 1 },
      { text: p('No, prefiero quedarme en casa.', 'Ոչ, նախընտրում եմ տանը մնալ։'), next: 'ski_no', points: 0 },
    ],
  },
  ski_yes: { who: 'l', line: p('¡Genial! Entonces tenemos que comprar guantes nuevos.', 'Հիանալի է։ Ուրեմն պետք է նոր ձեռնոցներ գնենք։'), next: 'drinks' },
  ski_learn: { who: 'l', line: p('¡Yo te enseño! Al principio todas nos caemos.', 'Ես քեզ կսովորեցնեմ։ Սկզբում բոլորս էլ ընկնում ենք։'), next: 'drinks' },
  ski_no: { who: 'm', line: p('Bueno, también podemos ver una película aquí juntas.', 'Լավ, կարող ենք նաև միասին այստեղ ֆիլմ դիտել։'), next: 'drinks' },
  drinks: {
    who: 'l',
    line: p('Oye, ¿y qué vamos a merendar?', 'Լսիր, իսկ ի՞նչ ենք հյուրասիրվելու։'),
    options: [
      { text: p('He preparado chocolate caliente y galletas.', 'Տաք շոկոլադ և թխվածքաբլիթներ եմ պատրաստել։'), next: 'food_good', points: 1 },
      { text: p('Tengo té con limón y magdalenas.', 'Ունեմ կիտրոնով թեյ և մաֆիններ։'), next: 'food_good', points: 1 },
      { text: p('No tengo nada, lo siento.', 'Ոչինչ չունեմ, ներողություն։'), next: 'food_bad', points: -1 },
    ],
  },
  food_good: {
    who: 'm',
    line: p('¡Mmm, qué rico! ¿Me das la receta?', 'Մմմ, ինչ համեղ է։ Բաղադրատոմսը կտա՞ս։'),
    options: [
      { text: p('Claro. Es muy fácil: leche, chocolate y un poco de azúcar.', 'Իհարկե։ Շատ հեշտ է՝ կաթ, շոկոլադ և մի քիչ շաքար։'), next: 'clothes', points: 1 },
      { text: p('Es un secreto de familia.', 'Դա ընտանեկան գաղտնիք է։'), next: 'clothes', points: 0, reply: p('¡Jaja, qué misteriosa eres!', 'Հա-հա, ինչ խորհրդավոր ես։') },
    ],
  },
  food_bad: { who: 'l', line: p('¡No pasa nada! Hemos traído turrón.', 'Ոչինչ։ Մենք տուռոն ենք բերել։'), next: 'clothes' },
  clothes: {
    who: 'l',
    line: p('Por cierto, Gayane, ¡qué jersey tan bonito! ¿Dónde lo compraste?', 'Ի դեպ, Գայանե, ինչ գեղեցիկ սվիտեր է։ Որտեղի՞ց ես գնել։'),
    options: [
      { text: p('Me lo regaló mi abuela por mi cumpleaños.', 'Տատիկս է նվիրել ծննդյանս օրը։'), next: 'grandma', points: 1 },
      { text: p('En una tienda del centro. ¡Estaba de rebajas!', 'Կենտրոնի մի խանութից։ Զեղչված էր։'), next: 'shopping', points: 1 },
      { text: p('Es azul.', 'Կապույտ է։'), next: 'shopping', points: -1, reply: p('Eh… yo lo veo rojo, jaja.', 'Է… ես այն կարմիր եմ տեսնում, հա-հա։') },
    ],
  },
  grandma: { who: 'm', line: p('¡Qué detalle! Tu abuela tiene muy buen gusto.', 'Ինչ սիրուն ուշադրություն է։ Տատիկդ շատ լավ ճաշակ ունի։'), next: 'friends' },
  shopping: { who: 'm', line: p('Tenemos que ir de compras juntas un día.', 'Մի օր պետք է միասին գնումների գնանք։'), next: 'friends' },
  friends: {
    who: 'm',
    line: p('¿Y sabéis algo de Ana? Hace mucho que no la veo.', 'Իսկ Աննայից լուր ունե՞ք։ Վաղուց չեմ տեսել նրան։'),
    options: [
      { text: p('Sí, ahora vive en Valencia y trabaja en un hospital.', 'Այո, հիմա ապրում է Վալենսիայում և աշխատում է հիվանդանոցում։'), next: 'ana', points: 1 },
      { text: p('Creo que está enferma. ¿La llamamos?', 'Կարծում եմ՝ հիվանդ է։ Զանգե՞նք նրան։'), next: 'call', points: 1 },
      { text: p('No me importa.', 'Ինձ չի հետաքրքրում։'), next: 'ana_cold', points: -1 },
    ],
  },
  ana: { who: 'l', line: p('¡Qué bien! Podríamos visitarla en primavera.', 'Ինչ լավ է։ Գարնանը կարող ենք այցելել նրան։'), next: 'plans' },
  call: { who: 'l', line: p('¡Buena idea! La llamamos ahora, todas juntas.', 'Լավ միտք է։ Հիմա բոլորս միասին զանգենք նրան։'), next: 'plans' },
  ana_cold: { who: 'l', line: p('Vaya… Ella siempre pregunta por ti.', 'Վայ… Նա միշտ քո մասին է հարցնում։'), next: 'plans' },
  plans: {
    who: 'l',
    line: p('¿Y qué planes tienes para las vacaciones de invierno?', 'Իսկ ի՞նչ ծրագրեր ունես ձմեռային արձակուրդի համար։'),
    options: [
      { text: p('Voy a viajar a Armenia para ver a mi familia.', 'Գնալու եմ Հայաստան՝ ընտանիքիս տեսնելու։'), next: 'end_arm', points: 1 },
      { text: p('Voy a estudiar mucho español.', 'Շատ իսպաներեն եմ սովորելու։'), next: 'end_es', points: 1 },
      { text: p('Todavía no lo sé. ¿Hacemos algo juntas?', 'Դեռ չգիտեմ։ Միասին ինչ-որ բան անե՞նք։'), next: 'end_together', points: 1 },
    ],
  },
  end_arm: { who: 'm', line: p('¡Qué bonito! Tráenos fotos de Ereván con nieve. ¡Me lo estoy pasando genial!', 'Ինչ գեղեցիկ է։ Ձյունոտ Երևանի լուսանկարներ բեր։ Ինձ շատ լավ է այստեղ։'), end: true },
  end_es: { who: 'm', line: p('¡Ya hablas muy bien! Me lo estoy pasando genial con vosotras.', 'Արդեն շատ լավ ես խոսում։ Ձեզ հետ ինձ շատ լավ է։'), end: true },
  end_together: { who: 'm', line: p('¡Sí! Podemos hacer una fiesta de Nochevieja aquí. ¡Me encanta esta tarde!', 'Այո։ Կարող ենք Ամանորի գիշերը խնջույք անել այստեղ։ Շատ եմ սիրում այս երեկոն։'), end: true },
};

/* -------------------- scene -------------------- */
type Phase = 'tidy' | 'table' | 'door' | 'chat' | 'done';

export function Friends() {
  const [phase, setPhase] = useState<Phase>('tidy');
  const [tidyI, setTidyI] = useState(0);
  const [tableI, setTableI] = useState(0);
  const [zones, setZones] = useState<Record<Zone, string[]>>({ centro: [], izq: [], der: [], detras: [], delante: [] });
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [pts, setPts] = useState(0);

  const err = (ph: P, instr: P) => {
    setMistakes((m) => m + 1);
    markDifficult(instr, true);
    setFb({ ok: false, p: ph, extra: [instr] });
  };

  const onTidy = (dest: string, item: string) => {
    const cur = MESS[tidyI];
    if (item !== cur.id) return err(p(`Ahora no. Primero ${cur.name.es}.`, `Հիմա ոչ։ Նախ ${cur.name.hy}։`), cur.instr);
    if (dest !== cur.dest) return err(p('Eso no va ahí.', 'Դա այնտեղ չի դրվում։'), cur.instr);
    sfx.drop();
    setFb(null);
    if (tidyI + 1 >= MESS.length) {
      speak(p('¡La habitación está ordenada!', 'Սենյակը կարգի է բերված։'));
      setTimeout(() => setPhase('table'), 900);
    }
    setTidyI(tidyI + 1);
  };

  const onTable = (id: string, z: Zone) => {
    const cur = TABLE[tableI];
    if (!cur) return;
    if (id !== cur.id) return err(p(`Ahora necesitamos ${cur.name.es}.`, `Հիմա մեզ ${cur.name.hy} է պետք։`), cur.instr);
    if (z !== cur.zone) return err(p('Casi. Escucha bien dónde va.', 'Գրեթե։ Ուշադիր լսիր, թե որտեղ է դրվում։'), cur.instr);
    sfx.drop();
    setFb(null);
    setZones((zs) => ({ ...zs, [z]: [...zs[z], id] }));
    if (tableI + 1 >= TABLE.length) {
      speak(p('¡La mesa está lista!', 'Սեղանը պատրաստ է։'));
      setTimeout(() => {
        setPhase('door');
        sfx.bell();
      }, 1200);
    }
    setTableI(tableI + 1);
  };

  return (
    <div className="scene scene-friends">
      <SceneHeader title={p('Una tarde con amigas', 'Մի երեկո ընկերուհիների հետ')} icon="💕" />
      <Steps total={4} cur={['tidy', 'table', 'door', 'chat', 'done'].indexOf(phase)} />

      {phase === 'tidy' && tidyI < MESS.length && (
        <>
          <Instruction p={MESS[tidyI].instr} icon="🧹" who={p('Ordena la casa', 'Կարգի բեր տունը')} key={tidyI} />
          <div className="messy-room">
            <div className="mr-wall" />
            <WeatherWindow weather="nevando" className="mr-window" />
            <span className="mr-sofa">🛋️</span>
            <span className="mr-plant">🪴</span>
            {MESS.slice(tidyI).map((m) => (
              <MessItem key={m.id} m={m} />
            ))}
            <div className="mr-girl">
              <Gayane wear={['jersey', 'pantalones', 'calcetines']} mood="think" />
            </div>
          </div>
          <div className="dests">
            {DESTS.map((d) => (
              <Dest key={d.id} d={d} onDrop={(item) => onTidy(d.id, item)} />
            ))}
          </div>
        </>
      )}

      {phase === 'table' && TABLE[tableI] && (
        <>
          <Instruction p={TABLE[tableI].instr} icon="🍽️" who={p('Pon la mesa', 'Սեղանը գցիր')} key={'t' + tableI} />
          <div className="table-top">
            <div className="tt-cloth">
              <ZoneBox z="detras" items={zones.detras} onDrop={onTable} />
              <div className="tt-mid">
                <ZoneBox z="izq" items={zones.izq} onDrop={onTable} />
                <ZoneBox z="centro" items={zones.centro} onDrop={onTable} />
                <ZoneBox z="der" items={zones.der} onDrop={onTable} />
              </div>
              <ZoneBox z="delante" items={zones.delante} onDrop={onTable} />
            </div>
            <div className="tt-seat">
              🪑 <T p={p('Aquí te sientas tú', 'Այստեղ դու ես նստում')} />
            </div>
          </div>
          <div className="shelf-row center">
            {TABLE.slice(tableI).map((t) => (
              <TableItem key={t.id} t={t} />
            ))}
          </div>
        </>
      )}

      {phase === 'door' && (
        <div className="door-scene">
          <Instruction p={p('¡Ding dong! Llaman a la puerta. ¡Abre!', 'Դինգ-դոնգ։ Դուռը թակում են։ Բացիր։')} icon="🔔" />
          <button className="big-door" onClick={() => (sfx.whoosh(), setPhase('chat'))}>
            <span className="door-knob" />
            <span className="door-wreath">🎀</span>
          </button>
        </div>
      )}

      {phase === 'chat' && (
        <>
          <div className="friends-row">
            <span className="friend-av">👩🏽‍🦱</span>
            <div className="friends-girl">
              <Gayane wear={['jersey', 'falda', 'calcetines']} waving />
            </div>
            <span className="friend-av">👱🏻‍♀️</span>
          </div>
          <div className="friend-meter">
            💗 <T p={p('Amistad', 'Ընկերություն')} />
          </div>
          <Dialogue
            script={CHAT}
            speakers={{ l: { name: 'Lucía', avatar: '👩🏽‍🦱', color: '#dccdf0' }, m: { name: 'Marta', avatar: '👱🏻‍♀️', color: '#ffe0b2' } }}
            onEnd={(n) => {
              setPts(n);
              setPhase('done');
            }}
          />
        </>
      )}

      <Feedback fb={fb} onClose={() => setFb(null)} />
      {phase === 'done' && (
        <Reward
          id="friends"
          stars={pts >= 7 && mistakes <= 2 ? 3 : pts >= 5 ? 2 : 1}
          message={
            pts >= 7
              ? p('¡Ha sido una tarde perfecta! Tus amigas quieren volver pronto.', 'Կատարյալ երեկո էր։ Ընկերուհիներդ ուզում են շուտով նորից գալ։')
              : pts >= 4
                ? p('Ha sido una tarde muy agradable.', 'Շատ հաճելի երեկո էր։')
                : p('La tarde ha estado bien, pero la próxima vez escucha con más atención a tus amigas.', 'Երեկոն լավ էր, բայց հաջորդ անգամ ավելի ուշադիր լսիր ընկերուհիներիդ։')
          }
          onAgain={() => location.reload()}
        />
      )}
    </div>
  );
}

