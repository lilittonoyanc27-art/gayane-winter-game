import type { CSSProperties } from 'react';

export type ClothId =
  | 'abrigo'
  | 'chaqueta'
  | 'jersey'
  | 'camiseta'
  | 'bufanda'
  | 'guantes'
  | 'botas'
  | 'sandalias'
  | 'gorro'
  | 'falda'
  | 'pantalones'
  | 'vestido'
  | 'calcetines'
  | 'gafas'
  | 'pijama';

export type Mood = 'happy' | 'think' | 'sad' | 'surprised' | 'sleep';

const SKIN = '#f6d3bd';
const SKIN_SH = '#e9b79c';
const HAIR = '#4a2a22';
const HAIR_HI = '#6b3d30';

/** Animated SVG heroine. Clothing items are drawn as layers in the right order. */
export function Gayane({
  wear = [],
  mood = 'happy',
  walking,
  waving,
  className,
  style,
  holding,
  lying,
}: {
  wear?: ClothId[];
  mood?: Mood;
  walking?: boolean;
  waving?: boolean;
  className?: string;
  style?: CSSProperties;
  holding?: string;
  lying?: boolean;
}) {
  const w = new Set(wear);
  const dress = w.has('vestido');
  const pj = w.has('pijama');
  return (
    <svg
      viewBox={lying ? '0 0 410 200' : '0 0 200 410'}
      className={'gayane ' + (walking ? 'walking ' : '') + (waving ? 'wave ' : '') + (className || '')}
      style={style}
      aria-label="Gayane"
    >
      <defs>
        <linearGradient id="g-coat" x1="0" x2="1">
          <stop offset="0" stopColor="#e9d3b8" />
          <stop offset="1" stopColor="#d8bc9a" />
        </linearGradient>
        <linearGradient id="g-jersey" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#9c2a4c" />
          <stop offset="1" stopColor="#7a1f3d" />
        </linearGradient>
        <linearGradient id="g-dress" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f2a7c3" />
          <stop offset="1" stopColor="#e584a9" />
        </linearGradient>
        <linearGradient id="g-jacket" x1="0" x2="1">
          <stop offset="0" stopColor="#c8b6e2" />
          <stop offset="1" stopColor="#ad97d3" />
        </linearGradient>
        <pattern id="p-stripes" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#fff" />
          <rect width="8" height="4" fill="#f6b6cc" />
        </pattern>
      </defs>
      <g transform={lying ? 'translate(0,200) rotate(-90)' : undefined}>
      {!lying && <ellipse cx="100" cy="402" rx="52" ry="7" fill="rgba(80,20,40,.15)" />}

      <g className="g-body">
        {/* hair back */}
        <path d="M58 70 C52 120 50 170 62 205 L138 205 C150 170 148 120 142 70 Z" fill={HAIR} />

        {/* legs */}
        <g className="g-leg g-leg-l">
          <path d="M80 228 L98 228 L97 382 L83 382 Z" fill={SKIN} />
        </g>
        <g className="g-leg g-leg-r">
          <path d="M102 228 L120 228 L117 382 L103 382 Z" fill={SKIN} />
        </g>

        {w.has('calcetines') && (
          <g>
            <path d="M82 318 L97 318 L97 386 L82 386 Z" fill="url(#p-stripes)" stroke="#e99ab6" strokeWidth="1" />
            <path d="M103 318 L118 318 L117 386 L103 386 Z" fill="url(#p-stripes)" stroke="#e99ab6" strokeWidth="1" />
          </g>
        )}

        {pj && (
          <g>
            <path d="M76 212 L124 212 L122 380 L104 380 L100 250 L96 380 L78 380 Z" fill="#f7cfe0" />
            {[240, 280, 320, 360].map((y) => (
              <g key={y} fill="#fff">
                <circle cx="88" cy={y} r="3" />
                <circle cx="112" cy={y + 12} r="3" />
              </g>
            ))}
          </g>
        )}

        {w.has('pantalones') && !dress && (
          <g>
            <path d="M76 208 L124 208 L122 384 L103 384 L100 246 L97 384 L78 384 Z" fill="#3f5d8a" />
            <path d="M100 214 L100 246" stroke="#2f4a73" strokeWidth="2" />
            <path d="M78 378 L97 378 M103 378 L122 378" stroke="#2f4a73" strokeWidth="3" />
          </g>
        )}

        {/* shoes / feet */}
        {!w.has('botas') && !w.has('sandalias') && (
          <g fill={w.has('calcetines') ? '#fbe3ec' : SKIN}>
            <ellipse cx="88" cy="388" rx="12" ry="6" />
            <ellipse cx="112" cy="388" rx="12" ry="6" />
          </g>
        )}
        {w.has('sandalias') && (
          <g>
            <ellipse cx="88" cy="389" rx="12" ry="6" fill={w.has('calcetines') ? '#fbe3ec' : SKIN} />
            <ellipse cx="112" cy="389" rx="12" ry="6" fill={w.has('calcetines') ? '#fbe3ec' : SKIN} />
            <path d="M76 393 H100 M100 393 H124" stroke="#e7a86b" strokeWidth="4" strokeLinecap="round" />
            <path d="M82 384 L94 392 M106 384 L118 392" stroke="#e7a86b" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {w.has('botas') && (
          <g>
            <path d="M80 336 L98 336 L98 386 Q98 396 88 396 L72 396 Q68 396 70 390 L80 384 Z" fill="#7a3b2e" />
            <path d="M102 336 L120 336 L120 384 L130 390 Q132 396 128 396 L112 396 Q102 396 102 386 Z" fill="#7a3b2e" />
            <path d="M80 340 H98 M102 340 H120" stroke="#f3e6d6" strokeWidth="7" strokeLinecap="round" />
          </g>
        )}

        {/* torso */}
        <path d="M70 122 Q100 112 130 122 L124 212 L76 212 Z" fill={SKIN} />
        {/* base top (camisole) */}
        {!pj && <path d="M74 136 Q100 128 126 136 L124 214 L76 214 Z" fill="#fff4ea" />}
        {!w.has('pantalones') && !w.has('falda') && !dress && !pj && (
          <path d="M76 206 L124 206 L126 240 L74 240 Z" fill="#c9a7e0" />
        )}
        {pj && <path d="M68 124 Q100 114 132 124 L128 222 L72 222 Z" fill="#f7cfe0" />}

        {/* arms */}
        <g className={waving ? 'g-arm-wave' : ''}>
          <path d="M71 126 Q60 128 58 150 L50 232 Q54 240 62 236 L72 160 Z" fill={SKIN} />
        </g>
        <path d="M129 126 Q140 128 142 150 L150 232 Q146 240 138 236 L128 160 Z" fill={SKIN} />
        <circle cx="55" cy="238" r="8" fill={SKIN} />
        <circle cx="145" cy="238" r="8" fill={SKIN} />

        {w.has('camiseta') && (
          <path d="M70 124 Q100 114 130 124 L146 150 L133 158 L126 146 L124 220 L76 220 L74 146 L67 158 L54 150 Z" fill="#ffd0e0" stroke="#f3a5c2" strokeWidth="1.5" />
        )}
        {w.has('jersey') && (
          <g>
            <path d="M68 124 Q100 112 132 124 Q144 128 146 152 L153 228 L141 230 L130 160 L126 226 L74 226 L70 160 L59 230 L47 228 L54 152 Q56 128 68 124 Z" fill="url(#g-jersey)" />
            <path d="M76 220 H124 M50 224 L58 225 M142 225 L150 224" stroke="#5e1530" strokeWidth="4" />
            <path d="M92 168 c-6 -8 -16 0 0 10 c16 -10 6 -18 0 -10 z" fill="#f6b6cc" transform="translate(8,0)" />
            <path d="M86 120 Q100 128 114 120" stroke="#5e1530" strokeWidth="5" fill="none" />
          </g>
        )}
        {dress && (
          <g>
            <path d="M70 124 Q100 114 130 124 Q142 128 144 152 L151 228 L140 230 L130 162 L126 200 L146 300 Q100 312 54 300 L74 200 L70 162 L60 230 L49 228 L56 152 Q58 128 70 124 Z" fill="url(#g-dress)" />
            <path d="M76 202 Q100 208 124 202" stroke="#c75e88" strokeWidth="4" fill="none" />
            <path d="M58 296 Q100 308 142 296" stroke="#fff" strokeWidth="3" strokeDasharray="4 5" fill="none" />
          </g>
        )}
        {w.has('falda') && !dress && (
          <g>
            <path d="M76 204 L124 204 L142 290 Q100 300 58 290 Z" fill="#8f2648" />
            <path d="M76 208 H124" stroke="#5e1530" strokeWidth="5" />
            <path d="M88 212 L80 290 M100 212 L100 294 M112 212 L120 290" stroke="#6e1b37" strokeWidth="1.5" />
          </g>
        )}

        {w.has('chaqueta') && !w.has('abrigo') && (
          <g>
            <path d="M66 124 Q100 110 134 124 Q148 130 149 154 L156 230 L142 233 L132 164 L130 232 L104 236 L100 140 L96 236 L70 232 L68 164 L58 233 L44 230 L51 154 Q52 130 66 124 Z" fill="url(#g-jacket)" />
            <path d="M100 140 L104 236 M100 140 L96 236" stroke="#8d76b8" strokeWidth="2" />
            <path d="M82 128 L100 150 L118 128" stroke="#8d76b8" strokeWidth="3" fill="none" />
            <rect x="76" y="196" width="14" height="10" rx="2" fill="#9c86c6" />
            <rect x="110" y="196" width="14" height="10" rx="2" fill="#9c86c6" />
          </g>
        )}
        {w.has('abrigo') && (
          <g>
            <path d="M64 122 Q100 108 136 122 Q150 130 151 156 L158 232 L143 235 L134 166 L140 320 Q120 328 104 324 L100 142 L96 324 Q80 328 60 320 L66 166 L57 235 L42 232 L49 156 Q50 130 64 122 Z" fill="url(#g-coat)" />
            <path d="M80 126 L100 158 L120 126" stroke="#b9946c" strokeWidth="4" fill="none" />
            {[178, 214, 250].map((y) => (
              <g key={y} fill="#7a4f33">
                <circle cx="91" cy={y} r="3.5" />
                <circle cx="109" cy={y} r="3.5" />
              </g>
            ))}
            <path d="M66 214 H134" stroke="#b9946c" strokeWidth="5" />
            <path d="M46 226 L56 228 M144 228 L154 226" stroke="#b9946c" strokeWidth="5" />
          </g>
        )}

        {w.has('guantes') && (
          <g fill="#c2185b">
            <path d="M46 228 L64 230 L63 246 Q55 252 47 246 Z" />
            <path d="M136 230 L154 228 L153 246 Q145 252 137 246 Z" />
            <ellipse cx="45" cy="236" rx="4" ry="6" />
            <ellipse cx="155" cy="236" rx="4" ry="6" />
          </g>
        )}

        {holding && (
          <text x="150" y="250" fontSize="30" textAnchor="middle">
            {holding}
          </text>
        )}

        {/* neck & head */}
        <rect x="91" y="98" width="18" height="24" rx="6" fill={SKIN_SH} />
        {w.has('bufanda') && (
          <g>
            <path d="M80 112 Q100 128 120 112 L122 126 Q100 142 78 126 Z" fill="#f48fb1" />
            <path d="M108 124 L114 176 L100 178 L98 128 Z" fill="#f06292" />
            <path d="M100 172 L114 172 M101 177 L114 176" stroke="#fff" strokeWidth="2" />
            <path d="M82 118 Q100 132 118 118" stroke="#fff" strokeWidth="2" strokeDasharray="3 4" fill="none" />
          </g>
        )}
        <g className="g-head">
          <ellipse cx="100" cy="66" rx="33" ry="37" fill={SKIN} />
          <ellipse cx="67" cy="70" rx="5" ry="8" fill={SKIN_SH} />
          <ellipse cx="133" cy="70" rx="5" ry="8" fill={SKIN_SH} />
          {/* face */}
          {mood === 'sleep' ? (
            <g stroke="#3a2420" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <path d="M80 68 Q87 73 94 68" />
              <path d="M106 68 Q113 73 120 68" />
            </g>
          ) : (
            <g className="g-eyes">
              <ellipse cx="87" cy="68" rx="5" ry={mood === 'surprised' ? 7 : 6} fill="#3a2420" />
              <ellipse cx="113" cy="68" rx="5" ry={mood === 'surprised' ? 7 : 6} fill="#3a2420" />
              <circle cx="89" cy="66" r="1.8" fill="#fff" />
              <circle cx="115" cy="66" r="1.8" fill="#fff" />
              <path d="M80 60 L78 57 M83 58 L82 55 M117 58 L118 55 M120 60 L122 57" stroke="#3a2420" strokeWidth="1.5" />
            </g>
          )}
          <path
            d={mood === 'think' ? 'M78 56 Q87 52 94 56 M106 54 Q113 50 122 55' : 'M79 56 Q87 51 95 55 M105 55 Q113 51 121 56'}
            stroke={HAIR}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="80" cy="82" rx="7" ry="4" fill="#f7a6be" opacity=".7" />
          <ellipse cx="120" cy="82" rx="7" ry="4" fill="#f7a6be" opacity=".7" />
          <path d="M100 72 Q98 79 101 80" stroke={SKIN_SH} strokeWidth="2" fill="none" />
          {mood === 'happy' && <path d="M90 87 Q100 96 110 87" stroke="#b03a5b" strokeWidth="3" fill="#e5617f" strokeLinecap="round" />}
          {mood === 'think' && <path d="M92 90 Q100 88 108 91" stroke="#b03a5b" strokeWidth="3" fill="none" strokeLinecap="round" />}
          {mood === 'sad' && <path d="M91 92 Q100 85 109 92" stroke="#b03a5b" strokeWidth="3" fill="none" strokeLinecap="round" />}
          {mood === 'surprised' && <ellipse cx="100" cy="90" rx="5" ry="6" fill="#b03a5b" />}
          {mood === 'sleep' && <path d="M94 89 Q100 92 106 89" stroke="#b03a5b" strokeWidth="2.5" fill="none" />}
          {/* hair front */}
          <path d="M66 62 Q64 24 100 26 Q138 24 136 64 Q128 44 112 40 Q96 52 72 52 Q68 56 66 62 Z" fill={HAIR} />
          <path d="M84 34 Q100 28 120 34" stroke={HAIR_HI} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M66 60 Q60 100 66 130 L74 128 Q68 96 72 66 Z M134 60 Q140 100 134 130 L126 128 Q132 96 128 66 Z" fill={HAIR} />
          {!w.has('gorro') && (
            <g>
              <circle cx="128" cy="40" r="6" fill="#f48fb1" />
              <circle cx="128" cy="40" r="2.5" fill="#fff" />
            </g>
          )}
          {w.has('gafas') && (
            <g>
              <rect x="76" y="60" width="21" height="15" rx="6" fill="#3b2a48" opacity=".9" />
              <rect x="103" y="60" width="21" height="15" rx="6" fill="#3b2a48" opacity=".9" />
              <path d="M97 66 H103 M76 64 L68 62 M124 64 L132 62" stroke="#3b2a48" strokeWidth="2.5" />
              <path d="M80 64 L86 62" stroke="#fff" strokeWidth="2" opacity=".6" />
            </g>
          )}
          {w.has('gorro') && (
            <g>
              <path d="M64 52 Q66 12 100 12 Q134 12 136 52 Z" fill="#c2185b" />
              <rect x="61" y="44" width="78" height="14" rx="7" fill="#f8bbd0" />
              <path d="M70 51 H130" stroke="#fff" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M84 20 L84 44 M100 14 L100 44 M116 20 L116 44" stroke="#a31550" strokeWidth="2" />
              <circle className="pompom" cx="100" cy="10" r="11" fill="#fff" />
            </g>
          )}
        </g>
      </g>
      </g>
    </svg>
  );
}
