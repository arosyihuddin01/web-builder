export type SizingMode = 'hug' | 'fill' | 'fixed';

export type SizeStyle = {
  // sizing mode per axis
  sizingX?: SizingMode;
  sizingY?: SizingMode;
  // fixed dimensions in pixels if sizing is fixed on an axis
  width?: number;
  height?: number;
  // aspect ratio lock: if true, width/height should maintain the ratio when resized
  aspectRatioLocked?: boolean;
  // explicit ratio to maintain (width / height). If omitted and aspectRatioLocked, derive from width/height.
  aspectRatio?: number;
};

export function resolveSizeModeToClasses(style: SizeStyle): string {
  const classes: string[] = [];
  const sx = style.sizingX ?? 'fixed';
  const sy = style.sizingY ?? 'fixed';
  if (sx === 'fill') classes.push('w-full');
  else if (sx === 'hug') classes.push('w-auto');
  // fixed width uses inline style; no class

  if (sy === 'fill') classes.push('h-full');
  else if (sy === 'hug') classes.push('h-auto');
  // fixed height uses inline style; no class

  return classes.join(' ').trim();
}

export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };

export function computeHugSize(children: Rect[]): Size {
  if (!children || children.length === 0) return { width: 0, height: 0 };
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const c of children) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x + c.width);
    maxY = Math.max(maxY, c.y + c.height);
  }
  return { width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) };
}

export function computeSize(style: SizeStyle, options?: {
  parent?: Size | null;
  children?: Rect[] | null;
}): Size | null {
  const sx = style.sizingX ?? 'fixed';
  const sy = style.sizingY ?? 'fixed';
  const parent = options?.parent ?? null;
  const children = options?.children ?? null;

  const fixedWidth = typeof style.width === 'number' ? style.width : undefined;
  const fixedHeight = typeof style.height === 'number' ? style.height : undefined;

  let width: number | undefined;
  let height: number | undefined;

  if (sx === 'fixed') width = fixedWidth;
  else if (sx === 'fill') width = parent ? parent.width : fixedWidth;
  else if (sx === 'hug') width = children ? computeHugSize(children).width : undefined;

  if (sy === 'fixed') height = fixedHeight;
  else if (sy === 'fill') height = parent ? parent.height : fixedHeight;
  else if (sy === 'hug') height = children ? computeHugSize(children).height : undefined;

  if (style.aspectRatioLocked) {
    const ratio = style.aspectRatio || (fixedWidth && fixedHeight ? fixedWidth / fixedHeight : undefined);
    if (ratio && (width != null || height != null)) {
      // If only one dimension is available, compute the other from ratio
      if (width != null && height == null) height = Math.round(width / ratio);
      else if (height != null && width == null) width = Math.round(height * ratio);
    }
  }

  if (width == null || height == null) return null;
  return { width, height };
}

export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export type ResizeOptions = {
  lockAspectRatio?: boolean;
  fromCenter?: boolean; // alt/option key
};

export function resizeRect(base: Rect, dx: number, dy: number, handle: ResizeHandle, opts: ResizeOptions = {}): Rect {
  // Work on a copy
  let { x, y, width, height } = { ...base };
  const initialAspect = width > 0 && height > 0 ? width / height : null;

  const applyAspect = (newW: number, newH: number): { w: number; h: number } => {
    if (!opts.lockAspectRatio || !initialAspect) return { w: newW, h: newH };
    // Determine which delta is dominant to preserve aspect
    const byWidth = Math.abs(dx) >= Math.abs(dy);
    if (byWidth) return { w: newW, h: Math.max(0, Math.round(newW / initialAspect)) };
    return { w: Math.max(0, Math.round(newH * initialAspect)), h: newH };
  };

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const adjustFromCenter = (side: 'left' | 'right' | 'top' | 'bottom', delta: number) => {
    if (!opts.fromCenter) return delta;
    return delta * 2; // when resizing from center, both sides move
  };

  switch (handle) {
    case 'e': {
      const w = Math.max(0, width + adjustFromCenter('right', dx));
      const { w: w2, h: h2 } = applyAspect(w, height);
      if (opts.fromCenter) x = centerX - w2 / 2;
      width = w2;
      height = h2;
      break;
    }
    case 'w': {
      const w = Math.max(0, width - adjustFromCenter('left', dx));
      const { w: w2, h: h2 } = applyAspect(w, height);
      if (opts.fromCenter) x = centerX - w2 / 2;
      else x = x + (width - w2);
      width = w2;
      height = h2;
      break;
    }
    case 's': {
      const h = Math.max(0, height + adjustFromCenter('bottom', dy));
      const { w: w2, h: h2 } = applyAspect(width, h);
      if (opts.fromCenter) y = centerY - h2 / 2;
      height = h2;
      width = w2;
      break;
    }
    case 'n': {
      const h = Math.max(0, height - adjustFromCenter('top', dy));
      const { w: w2, h: h2 } = applyAspect(width, h);
      if (opts.fromCenter) y = centerY - h2 / 2;
      else y = y + (height - h2);
      height = h2;
      width = w2;
      break;
    }
    case 'se': {
      const w = Math.max(0, width + adjustFromCenter('right', dx));
      const h = Math.max(0, height + adjustFromCenter('bottom', dy));
      const { w: w2, h: h2 } = applyAspect(w, h);
      if (opts.fromCenter) {
        x = centerX - w2 / 2;
        y = centerY - h2 / 2;
      }
      width = w2;
      height = h2;
      break;
    }
    case 'ne': {
      const w = Math.max(0, width + adjustFromCenter('right', dx));
      const h = Math.max(0, height - adjustFromCenter('top', dy));
      const { w: w2, h: h2 } = applyAspect(w, h);
      if (opts.fromCenter) x = centerX - w2 / 2;
      else y = y + (height - h2);
      width = w2;
      height = h2;
      if (opts.fromCenter) y = centerY - h2 / 2;
      break;
    }
    case 'sw': {
      const w = Math.max(0, width - adjustFromCenter('left', dx));
      const h = Math.max(0, height + adjustFromCenter('bottom', dy));
      const { w: w2, h: h2 } = applyAspect(w, h);
      if (opts.fromCenter) y = centerY - h2 / 2;
      else x = x + (width - w2);
      width = w2;
      height = h2;
      if (opts.fromCenter) x = centerX - w2 / 2;
      break;
    }
    case 'nw': {
      const w = Math.max(0, width - adjustFromCenter('left', dx));
      const h = Math.max(0, height - adjustFromCenter('top', dy));
      const { w: w2, h: h2 } = applyAspect(w, h);
      if (opts.fromCenter) {
        x = centerX - w2 / 2;
        y = centerY - h2 / 2;
      } else {
        x = x + (width - w2);
        y = y + (height - h2);
      }
      width = w2;
      height = h2;
      break;
    }
  }

  return { x, y, width, height };
}
