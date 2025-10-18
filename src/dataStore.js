// Data store that preserves per-component data even when uninstalled.
// Persists to localStorage.

const STORAGE_KEY = 'app.component.dataStore.v1';

/** @type {Record<string, any>} */
let memory = {};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) memory = JSON.parse(raw);
  } catch (e) {
    console.warn('DataStore load failed', e);
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch (e) {
    console.warn('DataStore save failed', e);
  }
}

load();

export const DataStore = {
  get(id, fallback = null) {
    return id in memory ? memory[id] : fallback;
  },
  set(id, value) {
    memory[id] = value;
    save();
  },
  has(id) {
    return id in memory;
  },
  remove(id) {
    // intentionally keep data by default; this function is provided for future cleanup
    delete memory[id];
    save();
  },
  all() {
    return { ...memory };
  }
};
