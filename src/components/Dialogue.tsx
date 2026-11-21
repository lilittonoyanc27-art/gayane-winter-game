import { useEffect, useRef, useState } from 'react';
import { Phrase, T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { markDifficult } from '../core/store';
import type { P } from '../core/types';
import { shuffle } from '../core/util';

export interface DOption {
  text: P;
  next: string;
  points?: number; // +1 good / 0 neutral / -1 awkward
  reply?: P; // immediate reaction from the other person
}

export interface DNode {
  who: string; // speaker key
  line: P;
  options?: DOption[];
  next?: string;
  end?: boolean;
}

export type Script = Record<string, DNode>;

export interface Speaker {
  name: string;
  avatar: string;
  color: string;
}

interface Msg {
  who: string;
  p: P;
  mine?: boolean;
}

/** Branching conversation: every line is speakable & translatable; options change the story. */
export function Dialogue({
  script,
  start = 'start',
  speakers,
  me = { name: 'Gayane', avatar: '👩🏻', color: '#9c2a4c' },
  onEnd,
  compact,
}: {
  script: Script;
  start?: string;
  speakers: Record<string, Speaker>;
  me?: Speaker;
  onEnd: (points: number, endId: string) => void;
  compact?: boolean;
}) {
  const [nodeId, setNodeId] = useState(start);
  const [log, setLog] = useState<Msg[]>([]);
  const [points, setPoints] = useState(0);
  const pointsRef = useRef(0);
  const [opts, setOpts] = useState<DOption[] | null>(null);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // show a node
  useEffect(() => {
    const n = script[nodeId];
    if (!n) return;
    setTyping(true);
    setOpts(null);
    const t = window.setTimeout(() => {
      setTyping(false);
      setLog((l) => [...l, { who: n.who, p: n.line }]);
      sfx.pop();
      speak(n.line);
      if (n.options) setOpts(shuffle(n.options));
      else if (n.end) timers.current.push(window.setTimeout(() => onEnd(pointsRef.current, nodeId), 2200));
      else if (n.next) timers.current.push(window.setTimeout(() => setNodeId(n.next!), 2400));
    }, 700);
    timers.current.push(t);
  }, [nodeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [log, opts, typing]);

  const choose = (o: DOption) => {
    sfx.click();
    setOpts(null);
    setLog((l) => [...l, { who: 'me', p: o.text, mine: true }]);
    speak(o.text);
    const pts = points + (o.points || 0);
    setPoints(pts);
    pointsRef.current = pts;
    if ((o.points || 0) < 0) markDifficult(o.text, true);
    const go = () => setNodeId(o.next);
    if (o.reply) {
      timers.current.push(
        window.setTimeout(() => {
          const cur = script[nodeId];
          setLog((l) => [...l, { who: cur.who, p: o.reply! }]);
          speak(o.reply!);
          timers.current.push(window.setTimeout(go, 2600));
        }, 1700),
      );
    } else timers.current.push(window.setTimeout(go, 1500));
  };

  const sp = (k: string) => (k === 'me' ? me : speakers[k]);
  const cur = script[nodeId];

  return (
    <div className={'dialogue ' + (compact ? 'compact' : '')}>
      <div className="chat">
        {log.map((m, i) => {
          const s = sp(m.who);
          return (
            <div key={i} className={'msg ' + (m.mine ? 'mine' : '')}>
              <div className="avatar" style={{ background: s.color }}>
                {s.avatar}
              </div>
              <div className="msg-body">
                <div className="msg-name">{s.name}</div>
                <Phrase p={m.p} />
              </div>
            </div>
          );
        })}
        {typing && cur && (
          <div className="msg">
            <div className="avatar" style={{ background: sp(cur.who).color }}>
              {sp(cur.who).avatar}
            </div>
            <div className="msg-body typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {opts && (
        <div className="d-options pop-in">
          <div className="d-opt-title">
            <T p={{ es: '¿Qué contestas?', hy: 'Ի՞նչ ես պատասխանում։' }} />
          </div>
          {opts.map((o) => (
            <div key={o.text.es} className="d-opt">
              <button className="choice" onClick={() => choose(o)}>
                <T p={o.text} />
              </button>
              <button className="tool" onClick={() => speak(o.text)} aria-label="Escuchar">
                🔊
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
