import { useEffect, useMemo, useRef, useState } from 'react';
import { Gayane } from '../components/Gayane';
import { WeatherWindow } from '../components/Snow';
import { Btn, Feedback, Instruction, Reward, SceneHeader, Steps, starsFor, type Fb } from '../components/UI';
import { DECOR, D_TASKS, FURN, condHolds, currentRel, decorById, describe, furnZ, refBox, zFor, type Placed } from '../data/decorate';
import { useDraggable, useDropTarget } from '../core/dnd';
import { T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { markDifficult, setState, useGame } from '../core/store';
import { levelOk, p, type P } from '../core/types';

export function DecorArt({ id }: { id: string }) {
  switch (id) {
    case 'lampara':
      return (
        <svg viewBox="0 0 50 150" preserveAspectRatio="none" className="decor-svg">
          <path d="M8 60 L42 60 L34 10 L16 10 Z" fill="#f8c8d8" stroke="#e7799f" strokeWidth="3" />
          <rect x="23" y="60" width="4" height="72" fill="#c79a6e" />
          <ellipse cx="25" cy="140" rx="18" ry="8" fill="#9c2a4c" />
          <ellipse cx="25" cy="66" rx="22" ry="10" fill="rgba(255,220,120,.35)" />
        </svg>
      );
    case 'cojines':
      return (
        <svg viewBox="0 0 80 80" preserveAspectRatio="none" className="decor-svg">
          <rect x="4" y="18" width="44" height="58" rx="14" fill="#f4a6c1" stroke="#e7799f" strokeWidth="3" />
          <rect x="32" y="24" width="44" height="52" rx="14" fill="#dccdf0" stroke="#b9a3de" strokeWidth="3" />
          <path d="M44 50 c-4 -6 -12 0 0 8 c12 -8 4 -14 0 -8z" fill="#9c2a4c" />
        </svg>
      );
    case 'manta':
      return (
        <svg viewBox="0 0 130 70" preserveAspectRatio="none" className="decor-svg">
          <rect x="2" y="6" width="126" height="60" rx="10" fill="#fff6ec" stroke="#e7799f" strokeWidth="3" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={10 + i * 20} y="6" width="10" height="60" fill="#f8c8d8" />
          ))}
          <path d="M2 40 H128" stroke="#9c2a4c" strokeWidth="4" />
        </svg>
      );
    case 'alfombra':
      return (
        <svg viewBox="0 0 240 60" preserveAspectRatio="none" className="decor-svg">
          <ellipse cx="120" cy="30" rx="118" ry="28" fill="#dccdf0" stroke="#9c2a4c" strokeWidth="4" />
          <ellipse cx="120" cy="30" rx="90" ry="18" fill="none" stroke="#f4a6c1" strokeWidth="6" strokeDasharray="10 8" />
          <ellipse cx="120" cy="30" rx="40" ry="8" fill="#f8c8d8" />
        </svg>
      );
    case 'luces':
      return (
        <svg viewBox="0 0 200 50" preserveAspectRatio="none" className="decor-svg lights-svg">
          <path d="M0 8 Q50 40 100 14 Q150 40 200 8" stroke="#6b4a3a" strokeWidth="3" fill="none" />
          {[14, 40, 66, 92, 118, 144, 170, 192].map((x, i) => (
            <circle key={i} cx={x} cy={i % 2 ? 26 : 22} r="7" fill={['#ffd86b', '#f48fb1', '#b39ddb'][i % 3]} className="bulb" style={{ animationDelay: i * 0.2 + 's' }} />
          ))}
        </svg>
      );
    default: {
      const em: Record<string, string> = { arbol: '🎄', libros: '📚', flores: '💐', velas: '🕯️', regalo: '🎁', osito: '🧸' };
      return <span className="decor-emoji">{em[id]}</span>;
    }
  }
}

function Furniture({ id }: { id: string }) {
  if (id === 'ventana') return <WeatherWindow weather="nevando" className="f-window" />;
  return <div className={'furn-art fa-' + id} />;
}

const trayBox = (w: number, h: number) => {
  const k = Math.min(58 / (w * 1.6), 58 / h);
  return { width: w * 1.6 * k, height: h * k };
};

function TrayItem({ id, roomW, roomH }: { id: string; roomW: number; roomH: number }) {
  const d = decorById(id);
  const down = useDraggable(
    { kind: 'decor', id },
    {
      center: true,
      ghost: (
        <div className="decor-ghost" style={{ width: (d.w / 100) * roomW, height: (d.h / 100) * roomH }}>
          <DecorArt id={id} />
        </div>
      ),
      onStart: () => speak(d.name),
    },
  );
  return (
    <div className="tray-item">
      <div className="tray-art drag-src" onPointerDown={down}>
        <div className="tray-art-inner" style={trayBox(d.w, d.h)}>
          <DecorArt id={id} />
        </div>
      </div>
      <T p={d.name} className="tray-name" />
    </div>
  );
}

function RoomItem({ pl, roomW, roomH, hl }: { pl: Placed; roomW: number; roomH: number; hl: boolean }) {
  const d = decorById(pl.id);
  const down = useDraggable(
    { kind: 'decor', id: pl.id },
    {
      center: true,
      ghost: (
        <div className="decor-ghost" style={{ width: (d.w / 100) * roomW, height: (d.h / 100) * roomH }}>
          <DecorArt id={pl.id} />
        </div>
      ),
      onTap: () => speak(d.name),
    },
  );
  return (
    <div
      className={'room-item drag-src ' + (hl ? 'hl' : '')}
      onPointerDown={down}
      style={{ left: pl.x - d.w / 2 + '%', top: pl.y - d.h + '%', width: d.w + '%', height: d.h + '%', zIndex: zFor(pl) }}
      aria-label={d.name.es}
    >
      <DecorArt id={pl.id} />
    </div>
  );
}

export function Decorate() {
  const level = useGame((s) => s.level);
  const placed = useGame((s) => s.decorLayout) || [];
  const tasks = useMemo(() => D_TASKS.filter((t) => levelOk(t.level, level)), [level]);
  const [ti, setTi] = useState(() => Math.max(0, tasks.findIndex((t) => t.level === level)));
  const [free, setFree] = useState(false);
  const [fb, setFb] = useState<Fb | null>(null);
  const [bubble, setBubble] = useState<P | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const roomRef = useRef<HTMLDivElement | null>(null);
  const task = tasks[ti % tasks.length];
  const roomW = roomRef.current?.clientWidth || 800;
  const roomH = roomRef.current?.clientHeight || 500;

  const setPlaced = (fn: (p: Placed[]) => Placed[]) => setState((s) => ({ ...s, decorLayout: fn(s.decorLayout || []) }));

  const evaluate = (next: Placed[], movedId: string) => {
    if (free || done) return;
    const allOk = task.conds.every((c) => condHolds(c, next));
    if (allOk) {
      setFb({ ok: true, p: p('¡Muy bien! Todo está en su sitio.', 'Շատ լավ է։ Ամեն ինչ իր տեղում է։') });
      window.setTimeout(() => setDone(true), 1300);
      return;
    }
    const c = task.conds.find((x) => x.item === movedId);
    if (c && !condHolds(c, next)) {
      setMistakes((m) => m + 1);
      markDifficult(task.instr, true);
      const now = describe(movedId, currentRel(movedId, c.ref, next, c.ref2), c.ref, c.ref2);
      setFb({ ok: false, p: p('Todavía no.', 'Դեռ ոչ։'), extra: [now, task.instr] });
    } else if (c) {
      setFb({ ok: true, p: p('¡Bien! Ahora el otro objeto.', 'Լավ է։ Հիմա մյուս առարկան։'), extra: [task.instr] });
    }
  };

  const roomDrop = useDropTarget(
    'deco-room',
    (pl) => pl.kind === 'decor',
    (pl, info) => {
      const d = decorById(pl.id);
      const r = info.rect;
      const cx = ((info.x - r.left) / r.width) * 100;
      const cy = ((info.y - r.top) / r.height) * 100;
      const np: Placed = { id: pl.id, x: Math.max(d.w / 2, Math.min(100 - d.w / 2, cx)), y: Math.max(d.h, Math.min(100, cy + d.h / 2)) };
      const next = [...placed.filter((x) => x.id !== pl.id), np];
      setPlaced(() => next);
      sfx.drop();
      // Gayane describes the new position relative to the closest piece of furniture
      const near = FURN.filter((f) => !f.wall)
        .map((f) => ({ f, dist: Math.abs(np.x - (f.x + f.w / 2)) + Math.abs(np.y - (f.y + f.h)) }))
        .sort((a, b) => a.dist - b.dist)[0].f.id;
      const cond = task.conds.find((c) => c.item === pl.id);
      const refId = cond ? cond.ref : near;
      const desc = describe(pl.id, currentRel(pl.id, refId, next, cond?.ref2), refId, cond?.ref2);
      setBubble(desc);
      speak(desc);
      evaluate(next, pl.id);
    },
  );
  const setRoomRef = (el: HTMLDivElement | null) => {
    roomRef.current = el;
    roomDrop(el);
  };
  const trayDrop = useDropTarget(
    'deco-tray',
    (pl) => pl.kind === 'decor',
    (pl) => {
      setPlaced((ps) => ps.filter((x) => x.id !== pl.id));
      sfx.pop();
    },
  );

  const startTask = (i: number) => {
    const t = tasks[i % tasks.length];
    // ensure setup items exist
    if (t.setup)
      setPlaced((ps) => {
        let n = ps;
        for (const s of t.setup!) if (!refBox(s.id, n)) n = [...n, s];
        return n;
      });
    setTi(i);
    setFb(null);
    setMistakes(0);
    setDone(false);
    setBubble(null);
  };

  useEffect(() => startTask(ti), []);

  const neededIds = free ? [] : task.conds.flatMap((c) => [c.item]);
  const inTray = DECOR.filter((d) => !placed.some((x) => x.id === d.id));

  return (
    <div className="scene scene-decorate">
      <SceneHeader title={p('Decora tu habitación', 'Զարդարիր սենյակդ')} icon="🏠" />
      {!free ? (
        <>
          <Steps total={tasks.length} cur={ti % tasks.length} />
          <Instruction p={task.instr} icon="🛋️" who={p('Tarea', 'Առաջադրանք')} key={task.id} />
        </>
      ) : (
        <Instruction p={p('Decoración libre: pon cada cosa donde quieras.', 'Ազատ ձևավորում․ ամեն ինչ դիր, որտեղ ուզում ես։')} icon="🎨" />
      )}

      <div className="deco-room" ref={setRoomRef}>
        <div className="deco-wall" />
        <div className="deco-floor" />
        {FURN.map((f) => (
          <div
            key={f.id}
            className={'furn f-' + f.id}
            style={{ left: f.x + '%', top: f.y + '%', width: f.w + '%', height: f.h + '%', zIndex: furnZ(f) }}
            onClick={() => speak(p(f.es.charAt(0).toUpperCase() + f.es.slice(1), f.hyGen))}
          >
            <Furniture id={f.id} />
            <span className="furn-label">
              <T p={p(f.es, f.hyGen.replace(/ի$/, ''))} />
            </span>
          </div>
        ))}
        {placed.map((pl) => (
          <RoomItem key={pl.id} pl={pl} roomW={roomW} roomH={roomH} hl={neededIds.includes(pl.id)} />
        ))}
        <div className="deco-girl">
          {bubble && (
            <div className="speech-bubble pop-in" key={bubble.es}>
              <T p={bubble} />
            </div>
          )}
          <Gayane wear={['jersey', 'pantalones', 'calcetines']} mood="happy" />
        </div>
      </div>

      <div className="deco-tray" ref={trayDrop}>
        <T p={p('Arrastra los objetos a la habitación. Para quitarlos, arrástralos aquí.', 'Քաշիր առարկաները սենյակ։ Հանելու համար քաշիր այստեղ։')} className="tray-hint" />
        <div className="tray-row">
          {inTray.map((d) => (
            <div key={d.id} className={neededIds.includes(d.id) ? 'tray-need' : ''}>
              <TrayItem id={d.id} roomW={roomW} roomH={roomH} />
            </div>
          ))}
          {inTray.length === 0 && <T p={p('¡Has colocado todo!', 'Ամեն ինչ տեղավորել ես։')} className="muted" />}
        </div>
      </div>

      <div className="action-bar">
        <Btn label={p('Vaciar la habitación', 'Դատարկել սենյակը')} icon="↺" variant="soft" onClick={() => setPlaced(() => [])} />
        {!free ? (
          <Btn label={p('Decoración libre', 'Ազատ ձևավորում')} icon="🎨" variant="ghost" onClick={() => (setFree(true), setFb(null))} />
        ) : (
          <Btn label={p('Volver a las tareas', 'Վերադառնալ առաջադրանքներին')} icon="📝" onClick={() => setFree(false)} />
        )}
        {!free && <Btn label={p('Saltar', 'Բաց թողնել')} icon="⏭" variant="ghost" onClick={() => startTask(ti + 1)} />}
      </div>

      <Feedback fb={fb} onClose={() => setFb(null)} />
      {done && (
        <Reward
          id={'decorate:' + task.id}
          stars={starsFor(mistakes)}
          message={p('¡Tu habitación está cada vez más bonita!', 'Սենյակդ գնալով ավելի գեղեցիկ է դառնում։')}
          onNext={() => startTask(ti + 1)}
          onAgain={() => startTask(ti)}
        />
      )}
    </div>
  );
}
