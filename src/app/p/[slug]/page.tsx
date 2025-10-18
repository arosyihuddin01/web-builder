"use client";

import { useEffect, useMemo, useState } from 'react';
import type { RootDocument } from '@src/renderer/recursiveRenderer';
import { Renderer } from '@src/renderer/recursiveRenderer';
import { exampleDoc } from '@src/mocks/example';
import { sampleCustomComponent } from '@src/mocks/customComponent';

function isRootDocument(value: any): value is RootDocument {
  return (
    value &&
    typeof value === 'object' &&
    (value.type === 'root' || value.type === 'document' || value.type === 'doc') &&
    Array.isArray(value.children)
  );
}

export default function PreviewPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [doc, setDoc] = useState<RootDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    try {
      const keySpecific = `page-json-${slug}`;
      const keyGeneral = 'page-json';
      const raw = localStorage.getItem(keySpecific) ?? localStorage.getItem(keyGeneral);
      if (!raw) {
        setDoc(exampleDoc);
        return;
      }
      const parsed = JSON.parse(raw);
      if (isRootDocument(parsed)) {
        setDoc(parsed);
      } else {
        setError('Stored JSON is not a valid RootDocument; loaded example fallback.');
        setDoc(exampleDoc);
      }
    } catch (e: any) {
      console.error(e);
      setError('Failed to parse JSON from localStorage; loaded example fallback.');
      setDoc(exampleDoc);
    }
  }, [slug]);

  const resolver = useMemo(
    () =>
      function resolveComponent(component: string | { id: string }) {
        const id = typeof component === 'string' ? component : component.id;
        if (id === 'SampleCard') return sampleCustomComponent;
        return null;
      },
    []
  );

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Preview: {slug}</h1>
          <p className="text-sm text-gray-600">Rendering JSON from localStorage or an example fallback.</p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="space-x-2">
          <button
            className="btn-secondary"
            onClick={() => {
              localStorage.setItem(`page-json-${slug}`, JSON.stringify(exampleDoc, null, 2));
              setDoc(exampleDoc);
            }}
          >
            Load example into localStorage
          </button>
        </div>
      </header>

      <section className="border rounded-lg p-6">
        {doc ? <Renderer doc={doc} options={{ resolveComponent: resolver }} /> : <p>Loading…</p>}
      </section>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600">Show example JSON</summary>
        <pre className="mt-2 max-h-80 overflow-auto rounded bg-gray-50 p-3 text-xs">
          {JSON.stringify(exampleDoc, null, 2)}
        </pre>
      </details>
    </main>
  );
}
