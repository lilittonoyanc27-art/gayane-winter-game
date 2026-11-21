import { useEffect, useMemo, useState } from 'react';
import { T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { p, type P } from '../core/types';
import { shuffle } from '../core/util';
import { Btn } from './UI';

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[¿?¡!.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Build a sentence by tapping word tiles. Calls onResult(true) when the sentence equals target. */
export function WordTiles({ target, extra = [], onResult, showHint }: { target: P; extra?: string[]; onResult: (ok: boolean, built: string) => void; showHint?: boolean }) {
  const words = useMemo(() => target.es.replace(/[.!?¡¿]/g, '').replace(/,/g, '').split(/\s+/).filter(Boolean), [target.es]);
  const pool = useMemo(() => shuffle([...words, ...extra].map((w, i) => ({ w, i }))), [target.es]);
  const [chosen, setChosen] = useState<number[]>([]);
  useEffect(() => setChosen([]), [target.es]);

  const built = chosen.map((i) => pool.find((x) => x.i === i)!.w).join(' ');
  const check = () => {
    const ok = norm(built) === norm(target.es);
    if (ok) speak(target);
    onResult(ok, built);
    if (!ok) setChosen([]);
  };

  return (
    <div className="tiles">
      {showHint && (
        <div className="tiles-hint hy" title="Armenio">
          {target.hy}
        </div>
      )}
      <div className="tiles-built">
        {chosen.length === 0 && <span className="muted">…</span>}
        {chosen.map((i) => (
          <button key={i} className="tile on" onClick={() => (sfx.pop(), setChosen((c) => c.filter((x) => x !== i)))}>
            {pool.find((x) => x.i === i)!.w}
          </button>
        ))}
      </div>
      <div className="tiles-pool">
        {pool.map((t) =>
          chosen.includes(t.i) ? (
            <span key={t.i} className="tile ghost">
              {t.w}
            </span>
          ) : (
            <button
              key={t.i}
              className="tile"
              onClick={() => {
                sfx.click();
                speak(t.w);
                setChosen((c) => [...c, t.i]);
              }}
            >
              {t.w}
            </button>
          ),
        )}
      </div>
      <div className="tiles-actions">
        <Btn label={p('Borrar', 'Ջնջել')} icon="⌫" variant="soft" small onClick={() => setChosen([])} />
        <Btn label={p('Comprobar', 'Ստուգել')} icon="✓" small onClick={check} disabled={chosen.length === 0} />
      </div>
      <div className="tiles-help">
        <T p={p('Toca las palabras en el orden correcto.', 'Հպիր բառերին ճիշտ հերթականությամբ։')} />
      </div>
    </div>
  );
}
