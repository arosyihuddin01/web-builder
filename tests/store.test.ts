import { createEditorStore, STORE_VERSION } from '@src/store/editorStore';
import type { EditorSnapshot } from '@src/editor/state/types';

describe('editorStore persistence and serialization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates, persists, and reloads pages', () => {
    const ns = 't1';
    const store = createEditorStore({ namespace: ns, debounceMs: 0 });

    // initial state has one page
    const initialPages = store.listPages();
    expect(initialPages.length).toBeGreaterThan(0);
    const firstId = store.getState().currentPageId!;

    // update first page content
    const snap: EditorSnapshot = { tree: { id: 'root', type: 'root', name: 'Page', children: [{ id: 'n1', type: 'text' as any, name: 'Text', children: [] }] as any }, selection: ['n1'] };
    store.updatePage(firstId, snap);

    // localStorage should now contain serialized state
    const key = `app.editor.pages.${ns}.v${STORE_VERSION}`;
    const raw = localStorage.getItem(key);
    expect(raw).toBeTruthy();

    // reload a fresh store instance and verify state
    const store2 = createEditorStore({ namespace: ns, debounceMs: 0 });
    const pages2 = store2.listPages();
    expect(pages2.length).toBe(initialPages.length);
    const cur2 = store2.getCurrentPage()!;
    expect(cur2.id).toBe(firstId);
    expect(cur2.data.selection).toEqual(['n1']);
  });

  it('supports CRUD operations for pages', () => {
    const ns = 't2';
    const store = createEditorStore({ namespace: ns, debounceMs: 0 });

    const a = store.createPage('A');
    const b = store.createPage('B');
    expect(store.listPages().find(p => p.id === a)?.name).toBe('A');
    expect(store.listPages().find(p => p.id === b)?.name).toBe('B');

    store.renamePage(a, 'A1');
    expect(store.getPage(a)?.name).toBe('A1');

    const dup = store.duplicatePage(a, 'A2');
    expect(dup).toBeTruthy();
    expect(store.getPage(dup!)?.name).toBe('A2');

    store.deletePage(b);
    expect(store.getPage(b)).toBeUndefined();
  });

  it('serializes and deserializes snapshots', () => {
    const store = createEditorStore({ namespace: 't3', debounceMs: 0 });
    const snap: EditorSnapshot = { tree: { id: 'root', type: 'root', name: 'Page', children: [] }, selection: [] };
    const json = store.serializeSnapshot(snap);
    const parsed = store.deserializeSnapshot(json);
    expect(parsed.tree.name).toBe('Page');
  });
});
