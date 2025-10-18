import { describe, it, expect } from 'vitest';
import { computeEffectiveElement, updateOverride, type ElementModel } from '../src/overrides';

const baseElement: ElementModel = {
  id: 'el1',
  base: {
    style: { color: 'black', padding: { top: 4, right: 4, bottom: 4, left: 4 } },
    props: { text: 'Hello', disabled: false },
  },
  overrides: {},
};

describe('computeEffectiveElement (responsive cascade)', () => {
  it('returns base when no overrides exist', () => {
    const eff = computeEffectiveElement(baseElement, 375); // sm
    expect(eff.style).toEqual({ color: 'black', padding: { top: 4, right: 4, bottom: 4, left: 4 } });
    expect(eff.props).toEqual({ text: 'Hello', disabled: false });
  });

  it('applies sm overrides when width >= sm', () => {
    const el: ElementModel = {
      ...baseElement,
      overrides: {
        sm: { style: { color: 'blue' }, props: { text: 'Hi' } },
      },
    };

    const eff = computeEffectiveElement(el, 400); // sm
    expect(eff.style).toEqual({ color: 'blue', padding: { top: 4, right: 4, bottom: 4, left: 4 } });
    expect(eff.props).toEqual({ text: 'Hi', disabled: false });
  });

  it('applies sm and md overrides in order for md', () => {
    const el: ElementModel = {
      ...baseElement,
      overrides: {
        sm: { style: { color: 'blue', padding: { left: 8 } } },
        md: { style: { padding: { right: 12 } }, props: { disabled: true } },
      },
    };

    const eff = computeEffectiveElement(el, 768); // md
    expect(eff.style).toEqual({
      color: 'blue',
      padding: { top: 4, right: 12, bottom: 4, left: 8 },
    });
    expect(eff.props).toEqual({ text: 'Hello', disabled: true });
  });

  it('applies sm, md and lg overrides in order for lg', () => {
    const el: ElementModel = {
      ...baseElement,
      overrides: {
        sm: { style: { color: 'blue' } },
        md: { style: { color: 'green' } },
        lg: { style: { color: 'red' }, props: { text: 'Welcome' } },
      },
    };

    const eff = computeEffectiveElement(el, 1280); // lg
    expect(eff.style).toEqual({
      color: 'red',
      padding: { top: 4, right: 4, bottom: 4, left: 4 },
    });
    expect(eff.props).toEqual({ text: 'Welcome', disabled: false });
  });

  it('deep merges nested style objects without clobbering siblings', () => {
    const el: ElementModel = {
      ...baseElement,
      overrides: {
        sm: { style: { padding: { left: 8 } } },
        md: { style: { padding: { bottom: 16 } } },
      },
    };

    const eff = computeEffectiveElement(el, 900); // md
    expect(eff.style).toEqual({
      color: 'black',
      padding: { top: 4, right: 4, bottom: 16, left: 8 },
    });
  });
});

describe('updateOverride', () => {
  it('creates or updates overrides immutably via deep merge', () => {
    const el1: ElementModel = {
      ...baseElement,
      overrides: {
        sm: { style: { color: 'blue', padding: { left: 8 } } },
      },
    };

    const el2 = updateOverride(el1, 'sm', { style: { padding: { right: 12 } } });

    // original remains unchanged
    expect(el1.overrides.sm).toEqual({ style: { color: 'blue', padding: { left: 8 } } });

    // merged result
    expect(el2.overrides.sm).toEqual({ style: { color: 'blue', padding: { left: 8, right: 12 } } });

    // adding a new breakpoint
    const el3 = updateOverride(el2, 'md', { props: { disabled: true } });
    expect(el3.overrides.md).toEqual({ props: { disabled: true } });
  });
});
