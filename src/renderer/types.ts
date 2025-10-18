export type Mark = 'bold' | 'italic' | 'underline' | 'code';

export type TextNode = {
  type: 'text';
  text: string;
  marks?: Mark[];
  color?: import('../theme/tokens').ColorKey;
};

export type HeadingNode = {
  type: 'heading';
  level: 1 | 2 | 3 | 4;
  children: Node[];
  fontSize?: import('../theme/tokens').FontSizeKey;
  fontWeight?: import('../theme/tokens').FontWeightKey;
};

export type ParagraphNode = {
  type: 'paragraph';
  children: Node[];
  spacing?: import('../theme/tokens').SpacingKey;
};

export type ListNode = {
  type: 'list';
  ordered?: boolean;
  children: ListItemNode[];
};

export type ListItemNode = {
  type: 'listItem';
  children: Node[];
};

export type LinkNode = {
  type: 'link';
  href: string;
  children: Node[];
};

export type Node = TextNode | HeadingNode | ParagraphNode | ListNode | ListItemNode | LinkNode;

export type Document = {
  type: 'doc';
  children: Node[];
};
