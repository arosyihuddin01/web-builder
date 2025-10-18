export type SpacingKey =
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl';

export type ColorKey =
  | 'foreground'
  | 'background'
  | 'muted'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type FontSizeKey = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type FontWeightKey = 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
export type LineHeightKey = 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

export type ThemeTokens = {
  spacing: Record<SpacingKey, string>;
  color: Record<ColorKey, string>;
  typography: {
    fontSize: Record<FontSizeKey, string>;
    fontWeight: Record<FontWeightKey, string>;
    leading: Record<LineHeightKey, string>;
  };
};

export const defaultThemeTokens: ThemeTokens = {
  spacing: {
    none: 'm-0 p-0',
    xs: 'm-1 p-1',
    sm: 'm-2 p-2',
    md: 'm-4 p-4',
    lg: 'm-6 p-6',
    xl: 'm-8 p-8',
    '2xl': 'm-10 p-10',
    '3xl': 'm-12 p-12'
  },
  color: {
    foreground: 'text-gray-900 dark:text-gray-100',
    background: 'bg-white dark:bg-gray-900',
    muted: 'text-gray-500',
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-cyan-600'
  },
  typography: {
    fontSize: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl'
    },
    fontWeight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      black: 'font-black'
    },
    leading: {
      tight: 'leading-tight',
      snug: 'leading-snug',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
      loose: 'leading-loose'
    }
  }
};

export type EditorControl = {
  spacing?: SpacingKey;
  color?: ColorKey;
  fontSize?: FontSizeKey;
  fontWeight?: FontWeightKey;
  lineHeight?: LineHeightKey;
};

export function resolveEditorControlsToClasses(
  tokens: ThemeTokens,
  control: EditorControl
): string {
  const classes: string[] = [];
  if (control.spacing) classes.push(tokens.spacing[control.spacing]);
  if (control.color) classes.push(tokens.color[control.color]);
  if (control.fontSize) classes.push(tokens.typography.fontSize[control.fontSize]);
  if (control.fontWeight) classes.push(tokens.typography.fontWeight[control.fontWeight]);
  if (control.lineHeight) classes.push(tokens.typography.leading[control.lineHeight]);
  return classes.filter(Boolean).join(' ').trim();
}
