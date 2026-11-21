import type { ClothId } from './Gayane';

const shapes: Record<string, JSX.Element> = {
  abrigo: (
    <g>
      <path d="M20 8 Q32 4 44 8 L56 22 L50 28 L46 22 L48 60 L34 60 L32 14 L30 60 L16 60 L18 22 L14 28 L8 22 Z" fill="#e2c8a8" stroke="#b9946c" strokeWidth="2" />
      <circle cx="28" cy="28" r="2" fill="#7a4f33" /><circle cx="36" cy="28" r="2" fill="#7a4f33" />
      <circle cx="28" cy="40" r="2" fill="#7a4f33" /><circle cx="36" cy="40" r="2" fill="#7a4f33" />
    </g>
  ),
  chaqueta: (
    <g>
      <path d="M20 10 Q32 6 44 10 L56 24 L50 30 L46 24 L46 46 L34 48 L32 14 L30 48 L18 46 L18 24 L14 30 L8 24 Z" fill="#bba6dc" stroke="#8d76b8" strokeWidth="2" />
      <rect x="20" y="34" width="8" height="6" rx="1" fill="#9c86c6" /><rect x="36" y="34" width="8" height="6" rx="1" fill="#9c86c6" />
    </g>
  ),
  jersey: (
    <g>
      <path d="M20 10 Q32 6 44 10 L58 26 L52 32 L46 24 L46 52 L18 52 L18 24 L12 32 L6 26 Z" fill="#8f2648" stroke="#5e1530" strokeWidth="2" />
      <path d="M18 48 H46" stroke="#5e1530" strokeWidth="3" />
      <path d="M32 28 c-4 -5 -10 0 0 7 c10 -7 4 -12 0 -7z" fill="#f6b6cc" />
    </g>
  ),
  camiseta: (
    <path d="M20 12 Q32 8 44 12 L56 20 L50 28 L44 24 L44 52 L20 52 L20 24 L14 28 L8 20 Z" fill="#ffd0e0" stroke="#f3a5c2" strokeWidth="2" />
  ),
  vestido: (
    <g>
      <path d="M24 8 L40 8 L42 22 L54 58 Q32 62 10 58 L22 22 Z" fill="#eea0bf" stroke="#c75e88" strokeWidth="2" />
      <path d="M22 24 Q32 28 42 24" stroke="#c75e88" strokeWidth="3" fill="none" />
    </g>
  ),
  falda: (
    <g>
      <path d="M20 14 L44 14 L54 52 Q32 58 10 52 Z" fill="#8f2648" stroke="#5e1530" strokeWidth="2" />
      <path d="M20 18 H44" stroke="#5e1530" strokeWidth="3" />
    </g>
  ),
  pantalones: (
    <g>
      <path d="M18 6 L46 6 L48 58 L36 58 L32 20 L28 58 L16 58 Z" fill="#3f5d8a" stroke="#2f4a73" strokeWidth="2" />
    </g>
  ),
  calcetines: (
    <g>
      <path d="M14 6 H26 V40 Q26 50 18 50 H8 Q4 50 6 44 L14 38 Z" fill="#f6b6cc" stroke="#e99ab6" strokeWidth="2" />
      <path d="M38 12 H50 V46 Q50 56 42 56 H32 Q28 56 30 50 L38 44 Z" fill="#fff" stroke="#e99ab6" strokeWidth="2" />
      <path d="M14 14 H26 M14 22 H26 M38 20 H50 M38 28 H50" stroke="#e99ab6" strokeWidth="3" />
    </g>
  ),
  botas: (
    <g fill="#7a3b2e">
      <path d="M10 10 H24 V46 L30 50 Q32 56 28 56 H8 Q6 56 6 50 L10 46 Z" />
      <path d="M36 10 H50 V46 L56 50 Q58 56 54 56 H34 Q32 56 32 50 L36 46 Z" />
      <path d="M10 13 H24 M36 13 H50" stroke="#f3e6d6" strokeWidth="5" />
    </g>
  ),
  sandalias: (
    <g>
      <ellipse cx="18" cy="40" rx="10" ry="18" fill="#f2c79a" stroke="#c98a55" strokeWidth="2" />
      <ellipse cx="46" cy="40" rx="10" ry="18" fill="#f2c79a" stroke="#c98a55" strokeWidth="2" />
      <path d="M10 32 Q18 26 26 32 M38 32 Q46 26 54 32" stroke="#c98a55" strokeWidth="4" fill="none" />
    </g>
  ),
  bufanda: (
    <g>
      <path d="M10 14 Q32 28 54 14 L54 24 Q32 38 10 24 Z" fill="#f48fb1" stroke="#e06690" strokeWidth="2" />
      <path d="M38 26 L44 58 L34 58 L30 28 Z" fill="#f06292" stroke="#e06690" strokeWidth="2" />
      <path d="M34 54 H44" stroke="#fff" strokeWidth="2" />
    </g>
  ),
  guantes: (
    <g fill="#c2185b">
      <path d="M8 22 Q8 10 18 10 Q28 10 28 22 L28 50 L10 50 Z" />
      <ellipse cx="6" cy="32" rx="4" ry="7" />
      <path d="M36 22 Q36 10 46 10 Q56 10 56 22 L56 50 L38 50 Z" />
      <ellipse cx="58" cy="32" rx="4" ry="7" />
      <path d="M10 46 H28 M38 46 H56" stroke="#f8bbd0" strokeWidth="4" />
    </g>
  ),
  gorro: (
    <g>
      <path d="M10 44 Q12 14 32 14 Q52 14 54 44 Z" fill="#c2185b" />
      <rect x="8" y="40" width="48" height="12" rx="6" fill="#f8bbd0" />
      <circle cx="32" cy="12" r="8" fill="#fff" stroke="#f8bbd0" strokeWidth="2" />
    </g>
  ),
  gafas: (
    <g>
      <rect x="6" y="24" width="22" height="16" rx="7" fill="#3b2a48" />
      <rect x="36" y="24" width="22" height="16" rx="7" fill="#3b2a48" />
      <path d="M28 30 H36" stroke="#3b2a48" strokeWidth="3" />
      <path d="M10 28 L16 26" stroke="#fff" strokeWidth="2" opacity=".6" />
    </g>
  ),
};

export function ClothIcon({ id, size = 56 }: { id: ClothId; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      {shapes[id]}
    </svg>
  );
}
