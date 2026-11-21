import { useMemo } from 'react';

export type Weather = 'soleado' | 'frio' | 'nevando' | 'ventoso';

/** CSS snowfall: absolutely fills its parent. */
export function Snow({ n = 40, wind = false, className = '' }: { n?: number; wind?: boolean; className?: string }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: n }, () => ({
        left: Math.random() * 100,
        size: 3 + Math.random() * 6,
        dur: 5 + Math.random() * 7,
        delay: -Math.random() * 12,
        op: 0.5 + Math.random() * 0.5,
      })),
    [n],
  );
  return (
    <div className={'snow ' + (wind ? 'snow-wind ' : '') + className} aria-hidden>
      {flakes.map((f, i) => (
        <i
          key={i}
          style={{
            left: f.left + '%',
            width: f.size,
            height: f.size,
            animationDuration: f.dur + 's',
            animationDelay: f.delay + 's',
            opacity: f.op,
          }}
        />
      ))}
    </div>
  );
}

/** A window showing the current weather outside. */
export function WeatherWindow({ weather, className = '', curtains }: { weather: Weather; className?: string; curtains?: 'open' | 'closed' }) {
  return (
    <div className={`wwindow w-${weather} ${className} ${curtains === 'closed' ? 'closed' : ''}`}>
      <div className="wwin-sky">
        {weather === 'soleado' && <div className="sun" />}
        {(weather === 'frio' || weather === 'ventoso') && (
          <>
            <div className="cloud c1" />
            <div className="cloud c2" />
          </>
        )}
        {weather === 'nevando' && <Snow n={30} />}
        {weather === 'ventoso' && (
          <div className="leaves">
            <span>🍃</span>
            <span>❄</span>
            <span>🍂</span>
          </div>
        )}
        {weather === 'frio' && <div className="frost" />}
        <div className="hills" />
        <div className="pines">🌲🌲🌲</div>
      </div>
      <div className="wwin-frame" />
      {curtains && (
        <>
          <div className="curtain left" />
          <div className="curtain right" />
        </>
      )}
    </div>
  );
}
