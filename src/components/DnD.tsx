import type { CSSProperties, ReactNode } from 'react';
import { useDraggable, useDropTarget, type Payload } from '../core/dnd';

export function Drag({ kind, id, children, className, style, onTap, disabled }: { kind: string; id: string; children: ReactNode; className?: string; style?: CSSProperties; onTap?: () => void; disabled?: boolean }) {
  const down = useDraggable({ kind, id }, { onTap, disabled, ghost: <div className="ghost-item">{children}</div> });
  return (
    <div className={'drag-src ' + (className || '')} style={style} onPointerDown={down} role="button" tabIndex={0}>
      {children}
    </div>
  );
}

export function Drop({ id, accept, onDrop, children, className, style }: { id: string; accept: (p: Payload) => boolean; onDrop: (p: Payload) => void; children?: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useDropTarget(id, accept, (pl) => onDrop(pl));
  return (
    <div ref={ref} className={'drop ' + (className || '')} style={style}>
      {children}
    </div>
  );
}
