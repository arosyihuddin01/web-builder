import { applyAction } from '@src/renderer/actions';
import type { Document } from '@src/renderer/types';

const sample: Document = {
  type: 'doc',
  children: [
    {
      type: 'paragraph',
      spacing: 'sm',
      children: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'world', marks: ['italic'] }
      ]
    }
  ]
};

describe('action handling', () => {
  it('toggles bold across text nodes', () => {
    const a = applyAction(sample, { type: 'toggleBold' });
    const firstMarks = (a.children[0] as any).children[0].marks;
    const secondMarks = (a.children[0] as any).children[1].marks;
    expect(firstMarks).toContain('bold');
    expect(secondMarks).toContain('bold');

    const b = applyAction(a, { type: 'toggleBold' });
    const firstMarks2 = (b.children[0] as any).children[0].marks;
    const secondMarks2 = (b.children[0] as any).children[1].marks;
    expect(firstMarks2 ?? []).not.toContain('bold');
    expect(secondMarks2 ?? []).not.toContain('bold');
  });

  it('sets text color token and paragraph spacing', () => {
    const a = applyAction(sample, { type: 'setTextColor', color: 'primary' });
    const color = (a.children[0] as any).children[1].color;
    expect(color).toBe('primary');

    const b = applyAction(a, { type: 'setParagraphSpacing', spacing: 'xl' });
    const spacing = (b.children[0] as any).spacing;
    expect(spacing).toBe('xl');
  });
});
