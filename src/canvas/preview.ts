import { Breakpoint, getActiveBreakpointName, getActiveBreakpoints } from '../breakpoints';
import { computeEffectiveElement, ElementModel, EffectiveElement } from '../overrides';

/**
 * CanvasPreviewController simulates a resizable viewport and computes effective
 * element props/styles based on responsive breakpoint overrides.
 */
export class CanvasPreviewController {
  private widthPx: number;

  constructor(initialWidthPx: number = 375) {
    this.widthPx = Math.max(0, Math.floor(initialWidthPx));
  }

  get width(): number {
    return this.widthPx;
  }

  setWidth(nextWidthPx: number): void {
    this.widthPx = Math.max(0, Math.floor(nextWidthPx));
  }

  getActiveBreakpoint(): Breakpoint {
    return getActiveBreakpointName(this.widthPx);
  }

  getActiveBreakpoints(): Breakpoint[] {
    return getActiveBreakpoints(this.widthPx);
  }

  render(element: ElementModel): EffectiveElement {
    return computeEffectiveElement(element, this.widthPx);
  }
}
