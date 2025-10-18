import React from 'react';
import { isPrimitiveType, primitiveRegistry, PrimitiveType } from './primitiveRegistry';

export type UnknownJSON = any;

export type BaseNode = {
  id?: string;
  type: string;
};

export type PrimitiveNode = BaseNode & {
  type: PrimitiveType;
  props?: Record<string, any> | null;
  children?: UnknownJSON[] | null; // raw JSON children; will be validated recursively
};

export type ComponentInstanceNode = BaseNode & {
  type: 'ComponentInstance';
  component: string | { id: string };
  props?: Record<string, any> | null;
};

export type AnyNode = PrimitiveNode | ComponentInstanceNode | BaseNode;

export type RootDocument = {
  type: 'root' | 'document' | 'doc';
  children: UnknownJSON[];
};

export function isNodeLike(value: any): value is AnyNode {
  return value && typeof value === 'object' && typeof value.type === 'string';
}

export type ComponentResolver = (component: ComponentInstanceNode['component']) => UnknownJSON | null;

export type RenderOptions = {
  registry?: typeof primitiveRegistry;
  resolveComponent?: ComponentResolver;
};

const defaultOptions: Required<RenderOptions> = {
  registry: primitiveRegistry,
  resolveComponent: () => null
};

function toArray<T>(input: T | T[] | null | undefined): T[] {
  if (input == null) return [];
  return Array.isArray(input) ? input : [input];
}

function pickAllowedProps(raw: Record<string, any> | null | undefined, allow: readonly string[]): Record<string, any> {
  const out: Record<string, any> = {};
  if (!raw) return out;
  for (const key of allow) {
    if (key in raw) out[key] = raw[key];
  }
  return out;
}

export function validatePrimitiveNode(value: any, options: RenderOptions = {}): value is PrimitiveNode {
  const registry = options.registry ?? defaultOptions.registry;
  if (!isNodeLike(value)) return false;
  if (!isPrimitiveType(value.type)) return false;
  const meta = registry[value.type as PrimitiveType];
  if (!meta) return false;
  // props can be missing or an object
  if (value.props != null && typeof value.props !== 'object') return false;
  // children, if any, must be an array
  if (value.children != null && !Array.isArray(value.children)) return false;
  return true;
}

export function validateComponentInstanceNode(value: any): value is ComponentInstanceNode {
  if (!isNodeLike(value)) return false;
  if (value.type !== 'ComponentInstance') return false;
  const c = value.component;
  if (typeof c !== 'string' && !(c && typeof c === 'object' && typeof c.id === 'string')) return false;
  if (value.props != null && typeof value.props !== 'object') return false;
  return true;
}

export function validateNode(value: any, options: RenderOptions = {}): value is AnyNode {
  if (!isNodeLike(value)) return false;
  return validatePrimitiveNode(value, options) || validateComponentInstanceNode(value);
}

export function validateDocument(doc: any): doc is RootDocument {
  return (
    !!doc &&
    typeof doc === 'object' &&
    (doc.type === 'root' || doc.type === 'document' || doc.type === 'doc') &&
    Array.isArray(doc.children)
  );
}

export function renderNode(node: UnknownJSON, options: RenderOptions = {}): React.ReactNode {
  const { registry, resolveComponent } = { ...defaultOptions, ...options };
  if (!validateNode(node, { registry })) return null;

  if (isPrimitiveType(node.type)) {
    const meta = registry[node.type];
    if (!meta) return null;
    const children = toArray(node.children).map((ch, i) => <React.Fragment key={i}>{renderNode(ch, { registry, resolveComponent })}</React.Fragment>);

    // allowlist props
    const allowed = pickAllowedProps(node.props, [...(meta.propAllowlist as string[])]);
    // ensure style only includes allowed keys; primitive renderers also filter
    if (node.props && node.props.style && typeof node.props.style === 'object') {
      allowed.style = node.props.style;
    }

    return meta.render(allowed as any, children);
  }

  if (node.type === 'ComponentInstance') {
    // stub: try to resolve component to a node tree; if not found, render null
    const resolved = resolveComponent(node.component);
    if (!resolved) return null;
    // In a real app, we would also map props to the resolved tree. Here we simply render the resolved JSON.
    return renderNode(resolved, { registry, resolveComponent });
  }

  return null;
}

export function Renderer({ doc, options }: { doc: RootDocument; options?: RenderOptions }): JSX.Element | null {
  const opts = { ...defaultOptions, ...(options || {}) };
  if (!validateDocument(doc)) return null;
  return (
    <div>
      {doc.children.map((n, i) => (
        <React.Fragment key={i}>{renderNode(n, opts)}</React.Fragment>
      ))}
    </div>
  );
}
