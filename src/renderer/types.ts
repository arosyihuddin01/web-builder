export type Mark = 'bold' | 'italic' | 'underline' | 'code';

export type PinConstraints = {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
};

export type LayoutConstraints = {
  pin?: PinConstraints;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
};

export type Frame = {
  x: number;
  y: number;
  width?: number;
  height?: number;
};

export type Layout = {
  frame?: Frame;
  constraints?: LayoutConstraints;
};

export type TextNode = {
  type: 'text';
  text: string;
  marks?: Mark[];
  color?: import('../theme/tokens').ColorKey;
  layout?: Layout;
};

export type HeadingNode = {
  type: 'heading';
  level: 1 | 2 | 3 | 4;
  children: Node[];
  fontSize?: import('../theme/tokens').FontSizeKey;
  fontWeight?: import('../theme/tokens').FontWeightKey;
  layout?: Layout;
};

export type ParagraphNode = {
  type: 'paragraph';
  children: Node[];
  spacing?: import('../theme/tokens').SpacingKey;
  layout?: Layout;
};

export type ListNode = {
  type: 'list';
  ordered?: boolean;
  children: ListItemNode[];
  layout?: Layout;
};

export type ListItemNode = {
  type: 'listItem';
  children: Node[];
  layout?: Layout;
};

export type LinkNode = {
  type: 'link';
  href: string;
  children: Node[];
  layout?: Layout;
};

export type FrameNode = {
  type: 'frame';
  children: Node[];
  style?: import('../schema/style').SizeStyle;
};

export type Node = TextNode | HeadingNode | ParagraphNode | ListNode | ListItemNode | LinkNode | FrameNode;

export type Document = {
  type: 'doc';
  children: Node[];
  // indices of top-level nodes currently selected; used by alignment/distribution actions
  selection?: number[];
};
