export type StyleTokens = {
  bg?: string; // e.g. 'gray-100', 'blue-500'
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  textColor?: string; // e.g. 'gray-800'
  textSize?: 'sm' | 'base' | 'lg' | 'xl';
  className?: string; // passthrough
};

export function bgClass(token?: string): string {
  if (!token) return '';
  return `bg-${token}`;
}

export function paddingClass(token?: StyleTokens['padding']): string {
  switch (token) {
    case 'none': return 'p-0';
    case 'xs': return 'p-1';
    case 'sm': return 'p-2';
    case 'md': return 'p-3';
    case 'lg': return 'p-4';
    case 'xl': return 'p-6';
    default: return '';
  }
}

export function radiusClass(token?: StyleTokens['radius']): string {
  switch (token) {
    case 'none': return 'rounded-none';
    case 'sm': return 'rounded-sm';
    case 'md': return 'rounded';
    case 'lg': return 'rounded-lg';
    case 'full': return 'rounded-full';
    default: return '';
  }
}

export function textColorClass(token?: string): string {
  if (!token) return '';
  return `text-${token}`;
}

export function textSizeClass(token?: StyleTokens['textSize']): string {
  switch (token) {
    case 'sm': return 'text-sm';
    case 'base': return 'text-base';
    case 'lg': return 'text-lg';
    case 'xl': return 'text-xl';
    default: return '';
  }
}

export function tailwindClasses(style?: StyleTokens): string {
  if (!style) return '';
  return [
    bgClass(style.bg),
    paddingClass(style.padding),
    radiusClass(style.radius),
    textColorClass(style.textColor),
    textSizeClass(style.textSize),
    style.className || ''
  ].filter(Boolean).join(' ');
}
