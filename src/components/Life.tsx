import { useEffect, useState, type ReactNode } from 'react';
import { T, Phrase } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { p, type P } from '../core/types';
import { useGame } from '../core/store';
import { fmtEuro, priceP } from '../core/util';
import { Btn } from './UI';

/* ---------- mission list inside a big game ---------- */
export interface Mission { id: string; icon: string; title: P; desc: P }
export function MissionMenu({ game, missions, onPick, intro, extra }: { game: string; missions: Mission[]; onPick: (id: string) => void; intro?: ReactNode; extra?: ReactNode }) {
  const stars = useGame((s) => s.stars);
  return (
    <div className="mission-menu">
      {intro}
      <div className="mission-list">
        {missions.map((m, i) => {
          const st = stars[`${game}:${m.id}`] || 0;
          return (
            <button key={m.id} className={'mission ' + (st ? 'done' : '')} onClick={() => (sfx.click(), onPick(m.id))}>
              <span className="m-num">{i + 1}</span>
              <span className="m-icon" aria-hidden>{m.icon}</span>
              <span className="m-text">
                <span className="m-title"><T p={m.title} /></span>
                <span className="m-desc"><T p={m.desc} /></span>
              </span>
              <span className="m-stars">{[1, 2, 3].map((k) => <i key={k} className={k <= st ? 'on' : ''}>★</i>)}</span>
            </button>
          );
        })}
      </div>
      {extra}
    </div>
  );
}

/* ---------- airport / cabin announcement (listening) ---------- */
export function Announcement({ text, icon = '📢', autoplay = true, label = p('Anuncio', 'Հայտարարություն') }: { text: P; icon?: string; autoplay?: boolean; label?: P }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!autoplay) return;
    sfx.chime();
    const t = window.setTimeout(() => speak(text), 700);
    return () => window.clearTimeout(t);
  }, [text.es]);
  return (
    <div className="announce pop-in">
      <div className="an-head"><span aria-hidden>{icon}</span> <T p={label} /></div>
      <div className="an-wave" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ animationDelay: i * 0.07 + 's' }} />)}</div>
      <div className="an-tools">
        <button className="tool" onClick={() => speak(text)}>🔊 <T p={p('Escuchar', 'Լսել')} /></button>
        <button className="tool" onClick={() => speak(text, { slow: true })}>↻ <T p={p('Repetir despacio', 'Կրկնել դանդաղ')} /></button>
        <button className={'tool ' + (show ? 'on' : '')} onClick={() => setShow((v) => !v)}>¶ <T p={show ? p('Ocultar el texto', 'Թաքցնել տեքստը') : p('Ver el texto', 'Տեսնել տեքստը')} /></button>
      </div>
      {show && <Phrase p={text} />}
    </div>
  );
}

/* ---------- payment: card or cash ---------- */
const CASH = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];
export function Pay({ total, onPaid, cashAllowed = true, noChangeFor = 0 }: { total: number; onPaid: (how: 'tarjeta' | 'efectivo', given: number) => void; cashAllowed?: boolean; noChangeFor?: number }) {
  const [mode, setMode] = useState<'tarjeta' | 'efectivo' | null>(null);
  const [given, setGiven] = useState<number[]>([]);
  const [tapped, setTapped] = useState(false);
  const [msg, setMsg] = useState<P | null>(null);
  const sum = Math.round(given.reduce((a, b) => a + b, 0) * 100) / 100;
  const pr = priceP(total);
  return (
    <div className="pay pop-in">
      <div className="pay-total">
        <T p={p('Total', 'Ընդամենը')} /> <b>{fmtEuro(total)}</b> · <T p={pr} />
        <button className="tool mini" onClick={() => speak(pr)}>🔊</button>
      </div>
      {!mode && (
        <div className="pay-choose">
          <Btn label={p('Pagar con tarjeta', 'Վճարել քարտով')} icon="💳" onClick={() => setMode('tarjeta')} />
          {cashAllowed && <Btn label={p('Pagar en efectivo', 'Վճարել կանխիկ')} icon="💶" variant="soft" onClick={() => setMode('efectivo')} />}
        </div>
      )}
      {mode === 'tarjeta' && (
        <div className="pay-card">
          <div className={'terminal ' + (tapped ? 'ok' : '')} role="button" tabIndex={0} onClick={() => {
            if (tapped) return;
            setTapped(true); sfx.success();
            window.setTimeout(() => onPaid('tarjeta', total), 900);
          }}>
            <div className="term-screen">{tapped ? '✓ APROBADO' : fmtEuro(total)}</div>
            <div className="term-keys">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
          </div>
          <T p={tapped ? p('Pago aceptado.', 'Վճարումն ընդունված է։') : p('Acerca la tarjeta al datáfono (tócalo).', 'Մոտեցրու քարտը տերմինալին (հպիր դրան)։')} className="muted" />
        </div>
      )}
      {mode === 'efectivo' && (
        <div className="pay-cash">
          <div className="cash-row">
            {CASH.map((c) => (
              <button key={c} className={'cash ' + (c >= 5 ? 'note' : 'coin')} onClick={() => (sfx.coin(), setGiven((g) => [...g, c]), setMsg(null))}>{c >= 1 ? c : c.toFixed(2).replace('0.', '0,')} €</button>
            ))}
          </div>
          <div className="cash-given">
            <T p={p('Entregas:', 'Տալիս ես՝')} /> <b>{fmtEuro(sum)}</b>
            <button className="tool mini" onClick={() => setGiven([])}>⌫</button>
          </div>
          {msg && <div className="pay-msg"><T p={msg} /></div>}
          <Btn label={p('Pagar', 'Վճարել')} icon="✓" small disabled={!sum} onClick={() => {
            if (sum < total) { sfx.error(); setMsg(p('No es suficiente. Falta dinero.', 'Բավարար չէ։ Գումարը պակաս է։')); return; }
            if (noChangeFor && sum >= noChangeFor && sum - total > 5) { sfx.error(); setMsg(p('Lo siento, no tengo cambio para ese billete. ¿Tiene algo más pequeño o tarjeta?', 'Ցավում եմ, այդ թղթադրամի համար մանր չունեմ։ Ավելի փոքր կա՞, թե՞ քարտ։')); speak(p('Lo siento, no tengo cambio para ese billete. ¿Tiene algo más pequeño o tarjeta?', 'Ցավում եմ, այդ թղթադրամի համար մանր չունեմ։')); return; }
            onPaid('efectivo', sum);
          }} />
        </div>
      )}
    </div>
  );
}

/** Small label + value card (boarding pass, receipts…) */
export function InfoCard({ rows, title, className }: { rows: [P, string][]; title: P; className?: string }) {
  return (
    <div className={'info-card ' + (className || '')}>
      <div className="ic-title"><T p={title} /></div>
      <div className="ic-grid">
        {rows.map(([k, v]) => (
          <div key={k.es}><small><T p={k} /></small><b>{v}</b></div>
        ))}
      </div>
    </div>
  );
}
