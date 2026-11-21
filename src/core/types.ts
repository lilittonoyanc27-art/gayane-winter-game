/** A Spanish phrase with its Armenian translation. */
export interface P {
  es: string;
  hy: string;
}

export const p = (es: string, hy: string): P => ({ es, hy });

export type Level = 'A1' | 'A2' | 'B1' | 'B2';
export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2'];
export const levelIndex = (l: Level) => LEVELS.indexOf(l);
/** True when an item tagged `item` is suitable for the player level `player`. */
export const levelOk = (item: Level, player: Level) => levelIndex(item) <= levelIndex(player);

export type SceneId =
  | 'title'
  | 'home'
  | 'wardrobe'
  | 'kitchen'
  | 'decorate'
  | 'snow'
  | 'shop'
  | 'friends'
  | 'morning'
  | 'mystery'
  | 'minigames'
  | 'dictionary'
  | 'review'
  | 'settings';
