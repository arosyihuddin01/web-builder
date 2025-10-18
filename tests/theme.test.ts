import { defaultThemeTokens, resolveEditorControlsToClasses } from '@src/theme/tokens';

describe('theme tokens mapping to classes', () => {
  it('maps editor controls to Tailwind utility classes', () => {
    const classes = resolveEditorControlsToClasses(defaultThemeTokens, {
      spacing: 'sm',
      color: 'success',
      fontSize: 'lg',
      fontWeight: 'bold',
      lineHeight: 'snug'
    });
    expect(classes).toMatch(/m-2 p-2/);
    expect(classes).toMatch(/text-green-600/);
    expect(classes).toMatch(/text-lg/);
    expect(classes).toMatch(/font-bold/);
    expect(classes).toMatch(/leading-snug/);
  });
});
