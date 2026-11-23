import { useSyncExternalStore } from 'react';
import type { Level, P } from './types';

export interface PlacedItem {
  id: string;
  x: number; // center x in % of room width
  y: number; // bottom y in % of room height
}

export interface Settings {
  autoVoice: boolean;
  sound: boolean;
  music: boolean;
  rate: number;
}

export interface GameState {
  level: Level;
  stars: Record<string, number>;
  learned: Record<string, { hy: string; seen: number; last: number }>;
  difficult: Record<string, string>;
  settings: Settings;
  decorLayout: PlacedItem[] | null;
  mysteryChapter: number;
  translateMode: boolean;
  trip: Trip;
}

/** State of Gayane's journey (airport → plane → arrival), kept between scenes. */
export interface Trip {
  bagChecked: boolean;
  boardingPass: boolean;
  passedSecurity: boolean;
  gate: string;
  seat: string;
  bought: string[];
  seated: boolean;
  bagCollected: boolean;
}
export const freshTrip = (): Trip => ({ bagChecked: false, boardingPass: false, passedSecurity: false, gate: 'B14', seat: '18A', bought: [], seated: false, bagCollected: false });
export function setTrip(part: Partial<Trip>) {
  setState((s) => ({ ...s, trip: { ...s.trip, ...part } }));
}

const KEY = 'gayane-invierno-v1';

const initial = (): GameState => ({
  level: 'A1',
  stars: {},
  learned: {},
  difficult: {},
  settings: { autoVoice: true, sound: true, music: false, rate: 0.9 },
  decorLayout: null,
  mysteryChapter: 0,
  translateMode: false,
  trip: freshTrip(),
});

function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw);
    const base = initial();
    return { ...base, ...parsed, settings: { ...base.settings, ...(parsed.settings || {}) }, trip: { ...base.trip, ...(parsed.trip || {}) }, translateMode: false };
  } catch {
    return initial();
  }
}

let state: GameState = load();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

function persist() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, 200);
}

export function getState() {
  return state;
}

export function setState(fn: (s: GameState) => GameState) {
  state = fn(state);
  persist();
  listeners.forEach((l) => l());
}

export function useGame<T>(sel: (s: GameState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => sel(state),
  );
}

/* ---------- helpers ---------- */

export function learn(ph: P) {
  if (!ph.es || !ph.hy) return;
  const cur = state.learned[ph.es];
  setState((s) => ({
    ...s,
    learned: { ...s.learned, [ph.es]: { hy: ph.hy, seen: (cur?.seen || 0) + 1, last: Date.now() } },
  }));
}

export function markDifficult(ph: P, on = true) {
  setState((s) => {
    const d = { ...s.difficult };
    if (on) d[ph.es] = ph.hy;
    else delete d[ph.es];
    return { ...s, difficult: d };
  });
}

export function award(id: string, stars: number) {
  setState((s) => ({ ...s, stars: { ...s.stars, [id]: Math.max(s.stars[id] || 0, stars) } }));
}

export function totalStars(s: GameState = state) {
  return Object.values(s.stars).reduce((a, b) => a + b, 0);
}

export function setLevel(level: Level) {
  setState((s) => ({ ...s, level }));
}

export function setSettings(part: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...part } }));
}

export function resetProgress() {
  const keepSettings = state.settings;
  state = { ...initial(), settings: keepSettings };
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  persist();
  listeners.forEach((l) => l());
}
