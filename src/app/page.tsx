import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Renderer Demo</h1>
      <p>
        This is a minimal Next.js + Tailwind scaffold using a recursive renderer. Use the preview route
        to render JSON from localStorage.
      </p>
      <div className="space-x-3">
        <Link className="btn-primary inline-block" href="/p/example">
          Open example preview
        </Link>
        <Link className="btn-secondary inline-block" href="/p/custom">
          Open custom component preview
        </Link>
      </div>
      <p className="text-sm text-gray-600">
        Tip: On the preview page, click “Load example into localStorage” to seed sample JSON.
      </p>
    </main>
  );
}
