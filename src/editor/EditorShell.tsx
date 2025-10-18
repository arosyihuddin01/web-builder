import React, { useMemo, useState } from 'react';
import { EditorProvider } from './state/EditorContext';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { Layers } from './components/Layers';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { EditorPersistence } from './components/EditorPersistence';
import { PageSwitcherModal } from './components/PageSwitcherModal';
import { createEditorStore } from '../store/editorStore';
import type { EditorStore } from '../store/editorStore';

export function EditorShell({ store: providedStore }: { store?: EditorStore }) {
  const store = useMemo(() => providedStore ?? createEditorStore(), [providedStore]);
  const [showPages, setShowPages] = useState(false);

  return (
    <EditorProvider>
      <KeyboardShortcuts />
      <EditorPersistence store={store} />
      <div className="w-full h-full min-h-[600px] grid gap-2 p-2 editor-responsive"
        style={{
          gridTemplateColumns: '260px 1fr 320px',
          gridTemplateRows: 'auto 1fr 220px',
          gridTemplateAreas: `"toolbar toolbar toolbar" "palette canvas inspector" "layers canvas inspector"`
        }}
      >
        <div style={{ gridArea: 'toolbar' }} className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Editor</div>
          <button className="btn" onClick={() => setShowPages(true)}>Pages…</button>
        </div>
        <div style={{ gridArea: 'palette' }} className="min-h-0"><Palette /></div>
        <div style={{ gridArea: 'canvas' }} className="min-h-0"><Canvas /></div>
        <div style={{ gridArea: 'inspector' }} className="min-h-0"><Inspector /></div>
        <div style={{ gridArea: 'layers' }} className="min-h-0"><Layers /></div>
      </div>
      {/* Responsive fallback: stack panels on narrow screens */}
      <style>
        {`
        @media (max-width: 1024px) {
          .editor-responsive { grid-template-columns: 1fr !important; grid-template-rows: auto !important; grid-template-areas: none !important; }
        }
      `}
      </style>
      <PageSwitcherModal store={store} open={showPages} onClose={() => setShowPages(false)} />
    </EditorProvider>
  );
}
