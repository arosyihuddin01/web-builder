import React, { useEffect, useRef } from 'react';
import { EditorProvider, useEditor } from './state/EditorContext';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { Layers } from './components/Layers';
import type { EditorNode } from './state/types';

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || (el as any).isContentEditable) return true;
  return false;
}

function findParent(root: EditorNode, id: string, parent: EditorNode | null = null): EditorNode | null {
  if (root.id === id) return parent;
  for (const c of root.children ?? []) {
    const r = findParent(c, id, root);
    if (r) return r;
  }
  return null;
}

function findNode(root: EditorNode, id: string): EditorNode | null {
  if (root.id === id) return root;
  for (const c of root.children ?? []) {
    const r = findNode(c, id);
    if (r) return r;
  }
  return null;
}

function KeyboardBindings({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const { tree, selection, select, deleteSelection, duplicateSelection, undo, redo } = useEditor();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!el.contains(e.target as Node)) return;
      if (isEditableTarget(e.target)) return;
      const meta = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
      const shift = e.shiftKey;
      const key = e.key;

      const current = selection[selection.length - 1];
      const parent = current ? findParent(tree as any, current) : null;
      const siblings = parent?.children ?? (tree.children ?? []);
      const idx = current ? siblings.findIndex((c) => c.id === current) : -1;

      const addToSelection = (id: string) => {
        const set = new Set(selection);
        set.add(id);
        select(Array.from(set));
      };

      const replaceSelection = (id: string) => select([id]);

      // Undo/redo
      if (meta && !shift && (key === 'z' || key === 'Z')) { e.preventDefault(); undo(); return; }
      if ((meta && shift && (key === 'z' || key === 'Z')) || (!navigator.platform.includes('Mac') && e.ctrlKey && key.toLowerCase() === 'y')) { e.preventDefault(); redo(); return; }

      // Duplicate/Delete
      if (meta && !shift && key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelection(); return; }
      if (!meta && !shift && (key === 'Delete' || key === 'Backspace')) { e.preventDefault(); deleteSelection(); return; }

      // Escape clears selection
      if (key === 'Escape') { select([]); return; }

      if (!current) return;

      // Arrow navigation
      if (key === 'ArrowLeft') {
        const p = findParent(tree as any, current);
        if (p) { e.preventDefault(); replaceSelection(p.id); }
        return;
      }
      if (key === 'ArrowRight') {
        const n = findNode(tree as any, current);
        if (n && n.children && n.children.length) { e.preventDefault(); replaceSelection(n.children[0].id); }
        return;
      }
      if (key === 'ArrowUp') {
        if (idx > 0) {
          e.preventDefault();
          const target = siblings[idx - 1].id;
          if (shift) addToSelection(target); else replaceSelection(target);
        }
        return;
      }
      if (key === 'ArrowDown') {
        if (idx >= 0 && idx < siblings.length - 1) {
          e.preventDefault();
          const target = siblings[idx + 1].id;
          if (shift) addToSelection(target); else replaceSelection(target);
        }
        return;
      }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [containerRef, tree, selection, select, deleteSelection, duplicateSelection, undo, redo]);

  return null;
}

export function EditorShell() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <EditorProvider>
      <div ref={containerRef} className="w-full h-full min-h-[600px] grid gap-2 p-2 editor-responsive" tabIndex={0}
        style={{
          gridTemplateColumns: '260px 1fr 320px',
          gridTemplateRows: '1fr 220px',
          gridTemplateAreas: `"palette canvas inspector" "layers canvas inspector"`
        }}
      >
        <div style={{ gridArea: 'palette' }} className="min-h-0"><Palette /></div>
        <div style={{ gridArea: 'canvas' }} className="min-h-0"><Canvas /></div>
        <div style={{ gridArea: 'inspector' }} className="min-h-0"><Inspector /></div>
        <div style={{ gridArea: 'layers' }} className="min-h-0"><Layers /></div>
      </div>
      <KeyboardBindings containerRef={containerRef} />
      {/* Responsive fallback: stack panels on narrow screens */}
      <style>
        {`
        @media (max-width: 1024px) {
          .editor-responsive { grid-template-columns: 1fr !important; grid-template-rows: auto !important; grid-template-areas: none !important; }
        }
      `}
      </style>
    </EditorProvider>
  );
}
