Advanced keyboard shortcuts, grouping, and z-index tools

This repository contains a minimal, framework-agnostic editor core implementing:

- Keyboard shortcuts for undo/redo, copy/paste, duplicate, group/ungroup, align commands, and selection traversal.
- Grouping functionality that wraps selected nodes into container components and manages z-index adjustments.
- Z-index inspector overlay that provides visual feedback in a canvas/container.
- Shortcut handling that is scoped to a container element to avoid global conflicts and remain accessible.

Structure

- src/editor/types.js: Core JSDoc-typed structures for nodes and state.
- src/editor/state.js: CanvasState – immutable-style state with undo/redo history and operations.
- src/editor/keyboard.js: ShortcutManager – binds keyboard shortcuts to a scope element.
- src/ui/zindex-inspector.js: DOM overlay to visualize z-index ordering.
- src/index.js: Public API exports.

Usage (vanilla, no bundler required)

1) Include the scripts via <script type="module"> in a browser, for example in demo/index.html. Or import from src/* in your own project.
2) Instantiate a CanvasState and a ShortcutManager scoped to a focusable container.
3) Optional: create a z-index inspector overlay for visual feedback.

Accessibility and conflict-free behavior

- ShortcutManager only handles events when the scope element (or its descendants) are focused, so browser/system shortcuts outside the editor are unaffected.
- It ignores keystrokes originating from editable elements (input, textarea, contenteditable), allowing assistive technology and text input workflows.
- Uses well-known combinations (Ctrl/Cmd+Z, Y, Shift+Z, C/V/D, G/Shift+G) and Alt-modified arrow keys for alignment to avoid collisions with browser defaults.

Note

This is a minimal reference implementation intended for integration in a larger app. You can adapt the state model or UI integration as needed.
