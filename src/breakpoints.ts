export type Breakpoint = 'sm' | 'md' | 'lg';

export interface BreakpointSpec {
  name: Breakpoint;
  minWidth: number; // mobile-first (min-width in px)
}

export const BREAKPOINTS: readonly BreakpointSpec[] = [
  { name: 'sm', minWidth: 0 },
  { name: 'md', minWidth: 640 },
  { name: 'lg', minWidth: 1024 },
] as const;

const byName: Record<Breakpoint, BreakpointSpec> = {
  sm: BREAKPOINTS[0],
  md: BREAKPOINTS[1],
  lg: BREAKPOINTS[2],
};

export function getBreakpointSpec(name: Breakpoint): BreakpointSpec {
  return byName[name];
}

export function sortBreakpointsAscending<T extends { name: Breakpoint }>(
  specs: readonly T[]
): readonly T[] {
  return [...specs].sort((a, b) => getBreakpointSpec(a.name).minWidth - getBreakpointSpec(b.name).minWidth);
}

export function getActiveBreakpoints(widthPx: number): Breakpoint[] {
  return BREAKPOINTS.filter((b) => widthPx >= b.minWidth).map((b) => b.name);
}

export function getActiveBreakpointName(widthPx: number): Breakpoint {
  const active = getActiveBreakpoints(widthPx);
  return active[active.length - 1] ?? 'sm';
}

export function isBreakpointActive(widthPx: number, bp: Breakpoint): boolean {
  return widthPx >= byName[bp].minWidth;
}
