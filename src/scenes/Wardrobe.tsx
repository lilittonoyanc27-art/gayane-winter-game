import { useMemo, useState } from 'react';
import { Gayane, type ClothId, type Mood } from '../components/Gayane';
import { ClothIcon } from '../components/ClothIcon';
import { WeatherWindow } from '../components/Snow';
import { Btn, Feedback, Instruction, Reward, SceneHeader, Steps, starsFor, type Fb } from '../components/UI';
import { CLOTHES, OCCASION, WEATHER_P, W_TASKS, checkOutfit, clothById, equip } from '../data/wardrobe';
import { useDraggable, useDropTarget } from '../core/dnd';
import { T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { markDifficult, useGame } from '../core/store';
import { levelOk, p } from '../core/types';

function ClothCard({ id, worn, onWear }: { id: ClothId; worn: boolean; onWear: () => void }) {
  const c = clothById(id);
  const down = useDraggable(
    { kind: 'cloth', id },
    {
      ghost: (
        <div className="cloth-ghost">
          <ClothIcon id={id} size={72} />
        </div>
      ),
      onTap: onWear,
      onStart: () => speak(c.name),
    },
  );
  return (
    <div className={'cloth-card ' + (worn ? 'worn' : '')}>
      <div className="cloth-img drag-src" onPointerDown={down} role="button" aria-label={c.name.es}>
        <ClothIcon id={id} />
        {worn && <span className="worn-check">✓</span>}
      </div>
      <T p={c.name} className="cloth-name" />
    </div>
  );
}

export function Wardrobe() {
  const level = useGame((s) => s.level);
  const tasks = useMemo(() => W_TASKS.filter((t) => levelOk(t.level, level)), [level]);
  const [ti, setTi] = useState(() => Math.max(0, tasks.findIndex((t) => levelOk(t.level, level) && t.level === level)));
  const task = tasks[ti % tasks.length];
  const [wear, setWear] = useState<ClothId[]>(['pijama']);
  const [fb, setFb] = useState<Fb | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [mood, setMood] = useState<Mood>('happy');
  const [sparkle, setSparkle] = useState(0);

  const put = (id: ClothId) => {
    if (wear.includes(id)) return remove(id);
    setWear((w) => equip(w, id));
    setFb(null);
    setMood('happy');
    setSparkle((s) => s + 1);
    sfx.drop();
    speak(clothById(id).putOn);
  };
  const remove = (id: ClothId) => {
    setWear((w) => w.filter((x) => x !== id));
    sfx.pop();
    speak(clothById(id).takeOff);
  };

  const dropRef = useDropTarget('mirror', (pl) => pl.kind === 'cloth', (pl) => put(pl.id as ClothId));

  const check = () => {
    const problems = checkOutfit(wear.filter((x) => x !== 'pijama'), task);
    if (wear.includes('pijama'))
      problems.unshift(p('¡Todavía llevas el pijama! Vístete primero.', 'Դեռ գիշերազգեստով ես։ Նախ հագնվիր։'));
    if (problems.length === 0) {
      setFb({ ok: true, p: p('¡Perfecto! Estás preparada para salir.', 'Կատարյալ է։ Դու պատրաստ ես դուրս գալու։') });
      setMood('happy');
      window.setTimeout(() => setDone(true), 1400);
    } else {
      setMistakes((m) => m + 1);
      setMood('think');
      problems.forEach((pr) => markDifficult(pr, true));
      setFb({ ok: false, p: problems[0], extra: problems.slice(1, 3) });
    }
  };

  const next = () => {
    setTi((i) => (i + 1) % tasks.length);
    setWear(['pijama']);
    setFb(null);
    setMistakes(0);
    setDone(false);
  };

  const occ = OCCASION[task.occasion];
  const worn = wear.filter((x) => x !== 'pijama');

  return (
    <div className="scene scene-wardrobe">
      <SceneHeader title={p('¿Qué me pongo hoy?', 'Ի՞նչ հագնեմ այսօր')} icon="👗" />
      <Steps total={tasks.length} cur={ti % tasks.length} />
      <Instruction p={task.prompt} icon={occ.icon} who={p('Tarea', 'Առաջադրանք')} />

      <div className="wardrobe-layout">
        <div className="mirror-area">
          <div className="weather-col">
            <WeatherWindow weather={task.weather} className="ward-window" />
            <div className="weather-tag">
              <T p={WEATHER_P[task.weather]} />
            </div>
            <div className="occ-tag">
              {occ.icon} <T p={occ.name} />
            </div>
          </div>
          <div className="mirror" ref={dropRef}>
            <div className="mirror-glass">
              <Gayane wear={wear} mood={mood} className="mirror-girl" />
              <div className="sparkles" key={sparkle}>
                {sparkle > 0 && ['✨', '💗', '✨'].map((s, i) => <span key={i}>{s}</span>)}
              </div>
            </div>
            <div className="mirror-hint">
              <T p={p('Arrastra la ropa hasta Gayane', 'Քաշիր հագուստը մինչև Գայանե')} />
            </div>
          </div>
        </div>

        <div className="closet">
          <div className="closet-top">
            <T p={p('El armario', 'Զգեստապահարան')} />
          </div>
          <div className="closet-grid">
            {CLOTHES.map((c) => (
              <ClothCard key={c.id} id={c.id} worn={wear.includes(c.id)} onWear={() => put(c.id)} />
            ))}
          </div>
        </div>
      </div>

      <div className="worn-bar">
        <T p={p('Llevo puesto:', 'Հագել եմ՝')} className="worn-label" />
        {worn.length === 0 && <T p={p('el pijama', 'գիշերազգեստ')} className="chip" />}
        {worn.map((id) => (
          <button key={id} className="chip chip-x" onClick={() => remove(id)}>
            <T p={clothById(id).name} /> ✕
          </button>
        ))}
      </div>

      <div className="action-bar">
        <Btn label={p('Quitarlo todo', 'Հանել ամբողջը')} variant="soft" icon="↺" onClick={() => setWear(['pijama'])} />
        <Btn label={p('¡Lista! Salir', 'Պատրաստ եմ։ Դուրս գալ')} icon="🚪" onClick={check} />
      </div>

      <Feedback fb={fb} onClose={() => setFb(null)} />
      {done && (
        <Reward
          id={'wardrobe:' + task.id}
          stars={starsFor(mistakes)}
          message={p('¡Qué elegante! Ya puedes salir.', 'Ինչ նրբագեղ է։ Արդեն կարող ես դուրս գալ։')}
          onNext={next}
          onAgain={() => {
            setWear(['pijama']);
            setDone(false);
            setFb(null);
            setMistakes(0);
          }}
        />
      )}
    </div>
  );
}
