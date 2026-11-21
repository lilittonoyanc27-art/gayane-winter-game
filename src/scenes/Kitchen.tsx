import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE } from 'react';
import { Gayane } from '../components/Gayane';
import { Snow } from '../components/Snow';
import { Btn, Feedback, Instruction, Reward, SceneHeader, Steps, type Fb } from '../components/UI';
import { CONTAINER_NAMES, INGS, RECIPES, emptyC, type CState, type Container, type KState, type Recipe } from '../data/recipes';
import { useDraggable, useDropTarget, type Payload } from '../core/dnd';
import { T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { markDifficult, useGame } from '../core/store';
import { levelOk, p, type P } from '../core/types';
import { numEs, numHy } from '../core/util';

/* ------------------------------------------------------------ */
/* Ingredient chip                                                */
/* ------------------------------------------------------------ */
function IngChip({ id, onTap, dim }: { id: string; onTap?: () => void; dim?: boolean }) {
  const ing = INGS[id];
  const down = useDraggable({ kind: 'ing', id }, { ghost: <div className="ing-ghost">{ing.icon}</div>, onTap, onStart: () => speak(ing.name) });
  return (
    <div className={'ing ' + (dim ? 'dim' : '')}>
      <div className="ing-icon drag-src" onPointerDown={down} role="button" aria-label={ing.name.es}>
        {ing.icon}
      </div>
      <T p={ing.name} className="ing-name" />
    </div>
  );
}

/* ------------------------------------------------------------ */
/* Containers                                                     */
/* ------------------------------------------------------------ */

function ContainerView({
  c,
  st,
  all,
  anim,
  stirMode,
  stirPos,
  onStirEvent,
  onTap,
  onDrop,
}: {
  c: Container;
  st: CState;
  all: KState;
  anim: { kind: 'pour' | 'drop'; color?: string; icon?: string; n: number } | null;
  stirMode: boolean;
  stirPos: { x: number; y: number } | null;
  onStirEvent: (e: RPE<HTMLDivElement>, phase: 'down' | 'move' | 'up') => void;
  onTap: () => void;
  onDrop: (pl: Payload) => void;
}) {
  const ref = useDropTarget('k-' + c.id, (pl) => pl.kind === 'ing' || (pl.kind === 'cont' && pl.id !== c.id), (pl) => onDrop(pl));
  const down = useDraggable({ kind: 'cont', id: c.id }, { onTap, disabled: !c.draggable || stirMode, onStart: () => speak(CONTAINER_NAMES[c.kind]) });
  const steam = st.hot && (st.fill > 0 || c.kind === 'tetera' || st.bits.length > 0);
  const inside = st.inside ? all[st.inside] : null;

  const liquid = (
    <div className="liquid" style={{ height: st.fill * 100 + '%', background: st.color }}>
      <div className={'bits ' + (stirMode || st.swirl ? 'swirl' : '')}>
        {st.bits.map((b, i) => (
          <span key={i} style={{ animationDelay: i * 0.3 + 's' }}>
            {b}
          </span>
        ))}
      </div>
    </div>
  );

  let body: JSX.Element;
  switch (c.kind) {
    case 'olla':
    case 'taza':
    case 'bol':
    case 'tetera':
      body = (
        <div className={`vessel v-${c.kind}`}>
          <div className="v-inner">{c.kind === 'tetera' ? <div className="liquid" style={{ height: st.fill * 100 + '%', background: st.color }} /> : liquid}</div>
          {c.kind === 'tetera' && <div className="spout" />}
          <div className="tops">
            {st.top.map((t, i) => (
              <span key={i} className="pop-in">
                {t}
              </span>
            ))}
          </div>
        </div>
      );
      break;
    case 'plato':
    case 'bandeja':
    case 'molde':
      body = (
        <div className={`vessel v-${c.kind} ${st.baked ? 'baked' : ''}`}>
          <div className="flat-bits">
            {c.kind === 'molde' && st.bits.length === 0 && Array.from({ length: 6 }, (_, i) => <span key={i} className="cup-empty" />)}
            {st.bits.map((b, i) => (
              <span key={i} className={'pop-in ' + (c.kind === 'molde' ? 'in-cup' : '')}>
                {b}
              </span>
            ))}
          </div>
          <div className="tops flat">
            {st.top.map((t, i) => (
              <span key={i} className="pop-in">
                {t}
              </span>
            ))}
          </div>
        </div>
      );
      break;
    case 'tostadora':
      body = (
        <div className={`vessel v-tostadora ${st.on ? 'on' : ''}`}>
          <div className="toast-slots">
            {st.bits.map((b, i) => (
              <span key={i} className={'toast ' + (st.on ? 'down' : '') + (st.hot ? ' toasted' : '')}>
                {b}
              </span>
            ))}
          </div>
          <div className="toaster-body">
            <span className="toaster-lever" />
          </div>
        </div>
      );
      break;
    case 'horno':
      body = (
        <div className={`vessel v-horno ${st.on ? 'on' : ''}`}>
          <div className="oven-knobs">
            <i />
            <i />
            <span className="oven-temp">{st.on ? '180°' : '—'}</span>
          </div>
          <div className="oven-window">
            {inside && (
              <div className={'oven-tray ' + (inside.baked ? 'baked' : '')}>
                {inside.bits.map((b, i) => (
                  <span key={i}>{b}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
      break;
  }

  return (
    <div
      className={`kcont kc-${c.kind} ${stirMode ? 'stir-mode' : ''}`}
      ref={ref}
      data-action="1"
    >
      {steam && (
        <div className="steam">
          <i />
          <i />
          <i />
        </div>
      )}
      {anim?.kind === 'pour' && <div className="pour-stream" key={anim.n} style={{ background: anim.color }} />}
      {anim?.kind === 'drop' && (
        <div className="drop-fall" key={anim.n}>
          {anim.icon}
        </div>
      )}
      <div
        className={'kc-main ' + (c.draggable ? 'drag-src' : '')}
        onPointerDown={(e) => (stirMode ? onStirEvent(e, 'down') : c.draggable ? down(e) : undefined)}
        onPointerMove={(e) => stirMode && onStirEvent(e, 'move')}
        onPointerUp={(e) => stirMode && onStirEvent(e, 'up')}
        onPointerCancel={(e) => stirMode && onStirEvent(e, 'up')}
        onClick={() => !stirMode && !c.draggable && onTap()}
        style={stirMode ? { touchAction: 'none' } : undefined}
      >
        {body}
        {stirMode && stirPos && (
          <span className="spoon" style={{ left: stirPos.x, top: stirPos.y }}>
            🥄
          </span>
        )}
      </div>
      {c.stove && (
        <button className={'stove ' + (st.on ? 'on' : '')} onClick={onTap} aria-label="fuego">
          <span className="flames">{st.on ? '🔥🔥🔥' : ''}</span>
          <span className="knob" />
        </button>
      )}
      <div className="kc-label">
        <T p={CONTAINER_NAMES[c.kind]} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ */
/* Recipe game                                                    */
/* ------------------------------------------------------------ */
function Cooking({ recipe, onExit, onNext }: { recipe: Recipe; onExit: () => void; onNext: () => void }) {
  const init = (): KState => Object.fromEntries(recipe.containers.map((c) => [c.id, emptyC()]));
  const [st, setSt] = useState<KState>(init);
  const [si, setSi] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [cnt, setCnt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<Fb | null>(null);
  const [bubble, setBubble] = useState<P | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const [anim, setAnim] = useState<Record<string, { kind: 'pour' | 'drop'; color?: string; icon?: string; n: number } | null>>({});
  const [stir, setStir] = useState(0);
  const [stirPos, setStirPos] = useState<{ x: number; y: number } | null>(null);
  const stirRef = useRef<{ active: boolean; last: { x: number; y: number } | null }>({ active: false, last: null });
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const step = recipe.steps[si];
  const counterRef = useDropTarget('k-counter', (pl) => pl.kind === 'ing', (pl) => onPick(pl.id));

  const wrong = (ph: P, extra?: P[]) => {
    setMistakes((m) => m + 1);
    markDifficult(step.instr, true);
    setFb({ ok: false, p: ph, extra });
  };

  const complete = () => {
    setBusy(true);
    setFb(null);
    setBubble(step.done);
    sfx.success();
    speak(step.done);
    later(() => {
      setCnt(0);
      setStir(0);
      setBusy(false);
      if (si + 1 >= recipe.steps.length) {
        setFinished(true);
      } else setSi(si + 1);
    }, 1700);
  };

  const onPick = (id: string) => {
    if (busy || step.type !== 'pick') return;
    if (picked.includes(id)) return;
    if (step.ids!.includes(id)) {
      sfx.drop();
      speak(INGS[id].name);
      const np = [...picked, id];
      setPicked(np);
      if (step.ids!.every((x) => np.includes(x))) complete();
    } else {
      wrong(p(`No necesitamos ${INGS[id].name.es} para esta receta.`, `Այս բաղադրատոմսի համար ${INGS[id].name.hy} պետք չէ։`));
    }
  };

  const nameOf = (id: string): P => INGS[id]?.name || CONTAINER_NAMES[recipe.containers.find((c) => c.id === id)!.kind];

  const onDrop = (target: string, pl: Payload) => {
    if (busy) return;
    if (step.type === 'pick') {
      return wrong(p('Primero elige los ingredientes.', 'Նախ ընտրիր բաղադրիչները։'));
    }
    if (step.type !== 'drop') {
      return wrong(p('Ahora no. Escucha la instrucción otra vez.', 'Հիմա ոչ։ Կրկին լսիր հրահանգը։'), [step.instr]);
    }
    const items = Array.isArray(step.item) ? step.item : [step.item!];
    if (!items.includes(pl.id)) {
      return wrong(p(`Ahora no necesitas ${nameOf(pl.id).es}. Escucha bien.`, `Հիմա քեզ ${nameOf(pl.id).hy} պետք չէ։ Ուշադիր լսիր։`), [step.instr]);
    }
    if (target !== step.target) {
      const tn = CONTAINER_NAMES[recipe.containers.find((c) => c.id === step.target)!.kind];
      return wrong(p(`Casi. Ponlo en ${tn.es}.`, `Գրեթե։ Դիր ${tn.hy}ի մեջ։`));
    }
    // animation
    const ing = INGS[pl.id];
    const isLiquid = ing?.liquid || pl.kind === 'cont';
    const color = ing?.liquid ? (pl.id === 'agua' ? '#bfe3f7' : pl.id === 'aceite' ? '#e8d36b' : '#fbf8f2') : st[pl.id]?.color;
    setAnim((a) => ({ ...a, [target]: { kind: isLiquid ? 'pour' : 'drop', color, icon: ing?.icon, n: Date.now() } }));
    isLiquid ? sfx.pour() : sfx.drop();
    later(() => setAnim((a) => ({ ...a, [target]: null })), 1100);
    later(() => setSt((s) => (step.fx ? step.fx(s, pl.id) : s)), isLiquid ? 500 : 350);
    if (step.count) {
      setCnt((c) => c + 1);
    } else {
      later(complete, isLiquid ? 900 : 500);
    }
  };

  const confirmCount = () => {
    if (!step.count) return;
    if (cnt === step.count) return complete();
    if (cnt > step.count) {
      wrong(
        p(`¡Has puesto ${numEs(cnt, true)}! Necesitamos ${numEs(step.count, true)}. Vuelve a intentarlo.`, `Դու դրել ես ${numHy(cnt)}։ Մեզ պետք է ${numHy(step.count)}։ Կրկին փորձիր։`),
        [step.instr],
      );
      setCnt(0);
    } else {
      wrong(p(`Solo has puesto ${numEs(cnt, true)}. Falta un poco.`, `Դու դրել ես միայն ${numHy(cnt)}։ Մի քիչ պակասում է։`), [step.instr]);
    }
  };

  const onTap = (id: string) => {
    if (busy) return;
    const c = recipe.containers.find((x) => x.id === id)!;
    const appliance = c.stove || c.kind === 'horno' || c.kind === 'tostadora';
    if (step.type === 'tap' && step.target === id) {
      sfx.click();
      if (step.wait) {
        setBusy(true);
        setSt((s) => ({ ...s, [id]: { ...s[id], on: true } }));
        sfx.sizzle();
        later(() => {
          setSt((s) => {
            const n = step.fx ? step.fx(s) : s;
            return { ...n, [id]: { ...n[id], hot: true } };
          });
          setBusy(false);
          complete();
        }, step.wait);
      } else {
        setSt((s) => (step.fx ? step.fx(s) : s));
        complete();
      }
    } else if (appliance && step.type !== 'stir') {
      wrong(p('Todavía no hace falta encenderlo.', 'Դեռ պետք չէ այն միացնել։'), [step.instr]);
    }
  };

  const STIR_NEED = 1100;
  const onStirEvent = (e: RPE<HTMLDivElement>, phase: 'down' | 'move' | 'up') => {
    const r = e.currentTarget.getBoundingClientRect();
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (phase === 'down') {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      stirRef.current = { active: true, last: pt };
      setStirPos(pt);
      setSt((s) => ({ ...s, [step.target!]: { ...s[step.target!], swirl: true } }));
    } else if (phase === 'move' && stirRef.current.active) {
      const l = stirRef.current.last!;
      const d = Math.hypot(pt.x - l.x, pt.y - l.y);
      stirRef.current.last = pt;
      setStirPos(pt);
      setStir((v) => {
        const nv = v + d;
        if (nv >= STIR_NEED && v < STIR_NEED) {
          stirRef.current.active = false;
          later(() => {
            setSt((s) => (step.fx ? step.fx(s) : s));
            setStirPos(null);
            complete();
          }, 50);
        }
        return nv;
      });
    } else if (phase === 'up') {
      stirRef.current.active = false;
      setStirPos(null);
    }
  };

  const onCounter = step.type === 'pick' ? picked : recipe.steps[0].ids || [];

  return (
    <>
      <Steps total={recipe.steps.length} cur={finished ? recipe.steps.length : si} />
      <Instruction p={step.instr} icon={recipe.icon} who={p(`Paso ${si + 1}`, `Քայլ ${si + 1}`)} key={si} />

      <div className="kitchen-stage">
        <div className="k-wall">
          <div className="k-window">
            <Snow n={18} />
          </div>
          <div className="k-lights">
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} style={{ animationDelay: i * 0.2 + 's' }} />
            ))}
          </div>
          <div className="k-girl">
            {bubble && (
              <div className="speech-bubble pop-in" key={bubble.es}>
                <T p={bubble} />
              </div>
            )}
            <Gayane wear={['jersey', 'pantalones', 'calcetines']} mood={fb && !fb.ok ? 'think' : 'happy'} />
          </div>
        </div>

        {step.type === 'pick' && (
          <div className="shelf">
            <div className="shelf-title">
              <T p={p('La despensa — toca o arrastra los ingredientes a la encimera', 'Մառան — հպիր կամ քաշիր բաղադրիչները սեղանին')} />
            </div>
            <div className="shelf-row">
              {recipe.shelf
                .filter((x) => !picked.includes(x))
                .map((id) => (
                  <IngChip key={id} id={id} onTap={() => onPick(id)} />
                ))}
            </div>
          </div>
        )}

        <div className="counter" ref={counterRef}>
          <div className="counter-ings">
            {onCounter.length === 0 && <T p={p('La encimera está vacía.', 'Սեղանը դատարկ է։')} className="muted" />}
            {onCounter.map((id) => (
              <IngChip key={id} id={id} />
            ))}
          </div>
          <div className="counter-conts">
            {recipe.containers.map((c) => (
              <ContainerView
                key={c.id}
                c={c}
                st={st[c.id]}
                all={st}
                anim={anim[c.id] || null}
                stirMode={step.type === 'stir' && step.target === c.id && !busy}
                stirPos={step.type === 'stir' && step.target === c.id ? stirPos : null}
                onStirEvent={onStirEvent}
                onTap={() => onTap(c.id)}
                onDrop={(pl) => onDrop(c.id, pl)}
              />
            ))}
          </div>
        </div>

        <div className="k-controls">
          {step.type === 'stir' && (
            <div className="stir-bar">
              <T p={p('Mueve el dedo en círculos dentro del recipiente', 'Մատդ շրջանաձև շարժիր ամանի մեջ')} />
              <div className="bar">
                <i style={{ width: Math.min(100, (stir / STIR_NEED) * 100) + '%' }} />
              </div>
            </div>
          )}
          {step.count && (
            <div className="count-box">
              <span className="count-n">× {cnt}</span>
              <Btn label={p('¡Listo!', 'Պատրաստ է։')} icon="✓" onClick={confirmCount} disabled={busy} />
            </div>
          )}
        </div>
      </div>

      <Feedback fb={fb} onClose={() => setFb(null)} />
      {finished && (
        <Reward
          id={'kitchen:' + recipe.id}
          stars={mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1}
          message={recipe.final}
          onAgain={() => {
            setSt(init());
            setSi(0);
            setPicked([]);
            setFinished(false);
            setMistakes(0);
            setBubble(null);
          }}
          onNext={onNext}
          nextLabel={p('Otra receta', 'Այլ բաղադրատոմս')}
        />
      )}
    </>
  );
}

export function Kitchen() {
  const level = useGame((s) => s.level);
  const stars = useGame((s) => s.stars);
  const [rid, setRid] = useState<string | null>(null);
  const recipe = useMemo(() => RECIPES.find((r) => r.id === rid) || null, [rid]);

  return (
    <div className="scene scene-kitchen">
      <SceneHeader
        title={recipe ? recipe.name : p('Preparamos chocolate caliente', 'Պատրաստում ենք տաք շոկոլադ')}
        icon="☕"
        back={recipe ? 'kitchen' : 'home'}
      />
      {recipe ? (
        <Cooking
          key={recipe.id}
          recipe={recipe}
          onExit={() => setRid(null)}
          onNext={() => {
            const i = RECIPES.findIndex((r) => r.id === recipe.id);
            setRid(RECIPES[(i + 1) % RECIPES.length].id);
          }}
        />
      ) : (
        <>
          <Instruction p={p('¿Qué cocinamos hoy? Elige una receta.', 'Ի՞նչ ենք պատրաստում այսօր։ Ընտրիր բաղադրատոմս։')} icon="👩‍🍳" />
          <div className="recipe-grid">
            {RECIPES.map((r) => (
              <button key={r.id} className={'recipe-card ' + (levelOk(r.level, level) ? '' : 'harder')} onClick={() => (speak(r.name), setRid(r.id))}>
                <span className="rc-icon">{r.icon}</span>
                <span className="rc-name">
                  <T p={r.name} />
                </span>
                <span className="rc-level">{r.level}</span>
                <span className="rc-stars">{'★'.repeat(stars['kitchen:' + r.id] || 0)}{'☆'.repeat(3 - (stars['kitchen:' + r.id] || 0))}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
