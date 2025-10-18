import React from 'react';
import type { Rect, ResizeHandle } from '../schema/style';

export type TransformHandlesProps = {
  rect: Rect;
  visible?: boolean;
  onPointerDown?: (handle: ResizeHandle, event: React.PointerEvent<HTMLDivElement>) => void;
  className?: string;
  // keyboard modifiers used by callers to affect logic (e.g., Shift for aspect lock, Alt for center)
  modifiers?: {
    shift?: boolean;
    alt?: boolean;
  };
};

const HANDLE_ORDER: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

// A minimal transform handle overlay that renders 8 handles around a rect
export function TransformHandles({ rect, visible = true, onPointerDown, className }: TransformHandlesProps): JSX.Element | null {
  if (!visible) return null;
  const { x, y, width, height } = rect;
  const size = 8; // px handle size

  const positions: Record<ResizeHandle, React.CSSProperties> = {
    n: { left: x + width / 2 - size / 2, top: y - size / 2, cursor: 'ns-resize' },
    s: { left: x + width / 2 - size / 2, top: y + height - size / 2, cursor: 'ns-resize' },
    e: { left: x + width - size / 2, top: y + height / 2 - size / 2, cursor: 'ew-resize' },
    w: { left: x - size / 2, top: y + height / 2 - size / 2, cursor: 'ew-resize' },
    ne: { left: x + width - size / 2, top: y - size / 2, cursor: 'nesw-resize' },
    nw: { left: x - size / 2, top: y - size / 2, cursor: 'nwse-resize' },
    se: { left: x + width - size / 2, top: y + height - size / 2, cursor: 'nwse-resize' },
    sw: { left: x - size / 2, top: y + height - size / 2, cursor: 'nesw-resize' }
  };

  return (
    <div className={className} data-testid="transform-handles" style={{ position: 'absolute', left: 0, top: 0 }}>
      {HANDLE_ORDER.map((h) => (
        <div
          key={h}
          data-handle={h}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: 2,
            background: 'white',
            border: '1px solid #3b82f6',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.25)',
            ...positions[h]
          }}
          onPointerDown={(e) => onPointerDown?.(h, e)}
          role="button"
          aria-label={`Resize ${h}`}
        />
      ))}
      {/* outline rectangle */}
      <div
        data-handle="outline"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width,
          height,
          pointerEvents: 'none',
          border: '1px dashed rgba(59,130,246,0.8)'
        }}
      />
    </div>
  );
}
