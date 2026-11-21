import { useEffect, useState, type ReactNode } from 'react';
import type { SceneId } from './core/types';
import { setNavListener } from './components/UI';
import { TranslationLayer } from './core/translate';
import { DragLayer } from './core/dnd';
import { useGame } from './core/store';
import { setMusic } from './core/sound';
import { stopSpeech } from './core/speech';
import { Title } from './scenes/Title';
import { Home } from './scenes/Home';
import { Wardrobe } from './scenes/Wardrobe';
import { Kitchen } from './scenes/Kitchen';
import { Decorate } from './scenes/Decorate';
import { SnowDay } from './scenes/SnowDay';
import { Shop } from './scenes/Shop';
import { Friends } from './scenes/Friends';
import { Morning } from './scenes/Morning';
import { Mystery } from './scenes/Mystery';
import { MiniGames } from './scenes/MiniGames';
import { Dictionary, Review } from './scenes/Dictionary';
import { Settings } from './scenes/Settings';

const SCENES: Record<SceneId, () => ReactNode> = {
  title: () => <Title />,
  home: () => <Home />,
  wardrobe: () => <Wardrobe />,
  kitchen: () => <Kitchen />,
  decorate: () => <Decorate />,
  snow: () => <SnowDay />,
  shop: () => <Shop />,
  friends: () => <Friends />,
  morning: () => <Morning />,
  mystery: () => <Mystery />,
  minigames: () => <MiniGames />,
  dictionary: () => <Dictionary />,
  review: () => <Review />,
  settings: () => <Settings />,
};

function initialScene(): SceneId {
  const h = location.hash.replace('#', '') as SceneId;
  return h in SCENES ? h : 'title';
}

export default function App() {
  const [scene, setScene] = useState<SceneId>(initialScene);
  const [key, setKey] = useState(0);
  const music = useGame((s) => s.settings.music);

  useEffect(() => {
    setNavListener((s) => {
      stopSpeech();
      setScene(s);
      setKey((k) => k + 1);
      history.replaceState(null, '', '#' + s);
      window.scrollTo({ top: 0 });
    });
  }, []);

  useEffect(() => {
    setMusic(music);
  }, [music]);

  return (
    <div className="app">
      <main className="scene-wrap fade-in" key={key}>
        {SCENES[scene]()}
      </main>
      <DragLayer />
      <TranslationLayer />
    </div>
  );
}
