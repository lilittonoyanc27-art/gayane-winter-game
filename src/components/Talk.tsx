import { useEffect, useMemo, useRef, useState } from 'react';
import { T } from '../core/translate';
import { listenEs, recognitionAvailable, similarity, speak } from '../core/speech';
import { sfx } from '../core/sound';
import { learn, markDifficult, useGame } from '../core/store';
import { levelOk, p, type Level, type P } from '../core/types';
import { shuffle } from '../core/util';
import { WordTiles } from './WordTiles';

/* A conversation node: an NPC line and (optionally) the answers Gayane can give. */
export interface TOpt {
  p: P;
  ok?: boolean; // false = inappropriate answer → NPC reacts with `reply` and asks again
  reply?: P; // NPC reaction to this answer
  next?: string; // branch
  effect?: string; // tells the scene to change the world (give coffee, open table…)
  lv?: Level; // minimum level to show this option
}
export interface TNode {
  id: string;
  who: string;
  line: P;
  opts?: TOpt[];
  next?: string;
  end?: boolean;
  lv?: Level; // skipped below this level
  effect?: string; // fired when the line is shown
}
export interface Who {
  name: P;
  icon: string;
  tone?: 'staff' | 'me' | 'friend';
}

type Mode = 'elegir' | 'construir' | 'hablar';
interface Msg { who: string; p: P }

const MODES: { id: Mode; icon: string; p: P }[] = [
  { id: 'elegir', icon: '☰', p: p('Elegir', 'Ընտրել') },
  { id: 'construir', icon: '⧉', p: p('Construir', 'Կազմել') },
  { id: 'hablar', icon: '🎙', p: p('Hablar', 'Խոսել') },
];

const ME: Who = { name: p('Gayane', 'Գայանե'), icon: 'G', tone: 'me' };

/**
 * Multi-turn conversation with three ways to answer (choose, build from words, say it aloud).
 * Every line has Escuchar · Traducir · Repetir · Continuar.
 */
export function Talk({ nodes, start, people, onEffect, onEnd, className }: {
  nodes: TNode[];
  start?: string;
  people: Record<string, Who>;
  onEffect?: (effect: string) => void;
  onEnd?: (mistakes: number, endId: string) => void;
  className?: string;
}) {
  const level = useGame((s) => s.level);
  const map = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const resolve = (id: string | undefined): string | undefined => {
    let cur = id;
    for (let guard = 0; cur && guard < 50; guard++) {
      const n = map[cur];
      if (!n) return undefined;
      if (!n.lv || levelOk(n.lv, level)) return cur;
      cur = n.next ?? n.opts?.find((o) => o.ok !== false)?.next;
    }
    return undefined;
  };
  const [id, setId] = useState<string | undefined>(() => resolve(start ?? nodes[0].id));
  const [log, setLog] = useState<Msg[]>([]);
  const [mode, setMode] = useState<Mode>('elegir');
  const [busy, setBusy] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [showHy, setShowHy] = useState(false);
  const [pickTarget, setPickTarget] = useState<TOpt | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const effRef = useRef(onEffect);
  effRef.current = onEffect;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (f: () => void, ms: number) => timers.current.push(window.setTimeout(f, ms));

  const node = id ? map[id] : undefined;
  const opts = useMemo(() => (node?.opts ? shuffle(node.opts.filter((o) => !o.lv || levelOk(o.lv, level))) : []), [id, attempt, level]);
  const okOpts = opts.filter((o) => o.ok !== false);

  // show the NPC line
  useEffect(() => {
    if (!node) return;
    setShowHy(false);
    setPickTarget(okOpts.length === 1 ? okOpts[0] : null);
    setHeard(null);
    setLog((l) => [...l, { who: node.who, p: node.line }]);
    speak(node.line);
    sfx.pop();
    if (node.effect) effRef.current?.(node.effect);
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [log, id, mode, heard]);

  const goNext = (next?: string) => {
    const nid = resolve(next);
    if (!nid) {
      setId(undefined);
      later(() => onEnd?.(mistakes, node?.id ?? ''), 900);
      return;
    }
    setId(nid);
    setAttempt((a) => a + 1);
  };

  const answer = (o: TOpt) => {
    if (busy || !node) return;
    setBusy(true);
    setLog((l) => [...l, { who: 'me', p: o.p }]);
    speak(o.p);
    learn(o.p);
    if (o.ok === false) {
      sfx.error();
      setMistakes((m) => m + 1);
      markDifficult(o.p, true);
      later(() => {
        if (o.reply) { setLog((l) => [...l, { who: node.who, p: o.reply! }]); speak(o.reply); }
        setBusy(false);
        setAttempt((a) => a + 1);
      }, 1300);
      return;
    }
    sfx.success();
    if (o.effect) effRef.current?.(o.effect);
    later(() => {
      if (o.reply) { setLog((l) => [...l, { who: node.who, p: o.reply! }]); speak(o.reply); }
      later(() => { setBusy(false); goNext(o.next ?? node.next); }, o.reply ? 2200 : 400);
    }, 1200);
  };

  const listen = async () => {
    if (!recognitionAvailable()) return;
    setListening(true);
    setHeard(null);
    try {
      const alts = await listenEs();
      setHeard(alts[0]);
      let best: TOpt | null = null;
      let score = 0;
      for (const a of alts) for (const o of okOpts) { const s = similarity(a, o.p.es); if (s > score) { score = s; best = o; } }
      if (best && score >= 0.6) answer(best);
      else { sfx.error(); setMistakes((m) => m + 1); }
    } catch {
      setHeard('—');
    }
    setListening(false);
  };

  const sp = (w: string) => (w === 'me' ? ME : people[w]);
  const waitingContinue = node && !node.opts && !busy;

  return (
    <div className={'talk ' + (className || '')}>
      <div className="talk-log">
        {log.map((m, i) => {
          const s = sp(m.who);
          const last = i === log.length - 1 && m.who !== 'me';
          return (
            <div key={i} className={'tmsg ' + (m.who === 'me' ? 'me' : '') + (last ? ' last' : '')}>
              <div className={'tav tone-' + (s?.tone || 'staff')}>{s?.icon}</div>
              <div className="tbody">
                <div className="tname"><T p={s?.name ?? p('', '')} /></div>
                <div className="tline"><T p={m.p} /></div>
                {last && showHy && <div className="hy">{m.p.hy}</div>}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {node && (
        <div className="talk-tools">
          <button className="tool" onClick={() => speak(node.line)}>🔊 <T p={p('Escuchar', 'Լսել')} /></button>
          <button className={'tool ' + (showHy ? 'on' : '')} onClick={() => { setShowHy((v) => !v); learn(node.line); }}>Ա <T p={p('Traducir', 'Թարգմանել')} /></button>
          <button className="tool" onClick={() => speak(node.line, { slow: true })}>↻ <T p={p('Repetir', 'Կրկնել')} /></button>
          {waitingContinue && (
            <button className="tool tool-go" onClick={() => (sfx.click(), goNext(node.next))}><T p={p('Continuar', 'Շարունակել')} /> →</button>
          )}
        </div>
      )}

      {node && node.opts && !busy && (
        <div className="talk-answer pop-in">
          <div className="talk-modes" role="tablist">
            {MODES.map((m) => (
              <button key={m.id} className={'tmode ' + (mode === m.id ? 'on' : '')} onClick={() => (sfx.click(), setMode(m.id))}>
                <span aria-hidden>{m.icon}</span> <T p={m.p} />
              </button>
            ))}
          </div>

          {mode === 'elegir' && (
            <div className="t-opts">
              {opts.map((o) => (
                <div key={o.p.es} className="t-opt">
                  <button className="choice" onClick={() => answer(o)}><T p={o.p} /></button>
                  <button className="tool mini" aria-label="Escuchar" onClick={() => speak(o.p)}>🔊</button>
                </div>
              ))}
            </div>
          )}

          {mode === 'construir' && (
            <div className="t-build">
              {okOpts.length > 1 && (
                <div className="t-pick">
                  <T p={p('¿Qué quieres decir?', 'Ի՞նչ ես ուզում ասել։')} className="muted" />
                  <div className="t-pick-row">
                    {okOpts.map((o) => (
                      <button key={o.p.es} className={'lchip ' + (pickTarget === o ? 'on' : '')} onClick={() => setPickTarget(o)}><T p={o.p} /></button>
                    ))}
                  </div>
                </div>
              )}
              {pickTarget && (
                <WordTiles
                  key={pickTarget.p.es + attempt}
                  target={pickTarget.p}
                  extra={(opts.find((o) => o.ok === false)?.p.es.replace(/[.!?¡¿,]/g, '').split(/\s+/) ?? []).filter((w) => !pickTarget.p.es.includes(w)).slice(0, 3)}
                  onResult={(ok) => (ok ? answer(pickTarget) : (sfx.error(), setMistakes((m) => m + 1)))}
                />
              )}
            </div>
          )}

          {mode === 'hablar' && (
            <div className="t-speak">
              {recognitionAvailable() ? (
                <>
                  <button className={'mic ' + (listening ? 'on' : '')} onClick={listen} disabled={listening} aria-label="Hablar">🎙</button>
                  <div className="t-speak-help">
                    {listening ? <T p={p('Te escucho. Habla en español.', 'Լսում եմ։ Խոսիր իսպաներեն։')} />
                      : heard ? <span>«{heard}»{heard !== '—' && <> · <T p={p('Inténtalo otra vez o elige una respuesta.', 'Փորձիր կրկին կամ ընտրիր պատասխանը։')} /></>}</span>
                        : <T p={p('Pulsa el micrófono y di tu respuesta. Puedes decir, por ejemplo:', 'Սեղմիր խոսափողը և ասա պատասխանդ։ Օրինակ՝')} />}
                    {!listening && (
                      <ul className="t-examples">
                        {okOpts.slice(0, 2).map((o) => <li key={o.p.es}><T p={o.p} /> <button className="tool mini" onClick={() => speak(o.p)}>🔊</button></li>)}
                      </ul>
                    )}
                  </div>
                </>
              ) : (
                <T p={p('Este navegador no reconoce la voz. Usa «Elegir» o «Construir».', 'Այս դիտարկիչը չի ճանաչում խոսքը։ Օգտագործիր «Ընտրել» կամ «Կազմել»։')} className="muted" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
