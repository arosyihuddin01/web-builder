import type { Document, Layout, Node, ParagraphNode, TextNode } from './types';
import type { ColorKey, SpacingKey } from '../theme/tokens';

export type AlignMode = 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom';
export type Axis = 'x' | 'y';

export type Action =
  | { type: 'toggleBold' }
  | { type: 'setTextColor'; color: ColorKey }
  | { type: 'setParagraphSpacing'; spacing: SpacingKey }
  | { type: 'setSelection'; indices: number[] }
  | { type: 'alignSelection'; mode: AlignMode }
  | { type: 'distributeSelection'; axis: Axis }
  | { type: 'setNodeLayout'; index: number; layout: Partial<Layout> };

export function applyAction(doc: Document, action: Action): Document {
  switch (action.type) {
    case 'setSelection': {
      const nextSel = Array.from(new Set(action.indices.filter((i) => i >= 0 && i < doc.children.length))).sort((a, b) => a - b);
      return { ...doc, selection: nextSel };
    }
    case 'setNodeLayout': {
      const idx = action.index;
      if (idx < 0 || idx >= doc.children.length) return doc;
      const nextChildren = doc.children.map((n, i) => (i === idx ? applyPartialLayout(n, action.layout) : n));
      return { ...doc, children: nextChildren };
    }
    case 'alignSelection':
      return alignSelection(doc, action.mode);
    case 'distributeSelection':
      return distributeSelection(doc, action.axis);
    default:
      return {
        ...doc,
        children: doc.children.map((n) => transformNode(n, action))
      };
  }
}

function transformNode(node: Node, action: Action): Node {
  switch (node.type) {
    case 'text':
      return transformText(node as TextNode, action);
    case 'paragraph': {
      let next: ParagraphNode = { ...node, children: node.children.map((c) => transformNode(c, action)) };
      if (action.type === 'setParagraphSpacing') next = { ...next, spacing: action.spacing };
      return next;
    }
    case 'heading':
    case 'list':
    case 'listItem':
    case 'link':
      return { ...node, children: (node as any).children?.map((c: Node) => transformNode(c, action)) } as any;
    default:
      return node;
  }
}

function transformText(node: TextNode, action: Action): TextNode {
  if (action.type === 'toggleBold') {
    const marks = new Set(node.marks ?? []);
    if (marks.has('bold')) marks.delete('bold');
    else marks.add('bold');
    return { ...node, marks: Array.from(marks) };
  }
  if (action.type === 'setTextColor') {
    return { ...node, color: action.color };
  }
  return node;
}

// --- Alignment & distribution utilities ---

type Frame = { x: number; y: number; width: number; height: number };

function getFrame(node: Node): Frame {
  const f = (node as any).layout?.frame ?? {};
  return {
    x: Number.isFinite(f.x) ? (f.x as number) : 0,
    y: Number.isFinite(f.y) ? (f.y as number) : 0,
    width: Number.isFinite(f.width) ? Math.max(0, f.width as number) : 0,
    height: Number.isFinite(f.height) ? Math.max(0, f.height as number) : 0
  };
}

function setFrame(node: Node, frame: Partial<Frame>): Node {
  const current = (node as any).layout?.frame ?? {};
  const nextLayout: Layout = {
    ...(node as any).layout,
    frame: { ...current, ...frame }
  };
  return { ...(node as any), layout: nextLayout } as Node;
}

function applyPartialLayout(node: Node, layout: Partial<Layout>): Node {
  const curr: Layout = (node as any).layout ?? {};
  const next: Layout = {
    ...curr,
    ...layout,
    frame: { ...(curr.frame ?? {}), ...(layout.frame ?? {}) },
    constraints: {
      ...(curr.constraints ?? {}),
      ...(layout.constraints ?? {}),
      pin: { ...(curr.constraints?.pin ?? {}), ...(layout.constraints?.pin ?? {}) }
    }
  };
  return { ...(node as any), layout: next } as Node;
}

function alignSelection(doc: Document, mode: AlignMode): Document {
  const sel = (doc.selection ?? []).filter((i) => i >= 0 && i < doc.children.length);
  if (sel.length < 2) return doc;
  const frames = sel.map((i) => ({ i, f: getFrame(doc.children[i]) }));
  const minX = Math.min(...frames.map((e) => e.f.x));
  const maxR = Math.max(...frames.map((e) => e.f.x + e.f.width));
  const minY = Math.min(...frames.map((e) => e.f.y));
  const maxB = Math.max(...frames.map((e) => e.f.y + e.f.height));
  const centerX = Math.round((minX + maxR) / 2);
  const centerY = Math.round((minY + maxB) / 2);

  const nextChildren = doc.children.map((n, idx) => {
    const found = frames.find((e) => e.i === idx);
    if (!found) return n;
    const { f } = found;
    switch (mode) {
      case 'left':
        return setFrame(n, { x: minX });
      case 'right':
        return setFrame(n, { x: maxR - f.width });
      case 'centerX':
        return setFrame(n, { x: centerX - Math.round(f.width / 2) });
      case 'top':
        return setFrame(n, { y: minY });
      case 'bottom':
        return setFrame(n, { y: maxB - f.height });
      case 'centerY':
        return setFrame(n, { y: centerY - Math.round(f.height / 2) });
      default:
        return n;
    }
  });

  return { ...doc, children: nextChildren };
}

function distributeSelection(doc: Document, axis: Axis): Document {
  const sel = (doc.selection ?? []).filter((i) => i >= 0 && i < doc.children.length);
  if (sel.length < 3) return doc; // need at least 3 to distribute
  const frames = sel.map((i) => ({ i, f: getFrame(doc.children[i]) }));
  if (axis === 'x') {
    const sorted = frames.sort((a, b) => a.f.x - b.f.x);
    const minX = sorted[0].f.x;
    const maxR = Math.max(...sorted.map((e) => e.f.x + e.f.width));
    const totalWidth = sorted.reduce((sum, e) => sum + e.f.width, 0);
    const gaps = sorted.length - 1;
    const gap = gaps > 0 ? (maxR - minX - totalWidth) / gaps : 0;
    let cursor = minX;
    const positions = new Map<number, number>();
    sorted.forEach((e, idx) => {
      if (idx === 0) {
        positions.set(e.i, Math.round(cursor));
        cursor += e.f.width + gap;
      } else if (idx === sorted.length - 1) {
        positions.set(e.i, Math.round(maxR - e.f.width));
      } else {
        positions.set(e.i, Math.round(cursor));
        cursor += e.f.width + gap;
      }
    });
    const nextChildren = doc.children.map((n, idx) => (positions.has(idx) ? setFrame(n, { x: positions.get(idx)! }) : n));
    return { ...doc, children: nextChildren };
  } else {
    const sorted = frames.sort((a, b) => a.f.y - b.f.y);
    const minY = sorted[0].f.y;
    const maxB = Math.max(...sorted.map((e) => e.f.y + e.f.height));
    const totalHeight = sorted.reduce((sum, e) => sum + e.f.height, 0);
    const gaps = sorted.length - 1;
    const gap = gaps > 0 ? (maxB - minY - totalHeight) / gaps : 0;
    let cursor = minY;
    const positions = new Map<number, number>();
    sorted.forEach((e, idx) => {
      if (idx === 0) {
        positions.set(e.i, Math.round(cursor));
        cursor += e.f.height + gap;
      } else if (idx === sorted.length - 1) {
        positions.set(e.i, Math.round(maxB - e.f.height));
      } else {
        positions.set(e.i, Math.round(cursor));
        cursor += e.f.height + gap;
      }
    });
    const nextChildren = doc.children.map((n, idx) => (positions.has(idx) ? setFrame(n, { y: positions.get(idx)! }) : n));
    return { ...doc, children: nextChildren };
  }
}
