import { DataStore } from './dataStore.js';

export function createMarketplacePanel(container, store) {
  const grid = container.querySelector('#marketplace-grid');
  const search = container.querySelector('#search');
  const tagFilter = container.querySelector('#tag-filter');

  function renderCard(meta) {
    const card = document.createElement('div');
    card.className = 'card';

    const preview = document.createElement('div');
    preview.className = 'preview';
    preview.textContent = meta.preview || 'Preview';

    const metaEl = document.createElement('div');
    metaEl.className = 'meta';
    const h3 = document.createElement('h3');
    h3.textContent = meta.name;
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = meta.description;
    const tags = document.createElement('div');
    tags.className = 'tags';
    for (const t of meta.tags) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = t;
      tags.appendChild(tag);
    }
    const small = document.createElement('div');
    small.className = 'small';
    small.textContent = `v${meta.version} • ${meta.installs || 0} installs`;

    metaEl.appendChild(h3);
    metaEl.appendChild(desc);
    metaEl.appendChild(tags);
    metaEl.appendChild(small);

    const actions = document.createElement('div');
    actions.className = 'actions';
    const btn = document.createElement('button');
    btn.className = meta.installed ? 'btn danger' : 'btn';
    btn.textContent = meta.installed ? 'Uninstall' : 'Install';
    btn.addEventListener('click', () => {
      if (meta.installed) store.uninstall(meta.id); else store.install(meta.id);
      // nothing else needed; events will re-render
    });

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn secondary';
    resetBtn.style.marginLeft = '8px';
    resetBtn.textContent = 'Reset Data';
    resetBtn.title = 'Clear saved data for this component';
    resetBtn.addEventListener('click', () => {
      DataStore.remove(meta.id);
      // Visual feedback via re-render
      doRender();
    });

    actions.appendChild(btn);
    actions.appendChild(resetBtn);

    card.appendChild(preview);
    card.appendChild(metaEl);
    card.appendChild(actions);
    return card;
  }

  function fillTagOptions(list) {
    const allTags = new Set();
    for (const item of list) item.tags.forEach(t => allTags.add(t));
    const current = tagFilter.value;
    tagFilter.innerHTML = '<option value="">All tags</option>';
    Array.from(allTags).sort().forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag; opt.textContent = tag;
      tagFilter.appendChild(opt);
    });
    tagFilter.value = current || '';
  }

  function doRender() {
    const list = store.filter(search.value, tagFilter.value);
    fillTagOptions(store.list());
    grid.innerHTML = '';
    for (const item of list) grid.appendChild(renderCard(item));
  }

  search.addEventListener('input', doRender);
  tagFilter.addEventListener('change', doRender);

  // Listen to lifecycle changes
  store.events.on('install', doRender);
  store.events.on('registry:changed', doRender);

  doRender();

  return { render: doRender };
}
