export default function Sidebar() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Sidebar</h2>
      <ul className="mt-3 space-y-1 text-sm">
        <li className="rounded px-2 py-1 hover:bg-muted">Layers</li>
        <li className="rounded px-2 py-1 hover:bg-muted">Assets</li>
        <li className="rounded px-2 py-1 hover:bg-muted">Inspector</li>
      </ul>
    </div>
  );
}
