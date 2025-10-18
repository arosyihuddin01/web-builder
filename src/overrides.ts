import { Breakpoint, getActiveBreakpoints, sortBreakpointsAscending } from './breakpoints';

export type Dict = Record<string, unknown>;

export interface ElementBase {
  style?: Dict;
  props?: Dict;
}

export type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>;

export interface ElementOverridesPerBreakpoint {
  style?: Dict;
  props?: Dict;
}

export interface ElementModel {
  id: string;
  base: ElementBase;
  overrides: PartialRecord<Breakpoint, ElementOverridesPerBreakpoint>;
}

// Deep merge utility (immutable)
export function deepMerge<T extends Dict, U extends Dict>(a: T | undefined, b: U | undefined): T & U {
  const result: Dict = { ...(a ?? {}) };
  const src = b ?? {};
  for (const [key, value] of Object.entries(src)) {
    const current = (result as any)[key];
    if (isPlainObject(current) && isPlainObject(value)) {
      (result as any)[key] = deepMerge(current as Dict, value as Dict);
    } else {
      (result as any)[key] = value;
    }
  }
  return result as T & U;
}

function isPlainObject(v: unknown): v is Dict {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export interface EffectiveElement extends Required<ElementBase> {}

/**
 * Compute effective element props given a viewport width. Mobile-first cascade:
 * base -> sm -> md -> lg (apply in ascending minWidth order for all breakpoints
 * whose minWidth <= widthPx)
 */
export function computeEffectiveElement(
  element: ElementModel,
  widthPx: number
): EffectiveElement {
  const active = getActiveBreakpoints(widthPx);
  // Apply base first
  let style: Dict = { ...(element.base.style ?? {}) };
  let props: Dict = { ...(element.base.props ?? {}) };

  // Apply each active breakpoint override in ascending order
  for (const bp of sortBreakpointsAscending(active.map((name) => ({ name })) as any).map((s) => s.name as Breakpoint)) {
    const ovr = element.overrides[bp];
    if (!ovr) continue;
    style = deepMerge(style, ovr.style);
    props = deepMerge(props, ovr.props);
  }

  return { style, props };
}

/**
 * Update an element override for a breakpoint, returning a new model.
 */
export function updateOverride(
  element: ElementModel,
  bp: Breakpoint,
  patch: ElementOverridesPerBreakpoint
): ElementModel {
  return {
    ...element,
    overrides: {
      ...element.overrides,
      [bp]: deepMerge(element.overrides[bp] ?? {}, patch),
    },
  };
}
