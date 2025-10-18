import { DataStore } from './dataStore.js';

// Minimal renderer that displays installed components and their stored data

export function createRenderer(container) {
  function renderComponent(meta) {
    const el = document.createElement('div');
    el.className = 'component';

    const title = document.createElement('h4');
    title.textContent = `${meta.name} v${meta.version}`;

    const preview = document.createElement('div');
    preview.className = 'small';
    preview.textContent = `Preview: ${meta.preview}`;

    const data = document.createElement('div');
    data.className = 'small';
    const stored = DataStore.get(meta.id, { clicks: 0 });
    data.textContent = `Saved data: ${JSON.stringify(stored)}`;

    const btn = document.createElement('button');
    btn.className = 'btn secondary';
    btn.textContent = 'Simulate Interaction';
    btn.addEventListener('click', () => {
      const current = DataStore.get(meta.id, { clicks: 0 });
      current.clicks = (current.clicks || 0) + 1;
      DataStore.set(meta.id, current);
      data.textContent = `Saved data: ${JSON.stringify(current)}`;
    });

    el.appendChild(title);
    el.appendChild(preview);
    el.appendChild(data);
    el.appendChild(btn);
    return el;
  }

  function render(list) {
    container.innerHTML = '';
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'small';
      empty.textContent = 'No components installed. Use the marketplace to install components.';
      container.appendChild(empty);
      return;
    }
    for (const meta of list) {
      container.appendChild(renderComponent(meta));
    }
  }

  return { render };
}
