import React, { useEffect, useMemo, useState } from 'react';
import type { EditorStore, Page } from '../../store/editorStore';
import { Panel } from './ui/Panel';

export function PageSwitcherModal({ store, open, onClose }: { store: EditorStore; open: boolean; onClose: () => void }) {
  const [pages, setPages] = useState<Page[]>(() => store.listPages());
  const [currentId, setCurrentId] = useState<string | null>(store.getState().currentPageId);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const offA = store.events.on('page:created', () => setPages(store.listPages()));
    const offB = store.events.on('page:renamed', () => setPages(store.listPages()));
    const offC = store.events.on('page:deleted', () => setPages(store.listPages()));
    const offD = store.events.on('page:duplicated', () => setPages(store.listPages()));
    const offE = store.events.on('page:changed', (id: string) => setCurrentId(id));
    return () => { offA(); offB(); offC(); offD(); offE(); };
  }, [store]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.name.toLowerCase().includes(q));
  }, [pages, filter]);

  const onSelect = (id: string) => { store.setCurrentPage(id); onClose(); };
  const onRename = (id: string) => {
    const name = prompt('Rename page', store.getPage(id)?.name || 'Untitled');
    if (!name) return; store.renamePage(id, name);
  };
  const onDuplicate = (id: string) => { store.duplicatePage(id); };
  const onDelete = (id: string) => { if (confirm('Delete this page?')) store.deletePage(id); };
  const onCreate = () => { store.createPage('Untitled'); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded shadow-lg w-[520px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <Panel title="Pages" toolbar={<>
          <input aria-label="Filter" className="border rounded px-2 py-1 text-sm" placeholder="Filter..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          <button className="btn primary ml-2" onClick={onCreate}>New Page</button>
        </>}>
          <div className="max-h-[50vh] overflow-auto">
            {filtered.map((p) => (
              <div key={p.id} className={"flex items-center justify-between px-2 py-1 text-sm " + (p.id === currentId ? 'bg-blue-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800')}>
                <button className="text-left flex-1" onClick={() => onSelect(p.id)}>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[11px] text-gray-500">Updated {new Date(p.updatedAt).toLocaleString()}</div>
                </button>
                <div className="flex items-center gap-1">
                  <button className="btn small" onClick={() => onRename(p.id)}>Rename</button>
                  <button className="btn small" onClick={() => onDuplicate(p.id)}>Duplicate</button>
                  <button className="btn small danger" onClick={() => onDelete(p.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
