import { useEffect, useMemo, useState } from 'react';
import { Btn, Choices, Feedback, Instruction, Reward, SceneHeader, Steps, starsFor, type Fb } from '../components/UI';
import { WordTiles } from '../components/WordTiles';
import { Phrase, T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { markDifficult, useGame } from '../core/store';
import { levelIndex, levelOk, p, type Level, type P } from '../core/types';
import { numEs, numHy, pick, sample, shuffle } from '../core/util';
import { DIALOGS, ERRORS, ORDER_SENT, SITUATIONS, VOCAB } from '../data/minigames';

type MG = 'memory' | 'escucha' | 'dialogo' | 'ordena' | 'falta' | 'vf' | 'error' | 'harias';
const LIST: { id: MG; icon: string; name: P; desc: P }[] = [
  { id: 'memory', icon: '🃏', name: p('Memory', 'Հիշողություն'), desc: p('Encuentra las parejas: dibujo y palabra.', 'Գտիր զույգերը՝ նկար և բառ։') },
  { id: 'escucha', icon: '👂', name: p('Escucha y encuentra', 'Լսիր և գտիր'), desc: p('Escucha la palabra y toca el dibujo.', 'Լսիր բառը և հպիր նկարին։') },
  { id: 'dialogo', icon: '💬', name: p('Completa el diálogo', 'Լրացրու երկխոսությունը'), desc: p('Elige la frase que falta.', 'Ընտրիր պակասող նախադասությունը։') },
  { id: 'ordena', icon: '🧩', name: p('Ordena la frase', 'Դասավորիր նախադասությունը'), desc: p('Pon las palabras en orden.', 'Բառերը դասավորիր ճիշտ հերթականությամբ։') },
  { id: 'falta', icon: '🔍', name: p('¿Qué falta?', 'Ի՞նչն է պակասում'), desc: p('Memoriza los objetos y descubre cuál desaparece.', 'Հիշիր առարկաները և գտիր, թե որն է անհետացել։') },
  { id: 'vf', icon: '✅', name: p('Verdadero o falso', 'Ճիշտ է, թե սխալ'), desc: p('Mira la imagen y decide.', 'Նայիր նկարին և որոշիր։') },
  { id: 'error', icon: '✏️', name: p('Corrige el error', 'Ուղղիր սխալը'), desc: p('Encuentra la palabra incorrecta.', 'Գտիր սխալ բառը։') },
  { id: 'harias', icon: '🤔', name: p('¿Qué harías tú?', 'Ի՞նչ կանեիր դու'), desc: p('Elige qué hacer en cada situación.', 'Ընտրիր, թե ինչ անել յուրաքանչյուր իրավիճակում։') },
];

const vocabFor = (lv: Level) => VOCAB.filter((v) => levelOk(v.level, lv));

export function MiniGames() {
  const [g, setG] = useState<MG | null>(null);
  const stars = useGame((s) => s.stars);
  const level = useGame((s) => s.level);
  const cur = LIST.find((x) => x.id === g);
  return (
    <div className="scene scene-mini">
      <SceneHeader title={cur ? cur.name : p('Minijuegos', 'Մինի-խաղեր')} icon={cur ? cur.icon : '🎲'} back={g ? 'minigames' : 'home'} />
      {!g && (
        <>
          <Instruction p={p('Elige un minijuego. La dificultad depende de tu nivel.', 'Ընտրիր մինի-խաղ։ Բարդությունը կախված է քո մակարդակից։')} icon="🎲" />
          <div className="recipe-grid">
            {LIST.map((m) => (
              <button key={m.id} className="recipe-card" onClick={() => (sfx.click(), setG(m.id))}>
                <span className="rc-icon">{m.icon}</span>
                <span className="rc-name">
                  <T p={m.name} />
                </span>
                <span className="gc-desc">
                  <T p={m.desc} />
                </span>
                <span className="rc-stars">
                  {'★'.repeat(stars[`mini:${m.id}:${level}`] || 0)}
                  {'☆'.repeat(3 - (stars[`mini:${m.id}:${level}`] || 0))}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
      {g === 'memory' && <Memory />}
      {g === 'escucha' && <Escucha />}
      {g === 'dialogo' && <Dialogo />}
      {g === 'ordena' && <Ordena />}
      {g === 'falta' && <Falta />}
      {g === 'vf' && <VF />}
      {g === 'error' && <Corrige />}
      {g === 'harias' && <Harias />}
      <div style={{ height: 90 }} />
    </div>
  );
}

function useRound(total: number) {
  const [i, setI] = useState(0);
  const [miss, setMiss] = useState(0);
  const [fb, setFb] = useState<Fb | null>(null);
  const [done, setDone] = useState(false);
  const ok = (ph?: P) => {
    setFb(ph ? { ok: true, p: ph } : null);
    if (!ph) sfx.success();
    if (i + 1 >= total) setTimeout(() => setDone(true), 900);
    else setTimeout(() => setI(i + 1), ph ? 1200 : 500);
  };
  const bad = (ph: P, extra?: P[]) => {
    setMiss((m) => m + 1);
    markDifficult(extra?.[0] || ph, true);
    setFb({ ok: false, p: ph, extra });
  };
  return { i, miss, fb, setFb, done, ok, bad, reset: () => (setI(0), setMiss(0), setDone(false), setFb(null)) };
}

function End({ id, miss, reset }: { id: MG; miss: number; reset: () => void }) {
  const level = useGame((s) => s.level);
  return <Reward id={`mini:${id}:${level}`} stars={starsFor(miss)} message={p('¡Muy bien! Has terminado el minijuego.', 'Շատ լավ է։ Ավարտեցիր մինի-խաղը։')} onAgain={() => location.reload()} />;
}

/* ---------------- 1. Memory ---------------- */
function Memory() {
  const level = useGame((s) => s.level);
  const n = [6, 8, 10, 12][levelIndex(level)];
  const cards = useMemo(() => {
    const words = sample(vocabFor(level), n);
    return shuffle(words.flatMap((w, k) => [{ k, kind: 'img' as const, w }, { k, kind: 'txt' as const, w }]));
  }, [level]);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  const flip = (idx: number) => {
    if (open.length === 2 || open.includes(idx) || found.includes(cards[idx].k)) return;
    sfx.pop();
    const c = cards[idx];
    if (c.kind === 'txt') speak(c.w.w);
    const no = [...open, idx];
    setOpen(no);
    if (no.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = no.map((x) => cards[x]);
      if (a.k === b.k) {
        setTimeout(() => {
          sfx.sparkle();
          speak(a.w.w);
          const nf = [...found, a.k];
          setFound(nf);
          setOpen([]);
          if (nf.length === n) setTimeout(() => setDone(true), 800);
        }, 500);
      } else setTimeout(() => setOpen([]), 1100);
    }
  };
  const miss = Math.max(0, moves - n - 3);
  return (
    <>
      <div className="mem-info">
        <T p={p('Movimientos', 'Քայլեր')} />: {moves} · ✓ {found.length}/{n}
      </div>
      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${n > 8 ? 6 : 4}, 1fr)` }}>
        {cards.map((c, i) => {
          const up = open.includes(i) || found.includes(c.k);
          return (
            <button key={i} className={'mcard ' + (up ? 'up ' : '') + (found.includes(c.k) ? 'found' : '')} onClick={() => flip(i)}>
              <span className="mback">❄️</span>
              <span className="mfront">{c.kind === 'img' ? <span className="memoji">{c.w.e}</span> : <span className="mword">{c.w.w.es}</span>}</span>
            </button>
          );
        })}
      </div>
      {done && <End id="memory" miss={miss} reset={() => location.reload()} />}
    </>
  );
}

/* ---------------- 2. Escucha y encuentra ---------------- */
function Escucha() {
  const level = useGame((s) => s.level);
  const ROUNDS = 8;
  const nOpt = [4, 6, 8, 9][levelIndex(level)];
  const rounds = useMemo(() => {
    const pool = vocabFor(level);
    return Array.from({ length: ROUNDS }, () => {
      const opts = sample(pool, nOpt);
      return { opts, ans: pick(opts) };
    });
  }, [level]);
  const R = useRound(ROUNDS);
  const r = rounds[R.i];
  useEffect(() => {
    const t = setTimeout(() => speak(r.ans.w), 400);
    return () => clearTimeout(t);
  }, [R.i]);
  return (
    <>
      <Steps total={ROUNDS} cur={R.i} />
      <div className="listen-box">
        <button className="big-listen" onClick={() => speak(r.ans.w)}>
          🔊
        </button>
        <button className="tool" onClick={() => speak(r.ans.w, { slow: true })}>
          🐢 <T p={p('Más despacio', 'Ավելի դանդաղ')} />
        </button>
      </div>
      <div className="pick-grid">
        {r.opts.map((o) => (
          <button key={o.e} className="pick-card" onClick={() => (o === r.ans ? R.ok(o.w) : R.bad(p('No, escucha otra vez.', 'Ոչ, նորից լսիր։')))}>
            {o.e}
          </button>
        ))}
      </div>
      <Feedback fb={R.fb} onClose={() => R.setFb(null)} />
      {R.done && <End id="escucha" miss={R.miss} reset={R.reset} />}
    </>
  );
}

/* ---------------- 3. Completa el diálogo ---------------- */
function Dialogo() {
  const level = useGame((s) => s.level);
  const items = useMemo(() => shuffle(DIALOGS.filter((d) => levelOk(d.level, level))).slice(0, 5), [level]);
  const R = useRound(items.length);
  const d = items[R.i];
  const opts = useMemo(() => shuffle(d.options.map((o, k) => ({ o, k }))), [R.i]);
  return (
    <>
      <Steps total={items.length} cur={R.i} />
      <div className="dialogue">
        <div className="chat">
          {d.lines.map((l, k) => (
            <div key={k} className={'msg ' + (d.who[k] === 'B' ? 'mine' : '')}>
              <div className="avatar" style={{ background: d.who[k] === 'B' ? '#9c2a4c' : '#dccdf0' }}>
                {d.who[k] === 'B' ? '👩🏻' : '👩🏽‍🦱'}
              </div>
              <div className="msg-body">{l ? <Phrase p={l} /> : <span className="missing">❓ …</span>}</div>
            </div>
          ))}
        </div>
      </div>
      <Choices options={opts.map((x) => x.o)} onPick={(i) => (opts[i].k === d.answer ? R.ok(d.options[d.answer]) : R.bad(p('Esa respuesta no encaja.', 'Այդ պատասխանը չի համապատասխանում։'), [d.options[d.answer]]))} />
      <Feedback fb={R.fb} onClose={() => R.setFb(null)} />
      {R.done && <End id="dialogo" miss={R.miss} reset={R.reset} />}
    </>
  );
}

/* ---------------- 4. Ordena la frase ---------------- */
function Ordena() {
  const level = useGame((s) => s.level);
  const items = useMemo(() => {
    const own = ORDER_SENT.filter((s) => s.level === level);
    const lower = ORDER_SENT.filter((s) => levelOk(s.level, level) && s.level !== level);
    return [...shuffle(own), ...shuffle(lower)].slice(0, 5);
  }, [level]);
  const R = useRound(items.length);
  return (
    <>
      <Steps total={items.length} cur={R.i} />
      <Instruction p={p('Ordena las palabras para formar una frase.', 'Դասավորիր բառերը՝ նախադասություն կազմելու համար։')} icon="🧩" auto={R.i === 0} />
      <WordTiles key={R.i} target={items[R.i].p} showHint={levelIndex(level) < 2} onResult={(ok) => (ok ? R.ok(items[R.i].p) : R.bad(p('El orden no es correcto.', 'Հերթականությունը ճիշտ չէ։'), [items[R.i].p]))} />
      <Feedback fb={R.fb} onClose={() => R.setFb(null)} />
      {R.done && <End id="ordena" miss={R.miss} reset={R.reset} />}
    </>
  );
}

/* ---------------- 5. ¿Qué falta? ---------------- */
function Falta() {
  const level = useGame((s) => s.level);
  const ROUNDS = 5;
  const n = [4, 5, 6, 8][levelIndex(level)];
  const rounds = useMemo(
    () =>
      Array.from({ length: ROUNDS }, () => {
        const set = sample(vocabFor(level), n);
        const gone = pick(set);
        const distract = sample(vocabFor(level).filter((v) => !set.includes(v)), 2);
        return { set, gone, opts: shuffle([gone, ...sample(set.filter((x) => x !== gone), 1), ...distract]) };
      }),
    [level],
  );
  const R = useRound(ROUNDS);
  const r = rounds[R.i];
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    setHidden(false);
    const t = setTimeout(() => (setHidden(true), sfx.whoosh()), 3500 + n * 300);
    return () => clearTimeout(t);
  }, [R.i]);
  return (
    <>
      <Steps total={ROUNDS} cur={R.i} />
      <Instruction p={hidden ? p('¿Qué objeto falta?', 'Ո՞ր առարկան է պակասում։') : p('Mira bien los objetos. ¡Memorízalos!', 'Ուշադիր նայիր առարկաներին։ Հիշիր դրանք։')} icon="🔍" key={String(hidden) + R.i} />
      <div className="falta-grid">
        {r.set.map((v) =>
          hidden && v === r.gone ? (
            <div key={v.e} className="falta-item empty">?</div>
          ) : (
            <div key={v.e} className="falta-item pop-in">
              <span>{v.e}</span>
              <T p={v.w} />
            </div>
          ),
        )}
      </div>
      {hidden && <Choices options={r.opts.map((o) => o.w)} onPick={(i) => (r.opts[i] === r.gone ? R.ok(r.gone.w) : R.bad(p('No, ese objeto sigue ahí.', 'Ոչ, այդ առարկան դեռ այնտեղ է։'), [r.gone.w]))} />}
      <Feedback fb={R.fb} onClose={() => R.setFb(null)} />
      {R.done && <End id="falta" miss={R.miss} reset={R.reset} />}
    </>
  );
}

/* ---------------- 6. Verdadero o falso ---------------- */
function VF() {
  const level = useGame((s) => s.level);
  const ROUNDS = 8;
  const rounds = useMemo(
    () =>
      Array.from({ length: ROUNDS }, () => {
        const countable = vocabFor(level).filter((v) => v.pl);
        const types = sample(countable, 3);
        const counts = types.map(() => 1 + Math.floor(Math.random() * 5));
        const items = shuffle(types.flatMap((t, k) => Array(counts[k]).fill(t.e) as string[]));
        const truth = Math.random() < 0.5;
        let st: P;
        if (levelIndex(level) >= 2 && Math.random() < 0.6) {
          // comparison
          const [a, b] = [0, 1];
          const real = counts[a] > counts[b];
          const claimMore = truth ? real : !real;
          const eq = counts[a] === counts[b];
          st = p(
            `Hay ${claimMore ? 'más' : 'menos'} ${types[a].pl} que ${types[b].pl}.`,
            `Ավելի ${claimMore ? 'շատ' : 'քիչ'} ${types[a].plHy} կա, քան ${types[b].plHy}։`,
          );
          return { items, st, truth: eq ? false : claimMore === real ? true : false };
        }
        const k = Math.floor(Math.random() * 3);
        const said = truth ? counts[k] : counts[k] + (Math.random() < 0.5 ? 1 : counts[k] > 1 ? -1 : 2);
        const t = types[k];
        st = said === 1 ? p(`Hay un${t.w.es.startsWith('la') ? 'a' : ''} ${t.w.es.replace(/^(el|la) /, '')}.`, `Կա մեկ ${t.plHy}։`) : p(`Hay ${numEs(said, t.w.es.startsWith('la'))} ${t.pl}.`, `Կա ${numHy(said)} ${t.plHy}։`);
        return { items, st, truth: said === counts[k] };
      }),
    [level],
  );
  const R = useRound(ROUNDS);
  const r = rounds[R.i];
  useEffect(() => {
    const t = setTimeout(() => speak(r.st), 300);
    return () => clearTimeout(t);
  }, [R.i]);
  const answer = (v: boolean) => (v === r.truth ? R.ok(p(r.truth ? '¡Correcto! Es verdad.' : '¡Correcto! Es falso.', r.truth ? 'Ճիշտ է։ Դա ճշմարիտ է։' : 'Ճիշտ է։ Դա սխալ է։')) : R.bad(p('Cuenta otra vez.', 'Նորից հաշվիր։'), [r.st]));
  return (
    <>
      <Steps total={ROUNDS} cur={R.i} />
      <div className="vf-scene">
        {r.items.map((e, k) => (
          <span key={k} style={{ animationDelay: k * 0.05 + 's' }} className="pop-in">
            {e}
          </span>
        ))}
      </div>
      <div className="vf-statement">
        <Phrase p={r.st} big />
      </div>
      <div className="vf-btns">
        <Btn label={p('Verdadero', 'Ճիշտ է')} icon="✅" onClick={() => answer(true)} />
        <Btn label={p('Falso', 'Սխալ է')} icon="❌" variant="danger" onClick={() => answer(false)} />
      </div>
      <Feedback fb={R.fb} onClose={() => R.setFb(null)} />
      {R.done && <End id="vf" miss={R.miss} reset={R.reset} />}
    </>
  );
}

/* ---------------- 7. Corrige el error ---------------- */
function Corrige() {
  const level = useGame((s) => s.level);
  const items = useMemo(() => {
    const own = ERRORS.filter((e) => e.level === level);
    const lower = ERRORS.filter((e) => levelOk(e.level, level) && e.level !== level);
    return [...shuffle(own), ...shuffle(lower)].slice(0, 5);
  }, [level]);
  const R = useRound(items.length);
  const it = items[R.i];
  const [found, setFound] = useState(false);
  useEffect(() => setFound(false), [R.i]);
  const opts = useMemo(() => shuffle(it.options), [R.i]);
  return (
    <>
      <Steps total={items.length} cur={R.i} />
      <Instruction p={found ? p('¿Cuál es la palabra correcta?', 'Ո՞րն է ճիշտ բառը։') : p('Toca la palabra incorrecta.', 'Հպիր սխալ բառին։')} icon="✏️" key={String(found) + R.i} />
      <div className="err-sentence">
        {it.words.map((wd, k) => (
          <button
            key={k}
            className={'err-word ' + (found && k === it.wrong ? 'wrong' : '')}
            onClick={() => {
              if (found) return;
              if (k === it.wrong) {
                sfx.success();
                setFound(true);
              } else R.bad(p('Esa palabra está bien. Busca otra.', 'Այդ բառը ճիշտ է։ Փնտրիր մեկ ուրիշը։'));
            }}
          >
            {wd}
          </button>
        ))}
      </div>
      {found && (
        <div className="err-opts">
          {opts.map((o) => (
            <button key={o} className="tile" onClick={() => (o === it.options[0] ? R.ok(it.full) : R.bad(it.rule, [it.full]))}>
              {o}
            </button>
          ))}
        </div>
      )}
      {found && (
        <div className="err-rule">
          💡 <T p={it.rule} />
        </div>
      )}
      <Feedback fb={R.fb} onClose={() => R.setFb(null)} />
      {R.done && <End id="error" miss={R.miss} reset={R.reset} />}
    </>
  );
}

/* ---------------- 8. ¿Qué harías tú? ---------------- */
function Harias() {
  const level = useGame((s) => s.level);
  const items = useMemo(() => shuffle(SITUATIONS.filter((s) => levelOk(s.level, level))).slice(0, 5), [level]);
  const R = useRound(items.length);
  const it = items[R.i];
  const opts = useMemo(() => shuffle(it.options.map((o, k) => ({ o, k }))), [R.i]);
  return (
    <>
      <Steps total={items.length} cur={R.i} />
      <div className="situation">
        <span className="sit-icon">🤔</span>
        <Phrase p={it.sit} big />
      </div>
      <Choices options={opts.map((x) => x.o)} onPick={(i) => (opts[i].k === it.best ? R.ok(it.why) : R.bad(p('Mmm… ¿Seguro? Piensa en cómo se sentiría la otra persona.', 'Մմմ… Համոզվա՞ծ ես։ Մտածիր, թե ինչ կզգար մյուս մարդը։'), [it.options[it.best]]))} />
      <Feedback fb={R.fb} onClose={() => R.setFb(null)} />
      {R.done && <End id="harias" miss={R.miss} reset={R.reset} />}
    </>
  );
}
