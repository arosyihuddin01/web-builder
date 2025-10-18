import React from 'react';
import { render, screen } from '@testing-library/react';
import { Renderer, renderNode } from '@src/renderer/renderNode';
import type { Document, Node } from '@src/renderer/types';

describe('renderNode mappings', () => {
  it('renders heading levels with default typography classes', () => {
    const node: Node = {
      type: 'heading',
      level: 1,
      children: [{ type: 'text', text: 'Hello' }]
    };
    const { container } = render(<>{renderNode(node)}</>);
    const h = container.querySelector('h1')!;
    expect(h).toBeInTheDocument();
    // default font size for h1 is text-3xl and font-semibold
    expect(h.className).toMatch(/text-3xl/);
    expect(h.className).toMatch(/font-semibold/);
    expect(h).toHaveTextContent('Hello');
  });

  it('renders paragraph with spacing class', () => {
    const node: Node = {
      type: 'paragraph',
      spacing: 'lg',
      children: [{ type: 'text', text: 'Body' }]
    };
    const { container } = render(<>{renderNode(node)}</>);
    const p = container.querySelector('p')!;
    expect(p.className).toMatch(/m-6 p-6/);
    expect(p).toHaveTextContent('Body');
  });

  it('renders lists and links correctly', () => {
    const node: Node = {
      type: 'list',
      ordered: true,
      children: [
        {
          type: 'listItem',
          children: [
            {
              type: 'link',
              href: 'https://example.com',
              children: [{ type: 'text', text: 'Example' }]
            }
          ]
        }
      ]
    };
    const { container } = render(<>{renderNode(node)}</>);
    const ol = container.querySelector('ol');
    expect(ol).toBeInTheDocument();
    const a = container.querySelector('a');
    expect(a).toBeInTheDocument();
    expect(a).toHaveAttribute('href', 'https://example.com');
    expect(a).toHaveTextContent('Example');
  });

  it('returns null for invalid nodes', () => {
    // @ts-expect-error invalid node
    const invalid: Node = { type: 'unknown' };
    const { container } = render(<>{renderNode(invalid)}</>);
    // nothing rendered
    expect(container.textContent).toBe('');
  });

  it('Renderer renders document with theme foreground color', () => {
    const doc: Document = {
      type: 'doc',
      children: [
        { type: 'paragraph', children: [{ type: 'text', text: 'Body' }] },
        { type: 'heading', level: 2, children: [{ type: 'text', text: 'Title' }] }
      ]
    };
    const { container } = render(<Renderer doc={doc} />);
    expect(container.firstChild).toHaveClass('text-gray-900');
    expect(container.firstChild).toHaveTextContent('Body');
    expect(container.firstChild).toHaveTextContent('Title');
  });
});
