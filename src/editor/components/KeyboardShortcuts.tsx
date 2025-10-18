import { useEffect } from 'react';
import { useEditor } from '../state/EditorContext';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target as any).tagName) return false;
  const el = target as HTMLElement;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || (el as any).isContentEditable) return true;
  return false;
}

export function KeyboardShortcuts() {
  const { undo, redo } = useEditor();
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const isMac = /(Mac|iPhone|iPod|iPad)/.test(navigator.platform || (navigator as any).userAgentData?.platform || '');
      const meta = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();
      const shift = e.shiftKey;
      if (meta && key === 'z' && !shift) { e.preventDefault(); e.stopPropagation(); undo(); }
      else if ((meta && key === 'z' && shift) || (!isMac && e.ctrlKey && key === 'y')) { e.preventDefault(); e.stopPropagation(); redo(); }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [undo, redo]);
  return null;
}
