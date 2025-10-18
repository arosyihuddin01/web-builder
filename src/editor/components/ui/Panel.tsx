import React from 'react';
import clsx from 'clsx';

export function Panel({ title, toolbar, children, className }: { title: string; toolbar?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section
      className={clsx(
        'border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden bg-white dark:bg-gray-900 flex flex-col',
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-3 py-2 bg-gray-50 dark:bg-gray-950">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
        {toolbar ? <div className="flex items-center gap-1">{toolbar}</div> : null}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}
