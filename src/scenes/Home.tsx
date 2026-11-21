import { useEffect, useRef, useState } from 'react';
import { Gayane, type Mood } from '../components/Gayane';
import { Snow, WeatherWindow } from '../components/Snow';
import { Btn, SceneHeader, go } from '../components/UI';
import { T } from '../core/translate';
import { speak } from '../core/speech';
import { sfx } from '../core/sound';
import { p, type P, type SceneId } from '../core/types';
import { useGame } from '../core/store';

type RoomId = 'dormitorio' | 'vestidor' | 'salon' | 'cocina';

interface Obj {
  id: string;
  room: RoomId;
  icon: string;
  x: number; // % within room
  y: number; // % from bottom
  size: number; // rem
  label: P;
  say: P;
  game?: SceneId;
  toggle?: boolean;
}

const ROOMS: { id: RoomId; name: P }[] = [
  { id: 'dormitorio', name: p('El dormitorio', 'Ննջասենյակ') },
  { id: 'vestidor', name: p('El vestidor', 'Հանդերձարան') },
  { id: 'salon', name: p('El salón', 'Հյուրասենյակ') },
  { id: 'cocina', name: p('La cocina', 'Խոհանոց') },
];

const OBJS: Obj[] = [
  { id: 'cama', room: 'dormitorio', icon: '🛏️', x: 30, y: 8, size: 3.6, label: p('La cama', 'Մահճակալ'), say: p('Buenos días. ¡Qué bien he dormido!', 'Բարի լույս։ Ինչ լավ եմ քնել։'), game: 'morning' },
  { id: 'lampara', room: 'dormitorio', icon: '🪔', x: 75, y: 30, size: 2.2, label: p('La lámpara', 'Լամպ'), say: p('Enciendo la lámpara.', 'Միացնում եմ լամպը։'), toggle: true },
  { id: 'osito', room: 'dormitorio', icon: '🧸', x: 62, y: 8, size: 2, label: p('El osito', 'Արջուկ'), say: p('Mi osito de peluche se llama Copito.', 'Իմ փափուկ արջուկի անունը Կոպիտո է։') },
  { id: 'armario', room: 'vestidor', icon: '🚪', x: 30, y: 8, size: 3.8, label: p('El armario', 'Զգեստապահարան'), say: p('¿Qué me pongo hoy?', 'Ի՞նչ հագնեմ այսօր։'), game: 'wardrobe' },
  { id: 'espejo', room: 'vestidor', icon: '🪞', x: 72, y: 14, size: 3, label: p('El espejo', 'Հայելի'), say: p('Me miro en el espejo. ¡Hoy estoy muy contenta!', 'Նայում եմ հայելուն։ Այսօր շատ ուրախ եմ։') },
  { id: 'arbol', room: 'salon', icon: '🎄', x: 14, y: 8, size: 3.8, label: p('El árbol de Navidad', 'Տոնածառ'), say: p('Enciendo las luces del árbol.', 'Միացնում եմ տոնածառի լույսերը։'), toggle: true },
  { id: 'adornos', room: 'salon', icon: '📦', x: 24, y: 5, size: 2, label: p('Decorar la casa', 'Զարդարել տունը'), say: p('Voy a decorar mi habitación.', 'Զարդարելու եմ սենյակս։'), game: 'decorate' },
  { id: 'sofa', room: 'salon', icon: '🛋️', x: 66, y: 8, size: 3.6, label: p('El sofá con la manta', 'Բազմոց՝ վերմակով'), say: p('Me siento en el sofá con mi manta suave.', 'Նստում եմ բազմոցին իմ փափուկ վերմակով։') },
  { id: 'regalo', room: 'salon', icon: '🎁', x: 89, y: 5, size: 2.2, label: p('Una caja misteriosa', 'Խորհրդավոր տուփ'), say: p('¿Qué es esta caja? ¡Hay una nota!', 'Ի՞նչ տուփ է սա։ Մի գրություն կա։'), game: 'mystery' },
  { id: 'mesa', room: 'salon', icon: '🫖', x: 44, y: 38, size: 2, label: p('Invitar a mis amigas', 'Հրավիրել ընկերուհիներիս'), say: p('Voy a invitar a mis amigas a merendar.', 'Ընկերուհիներիս կհրավիրեմ թեյի։'), game: 'friends' },
  { id: 'cocina', room: 'cocina', icon: '🍳', x: 30, y: 8, size: 3.4, label: p('La cocina', 'Վառարան'), say: p('Voy a preparar chocolate caliente.', 'Պատրաստվում եմ տաք շոկոլադ պատրաստել։'), game: 'kitchen' },
  { id: 'taza', room: 'cocina', icon: '☕', x: 58, y: 36, size: 2, label: p('Una taza de té', 'Մի բաժակ թեյ'), say: p('Me encanta el té con limón cuando hace frío.', 'Սիրում եմ կիտրոնով թեյ, երբ ցուրտ է։') },
  { id: 'bolsa', room: 'cocina', icon: '🛍️', x: 78, y: 8, size: 2.6, label: p('Ir de compras', 'Գնումներ անել'), say: p('La nevera está casi vacía. Tengo que ir a la tienda.', 'Սառնարանը համարյա դատարկ է։ Պետք է գնամ խանութ։'), game: 'shop' },
];

export function Home() {
  const [room, setRoom] = useState<RoomId>('salon');
  const [x, setX] = useState(45);
  const [walking, setWalking] = useState(false);
  const [bubble, setBubble] = useState<P | null>(null);
  const [mood, setMood] = useState<Mood>('happy');
  const [on, setOn] = useState<Record<string, boolean>>({ arbol: true, lampara: true });
  const timer = useRef<number>();
  const stars = useGame((s) => s.stars);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const walkTo = (r: RoomId, tx: number, then?: () => void) => {
    window.clearTimeout(timer.current);
    const changing = r !== room;
    setWalking(true);
    if (changing) {
      setRoom(r);
      setX(tx < 50 ? 10 : 90);
    }
    timer.current = window.setTimeout(
      () => {
        setX(tx);
        timer.current = window.setTimeout(() => {
          setWalking(false);
          then?.();
        }, 750);
      },
      changing ? 60 : 0,
    );
  };

  const use = (o: Obj) => {
    sfx.click();
    walkTo(o.room, Math.max(12, Math.min(88, o.x + (o.x > 50 ? -10 : 10))), () => {
      setBubble(o.say);
      speak(o.say);
      setMood('happy');
      if (o.toggle) setOn((s) => ({ ...s, [o.id]: !s[o.id] }));
      if (o.game) timer.current = window.setTimeout(() => go(o.game!), 1500);
    });
  };

  return (
    <div className="scene scene-home">
      <SceneHeader title={p('El invierno mágico de Gayane', 'Գայանեի կախարդական ձմեռը')} icon="❄️" back="title" />
      <div className="home-hint">
        <T p={p('Toca un objeto: Gayane va a caminar hasta allí.', 'Հպիր որևէ առարկայի. Գայանեն կքայլի այնտեղ։')} />
      </div>
      <div className="house">
        <div className="house-roof">
          <Snow n={25} />
        </div>
        <div className="rooms">
          {ROOMS.map((r) => (
            <div key={r.id} className={`room room-${r.id} ${room === r.id ? 'here' : ''}`} onClick={() => walkTo(r.id, 50)}>
              <div className="room-name">
                <T p={r.name} />
              </div>
              {r.id === 'dormitorio' && <WeatherWindow weather="nevando" className="room-window" />}
              {r.id === 'salon' && (
                <>
                  <WeatherWindow weather="nevando" className="room-window" />
                  <div className={'garland ' + (on.arbol ? 'lit' : '')}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <i key={i} style={{ animationDelay: i * 0.15 + 's' }} />
                    ))}
                  </div>
                  <div className="fireplace">
                    <div className="fire">🔥</div>
                  </div>
                </>
              )}
              {r.id === 'cocina' && <WeatherWindow weather="nevando" className="room-window" />}
              {r.id === 'dormitorio' && on.lampara && <div className="lamp-glow" />}
              {OBJS.filter((o) => o.room === r.id).map((o) => (
                <button
                  key={o.id}
                  className={`hobj ${o.game ? 'has-game' : ''} ${o.toggle && on[o.id] ? 'lit' : ''}`}
                  style={{ left: o.x + '%', bottom: o.y + '%', fontSize: o.size + 'rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    use(o);
                  }}
                  aria-label={o.label.es}
                >
                  <span className="hobj-icon">{o.icon}</span>
                  <span className="hobj-label">
                    <T p={o.label} />
                    {o.game && (stars[o.game] || Object.keys(stars).some((k) => k.startsWith(o.game + ':'))) ? ' ★' : ''}
                  </span>
                </button>
              ))}
              {room === r.id && (
                <div className="home-girl" style={{ left: x + '%' }}>
                  {bubble && (
                    <div className="speech-bubble pop-in" key={bubble.es} onClick={(e) => e.stopPropagation()}>
                      <T p={bubble} />
                    </div>
                  )}
                  <Gayane wear={['jersey', 'pantalones', 'calcetines']} walking={walking} mood={mood} />
                </div>
              )}
              <div className="floor" />
            </div>
          ))}
        </div>
        <button className="house-door" onClick={() => (speak(p('¡Voy a salir a la nieve!', 'Դուրս եմ գալիս ձյան մեջ։')), go('snow'))}>
          🚪 <T p={p('Salir a la calle', 'Դուրս գալ փողոց')} />
        </button>
      </div>

      <div className="home-menu">
        <Btn label={p('Todos los juegos', 'Բոլոր խաղերը')} icon="🗺️" onClick={() => go('title')} variant="soft" />
        <Btn label={p('Minijuegos', 'Մինի-խաղեր')} icon="🎲" onClick={() => go('minigames')} />
        <Btn label={p('Mi diccionario', 'Իմ բառարանը')} icon="📖" onClick={() => go('dictionary')} variant="soft" />
        <Btn label={p('Repasar', 'Կրկնել')} icon="🔁" onClick={() => go('review')} variant="soft" />
        <Btn label={p('Ajustes', 'Կարգավորումներ')} icon="⚙️" onClick={() => go('settings')} variant="ghost" />
      </div>
    </div>
  );
}
