import { useCallback, useRef, useSyncExternalStore, type ReactNode, type PointerEvent as RPE } from 'react';
import { sfx } from './sound';

export interface Payload {
  kind: string;
  id: string;
  data?: unknown;
}

export interface DropInfo {
  x: number; // client coords
  y: number;
  rect: DOMRect; // target rect
}

interface Target {
  el: HTMLElement;
  accept: (p: Payload) => boolean;
  onDrop: (p: Payload, info: DropInfo) => void;
  priority: number;
}

const targets = new Map<string, Target>();
let ghost: { node: ReactNode; x: number; y: number; ox: number; oy: number } | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());

let dragging: Payload | null = null;
export const isDragging = () => !!dragging;

function hit(x: number, y: number, p: Payload) {
  let best: Target | null = null;
  let bestScore = Infinity;
  targets.forEach((t) => {
    if (!t.accept(p)) return;
    const r = t.el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      const score = r.width * r.height - t.priority * 1e9;
      if (score < bestScore) {
        best = t;
        bestScore = score;
      }
    }
  });
  return best as Target | null;
}

export function useDropTarget(
  id: string,
  accept: (p: Payload) => boolean,
  onDrop: (p: Payload, info: DropInfo) => void,
  priority = 0,
) {
  const ref = useRef<HTMLElement | null>(null);
  const acc = useRef(accept);
  const drop = useRef(onDrop);
  acc.current = accept;
  drop.current = onDrop;
  const setRef = useCallback(
    (el: HTMLElement | null) => {
      ref.current = el;
      if (el) targets.set(id, { el, accept: (p) => acc.current(p), onDrop: (p, i) => drop.current(p, i), priority });
      else targets.delete(id);
    },
    [id, priority],
  );
  return setRef;
}

export interface DragOpts {
  ghost?: ReactNode;
  onTap?: () => void;
  onStart?: () => void;
  onEnd?: (dropped: boolean, x: number, y: number) => void;
  disabled?: boolean;
}

/** Returns an onPointerDown handler; drag begins after a small movement, otherwise it is a tap. */
export function useDraggable(payload: Payload, opts: DragOpts) {
  const o = useRef(opts);
  o.current = opts;
  const pl = useRef(payload);
  pl.current = payload;

  return useCallback((e: RPE<HTMLElement>) => {
    if (o.current.disabled) return;
    if (e.button !== undefined && e.button > 0) return;
    const src = e.currentTarget as HTMLElement;
    const r = src.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    let started = false;
    let over: HTMLElement | null = null;
    const ox = sx - r.left - r.width / 2;
    const oy = sy - r.top - r.height / 2;

    const move = (ev: PointerEvent) => {
      if (!started && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 7) {
        started = true;
        dragging = pl.current;
        src.classList.add('drag-origin');
        ghost = {
          node: o.current.ghost ?? <div dangerouslySetInnerHTML={{ __html: src.outerHTML }} />,
          x: ev.clientX,
          y: ev.clientY,
          ox,
          oy,
        };
        sfx.pick();
        o.current.onStart?.();
      }
      if (started) {
        ev.preventDefault();
        ghost = ghost && { ...ghost, x: ev.clientX, y: ev.clientY };
        emit();
        const t = hit(ev.clientX, ev.clientY, pl.current);
        const el = t?.el || null;
        if (el !== over) {
          over?.classList.remove('drop-over');
          el?.classList.add('drop-over');
          over = el;
        }
      }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      over?.classList.remove('drop-over');
      src.classList.remove('drag-origin');
      if (!started) {
        if (ev.type === 'pointerup') o.current.onTap?.();
        return;
      }
      const t = ev.type === 'pointerup' ? hit(ev.clientX, ev.clientY, pl.current) : null;
      dragging = null;
      ghost = null;
      emit();
      if (t) t.onDrop(pl.current, { x: ev.clientX, y: ev.clientY, rect: t.el.getBoundingClientRect() });
      o.current.onEnd?.(!!t, ev.clientX, ev.clientY);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, []);
}

export function DragLayer() {
  const g = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => ghost,
  );
  if (!g) return null;
  return (
    <div className="drag-ghost" style={{ left: g.x - g.ox, top: g.y - g.oy }}>
      {g.node}
    </div>
  );
}
