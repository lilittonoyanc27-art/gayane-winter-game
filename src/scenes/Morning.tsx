import { useMemo, useState } from 'react';
import { Gayane, type ClothId } from '../components/Gayane';
import { WeatherWindow, type Weather } from '../components/Snow';
import { WordTiles } from '../components/WordTiles';
import { Btn, Choices, Feedback, Instruction, Reward, SceneHeader, Steps, starsFor, type Fb } from '../components/UI';
import { useDraggable, useDropTarget } from '../core/dnd';
import { Phrase, T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { markDifficult, useGame } from '../core/store';
import { p, type Level, type P } from '../core/types';
import { pick, shuffle } from '../core/util';

type Tense = 'pres' | 'perf' | 'indef' | 'imperf' | 'fut';
const TENSE_P: Record<Tense, P> = {
  pres: p('Presente', 'Ներկա ժամանակ'),
  perf: p('Pretérito perfecto', 'Ներկա վաղակատար'),
  indef: p('Pretérito indefinido', 'Անցյալ կատարյալ'),
  imperf: p('Pretérito imperfecto', 'Անցյալ անկատար'),
  fut: p('Futuro simple', 'Ապառնի'),
};

interface Sent {
  es: string; // with [form]
  hy: string;
}
interface MAction {
  id: string;
  kind: 'tap' | 'drag';
  target: string;
  instr: P;
  forms: Record<Tense, string>;
  s: Record<Tense, Sent>;
}

const ACTIONS: MAction[] = [
  {
    id: 'despertarse', kind: 'tap', target: 'reloj',
    instr: p('¡Riiing! Suena el despertador. Apágalo.', 'Զրրրնգ։ Զարթուցիչն է զնգում։ Անջատիր այն։'),
    forms: { pres: 'me despierto', perf: 'me he despertado', indef: 'me desperté', imperf: 'me despertaba', fut: 'me despertaré' },
    s: {
      pres: { es: '[Me despierto] a las ocho.', hy: 'Արթնանում եմ ժամը ութին։' },
      perf: { es: 'Hoy [me he despertado] a las ocho.', hy: 'Այսօր արթնացել եմ ժամը ութին։' },
      indef: { es: 'Ayer [me desperté] a las nueve.', hy: 'Երեկ արթնացա ժամը իննին։' },
      imperf: { es: 'De pequeña, [me despertaba] muy temprano.', hy: 'Փոքր ժամանակ շատ վաղ էի արթնանում։' },
      fut: { es: 'Mañana [me despertaré] a las siete.', hy: 'Վաղը կարթնանամ ժամը յոթին։' },
    },
  },
  {
    id: 'levantarse', kind: 'tap', target: 'gayane',
    instr: p('Ahora levántate de la cama. Toca a Gayane.', 'Հիմա վեր կաց անկողնուց։ Հպիր Գայանեին։'),
    forms: { pres: 'me levanto', perf: 'me he levantado', indef: 'me levanté', imperf: 'me levantaba', fut: 'me levantaré' },
    s: {
      pres: { es: '[Me levanto] de la cama.', hy: 'Վեր եմ կենում անկողնուց։' },
      perf: { es: 'Esta mañana [me he levantado] con mucha energía.', hy: 'Այս առավոտ վեր եմ կացել մեծ եռանդով։' },
      indef: { es: 'El domingo [me levanté] muy tarde.', hy: 'Կիրակի շատ ուշ վեր կացա։' },
      imperf: { es: 'En verano siempre [me levantaba] a las seis.', hy: 'Ամռանը միշտ վեր էի կենում ժամը վեցին։' },
      fut: { es: 'Mañana [me levantaré] antes.', hy: 'Վաղը ավելի շուտ վեր կկենամ։' },
    },
  },
  {
    id: 'cortinas', kind: 'tap', target: 'ventana',
    instr: p('Abre las cortinas y mira qué tiempo hace.', 'Բացիր վարագույրները և նայիր, թե ինչ եղանակ է։'),
    forms: { pres: 'abro', perf: 'he abierto', indef: 'abrí', imperf: 'abría', fut: 'abriré' },
    s: {
      pres: { es: '[Abro] las cortinas y miro por la ventana.', hy: 'Բացում եմ վարագույրները և նայում պատուհանից։' },
      perf: { es: 'Hoy [he abierto] las cortinas y todo está blanco.', hy: 'Այսօր բացել եմ վարագույրները, և ամեն ինչ սպիտակ է։' },
      indef: { es: 'Ayer [abrí] las cortinas y llovía.', hy: 'Երեկ բացեցի վարագույրները, և անձրև էր գալիս։' },
      imperf: { es: 'Mi abuela siempre [abría] las cortinas muy temprano.', hy: 'Տատիկս միշտ շատ վաղ էր բացում վարագույրները։' },
      fut: { es: 'Mañana [abriré] las cortinas en cuanto me despierte.', hy: 'Վաղը կբացեմ վարագույրները, հենց որ արթնանամ։' },
    },
  },
  {
    id: 'cama', kind: 'drag', target: 'cama',
    instr: p('Haz la cama: arrastra la manta encima de la cama.', 'Հավաքիր անկողինը. վերմակը քաշիր մահճակալի վրա։'),
    forms: { pres: 'hago', perf: 'he hecho', indef: 'hice', imperf: 'hacía', fut: 'haré' },
    s: {
      pres: { es: '[Hago] la cama todas las mañanas.', hy: 'Ամեն առավոտ հավաքում եմ անկողինս։' },
      perf: { es: 'Ya [he hecho] la cama.', hy: 'Արդեն հավաքել եմ անկողինը։' },
      indef: { es: 'Ayer no [hice] la cama porque tenía prisa.', hy: 'Երեկ չհավաքեցի անկողինը, քանի որ շտապում էի։' },
      imperf: { es: 'De niña, nunca [hacía] la cama.', hy: 'Երեխա ժամանակ երբեք չէի հավաքում անկողինս։' },
      fut: { es: 'Mañana [haré] la cama enseguida.', hy: 'Վաղն անմիջապես կհավաքեմ անկողինը։' },
    },
  },
  {
    id: 'ducharse', kind: 'tap', target: 'ducha',
    instr: p('Ve al baño y dúchate. Toca la ducha.', 'Գնա լոգարան և լոգանք ընդունիր։ Հպիր ցնցուղին։'),
    forms: { pres: 'me ducho', perf: 'me he duchado', indef: 'me duché', imperf: 'me duchaba', fut: 'me ducharé' },
    s: {
      pres: { es: '[Me ducho] con agua caliente.', hy: 'Լոգանք եմ ընդունում տաք ջրով։' },
      perf: { es: 'Hoy [me he duchado] muy rápido.', hy: 'Այսօր շատ արագ եմ լոգանք ընդունել։' },
      indef: { es: 'Anoche [me duché] antes de dormir.', hy: 'Երեկ երեկոյան լոգանք ընդունեցի քնելուց առաջ։' },
      imperf: { es: 'Antes [me duchaba] siempre por la noche.', hy: 'Առաջ միշտ երեկոյան էի լոգանք ընդունում։' },
      fut: { es: 'Después del paseo [me ducharé] otra vez.', hy: 'Զբոսանքից հետո նորից լոգանք կընդունեմ։' },
    },
  },
  {
    id: 'vestirse', kind: 'tap', target: 'armario',
    instr: p('Vístete. Abre el armario.', 'Հագնվիր։ Բացիր զգեստապահարանը։'),
    forms: { pres: 'me pongo', perf: 'me he puesto', indef: 'me puse', imperf: 'me ponía', fut: 'me pondré' },
    s: {
      pres: { es: '[Me pongo] un jersey y unos pantalones.', hy: 'Հագնում եմ սվիտեր և տաբատ։' },
      perf: { es: 'Hoy [me he puesto] el jersey rojo.', hy: 'Այսօր կարմիր սվիտերս եմ հագել։' },
      indef: { es: 'Ayer [me puse] el abrigo largo.', hy: 'Երեկ երկար վերարկուս հագա։' },
      imperf: { es: 'De pequeña, siempre [me ponía] vestidos rosas.', hy: 'Փոքր ժամանակ միշտ վարդագույն զգեստներ էի հագնում։' },
      fut: { es: 'Para la fiesta [me pondré] un vestido elegante.', hy: 'Խնջույքի համար էլեգանտ զգեստ կհագնեմ։' },
    },
  },
  {
    id: 'desayunar', kind: 'drag', target: 'mesa',
    instr: p('Prepara el desayuno: lleva la bandeja a la mesa.', 'Պատրաստիր նախաճաշը. սկուտեղը տար սեղանի մոտ։'),
    forms: { pres: 'desayuno', perf: 'he desayunado', indef: 'desayuné', imperf: 'desayunaba', fut: 'desayunaré' },
    s: {
      pres: { es: '[Desayuno] tostadas con mermelada.', hy: 'Նախաճաշին ջեմով տոստ եմ ուտում։' },
      perf: { es: 'Hoy [he desayunado] chocolate caliente.', hy: 'Այսօր նախաճաշին տաք շոկոլադ եմ խմել։' },
      indef: { es: 'Ayer [desayuné] en una cafetería.', hy: 'Երեկ նախաճաշեցի սրճարանում։' },
      imperf: { es: 'En casa de mi abuela siempre [desayunaba] crepes.', hy: 'Տատիկիս տանը միշտ նրբաբլիթ էի նախաճաշում։' },
      fut: { es: 'Mañana [desayunaré] con mis amigas.', hy: 'Վաղը ընկերուհիներիս հետ կնախաճաշեմ։' },
    },
  },
  {
    id: 'salir', kind: 'tap', target: 'agenda',
    instr: p('Planea tu día. Abre tu agenda.', 'Պլանավորիր օրդ։ Բացիր օրագիրդ։'),
    forms: { pres: 'salgo', perf: 'he salido', indef: 'salí', imperf: 'salía', fut: 'saldré' },
    s: {
      pres: { es: 'Hoy no [salgo] porque hace mucho frío.', hy: 'Այսօր դուրս չեմ գալիս, քանի որ շատ ցուրտ է։' },
      perf: { es: 'Esta semana [he salido] poco de casa.', hy: 'Այս շաբաթ քիչ եմ տնից դուրս եկել։' },
      indef: { es: 'El sábado [salí] con mis amigas.', hy: 'Շաբաթ օրը դուրս եկա ընկերուհիներիս հետ։' },
      imperf: { es: 'Antes [salía] todos los fines de semana.', hy: 'Առաջ ամեն հանգստյան օր դուրս էի գալիս։' },
      fut: { es: 'Esta noche [saldré] a ver las luces de Navidad.', hy: 'Այս երեկո դուրս կգամ Ծննդյան լույսերը տեսնելու։' },
    },
  },
];

const PLAN: Record<Level, P> = {
  A1: p('Hoy voy a quedarme en casa porque hace frío.', 'Այսօր տանը եմ մնալու, քանի որ ցուրտ է։'),
  A2: p('Primero preparo el desayuno y después me visto.', 'Նախ պատրաստում եմ նախաճաշը, հետո հագնվում եմ։'),
  B1: p('Cuando termine de desayunar, llamaré a mi amiga.', 'Երբ նախաճաշս ավարտեմ, կզանգեմ ընկերուհուս։'),
  B2: p('Si sigue nevando, me quedaré en casa leyendo un libro.', 'Եթե ձյունը շարունակի գալ, տանը կմնամ գիրք կարդալով։'),
};

/** Which tenses to practise at each level (alternating per action). */
const LEVEL_TENSES: Record<Level, Tense[]> = {
  A1: ['pres'],
  A2: ['pres', 'perf'],
  B1: ['indef', 'imperf'],
  B2: ['fut', 'imperf', 'indef'],
};

function Draggy({ id, icon, label }: { id: string; icon: string; label: P }) {
  const down = useDraggable({ kind: 'morning', id }, { onStart: () => speak(label) });
  return (
    <div className="m-draggy drag-src" onPointerDown={down}>
      <span>{icon}</span>
      <T p={label} />
    </div>
  );
}

export function Morning() {
  const level = useGame((s) => s.level);
  const weather = useMemo<Weather>(() => pick(['nevando', 'soleado', 'frio', 'ventoso'] as Weather[]), []);
  const [ai, setAi] = useState(0);
  const [stage, setStage] = useState<'act' | 'ex' | 'plan' | 'done'>('act');
  const [state, setStateM] = useState({ alarm: true, inBed: true, curtains: 'closed' as 'open' | 'closed', bedMade: false, shower: false, dressed: false, breakfast: false });
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const act = ACTIONS[ai];
  const tense = LEVEL_TENSES[level][ai % LEVEL_TENSES[level].length];

  const err = (ph: P, extra?: P[]) => {
    setMistakes((m) => m + 1);
    setFb({ ok: false, p: ph, extra });
  };

  const doAction = (target: string) => {
    if (stage !== 'act') return;
    if (target !== act.target) return err(p('Eso no. Escucha la instrucción.', 'Դա չէ։ Լսիր հրահանգը։'), [act.instr]);
    sfx.success();
    setFb(null);
    setStateM((s) => {
      switch (act.id) {
        case 'despertarse':
          return { ...s, alarm: false };
        case 'levantarse':
          return { ...s, inBed: false };
        case 'cortinas':
          return { ...s, curtains: 'open' };
        case 'cama':
          return { ...s, bedMade: true };
        case 'ducharse':
          return { ...s, shower: true };
        case 'vestirse':
          return { ...s, shower: false, dressed: true };
        case 'desayunar':
          return { ...s, breakfast: true };
      }
      return s;
    });
    if (act.id === 'cortinas') {
      const w = { nevando: p('¡Está nevando!', 'Ձյուն է գալիս։'), soleado: p('¡Hace sol!', 'Արևոտ է։'), frio: p('Hace mucho frío.', 'Շատ ցուրտ է։'), ventoso: p('¡Qué viento hace!', 'Ինչ քամի է։') }[weather];
      setTimeout(() => speak(w), 400);
    }
    setTimeout(() => setStage('ex'), 900);
  };

  const bedRef = useDropTarget('m-cama', (pl) => pl.kind === 'morning', (pl) => (pl.id === 'manta' ? doAction('cama') : err(p('Eso no va en la cama.', 'Դա մահճակալի վրա չի դրվում։'))));
  const tableRef = useDropTarget('m-mesa', (pl) => pl.kind === 'morning', (pl) => (pl.id === 'bandeja' ? doAction('mesa') : err(p('La manta no va en la mesa.', 'Վերմակը սեղանի վրա չի դրվում։'))));

  const next = () => {
    setFb(null);
    if (ai + 1 >= ACTIONS.length) setStage('plan');
    else {
      setAi(ai + 1);
      setStage('act');
    }
  };

  // ---------- exercise ----------
  const sent = act.s[tense];
  const full: P = { es: sent.es.replace(/\[|\]/g, ''), hy: sent.hy };
  const blank = sent.es.replace(/\[.*?\]/, '_____');
  const options = useMemo(() => {
    const others = (Object.keys(act.forms) as Tense[]).filter((t) => t !== tense).map((t) => act.forms[t]);
    const right = sent.es.match(/\[(.*?)\]/)![1];
    return shuffle([right, ...shuffle(others).slice(0, 2)]);
  }, [ai, tense]);

  const wear: ClothId[] = state.dressed ? ['jersey', 'pantalones', 'calcetines'] : ['pijama'];
  const clock = '8:00';

  return (
    <div className="scene scene-morning">
      <SceneHeader title={p('La mañana perfecta', 'Կատարյալ առավոտ')} icon="🌸" />
      <Steps total={ACTIONS.length + 1} cur={stage === 'plan' || stage === 'done' ? ACTIONS.length : ai} />

      {stage === 'act' && <Instruction p={act.instr} icon="☀️" key={'a' + ai} />}

      <div className={'bedroom ' + (state.curtains === 'open' ? 'bright' : 'dark')}>
        <div className="br-wall" />
        <div className="br-floor" />
        <button className="br-window" onClick={() => doAction('ventana')} aria-label="ventana">
          <WeatherWindow weather={weather} curtains={state.curtains} className="br-win" />
        </button>
        <button className={'br-clock ' + (state.alarm ? 'ringing' : '')} onClick={() => doAction('reloj')}>
          ⏰<span>{clock}</span>
        </button>
        <div className="br-bed" ref={bedRef}>
          <div className="bed-head" />
          <div className="bed-mattress" />
          {state.inBed && (
            <button className="bed-girl" onClick={() => doAction('gayane')}>
              <Gayane wear={['pijama']} mood={state.alarm ? 'sleep' : 'happy'} lying />
            </button>
          )}
          {(state.inBed || state.bedMade) && <div className={'bed-blanket ' + (state.bedMade ? 'made' : '')} />}
          {state.alarm && <span className="zzz">Z z z</span>}
        </div>
        {!state.inBed && !state.bedMade && (
          <div className="br-blanket-floor">
            <Draggy id="manta" icon="🛏️" label={p('la manta', 'վերմակը')} />
          </div>
        )}
        <button className="br-shower" onClick={() => doAction('ducha')}>
          🚿 <T p={p('el baño', 'լոգարան')} />
          {state.shower && <span className="steam-cloud">💨💨</span>}
        </button>
        <button className="br-wardrobe" onClick={() => doAction('armario')}>
          🚪 <T p={p('el armario', 'պահարան')} />
        </button>
        <div className="br-table" ref={tableRef}>
          {state.breakfast ? <span className="pop-in">🍞☕🍓</span> : <T p={p('la mesa', 'սեղան')} />}
        </div>
        {!state.breakfast && state.dressed && (
          <div className="br-tray">
            <Draggy id="bandeja" icon="🍳" label={p('la bandeja del desayuno', 'նախաճաշի սկուտեղը')} />
          </div>
        )}
        <button className="br-agenda" onClick={() => doAction('agenda')}>
          📔 <T p={p('la agenda', 'օրագիր')} />
        </button>
        {!state.inBed && (
          <div className="br-girl">
            <Gayane wear={wear} mood="happy" />
          </div>
        )}
      </div>

      {stage === 'ex' && (
        <div className="exercise pop-in">
          <div className="ex-tense">
            📘 <T p={TENSE_P[tense]} />
          </div>
          {tense === 'pres' ? (
            <>
              <Phrase p={p('Construye la frase en primera persona:', 'Կազմիր նախադասությունը առաջին դեմքով՝')} />
              <WordTiles
                target={full}
                showHint
                extra={[act.forms.indef.split(' ').pop()!]}
                onResult={(ok) => {
                  if (ok) {
                    setFb({ ok: true, p: full });
                    setTimeout(next, 1600);
                  } else {
                    markDifficult(full, true);
                    err(p('Casi. Mira el orden de las palabras.', 'Գրեթե։ Նայիր բառերի հերթականությանը։'));
                  }
                }}
              />
            </>
          ) : (
            <>
              <div className="gap-sentence">
                <T p={p(blank, sent.hy)} />
              </div>
              <Choices
                options={options.map((o) => p(o, TENSE_P[(Object.keys(act.forms) as Tense[]).find((t) => act.forms[t] === o)!].hy))}
                onPick={(i) => {
                  const right = sent.es.match(/\[(.*?)\]/)![1];
                  if (options[i] === right) {
                    setFb({ ok: true, p: full });
                    setTimeout(next, 1800);
                  } else {
                    markDifficult(full, true);
                    err(p(`No es «${options[i]}». Fíjate en el tiempo verbal.`, `«${options[i]}» չէ։ Ուշադրություն դարձրու բայի ժամանակաձևին։`));
                  }
                }}
              />
            </>
          )}
        </div>
      )}

      {stage === 'plan' && (
        <div className="exercise pop-in">
          <Instruction p={p('¿Qué vas a hacer hoy? Ordena tu plan del día.', 'Ի՞նչ ես անելու այսօր։ Դասավորիր օրվա ծրագիրդ։')} icon="📔" />
          <WordTiles
            target={PLAN[level]}
            showHint
            onResult={(ok) => {
              if (ok) {
                setFb({ ok: true, p: PLAN[level] });
                setTimeout(() => setStage('done'), 1500);
              } else err(p('Inténtalo otra vez.', 'Նորից փորձիր։'));
            }}
          />
        </div>
      )}

      <Feedback fb={fb} onClose={() => setFb(null)} />
      {stage === 'done' && <Reward id={'morning:' + level} stars={starsFor(mistakes)} message={p('¡Qué mañana tan perfecta! Ya estoy lista para el día.', 'Ինչ կատարյալ առավոտ է։ Արդեն պատրաստ եմ օրվան։')} onAgain={() => location.reload()} />}
      <div style={{ height: 90 }} />
      <Btn label={p('Saltar este paso', 'Բաց թողնել այս քայլը')} variant="ghost" small className="skip-btn" onClick={() => (stage === 'act' ? (setFb(null), setStage('ex')) : next())} />
    </div>
  );
}
