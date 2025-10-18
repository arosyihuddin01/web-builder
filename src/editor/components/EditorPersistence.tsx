import { useEffect, useMemo } from 'react';
import type { EditorStore } from '../../store/editorStore';
import { useEditor } from '../state/EditorContext';

function useDebounced<T extends (...args: any[]) => void>(fn: T, ms: number) {
  const timer = useMemo<{ id: any | null }>({ id: null }, []);
  useEffect(() => () => { if (timer.id) clearTimeout(timer.id); }, [timer]);
  return ((...args: any[]) => {
    if (timer.id) clearTimeout(timer.id);
    timer.id = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function EditorPersistence({ store, debounceMs = 200 }: { store: EditorStore; debounceMs?: number }) {
  const { tree, selection } = useEditor();
  const debounced = useDebounced((pageId: string, payload: any) => {
    store.updatePage(pageId, payload);
  }, debounceMs);

  useEffect(() => {
    const current = store.getState().currentPageId;
    if (!current) return;
    debounced(current, { tree, selection });
  }, [tree, selection, store, debounced]);

  return null;
}
