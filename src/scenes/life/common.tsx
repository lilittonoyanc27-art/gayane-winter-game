import type { ReactNode } from 'react';
import { Reward, starsFor } from '../../components/UI';
import type { P } from '../../core/types';

export type Done = { id: string; onNext: () => void; onAgain: () => void };
export const Finish = ({ done, mistakes, msg }: { done: Done; mistakes: number; msg: P }) => (
  <Reward id={done.id} stars={starsFor(mistakes)} message={msg} onAgain={done.onAgain} onNext={done.onNext} />
);
/** Illustration on one side, interaction panel on the other (stacks on phones). */
export function LifeGrid({ art, children, className }: { art: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={'life-grid ' + (className || '')}>
      <div className="life-art">{art}</div>
      <div className="life-panel">{children}</div>
    </div>
  );
}

import { useState } from 'react';
import { SceneHeader } from '../../components/UI';
import { MissionMenu, type Mission } from '../../components/Life';
import { T } from '../../core/translate';
import { p } from '../../core/types';

/** A place with several missions (menu → mission → reward → next). */
export function MissionGame({ game, title, icon, missions, intro, extra, render }: {
  game: string; title: P; icon: string; missions: Mission[]; intro?: ReactNode; extra?: ReactNode;
  render: (id: string, done: Done) => ReactNode;
}) {
  const [m, setM] = useState<string | null>(null);
  const [k, setK] = useState(0);
  const idx = missions.findIndex((x) => x.id === m);
  const done = (id: string): Done => ({
    id: `${game}:${id}`,
    onNext: () => { setM(missions[idx + 1]?.id ?? null); setK((x) => x + 1); },
    onAgain: () => setK((x) => x + 1),
  });
  return (
    <div className={'scene scene-' + game}>
      <SceneHeader title={m ? missions[idx].title : title} icon={icon} back="title"
        right={m ? <button className="hdr-btn" onClick={() => setM(null)}>☰ <T p={p('Misiones', 'Առաքելություններ')} /></button> : undefined} />
      {!m && <MissionMenu game={game} missions={missions} onPick={(id) => { setM(id); setK((x) => x + 1); }} intro={intro} extra={extra} />}
      {m && <div key={k}>{render(m, done(m))}</div>}
    </div>
  );
}
