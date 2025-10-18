import React from 'react';
import { Panel } from './ui/Panel';
import { useEditor } from '../state/EditorContext';
import type { EditorNode } from '../state/types';

function LayerItem({ node, depth = 0 }: { node: EditorNode; depth?: number }) {
  const { select, selection } = useEditor();
  const isSelected = selection.includes(node.id);
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    select([node.id]);
  };
  return (
    <div className={"pl-" + depth * 2}>
      <div
        className={
          'flex items-center gap-2 px-2 py-1 rounded cursor-pointer ' +
          (isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800')
        }
        onClick={onClick}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
        <span className="text-sm text-gray-800 dark:text-gray-200">{node.name}</span>
      </div>
      <div className="pl-3">
        {(node.children ?? []).map((c) => (
          <LayerItem key={c.id} node={c} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

export function Layers() {
  const { tree } = useEditor();
  return (
    <Panel title="Layers">
      <div className="p-2 space-y-1">
        <LayerItem node={tree} />
      </div>
    </Panel>
  );
}
