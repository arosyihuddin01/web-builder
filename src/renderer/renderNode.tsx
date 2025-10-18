import React from 'react';
import clsx from 'clsx';
import type { Document, HeadingNode, ListNode, Node, ParagraphNode, TextNode } from './types';
import { defaultThemeTokens, resolveEditorControlsToClasses } from '../theme/tokens';
import { isDocument, isNode } from '../schema/guards';

export type RendererOptions = {
  theme?: typeof defaultThemeTokens;
};

function renderText(node: TextNode): React.ReactNode {
  let content: React.ReactNode = node.text;
  if (node.marks?.includes('code')) content = <code className="font-mono bg-gray-100 px-1 rounded">{content}</code>;
  if (node.marks?.includes('underline')) content = <u>{content}</u>;
  if (node.marks?.includes('italic')) content = <em>{content}</em>;
  if (node.marks?.includes('bold')) content = <strong>{content}</strong>;
  const colorClass = node.color ? defaultThemeTokens.color[node.color] : undefined;
  return <span className={clsx(colorClass)}>{content}</span>;
}

function renderHeading(node: HeadingNode): React.ReactNode {
  const Tag = (`h${node.level}` as unknown) as keyof JSX.IntrinsicElements;
  const classes = resolveEditorControlsToClasses(defaultThemeTokens, {
    fontSize: node.fontSize ?? (node.level === 1 ? '3xl' : node.level === 2 ? '2xl' : node.level === 3 ? 'xl' : 'lg'),
    fontWeight: node.fontWeight ?? 'semibold'
  });
  return <Tag className={classes}>{node.children.map((c, i) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>)}</Tag>;
}

function renderParagraph(node: ParagraphNode): React.ReactNode {
  const classes = resolveEditorControlsToClasses(defaultThemeTokens, {
    spacing: node.spacing ?? 'md'
  });
  return <p className={classes}>{node.children.map((c, i) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>)}</p>;
}

function renderList(node: ListNode): React.ReactNode {
  const Tag = node.ordered ? 'ol' : 'ul';
  return React.createElement(
    Tag as any,
    { className: clsx('list-inside', node.ordered ? 'list-decimal' : 'list-disc', 'space-y-1') },
    node.children.map((item, i) => <li key={i}>{item.children.map((c, j) => <React.Fragment key={j}>{renderNode(c)}</React.Fragment>)}</li>)
  );
}

export function renderNode(node: Node): React.ReactNode {
  if (!isNode(node)) return null;
  switch (node.type) {
    case 'text':
      return renderText(node);
    case 'heading':
      return renderHeading(node);
    case 'paragraph':
      return renderParagraph(node);
    case 'list':
      return renderList(node);
    case 'listItem':
      return <>{node.children.map((c, i) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>)}</>;
    case 'link':
      return (
        <a href={node.href} className="text-blue-600 underline underline-offset-2">
          {node.children.map((c, i) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>)}
        </a>
      );
    default:
      return null;
  }
}

export function Renderer({ doc }: { doc: Document }): JSX.Element | null {
  if (!isDocument(doc)) return null;
  return (
    <div className={clsx(defaultThemeTokens.color.foreground)}>
      {doc.children.map((n, i) => (
        <React.Fragment key={i}>{renderNode(n)}</React.Fragment>
      ))}
    </div>
  );
}
