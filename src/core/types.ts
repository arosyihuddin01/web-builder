import type { PrimitiveType } from '@src/renderer/primitiveRegistry';

export type Action = { type: 'link'; href: string; newTab?: boolean };

export type StyleAllowlistKey =
  | 'color'
  | 'backgroundColor'
  | 'padding'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'margin'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  | 'gap'
  | 'rowGap'
  | 'columnGap'
  | 'display'
  | 'flexDirection'
  | 'alignItems'
  | 'justifyContent'
  | 'gridTemplateColumns'
  | 'gridAutoRows'
  | 'width'
  | 'height'
  | 'maxWidth'
  | 'maxHeight'
  | 'minWidth'
  | 'minHeight'
  | 'objectFit'
  | 'borderRadius'
  | 'textAlign'
  | 'fontWeight'
  | 'fontSize';

export type CommonProps = {
  id?: string;
  style?: Partial<Record<StyleAllowlistKey, any>>;
  className?: string;
  testId?: string;
  action?: Action | null;
};

export type BaseNode = { id?: string; type: string };

export type PrimitiveNode = BaseNode & {
  type: PrimitiveType;
  props?: Record<string, unknown> | null;
  children?: unknown[] | null;
};

export type ComponentInstanceNode = BaseNode & {
  type: 'ComponentInstance';
  component: string | { id: string };
  props?: Record<string, unknown> | null;
};

export type AnyNode = PrimitiveNode | ComponentInstanceNode | BaseNode;

export type RootDocument = { type: 'root' | 'document' | 'doc'; children: unknown[] };

export type ComponentDefinition = {
  type: PrimitiveType;
  displayName: string;
  styleAllowlist: StyleAllowlistKey[];
  propAllowlist: string[];
};
