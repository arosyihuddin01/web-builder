import { isDocument, isNode } from '@src/schema/guards';
import type { Document, Node } from '@src/renderer/types';

describe('schema guards', () => {
  it('rejects invalid nodes', () => {
    const invalids: any[] = [
      null,
      undefined,
      123,
      'text',
      {},
      { type: 'text' },
      { type: 'heading', level: 5, children: [] },
      { type: 'link', href: 42, children: [] },
      { type: 'list', children: [{}] }
    ];
    invalids.forEach((v) => expect(isNode(v)).toBe(false));
  });

  it('rejects invalid document', () => {
    const invalid: any = { type: 'doc', children: [{}] };
    expect(isDocument(invalid)).toBe(false);
  });

  it('accepts valid document', () => {
    const doc: Document = { type: 'doc', children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Ok' }] }] };
    expect(isDocument(doc)).toBe(true);
  });
});
