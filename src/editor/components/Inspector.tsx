import React from 'react';
import { Panel } from './ui/Panel';
import { useEditor } from '../state/EditorContext';
import type { EditorNode } from '../state/types';
import { sanitizeText, sanitizeUrl } from '../utils/sanitize';
import type { StyleTokens } from '../utils/tailwind';

function find(node: EditorNode, id: string): EditorNode | null {
  if (node.id === id) return node;
  for (const c of node.children ?? []) {
    const r = find(c, id);
    if (r) return r;
  }
  return null;
}

export function Inspector() {
  const { tree, selection, updateNode, updateNodeProps, duplicateSelection, deleteSelection } = useEditor();
  const selectedId = selection[selection.length - 1];
  const selected = selectedId ? find(tree as any, selectedId) : null;

  const toolbar = (
    <div className="flex items-center gap-1 text-xs">
      <button
        className="px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        type="button"
        onClick={() => duplicateSelection()}
        disabled={!selected}
        title="Duplicate (Cmd/Ctrl+D)"
      >
        Duplicate
      </button>
      <button
        className="px-2 py-1 border border-red-400 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950"
        type="button"
        onClick={() => deleteSelection()}
        disabled={!selected}
        title="Delete (Del/Backspace)"
      >
        Delete
      </button>
    </div>
  );

  return (
    <Panel title="Inspector" toolbar={toolbar}>
      <div className="p-2 text-sm text-gray-800 dark:text-gray-200 space-y-3">
        {selection.length > 1 && (
          <div className="text-gray-500">{selection.length} selected</div>
        )}
        {!selected ? (
          <div className="text-gray-500">No selection</div>
        ) : (
          <div className="space-y-3">
            <fieldset className="space-y-1">
              <legend className="text-xs uppercase text-gray-500">General</legend>
              <label className="block">
                <span className="block text-xs text-gray-500">Name</span>
                <input
                  className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                  value={selected.name}
                  onChange={(e) => updateNode(selected.id, { name: sanitizeText(e.target.value, { maxLength: 100 }) })}
                />
              </label>
            </fieldset>

            {selected.type === 'text' && (
              <fieldset className="space-y-1">
                <legend className="text-xs uppercase text-gray-500">Text</legend>
                <label className="block">
                  <span className="block text-xs text-gray-500">Content</span>
                  <input
                    className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                    value={String(selected.props?.text ?? '')}
                    onChange={(e) => updateNodeProps(selected.id, { text: sanitizeText(e.target.value, { maxLength: 1000 }) })}
                  />
                </label>
              </fieldset>
            )}

            {selected.type === 'image' && (
              <fieldset className="space-y-1">
                <legend className="text-xs uppercase text-gray-500">Image</legend>
                <label className="block">
                  <span className="block text-xs text-gray-500">URL</span>
                  <input
                    className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                    value={String(selected.props?.src ?? '')}
                    onChange={(e) => updateNodeProps(selected.id, { src: sanitizeUrl(e.target.value) })}
                  />
                </label>
                <label className="block">
                  <span className="block text-xs text-gray-500">Alt text</span>
                  <input
                    className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                    value={String(selected.props?.alt ?? '')}
                    onChange={(e) => updateNodeProps(selected.id, { alt: sanitizeText(e.target.value, { maxLength: 200 }) })}
                  />
                </label>
              </fieldset>
            )}

            {selected.type === 'button' && (
              <fieldset className="space-y-1">
                <legend className="text-xs uppercase text-gray-500">Button</legend>
                <label className="block">
                  <span className="block text-xs text-gray-500">Label</span>
                  <input
                    className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                    value={String(selected.props?.label ?? '')}
                    onChange={(e) => updateNodeProps(selected.id, { label: sanitizeText(e.target.value, { maxLength: 100 }) })}
                  />
                </label>
                <label className="block">
                  <span className="block text-xs text-gray-500">Href</span>
                  <input
                    className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                    value={String(selected.props?.href ?? '')}
                    onChange={(e) => updateNodeProps(selected.id, { href: sanitizeUrl(e.target.value) })}
                  />
                </label>
              </fieldset>
            )}

            {/* Style tokens */}
            <fieldset className="space-y-1">
              <legend className="text-xs uppercase text-gray-500">Style</legend>
              {(() => {
                const style = (selected.props?.style ?? {}) as StyleTokens;
                const setStyle = (patch: Partial<StyleTokens>) => {
                  const next = { ...style, ...patch };
                  updateNodeProps(selected.id, { style: next });
                };
                return (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="block text-xs text-gray-500">Background</span>
                      <select
                        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                        value={style.bg ?? ''}
                        onChange={(e) => setStyle({ bg: e.target.value || undefined })}
                      >
                        <option value="">None</option>
                        <option value="gray-100">gray-100</option>
                        <option value="gray-200">gray-200</option>
                        <option value="blue-500">blue-500</option>
                        <option value="red-500">red-500</option>
                        <option value="green-500">green-500</option>
                        <option value="yellow-200">yellow-200</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-xs text-gray-500">Padding</span>
                      <select
                        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                        value={style.padding ?? ''}
                        onChange={(e) => setStyle({ padding: (e.target.value as StyleTokens['padding']) || undefined })}
                      >
                        <option value="">Default</option>
                        <option value="none">none</option>
                        <option value="xs">xs</option>
                        <option value="sm">sm</option>
                        <option value="md">md</option>
                        <option value="lg">lg</option>
                        <option value="xl">xl</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-xs text-gray-500">Radius</span>
                      <select
                        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                        value={style.radius ?? ''}
                        onChange={(e) => setStyle({ radius: (e.target.value as StyleTokens['radius']) || undefined })}
                      >
                        <option value="">Default</option>
                        <option value="none">none</option>
                        <option value="sm">sm</option>
                        <option value="md">md</option>
                        <option value="lg">lg</option>
                        <option value="full">full</option>
                      </select>
                    </label>
                    {(selected.type === 'text' || selected.type === 'button') && (
                      <>
                        <label className="block">
                          <span className="block text-xs text-gray-500">Text color</span>
                          <select
                            className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                            value={style.textColor ?? ''}
                            onChange={(e) => setStyle({ textColor: e.target.value || undefined })}
                          >
                            <option value="">Default</option>
                            <option value="gray-700">gray-700</option>
                            <option value="blue-700">blue-700</option>
                            <option value="red-700">red-700</option>
                            <option value="green-700">green-700</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="block text-xs text-gray-500">Text size</span>
                          <select
                            className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                            value={style.textSize ?? ''}
                            onChange={(e) => setStyle({ textSize: (e.target.value as StyleTokens['textSize']) || undefined })}
                          >
                            <option value="">Default</option>
                            <option value="sm">sm</option>
                            <option value="base">base</option>
                            <option value="lg">lg</option>
                            <option value="xl">xl</option>
                          </select>
                        </label>
                      </>
                    )}
                    <label className="block col-span-2">
                      <span className="block text-xs text-gray-500">Extra classes</span>
                      <input
                        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900"
                        value={String(style.className ?? '')}
                        onChange={(e) => setStyle({ className: sanitizeText(e.target.value, { maxLength: 300 }) })}
                      />
                    </label>
                  </div>
                );
              })()}
            </fieldset>
          </div>
        )}
      </div>
    </Panel>
  );
}
