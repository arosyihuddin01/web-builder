import React from 'react';
import { Panel } from './ui/Panel';
import { useEditor } from '../state/EditorContext';
import type { EditorNode } from '../state/types';
import { tailwindClasses, type StyleTokens } from '../utils/tailwind';

function RenderContent({ node }: { node: EditorNode }) {
  const style = (node.props?.style ?? {}) as StyleTokens;
  const classes = tailwindClasses(style);
  switch (node.type) {
    case 'text': {
      const text = String(node.props?.text ?? node.name ?? 'Text');
      return <div className={classes}>{text}</div>;
    }
    case 'image': {
      const alt = String(node.props?.alt ?? node.name ?? 'Image');
      const src = String(node.props?.src ?? '');
      return (
        <div className={`inline-flex items-center justify-center bg-gray-200 text-gray-600 ${classes}`} style={{ width: 120, height: 80 }}>
          {src ? <span className="text-[10px]">img: {alt}</span> : <span className="text-[10px]">no image</span>}
        </div>
      );
    }
    case 'button': {
      const label = String(node.props?.label ?? node.name ?? 'Button');
      return (
        <button className={`px-3 py-1 border rounded ${classes}`} type="button">
          {label}
        </button>
      );
    }
    case 'rectangle':
    default: {
      return <div className={`p-2 border rounded ${classes}`}>{node.children && node.children.length ? null : <span className="text-xs text-gray-500">{node.name}</span>}</div>;
    }
  }
}

function NodeView({ node, depth = 0 }: { node: EditorNode; depth?: number }) {
  const { select, selection } = useEditor();
  const isSelected = selection.includes(node.id);
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const additive = e.metaKey || e.ctrlKey || e.shiftKey;
    if (additive) {
      const current = new Set(selection);
      if (current.has(node.id)) current.delete(node.id); else current.add(node.id);
      select(Array.from(current));
    } else {
      select([node.id]);
    }
  };
  const border = isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200';
  const label = node.type === 'root' ? 'Page' : node.name;
  return (
    <div className={`border ${border} rounded p-2 my-2`} onClick={onClick}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="pl-2 space-y-2">
        {node.type !== 'root' ? <RenderContent node={node} /> : null}
        {(node.children ?? []).map((c) => (
          <NodeView key={c.id} node={c} depth={depth + 1} />)
        )}
      </div>
    </div>
  );
}

function findPath(root: EditorNode, id: string): EditorNode[] | null {
  if (root.id === id) return [root];
  for (const c of root.children ?? []) {
    const p = findPath(c, id);
    if (p) return [root, ...p];
  }
  return null;
}

export function Canvas() {
  const { tree, addNode, selection, select } = useEditor();
  const primary = selection[selection.length - 1];
  const path = primary ? findPath(tree, primary) ?? [] : [];

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

  const toolbar = (
    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
      {path.length ? (
        <div className="flex items-center gap-1">
          {path.map((n, i) => (
            <React.Fragment key={n.id}>
              <button
                className={`px-1 py-0.5 rounded ${i === path.length - 1 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                onClick={() => select([n.id])}
                type="button"
              >
                {n.type === 'root' ? 'Page' : n.name}
              </button>
              {i < path.length - 1 ? <span className="text-gray-400">/</span> : null}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <span className="text-gray-500">Drop items here</span>
      )}
    </div>
  );

  return (
    <Panel title="Canvas" toolbar={toolbar} className="min-h-[200px]">
      <div className="p-2 min-h-[300px] bg-gray-50 dark:bg-gray-950" onDragOver={onDragOver} onDrop={onDrop}>
        <NodeView node={tree} />
      </div>
    </Panel>
  );
}
