import type { Document, Node, ParagraphNode, TextNode } from './types';
import type { ColorKey, SpacingKey } from '../theme/tokens';

export type Action =
  | { type: 'toggleBold' }
  | { type: 'setTextColor'; color: ColorKey }
  | { type: 'setParagraphSpacing'; spacing: SpacingKey };

export function applyAction(doc: Document, action: Action): Document {
  return {
    ...doc,
    children: doc.children.map((n) => transformNode(n, action))
  };
}

function transformNode(node: Node, action: Action): Node {
  switch (node.type) {
    case 'text':
      return transformText(node, action);
    case 'paragraph': {
      let next: ParagraphNode = { ...node, children: node.children.map((c) => transformNode(c, action)) };
      if (action.type === 'setParagraphSpacing') next = { ...next, spacing: action.spacing };
      return next;
    }
    case 'heading':
    case 'list':
    case 'listItem':
    case 'link':
      return { ...node, children: (node as any).children?.map((c: Node) => transformNode(c, action)) } as any;
    default:
      return node;
  }
}

function transformText(node: TextNode, action: Action): TextNode {
  if (action.type === 'toggleBold') {
    const marks = new Set(node.marks ?? []);
    if (marks.has('bold')) marks.delete('bold');
    else marks.add('bold');
    return { ...node, marks: Array.from(marks) };
  }
  if (action.type === 'setTextColor') {
    return { ...node, color: action.color };
  }
  return node;
}
