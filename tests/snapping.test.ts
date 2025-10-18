import { computeGridOverlay, createSpatialIndex, snapRectPosition, snapRectResize, type Rect } from '@src/canvas/snapping';

describe('snapping calculations', () => {
  const rect = (x: number, y: number, w: number, h: number, id?: string): Rect & { id?: string } => ({ x, y, width: w, height: h, id });

  it('snaps position to nearest grid within threshold', () => {
    const r = rect(23, 27, 100, 50, 'a');
    const res = snapRectPosition(r, [], { grid: { enabled: true, spacingX: 10, spacingY: 10 }, guides: { enabled: false, threshold: 4 } });
    expect(res.snapped).toBe(true);
    expect(res.x).toBe(20); // 23 -> 20
    expect(res.y).toBe(30); // 27 -> 30
  });

  it('does not snap to grid when beyond threshold', () => {
    const r = rect(23, 27, 100, 50, 'a');
    const res = snapRectPosition(r, [], { grid: { enabled: true, spacingX: 10, spacingY: 10, threshold: 2 }, guides: { enabled: false, threshold: 2 } });
    expect(res.snapped).toBe(false);
    expect(res.x).toBe(23);
    expect(res.y).toBe(27);
  });

  it('snaps to sibling edge when close', () => {
    const moving = rect(302, 10, 50, 20, 'moving'); // left=302
    const sibling = rect(200, 0, 100, 100, 'sib'); // right=300
    const res = snapRectPosition(moving, [sibling], { guides: { enabled: true, threshold: 4, snapToEdges: true, snapToCenters: true } });
    expect(res.snapped).toBe(true);
    expect(res.x).toBe(300); // left snaps to sibling right
    expect(res.y).toBe(10);
    expect(res.snaps[0].type === 'edge' || res.snaps[0].type === 'container-edge').toBeTruthy();
  });

  it('snaps to sibling center (horizontal) when close', () => {
    const moving = rect(109, 10, 80, 20, 'moving'); // cx=149
    const sibling = rect(100, 0, 100, 100, 'sib'); // cx=150
    const res = snapRectPosition(moving, [sibling], { guides: { enabled: true, threshold: 2, snapToEdges: true, snapToCenters: true } });
    expect(res.snapped).toBe(true);
    expect(res.x).toBe(110); // move right by 1 to align center at 150
    expect(res.y).toBe(10);
    expect(res.snaps[0].type).toBe('center');
  });

  it('snaps to container edge and centers when provided', () => {
    const moving = rect(3, 4, 10, 10, 'moving');
    const container = rect(0, 0, 1000, 1000, 'container');
    const res = snapRectPosition(moving, [], { container, guides: { enabled: true, threshold: 5, snapToEdges: true, snapToCenters: true } });
    expect(res.snapped).toBe(true);
    expect(res.x).toBe(0);
    expect(res.y).toBe(0);
  });

  it('prefers guides over grid on equal distance', () => {
    // Setup so grid and guide are both 1px away; prefer guide
    // moving left=19; grid 20 (delta +1); sibling right at 18 (delta -1)
    const moving = rect(19, 0, 10, 10, 'moving');
    const sibling = rect(0, 0, 18, 10, 'sib'); // right at 18
    const res = snapRectPosition(moving, [sibling], { grid: { enabled: true, spacingX: 10, spacingY: 10, threshold: 2 }, guides: { enabled: true, threshold: 2 } });
    expect(res.snapped).toBe(true);
    // Should snap to 18 (guide) not 20 (grid)
    expect(res.x).toBe(18);
  });

  it('respects toggles: only edges (no centers)', () => {
    const moving = rect(109, 10, 80, 20, 'moving'); // cx=149
    const sibling = rect(100, 0, 100, 100, 'sib'); // cx=150
    const res = snapRectPosition(moving, [sibling], { guides: { enabled: true, threshold: 2, snapToEdges: true, snapToCenters: false } });
    expect(res.snapped).toBe(false); // no edge close, only center would have applied
  });

  it('snaps resized right edge to sibling edge', () => {
    const base = rect(0, 0, 80, 20, 'moving');
    const proposed = { ...base, width: 101 }; // pretend drag to ~101 width so right=101
    const sibling = rect(0, 0, 100, 50, 'sib'); // right=100
    const res = snapRectResize(base, proposed, 'e', [sibling], { guides: { enabled: true, threshold: 2 } });
    expect(res.snapped).toBe(true);
    expect(res.width).toBe(100);
    expect(res.x).toBe(0);
  });

  it('computeGridOverlay returns expected lines count', () => {
    const viewport = rect(0, 0, 100, 100);
    const lines = computeGridOverlay(viewport, { spacingX: 25, spacingY: 25 });
    const vertical = lines.filter(l => l.x1 === l.x2).length;
    const horizontal = lines.filter(l => l.y1 === l.y2).length;
    expect(vertical).toBe(5);
    expect(horizontal).toBe(5);
  });

  it('spatial index narrows candidates without changing result', () => {
    const moving = rect(48, 48, 10, 10, 'moving');
    const siblings: (Rect & { id?: string })[] = [];
    for (let i = 0; i < 1000; i++) {
      const x = (i % 50) * 20;
      const y = Math.floor(i / 50) * 20;
      siblings.push(rect(x, y, 10, 10, `r${i}`));
    }
    // Add a special sibling with edge we will snap to at x=50
    siblings.push(rect(40, 0, 10, 10, 'target')); // right=50

    const naive = snapRectPosition(moving, siblings, { guides: { enabled: true, threshold: 4 } });
    const index = createSpatialIndex(siblings, 64);
    const indexed = snapRectPosition(moving, siblings, { guides: { enabled: true, threshold: 4 }, index });

    expect(indexed.snapped).toBe(naive.snapped);
    expect(indexed.x).toBe(naive.x);
    expect(indexed.y).toBe(naive.y);
  });
});
