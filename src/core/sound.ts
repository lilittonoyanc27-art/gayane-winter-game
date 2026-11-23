import { getState } from './store';

let ctx: AudioContext | null = null;
function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, vol = 0.05, freq = 1200) {
  const c = ac();
  if (!c) return;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination);
  s.start();
}

const on = () => getState().settings.sound;

export const sfx = {
  click: () => on() && tone(660, 0.08, 'triangle', 0.08),
  pick: () => on() && tone(880, 0.1, 'sine', 0.08),
  drop: () => on() && (tone(520, 0.12, 'sine', 0.1), tone(780, 0.12, 'sine', 0.06, 0.05)),
  success: () => on() && [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'sine', 0.1, i * 0.09)),
  error: () => on() && (tone(300, 0.18, 'square', 0.04), tone(240, 0.25, 'square', 0.04, 0.12)),
  sparkle: () => on() && [1318, 1568, 2093].forEach((f, i) => tone(f, 0.25, 'sine', 0.05, i * 0.06)),
  pour: () => on() && noise(1.1, 0.06, 900),
  sizzle: () => on() && noise(0.8, 0.04, 3000),
  pop: () => on() && tone(420, 0.06, 'triangle', 0.1),
  bell: () => on() && [988, 784].forEach((f, i) => tone(f, 0.6, 'sine', 0.12, i * 0.35)),
  ring: () => on() && [0, 0.15, 0.3, 0.45].forEach((d) => tone(1400, 0.1, 'square', 0.03, d)),
  shutter: () => on() && noise(0.15, 0.15, 2500),
  whoosh: () => on() && noise(0.35, 0.05, 600),
  coin: () => on() && (tone(1200, 0.08, 'square', 0.03), tone(1600, 0.15, 'square', 0.03, 0.06)),
  star: () => on() && [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.4, 'triangle', 0.07, i * 0.12)),
  chime: () => on() && [659, 831, 988].forEach((f, i) => tone(f, 0.7, 'sine', 0.1, i * 0.32)),
  beep: () => on() && [0, 0.2, 0.4].forEach((d) => tone(1250, 0.14, 'square', 0.05, d)),
  ding: () => on() && tone(1320, 0.5, 'sine', 0.1),
};

/* ---- gentle music box loop ---- */
let musicTimer: number | undefined;
const melody = [659, 784, 880, 784, 659, 587, 523, 587, 659, 659, 587, 523, 494, 523, 587, 0];
export function setMusic(play: boolean) {
  window.clearInterval(musicTimer);
  if (!play) return;
  let i = 0;
  musicTimer = window.setInterval(() => {
    const f = melody[i % melody.length];
    if (f) tone(f, 0.9, 'sine', 0.035);
    if (i % 4 === 0) tone(f ? f / 2 : 262, 1.4, 'triangle', 0.02);
    i++;
  }, 420);
}
