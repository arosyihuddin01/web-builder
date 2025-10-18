import React from 'react';
import { Panel } from './ui/Panel';
import { useEditor } from '../state/EditorContext';

export function Inspector() {
  const { tree, selection } = useEditor();
  const selectedId = selection[0];

  function find(node: typeof tree, id: string): typeof tree | null {
    if (node.id === id) return node;
    for (const c of node.children ?? []) {
      const r = find(c as any, id);
      if (r) return r as any;
    }
    return null;
  }

  const selected = selectedId ? find(tree, selectedId) : null;

  return (
    <Panel title="Inspector">
      <div className="p-2 text-sm text-gray-800 dark:text-gray-200">
        {!selected ? (
          <div className="text-gray-500">No selection</div>
        ) : (
          <div className="space-y-1">
            <div>
              <span className="text-gray-500">ID:</span> {selected.id}
            </div>
            <div>
              <span className="text-gray-500">Type:</span> {selected.type}
            </div>
            <div>
              <span className="text-gray-500">Name:</span> {selected.name}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
