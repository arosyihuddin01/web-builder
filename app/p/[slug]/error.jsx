'use client';

export default function Error({ error, reset }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Something went wrong</h1>
      <p style={{ color: '#b91c1c' }}>{String(error?.message || 'Unknown error')}</p>
      <button onClick={() => reset()} style={{ marginTop: 12 }}>Try again</button>
    </main>
  );
}
