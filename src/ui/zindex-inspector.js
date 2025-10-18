/**
 * Simple z-index inspector overlay for a canvas/container.
 * It draws a light rectangle over each top-level node and a small label with its z-index.
 */
export function createZIndexInspectorOverlay({ container, state }) {
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.inset = '0';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '999';
  overlay.style.fontFamily = 'sans-serif';
  overlay.style.fontSize = '11px';

  container.style.position = container.style.position || 'relative';
  container.appendChild(overlay);

  function colorFor(idx, max) {
    const t = max <= 1 ? 0 : idx / (max - 1);
    const r = Math.round(255 * (1 - t));
    const g = Math.round(200 * t);
    const b = 80;
    return `rgba(${r},${g},${b},0.15)`;
  }

  function render() {
    overlay.innerHTML = '';
    const order = state.order;
    const max = Math.max(order.length - 1, 1);
    let i = 0;
    for (const id of order) {
      const node = state.getNode(id);
      if (!node) continue;
      const f = state.getAbsoluteFrame(id);
      const sel = state.selection.has(id);

      const box = document.createElement('div');
      box.style.position = 'absolute';
      box.style.left = `${f.x}px`;
      box.style.top = `${f.y}px`;
      box.style.width = `${f.width}px`;
      box.style.height = `${f.height}px`;
      box.style.border = sel ? '2px solid #4b8cf5' : '1px dashed rgba(0,0,0,0.25)';
      box.style.background = colorFor(i, max);
      box.style.borderRadius = '4px';

      const label = document.createElement('div');
      label.textContent = `${node.zIndex}`;
      label.style.position = 'absolute';
      label.style.left = '2px';
      label.style.top = '2px';
      label.style.padding = '2px 4px';
      label.style.background = sel ? '#4b8cf5' : 'rgba(0,0,0,0.55)';
      label.style.color = '#fff';
      label.style.borderRadius = '3px';
      label.style.lineHeight = '1';

      const idLabel = document.createElement('div');
      idLabel.textContent = node.id;
      idLabel.style.position = 'absolute';
      idLabel.style.right = '2px';
      idLabel.style.bottom = '2px';
      idLabel.style.padding = '2px 4px';
      idLabel.style.background = 'rgba(255,255,255,0.7)';
      idLabel.style.borderRadius = '3px';
      idLabel.style.color = '#000';

      box.appendChild(label);
      box.appendChild(idLabel);
      overlay.appendChild(box);
      i++;
    }
  }

  render();

  return {
    element: overlay,
    update: render,
    destroy() { overlay.remove(); },
  };
}
