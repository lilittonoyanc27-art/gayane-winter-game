import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE } from 'react';
import { Gayane } from '../components/Gayane';
import { Snow } from '../components/Snow';
import { ClothIcon } from '../components/ClothIcon';
import { Dialogue, type Script } from '../components/Dialogue';
import { Btn, Feedback, Instruction, Reward, SceneHeader, Steps, go, starsFor, type Fb } from '../components/UI';
import { useDraggable, useDropTarget } from '../core/dnd';
import { T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { award, markDifficult, useGame } from '../core/store';
import { levelIndex, levelOk, p, type Level, type P } from '../core/types';
import { pick, shuffle } from '../core/util';

type Act = 'snowman' | 'balls' | 'photos' | 'kiosk' | 'friend';

const SPOTS: { x: number; act: Act | 'home'; icon: string; label: P }[] = [
  { x: 10, act: 'home', icon: '🏠', label: p('Volver a casa', 'Վերադառնալ տուն') },
  { x: 55, act: 'snowman', icon: '⛄', label: p('Hacer un muñeco de nieve', 'Ձնեմարդ սարքել') },
  { x: 105, act: 'balls', icon: '❄️', label: p('Jugar con bolas de nieve', 'Ձնագնդի խաղալ') },
  { x: 152, act: 'photos', icon: '📷', label: p('Sacar fotos', 'Լուսանկարել') },
  { x: 205, act: 'kiosk', icon: '☕', label: p('Comprar una bebida caliente', 'Տաք ըմպելիք գնել') },
  { x: 262, act: 'friend', icon: '👭', label: p('Hablar con mi amiga Lucía', 'Զրուցել ընկերուհուս՝ Լուսիայի հետ') },
];

const FLAKES: { x: number; w: P }[] = [
  { x: 30, w: p('la nieve', 'ձյուն') },
  { x: 80, w: p('el frío', 'ցուրտ') },
  { x: 128, w: p('el hielo', 'սառույց') },
  { x: 178, w: p('el invierno', 'ձմեռ') },
  { x: 232, w: p('el trineo', 'սահնակ') },
  { x: 288, w: p('el copo de nieve', 'ձյան փաթիլ') },
];

/* ================================================================= */
/* Street                                                             */
/* ================================================================= */
export function SnowDay() {
  const [x, setX] = useState(18);
  const [dir, setDir] = useState(1);
  const [walking, setWalking] = useState(false);
  const [act, setAct] = useState<Act | null>(null);
  const [got, setGot] = useState<number[]>([]);
  const [bubble, setBubble] = useState<P | null>(null);
  const target = useRef<number | null>(null);
  const hold = useRef(0);
  const vpRef = useRef<HTMLDivElement>(null);

  // walking loop
  useEffect(() => {
    const id = window.setInterval(() => {
      setX((cur) => {
        let nx = cur;
        if (hold.current) nx = cur + hold.current * 1.1;
        else if (target.current !== null) {
          const d = target.current - cur;
          if (Math.abs(d) < 1.2) {
            target.current = null;
            nx = cur + d;
          } else nx = cur + Math.sign(d) * 1.1;
        }
        nx = Math.max(3, Math.min(297, nx));
        const moving = nx !== cur;
        setWalking(moving);
        if (moving) setDir(nx > cur ? 1 : -1);
        return nx;
      });
    }, 30);
    return () => window.clearInterval(id);
  }, []);

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') hold.current = 1;
      if (e.key === 'ArrowLeft') hold.current = -1;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') hold.current = 0;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // collect snowflake words while walking
  useEffect(() => {
    FLAKES.forEach((f, i) => {
      if (!got.includes(i) && Math.abs(f.x - x) < 3) {
        setGot((g) => {
          const n = [...g, i];
          if (n.length === FLAKES.length) {
            const done = p('¡He paseado por todo el parque y he encontrado todos los copos!', 'Զբոսնել եմ ամբողջ այգով և գտել եմ բոլոր փաթիլները։');
            award('snow:paseo', 3);
            setTimeout(() => (setBubble(done), speak(done)), 1200);
          }
          return n;
        });
        sfx.sparkle();
        setBubble(f.w);
        speak(f.w);
      }
    });
  }, [Math.round(x)]);

  const cam = Math.max(0, Math.min(200, x - 50));
  const near = SPOTS.find((s) => Math.abs(s.x - x) < 9);

  const tapGround = (e: RPE<HTMLDivElement>) => {
    const r = vpRef.current!.getBoundingClientRect();
    const wx = cam + ((e.clientX - r.left) / r.width) * 100;
    target.current = wx;
  };

  if (act) {
    return (
      <div className="scene scene-snow">
        <SceneHeader title={SPOTS.find((s) => s.act === act)!.label} icon={SPOTS.find((s) => s.act === act)!.icon} back="snow" />
        {act === 'snowman' && <Snowman onDone={() => setAct(null)} />}
        {act === 'balls' && <Snowballs onDone={() => setAct(null)} />}
        {act === 'photos' && <Photos onDone={() => setAct(null)} />}
        {act === 'kiosk' && <Kiosk onDone={() => setAct(null)} />}
        {act === 'friend' && <Friend onDone={() => setAct(null)} />}
      </div>
    );
  }

  return (
    <div className="scene scene-snow">
      <SceneHeader title={p('Un día de nieve', 'Ձյունառատ օր')} icon="⛄" />
      <Instruction p={p('Camina por la calle con las flechas o tocando el suelo. Recoge los copos de nieve.', 'Քայլիր փողոցով՝ սլաքներով կամ հպելով գետնին։ Հավաքիր ձյան փաթիլները։')} icon="🧭" />
      <div className="street-vp" ref={vpRef} onPointerDown={tapGround}>
        <div className="street-sky">
          <Snow n={50} />
        </div>
        <div className="street-world" style={{ transform: `translateX(${(-cam / 300) * 100}%)` }}>
          <div className="mountains" />
          <div className="street-ground" />
          {/* scenery */}
          <div className="house-ext" style={{ left: '2%' }}>
            <div className="hx-roof" />
            <div className="hx-body">
              <div className="hx-win" />
              <div className="hx-door" />
              <div className="hx-win" />
            </div>
          </div>
          {[20, 40, 70, 92, 120, 140, 168, 190, 220, 245, 275, 295].map((tx, i) => (
            <span key={i} className="tree" style={{ left: (tx / 300) * 100 + '%', fontSize: i % 2 ? '3.2rem' : '4.2rem' }}>
              🌲
            </span>
          ))}
          {[45, 160, 250].map((lx) => (
            <div key={lx} className="lamppost" style={{ left: (lx / 300) * 100 + '%' }} />
          ))}
          <div className="park-sign" style={{ left: (38 / 300) * 100 + '%' }}>
            <T p={p('Parque del Invierno', 'Ձմեռային այգի')} />
          </div>
          <div className="frozen-lake" style={{ left: (140 / 300) * 100 + '%' }} />
          <div className="kiosk" style={{ left: (198 / 300) * 100 + '%' }}>
            <div className="kiosk-roof" />
            <div className="kiosk-body">☕ 🍫</div>
            <div className="kiosk-sign">
              <T p={p('Bebidas calientes', 'Տաք ըմպելիքներ')} />
            </div>
          </div>
          <div className="bench" style={{ left: (255 / 300) * 100 + '%' }}>
            <span className="lucia">👩🏽‍🦱</span>
          </div>
          <span className="snowman-deco" style={{ left: (62 / 300) * 100 + '%' }}>
            ⛄
          </span>
          {FLAKES.map((f, i) =>
            got.includes(i) ? null : (
              <span key={i} className="flake-pick" style={{ left: (f.x / 300) * 100 + '%' }}>
                ❄️
              </span>
            ),
          )}
          {SPOTS.map((s) => (
            <span key={s.act} className="spot-marker" style={{ left: (s.x / 300) * 100 + '%' }}>
              {s.icon}
            </span>
          ))}
          <div className="street-girl" style={{ left: (x / 300) * 100 + '%' }}>
            {bubble && (
              <div className="speech-bubble pop-in" key={bubble.es} onPointerDown={(e) => e.stopPropagation()}>
                <T p={bubble} />
              </div>
            )}
            <div style={{ transform: `scaleX(${dir})` }}>
              <Gayane wear={['abrigo', 'gorro', 'bufanda', 'guantes', 'pantalones', 'botas']} walking={walking} />
            </div>
          </div>
        </div>
      </div>

      <div className="walk-ctrl">
        <button
          className="walk-btn"
          onPointerDown={() => (hold.current = -1)}
          onPointerUp={() => (hold.current = 0)}
          onPointerLeave={() => (hold.current = 0)}
          aria-label="izquierda"
        >
          ◀
        </button>
        <div className="flake-count">
          ❄️ {got.length}/{FLAKES.length}
        </div>
        {near && (
          <div className="near-action pop-in">
            <Btn
              label={near.label}
              icon={near.icon}
              variant="gold"
              onClick={() => {
                if (near.act === 'home') return go('home');
                setAct(near.act);
              }}
            />
          </div>
        )}
        <button
          className="walk-btn"
          onPointerDown={() => (hold.current = 1)}
          onPointerUp={() => (hold.current = 0)}
          onPointerLeave={() => (hold.current = 0)}
          aria-label="derecha"
        >
          ▶
        </button>
      </div>
      <div className="act-list">
        {SPOTS.filter((s) => s.act !== 'home').map((s) => (
          <button key={s.act} className="act-chip" onClick={() => (target.current = s.x)}>
            {s.icon} <T p={s.label} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================= */
/* Snowman builder                                                     */
/* ================================================================= */
type Cat = 'grande' | 'mediana' | 'pequena';
const CAT_P: Record<Cat, P> = {
  grande: p('grande', 'մեծ'),
  mediana: p('mediana', 'միջին'),
  pequena: p('pequeña', 'փոքր'),
};
const catOf = (s: number): Cat | null => (s >= 100 ? 'grande' : s >= 70 ? 'mediana' : s >= 42 ? 'pequena' : null);
const ORDER: Cat[] = ['grande', 'mediana', 'pequena'];

const DECOS: { id: string; icon: JSX.Element | string; name: P; instr: P }[] = [
  { id: 'zanahoria', icon: '🥕', name: p('la zanahoria', 'գազար'), instr: p('Ponle una zanahoria como nariz.', 'Գազար դիր որպես քիթ։') },
  { id: 'carbon', icon: '⚫', name: p('el carbón', 'ածուխ'), instr: p('Ahora, los ojos: usa el carbón.', 'Հիմա՝ աչքերը. օգտագործիր ածուխը։') },
  { id: 'ramas', icon: '🪵', name: p('las ramas', 'ճյուղեր'), instr: p('Ponle dos ramas como brazos.', 'Երկու ճյուղ դիր որպես ձեռքեր։') },
  { id: 'bufanda', icon: <ClothIcon id="bufanda" size={44} />, name: p('la bufanda', 'շարֆ'), instr: p('Ponle la bufanda alrededor del cuello.', 'Շարֆը փաթաթիր վզին։') },
  { id: 'gorro', icon: <ClothIcon id="gorro" size={44} />, name: p('el gorro', 'գլխարկ'), instr: p('Y por último, el gorro en la cabeza.', 'Եվ վերջում՝ գլխարկը գլխին։') },
];

function DecoChip({ d }: { d: (typeof DECOS)[number] }) {
  const down = useDraggable({ kind: 'sm-deco', id: d.id }, { ghost: <div className="ing-ghost">{d.icon}</div>, onStart: () => speak(d.name) });
  return (
    <div className="ing">
      <div className="ing-icon drag-src" onPointerDown={down}>
        {d.icon}
      </div>
      <T p={d.name} className="ing-name" />
    </div>
  );
}

function BallChip({ size, idx }: { size: number; idx: number }) {
  const down = useDraggable({ kind: 'sm-ball', id: String(idx) }, {});
  return <div className="snowball-chip drag-src" onPointerDown={down} style={{ width: size * 0.6, height: size * 0.6 }} />;
}

function Snowman({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'roll' | 'stack' | 'deco' | 'done'>('roll');
  const [balls, setBalls] = useState<{ size: number; cat: Cat }[]>([]);
  const [stack, setStack] = useState<number[]>([]);
  const [decos, setDecos] = useState<string[]>([]);
  const [rolling, setRolling] = useState<{ x: number; y: number; size: number } | null>(null);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const last = useRef<{ x: number; y: number } | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  const need = ORDER[balls.length];
  const instr: P =
    phase === 'roll'
      ? balls.length === 0
        ? p('Mantén pulsado y mueve el dedo por la nieve para hacer una bola grande.', 'Սեղմած պահիր և մատդ շարժիր ձյան վրայով՝ մեծ գնդի սարքելու համար։')
        : balls.length === 1
          ? p('Ahora haz una bola mediana.', 'Հիմա միջին չափի գունդ սարքիր։')
          : p('Por último, haz una bola pequeña para la cabeza.', 'Վերջում փոքր գունդ սարքիր գլխի համար։')
      : phase === 'stack'
        ? stack.length === 0
          ? p('Pon la bola grande abajo.', 'Մեծ գունդը դիր ներքևում։')
          : stack.length === 1
            ? p('Pon la bola mediana encima de la grande.', 'Միջին գունդը դիր մեծի վրա։')
            : p('Pon la bola pequeña arriba del todo.', 'Փոքր գունդը դիր ամենավերևում։')
        : phase === 'deco'
          ? DECOS[Math.min(decos.length, DECOS.length - 1)].instr
          : p('¡Qué muñeco de nieve tan bonito!', 'Ինչ գեղեցիկ ձնեմարդ է։');

  const err = (ph: P) => {
    setMistakes((m) => m + 1);
    markDifficult(instr, true);
    setFb({ ok: false, p: ph, extra: [instr] });
  };

  const onField = (e: RPE<HTMLDivElement>, phase2: 'down' | 'move' | 'up') => {
    if (phase !== 'roll') return;
    const r = fieldRef.current!.getBoundingClientRect();
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (phase2 === 'down') {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      last.current = pt;
      setRolling({ ...pt, size: 22 });
    } else if (phase2 === 'move' && last.current && rolling) {
      const d = Math.hypot(pt.x - last.current.x, pt.y - last.current.y);
      last.current = pt;
      setRolling((rl) => rl && { ...pt, size: Math.min(140, rl.size + d / 9) });
    } else if (phase2 === 'up' && rolling) {
      last.current = null;
      const c = catOf(rolling.size);
      setRolling(null);
      if (!c) return err(p('Esta bola es demasiado pequeña. Sigue rodándola por la nieve.', 'Այս գունդը չափազանց փոքր է։ Շարունակիր գլորել ձյան վրայով։'));
      if (c !== need) {
        const big = ORDER.indexOf(c) < ORDER.indexOf(need);
        return err(
          big
            ? p(`Esta bola es demasiado grande. Necesitamos una bola ${CAT_P[need].es}.`, `Այս գունդը չափազանց մեծ է։ Մեզ ${CAT_P[need].hy} գունդ է պետք։`)
            : p(`Esta bola es demasiado pequeña. Necesitamos una bola ${CAT_P[need].es}.`, `Այս գունդը չափազանց փոքր է։ Մեզ ${CAT_P[need].hy} գունդ է պետք։`),
        );
      }
      sfx.drop();
      const nb = [...balls, { size: rolling.size, cat: c }];
      setBalls(nb);
      setFb({ ok: true, p: p(`¡Una bola ${CAT_P[c].es}!`, `${CAT_P[c].hy.charAt(0).toUpperCase() + CAT_P[c].hy.slice(1)} գունդ։`) });
      if (nb.length === 3) setTimeout(() => setPhase('stack'), 900);
    }
  };

  const manRef = useDropTarget(
    'snowman',
    (pl) => pl.kind === 'sm-ball' || pl.kind === 'sm-deco',
    (pl) => {
      if (pl.kind === 'sm-ball' && phase === 'stack') {
        const i = Number(pl.id);
        if (balls[i].cat !== ORDER[stack.length]) return err(p(`No, primero la bola ${CAT_P[ORDER[stack.length]].es}.`, `Ոչ, նախ ${CAT_P[ORDER[stack.length]].hy} գունդը։`));
        sfx.drop();
        const ns = [...stack, i];
        setStack(ns);
        if (ns.length === 3) setTimeout(() => setPhase('deco'), 600);
      } else if (pl.kind === 'sm-deco' && phase === 'deco') {
        const want = DECOS[decos.length];
        if (!want) return;
        if (pl.id !== want.id) return err(p(`Eso es ${DECOS.find((d) => d.id === pl.id)!.name.es}. Escucha otra vez.`, `Դա ${DECOS.find((d) => d.id === pl.id)!.name.hy} է։ Կրկին լսիր։`));
        sfx.sparkle();
        const nd = [...decos, pl.id];
        setDecos(nd);
        if (nd.length === DECOS.length) setTimeout(() => setPhase('done'), 700);
      }
    },
  );

  const scale = (s: number) => s * 0.9;
  const sizes = stack.map((i) => balls[i].size);
  const total = sizes.reduce((a, b) => a + scale(b) * 0.85, 0);

  return (
    <div className="snowman-game">
      <Instruction p={instr} icon="⛄" key={instr.es} />
      <div className="sm-stage">
        <div className="sm-field" ref={fieldRef} onPointerDown={(e) => onField(e, 'down')} onPointerMove={(e) => onField(e, 'move')} onPointerUp={(e) => onField(e, 'up')} onPointerCancel={(e) => onField(e, 'up')}>
          <Snow n={20} />
          {phase === 'roll' && (
            <>
              <div className="size-meter">
                {ORDER.slice()
                  .reverse()
                  .map((c) => (
                    <span key={c} className={'sm-cat ' + (rolling && catOf(rolling.size) === c ? 'on' : '') + (need === c ? ' need' : '')}>
                      <T p={CAT_P[c]} />
                    </span>
                  ))}
              </div>
              {rolling && <div className="rolling-ball" style={{ left: rolling.x, top: rolling.y, width: rolling.size, height: rolling.size }} />}
            </>
          )}
          {phase !== 'roll' && phase !== 'done' && phase === 'stack' && (
            <div className="balls-row">
              {balls.map((b, i) => (stack.includes(i) ? null : <BallChip key={i} size={b.size} idx={i} />))}
            </div>
          )}
          {phase === 'deco' && (
            <div className="deco-row">
              {DECOS.filter((d) => !decos.includes(d.id)).map((d) => (
                <DecoChip key={d.id} d={d} />
              ))}
            </div>
          )}
        </div>
        <div className="sm-build" ref={manRef}>
          <div className="sm-base-spot">
            {stack.length === 0 && <T p={p('Aquí', 'Այստեղ')} />}
          </div>
          {(() => {
            let bottom = 10;
            return stack.map((i, k) => {
              const s = scale(balls[i].size);
              const el = (
                <div key={i} className="sm-ball pop-in" style={{ width: s, height: s, bottom, zIndex: k + 1 }}>
                  {k === 2 && (
                    <>
                      {decos.includes('carbon') && <span className="sm-eyes">• •</span>}
                      {decos.includes('zanahoria') && <span className="sm-nose">🥕</span>}
                      {decos.includes('gorro') && (
                        <span className="sm-hat">
                          <ClothIcon id="gorro" size={s * 0.9} />
                        </span>
                      )}
                      {decos.includes('bufanda') && (
                        <span className="sm-scarf">
                          <ClothIcon id="bufanda" size={s * 0.8} />
                        </span>
                      )}
                    </>
                  )}
                  {k === 1 && decos.includes('ramas') && (
                    <>
                      <span className="sm-arm l">🪵</span>
                      <span className="sm-arm r">🪵</span>
                    </>
                  )}
                  {k === 1 && <span className="sm-buttons">• • •</span>}
                </div>
              );
              bottom += s * 0.82;
              return el;
            });
          })()}
          <div style={{ height: total }} />
        </div>
      </div>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {phase === 'done' && <Reward id="snow:snowman" stars={starsFor(mistakes)} message={p('¡Qué muñeco de nieve tan bonito! Le voy a sacar una foto.', 'Ինչ գեղեցիկ ձնեմարդ է։ Լուսանկարեմ նրան։')} onNext={onDone} nextLabel={p('Volver a la calle', 'Վերադառնալ փողոց')} />}
    </div>
  );
}

/* ================================================================= */
/* Snowballs                                                           */
/* ================================================================= */
type Obj = 'lata' | 'gorro' | 'pelota';
type Col = 'rojo' | 'azul' | 'verde' | 'amarillo';
const COL_HEX: Record<Col, string> = { rojo: '#e53950', azul: '#3f7be0', verde: '#3ba56b', amarillo: '#f3c03d' };
const OBJ_P: Record<Obj, { es: string; hy: string; fem: boolean }> = {
  lata: { es: 'latas', hy: 'տուփերին', fem: true },
  gorro: { es: 'gorros', hy: 'գլխարկներին', fem: false },
  pelota: { es: 'pelotas', hy: 'գնդակներին', fem: true },
};
const COL_P: Record<Col, { m: string; f: string; hy: string }> = {
  rojo: { m: 'rojos', f: 'rojas', hy: 'կարմիր' },
  azul: { m: 'azules', f: 'azules', hy: 'կապույտ' },
  verde: { m: 'verdes', f: 'verdes', hy: 'կանաչ' },
  amarillo: { m: 'amarillos', f: 'amarillas', hy: 'դեղին' },
};
const targetP = (o: Obj, c: Col): P => {
  const op = OBJ_P[o];
  return p(`Lanza bolas de nieve a ${op.fem ? 'las' : 'los'} ${op.es} ${op.fem ? COL_P[c].f : COL_P[c].m}.`, `Ձնագնդիներ նետիր ${COL_P[c].hy} ${op.hy}։`);
};

function TargetArt({ o, c }: { o: Obj; c: Col }) {
  const f = COL_HEX[c];
  if (o === 'lata')
    return (
      <svg viewBox="0 0 40 50" width="48">
        <rect x="6" y="6" width="28" height="40" rx="4" fill={f} />
        <ellipse cx="20" cy="6" rx="14" ry="4" fill="#ddd" />
        <rect x="6" y="18" width="28" height="10" fill="rgba(255,255,255,.5)" />
      </svg>
    );
  if (o === 'gorro')
    return (
      <svg viewBox="0 0 40 40" width="50">
        <path d="M4 30 Q6 6 20 6 Q34 6 36 30 Z" fill={f} />
        <rect x="2" y="27" width="36" height="9" rx="4" fill="#fff" />
        <circle cx="20" cy="6" r="5" fill="#fff" />
      </svg>
    );
  return (
    <svg viewBox="0 0 40 40" width="46">
      <circle cx="20" cy="20" r="17" fill={f} />
      <path d="M3 20 H37 M20 3 V37" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

function Snowballs({ onDone }: { onDone: () => void }) {
  const level = useGame((s) => s.level);
  const rounds = useMemo(() => {
    const objs: Obj[] = ['lata', 'gorro', 'pelota'];
    const cols: Col[] = ['rojo', 'azul', 'verde', 'amarillo'];
    return shuffle(objs).map((o) => ({ o, c: pick(cols) }));
  }, []);
  const [ri, setRi] = useState(0);
  const [slots, setSlots] = useState<({ o: Obj; c: Col; id: number } | null)[]>(Array(6).fill(null));
  const [hits, setHits] = useState(0);
  const [miss, setMiss] = useState(0);
  const [throwAt, setThrowAt] = useState<{ i: number; n: number } | null>(null);
  const [fb, setFb] = useState<Fb | null>(null);
  const [done, setDone] = useState(false);
  const r = rounds[ri];
  const NEED = 5;
  const speed = 1500 - levelIndex(level) * 200;

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setSlots((s) =>
        s.map(() => {
          if (Math.random() < 0.35) return null;
          const wantIt = Math.random() < 0.4;
          const o: Obj = wantIt ? r.o : pick(['lata', 'gorro', 'pelota'] as Obj[]);
          const c: Col = wantIt ? r.c : pick(['rojo', 'azul', 'verde', 'amarillo'] as Col[]);
          return { o, c, id: Math.random() };
        }),
      );
    }, speed);
    return () => window.clearInterval(id);
  }, [ri, done]);

  const hit = (i: number) => {
    const t = slots[i];
    if (!t) return;
    setThrowAt({ i, n: Date.now() });
    sfx.whoosh();
    setTimeout(() => {
      setSlots((s) => s.map((x, k) => (k === i ? null : x)));
      if (t.o === r.o && t.c === r.c) {
        sfx.pop();
        const nh = hits + 1;
        setHits(nh);
        if (nh >= NEED) {
          if (ri + 1 >= rounds.length) setDone(true);
          else {
            setFb({ ok: true, p: p('¡Genial! Siguiente ronda.', 'Հիանալի է։ Հաջորդ փուլը։') });
            setRi(ri + 1);
            setHits(0);
          }
        }
      } else {
        setMiss((m) => m + 1);
        markDifficult(targetP(r.o, r.c), true);
        setFb({ ok: false, p: p('¡Esa no! Escucha bien.', 'Այդ մեկը չէ։ Ուշադիր լսիր։'), extra: [targetP(r.o, r.c)] });
      }
    }, 350);
  };

  return (
    <div className="balls-game">
      <Steps total={rounds.length} cur={ri} />
      <Instruction p={targetP(r.o, r.c)} icon="❄️" key={ri} />
      <div className="balls-field">
        <Snow n={15} />
        <div className="fence" />
        {slots.map((t, i) => (
          <button key={i} className={'bslot s' + i} onClick={() => hit(i)} aria-label="objetivo">
            {t && (
              <span className="btarget pop-in" key={t.id}>
                <TargetArt o={t.o} c={t.c} />
              </span>
            )}
            {throwAt?.i === i && <span className="snowball-fly" key={throwAt.n} />}
          </button>
        ))}
        <div className="score-box">
          🎯 {hits}/{NEED} · ✕ {miss}
        </div>
      </div>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {done && <Reward id="snow:balls" stars={starsFor(miss)} message={p('¡Qué puntería tienes!', 'Ինչ դիպուկ ես։')} onNext={onDone} nextLabel={p('Volver a la calle', 'Վերադառնալ փողոց')} />}
    </div>
  );
}

/* ================================================================= */
/* Photos                                                              */
/* ================================================================= */
const PHOTO_OBJS: { id: string; e: string; x: number; y: number; s: number; name: P }[] = [
  { id: 'arbol', e: '🌲', x: 18, y: 30, s: 5.5, name: p('el árbol', 'ծառը') },
  { id: 'pajaro', e: '🐦', x: 18, y: 8, s: 2, name: p('el pájaro', 'թռչունը') },
  { id: 'ardilla', e: '🐿️', x: 29, y: 50, s: 2, name: p('la ardilla', 'սկյուռը') },
  { id: 'patinadora', e: '⛸️', x: 46, y: 58, s: 2.4, name: p('la patinadora', 'չմշկորդուհին') },
  { id: 'muneco', e: '⛄', x: 64, y: 40, s: 3.2, name: p('el muñeco de nieve', 'ձնեմարդը') },
  { id: 'banco', e: '🪑', x: 80, y: 66, s: 3.2, name: p('el banco', 'նստարանը') },
  { id: 'gato', e: '🐈', x: 80, y: 82, s: 1.8, name: p('el gato', 'կատուն') },
  { id: 'perro', e: '🐕', x: 30, y: 80, s: 2.6, name: p('el perro', 'շունը') },
  { id: 'pelota', e: '⚽', x: 40, y: 84, s: 1.6, name: p('la pelota', 'գնդակը') },
  { id: 'nino', e: '🛷', x: 88, y: 32, s: 2.6, name: p('el niño del trineo', 'սահնակով տղան') },
];

const PHOTO_REQ: { level: Level; id: string; p: P }[] = [
  { level: 'A1', id: 'muneco', p: p('Saca una foto del muñeco de nieve.', 'Լուսանկարիր ձնեմարդուն։') },
  { level: 'A1', id: 'perro', p: p('Saca una foto del perro.', 'Լուսանկարիր շանը։') },
  { level: 'A1', id: 'pajaro', p: p('Saca una foto del pájaro.', 'Լուսանկարիր թռչունին։') },
  { level: 'A2', id: 'gato', p: p('Saca una foto del gato que está debajo del banco.', 'Լուսանկարիր կատվին, որը նստարանի տակ է։') },
  { level: 'A2', id: 'ardilla', p: p('Ahora, la ardilla que está al lado del árbol.', 'Հիմա՝ սկյուռին, որը ծառի կողքին է։') },
  { level: 'B1', id: 'nino', p: p('Fotografía al niño que baja la colina en trineo.', 'Լուսանկարիր տղային, որը սահնակով իջնում է բլրից։') },
  { level: 'B1', id: 'patinadora', p: p('Me gustaría una foto de la chica que patina sobre el lago helado.', 'Կուզեի լուսանկարել աղջկան, որը չմշկում է սառած լճի վրա։') },
  { level: 'B2', id: 'perro', p: p('Saca una foto del animal que está persiguiendo la pelota.', 'Լուսանկարիր կենդանուն, որը հետապնդում է գնդակը։') },
  { level: 'B2', id: 'pajaro', p: p('Y ahora, al que se ha posado en lo más alto del árbol.', 'Իսկ հիմա՝ նրան, ով նստել է ծառի ամենաբարձր կետին։') },
];

function Photos({ onDone }: { onDone: () => void }) {
  const level = useGame((s) => s.level);
  const reqs = useMemo(() => {
    const ok = PHOTO_REQ.filter((r) => levelOk(r.level, level));
    return ok.slice(-4);
  }, [level]);
  const [i, setI] = useState(0);
  const [album, setAlbum] = useState<string[]>([]);
  const [flash, setFlash] = useState(0);
  const [fb, setFb] = useState<Fb | null>(null);
  const [miss, setMiss] = useState(0);
  const [done, setDone] = useState(false);
  const req = reqs[i];

  const shoot = (id: string) => {
    if (done) return;
    sfx.shutter();
    setFlash(Date.now());
    const o = PHOTO_OBJS.find((x) => x.id === id)!;
    if (id === req.id) {
      setAlbum((a) => [...a, o.e]);
      setFb({ ok: true, p: p('¡Qué foto tan bonita!', 'Ինչ գեղեցիկ լուսանկար է։') });
      if (i + 1 >= reqs.length) setTimeout(() => setDone(true), 900);
      else setI(i + 1);
    } else {
      setMiss((m) => m + 1);
      markDifficult(req.p, true);
      setFb({ ok: false, p: p(`Esa es una foto de ${o.name.es}.`, `Դա ${o.name.hy} լուսանկարն է։`), extra: [req.p] });
    }
  };

  return (
    <div className="photo-game">
      <Steps total={reqs.length} cur={i} />
      <Instruction p={req.p} icon="📷" key={i} />
      <div className="photo-scene">
        <div className="hill" />
        <div className="lake" />
        {PHOTO_OBJS.map((o) => (
          <button key={o.id} className="pobj" style={{ left: o.x + '%', top: o.y + '%', fontSize: o.s + 'rem' }} onClick={() => shoot(o.id)} aria-label={o.name.es}>
            {o.e}
          </button>
        ))}
        {flash > 0 && <div className="flash" key={flash} />}
        <div className="viewfinder" />
      </div>
      <div className="album">
        <T p={p('Mi álbum:', 'Իմ ալբոմը՝')} />
        {album.map((a, k) => (
          <span key={k} className="polaroid pop-in">
            {a}
          </span>
        ))}
      </div>
      <Feedback fb={fb} onClose={() => setFb(null)} />
      {done && <Reward id="snow:photos" stars={starsFor(miss)} message={p('¡Tienes unas fotos preciosas del parque!', 'Այգու հրաշալի լուսանկարներ ունես։')} onNext={onDone} nextLabel={p('Volver a la calle', 'Վերադառնալ փողոց')} />}
    </div>
  );
}

/* ================================================================= */
/* Kiosk & friend dialogues                                            */
/* ================================================================= */
const KIOSK: Script = {
  start: {
    who: 'v',
    line: p('¡Buenas tardes! ¿Qué te pongo?', 'Բարի օր։ Ի՞նչ տամ քեզ։'),
    options: [
      { text: p('Un chocolate caliente, por favor.', 'Մեկ տաք շոկոլադ, խնդրում եմ։'), next: 'size', points: 1 },
      { text: p('Quiero un té con limón, por favor.', 'Կիտրոնով թեյ եմ ուզում, խնդրում եմ։'), next: 'size', points: 1 },
      { text: p('Un helado de fresa.', 'Ելակի պաղպաղակ։'), next: 'helado', points: 0 },
    ],
  },
  helado: {
    who: 'v',
    line: p('¿Un helado con este frío? Lo siento, en invierno solo tenemos bebidas calientes.', 'Պաղպաղա՞կ այս ցրտին։ Ներողություն, ձմռանը միայն տաք ըմպելիքներ ունենք։'),
    options: [
      { text: p('Entonces, un chocolate caliente.', 'Այդ դեպքում՝ տաք շոկոլադ։'), next: 'size', points: 1 },
      { text: p('Vale, un café con leche.', 'Լավ, մեկ կաթով սուրճ։'), next: 'size', points: 1 },
    ],
  },
  size: {
    who: 'v',
    line: p('Muy bien. ¿Grande o pequeño?', 'Շատ լավ։ Մեծ, թե՞ փոքր։'),
    options: [
      { text: p('Grande, por favor. ¡Hace mucho frío!', 'Մեծ, խնդրում եմ։ Շատ ցուրտ է։'), next: 'price', points: 1 },
      { text: p('Pequeño, gracias.', 'Փոքր, շնորհակալություն։'), next: 'price', points: 1 },
      { text: p('Sí.', 'Այո։'), next: 'size2', points: -1, reply: p('Perdona, no te entiendo. ¿Grande o pequeño?', 'Ներողություն, չեմ հասկանում։ Մեծ, թե՞ փոքր։') },
    ],
  },
  size2: {
    who: 'v',
    line: p('¿Lo quieres grande o pequeño?', 'Մեծ ես ուզում, թե՞ փոքր։'),
    options: [
      { text: p('Grande, por favor.', 'Մեծ, խնդրում եմ։'), next: 'price', points: 1 },
      { text: p('Pequeño.', 'Փոքր։'), next: 'price', points: 1 },
    ],
  },
  price: {
    who: 'v',
    line: p('Aquí tienes. Son dos euros con cincuenta.', 'Խնդրեմ։ Երկու եվրո հիսուն ցենտ է։'),
    options: [
      { text: p('Aquí tiene: dos euros y cincuenta céntimos.', 'Խնդրեմ՝ երկու եվրո և հիսուն ցենտ։'), next: 'bye', points: 1 },
      { text: p('Aquí tiene: doce euros.', 'Խնդրեմ՝ տասներկու եվրո։'), next: 'bye', points: -1, reply: p('Uy, es demasiado. Son solo dos con cincuenta. Toma el cambio.', 'Ույ, շատ է։ Ընդամենը երկու հիսուն է։ Վերցրու մանրը։') },
      { text: p('¿Puedo pagar con tarjeta?', 'Կարո՞ղ եմ քարտով վճարել։'), next: 'bye', points: 1, reply: p('¡Claro que sí!', 'Իհարկե։') },
    ],
  },
  bye: {
    who: 'v',
    line: p('¡Gracias! ¡Que lo disfrutes y que tengas un buen día!', 'Շնորհակալություն։ Վայելիր և լավ օր անցկացրու։'),
    options: [{ text: p('¡Igualmente, adiós!', 'Նմանապես, ցտեսություն։'), next: 'end', points: 1 }],
  },
  end: { who: 'v', line: p('¡Hasta luego!', 'Առայժմ։'), end: true },
};

const FRIEND: Script = {
  start: {
    who: 'l',
    line: p('¡Gayane! ¡Qué sorpresa verte aquí! ¿Qué tal estás?', 'Գայանե։ Ինչ անակնկալ է քեզ այստեղ տեսնել։ Ինչպե՞ս ես։'),
    options: [
      { text: p('¡Hola, Lucía! Muy bien, ¿y tú?', 'Բարև, Լուսիա։ Շատ լավ, իսկ դու՞։'), next: 'bien', points: 1 },
      { text: p('Un poco cansada, pero contenta.', 'Մի քիչ հոգնած, բայց ուրախ։'), next: 'cansada', points: 1 },
      { text: p('Tengo veinte años.', 'Քսան տարեկան եմ։'), next: 'confusa', points: -1 },
    ],
  },
  confusa: {
    who: 'l',
    line: p('Jaja, ya lo sé. Te pregunto cómo estás.', 'Հա-հա, գիտեմ։ Հարցնում եմ՝ ինչպես ես։'),
    options: [{ text: p('¡Ah, perdona! Estoy muy bien, gracias.', 'Ա՜խ, ներիր։ Շատ լավ եմ, շնորհակալություն։'), next: 'bien', points: 1 }],
  },
  cansada: {
    who: 'l',
    line: p('Normal, con este frío cuesta levantarse. ¿Qué haces por aquí?', 'Բնական է, այս ցրտին դժվար է վեր կենալ։ Ի՞նչ ես անում այստեղ։'),
    next: 'plan',
  },
  bien: {
    who: 'l',
    line: p('¡Yo también! Me encanta la nieve. ¿Qué haces por aquí?', 'Ես էլ։ Ձյունը շատ եմ սիրում։ Ի՞նչ ես անում այստեղ։'),
    next: 'plan',
  },
  plan: {
    who: 'l',
    line: p('¿Paseas sola?', 'Մենա՞կ ես զբոսնում։'),
    options: [
      { text: p('Sí, estoy dando un paseo por el parque.', 'Այո, զբոսնում եմ այգում։'), next: 'invite', points: 1 },
      { text: p('Quería hacer un muñeco de nieve.', 'Ուզում էի ձնեմարդ սարքել։'), next: 'invite', points: 1 },
      { text: p('No me gusta el parque.', 'Այգին չեմ սիրում։'), next: 'sad', points: -1 },
    ],
  },
  sad: {
    who: 'l',
    line: p('¿No? ¡Pero hoy está precioso, todo blanco!', 'Չե՞ս սիրում։ Բայց այսօր հրաշալի է, ամեն ինչ սպիտակ է։'),
    options: [{ text: p('Tienes razón, hoy está muy bonito.', 'Ճիշտ ես, այսօր շատ գեղեցիկ է։'), next: 'invite', points: 1 }],
  },
  invite: {
    who: 'l',
    line: p('Oye, ¿quieres tomar un chocolate caliente conmigo en el quiosco?', 'Լսիր, ուզո՞ւմ ես ինձ հետ տաք շոկոլադ խմել կրպակում։'),
    options: [
      { text: p('¡Me encantaría! Vamos juntas.', 'Շատ կուզեի։ Գնանք միասին։'), next: 'yes', points: 1 },
      { text: p('Hoy no puedo, pero ¿quedamos mañana?', 'Այսօր չեմ կարող, բայց վաղը հանդիպե՞նք։'), next: 'tomorrow', points: 1 },
      { text: p('No, gracias.', 'Ոչ, շնորհակալություն։'), next: 'tomorrow', points: 0, reply: p('Vale, no pasa nada.', 'Լավ, ոչինչ։') },
    ],
  },
  yes: { who: 'l', line: p('¡Genial! Yo invito. ¡Vamos!', 'Հիանալի է։ Ես եմ հյուրասիրում։ Գնացինք։'), end: true },
  tomorrow: { who: 'l', line: p('¡Perfecto! Te escribo mañana por la mañana. ¡Abrígate bien!', 'Կատարյալ է։ Վաղն առավոտյան կգրեմ քեզ։ Լավ տաք հագնվիր։'), end: true },
};

function DialogueAct({ id, script, speakers, onDone, final }: { id: string; script: Script; speakers: Record<string, { name: string; avatar: string; color: string }>; onDone: () => void; final: P }) {
  const [res, setRes] = useState<number | null>(null);
  return (
    <>
      <Dialogue script={script} speakers={speakers} onEnd={(pts) => setRes(pts)} />
      {res !== null && <Reward id={id} stars={res >= 4 ? 3 : res >= 2 ? 2 : 1} message={final} onNext={onDone} nextLabel={p('Volver a la calle', 'Վերադառնալ փողոց')} />}
    </>
  );
}

function Kiosk({ onDone }: { onDone: () => void }) {
  return <DialogueAct id="snow:kiosk" script={KIOSK} speakers={{ v: { name: 'Don Pedro', avatar: '👨🏻‍🍳', color: '#f6e8d8' } }} onDone={onDone} final={p('¡Mmm! Una bebida caliente en un día de nieve.', 'Մմմ։ Տաք ըմպելիք ձյունառատ օրը։')} />;
}
function Friend({ onDone }: { onDone: () => void }) {
  return <DialogueAct id="snow:friend" script={FRIEND} speakers={{ l: { name: 'Lucía', avatar: '👩🏽‍🦱', color: '#dccdf0' } }} onDone={onDone} final={p('¡Qué bien hablar con Lucía!', 'Ինչ լավ էր զրուցել Լուսիայի հետ։')} />;
}
