import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Preview routes</h1>
      <p>Try opening a preview page like <code>/p/welcome</code> or <code>/p/example</code>.</p>
      <ul>
        <li><Link href="/p/welcome">/p/welcome</Link></li>
        <li><Link href="/p/example">/p/example</Link></li>
      </ul>
    </main>
  );
}
