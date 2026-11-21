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
