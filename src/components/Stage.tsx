import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Gayane, type ClothId, type Mood } from './Gayane';
import { T } from '../core/translate';
import { sfx } from '../core/sound';
import type { P } from '../core/types';
import { clamp } from '../core/util';

export interface Spot {
  id: string;
  x: number; // position in world units (0..width)
  label?: P;
  art: ReactNode;
  bottom?: number; // % from bottom of the stage
  stopAt?: number; // where Gayane stops (default x)
  onArrive?: () => void;
  hidden?: boolean;
  className?: string;
  z?: number;
}

/**
 * Side-scrolling walkable scene. Tap the floor to walk, tap an object to walk to it and use it.
 * Keyboard: ← → / A D to walk, E / Enter to use the nearest object. Touch: ◀ ▶ buttons.
 */
export function Stage({ width = 100, spots, startX = 10, wear = ['jersey', 'pantalones', 'botas'], mood = 'happy', holding, bg, fg, className, gx, onPos, hideGirl, girlScale = 1, speed = 30 }: {
  width?: number;
  spots: Spot[];
  startX?: number;
  wear?: ClothId[];
  mood?: Mood;
  holding?: string;
  bg?: ReactNode;
  fg?: ReactNode;
  className?: string;
  gx?: number; // external teleport
  onPos?: (x: number) => void;
  hideGirl?: boolean;
  girlScale?: number;
  speed?: number;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(startX);
  const xr = useRef(startX);
  const target = useRef<number | null>(null);
  const arrive = useRef<(() => void) | null>(null);
  const hold = useRef(0);
  const [walking, setWalking] = useState(false);
  const [face, setFace] = useState(1);
  const [cam, setCam] = useState(0);
  const spotsRef = useRef(spots);
  spotsRef.current = spots;

  useEffect(() => {
    if (gx !== undefined) { xr.current = gx; setX(gx); target.current = null; }
  }, [gx]);

  // animation loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let moving = false;
      if (hold.current) {
        target.current = null;
        arrive.current = null;
        xr.current = clamp(xr.current + hold.current * speed * dt, 2, width - 2);
        setFace(hold.current);
        moving = true;
      } else if (target.current !== null) {
        const d = target.current - xr.current;
        const step = speed * dt;
        if (Math.abs(d) <= step) {
          xr.current = target.current;
          target.current = null;
          const a = arrive.current;
          arrive.current = null;
          if (a) a();
        } else {
          xr.current += Math.sign(d) * step;
          setFace(Math.sign(d));
          moving = true;
        }
      }
      setWalking(moving);
      setX(xr.current);
      const W = outer.current?.clientWidth ?? 0;
      const inner = (W * width) / 100;
      setCam(clamp((xr.current / width) * inner - W / 2, 0, Math.max(0, inner - W)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [width, speed]);

  useEffect(() => { onPos?.(x); }, [Math.round(x)]);

  const walkTo = useCallback((tx: number, then?: () => void) => {
    target.current = clamp(tx, 2, width - 2);
    arrive.current = then ?? null;
  }, [width]);

  const use = (s: Spot) => {
    sfx.click();
    walkTo(s.stopAt ?? s.x, () => s.onArrive?.());
  };

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { hold.current = -1; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { hold.current = 1; e.preventDefault(); }
      if (e.key === 'e' || e.key === 'E' || (e.key === 'Enter' && tag !== 'BUTTON')) {
        const near = spotsRef.current.filter((s) => !s.hidden && s.onArrive).sort((a, b) => Math.abs(a.x - xr.current) - Math.abs(b.x - xr.current))[0];
        if (near && Math.abs(near.x - xr.current) < 12) use(near);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) hold.current = 0;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const pct = (v: number) => (v / width) * 100 + '%';
  const floorClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.spot, button, .es')) return;
    const r = e.currentTarget.getBoundingClientRect();
    walkTo(((e.clientX - r.left) / r.width) * width);
  };
  const holdBtn = (dir: number) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); hold.current = dir; },
    onPointerUp: () => (hold.current = 0),
    onPointerLeave: () => (hold.current = 0),
    onPointerCancel: () => (hold.current = 0),
  });

  return (
    <div className={'stage ' + (className || '')} ref={outer}>
      <div className="stage-world" style={{ width: width + '%', transform: `translate3d(${-cam}px,0,0)` }} onPointerUp={floorClick}>
        {bg}
        {spots.filter((s) => !s.hidden).map((s) => (
          <div key={s.id} className={'spot ' + (s.className || '')} style={{ left: pct(s.x), bottom: (s.bottom ?? 10) + '%', zIndex: s.z ?? 2 }}>
            <div className="spot-art" role="button" tabIndex={0} onClick={() => use(s)} onKeyDown={(e) => e.key === 'Enter' && use(s)}>{s.art}</div>
            {s.label && <div className="spot-label"><T p={s.label} /></div>}
          </div>
        ))}
        {!hideGirl && (
          <div className="stage-girl" style={{ left: pct(x), transform: `translateX(-50%) scale(${girlScale})` }}>
            {holding && <span className="stage-holding">{holding}</span>}
            <div style={{ transform: `scaleX(${face})` }}>
              <Gayane wear={wear} walking={walking} mood={mood} />
            </div>
          </div>
        )}
        {fg}
      </div>
      <div className="stage-pad" aria-hidden>
        <button className="pad-btn" {...holdBtn(-1)}>◀</button>
        <button className="pad-btn" {...holdBtn(1)}>▶</button>
      </div>
    </div>
  );
}
