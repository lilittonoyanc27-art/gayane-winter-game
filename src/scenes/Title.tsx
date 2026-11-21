import { Gayane } from '../components/Gayane';
import { Snow } from '../components/Snow';
import { Btn, go } from '../components/UI';
import { Phrase, T } from '../core/translate';
import { setLevel, totalStars, useGame } from '../core/store';
import { LEVELS, p, type P, type SceneId } from '../core/types';
import { speak } from '../core/speech';

export const GAMES: { id: SceneId; n: number; icon: string; title: P; desc: P }[] = [
  { id: 'wardrobe', n: 1, icon: '👗', title: p('¿Qué me pongo hoy?', 'Ի՞նչ հագնեմ այսօր'), desc: p('Viste a Gayane según el tiempo.', 'Հագցրու Գայանեին՝ ըստ եղանակի։') },
  { id: 'kitchen', n: 2, icon: '☕', title: p('Preparamos chocolate caliente', 'Պատրաստում ենք տաք շոկոլադ'), desc: p('Cocina recetas de invierno.', 'Պատրաստիր ձմեռային բաղադրատոմսեր։') },
  { id: 'decorate', n: 3, icon: '🏠', title: p('Decora tu habitación', 'Զարդարիր սենյակդ'), desc: p('Coloca los objetos: encima, debajo, al lado...', 'Դասավորիր առարկաները՝ վրա, տակ, կողքին...') },
  { id: 'snow', n: 4, icon: '⛄', title: p('Un día de nieve', 'Ձյունառատ օր'), desc: p('Pasea, haz un muñeco de nieve y saca fotos.', 'Զբոսնիր, ձնեմարդ սարքիր և լուսանկարիր։') },
  { id: 'shop', n: 5, icon: '🛍️', title: p('Compras de invierno', 'Ձմեռային գնումներ'), desc: p('Compra, calcula y paga.', 'Գնիր, հաշվիր և վճարիր։') },
  { id: 'friends', n: 6, icon: '💕', title: p('Una tarde con amigas', 'Մի երեկո ընկերուհիների հետ'), desc: p('Prepara la casa y habla con tus amigas.', 'Պատրաստիր տունը և զրուցիր ընկերուհիներիդ հետ։') },
  { id: 'morning', n: 7, icon: '🌸', title: p('La mañana perfecta', 'Կատարյալ առավոտ'), desc: p('Despiértate y planea tu día.', 'Արթնացիր և պլանավորիր օրդ։') },
  { id: 'mystery', n: 8, icon: '🎁', title: p('El misterio del regalo', 'Նվերի գաղտնիքը'), desc: p('¿De quién es la caja misteriosa?', 'Ո՞ւմն է խորհրդավոր տուփը։') },
  { id: 'minigames', n: 9, icon: '🎲', title: p('Minijuegos', 'Մինի-խաղեր'), desc: p('Memory, escucha, ordena y mucho más.', 'Հիշողություն, լսիր, դասավորիր և շատ ավելին։') },
];

const LEVEL_DESC: Record<string, P> = {
  A1: p('Principiante', 'Սկսնակ'),
  A2: p('Básico', 'Հիմնական'),
  B1: p('Intermedio', 'Միջին'),
  B2: p('Intermedio alto', 'Միջինից բարձր'),
};

export function Title() {
  const level = useGame((s) => s.level);
  const stars = useGame((s) => s.stars);
  const total = useGame((s) => totalStars(s));
  const gameStars = (id: string) =>
    Object.entries(stars)
      .filter(([k]) => k === id || k.startsWith(id + ':'))
      .reduce((a, [, v]) => a + v, 0);

  return (
    <div className="scene scene-start">
      <Snow n={60} className="title-snow" />
      <div className="title-hero">
        <div className="title-girl">
          <Gayane wear={['abrigo', 'gorro', 'bufanda', 'guantes', 'pantalones', 'botas']} waving />
        </div>
        <div className="title-text">
          <div className="title-flakes">❄️ 💗 ❄️</div>
          <h1 className="game-title">
            <T p={p('El invierno mágico de Gayane', 'Գայանեի կախարդական ձմեռը')} />
          </h1>
          <Phrase p={p('¡Hola! Me llamo Gayane. ¿Aprendemos español juntas este invierno?', 'Բարև։ Իմ անունը Գայանե է։ Այս ձմեռ միասին իսպաներե՞ն սովորենք։')} />
          <div className="level-pick">
            <T p={p('Elige tu nivel:', 'Ընտրիր քո մակարդակը՝')} className="lp-label" />
            <div className="lp-row">
              {LEVELS.map((l) => (
                <button key={l} className={'lvl ' + (l === level ? 'on' : '')} onClick={() => (setLevel(l), speak(LEVEL_DESC[l]))}>
                  <b>{l}</b>
                  <T p={LEVEL_DESC[l]} />
                </button>
              ))}
            </div>
          </div>
          <div className="title-actions">
            <Btn label={p('Entrar en casa', 'Մտնել տուն')} icon="🏠" onClick={() => go('home')} />
            <span className="star-pill big">★ {total}</span>
          </div>
        </div>
      </div>

      <div className="game-grid">
        {GAMES.map((g) => (
          <button key={g.id} className="game-card" onClick={() => go(g.id)}>
            <span className="gc-n">{g.n}</span>
            <span className="gc-icon">{g.icon}</span>
            <span className="gc-title">
              <T p={g.title} />
            </span>
            <span className="gc-desc">
              <T p={g.desc} />
            </span>
            <span className="gc-stars">★ {gameStars(g.id)}</span>
          </button>
        ))}
      </div>
      <div className="title-footer">
        <Btn label={p('Mi diccionario', 'Իմ բառարանը')} icon="📖" variant="soft" small onClick={() => go('dictionary')} />
        <Btn label={p('Repasar frases difíciles', 'Կրկնել դժվար արտահայտությունները')} icon="🔁" variant="soft" small onClick={() => go('review')} />
        <Btn label={p('Ajustes', 'Կարգավորումներ')} icon="⚙️" variant="ghost" small onClick={() => go('settings')} />
      </div>
      <div className="title-tip">
        <T p={p('Consejo: toca cualquier texto en español para ver la traducción.', 'Խորհուրդ՝ հպիր ցանկացած իսպաներեն տեքստի՝ թարգմանությունը տեսնելու համար։')} />
        <span className="hy-note"> · Կոճակների վրա՝ երկար սեղմիր կամ միացրու «Ա» ռեժիմը։</span>
      </div>
    </div>
  );
}
