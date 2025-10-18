import React from 'react';

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">{children}</div>;
}
