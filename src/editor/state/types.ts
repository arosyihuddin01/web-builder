export type EditorNodeType = 'root' | 'rectangle' | 'text' | 'image' | 'button' | 'group';

export type EditorNode = {
  id: string;
  type: EditorNodeType;
  name: string;
  children?: EditorNode[];
  props?: Record<string, unknown>;
};

export type EditorSnapshot = {
  tree: EditorNode;
  selection: string[];
};

export type EditorState = {
  tree: EditorNode;
  selection: string[];
  history: {
    past: EditorSnapshot[];
    future: EditorSnapshot[];
  };
};

export type EditorAction =
  | { type: 'setTree'; tree: EditorNode }
  | { type: 'select'; ids: string[] }
  | { type: 'addNode'; parentId: string; node: EditorNode };

export function createRootNode(): EditorNode {
  return {
    id: 'root',
    type: 'root',
    name: 'Page',
    children: []
  };
}
