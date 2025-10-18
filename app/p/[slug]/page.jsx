'use client';

import React from 'react';
import { renderNode } from '../../../src/renderer/renderNode';
import { initClientStore, getPageBySlug, validatePage } from '../../../src/mockStore';

export default function PreviewPage({ params }) {
  const { slug } = params || {};
  const [state, setState] = React.useState({ status: 'loading', page: null, errors: [] });

  React.useEffect(() => {
    try {
      initClientStore();
      const page = getPageBySlug(slug);
      if (!page) {
        setState({ status: 'error', page: null, errors: [`Page not found: ${slug}`] });
        return;
      }
      const result = validatePage(page);
      if (!result.valid) {
        setState({ status: 'error', page, errors: result.errors || ['Validation failed'] });
        return;
      }
      setState({ status: 'ready', page, errors: [] });
    } catch (e) {
      console.error('[preview] failed to load page', e);
      setState({ status: 'error', page: null, errors: ['Unexpected error loading page'] });
    }
  }, [slug]);

  if (state.status === 'loading') {
    return (
      <main style={{ padding: 24 }}>
        <p>Loading preview…</p>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main style={{ padding: 24 }}>
        <h1>Preview error</h1>
        <ul>
          {state.errors.map((e, i) => (
            <li key={i} style={{ color: '#b91c1c' }}>{e}</li>
          ))}
        </ul>
      </main>
    );
  }

  const doc = state.page?.doc;
  return (
    <main style={{ padding: 24 }}>
      <div data-page-slug={slug}>
        {doc?.children?.map((n, i) => (
          <React.Fragment key={i}>{renderNode(n)}</React.Fragment>
        ))}
      </div>
    </main>
  );
}
