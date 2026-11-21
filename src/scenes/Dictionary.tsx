import { useMemo, useState } from 'react';
import { Btn, Instruction, SceneHeader, Confetti } from '../components/UI';
import { T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { markDifficult, useGame } from '../core/store';
import { p } from '../core/types';
import { shuffle } from '../core/util';

export function Dictionary() {
  const learned = useGame((s) => s.learned);
  const difficult = useGame((s) => s.difficult);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'recent' | 'az' | 'often'>('recent');
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    let r = Object.entries(learned).map(([es, v]) => ({ es, ...v }));
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter((x) => x.es.toLowerCase().includes(n) || x.hy.toLowerCase().includes(n));
    }
    if (sort === 'recent') r.sort((a, b) => b.last - a.last);
    if (sort === 'az') r.sort((a, b) => a.es.localeCompare(b.es, 'es'));
    if (sort === 'often') r.sort((a, b) => b.seen - a.seen);
    return r;
  }, [learned, q, sort]);

  return (
    <div className="scene scene-dict">
      <SceneHeader title={p('Mi diccionario', 'Իմ բառարանը')} icon="📖" />
      <Instruction p={p('Aquí están todas las palabras y frases que has escuchado o traducido.', 'Այստեղ են բոլոր բառերն ու արտահայտությունները, որոնք լսել կամ թարգմանել ես։')} icon="📖" auto={false} />
      <div className="dict-tools">
        <input className="dict-search" placeholder="Buscar… / Որոնել…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="seg">
          {(
            [
              ['recent', p('Recientes', 'Վերջինները')],
              ['az', p('A–Z', 'Ա–Ֆ')],
              ['often', p('Más vistas', 'Հաճախակի')],
            ] as const
          ).map(([k, l]) => (
            <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>
              <T p={l} />
            </button>
          ))}
        </div>
      </div>
      <div className="dict-count">
        <T p={p('Expresiones aprendidas', 'Սովորած արտահայտություններ')} />: <b>{Object.keys(learned).length}</b>
      </div>
      {rows.length === 0 && (
        <div className="empty-state">
          <T p={p('Todavía no hay palabras. ¡Juega y toca los textos en español!', 'Դեռ բառեր չկան։ Խաղա և հպիր իսպաներեն տեքստերին։')} />
        </div>
      )}
      <div className="dict-list">
        {rows.slice(0, 400).map((r) => (
          <div key={r.es} className="dict-row" onClick={() => setOpen(open === r.es ? null : r.es)}>
            <button className="tool" onClick={(e) => (e.stopPropagation(), speak(r.es))} aria-label="Escuchar">
              🔊
            </button>
            <div className="dict-text">
              <div className="dict-es">{r.es}</div>
              {open === r.es ? <div className="dict-hy">{r.hy}</div> : <div className="dict-tap hy-note">Թարգմանությունը տեսնելու համար հպիր</div>}
            </div>
            <button
              className={'star-btn ' + (difficult[r.es] ? 'on' : '')}
              onClick={(e) => {
                e.stopPropagation();
                sfx.click();
                markDifficult({ es: r.es, hy: r.hy }, !difficult[r.es]);
              }}
              title="Difícil"
            >
              {difficult[r.es] ? '★' : '☆'}
            </button>
          </div>
        ))}
      </div>
      <div style={{ height: 60 }} />
    </div>
  );
}

export function Review() {
  const difficult = useGame((s) => s.difficult);
  const list = useMemo(() => shuffle(Object.entries(difficult).map(([es, hy]) => ({ es, hy }))), []);
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const [known, setKnown] = useState(0);
  const card = list[i];

  const next = () => {
    setShow(false);
    setI((x) => x + 1);
  };

  return (
    <div className="scene scene-review">
      <SceneHeader title={p('Repasar frases difíciles', 'Կրկնել դժվար արտահայտությունները')} icon="🔁" />
      {list.length === 0 ? (
        <div className="empty-state">
          <T p={p('No tienes frases difíciles. Marca frases con ☆ o comete algún error en los juegos y aparecerán aquí.', 'Դժվար արտահայտություններ չունես։ Նշիր արտահայտությունները ☆-ով կամ սխալվիր խաղերում, և դրանք կհայտնվեն այստեղ։')} />
        </div>
      ) : !card ? (
        <div className="review-done">
          <Confetti n={30} />
          <div className="big-emoji">🌟</div>
          <T p={p(`¡Repaso terminado! Ya sabes ${known} de ${list.length} frases.`, `Կրկնությունն ավարտված է։ Արդեն գիտես ${known} արտահայտություն ${list.length}-ից։`)} as="div" className="review-msg" />
          <Btn label={p('Repasar otra vez', 'Կրկին կրկնել')} icon="↻" onClick={() => location.reload()} />
        </div>
      ) : (
        <>
          <div className="review-progress">
            {i + 1} / {list.length}
          </div>
          <div className={'flashcard ' + (show ? 'flipped' : '')}>
            <div className="fc-es">{card.es}</div>
            {show && <div className="fc-hy pop-in">{card.hy}</div>}
            <div className="fc-tools">
              <button className="tool" onClick={() => speak(card.es)}>
                🔊 Escuchar
              </button>
              <button className={'tool ' + (show ? 'on' : '')} onClick={() => setShow((v) => !v)}>
                Ա Traducir
              </button>
              <button className="tool" onClick={() => speak(card.es, { slow: true })}>
                🔁 Repetir
              </button>
            </div>
          </div>
          <div className="review-actions">
            <Btn label={p('Todavía no', 'Դեռ ոչ')} icon="🔁" variant="soft" onClick={next} />
            <Btn
              label={p('¡Ya lo sé!', 'Արդեն գիտեմ։')}
              icon="✓"
              onClick={() => {
                sfx.success();
                markDifficult(card, false);
                setKnown((k) => k + 1);
                next();
              }}
            />
          </div>
        </>
      )}
      <div style={{ height: 60 }} />
    </div>
  );
}
