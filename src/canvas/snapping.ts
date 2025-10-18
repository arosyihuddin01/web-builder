import type { Rect } from '../schema/style';
export type { Rect } from '../schema/style';

export type Axis = 'x' | 'y';

export type SnapSource = 'grid' | 'edge' | 'center' | 'container-edge' | 'container-center';

export type SnapGuide = {
  axis: Axis;
  value: number; // x or y position of the guide line
  type: SnapSource;
  targetId?: string;
  edge?: 'left' | 'right' | 'top' | 'bottom' | 'hcenter' | 'vcenter';
};

export type SnapEvent = {
  axis: Axis;
  from: number; // the value before snapping (edge or center of the moving item)
  to: number; // the target guide value we snapped to
  type: SnapSource;
  targetId?: string;
  edge?: 'left' | 'right' | 'top' | 'bottom' | 'hcenter' | 'vcenter';
};

export type GridConfig = {
  enabled: boolean;
  spacingX: number;
  spacingY: number;
  threshold?: number; // optional override; if omitted, use guides.threshold
  originX?: number; // default 0 or container.x when container is provided
  originY?: number; // default 0 or container.y when container is provided
};

export type GuidesConfig = {
  enabled: boolean;
  threshold: number; // max distance to snap to a guide
  snapToEdges?: boolean; // default true
  snapToCenters?: boolean; // default true
};

export type SnapOptions = {
  grid?: GridConfig;
  guides?: GuidesConfig;
  container?: (Rect & { id?: string }) | null;
  index?: SpatialIndex | null; // optional prebuilt index for performance
  indexCellSize?: number; // when building an index internally
};

export type SnapResult = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  snapped: boolean;
  snaps: SnapEvent[];
};

export type Line = { x1: number; y1: number; x2: number; y2: number };

export type SpatialIndex = {
  cellSize: number;
  // map cell key to list of indices in `rects`
  map: Map<string, number[]>;
  rects: (Rect & { id?: string })[];
};

export function getRectEdges(r: Rect) {
  const left = r.x;
  const right = r.x + r.width;
  const top = r.y;
  const bottom = r.y + r.height;
  const cx = left + r.width / 2;
  const cy = top + r.height / 2;
  return { left, right, top, bottom, cx, cy };
}

function key(i: number, j: number): string {
  return `${i},${j}`;
}

export function createSpatialIndex(rects: (Rect & { id?: string })[], cellSize = 128): SpatialIndex {
  const map = new Map<string, number[]>();
  for (let idx = 0; idx < rects.length; idx++) {
    const r = rects[idx];
    const i0 = Math.floor(r.x / cellSize);
    const j0 = Math.floor(r.y / cellSize);
    const i1 = Math.floor((r.x + r.width) / cellSize);
    const j1 = Math.floor((r.y + r.height) / cellSize);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const k = key(i, j);
        let arr = map.get(k);
        if (!arr) {
          arr = [];
          map.set(k, arr);
        }
        arr.push(idx);
      }
    }
  }
  return { cellSize, map, rects: rects.slice() };
}

function queryIndex(index: SpatialIndex, area: Rect, padding: number): (Rect & { id?: string })[] {
  const minX = Math.floor((area.x - padding) / index.cellSize);
  const minY = Math.floor((area.y - padding) / index.cellSize);
  const maxX = Math.floor((area.x + area.width + padding) / index.cellSize);
  const maxY = Math.floor((area.y + area.height + padding) / index.cellSize);
  const seen = new Set<number>();
  const out: (Rect & { id?: string })[] = [];
  for (let i = minX; i <= maxX; i++) {
    for (let j = minY; j <= maxY; j++) {
      const k = key(i, j);
      const arr = index.map.get(k);
      if (!arr) continue;
      for (const idx of arr) {
        if (seen.has(idx)) continue;
        seen.add(idx);
        const r = index.rects[idx];
        // quick AABB check with padding
        const rx0 = r.x - padding;
        const ry0 = r.y - padding;
        const rx1 = r.x + r.width + padding;
        const ry1 = r.y + r.height + padding;
        const ax0 = area.x;
        const ay0 = area.y;
        const ax1 = area.x + area.width;
        const ay1 = area.y + area.height;
        if (rx1 >= ax0 && rx0 <= ax1 && ry1 >= ay0 && ry0 <= ay1) {
          out.push(r);
        }
      }
    }
  }
  return out;
}

function nearestGrid(value: number, spacing: number, origin = 0): { target: number; delta: number } {
  if (spacing <= 0 || !isFinite(spacing)) return { target: value, delta: 0 };
  const n = Math.round((value - origin) / spacing);
  const target = origin + n * spacing;
  return { target, delta: target - value };
}

function getGuidePriority(t: SnapSource): number {
  switch (t) {
    case 'container-edge':
      return 0;
    case 'container-center':
      return 1;
    case 'edge':
      return 2;
    case 'center':
      return 3;
    case 'grid':
    default:
      return 4;
  }
}

function chooseBestCandidate(candidates: SnapEvent[]): SnapEvent | null {
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const da = Math.abs(a.to - a.from);
    const db = Math.abs(b.to - b.from);
    if (da !== db) return da - db;
    return getGuidePriority(a.type) - getGuidePriority(b.type);
  });
  return candidates[0];
}

function collectCandidatesForAxis(
  axis: Axis,
  movingEdges: { fromName: 'left' | 'right' | 'top' | 'bottom' | 'hcenter' | 'vcenter'; fromValue: number }[],
  rect: Rect & { id?: string },
  others: (Rect & { id?: string })[],
  options: SnapOptions
): SnapEvent[] {
  const out: SnapEvent[] = [];
  const guides = options.guides ?? { enabled: true, threshold: 5, snapToEdges: true, snapToCenters: true };
  const grid = options.grid ?? { enabled: false, spacingX: 8, spacingY: 8 } as GridConfig;

  const threshold = guides.threshold ?? 5;
  const gridThreshold = grid.threshold ?? threshold;

  const considerGuides = guides.enabled !== false; // default true
  const considerGrid = !!grid.enabled;

  // Sibling and container guides
  if (considerGuides) {
    const includeEdges = guides.snapToEdges !== false; // default true
    const includeCenters = guides.snapToCenters !== false; // default true

    const addLine = (value: number, type: SnapSource, targetId?: string, edge?: SnapGuide['edge']) => {
      for (const m of movingEdges) {
        const delta = value - m.fromValue;
        if (Math.abs(delta) <= threshold) {
          out.push({ axis, from: m.fromValue, to: value, type, targetId, edge: m.fromName });
        }
      }
    };

    // Container first (higher priority)
    const container = options.container ?? null;
    if (container) {
      const ce = getRectEdges(container);
      if (axis === 'x') {
        if (includeEdges) {
          addLine(ce.left, 'container-edge', container.id, 'left');
          addLine(ce.right, 'container-edge', container.id, 'right');
        }
        if (includeCenters) addLine(ce.cx, 'container-center', container.id, 'hcenter');
      } else {
        if (includeEdges) {
          addLine(ce.top, 'container-edge', container.id, 'top');
          addLine(ce.bottom, 'container-edge', container.id, 'bottom');
        }
        if (includeCenters) addLine(ce.cy, 'container-center', container.id, 'vcenter');
      }
    }

    // Siblings
    let candidates: (Rect & { id?: string })[] = others;
    // If an index is provided or dataset is large, query nearby only
    const nearArea: Rect = rect; // we consider proximity around the moving rect
    const idx = options.index;
    if (idx) {
      candidates = queryIndex(idx, nearArea, threshold * 2);
    } else if (others.length > 400 && options.indexCellSize) {
      const built = createSpatialIndex(others, options.indexCellSize);
      candidates = queryIndex(built, nearArea, threshold * 2);
    }

    for (const r of candidates) {
      if (r === rect) continue;
      if (rect.id && r.id && rect.id === r.id) continue;
      const e = getRectEdges(r);
      if (axis === 'x') {
        if (includeEdges) {
          addLine(e.left, 'edge', r.id, 'left');
          addLine(e.right, 'edge', r.id, 'right');
        }
        if (includeCenters) addLine(e.cx, 'center', r.id, 'hcenter');
      } else {
        if (includeEdges) {
          addLine(e.top, 'edge', r.id, 'top');
          addLine(e.bottom, 'edge', r.id, 'bottom');
        }
        if (includeCenters) addLine(e.cy, 'center', r.id, 'vcenter');
      }
    }
  }

  // Grid guides
  if (considerGrid) {
    const originX = options.grid?.originX ?? options.container?.x ?? 0;
    const originY = options.grid?.originY ?? options.container?.y ?? 0;
    const spacingX = Math.max(1, Math.floor(grid.spacingX));
    const spacingY = Math.max(1, Math.floor(grid.spacingY));

    for (const m of movingEdges) {
      if (axis === 'x') {
        const { target } = nearestGrid(m.fromValue, spacingX, originX);
        const delta = target - m.fromValue;
        if (Math.abs(delta) <= gridThreshold) {
          out.push({ axis, from: m.fromValue, to: target, type: 'grid', edge: m.fromName });
        }
      } else {
        const { target } = nearestGrid(m.fromValue, spacingY, originY);
        const delta = target - m.fromValue;
        if (Math.abs(delta) <= gridThreshold) {
          out.push({ axis, from: m.fromValue, to: target, type: 'grid', edge: m.fromName });
        }
      }
    }
  }

  return out;
}

export function snapRectPosition(
  rect: Rect & { id?: string },
  all: (Rect & { id?: string })[],
  options: SnapOptions = {}
): SnapResult {
  const guides = options.guides ?? { enabled: true, threshold: 5, snapToEdges: true, snapToCenters: true };
  const considerGuides = guides.enabled !== false;
  const grid = options.grid ?? { enabled: false, spacingX: 8, spacingY: 8 } as GridConfig;
  const considerGrid = !!grid.enabled;

  if (!considerGuides && !considerGrid) {
    return { x: rect.x, y: rect.y, snapped: false, snaps: [] };
  }

  const e = getRectEdges(rect);
  const movingX = [
    { fromName: 'left' as const, fromValue: e.left },
    { fromName: 'right' as const, fromValue: e.right },
    { fromName: 'hcenter' as const, fromValue: e.cx }
  ];
  const movingY = [
    { fromName: 'top' as const, fromValue: e.top },
    { fromName: 'bottom' as const, fromValue: e.bottom },
    { fromName: 'vcenter' as const, fromValue: e.cy }
  ];

  const others = options.container ? [options.container, ...all] : all;

  const xCandidates = collectCandidatesForAxis('x', movingX, rect, others, options);
  const yCandidates = collectCandidatesForAxis('y', movingY, rect, others, options);

  const bestX = chooseBestCandidate(xCandidates);
  const bestY = chooseBestCandidate(yCandidates);

  let dx = 0;
  let dy = 0;
  const snaps: SnapEvent[] = [];

  if (bestX) {
    dx = bestX.to - bestX.from;
    snaps.push(bestX);
  }
  if (bestY) {
    dy = bestY.to - bestY.from;
    snaps.push(bestY);
  }

  return {
    x: rect.x + dx,
    y: rect.y + dy,
    snapped: snaps.length > 0,
    snaps
  };
}

export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export type ResizeSnapOptions = SnapOptions & {
  minWidth?: number;
  minHeight?: number;
};

export function snapRectResize(
  base: Rect & { id?: string },
  proposed: Rect, // a rect produced by applying the raw resize delta to `base`
  handle: ResizeHandle,
  all: (Rect & { id?: string })[],
  options: ResizeSnapOptions = {}
): SnapResult {
  // Determine which edges moved for the given handle
  const movedX: ('left' | 'right')[] = [];
  const movedY: ('top' | 'bottom')[] = [];
  if (handle.includes('e')) movedX.push('right');
  if (handle.includes('w')) movedX.push('left');
  if (handle.includes('n')) movedY.push('top');
  if (handle.includes('s')) movedY.push('bottom');

  const others = options.container ? [options.container, ...all] : all;
  const movingEdgesX = movedX.map((m) => ({ fromName: (m === 'left' ? 'left' : 'right') as const, fromValue: m === 'left' ? proposed.x : proposed.x + proposed.width }));
  const movingEdgesY = movedY.map((m) => ({ fromName: (m === 'top' ? 'top' : 'bottom') as const, fromValue: m === 'top' ? proposed.y : proposed.y + proposed.height }));

  const xCandidates = collectCandidatesForAxis('x', movingEdgesX, base, others, options);
  const yCandidates = collectCandidatesForAxis('y', movingEdgesY, base, others, options);

  const bestX = chooseBestCandidate(xCandidates);
  const bestY = chooseBestCandidate(yCandidates);

  let x = proposed.x;
  let y = proposed.y;
  let width = proposed.width;
  let height = proposed.height;
  const snaps: SnapEvent[] = [];

  if (bestX && movedX.length) {
    const delta = bestX.to - bestX.from;
    if (movedX.includes('right')) {
      width = Math.max(options.minWidth ?? 0, width + delta);
    }
    if (movedX.includes('left')) {
      const newX = x + delta;
      const newWidth = Math.max(options.minWidth ?? 0, width - delta);
      // ensure width doesn't become negative; adjust x and width accordingly
      if (newWidth >= 0) {
        x = newX;
        width = newWidth;
      }
    }
    snaps.push(bestX);
  }
  if (bestY && movedY.length) {
    const delta = bestY.to - bestY.from;
    if (movedY.includes('bottom')) {
      height = Math.max(options.minHeight ?? 0, height + delta);
    }
    if (movedY.includes('top')) {
      const newY = y + delta;
      const newHeight = Math.max(options.minHeight ?? 0, height - delta);
      if (newHeight >= 0) {
        y = newY;
        height = newHeight;
      }
    }
    snaps.push(bestY);
  }

  return { x, y, width, height, snapped: snaps.length > 0, snaps };
}

export function computeGridOverlay(viewport: Rect, grid: { spacingX: number; spacingY: number; originX?: number; originY?: number }): Line[] {
  const originX = grid.originX ?? 0;
  const originY = grid.originY ?? 0;
  const lines: Line[] = [];

  const xStartIndex = Math.ceil((viewport.x - originX) / grid.spacingX);
  const xEndIndex = Math.floor((viewport.x + viewport.width - originX) / grid.spacingX);
  for (let i = xStartIndex; i <= xEndIndex; i++) {
    const x = originX + i * grid.spacingX;
    lines.push({ x1: x, y1: viewport.y, x2: x, y2: viewport.y + viewport.height });
  }

  const yStartIndex = Math.ceil((viewport.y - originY) / grid.spacingY);
  const yEndIndex = Math.floor((viewport.y + viewport.height - originY) / grid.spacingY);
  for (let j = yStartIndex; j <= yEndIndex; j++) {
    const y = originY + j * grid.spacingY;
    lines.push({ x1: viewport.x, y1: y, x2: viewport.x + viewport.width, y2: y });
  }

  return lines;
}
