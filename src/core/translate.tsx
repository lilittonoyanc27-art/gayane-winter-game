import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { learn, markDifficult, setState, useGame } from './store';
import { speak } from './speech';
import type { P } from './types';
import { sfx } from './sound';

/* ------------------------------------------------------------------ */
/* Popover store                                                       */
/* ------------------------------------------------------------------ */

interface PopState {
  ph: P;
  rect: { x: number; y: number; w: number; h: number };
}
let pop: PopState | null = null;
const subs = new Set<() => void>();
function setPop(v: PopState | null) {
  pop = v;
  subs.forEach((s) => s());
}
export function openTranslation(ph: P, el?: Element | null) {
  const r = el?.getBoundingClientRect();
  learn(ph);
  setPop({ ph, rect: r ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: innerWidth / 2, y: innerHeight / 2, w: 0, h: 0 } });
}

function phraseFromEl(el: Element | null): P | null {
  if (!el) return null;
  const host = el.closest('[data-es]') || el.querySelector('[data-es]');
  if (!host) return null;
  const es = host.getAttribute('data-es');
  const hy = host.getAttribute('data-hy');
  if (!es || !hy) return null;
  return { es, hy };
}

/* ------------------------------------------------------------------ */
/* <T> — every Spanish text in the game goes through this component    */
/* ------------------------------------------------------------------ */

export function T({ p, className, style, as = 'span' }: { p: P; className?: string; style?: CSSProperties; as?: 'span' | 'div' }) {
  const Tag = as;
  return (
    <Tag
      className={'es ' + (className || '')}
      style={style}
      data-es={p.es}
      data-hy={p.hy}
      onClick={(e) => {
        const t = e.currentTarget as HTMLElement;
        // inside an interactive control the control keeps its click (long-press / translate mode handled globally)
        if (t.closest('button, [data-action], .drag-src')) return;
        e.stopPropagation();
        openTranslation(p, t);
      }}
    >
      {p.es}
    </Tag>
  );
}

/** Spanish line with explicit Escuchar / Traducir / Repetir buttons and inline Armenian. */
export function Phrase({ p, big, auto, children, className }: { p: P; big?: boolean; auto?: boolean; children?: ReactNode; className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(false);
  }, [p.es]);
  useEffect(() => {
    if (auto) {
      const id = window.setTimeout(() => speak(p), 250);
      return () => window.clearTimeout(id);
    }
  }, [p.es, auto]);
  return (
    <div className={'phrase ' + (big ? 'phrase-big ' : '') + (className || '')}>
      <div className="phrase-text">
        {children}
        <T p={p} />
      </div>
      {show && <div className="hy">{p.hy}</div>}
      <div className="phrase-tools">
        <button className="tool" onClick={() => speak(p)} title="Escuchar">
          🔊 <T p={{ es: 'Escuchar', hy: 'Լսել' }} />
        </button>
        <button
          className={'tool ' + (show ? 'on' : '')}
          onClick={() => {
            setShow((v) => !v);
            learn(p);
          }}
        >
          Ա <T p={{ es: 'Traducir', hy: 'Թարգմանել' }} />
        </button>
        <button className="tool" onClick={() => speak(p, { slow: true })}>
          🔁 <T p={{ es: 'Repetir', hy: 'Կրկնել' }} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Global layer: popover + long-press + translation-mode interception  */
/* ------------------------------------------------------------------ */

export function TranslationLayer() {
  const cur = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => pop,
  );
  const translateMode = useGame((s) => s.translateMode);
  const difficult = useGame((s) => s.difficult);
  const [showHy, setShowHy] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<CSSProperties>({});

  useEffect(() => setShowHy(true), [cur?.ph.es]);

  // long press anywhere on a Spanish text (buttons included) opens the translation
  useEffect(() => {
    let timer: number | undefined;
    let start: { x: number; y: number } | null = null;
    let suppressClick = false;
    const down = (e: PointerEvent) => {
      const target = e.target as Element;
      if (target.closest('.tr-pop')) return;
      const ph = phraseFromEl(target.closest('[data-es], button, [data-action]'));
      if (!ph) return;
      start = { x: e.clientX, y: e.clientY };
      const el = target;
      timer = window.setTimeout(() => {
        suppressClick = true;
        sfx.pop();
        openTranslation(ph, el.closest('[data-es], button, [data-action]'));
      }, 600);
    };
    const move = (e: PointerEvent) => {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) window.clearTimeout(timer);
    };
    const up = () => {
      window.clearTimeout(timer);
      start = null;
    };
    const click = (e: MouseEvent) => {
      if (suppressClick) {
        suppressClick = false;
        e.stopPropagation();
        e.preventDefault();
      }
    };
    const ctx = (e: MouseEvent) => {
      const ph = phraseFromEl((e.target as Element).closest('[data-es], button, [data-action]'));
      if (ph) {
        e.preventDefault();
        openTranslation(ph, (e.target as Element).closest('[data-es], button, [data-action]'));
      }
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
    document.addEventListener('click', click, true);
    document.addEventListener('contextmenu', ctx, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true);
      document.removeEventListener('click', click, true);
      document.removeEventListener('contextmenu', ctx, true);
    };
  }, []);

  // translation mode: every click on Spanish text / button only translates
  useEffect(() => {
    if (!translateMode) return;
    const click = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('.tr-pop, .tr-toggle')) return;
      const host = target.closest('[data-es], button, [data-action]');
      const ph = phraseFromEl(host);
      if (!ph) return;
      e.stopPropagation();
      e.preventDefault();
      openTranslation(ph, host);
    };
    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, [translateMode]);

  useLayoutEffect(() => {
    if (!cur || !boxRef.current) return;
    const b = boxRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = cur.rect.x + cur.rect.w / 2 - b.width / 2;
    left = Math.max(8, Math.min(vw - b.width - 8, left));
    let top = cur.rect.y + cur.rect.h + 10;
    if (top + b.height > vh - 8) top = Math.max(8, cur.rect.y - b.height - 10);
    setPos({ left, top });
  }, [cur, showHy]);

  if (!cur) return translateMode ? <ModeBadge /> : null;
  const isDiff = !!difficult[cur.ph.es];
  return (
    <>
      {translateMode && <ModeBadge />}
      <div className="tr-backdrop" onClick={() => setPop(null)} />
      <div className="tr-pop" ref={boxRef} style={pos} role="dialog">
        <button className="tr-close" onClick={() => setPop(null)} aria-label="Cerrar">
          ✕
        </button>
        <div className="tr-es">{cur.ph.es}</div>
        {showHy && <div className="tr-hy">{cur.ph.hy}</div>}
        <div className="tr-tools">
          <button onClick={() => speak(cur.ph)}>🔊 Escuchar</button>
          <button className={showHy ? 'on' : ''} onClick={() => setShowHy((v) => !v)}>
            Ա Traducir
          </button>
          <button onClick={() => speak(cur.ph, { slow: true })}>🔁 Repetir</button>
          <button
            className={isDiff ? 'on' : ''}
            onClick={() => {
              markDifficult(cur.ph, !isDiff);
              sfx.click();
            }}
          >
            {isDiff ? '★' : '☆'} Difícil
          </button>
        </div>
        <div className="tr-help">Լսել · Թարգմանել · Կրկնել դանդաղ · Նշել որպես դժվար</div>
      </div>
    </>
  );
}

function ModeBadge() {
  return (
    <div className="tr-mode-badge" onClick={() => setState((s) => ({ ...s, translateMode: false }))}>
      Ա <span>Modo traducción · Թարգմանության ռեժիմ</span> ✕
    </div>
  );
}
