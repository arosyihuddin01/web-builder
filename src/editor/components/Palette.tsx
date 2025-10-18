import React from 'react';
import { Panel } from './ui/Panel';

export type PaletteItem = {
  type: 'rectangle' | 'text' | 'image' | 'button';
  name: string;
  icon?: React.ReactNode;
  blueprint?: Record<string, unknown>;
};

const PRIMITIVES: PaletteItem[] = [
  { type: 'rectangle', name: 'Rectangle' },
  { type: 'text', name: 'Text' },
  { type: 'image', name: 'Image' },
  { type: 'button', name: 'Button' }
];

const MARKETPLACE: PaletteItem[] = [
  { type: 'rectangle', name: 'Hero (Marketplace)' },
  { type: 'rectangle', name: 'Pricing (Marketplace)' }
];

function DraggableItem({ item }: { item: PaletteItem }) {
  const onDragStart = (e: React.DragEvent) => {
    const payload = {
      type: item.type,
      name: item.name,
      props: item.blueprint ?? {}
    };
    e.dataTransfer.setData('application/x-editor-node', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <div
      role="button"
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-[10px] text-gray-600 dark:text-gray-200">
        {item.name[0]}
      </span>
      <span className="text-sm text-gray-800 dark:text-gray-200">{item.name}</span>
    </div>
  );
}

export function Palette() {
  return (
    <Panel title="Palette">
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        <div className="p-2">
          <h3 className="text-xs uppercase text-gray-500 mb-2">Primitives</h3>
          <div className="space-y-1">
            {PRIMITIVES.map((p) => (
              <DraggableItem key={p.name} item={p} />
            ))}
          </div>
        </div>
        <div className="p-2">
          <h3 className="text-xs uppercase text-gray-500 mb-2">Marketplace</h3>
          <div className="space-y-1">
            {MARKETPLACE.map((p) => (
              <DraggableItem key={p.name} item={p} />
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
