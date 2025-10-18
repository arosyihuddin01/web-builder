import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { EditorNode, EditorSnapshot, EditorState } from './types';
import { createRootNode } from './types';

export type EditorContextValue = EditorState & {
  setTree: (tree: EditorNode) => void;
  select: (ids: string[]) => void;
  addNode: (parentId: string, node: EditorNode) => void;
  undo: () => void; // placeholder
  redo: () => void; // placeholder
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

  const value = useMemo<EditorContextValue>(() => ({ ...state, setTree, select, addNode, undo, redo }), [state, setTree, select, addNode, undo, redo]);

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within an EditorProvider');
  return ctx;
}
