# Responsive Breakpoints and Canvas Preview Controls

This package defines a simple responsive breakpoint model and utilities to compute effective element styles/props with per-breakpoint overrides. It also includes a small canvas preview controller to simulate viewport widths, and unit tests for the breakpoint merge logic.

- Breakpoints: `sm` (0px), `md` (640px), `lg` (1024px)
- Mobile-first cascade: base -> sm -> md -> lg for widths meeting each breakpoint's min-width.

## Scripts

- `npm run build` — Type-check and build to `dist/`
- `npm run typecheck` — Type-check with no emit
- `npm test` — Run unit tests (vitest)

## API

- `getActiveBreakpoints(widthPx)` — Returns an array of active breakpoints for a viewport width
- `computeEffectiveElement(element, widthPx)` — Merges base and overrides for all active breakpoints to produce effective props/styles
- `updateOverride(element, breakpoint, patch)` — Immutably update an element's overrides
- `CanvasPreviewController` — Minimal controller to simulate a resizable canvas viewport and render effective element props/styles

## Schemas

JSON Schemas for the breakpoint and element model live under `src/schemas/`.

## Tests

See `tests/overrides.test.ts` for coverage of the responsive merge logic and update helper.
