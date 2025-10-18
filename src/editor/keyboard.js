import { _internal } from "./state.js";

/**
 * Detect macOS-like platform for meta key behavior.
 */
function isMacLike() {
  if (typeof navigator === "undefined") return false;
  const p = navigator.platform || navigator.userAgentData?.platform || "";
  return /Mac|iPhone|iPod|iPad/.test(p);
}

/**
 * ShortcutManager binds keyboard commands to a scope element.
 * It ignores keystrokes from text inputs and contenteditable elements.
 */
export class ShortcutManager {
  /**
   * @param {Object} options
   * @param {HTMLElement | Document} options.scope Scope element or document – must be focusable/active to receive key events
   * @param {import('./state.js').CanvasState} options.state
   * @param {(type:string)=>void} [options.onHandled] Called when a command is executed (e.g., to trigger UI refresh)
   * @param {boolean} [options.isMac] Force mac-like behavior
   */
  constructor({ scope, state, onHandled, isMac }) {
    this.scope = scope || document;
    this.state = state;
    this.onHandled = onHandled || (() => {});
    this.isMac = typeof isMac === "boolean" ? isMac : isMacLike();

    this._handleKeyDown = this._handleKeyDown.bind(this);
    // capture phase to preempt default when necessary
    this.scope.addEventListener("keydown", this._handleKeyDown, true);
  }

  destroy() {
    this.scope.removeEventListener("keydown", this._handleKeyDown, true);
  }

  /** @param {KeyboardEvent} e */
  _handleKeyDown(e) {
    // Must be within scope; if scope is document, allow always. If HTMLElement, ensure event target is inside it.
    const validScope = (this.scope === document) || (this.scope instanceof HTMLElement && this.scope.contains(/** @type {Node} */(e.target)));
    if (!validScope) return;
    if (_internal.isEditableTarget(e.target)) return; // don't hijack typing

    const meta = this.isMac ? e.metaKey : e.ctrlKey;
    const ctrl = e.ctrlKey;
    const alt = e.altKey;
    const shift = e.shiftKey;
    const key = e.key;

    const exec = (fn, type) => {
      try { fn.call(this.state); } catch {}
      e.preventDefault();
      e.stopPropagation();
      this.onHandled(type);
    };

    // Undo/redo
    if (meta && !shift && !alt && (key === "z" || key === "Z")) return exec(this.state.undo, "undo");
    if ((meta && shift && (key === "z" || key === "Z")) || (!this.isMac && ctrl && !shift && key.toLowerCase() === "y")) return exec(this.state.redo, "redo");

    // Copy/Paste/Duplicate
    if (meta && !shift && !alt && key.toLowerCase() === "c") {
      this.state.copySelection();
      // Do not prevent default to allow OS clipboard copy for text outside scope,
      // but inside our scope we do want to avoid ghost copy into DOM, so prevent.
      e.preventDefault(); e.stopPropagation();
      this.onHandled("copy");
      return;
    }
    if (meta && !shift && !alt && key.toLowerCase() === "v") return exec(() => this.state.pasteClipboard({ x: 16, y: 16 }), "paste");
    if (meta && !shift && !alt && key.toLowerCase() === "d") return exec(() => this.state.duplicateSelection({ x: 10, y: 10 }), "duplicate");

    // Group / Ungroup
    if (meta && !shift && !alt && key.toLowerCase() === "g") return exec(this.state.groupSelection, "group");
    if (meta && shift && !alt && key.toLowerCase() === "g") return exec(this.state.ungroupSelection, "ungroup");

    // Align with Ctrl/Cmd+Alt+(Arrows or H/V)
    if (meta && alt && !shift) {
      if (key === "ArrowLeft") return exec(() => this.state.alignSelection("left"), "align-left");
      if (key === "ArrowRight") return exec(() => this.state.alignSelection("right"), "align-right");
      if (key === "ArrowUp") return exec(() => this.state.alignSelection("top"), "align-top");
      if (key === "ArrowDown") return exec(() => this.state.alignSelection("bottom"), "align-bottom");
      if (key.toLowerCase() === "h") return exec(() => this.state.alignSelection("hcenter"), "align-hcenter");
      if (key.toLowerCase() === "v") return exec(() => this.state.alignSelection("vcenter"), "align-vcenter");
    }

    // Z-order shortcuts: Cmd/Ctrl + [ ] (with shift for toBack/toFront)
    if (meta && !alt) {
      if (key === "]" && !shift) return exec(this.state.bringForward, "bring-forward");
      if (key === "[" && !shift) return exec(this.state.sendBackward, "send-backward");
      if (key === "]" && shift) return exec(this.state.bringToFront, "bring-to-front");
      if (key === "[" && shift) return exec(this.state.sendToBack, "send-to-back");
    }

    // Selection traversal via Tab / Shift+Tab
    if (key === "Tab") {
      if (!shift) return exec(this.state.selectNext, "select-next");
      else return exec(this.state.selectPrev, "select-prev");
    }
  }
}
