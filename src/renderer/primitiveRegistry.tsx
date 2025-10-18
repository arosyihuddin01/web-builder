import React from 'react';
import clsx from 'clsx';

export type PrimitiveType = 'Text' | 'Button' | 'Image' | 'Box' | 'Stack' | 'Section' | 'Grid';

// A minimal allowlist of style keys we support in the public renderer.
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
  // Inline styles that will be filtered by allowlist
  style?: Partial<Record<StyleAllowlistKey, any>>;
  className?: string;
  testId?: string; // data-testid passthrough
  // Action pattern (e.g. links)
  action?: { type: 'link'; href: string; newTab?: boolean } | null;
};

export type TextProps = CommonProps & {
  content?: string;
};

export type ButtonProps = CommonProps & {
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export type ImageProps = CommonProps & {
  src?: string;
  alt?: string;
};

export type BoxProps = CommonProps & {
  children?: React.ReactNode;
};

export type StackProps = BoxProps & {
  direction?: 'horizontal' | 'vertical';
};

export type SectionProps = BoxProps & {
  as?: keyof JSX.IntrinsicElements;
};

export type GridProps = BoxProps & {
  columns?: number; // number of columns
};

export type PrimitiveMeta<P extends CommonProps = CommonProps> = {
  type: PrimitiveType;
  displayName: string;
  // Keys allowed from props.style
  styleAllowlist: StyleAllowlistKey[];
  // Keys allowed directly on the props object (beyond CommonProps)
  propAllowlist: (keyof P)[];
  render: (props: P, children: React.ReactNode[]) => React.ReactElement | null;
};

function pickAllowed<T extends Record<string, any>>(obj: T | undefined, keys: readonly string[]): Partial<T> {
  const out: any = {};
  if (!obj) return out;
  for (const k of keys) {
    if (k in obj) out[k] = (obj as any)[k];
  }
  return out;
}

function filterStyle(style: CommonProps['style'] | undefined, allow: readonly StyleAllowlistKey[]) {
  const out: React.CSSProperties = {};
  if (!style) return out;
  for (const k of allow) {
    if (style[k] != null) (out as any)[k] = style[k as keyof typeof style];
  }
  return out;
}

const TextPrimitive: PrimitiveMeta<TextProps> = {
  type: 'Text',
  displayName: 'Text',
  styleAllowlist: [
    'color',
    'textAlign',
    'fontWeight',
    'fontSize',
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft'
  ],
  propAllowlist: ['content', 'className', 'testId', 'style', 'id', 'action'],
  render: (props) => {
    const style = filterStyle(props.style, TextPrimitive.styleAllowlist);
    const content = props.content ?? '';
    const el = <span style={style} className={props.className} data-testid={props.testId}>{content}</span>;
    if (props.action && props.action.type === 'link' && props.action.href) {
      return (
        <a href={props.action.href} target={props.action.newTab ? '_blank' : undefined} rel={props.action.newTab ? 'noreferrer' : undefined}>
          {el}
        </a>
      );
    }
    return el;
  }
};

const ButtonPrimitive: PrimitiveMeta<ButtonProps> = {
  type: 'Button',
  displayName: 'Button',
  styleAllowlist: [
    'color',
    'backgroundColor',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderRadius',
    'fontWeight',
    'fontSize'
  ],
  propAllowlist: ['label', 'variant', 'className', 'testId', 'style', 'id', 'action'],
  render: (props) => {
    const style = filterStyle(props.style, ButtonPrimitive.styleAllowlist);
    const base = clsx('inline-flex items-center justify-center', props.variant === 'primary' && 'btn-primary', props.variant === 'secondary' && 'btn-secondary', props.variant === 'ghost' && 'btn-ghost');
    const content = props.label ?? 'Button';
    const el = (
      <button style={style} className={clsx(base, props.className)} data-testid={props.testId}>
        {content}
      </button>
    );
    if (props.action && props.action.type === 'link' && props.action.href) {
      return (
        <a href={props.action.href} target={props.action.newTab ? '_blank' : undefined} rel={props.action.newTab ? 'noreferrer' : undefined}>
          {el}
        </a>
      );
    }
    return el;
  }
};

const ImagePrimitive: PrimitiveMeta<ImageProps> = {
  type: 'Image',
  displayName: 'Image',
  styleAllowlist: ['width', 'height', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight', 'objectFit', 'borderRadius', 'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
  propAllowlist: ['src', 'alt', 'className', 'testId', 'style', 'id', 'action'],
  render: (props) => {
    const style = filterStyle(props.style, ImagePrimitive.styleAllowlist);
    const img = <img src={props.src} alt={props.alt ?? ''} style={style} className={props.className} data-testid={props.testId} />;
    if (props.action && props.action.type === 'link' && props.action.href) {
      return (
        <a href={props.action.href} target={props.action.newTab ? '_blank' : undefined} rel={props.action.newTab ? 'noreferrer' : undefined}>
          {img}
        </a>
      );
    }
    return img;
  }
};

const BoxPrimitive: PrimitiveMeta<BoxProps> = {
  type: 'Box',
  displayName: 'Box',
  styleAllowlist: [
    'color',
    'backgroundColor',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'width',
    'height',
    'maxWidth',
    'maxHeight',
    'minWidth',
    'minHeight',
    'borderRadius'
  ],
  propAllowlist: ['children', 'className', 'testId', 'style', 'id', 'action'],
  render: (props, children) => {
    const style = filterStyle(props.style, BoxPrimitive.styleAllowlist);
    const el = (
      <div style={style} className={props.className} data-testid={props.testId}>
        {children}
      </div>
    );
    if (props.action && props.action.type === 'link' && props.action.href) {
      return (
        <a href={props.action.href} target={props.action.newTab ? '_blank' : undefined} rel={props.action.newTab ? 'noreferrer' : undefined}>
          {el}
        </a>
      );
    }
    return el;
  }
};

const StackPrimitive: PrimitiveMeta<StackProps> = {
  type: 'Stack',
  displayName: 'Stack',
  styleAllowlist: [
    'color',
    'backgroundColor',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'gap',
    'rowGap',
    'columnGap',
    'width',
    'height'
  ],
  propAllowlist: ['children', 'direction', 'className', 'testId', 'style', 'id', 'action'],
  render: (props, children) => {
    const style = filterStyle(props.style, StackPrimitive.styleAllowlist);
    const dir = props.direction === 'horizontal' ? 'row' : 'column';
    const el = (
      <div style={{ display: 'flex', flexDirection: dir, ...style }} className={props.className} data-testid={props.testId}>
        {children}
      </div>
    );
    if (props.action && props.action.type === 'link' && props.action.href) {
      return (
        <a href={props.action.href} target={props.action.newTab ? '_blank' : undefined} rel={props.action.newTab ? 'noreferrer' : undefined}>
          {el}
        </a>
      );
    }
    return el;
  }
};

const SectionPrimitive: PrimitiveMeta<SectionProps> = {
  type: 'Section',
  displayName: 'Section',
  styleAllowlist: [
    'color',
    'backgroundColor',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'width',
    'maxWidth'
  ],
  propAllowlist: ['children', 'as', 'className', 'testId', 'style', 'id', 'action'],
  render: (props, children) => {
    const style = filterStyle(props.style, SectionPrimitive.styleAllowlist);
    const Tag = props.as ?? 'section';
    const el = (
      <Tag style={style} className={props.className} data-testid={props.testId}>
        {children}
      </Tag>
    );
    if (props.action && props.action.type === 'link' && props.action.href) {
      return (
        <a href={props.action.href} target={props.action.newTab ? '_blank' : undefined} rel={props.action.newTab ? 'noreferrer' : undefined}>
          {el}
        </a>
      );
    }
    return el as any;
  }
};

const GridPrimitive: PrimitiveMeta<GridProps> = {
  type: 'Grid',
  displayName: 'Grid',
  styleAllowlist: [
    'color',
    'backgroundColor',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'gap',
    'rowGap',
    'columnGap',
    'width',
    'height',
    'gridTemplateColumns',
    'gridAutoRows'
  ],
  propAllowlist: ['children', 'columns', 'className', 'testId', 'style', 'id', 'action'],
  render: (props, children) => {
    const style = filterStyle(props.style, GridPrimitive.styleAllowlist);
    const cols = Math.max(1, Math.floor(props.columns ?? 1));
    const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, ...style };
    const el = (
      <div style={gridStyle} className={props.className} data-testid={props.testId}>
        {children}
      </div>
    );
    if (props.action && props.action.type === 'link' && props.action.href) {
      return (
        <a href={props.action.href} target={props.action.newTab ? '_blank' : undefined} rel={props.action.newTab ? 'noreferrer' : undefined}>
          {el}
        </a>
      );
    }
    return el;
  }
};

export const primitiveRegistry: Record<PrimitiveType, PrimitiveMeta<any>> = {
  Text: TextPrimitive,
  Button: ButtonPrimitive,
  Image: ImagePrimitive,
  Box: BoxPrimitive,
  Stack: StackPrimitive,
  Section: SectionPrimitive,
  Grid: GridPrimitive
};

export type Registry = typeof primitiveRegistry;

export function isPrimitiveType(value: any): value is PrimitiveType {
  return typeof value === 'string' && (value as string) in primitiveRegistry;
}
