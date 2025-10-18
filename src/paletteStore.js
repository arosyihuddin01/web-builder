import { createEventBus } from './eventBus.js';

// Palette store reflects installed components and notifies renderer in real-time.

/**
 * @param {() => import('./types.js').ComponentMeta[]} listSource - function to retrieve current registry list
 */
export function createPaletteStore(listSource) {
  const events = createEventBus();

  function list() {
    return listSource().filter(x => x.installed);
  }

  // React to marketplace lifecycle changes
  function attach(marketplaceEvents) {
    marketplaceEvents.on('install', () => {
      events.emit('palette:changed', list());
    });
    marketplaceEvents.on('registry:changed', () => {
      events.emit('palette:changed', list());
    });
  }

  return { list, events, attach };
}
