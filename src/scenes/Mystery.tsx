import { useState } from 'react';
import { Gayane } from '../components/Gayane';
import { ClothIcon } from '../components/ClothIcon';
import { WordTiles } from '../components/WordTiles';
import { Btn, Choices, Feedback, Instruction, Reward, SceneHeader, Steps, starsFor, type Fb } from '../components/UI';
import { Phrase, T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { markDifficult, setState, useGame } from '../core/store';
import { p, type P } from '../core/types';

type Room = 'salon' | 'cocina' | 'dormitorio' | 'vestidor' | 'entrada';
const ROOMS: { id: Room; name: P; icon: string }[] = [
  { id: 'salon', name: p('El salón', 'Հյուրասենյակ'), icon: '🛋️' },
  { id: 'cocina', name: p('La cocina', 'Խոհանոց'), icon: '🍳' },
  { id: 'dormitorio', name: p('El dormitorio', 'Ննջասենյակ'), icon: '🛏️' },
  { id: 'vestidor', name: p('El vestidor', 'Հանդերձարան'), icon: '👗' },
  { id: 'entrada', name: p('La entrada', 'Մուտք'), icon: '🚪' },
];

const OBJS: { id: string; room: Room; icon: string; name: P; nothing: P }[] = [
  { id: 'sofa', room: 'salon', icon: '🛋️', name: p('el sofá', 'բազմոցը'), nothing: p('Debajo del sofá solo hay un calcetín perdido.', 'Բազմոցի տակ միայն մի կորած գուլպա կա։') },
  { id: 'estanteria', room: 'salon', icon: '📚', name: p('la estantería', 'գրադարակը'), nothing: p('Solo hay libros.', 'Միայն գրքեր կան։') },
  { id: 'arbol', room: 'salon', icon: '🎄', name: p('el árbol', 'տոնածառը'), nothing: p('Debajo del árbol no hay nada… todavía.', 'Տոնածառի տակ ոչինչ չկա… դեռ։') },
  { id: 'chimenea', room: 'salon', icon: '🔥', name: p('la chimenea', 'բուխարին'), nothing: p('La chimenea está muy caliente. Aquí no hay nada.', 'Բուխարին շատ տաք է։ Այստեղ ոչինչ չկա։') },
  { id: 'nevera', room: 'cocina', icon: '🧊', name: p('la nevera', 'սառնարանը'), nothing: p('En la nevera hay leche y queso.', 'Սառնարանում կաթ և պանիր կա։') },
  { id: 'horno', room: 'cocina', icon: '♨️', name: p('el horno', 'ջեռոցը'), nothing: p('El horno huele a galletas, pero no hay ninguna pista.', 'Ջեռոցից թխվածքաբլիթի բույր է գալիս, բայց ոչ մի հուշում չկա։') },
  { id: 'taza', room: 'cocina', icon: '☕', name: p('la taza', 'բաժակը'), nothing: p('En la taza solo hay té frío.', 'Բաժակում միայն սառը թեյ կա։') },
  { id: 'cama', room: 'dormitorio', icon: '🛏️', name: p('la cama', 'մահճակալը'), nothing: p('Debajo de la cama no hay nada.', 'Մահճակալի տակ ոչինչ չկա։') },
  { id: 'osito', room: 'dormitorio', icon: '🧸', name: p('el osito', 'արջուկը'), nothing: p('El osito no sabe nada. ¡Es un osito!', 'Արջուկը ոչինչ չգիտի։ Նա արջուկ է։') },
  { id: 'lampara', room: 'dormitorio', icon: '🪔', name: p('la lámpara', 'լամպը'), nothing: p('La lámpara da una luz muy bonita, nada más.', 'Լամպը շատ գեղեցիկ լույս է տալիս, ուրիշ ոչինչ։') },
  { id: 'armario', room: 'vestidor', icon: '🚪', name: p('el armario', 'պահարանը'), nothing: p('Solo hay ropa de invierno.', 'Միայն ձմեռային հագուստ կա։') },
  { id: 'espejo', room: 'vestidor', icon: '🪞', name: p('el espejo', 'հայելին'), nothing: p('Me miro en el espejo. Aquí no hay ninguna pista.', 'Նայում եմ հայելուն։ Այստեղ ոչ մի հուշում չկա։') },
  { id: 'cajon', room: 'vestidor', icon: '🗄️', name: p('el cajón', 'դարակը'), nothing: p('En el cajón hay calcetines y guantes.', 'Դարակում գուլպաներ և ձեռնոցներ կան։') },
  { id: 'puerta', room: 'entrada', icon: '🚪', name: p('la puerta de la vecina', 'հարևանուհու դուռը'), nothing: p('Ahora no quiero molestar a la vecina.', 'Հիմա չեմ ուզում անհանգստացնել հարևանուհուն։') },
  { id: 'telefono', room: 'entrada', icon: '📱', name: p('el teléfono', 'հեռախոսը'), nothing: p('No tengo mensajes nuevos.', 'Նոր հաղորդագրություններ չունեմ։') },
  { id: 'buzon', room: 'entrada', icon: '📬', name: p('el buzón', 'փոստարկղը'), nothing: p('El buzón está vacío.', 'Փոստարկղը դատարկ է։') },
];

const NOTE = p(
  'Para la chica que siempre sonríe. Si quieres saber quién soy, busca la primera pista donde duermen los cuentos.',
  'Այն աղջկան, ով միշտ ժպտում է։ Եթե ուզում ես իմանալ՝ ով եմ ես, առաջին հուշումը փնտրիր այնտեղ, որտեղ հեքիաթներն են քնում։',
);
const CLUE1 = p('¡Bien hecho! La segunda pista está en un lugar frío, donde la leche nunca se calienta.', 'Ապրես։ Երկրորդ հուշումը ցուրտ տեղում է, որտեղ կաթը երբեք չի տաքանում։');
const CLUE2 = p('Mi bufanda es roja como las fresas.', 'Իմ շարֆը կարմիր է ելակի պես։');
const CLUE3 = p('La última pista está donde te miras cada mañana.', 'Վերջին հուշումը այնտեղ է, որտեղ ամեն առավոտ նայում ես քեզ։');
const VOICE = p(
  '¡Hola, Gayane! Soy Sofía, la nieta de Doña Carmen. Mi abuela quería darte las gracias porque cada sábado la ayudas con la compra. Ella ha tejido esta bufanda para ti y yo he escondido las pistas. ¡Esperamos que te guste!',
  'Բարև, Գայանե։ Ես Սոֆիան եմ՝ դոնյա Կարմենի թոռնուհին։ Տատիկս ուզում էր շնորհակալություն հայտնել քեզ, որովհետև ամեն շաբաթ օգնում ես նրան գնումներ անել։ Նա այս շարֆը գործել է քեզ համար, իսկ ես թաքցրել եմ հուշումները։ Հուսով ենք՝ դուր կգա քեզ։',
);

interface Interview {
  id: string;
  who: P;
  avatar: string;
  options: { q: P; ok: boolean; why?: P }[];
  answer: P;
}
const INTERVIEWS: Interview[] = [
  {
    id: 'puerta',
    who: p('Doña Carmen, la vecina', 'Դոնյա Կարմեն՝ հարևանուհին'),
    avatar: '👵🏻',
    options: [
      { q: p('Doña Carmen, ¿ha visto usted a alguien con una bufanda roja?', 'Դոնյա Կարմեն, Դուք տեսե՞լ եք կարմիր շարֆով մեկին։'), ok: true },
      { q: p('Oye, ¿tú has visto bufanda roja?', 'Լսիր, դու կարմիր շարֆ տեսե՞լ ես։'), ok: false, why: p('Con una señora mayor es mejor usar «usted». Y falta el artículo: «una bufanda».', 'Տարեց կնոջ հետ ավելի լավ է օգտագործել «usted»։ Եվ հոդը պակասում է՝ «una bufanda»։') },
      { q: p('Doña Carmen, ¿qué hora es?', 'Դոնյա Կարմեն, ժամը քանի՞սն է։'), ok: false, why: p('Esa pregunta no te ayuda a resolver el misterio.', 'Այդ հարցը չի օգնի լուծել գաղտնիքը։') },
    ],
    answer: p('Sí, hija. Esta mañana vi a una chica joven con una bufanda roja en la escalera. Llevaba una caja y olía a canela.', 'Այո, աղջիկս։ Այսօր առավոտյան աստիճաններին կարմիր շարֆով մի երիտասարդ աղջիկ տեսա։ Մի տուփ էր տանում, և դարչինի բույր էր գալիս։'),
  },
  {
    id: 'telefono',
    who: p('Lucía, por teléfono', 'Լուսիան՝ հեռախոսով'),
    avatar: '👩🏽‍🦱',
    options: [
      { q: p('Lucía, ¿conoces a alguien que siempre lleve una bufanda roja?', 'Լուսիա, ճանաչո՞ւմ ես մեկին, ով միշտ կարմիր շարֆ է կրում։'), ok: true },
      { q: p('Lucía, ¿te gusta el color rojo?', 'Լուսիա, քեզ դուր է գալիս կարմիր գույնը։'), ok: false, why: p('Es una pregunta bonita, pero no es la más útil ahora.', 'Գեղեցիկ հարց է, բայց հիմա ամենաօգտակարը չէ։') },
      { q: p('Lucía, ¿dónde estás vives?', 'Լուսիա, որտե՞ղ ես ապրում։'), ok: false, why: p('Esa frase tiene un error: «¿dónde vives?». Y ya sabes dónde vive Lucía.', 'Այդ նախադասության մեջ սխալ կա՝ «¿dónde vives?»։ Եվ դու արդեն գիտես, թե որտեղ է ապրում Լուսիան։') },
    ],
    answer: p('¿Bufanda roja? Yo siempre llevo una azul. Pero Sofía, la nieta de Doña Carmen, ¡nunca se quita la suya roja!', 'Կարմի՞ր շարֆ։ Ես միշտ կապույտ եմ կրում։ Բայց Սոֆիան՝ դոնյա Կարմենի թոռնուհին, երբեք չի հանում իր կարմիր շարֆը։'),
  },
  {
    id: 'buzon',
    who: p('Luis, el cartero', 'Լուիսը՝ փոստատարը'),
    avatar: '👨🏻‍✈️',
    options: [
      { q: p('Buenos días, Luis. ¿Ha traído algún paquete a este edificio esta semana?', 'Բարի լույս, Լուիս։ Այս շաբաթ որևէ ծանրոց բերե՞լ եք այս շենքին։'), ok: true },
      { q: p('Luis, ¿por qué llevas gorra?', 'Լուիս, ինչո՞ւ ես գլխարկ կրում։'), ok: false, why: p('Eso no tiene nada que ver con el regalo.', 'Դա ոչ մի կապ չունի նվերի հետ։') },
      { q: p('Luis, dame todas las cartas.', 'Լուիս, տուր ինձ բոլոր նամակները։'), ok: false, why: p('No es muy educado. Pregunta con amabilidad.', 'Դա այնքան էլ քաղաքավարի չէ։ Հարցրու բարեհամբույր։') },
    ],
    answer: p('Sí, ayer traje un paquete de lana para Doña Carmen. ¡Pesaba muchísimo!', 'Այո, երեկ բրդյա թելի ծանրոց բերեցի դոնյա Կարմենի համար։ Շատ ծանր էր։'),
  },
];

const CHAPTERS: P[] = [
  p('Capítulo 1: La caja misteriosa', 'Գլուխ 1. Խորհրդավոր տուփը'),
  p('Capítulo 2: Donde duermen los cuentos', 'Գլուխ 2. Որտեղ քնում են հեքիաթները'),
  p('Capítulo 3: Un lugar frío', 'Գլուխ 3. Ցուրտ տեղ'),
  p('Capítulo 4: Preguntas a los vecinos', 'Գլուխ 4. Հարցեր հարևաններին'),
  p('Capítulo 5: El espejo', 'Գլուխ 5. Հայելին'),
  p('Capítulo 6: El mensaje', 'Գլուխ 6. Հաղորդագրությունը'),
  p('Final', 'Ավարտ'),
];

export function Mystery() {
  const ch = useGame((s) => s.mysteryChapter);
  const setCh = (n: number) => setState((s) => ({ ...s, mysteryChapter: n }));
  const [room, setRoom] = useState<Room>('salon');
  const [say, setSay] = useState<P | null>(null);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [asked, setAsked] = useState<Record<string, boolean>>({});
  const [talking, setTalking] = useState<Interview | null>(null);
  const [showText, setShowText] = useState(false);
  const [q2, setQ2] = useState(false);
  const [opened, setOpened] = useState(false);
  const [fin, setFin] = useState(false);

  const err = (ph: P, extra?: P[]) => {
    setMistakes((m) => m + 1);
    markDifficult(ph, true);
    setFb({ ok: false, p: ph, extra });
  };

  const target = ch === 1 ? 'estanteria' : ch === 2 ? 'nevera' : ch === 4 ? 'espejo' : null;
  const riddle = ch === 1 ? NOTE : ch === 2 ? CLUE1 : ch === 4 ? CLUE3 : null;

  const inspect = (o: (typeof OBJS)[number]) => {
    sfx.click();
    if (ch === 3 && room === 'entrada') {
      const iv = INTERVIEWS.find((x) => x.id === o.id);
      if (iv) return setTalking(iv);
    }
    if (target && o.id === target) {
      sfx.sparkle();
      setSay(null);
      setFb({ ok: true, p: p('¡Una pista!', 'Հուշում։') });
      setCh(ch + 1);
      return;
    }
    setSay(o.nothing);
    speak(o.nothing);
  };

  const explore = (
    <div className="explore">
      <div className="room-tabs">
        {ROOMS.map((r) => (
          <button key={r.id} className={'room-tab ' + (room === r.id ? 'on' : '')} onClick={() => (sfx.click(), setRoom(r.id), speak(r.name))}>
            {r.icon} <T p={r.name} />
          </button>
        ))}
      </div>
      <div className={'explore-room er-' + room}>
        {OBJS.filter((o) => o.room === room).map((o) => (
          <button key={o.id} className={'eobj ' + (asked[o.id] ? 'done' : '')} onClick={() => inspect(o)}>
            <span className="eobj-icon">{o.icon}</span>
            <T p={o.name} />
            {asked[o.id] && ' ✓'}
          </button>
        ))}
        <div className="explore-girl">
          {say && (
            <div className="speech-bubble pop-in" key={say.es}>
              <T p={say} />
            </div>
          )}
          <Gayane wear={['jersey', 'pantalones', 'calcetines']} mood="think" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="scene scene-mystery">
      <SceneHeader
        title={p('El misterio del regalo', 'Նվերի գաղտնիքը')}
        icon="🎁"
        right={
          ch > 0 ? (
            <button className="hdr-pill" onClick={() => (setCh(0), setAsked({}), setOpened(false))}>
              ↺
            </button>
          ) : undefined
        }
      />
      <Steps total={CHAPTERS.length} cur={ch} />
      <div className="chapter-title">
        <T p={CHAPTERS[Math.min(ch, CHAPTERS.length - 1)]} />
      </div>

      {ch === 0 && (
        <div className="mystery-intro">
          <div className="mystery-box">🎁</div>
          <Instruction p={p('En el salón hay una caja preciosa con un lazo rosa. ¡Y tiene una nota!', 'Հյուրասենյակում մի հրաշալի տուփ կա՝ վարդագույն ժապավենով։ Եվ մի գրություն ունի։')} icon="🔍" />
          <div className="note-card">
            <Phrase p={NOTE} big />
          </div>
          <Btn label={p('Buscar la primera pista', 'Փնտրել առաջին հուշումը')} icon="🔎" onClick={() => setCh(1)} />
        </div>
      )}

      {(ch === 1 || ch === 2 || ch === 4) && (
        <>
          <div className="note-card small">
            <Phrase p={riddle!} />
          </div>
          {explore}
        </>
      )}

      {ch === 3 && !asked.puzzle && (
        <div className="exercise">
          <Instruction p={p('Dentro de la nevera hay un papel con forma de galleta. Las palabras están desordenadas. ¡Ordénalas!', 'Սառնարանում թխվածքաբլիթի տեսքով թուղթ կա։ Բառերը խառն են։ Դասավորիր դրանք։')} icon="🍪" />
          <WordTiles
            target={CLUE2}
            onResult={(ok) => {
              if (ok) {
                setAsked((a) => ({ ...a, puzzle: true }));
                setFb({ ok: true, p: p('¡Ya lo tengo! Busco a alguien con una bufanda roja. Voy a preguntar a mis vecinos.', 'Գտա։ Փնտրում եմ կարմիր շարֆով մեկին։ Կհարցնեմ հարևաններիս։') });
                setRoom('entrada');
              } else err(p('El mensaje no tiene sentido todavía.', 'Հաղորդագրությունը դեռ իմաստ չունի։'));
            }}
          />
        </div>
      )}

      {ch === 3 && asked.puzzle && (
        <>
          <Instruction p={p('Ve a la entrada y habla con Doña Carmen, con Lucía y con el cartero.', 'Գնա մուտք և խոսիր դոնյա Կարմենի, Լուսիայի և փոստատարի հետ։')} icon="🕵️‍♀️" />
          {explore}
          {INTERVIEWS.every((iv) => asked[iv.id]) && (
            <div className="center-row">
              <Btn label={p('Ya sé dónde buscar la última pista', 'Արդեն գիտեմ, թե որտեղ փնտրել վերջին հուշումը')} icon="➡️" onClick={() => (setCh(4), setRoom('vestidor'))} />
            </div>
          )}
        </>
      )}

      {talking && (
        <div className="modal-wrap">
          <div className="modal interview pop-in">
            <div className="iv-avatar">{talking.avatar}</div>
            <div className="iv-who">
              <T p={talking.who} />
            </div>
            {!asked[talking.id] ? (
              <>
                <T p={p('¿Qué le preguntas?', 'Ի՞նչ ես հարցնում։')} className="iv-q" />
                <Choices
                  options={talking.options.map((o) => o.q)}
                  onPick={(i) => {
                    const o = talking.options[i];
                    if (o.ok) {
                      speak(talking.answer);
                      setAsked((a) => ({ ...a, [talking.id]: true }));
                    } else err(o.why!, [o.q]);
                  }}
                />
              </>
            ) : (
              <Phrase p={talking.answer} />
            )}
            <div className="modal-actions">
              <Btn label={p('Cerrar', 'Փակել')} variant="soft" onClick={() => setTalking(null)} />
            </div>
          </div>
        </div>
      )}

      {ch === 5 && (
        <div className="exercise">
          <Instruction p={p('Detrás del espejo hay un móvil con un mensaje de voz. ¡Escúchalo!', 'Հայելու հետևում մի հեռախոս կա՝ ձայնային հաղորդագրությամբ։ Լսիր այն։')} icon="📱" />
          <div className="voice-msg">
            <button className="voice-play" onClick={() => speak(VOICE)}>
              ▶
            </button>
            <div className="voice-wave">
              {Array.from({ length: 24 }, (_, i) => (
                <i key={i} style={{ height: 6 + ((i * 7) % 22), animationDelay: i * 0.05 + 's' }} />
              ))}
            </div>
            <button className="tool" onClick={() => speak(VOICE, { slow: true })}>
              🐢
            </button>
          </div>
          {showText ? <Phrase p={VOICE} /> : <Btn label={p('Ver el texto', 'Տեսնել տեքստը')} variant="ghost" small onClick={() => (setShowText(true), setMistakes((m) => m + 1))} />}
          {!q2 ? (
            <>
              <T p={p('¿Quién te ha dejado el regalo?', 'Ո՞վ է թողել նվերը քեզ համար։')} className="iv-q" as="div" />
              <Choices
                options={[p('Lucía', 'Լուսիան'), p('Doña Carmen y su nieta Sofía', 'Դոնյա Կարմենն ու իր թոռնուհի Սոֆիան'), p('Luis, el cartero', 'Լուիսը՝ փոստատարը'), p('Marta', 'Մարտան')]}
                onPick={(i) => (i === 1 ? (sfx.success(), setQ2(true)) : err(p('No. Escucha el mensaje otra vez.', 'Ոչ։ Կրկին լսիր հաղորդագրությունը։')))}
              />
            </>
          ) : (
            <>
              <T p={p('¿Por qué te dan las gracias?', 'Ինչո՞ւ են քեզ շնորհակալություն հայտնում։')} className="iv-q" as="div" />
              <Choices
                options={[
                  p('Porque la ayudo con la compra cada sábado.', 'Որովհետև ամեն շաբաթ օգնում եմ նրան գնումներ անել։'),
                  p('Porque le regalé una bufanda.', 'Որովհետև նրան շարֆ եմ նվիրել։'),
                  p('Porque cocino galletas para ella.', 'Որովհետև նրա համար թխվածքաբլիթ եմ թխում։'),
                ]}
                onPick={(i) => (i === 0 ? (sfx.success(), setCh(6)) : err(p('Casi. Escucha el final del mensaje.', 'Գրեթե։ Լսիր հաղորդագրության վերջը։')))}
              />
            </>
          )}
        </div>
      )}

      {ch >= 6 && (
        <div className="mystery-end">
          {!opened ? (
            <>
              <Instruction p={p('¡Misterio resuelto! Ahora puedes abrir la caja.', 'Գաղտնիքը բացահայտված է։ Հիմա կարող ես բացել տուփը։')} icon="🎉" />
              <button className="mystery-box big" onClick={() => (sfx.sparkle(), setOpened(true))}>
                🎁
              </button>
            </>
          ) : (
            <>
              <div className="gift-open pop-in">
                <ClothIcon id="bufanda" size={110} />
                <div className="gift-girl">
                  <Gayane wear={['jersey', 'pantalones', 'calcetines', 'bufanda']} waving />
                </div>
              </div>
              <div className="note-card letter">
                <Phrase p={p('Querida Gayane: gracias por tu sonrisa y por tu ayuda. Esta bufanda te dará calor todo el invierno. Un abrazo, Carmen y Sofía.', 'Սիրելի Գայանե, շնորհակալություն քո ժպիտի և օգնության համար։ Այս շարֆը քեզ կտաքացնի ամբողջ ձմեռ։ Ջերմ բարևներով՝ Կարմեն և Սոֆիա։')} big />
              </div>
              {!fin && (
                <div className="center-row">
                  <Btn label={p('Terminar la historia', 'Ավարտել պատմությունը')} icon="💗" onClick={() => setFin(true)} />
                </div>
              )}
              {fin && <Reward
                id="mystery"
                stars={starsFor(mistakes)}
                message={p('Gayane prepara chocolate caliente y va a casa de Doña Carmen para darle las gracias. ¡Qué invierno tan mágico!', 'Գայանեն տաք շոկոլադ է պատրաստում և գնում դոնյա Կարմենի տուն՝ շնորհակալություն հայտնելու։ Ինչ կախարդական ձմեռ է։')}
                onAgain={() => (setCh(0), setAsked({}), setOpened(false), setQ2(false), setShowText(false), setFin(false))}
              />}
            </>
          )}
        </div>
      )}

      <Feedback fb={fb} onClose={() => setFb(null)} />
      <div style={{ height: 90 }} />
    </div>
  );
}
