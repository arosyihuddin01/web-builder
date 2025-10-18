import { DataStore } from './dataStore.js';
import { createEventBus } from './eventBus.js';

// Holds the registry of available components and filtering logic.

const STORAGE_KEY = 'app.marketplace.registry.v1';

/**
 * @returns {{
 *  events: ReturnType<typeof createEventBus>,
 *  list: () => import('./types.js').ComponentMeta[],
 *  upsertMany: (items: import('./types.js').ComponentMeta[]) => void,
 *  install: (id: string) => void,
 *  uninstall: (id: string) => void,
 *  isInstalled: (id: string) => boolean,
 *  filter: (q: string, tag?: string) => import('./types.js').ComponentMeta[],
 *  get: (id: string) => import('./types.js').ComponentMeta | undefined
 * }}
 */
export function createMarketplaceStore() {
  /** @type {import('./types.js').ComponentMeta[]} */
  let registry = [];
  const events = createEventBus();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) registry = parsed;
      }
    } catch {}
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(registry)); } catch {}
  }
  load();

  function upsertMany(items) {
    for (const item of items) {
      const idx = registry.findIndex(x => x.id === item.id);
      if (idx >= 0) {
        // keep installed flag and preserve if locally installed
        const installed = registry[idx].installed || item.installed || false;
        registry[idx] = { ...registry[idx], ...item, installed };
      } else {
        registry.push({ ...item, installed: item.installed ?? false });
      }
    }
    save();
    events.emit('registry:changed', registry);
  }

  function list() { return registry.slice().sort((a,b) => (b.installed - a.installed) || a.name.localeCompare(b.name)); }

  function isInstalled(id) { return registry.find(x => x.id === id)?.installed ?? false; }

  function install(id) {
    const item = registry.find(x => x.id === id);
    if (!item) return;
    if (!item.installed) {
      item.installed = true;
      item.installs = (item.installs || 0) + 1;
      item.updatedAt = Date.now();
      save();
      events.emit('install', { id, installed: true, version: item.version });
    }
  }

  function uninstall(id) {
    const item = registry.find(x => x.id === id);
    if (!item) return;
    if (item.installed) {
      item.installed = false;
      item.updatedAt = Date.now();
      // Preserve DataStore content by design (no deletion)
      save();
      events.emit('install', { id, installed: false, version: item.version });
    }
  }

  function filter(q, tag) {
    const query = (q || '').trim().toLowerCase();
    return list().filter(x => {
      const matchesQ = !query || x.name.toLowerCase().includes(query) || x.description.toLowerCase().includes(query) || x.tags.join(' ').toLowerCase().includes(query);
      const matchesTag = !tag || x.tags.includes(tag);
      return matchesQ && matchesTag;
    });
  }

  function get(id) { return registry.find(x => x.id === id); }

  return { events, list, upsertMany, install, uninstall, isInstalled, filter, get };
}

// Remote sync stubs for future support
export async function fetchRemoteRegistry(url) {
  // Placeholder: in future this can fetch from a remote endpoint
  // For now, return an empty list to indicate no remote override.
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('remote fetch failed');
    const json = await res.json();
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.components)) return json.components;
  } catch {}
  return [];
}
