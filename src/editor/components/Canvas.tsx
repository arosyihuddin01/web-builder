import React from 'react';
import { Panel } from './ui/Panel';
import { useEditor } from '../state/EditorContext';
import type { EditorNode } from '../state/types';

function NodeView({ node, depth = 0 }: { node: EditorNode; depth?: number }) {
  const { select, selection } = useEditor();
  const isSelected = selection.includes(node.id);
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    select([node.id]);
  };
  const border = isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200';
  const label = node.type === 'root' ? 'Page' : node.name;
  return (
    <div className={`border ${border} rounded p-2 my-2`} onClick={onClick}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="pl-2">
        {(node.children ?? []).map((c) => (
          <NodeView key={c.id} node={c} depth={depth + 1} />)
        )}
      </div>
    </div>
  );
}

export function Canvas() {
  const { tree, addNode } = useEditor();

  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-editor-node')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    const data = e.dataTransfer.getData('application/x-editor-node');
    if (!data) return;
    try {
      const payload = JSON.parse(data) as { type: string; name: string; props?: Record<string, unknown> };
      const node: EditorNode = {
        id: `${payload.type}-${Math.random().toString(36).slice(2, 8)}`,
        type: payload.type as any,
        name: payload.name,
        props: payload.props ?? {},
        children: []
      };
      addNode('root', node);
    } catch (err) {
      // ignore bad payload
    }
  };

  return (
    <Panel
      title="Canvas"
      toolbar={<span className="text-xs text-gray-500">Drop items here</span>}
      className="min-h-[200px]"
    >
      <div className="p-2 min-h-[300px] bg-gray-50 dark:bg-gray-950" onDragOver={onDragOver} onDrop={onDrop}>
        <NodeView node={tree} />
      </div>
    </Panel>
  );
}
