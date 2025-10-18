import { createEventBus } from '../eventBus';
import type { EditorNode, EditorSnapshot } from '../editor/state/types';
import { createRootNode } from '../editor/state/types';

export type Page = {
  id: string;
  name: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  data: EditorSnapshot;
};

export type StoreState = {
  version: number;
  currentPageId: string | null;
  pages: Page[];
};

export type EditorStore = ReturnType<typeof createEditorStore>;

export const STORE_VERSION = 1;
const DEFAULT_NAMESPACE = 'default';

function now(): number { return Date.now(); }

function randomId(prefix = 'pg'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target as any).tagName) return false;
  const el = target as HTMLElement;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || (el as any).isContentEditable) return true;
  return false;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: any;
  const debounced = (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  (debounced as any).flush = () => { clearTimeout(t); fn(); };
  return debounced as T & { flush: () => void };
}

function defaultSnapshot(): EditorSnapshot {
  return { tree: createRootNode(), selection: [] };
}

export function createEditorStore(options?: { namespace?: string; debounceMs?: number }) {
  const namespace = options?.namespace || DEFAULT_NAMESPACE;
  const debounceMs = options?.debounceMs ?? 200;
  const STORAGE_KEY = `app.editor.pages.${namespace}.v${STORE_VERSION}`;

  const events = createEventBus();

  function load(): StoreState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoreState;
        // basic validation
        if (typeof parsed?.version === 'number' && Array.isArray(parsed.pages)) {
          return parsed;
        }
      }
    } catch {}
    // default empty store
    const firstId = randomId();
    return {
      version: STORE_VERSION,
      currentPageId: firstId,
      pages: [{ id: firstId, name: 'Untitled', version: 1, createdAt: now(), updatedAt: now(), data: defaultSnapshot() }]
    };
  }

  function save(state: StoreState) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  let state: StoreState = load();
  const persist = debounce(() => save(state), debounceMs);

  function getState(): StoreState { return JSON.parse(JSON.stringify(state)); }

  function listPages(): Page[] { return state.pages.slice().sort((a,b) => a.createdAt - b.createdAt); }

  function getPage(id: string): Page | undefined { return state.pages.find(p => p.id === id); }

  function getCurrentPage(): Page | undefined {
    const id = state.currentPageId;
    return id ? getPage(id) : undefined;
  }

  function setCurrentPage(id: string): void {
    if (state.currentPageId === id) return;
    if (!getPage(id)) return;
    state.currentPageId = id;
    events.emit('page:changed', id);
    persist();
  }

  function createPage(name = 'Untitled', data: EditorSnapshot = defaultSnapshot()): string {
    const id = randomId();
    const page: Page = { id, name, version: 1, createdAt: now(), updatedAt: now(), data: JSON.parse(JSON.stringify(data)) };
    state.pages.push(page);
    state.currentPageId = id;
    events.emit('page:created', page);
    persist();
    return id;
  }

  function renamePage(id: string, name: string): void {
    const page = getPage(id);
    if (!page) return;
    page.name = name;
    page.updatedAt = now();
    events.emit('page:renamed', { id, name });
    persist();
  }

  function updatePage(id: string, data: EditorSnapshot): void {
    const page = getPage(id);
    if (!page) return;
    page.data = JSON.parse(JSON.stringify(data));
    page.updatedAt = now();
    events.emit('page:updated', { id });
    persist();
  }

  function duplicatePage(id: string, newName?: string): string | null {
    const page = getPage(id);
    if (!page) return null;
    const copyId = randomId();
    const copy: Page = {
      id: copyId,
      name: newName || `${page.name} Copy`,
      version: page.version,
      createdAt: now(),
      updatedAt: now(),
      data: JSON.parse(JSON.stringify(page.data))
    };
    state.pages.push(copy);
    state.currentPageId = copyId;
    events.emit('page:duplicated', { from: id, to: copyId });
    persist();
    return copyId;
  }

  function deletePage(id: string): void {
    const idx = state.pages.findIndex(p => p.id === id);
    if (idx === -1) return;
    const [removed] = state.pages.splice(idx, 1);
    events.emit('page:deleted', removed);
    if (state.currentPageId === id) {
      state.currentPageId = state.pages[0]?.id ?? null;
      events.emit('page:changed', state.currentPageId);
    }
    persist();
  }

  // Serialization helpers (explicit for tests and future migrations)
  function serializeSnapshot(s: EditorSnapshot): string {
    return JSON.stringify(s);
  }
  function deserializeSnapshot(json: string): EditorSnapshot {
    const parsed = JSON.parse(json);
    // naive validation
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid snapshot');
    if (!parsed.tree || !parsed.selection) throw new Error('Invalid snapshot');
    return parsed as EditorSnapshot;
  }

  // Simple keyboard binding for undo/redo consumers can use
  function bindUndoRedoShortcuts(handlers: { undo: () => void; redo: () => void }): () => void {
    const onKeyDown = (e: KeyboardEvent) => {
      // scope guard: ignore edits in inputs
      if (isEditableTarget(e.target)) return;
      const isMac = /(Mac|iPhone|iPod|iPad)/.test(navigator.platform || (navigator as any).userAgentData?.platform || '');
      const meta = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();
      const shift = e.shiftKey;
      if (meta && key === 'z' && !shift) {
        e.preventDefault(); e.stopPropagation(); handlers.undo();
      } else if ((meta && key === 'z' && shift) || (!isMac && e.ctrlKey && key === 'y')) {
        e.preventDefault(); e.stopPropagation(); handlers.redo();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }

  return {
    events,
    getState,
    listPages,
    getPage,
    getCurrentPage,
    setCurrentPage,
    createPage,
    renamePage,
    updatePage,
    deletePage,
    duplicatePage,
    serializeSnapshot,
    deserializeSnapshot,
    bindUndoRedoShortcuts,
  };
}

export type PageSwitcherAction =
  | { type: 'switch'; id: string }
  | { type: 'rename'; id: string; name: string }
  | { type: 'duplicate'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'create' };

export function useKeyboardUndoRedo(store: EditorStore, handlers: { undo: () => void; redo: () => void }) {
  // tiny helper to bind/unbind in React land
  return store.bindUndoRedoShortcuts(handlers);
}
