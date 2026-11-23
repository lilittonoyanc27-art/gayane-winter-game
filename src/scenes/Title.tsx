import { Gayane } from '../components/Gayane';
import { Snow } from '../components/Snow';
import { Btn, go } from '../components/UI';
import { Phrase, T } from '../core/translate';
import { setLevel, totalStars, useGame } from '../core/store';
import { LEVELS, p, type P, type SceneId } from '../core/types';
import { speak } from '../core/speech';

type G = { id: SceneId; n: number; icon: string; title: P; desc: P };
export const WORLD: { title: P; desc: P; games: G[] }[] = [
  { title: p('Viajes', 'Ճամփորդություններ'), desc: p('Del aeropuerto a tu destino.', 'Օդանավակայանից մինչև նպատակակետ։'), games: [
    { id: 'airport', n: 1, icon: '✈️', title: p('El aeropuerto', 'Օդանավակայան'), desc: p('Facturación, control, puerta y café.', 'Գրանցում, ստուգում, դարպաս և սրճարան։') },
    { id: 'plane', n: 2, icon: '🛫', title: p('Dentro del avión', 'Ինքնաթիռում'), desc: p('Tu asiento, la comida y la tripulación.', 'Քո նստատեղը, ուտելիքը և անձնակազմը։') },
    { id: 'hotel', n: 3, icon: '🏨', title: p('En el hotel', 'Հյուրանոցում'), desc: p('Recepción, problemas y desayuno.', 'Ընդունարան, խնդիրներ և նախաճաշ։') },
  ] },
  { title: p('La ciudad', 'Քաղաքը'), desc: p('Situaciones de cada día.', 'Ամենօրյա իրավիճակներ։'), games: [
    { id: 'restaurant', n: 4, icon: '🍽️', title: p('En un restaurante', 'Ռեստորանում'), desc: p('La carta, un problema y la cuenta.', 'Ճաշացանկ, խնդիր և հաշիվ։') },
    { id: 'clothes', n: 5, icon: '🛍️', title: p('En una tienda de ropa', 'Հագուստի խանութում'), desc: p('Tallas, probador y devoluciones.', 'Չափսեր, հանդերձափոխարան և վերադարձ։') },
    { id: 'cafe', n: 6, icon: '☕', title: p('En una cafetería', 'Սրճարանում'), desc: p('Con Ana: trabajo y planes.', 'Աննայի հետ՝ աշխատանք և ծրագրեր։') },
    { id: 'city', n: 7, icon: '🚇', title: p('En la ciudad', 'Քաղաքում'), desc: p('Billetes, rutas y tranvía.', 'Տոմսեր, երթուղիներ և տրամվայ։') },
  ] },
  { title: p('En casa', 'Տանը'), desc: p('La vida en el apartamento de Gayane.', 'Կյանքը Գայանեի բնակարանում։'), games: [
    { id: 'planner', n: 8, icon: '🗓️', title: p('Un día en casa', 'Մի օր տանը'), desc: p('Agenda, cena y limpieza.', 'Օրակարգ, ընթրիք և մաքրություն։') },
  ] },
];

export const GAMES: { id: SceneId; n: number; icon: string; title: P; desc: P }[] = [
  { id: 'wardrobe', n: 1, icon: '👗', title: p('¿Qué me pongo hoy?', 'Ի՞նչ հագնեմ այսօր'), desc: p('Viste a Gayane según el tiempo.', 'Հագցրու Գայանեին՝ ըստ եղանակի։') },
  { id: 'kitchen', n: 2, icon: '☕', title: p('Preparamos chocolate caliente', 'Պատրաստում ենք տաք շոկոլադ'), desc: p('Cocina recetas de invierno.', 'Պատրաստիր ձմեռային բաղադրատոմսեր։') },
  { id: 'decorate', n: 3, icon: '🏠', title: p('Decora tu habitación', 'Զարդարիր սենյակդ'), desc: p('Coloca los objetos: encima, debajo, al lado...', 'Դասավորիր առարկաները՝ վրա, տակ, կողքին...') },
  { id: 'snow', n: 4, icon: '⛄', title: p('Un día de nieve', 'Ձյունառատ օր'), desc: p('Pasea, haz un muñeco de nieve y saca fotos.', 'Զբոսնիր, ձնեմարդ սարքիր և լուսանկարիր։') },
  { id: 'shop', n: 5, icon: '🛍️', title: p('Compras de invierno', 'Ձմեռային գնումներ'), desc: p('Compra, calcula y paga.', 'Գնիր, հաշվիր և վճարիր։') },
  { id: 'friends', n: 6, icon: '🫖', title: p('Una tarde con amigas', 'Մի երեկո ընկերուհիների հետ'), desc: p('Prepara la casa y habla con tus amigas.', 'Պատրաստիր տունը և զրուցիր ընկերուհիներիդ հետ։') },
  { id: 'morning', n: 7, icon: '☀️', title: p('La mañana perfecta', 'Կատարյալ առավոտ'), desc: p('Despiértate y planea tu día.', 'Արթնացիր և պլանավորիր օրդ։') },
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
      <Snow n={18} className="title-snow" />
      <div className="title-hero">
        <div className="title-girl">
          <Gayane wear={['abrigo', 'bufanda', 'pantalones', 'botas']} waving />
        </div>
        <div className="title-text">
          <div className="title-kicker"><T p={p('Simulador de vida en español', 'Կյանքի սիմուլյատոր իսպաներենով')} /></div>
          <h1 className="game-title">
            <T p={p('Gayane · Vida y viajes', 'Գայանե · Կյանք և ճամփորդություններ')} />
          </h1>
          <Phrase p={p('Hola, me llamo Gayane. Trabajo, viajo y vivo mi día a día en español. ¿Me acompañas?', 'Բարև, իմ անունը Գայանե է։ Աշխատում եմ, ճամփորդում և ապրում իմ առօրյան իսպաներենով։ Կուղեկցե՞ս ինձ։')} />
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
            <Btn label={p('Empezar el viaje', 'Սկսել ճամփորդությունը')} icon="✈" onClick={() => go('airport')} />
            <Btn label={p('Mi apartamento', 'Իմ բնակարանը')} icon="🏠" variant="soft" onClick={() => go('home')} />
            <span className="star-pill big">★ {total}</span>
          </div>
        </div>
      </div>

      {WORLD.map((sec) => (
        <section key={sec.title.es} className="world-sec">
          <div className="ws-head"><h2><T p={sec.title} /></h2><T p={sec.desc} className="muted" /></div>
          <div className="game-grid">
            {sec.games.map((g) => (
              <button key={g.id} className="game-card" onClick={() => go(g.id)}>
                <span className="gc-icon">{g.icon}</span>
                <span className="gc-title"><T p={g.title} /></span>
                <span className="gc-desc"><T p={g.desc} /></span>
                <span className="gc-stars">★ {gameStars(g.id)}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <section className="world-sec">
        <div className="ws-head"><h2><T p={p('Invierno en casa', 'Ձմեռը տանը')} /></h2><T p={p('Los juegos de invierno de Gayane.', 'Գայանեի ձմեռային խաղերը։')} className="muted" /></div>
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
      </section>
      <div className="title-footer">
        <Btn label={p('Mi diccionario', 'Իմ բառարանը')} icon="📖" variant="soft" small onClick={() => go('dictionary')} />
        <Btn label={p('Repasar frases difíciles', 'Կրկնել դժվար արտահայտությունները')} icon="🔁" variant="soft" small onClick={() => go('review')} />
        <Btn label={p('Ajustes', 'Կարգավորումներ')} icon="⚙️" variant="ghost" small onClick={() => go('settings')} />
      </div>
      <div className="title-tip">
        <T p={p('Consejo: toca cualquier texto en español para ver la traducción.', 'Խորհուրդ՝ հպիր ցանկացած իսպաներեն տեքստի՝ թարգմանությունը տեսնելու համար։')} />
        
      </div>
    </div>
  );
}
