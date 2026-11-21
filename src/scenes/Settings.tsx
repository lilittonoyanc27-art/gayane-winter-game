import { useState } from 'react';
import { Btn, Confirm, Instruction, SceneHeader, go } from '../components/UI';
import { T } from '../core/translate';
import { speak, speechAvailable } from '../core/speech';
import { resetProgress, setLevel, setSettings, totalStars, useGame } from '../core/store';
import { LEVELS, p, type P } from '../core/types';

function Toggle({ label, on, set }: { label: P; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="set-row">
      <T p={label} />
      <button className={'switch ' + (on ? 'on' : '')} onClick={() => set(!on)} aria-pressed={on}>
        <i />
      </button>
    </div>
  );
}

export function Settings() {
  const s = useGame((x) => x.settings);
  const level = useGame((x) => x.level);
  const stars = useGame((x) => totalStars(x));
  const learnedN = useGame((x) => Object.keys(x.learned).length);
  const done = useGame((x) => Object.keys(x.stars).length);
  const [confirm, setConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  return (
    <div className="scene scene-settings">
      <SceneHeader title={p('Ajustes', 'Կարգավորումներ')} icon="⚙️" />
      <div className="settings-card">
        <h3>
          <T p={p('Mi progreso', 'Իմ առաջընթացը')} />
        </h3>
        <div className="stat-row">
          <div className="stat">
            <b>★ {stars}</b>
            <T p={p('estrellas', 'աստղ')} />
          </div>
          <div className="stat">
            <b>{done}</b>
            <T p={p('niveles superados', 'անցած մակարդակ')} />
          </div>
          <div className="stat">
            <b>{learnedN}</b>
            <T p={p('expresiones', 'արտահայտություն')} />
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h3>
          <T p={p('Nivel de español', 'Իսպաներենի մակարդակ')} />
        </h3>
        <div className="lp-row">
          {LEVELS.map((l) => (
            <button key={l} className={'lvl ' + (l === level ? 'on' : '')} onClick={() => setLevel(l)}>
              <b>{l}</b>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <h3>
          <T p={p('Sonido y voz', 'Ձայն և խոսք')} />
        </h3>
        <Toggle label={p('Leer las instrucciones en voz alta', 'Բարձրաձայն կարդալ հրահանգները')} on={s.autoVoice} set={(v) => setSettings({ autoVoice: v })} />
        <Toggle label={p('Efectos de sonido', 'Ձայնային էֆեկտներ')} on={s.sound} set={(v) => setSettings({ sound: v })} />
        <Toggle label={p('Música de fondo', 'Ֆոնային երաժշտություն')} on={s.music} set={(v) => setSettings({ music: v })} />
        <div className="set-row">
          <T p={p('Velocidad de la voz', 'Խոսքի արագություն')} />
          <input type="range" min={0.6} max={1.2} step={0.05} value={s.rate} onChange={(e) => setSettings({ rate: Number(e.target.value) })} />
          <button className="tool" onClick={() => speak(p('Hola, soy Gayane. ¡Hace mucho frío fuera!', 'Բարև, ես Գայանեն եմ։ Դրսում շատ ցուրտ է։'))}>
            🔊
          </button>
        </div>
        {!speechAvailable() && (
          <div className="warn">
            <T p={p('Tu navegador no tiene voz. Prueba con Chrome, Edge o Safari.', 'Քո դիտարկիչը ձայն չունի։ Փորձիր Chrome, Edge կամ Safari։')} />
          </div>
        )}
      </div>

      <div className="settings-card">
        <h3>
          <T p={p('Cómo traducir', 'Ինչպես թարգմանել')} />
        </h3>
        <Instruction p={p('Toca cualquier texto en español para ver la traducción al armenio. En los botones, mantén pulsado o activa el modo «Ա».', 'Հպիր ցանկացած իսպաներեն տեքստի՝ հայերեն թարգմանությունը տեսնելու համար։ Կոճակների վրա երկար սեղմիր կամ միացրու «Ա» ռեժիմը։')} icon="Ա" auto={false} />
      </div>

      <div className="settings-card danger">
        <h3>
          <T p={p('Reiniciar el progreso', 'Զրոյացնել առաջընթացը')} />
        </h3>
        <T p={p('Se borrarán las estrellas, el diccionario y las frases difíciles.', 'Կջնջվեն աստղերը, բառարանը և դժվար արտահայտությունները։')} as="div" />
        <Btn label={p('Borrar todo mi progreso', 'Ջնջել ամբողջ առաջընթացս')} icon="🗑️" variant="danger" onClick={() => setConfirm(true)} />
        {resetDone && <T p={p('Progreso borrado.', 'Առաջընթացը ջնջված է։')} className="ok-text" />}
      </div>

      {confirm && (
        <Confirm
          q={p('¿Seguro que quieres borrar todo tu progreso? No se puede deshacer.', 'Համոզվա՞ծ ես, որ ուզում ես ջնջել ամբողջ առաջընթացդ։ Հնարավոր չի լինի վերականգնել։')}
          onYes={() => {
            resetProgress();
            setConfirm(false);
            setResetDone(true);
          }}
          onNo={() => setConfirm(false)}
        />
      )}
      <div className="center-row">
        <Btn label={p('Volver al inicio', 'Վերադառնալ սկիզբ')} icon="🏠" variant="soft" onClick={() => go('title')} />
      </div>
      <div style={{ height: 60 }} />
    </div>
  );
}
