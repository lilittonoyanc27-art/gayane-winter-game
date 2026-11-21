import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Phrase, T } from '../core/translate';
import { p, type P, type SceneId } from '../core/types';
import { sfx } from '../core/sound';
import { award, setState, totalStars, useGame } from '../core/store';
import { autoSay } from '../core/speech';

/* ---------------- navigation ---------------- */
type NavListener = (s: SceneId) => void;
let navListener: NavListener | null = null;
export const setNavListener = (l: NavListener) => (navListener = l);
export const go = (s: SceneId) => {
  sfx.whoosh();
  navListener?.(s);
};

/* ---------------- basic button ---------------- */
export function Btn({
  label,
  onClick,
  icon,
  variant = 'primary',
  disabled,
  className,
  style,
  small,
}: {
  label: P;
  onClick?: () => void;
  icon?: string;
  variant?: 'primary' | 'soft' | 'ghost' | 'danger' | 'gold';
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  small?: boolean;
}) {
  return (
    <button
      className={`btn btn-${variant} ${small ? 'btn-sm' : ''} ${className || ''}`}
      style={style}
      disabled={disabled}
      onClick={() => {
        sfx.click();
        onClick?.();
      }}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      <T p={label} />
    </button>
  );
}

export const L = {
  back: p('Volver', 'Վերադառնալ'),
  home: p('Casa', 'Տուն'),
  next: p('Siguiente', 'Հաջորդը'),
  again: p('Otra vez', 'Նորից'),
  check: p('Comprobar', 'Ստուգել'),
  start: p('Empezar', 'Սկսել'),
  continue: p('Continuar', 'Շարունակել'),
  close: p('Cerrar', 'Փակել'),
  menu: p('Menú', 'Մենյու'),
  well: p('¡Muy bien!', 'Շատ լավ է։'),
  tryAgain: p('Inténtalo otra vez.', 'Նորից փորձիր։'),
  reset: p('Reiniciar', 'Վերսկսել'),
};

/* ---------------- header ---------------- */
export function SceneHeader({ title, icon, back = 'home', right }: { title: P; icon?: string; back?: SceneId; right?: ReactNode }) {
  const stars = useGame((s) => totalStars(s));
  const level = useGame((s) => s.level);
  const tm = useGame((s) => s.translateMode);
  return (
    <header className="scene-header">
      <button className="hdr-btn" onClick={() => go(back)} aria-label="Volver">
        ‹ <T p={back === 'home' ? L.home : L.back} />
      </button>
      <h1 className="scene-title">
        {icon && <span className="title-icon">{icon}</span>}
        <T p={title} />
      </h1>
      <div className="hdr-right">
        {right}
        <button
          className={'tr-toggle hdr-pill ' + (tm ? 'on' : '')}
          title="Modo traducción"
          onClick={() => setState((s) => ({ ...s, translateMode: !s.translateMode }))}
        >
          Ա
        </button>
        <span className="hdr-pill level-pill">{level}</span>
        <span className="hdr-pill star-pill">★ {stars}</span>
      </div>
    </header>
  );
}

/* ---------------- instruction bubble ---------------- */
export function Instruction({ p: ph, icon = '💬', who, auto = true, className }: { p: P; icon?: string; who?: P; auto?: boolean; className?: string }) {
  return (
    <div className={'instruction pop-in ' + (className || '')} key={ph.es}>
      <div className="instr-icon">{icon}</div>
      <div className="instr-body">
        {who && (
          <div className="instr-who">
            <T p={who} />
          </div>
        )}
        <Phrase p={ph} auto={auto} />
      </div>
    </div>
  );
}

/* ---------------- feedback toast ---------------- */
export interface Fb {
  ok: boolean;
  p: P;
  extra?: P[];
}
export function Feedback({ fb, onClose }: { fb: Fb | null; onClose?: () => void }) {
  useEffect(() => {
    if (fb) {
      fb.ok ? sfx.success() : sfx.error();
      autoSay(fb.p);
    }
  }, [fb]);
  if (!fb) return null;
  return (
    <div className={'feedback pop-in ' + (fb.ok ? 'ok' : 'bad')}>
      <div className="fb-icon">{fb.ok ? '✨' : '🤔'}</div>
      <div className="fb-body">
        <Phrase p={fb.p} />
        {fb.extra?.map((e) => (
          <Phrase key={e.es} p={e} className="fb-extra" />
        ))}
      </div>
      {onClose && (
        <button className="fb-close" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
}

/* ---------------- reward ---------------- */
export function Reward({
  id,
  stars,
  message,
  onAgain,
  onNext,
  nextLabel,
}: {
  id: string;
  stars: number;
  message: P;
  onAgain?: () => void;
  onNext?: () => void;
  nextLabel?: P;
}) {
  useEffect(() => {
    award(id, stars);
    sfx.star();
    autoSay(message);
  }, []);
  return (
    <div className="modal-wrap">
      <Confetti />
      <div className="modal reward pop-in">
        <div className="reward-stars">
          {[1, 2, 3].map((i) => (
            <span key={i} className={'rstar ' + (i <= stars ? 'on' : '')} style={{ animationDelay: i * 0.25 + 's' }}>
              ★
            </span>
          ))}
        </div>
        <Phrase p={message} big />
        <div className="modal-actions">
          {onAgain && <Btn label={L.again} icon="↻" variant="soft" onClick={onAgain} />}
          {onNext && <Btn label={nextLabel || L.next} icon="→" onClick={onNext} />}
          <Btn label={L.home} icon="🏠" variant="ghost" onClick={() => go('home')} />
        </div>
      </div>
    </div>
  );
}

export function Confetti({ n = 40 }: { n?: number }) {
  const [items] = useState(() =>
    Array.from({ length: n }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      dur: 2.5 + Math.random() * 2,
      ch: ['❄', '💗', '✨', '★', '❅'][i % 5],
      size: 14 + Math.random() * 18,
    })),
  );
  return (
    <div className="confetti" aria-hidden>
      {items.map((c, i) => (
        <span key={i} style={{ left: c.left + '%', animationDelay: c.delay + 's', animationDuration: c.dur + 's', fontSize: c.size }}>
          {c.ch}
        </span>
      ))}
    </div>
  );
}

/* ---------------- confirm ---------------- */
export function Confirm({ q, onYes, onNo }: { q: P; onYes: () => void; onNo: () => void }) {
  return (
    <div className="modal-wrap">
      <div className="modal pop-in">
        <Phrase p={q} big />
        <div className="modal-actions">
          <Btn label={p('Sí, estoy segura', 'Այո, համոզված եմ')} variant="danger" onClick={onYes} />
          <Btn label={p('No, cancelar', 'Ոչ, չեղարկել')} variant="soft" onClick={onNo} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- step dots ---------------- */
export function Steps({ total, cur }: { total: number; cur: number }) {
  return (
    <div className="steps">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={'dot ' + (i < cur ? 'done' : i === cur ? 'cur' : '')} />
      ))}
    </div>
  );
}

/** Choice list for dialogues and exercises. */
export function Choices({ options, onPick, disabled }: { options: P[]; onPick: (i: number) => void; disabled?: boolean }) {
  return (
    <div className="choices">
      {options.map((o, i) => (
        <button key={o.es + i} className="choice" disabled={disabled} onClick={() => (sfx.click(), onPick(i))}>
          <T p={o} />
        </button>
      ))}
    </div>
  );
}

export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
