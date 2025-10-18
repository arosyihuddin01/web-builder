// Tiny event bus for reactive updates

export function createEventBus() {
  /** @type {Record<string, Set<Function>>} */
  const listeners = {};
  return {
    on(event, handler) {
      if (!listeners[event]) listeners[event] = new Set();
      listeners[event].add(handler);
      return () => listeners[event].delete(handler);
    },
    emit(event, payload) {
      if (!listeners[event]) return;
      for (const h of Array.from(listeners[event])) {
        try { h(payload); } catch (e) { console.error(e); }
      }
    }
  };
}
