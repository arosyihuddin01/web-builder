import React from 'react';

export type Tab = { id: string; label: string };

export function Tabs({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={
            'px-2 py-1 text-xs rounded border ' +
            (active === t.id
              ? 'bg-blue-100 text-blue-700 border-blue-300'
              : 'bg-transparent text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800')
          }
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ hidden, children }: { hidden?: boolean; children: React.ReactNode }) {
  if (hidden) return null;
  return <div className="p-2">{children}</div>;
}
