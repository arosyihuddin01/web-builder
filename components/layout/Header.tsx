import Link from 'next/link';

export default function Header() {
  return (
    <div className="flex h-14 items-center justify-between gap-4 border-b bg-white/70 px-4 backdrop-blur dark:bg-neutral-950/70">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded bg-primary" />
        <Link href="/" className="text-sm font-semibold">
          Editor
        </Link>
      </div>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/editor" className="rounded px-2 py-1 hover:bg-muted">
          Editor
        </Link>
      </nav>
    </div>
  );
}
