import type { Document, Node } from '../renderer/types';

export function isNode(value: unknown): value is Node {
  if (!value || typeof value !== 'object') return false;
  const v = value as any;
  if (v.type === 'text') return typeof v.text === 'string';
  if (v.type === 'heading') return [1, 2, 3, 4].includes(v.level) && Array.isArray(v.children);
  if (v.type === 'paragraph') return Array.isArray(v.children);
  if (v.type === 'list') return Array.isArray(v.children) && v.children.every((c: any) => c?.type === 'listItem');
  if (v.type === 'listItem') return Array.isArray(v.children);
  if (v.type === 'link') return typeof v.href === 'string' && Array.isArray(v.children);
  return false;
}

export function isDocument(value: unknown): value is Document {
  if (!value || typeof value !== 'object') return false;
  const v = value as any;
  return v.type === 'doc' && Array.isArray(v.children) && v.children.every(isNode);
}
