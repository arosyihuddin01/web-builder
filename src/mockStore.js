// Mock storage layer for pages and component definitions
// - Combines in-memory defaults with localStorage persistence (when available)
// - Safe for SSR (falls back to in-memory on the server)
// - Provides simple validation via existing schema guards

import { isDocument } from './schema/guards';

const PAGES_KEY = 'app.mock.pages.v1';
const COMPONENT_DEFS_KEY = 'app.mock.componentDefs.v1';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStorage(key, fallback) {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[mockStore] readStorage failed', e);
    return fallback;
  }
}

function writeStorage(key, value) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[mockStore] writeStorage failed', e);
  }
}

// Component definition schema (lightweight, JSON-friendly)
// Each component type declares its props and whether it accepts children
const defaultComponentDefinitions = [
  {
    type: 'text',
    props: { text: { type: 'string' }, marks: { type: 'string', optional: true }, color: { type: 'string', optional: true } },
    children: false
  },
  {
    type: 'heading',
    props: { level: { type: 'enum', options: [1, 2, 3, 4] } },
    children: true
  },
  {
    type: 'paragraph',
    props: { spacing: { type: 'enum', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'], optional: true } },
    children: true
  },
  {
    type: 'list',
    props: { ordered: { type: 'boolean', optional: true } },
    children: true
  },
  {
    type: 'listItem',
    props: {},
    children: true
  },
  {
    type: 'link',
    props: { href: { type: 'string' } },
    children: true
  },
  {
    type: 'frame',
    props: {
      style: { type: 'object', optional: true }
    },
    children: true
  }
];

// Example pages with simple document structures
const defaultPages = {
  'welcome': {
    slug: 'welcome',
    title: 'Welcome',
    doc: {
      type: 'doc',
      children: [
        { type: 'heading', level: 1, children: [{ type: 'text', text: 'Welcome to the preview' }] },
        {
          type: 'paragraph',
          spacing: 'md',
          children: [
            { type: 'text', text: 'This page is loaded from a mock store and rendered via ' },
            { type: 'text', text: 'renderNode', marks: ['code'] },
            { type: 'text', text: '.' }
          ]
        },
        {
          type: 'list',
          ordered: false,
          children: [
            { type: 'listItem', children: [{ type: 'text', text: 'Edit and persist with localStorage' }] },
            { type: 'listItem', children: [{ type: 'text', text: 'Graceful loading and error states' }] },
            { type: 'listItem', children: [{ type: 'text', text: 'CSR fallback (server uses defaults)' }] }
          ]
        },
        {
          type: 'paragraph',
          spacing: 'lg',
          children: [
            { type: 'text', text: 'Try navigating to ' },
            { type: 'link', href: '/p/welcome', children: [{ type: 'text', text: '/p/welcome' }] },
            { type: 'text', text: ' to see this page.' }
          ]
        }
      ]
    }
  },
  'example': {
    slug: 'example',
    title: 'Example Page',
    doc: {
      type: 'doc',
      children: [
        { type: 'heading', level: 2, children: [{ type: 'text', text: 'Example Page' }] },
        {
          type: 'paragraph',
          spacing: 'sm',
          children: [
            { type: 'text', text: 'This is an example page seeded into the mock store.' }
          ]
        }
      ]
    }
  }
};

// In-memory caches (always available, also used server-side)
let pagesMemory = { ...defaultPages };
let componentDefsMemory = [...defaultComponentDefinitions];

// Initialize storage on client if not present
export function initClientStore() {
  if (!isBrowser()) return;
  const storedPages = readStorage(PAGES_KEY, null);
  const storedDefs = readStorage(COMPONENT_DEFS_KEY, null);
  if (!storedPages) writeStorage(PAGES_KEY, pagesMemory);
  if (!storedDefs) writeStorage(COMPONENT_DEFS_KEY, componentDefsMemory);
}

export function getAllPages() {
  const persisted = readStorage(PAGES_KEY, null);
  if (persisted && typeof persisted === 'object') {
    // Merge: persisted overrides defaults
    return { ...defaultPages, ...persisted };
  }
  return { ...pagesMemory };
}

export function getPageBySlug(slug) {
  const all = getAllPages();
  return all[slug] || null;
}

export function upsertPage(page) {
  pagesMemory[page.slug] = page;
  const merged = { ...getAllPages(), [page.slug]: page };
  writeStorage(PAGES_KEY, merged);
}

export function getComponentDefinitions() {
  const persisted = readStorage(COMPONENT_DEFS_KEY, null);
  if (Array.isArray(persisted)) return persisted;
  return [...componentDefsMemory];
}

export function setComponentDefinitions(list) {
  componentDefsMemory = Array.isArray(list) ? [...list] : [];
  writeStorage(COMPONENT_DEFS_KEY, componentDefsMemory);
}

// Validate a page's document using the existing schema guards
export function validatePage(page) {
  const errors = [];
  if (!page) return { valid: false, errors: ['Page not found'] };
  if (!page.doc || !isDocument(page.doc)) {
    errors.push('Invalid document structure');
    return { valid: false, errors };
  }
  // Ensure nodes' types appear in the component definitions
  const allowed = new Set(getComponentDefinitions().map(d => d.type));
  const visit = (node) => {
    if (!node || typeof node !== 'object') {
      errors.push('Invalid node');
      return;
    }
    if (!allowed.has(node.type)) errors.push(`Unknown node type: ${node.type}`);
    if (Array.isArray(node.children)) node.children.forEach(visit);
  };
  page.doc.children.forEach(visit);
  return { valid: errors.length === 0, errors };
}

export function listSlugs() {
  return Object.keys(getAllPages());
}
