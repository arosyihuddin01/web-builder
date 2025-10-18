# Renderer validation tests and theme token polish

This repository contains a small React-based renderer, a Tailwind-like theme token system, and a suite of unit tests validating renderer mappings, action handling, and schema guards.

## Overview

- Theme tokens: A minimal Tailwind-compatible token map for spacing, color, and typography that can be driven by editor controls.
- Renderer: Converts a simple document schema into React elements with utility classes derived from theme tokens.
- Actions: Pure functions to update a document (toggle bold, set text color, set paragraph spacing).
- Guards: Type guards ensuring only valid nodes and documents are processed by the renderer.

## Directory structure

- src/theme/tokens.ts – Theme token definitions and a helper to map editor controls to class strings.
- src/renderer/types.ts – Document schema types.
- src/renderer/renderNode.tsx – React renderer for nodes and a high-level <Renderer /> component.
- src/renderer/actions.ts – Action definitions and reducers to update a document tree.
- src/schema/guards.ts – Type guards for Nodes and Documents.
- tests/**/* – Jest + React Testing Library specs.

## Theming guidelines

The theme token contract lives in `src/theme/tokens.ts`.

- Spacing tokens are coarse-grained, tuned to editor controls: `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`. Each maps to combined margin and padding utilities (e.g. `m-4 p-4`).
- Color tokens map to semantic roles used by an editor’s toolbar or block inspector: `foreground`, `background`, `muted`, `primary`, `secondary`, `success`, `warning`, `danger`, `info`. These map to Tailwind text/background utilities.
- Typography tokens cover `fontSize`, `fontWeight`, and line-height (`leading`) and are intentionally limited to sensible defaults for editor UX.

Use `resolveEditorControlsToClasses(tokens, control)` to translate selected editor controls into a class string to attach to rendered nodes.

You can provide your own token set by passing it through the renderer in future extensions. The current implementation uses a `defaultThemeTokens` internally for simplicity.

## Testing strategy

This repo uses Jest + React Testing Library and runs in the jsdom environment.

- renderNode mappings: We verify that each supported node type renders with the correct HTML tag and applies expected classes derived from theme tokens.
- action handling: Reducer functions are tested to ensure state updates are pure and idempotent where appropriate (e.g., toggle bold on/off), and that editor-related attributes (spacing, color) are applied.
- schema guards: Negative and positive cases validate the guard behavior, ensuring the renderer short-circuits on invalid input.
- theme token resolution: Unit tests ensure editor control selections are converted into the correct Tailwind utility classes.

## Local development

- Install dependencies: `npm install`
- Run tests once with coverage: `npm test`
- Watch tests: `npm run test:watch`
- Type check: `npm run typecheck`

No external Tailwind dependency is required; the renderer simply outputs Tailwind utility class names.

## Notes

- CI configuration: The project is configured to run tests locally through npm scripts. You can integrate with your preferred CI by invoking `npm ci && npm test`. GitHub Actions or other workflow files are intentionally omitted here per guidelines.
