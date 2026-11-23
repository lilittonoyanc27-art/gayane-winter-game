import type { CSSProperties } from 'react';

export interface Look {
  skin?: string;
  hair?: string;
  style?: 'bun' | 'short' | 'long' | 'bob' | 'pony';
  top?: string; // uniform / jacket
  shirt?: string;
  accent?: string; // scarf or tie
  tie?: boolean;
  cap?: string;
  glasses?: boolean;
  beard?: boolean;
  apron?: string;
}

export const LOOKS: Record<string, Look> = {
  agente: { skin: '#e8c2a4', hair: '#3b2720', style: 'bun', top: '#1f2b46', shirt: '#fff', accent: '#8a2a45' },
  seguridad: { skin: '#c99272', hair: '#1d1a19', style: 'short', top: '#2d3a55', shirt: '#dfe6f2', tie: true, accent: '#1f2b46', beard: true },
  azafata: { skin: '#f0cdb3', hair: '#6b4a32', style: 'bun', top: '#6e1a33', shirt: '#fff', accent: '#e3d3bf', cap: '#6e1a33' },
  azafato: { skin: '#d9a888', hair: '#2a201c', style: 'short', top: '#6e1a33', shirt: '#fff', tie: true, accent: '#1f2b46' },
  barista: { skin: '#e6b99a', hair: '#24201e', style: 'short', top: '#efe4d6', shirt: '#efe4d6', apron: '#3b2c26', beard: true },
  recepcion: { skin: '#f2d2bc', hair: '#8a5a3a', style: 'bob', top: '#1f2b46', shirt: '#fff', accent: '#c9a24a' },
  camarero: { skin: '#d6a07f', hair: '#1f1a18', style: 'short', top: '#111', shirt: '#fff', tie: true, accent: '#111' },
  dependienta: { skin: '#e9c0a3', hair: '#2a1d18', style: 'long', top: '#e3d3bf', shirt: '#e3d3bf', accent: '#6e1a33', glasses: true },
  amiga: { skin: '#e7bc9c', hair: '#a8693f', style: 'long', top: '#34456b', shirt: '#efe4d6' },
  taxista: { skin: '#cf9a78', hair: '#555', style: 'short', top: '#3a3a3a', shirt: '#cfcfcf', beard: true, glasses: true },
  pasajero: { skin: '#f1d0b8', hair: '#c9a57a', style: 'short', top: '#4d6b5b', shirt: '#efe4d6', glasses: true },
  taquilla: { skin: '#e0b090', hair: '#3a2a22', style: 'pony', top: '#b0394f', shirt: '#fff' },
};

/** Elegant adult bust (head and shoulders) for staff and friends. */
export function Person({ look, className, style, talking }: { look: Look; className?: string; style?: CSSProperties; talking?: boolean }) {
  const L = { skin: '#eac3a6', hair: '#3a2a22', style: 'short', top: '#1f2b46', shirt: '#fff', ...look };
  const long = L.style === 'long' || L.style === 'pony';
  return (
    <svg viewBox="0 0 160 190" className={'person ' + (talking ? 'talking ' : '') + (className || '')} style={style} aria-hidden>
      {long && <path d="M44 60 C36 110 40 150 52 166 L108 166 C120 150 124 110 116 60 Z" fill={L.hair} />}
      {/* shoulders */}
      <path d="M18 190 C20 150 44 132 80 130 C116 132 140 150 142 190 Z" fill={L.top} />
      <path d="M62 132 L80 160 L98 132 Z" fill={L.shirt} />
      {L.apron && <path d="M50 150 L110 150 L114 190 L46 190 Z" fill={L.apron} />}
      {L.tie && <path d="M76 140 L84 140 L86 176 L80 184 L74 176 Z" fill={L.accent} />}
      {!L.tie && L.accent && <path d="M60 134 Q80 150 100 134 L96 146 Q80 158 64 146 Z" fill={L.accent} />}
      <rect x="70" y="104" width="20" height="30" rx="8" fill={L.skin} />
      {/* head */}
      <ellipse cx="80" cy="74" rx="30" ry="36" fill={L.skin} />
      <ellipse cx="50" cy="78" rx="4" ry="7" fill={L.skin} />
      <ellipse cx="110" cy="78" rx="4" ry="7" fill={L.skin} />
      {/* hair */}
      {L.style === 'short' && <path d="M50 66 Q50 34 80 34 Q112 34 110 66 Q104 50 88 48 Q70 54 56 52 Z" fill={L.hair} />}
      {(L.style === 'bun' || L.style === 'bob' || long) && <path d="M49 74 Q46 32 80 32 Q114 32 111 74 Q106 50 92 46 Q76 56 54 54 Z" fill={L.hair} />}
      {L.style === 'bun' && <circle cx="80" cy="30" r="13" fill={L.hair} />}
      {L.style === 'bob' && <path d="M49 70 Q46 104 58 108 L60 76 Z M111 70 Q114 104 102 108 L100 76 Z" fill={L.hair} />}
      {L.style === 'pony' && <path d="M108 54 Q130 70 118 116 Q112 90 104 70 Z" fill={L.hair} />}
      {L.beard && <path d="M54 84 Q58 112 80 114 Q102 112 106 84 Q98 100 80 100 Q62 100 54 84 Z" fill={L.hair} opacity=".85" />}
      {/* face */}
      <g className="p-eyes" fill="#2b1d1b">
        <ellipse cx="69" cy="76" rx="3.4" ry="3" />
        <ellipse cx="91" cy="76" rx="3.4" ry="3" />
      </g>
      <path d="M62 68 Q69 65 75 68 M85 68 Q91 65 98 68" stroke={L.hair} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M80 80 Q78 88 81 89" stroke="#c99a83" strokeWidth="1.6" fill="none" />
      <path className="p-mouth" d="M72 96 Q80 101 88 96" stroke="#9a4b55" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {L.glasses && <g fill="none" stroke="#2a2230" strokeWidth="1.8"><rect x="60" y="70" width="17" height="12" rx="4" /><rect x="83" y="70" width="17" height="12" rx="4" /><path d="M77 75 H83" /></g>}
      {L.cap && <g><path d="M52 50 Q80 30 108 50 L106 58 L54 58 Z" fill={L.cap} /><rect x="74" y="44" width="12" height="6" rx="2" fill="#c9a24a" /></g>}
    </svg>
  );
}
