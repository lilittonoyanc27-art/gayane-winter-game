import { getState, learn } from './store';
import type { P } from './types';

let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  const es = voices.filter((v) => v.lang.toLowerCase().startsWith('es'));
  voice =
    es.find((v) => /es-es/i.test(v.lang) && /female|mujer|monica|lucia|elvira|helena|google/i.test(v.name)) ||
    es.find((v) => /es-es/i.test(v.lang)) ||
    es[0] ||
    null;
}

if (typeof speechSynthesis !== 'undefined') {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

export const speechAvailable = () => typeof speechSynthesis !== 'undefined';

/** Speak a Spanish phrase. `slow` is used by the "Repetir" button. */
export function speak(text: string | P, opts: { slow?: boolean; onEnd?: () => void } = {}) {
  const ph = typeof text === 'string' ? null : text;
  const es = typeof text === 'string' ? text : text.es;
  if (ph) learn(ph);
  if (!speechAvailable()) {
    opts.onEnd?.();
    return;
  }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(es.replace(/[«»]/g, ''));
    u.lang = 'es-ES';
    if (voice) u.voice = voice;
    const base = getState().settings.rate;
    u.rate = opts.slow ? Math.max(0.5, base - 0.3) : base;
    u.pitch = 1.1;
    if (opts.onEnd) u.onend = () => opts.onEnd?.();
    speechSynthesis.speak(u);
  } catch {
    opts.onEnd?.();
  }
}

/** Speak only when automatic voice is enabled in settings. */
export function autoSay(ph: P) {
  if (getState().settings.autoVoice) speak(ph);
  else learn(ph);
}

export function stopSpeech() {
  if (speechAvailable()) speechSynthesis.cancel();
}

/* ---------------- speech recognition (es-ES) ---------------- */
export const recognitionAvailable = () =>
  typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

/** Listen once in Spanish. Resolves with up to 3 alternatives. */
export function listenEs(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!R) return reject(new Error('unsupported'));
    stopSpeech();
    const r = new R();
    r.lang = 'es-ES';
    r.interimResults = false;
    r.maxAlternatives = 3;
    let done = false;
    r.onresult = (e: any) => {
      done = true;
      const alts: string[] = [];
      for (let i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript);
      resolve(alts);
    };
    r.onerror = (e: any) => { if (!done) { done = true; reject(e); } };
    r.onend = () => { if (!done) { done = true; reject(new Error('silence')); } };
    try { r.start(); } catch (err) { reject(err); }
  });
}

const normEs = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:«»"]/g, ' ').replace(/\s+/g, ' ').trim();
/** Similarity 0..1 between what was said and the expected sentence (word overlap, order tolerant). */
export function similarity(said: string, target: string) {
  const a = normEs(said).split(' ').filter(Boolean);
  const b = normEs(target).split(' ').filter(Boolean);
  if (!b.length) return 0;
  const pool = [...a];
  let hit = 0;
  for (const w of b) {
    const i = pool.findIndex((x) => x === w || (w.length > 4 && x.slice(0, 4) === w.slice(0, 4)));
    if (i >= 0) { hit++; pool.splice(i, 1); }
  }
  return hit / Math.max(b.length, a.length * 0.8);
}
