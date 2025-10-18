import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { EditorNode, EditorSnapshot, EditorState } from './types';
import { createRootNode } from './types';

export type EditorContextValue = EditorState & {
  setTree: (tree: EditorNode) => void;
  select: (ids: string[]) => void;
  addNode: (parentId: string, node: EditorNode) => void;
  updateNode: (id: string, patch: Partial<EditorNode>) => void;
  updateNodeProps: (id: string, propsPatch: Record<string, unknown>) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  undo: () => void;
  redo: () => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

function snapshotOf(state: Pick<EditorState, 'tree' | 'selection'>): EditorSnapshot {
  return {
    tree: state.tree,
    selection: state.selection
  };
}

function findNodeById(node: EditorNode, id: string): EditorNode | null {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

function findParentOf(root: EditorNode, id: string, parent: EditorNode | null = null): EditorNode | null {
  if (root.id === id) return parent;
  for (const child of root.children ?? []) {
    const p = findParentOf(child, id, root);
    if (p) return p;
  }
  return null;
}

function cloneTree(node: EditorNode): EditorNode {
  return {
    ...node,
    children: node.children?.map(cloneTree)
  };
}

function addNodeToTree(tree: EditorNode, parentId: string, node: EditorNode): EditorNode {
  const copy = cloneTree(tree);
  const parent = findNodeById(copy, parentId);
  if (!parent) return copy;
  if (!parent.children) parent.children = [];
  parent.children.push(node);
  return copy;
}

function removeNodeFromTree(tree: EditorNode, id: string): EditorNode {
  if (tree.id === id) return tree; // do not remove root
  const copy = cloneTree(tree);
  function walk(n: EditorNode): void {
    if (!n.children) return;
    n.children = n.children.filter((c) => c.id !== id);
    for (const c of n.children) walk(c);
  }
  walk(copy);
  return copy;
}

function duplicateNode(node: EditorNode): EditorNode {
  const newId = `${node.type}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    ...node,
    id: newId,
    children: node.children?.map(duplicateNode)
  };
}

export function EditorProvider({ children, initialTree }: { children: React.ReactNode; initialTree?: EditorNode }) {
  const [state, setState] = useState<EditorState>(() => ({
    tree: initialTree ?? createRootNode(),
    selection: [],
    history: { past: [], future: [] }
  }));

  const setTree = useCallback((tree: EditorNode) => {
    setState((prev) => ({
      ...prev,
      tree,
      history: {
        past: [...prev.history.past, snapshotOf(prev)],
        future: []
      }
    }));
  }, []);

  const select = useCallback((ids: string[]) => {
    setState((prev) => ({ ...prev, selection: ids }));
  }, []);

  const addNode = useCallback((parentId: string, node: EditorNode) => {
    setState((prev) => {
      const nextTree = addNodeToTree(prev.tree, parentId, node);
      return {
        ...prev,
        tree: nextTree,
        history: {
          past: [...prev.history.past, snapshotOf(prev)],
          future: []
        }
      };
    });
  }, []);

  const updateNode = useCallback((id: string, patch: Partial<EditorNode>) => {
    setState((prev) => {
      const copy = cloneTree(prev.tree);
      const target = findNodeById(copy, id);
      if (!target) return prev;
      Object.assign(target, patch);
      return {
        ...prev,
        tree: copy,
        history: { past: [...prev.history.past, snapshotOf(prev)], future: [] }
      };
    });
  }, []);

  const updateNodeProps = useCallback((id: string, propsPatch: Record<string, unknown>) => {
    setState((prev) => {
      const copy = cloneTree(prev.tree);
      const target = findNodeById(copy, id);
      if (!target) return prev;
      target.props = { ...(target.props ?? {}), ...propsPatch };
      return {
        ...prev,
        tree: copy,
        history: { past: [...prev.history.past, snapshotOf(prev)], future: [] }
      };
    });
  }, []);

  const deleteSelection = useCallback(() => {
    setState((prev) => {
      if (prev.selection.length === 0) return prev;
      let nextTree = prev.tree;
      for (const id of prev.selection) {
        if (id === 'root') continue;
        nextTree = removeNodeFromTree(nextTree, id);
      }
      return {
        tree: nextTree,
        selection: [],
        history: { past: [...prev.history.past, snapshotOf(prev)], future: [] }
      } as EditorState;
    });
  }, []);

  const duplicateSelection = useCallback(() => {
    setState((prev) => {
      if (prev.selection.length === 0) return prev;
      const copy = cloneTree(prev.tree);
      const newIds: string[] = [];
      for (const id of prev.selection) {
        const node = findNodeById(copy, id);
        if (!node) continue;
        const parent = findParentOf(copy, id) ?? copy; // default to root
        const dup = duplicateNode(node);
        if (!parent.children) parent.children = [];
        // insert after original if possible
        const idx = parent.children.findIndex((c) => c.id === id);
        parent.children.splice(idx >= 0 ? idx + 1 : parent.children.length, 0, dup);
        newIds.push(dup.id);
      }
      return {
        ...prev,
        tree: copy,
        selection: newIds,
        history: { past: [...prev.history.past, snapshotOf(prev)], future: [] }
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.history.past.length === 0) return prev;
      const past = [...prev.history.past];
      const last = past.pop()!;
      return {
        tree: last.tree,
        selection: last.selection,
        history: {
          past,
          future: [snapshotOf(prev), ...prev.history.future]
        }
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.history.future.length === 0) return prev;
      const [next, ...rest] = prev.history.future;
      return {
        tree: next.tree,
        selection: next.selection,
        history: {
          past: [...prev.history.past, snapshotOf(prev)],
          future: rest
        }
      };
    });
  }, []);

  const value = useMemo<EditorContextValue>(() => ({
    ...state,
    setTree,
    select,
    addNode,
    updateNode,
    updateNodeProps,
    deleteSelection,
    duplicateSelection,
    undo,
    redo
  }), [state, setTree, select, addNode, updateNode, updateNodeProps, deleteSelection, duplicateSelection, undo, redo]);

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within an EditorProvider');
  return ctx;
}
