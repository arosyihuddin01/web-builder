import { CanvasState, ShortcutManager, createZIndexInspectorOverlay } from '../src/index.js';

const state = new CanvasState();

// Seed some nodes
state.addNode({ frame: { x: 40, y: 40, width: 120, height: 100 }, meta: { color: '#ffd166' } });
state.addNode({ frame: { x: 140, y: 140, width: 180, height: 120 }, meta: { color: '#ef476f' } });
state.addNode({ frame: { x: 280, y: 80, width: 160, height: 140 }, meta: { color: '#06d6a0' } });

const canvas = document.getElementById('canvas');

// Render nodes
function render() {
  canvas.innerHTML = '';
  for (const id of state.order) {
    const n = state.getNode(id);
    const f = state.getAbsoluteFrame(id);
    const el = document.createElement('div');
    el.className = 'node' + (state.selection.has(id) ? ' selected' : '');
    el.style.left = `${f.x}px`;
    el.style.top = `${f.y}px`;
    el.style.width = `${f.width}px`;
    el.style.height = `${f.height}px`;
    el.style.background = (n.meta && n.meta.color) || '#cbd5e1';
    el.textContent = id;
    el.style.display = 'grid';
    el.style.placeItems = 'center';
    el.style.userSelect = 'none';
    el.style.cursor = 'pointer';
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (e.shiftKey) state.select(id, true); else state.select(id);
      renderAll();
    });
    canvas.appendChild(el);
  }
}

const inspector = createZIndexInspectorOverlay({ container: document.querySelector('.canvas-shell'), state });

function renderAll() { render(); inspector.update(); }
renderAll();

canvas.addEventListener('pointerdown', () => { canvas.focus(); });

new ShortcutManager({
  scope: canvas,
  state,
  onHandled: () => renderAll(),
});

// Toolbar buttons
const actions = {
  group: () => state.groupSelection(),
  ungroup: () => state.ungroupSelection(),
  bringFront: () => state.bringToFront(),
  sendBack: () => state.sendToBack(),
};
for (const btn of document.querySelectorAll('[data-action]')) {
  btn.addEventListener('click', () => { actions[btn.dataset.action](); renderAll(); });
}
