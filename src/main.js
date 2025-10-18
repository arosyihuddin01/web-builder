import { createMarketplaceStore, fetchRemoteRegistry } from './marketplaceStore.js';
import { createPaletteStore } from './paletteStore.js';
import { createRenderer } from './renderer.js';
import { createMarketplacePanel } from './marketplacePanel.js';

const marketplace = createMarketplaceStore();
const palette = createPaletteStore(marketplace.list);
palette.attach(marketplace.events);

// Seed components
marketplace.upsertMany([
  {
    id: 'chart.bar',
    name: 'Bar Chart',
    version: '1.0.0',
    description: 'A configurable bar chart component.',
    tags: ['chart', 'data', 'visualization'],
    preview: '📊',
    installs: 120,
    installed: true,
  },
  {
    id: 'input.date',
    name: 'Date Picker',
    version: '1.1.0',
    description: 'Select dates with a rich calendar UI.',
    tags: ['input', 'form'],
    preview: '📅',
    installs: 250,
    installed: false,
  },
  {
    id: 'media.avatar',
    name: 'Avatar',
    version: '0.9.2',
    description: 'Display user avatars with fallbacks.',
    tags: ['media', 'ui'],
    preview: '👤',
    installs: 400,
    installed: false,
  },
  {
    id: 'layout.grid',
    name: 'Grid Layout',
    version: '2.0.0',
    description: 'Arrange content in responsive grids.',
    tags: ['layout', 'ui'],
    preview: '🔲',
    installs: 80,
    installed: false,
  },
]);

// Bootstrap UI
const panel = createMarketplacePanel(document, marketplace);

const renderer = createRenderer(document.getElementById('renderer'));
renderer.render(palette.list());

// Keep renderer in sync with palette changes (real-time reaction)
palette.events.on('palette:changed', list => renderer.render(list));

// Demonstrate readiness for future remote sync
const syncStatus = document.getElementById('sync-status');
async function syncRemote() {
  syncStatus.textContent = 'syncing…';
  const url = localStorage.getItem('app.registry.remoteUrl') || '';
  if (!url) { syncStatus.textContent = 'ready'; return; }
  const remoteList = await fetchRemoteRegistry(url);
  if (remoteList.length) marketplace.upsertMany(remoteList);
  syncStatus.textContent = 'ready';
}

// Initial sync attempt
syncRemote();

// Expose some helpers for manual testing in console
window.app = {
  marketplace,
  palette,
  renderer,
  setRemote(url) { localStorage.setItem('app.registry.remoteUrl', url); syncRemote(); },
};
