import type { ReactNode } from 'react';

export default function Shell({
  header,
  sidebar,
  children,
}: {
  header?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr]">
      {header ?? null}
      <div className="grid grid-cols-[16rem_1fr] gap-4 p-4">
        <aside className="card h-[calc(100vh-6rem)] overflow-auto p-4 dark:bg-neutral-900">
          {sidebar ?? null}
        </aside>
        <main className="max-h-[calc(100vh-6rem)] overflow-auto">{children}</main>
      </div>
    </div>
  );
}
