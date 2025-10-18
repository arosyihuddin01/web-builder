import "./types.js";

let __idCounter = 1;
function genId(prefix = "node") {
  return `${prefix}_${__idCounter++}`;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isEditableTarget(target) {
  if (!target) return false;
  const el = /** @type {HTMLElement} */(target);
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Compute a bounding box for a collection of frames
 * @param {import('./types.js').Frame[]} frames
 * @returns {import('./types.js').Frame}
 */
function bbox(frames) {
  if (!frames.length) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of frames) {
    minX = Math.min(minX, f.x);
    minY = Math.min(minY, f.y);
    maxX = Math.max(maxX, f.x + f.width);
    maxY = Math.max(maxY, f.y + f.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * @typedef {import('./types.js').VisualNode} VisualNode
 * @typedef {import('./types.js').GroupNode} GroupNode
 * @typedef {import('./types.js').SerializedState} SerializedState
 */

/**
 * CanvasState manages nodes, selection, history, and z-indexing.
 */
export class CanvasState {
  constructor() {
    /** @type {{[id:string]: (VisualNode|GroupNode)}} */
    this.nodes = {};
    /** @type {string[]} */
    this.order = [];
    /** @type {Set<string>} */
    this.selection = new Set();
    /** @type {SerializedState[]} */
    this._history = [];
    /** @type {SerializedState[]} */
    this._future = [];
    /** @type {null | SerializedState} */
    this.clipboard = null;
  }

  // ---------- Utilities ----------

  /** @returns {SerializedState} */
  snapshot() {
    return deepClone({
      nodes: this.nodes,
      order: this.order,
      selection: Array.from(this.selection),
    });
  }

  /** @param {SerializedState} snap */
  restore(snap) {
    this.nodes = deepClone(snap.nodes);
    this.order = deepClone(snap.order);
    this.selection = new Set(deepClone(snap.selection));
  }

  pushHistory() {
    this._history.push(this.snapshot());
    this._future = []; // clear redo on new action
  }

  /**
   * @param {string} id
   * @returns {VisualNode|GroupNode|undefined}
   */
  getNode(id) {
    return this.nodes[id];
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  isGroup(id) {
    const n = this.getNode(id);
    return !!n && n.type === "group";
  }

  /** Renumber zIndex according to order (top-level) and group children order */
  renumberZIndices() {
    this.order.forEach((id, idx) => {
      const n = this.getNode(id);
      if (n) n.zIndex = idx;
    });
    // children
    for (const n of Object.values(this.nodes)) {
      if (n.type === "group") {
        n.children.forEach((cid, idx) => {
          const c = this.getNode(cid);
          if (c) c.zIndex = idx;
        });
      }
    }
  }

  /** @param {string} id */
  addToTopLevelOrder(id) {
    if (!this.order.includes(id)) {
      this.order.push(id);
    }
    this.renumberZIndices();
  }

  /** @param {string} id */
  removeFromTopLevelOrder(id) {
    const i = this.order.indexOf(id);
    if (i >= 0) this.order.splice(i, 1);
    this.renumberZIndices();
  }

  /**
   * @param {string} id
   * @returns {import('./types.js').Frame}
   */
  getAbsoluteFrame(id) {
    const n = this.getNode(id);
    if (!n) return { x: 0, y: 0, width: 0, height: 0 };
    if (!n.parentId) return deepClone(n.frame);
    const p = this.getNode(n.parentId);
    if (!p) return deepClone(n.frame);
    const parentAbs = this.getAbsoluteFrame(p.id);
    return {
      x: parentAbs.x + n.frame.x,
      y: parentAbs.y + n.frame.y,
      width: n.frame.width,
      height: n.frame.height,
    };
  }

  // ---------- Public API ----------

  /**
   * Add a visual node to top-level.
   * @param {Partial<VisualNode> & {frame: import('./types.js').Frame}} node
   * @returns {string} id
   */
  addNode(node) {
    const id = node.id || genId("node");
    const vn = {
      id,
      type: "node",
      frame: deepClone(node.frame),
      zIndex: this.order.length,
      parentId: null,
      meta: node.meta || {},
    };
    this.nodes[id] = vn;
    this.addToTopLevelOrder(id);
    return id;
  }

  /**
   * Add an existing node (used during paste/duplicate) – will assume top-level.
   * @param {VisualNode|GroupNode} n
   */
  addExistingNode(n) {
    this.nodes[n.id] = deepClone(n);
    if (!n.parentId) {
      this.addToTopLevelOrder(n.id);
    }
  }

  /**
   * Remove a node by id (if a group, removes its children too).
   * @param {string} id
   */
  removeNode(id) {
    const n = this.getNode(id);
    if (!n) return;
    if (n.type === "group") {
      // remove children recursively
      for (const cid of [...n.children]) {
        this.removeNode(cid);
      }
    }
    if (!n.parentId) {
      this.removeFromTopLevelOrder(id);
    } else {
      const p = this.getNode(n.parentId);
      if (p && p.type === "group") {
        const idx = p.children.indexOf(id);
        if (idx >= 0) p.children.splice(idx, 1);
      }
    }
    delete this.nodes[id];
    this.selection.delete(id);
  }

  /**
   * Select ids. If additive=false, replaces selection.
   * @param {string[] | string} ids
   * @param {boolean} [additive]
   */
  select(ids, additive = false) {
    const list = Array.isArray(ids) ? ids : [ids];
    if (!additive) this.selection.clear();
    for (const id of list) {
      if (this.getNode(id)) this.selection.add(id);
    }
  }

  clearSelection() {
    this.selection.clear();
  }

  /** Traverse selection forward by top-level order */
  selectNext() {
    const top = this.order;
    if (!top.length) return;
    if (!this.selection.size) {
      this.select(top[0]);
      return;
    }
    const currentId = Array.from(this.selection)[this.selection.size - 1];
    const idx = Math.max(0, top.indexOf(currentId));
    const next = top[(idx + 1) % top.length];
    this.select(next);
  }

  /** Traverse selection backward by top-level order */
  selectPrev() {
    const top = this.order;
    if (!top.length) return;
    if (!this.selection.size) {
      this.select(top[top.length - 1]);
      return;
    }
    const currentId = Array.from(this.selection)[this.selection.size - 1];
    const idx = Math.max(0, top.indexOf(currentId));
    const prev = top[(idx - 1 + top.length) % top.length];
    this.select(prev);
  }

  /**
   * Group selected top-level nodes into a group.
   * Selection becomes the new group id.
   */
  groupSelection() {
    const ids = Array.from(this.selection).filter((id) => this.getNode(id) && !this.getNode(id).parentId);
    if (ids.length < 2) return null;
    this.pushHistory();

    const frames = ids.map((id) => this.getAbsoluteFrame(id));
    const gFrame = bbox(frames);
    const groupId = genId("group");
    /** @type {GroupNode} */
    const group = {
      id: groupId,
      type: "group",
      frame: gFrame,
      zIndex: 0,
      parentId: null,
      children: [],
    };

    // Determine insertion index: highest z among selected
    let insertIdx = -1;
    for (const id of ids) {
      const idx = this.order.indexOf(id);
      if (idx > insertIdx) insertIdx = idx;
    }

    // Remove selected from top-level and reparent them
    ids.sort((a, b) => this.order.indexOf(a) - this.order.indexOf(b));
    for (const id of ids) {
      const child = this.getNode(id);
      if (!child) continue;
      // Remove from top-level order
      this.removeFromTopLevelOrder(id);
      // Reparent
      child.parentId = groupId;
      // Adjust to be relative to group frame
      const abs = this.getAbsoluteFrame(id);
      child.frame.x = abs.x - gFrame.x;
      child.frame.y = abs.y - gFrame.y;
      group.children.push(id);
    }

    this.nodes[groupId] = group;
    // Insert group at insertIdx (after removals, the index may have shifted)
    const boundedIdx = Math.max(0, Math.min(insertIdx, this.order.length));
    this.order.splice(boundedIdx, 0, groupId);
    this.renumberZIndices();

    this.select(groupId);
    return groupId;
  }

  /** Ungroup selected groups */
  ungroupSelection() {
    const ids = Array.from(this.selection).filter((id) => this.isGroup(id));
    if (!ids.length) return;
    this.pushHistory();

    for (const gid of ids) {
      const group = /** @type {GroupNode} */(this.getNode(gid));
      if (!group || group.type !== "group") continue;
      const insertAt = this.order.indexOf(gid);
      const children = [...group.children];

      // Reparent children to top-level
      group.children = [];
      for (let i = 0; i < children.length; i++) {
        const cid = children[i];
        const child = this.getNode(cid);
        if (!child) continue;
        const abs = this.getAbsoluteFrame(cid);
        child.parentId = null;
        child.frame.x = abs.x;
        child.frame.y = abs.y;
        this.order.splice(insertAt + i, 0, cid);
      }

      // Remove the group itself
      this.removeFromTopLevelOrder(gid);
      delete this.nodes[gid];
      this.renumberZIndices();

      this.selection = new Set(children);
    }
  }

  /** Duplicate selection by cloning nodes and groups (top-level only) */
  duplicateSelection(offset = { x: 10, y: 10 }) {
    const ids = Array.from(this.selection).filter((id) => this.getNode(id) && !this.getNode(id).parentId);
    if (!ids.length) return [];
    this.pushHistory();

    /** @type {string[]} */
    const newIds = [];
    for (const id of ids) {
      const n = this.getNode(id);
      if (!n) continue;
      if (n.type === "group") {
        const mapping = new Map();
        const gid = genId("group");
        mapping.set(id, gid);
        // Deep copy group structure
        /** @type {GroupNode} */
        const newGroup = deepClone(n);
        newGroup.id = gid;
        newGroup.parentId = null;
        // Duplicate children recursively (only one level deep is supported by selection model, but handle nested)
        newGroup.children = n.children.map((cid) => {
          const child = this.getNode(cid);
          if (!child) return cid;
          const newCid = genId("node");
          mapping.set(cid, newCid);
          const childClone = deepClone(child);
          childClone.id = newCid;
          childClone.parentId = gid;
          childClone.frame.x += offset.x;
          childClone.frame.y += offset.y;
          this.nodes[newCid] = childClone;
          return newCid;
        });
        newGroup.frame = {
          x: n.frame.x + offset.x,
          y: n.frame.y + offset.y,
          width: n.frame.width,
          height: n.frame.height,
        };
        this.nodes[gid] = newGroup;
        this.addToTopLevelOrder(gid);
        newIds.push(gid);
      } else {
        const newId = genId("node");
        const clone = deepClone(n);
        clone.id = newId;
        clone.frame.x += offset.x;
        clone.frame.y += offset.y;
        clone.parentId = null;
        this.nodes[newId] = clone;
        this.addToTopLevelOrder(newId);
        newIds.push(newId);
      }
    }

    this.select(newIds);
    return newIds;
  }

  /** Copy selection to internal clipboard */
  copySelection() {
    const ids = Array.from(this.selection).filter((id) => this.getNode(id));
    if (!ids.length) return;
    const snap = this.snapshot();
    // Reduce to only selected items (and their descendants if groups)
    const keep = new Set();
    for (const id of ids) {
      keep.add(id);
      const n = this.getNode(id);
      if (n && n.type === "group") {
        for (const cid of n.children) keep.add(cid);
      }
    }
    /** @type {SerializedState} */
    const slim = {
      nodes: {},
      order: ids.filter((id) => !this.getNode(id).parentId),
      selection: ids,
    };
    for (const [id, node] of Object.entries(snap.nodes)) {
      if (keep.has(id)) slim.nodes[id] = node;
    }
    this.clipboard = slim;
  }

  /** Paste from internal clipboard */
  pasteClipboard(offset = { x: 16, y: 16 }) {
    if (!this.clipboard) return [];
    this.pushHistory();
    const mapping = new Map();
    /** @type {string[]} */
    const topLevelNewIds = [];

    // First pass: create clones with new ids
    for (const [oldId, node] of Object.entries(this.clipboard.nodes)) {
      const isTop = !node.parentId;
      const newId = node.type === "group" ? genId("group") : genId("node");
      mapping.set(oldId, newId);
      const clone = deepClone(node);
      clone.id = newId;
      this.nodes[newId] = clone;
      if (isTop) topLevelNewIds.push(newId);
    }
    // Second pass: fix parentIds and children arrays, and offset frames
    for (const newNode of Object.values(this.nodes)) {
      const oldId = Array.from(mapping.entries()).find(([, v]) => v === newNode.id)?.[0];
      if (!oldId || !this.clipboard.nodes[oldId]) continue;
      const oldNode = this.clipboard.nodes[oldId];
      if (newNode.type === "group") {
        newNode.children = oldNode.children.map((cid) => mapping.get(cid));
        newNode.parentId = null;
      } else {
        newNode.parentId = oldNode.parentId ? mapping.get(oldNode.parentId) : null;
      }
      newNode.frame.x += offset.x;
      newNode.frame.y += offset.y;
    }

    // Place new top-level nodes at top of stack
    for (const id of topLevelNewIds) this.addToTopLevelOrder(id);
    this.select(topLevelNewIds);
    return topLevelNewIds;
  }

  /** Align selection to bounding box */
  alignSelection(mode) {
    const ids = Array.from(this.selection).filter((id) => this.getNode(id) && !this.getNode(id).parentId);
    if (ids.length < 2) return;
    this.pushHistory();
    const frames = ids.map((id) => this.getAbsoluteFrame(id));
    const box = bbox(frames);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const n = this.getNode(id);
      if (!n) continue;
      switch (mode) {
        case "left":
          n.frame.x = box.x - (n.parentId ? this.getAbsoluteFrame(n.parentId).x : 0);
          break;
        case "right":
          n.frame.x = (box.x + box.width - n.frame.width) - (n.parentId ? this.getAbsoluteFrame(n.parentId).x : 0);
          break;
        case "top":
          n.frame.y = box.y - (n.parentId ? this.getAbsoluteFrame(n.parentId).y : 0);
          break;
        case "bottom":
          n.frame.y = (box.y + box.height - n.frame.height) - (n.parentId ? this.getAbsoluteFrame(n.parentId).y : 0);
          break;
        case "hcenter": {
          const cx = box.x + box.width / 2;
          n.frame.x = (cx - n.frame.width / 2) - (n.parentId ? this.getAbsoluteFrame(n.parentId).x : 0);
          break;
        }
        case "vcenter": {
          const cy = box.y + box.height / 2;
          n.frame.y = (cy - n.frame.height / 2) - (n.parentId ? this.getAbsoluteFrame(n.parentId).y : 0);
          break;
        }
      }
    }
  }

  // ---------- Z-index operations ----------

  bringToFront() {
    const set = new Set(Array.from(this.selection).filter((id) => this.getNode(id) && !this.getNode(id).parentId));
    if (!set.size) return;
    this.pushHistory();
    const remaining = this.order.filter((id) => !set.has(id));
    this.order = [...remaining, ...this.order.filter((id) => set.has(id))];
    this.renumberZIndices();
  }

  sendToBack() {
    const set = new Set(Array.from(this.selection).filter((id) => this.getNode(id) && !this.getNode(id).parentId));
    if (!set.size) return;
    this.pushHistory();
    const remaining = this.order.filter((id) => !set.has(id));
    this.order = [...this.order.filter((id) => set.has(id)), ...remaining];
    this.renumberZIndices();
  }

  bringForward() {
    const set = new Set(Array.from(this.selection).filter((id) => this.getNode(id) && !this.getNode(id).parentId));
    if (!set.size) return;
    this.pushHistory();
    for (let i = this.order.length - 2; i >= 0; i--) {
      const id = this.order[i];
      const nextId = this.order[i + 1];
      if (set.has(id) && !set.has(nextId)) {
        this.order[i] = nextId;
        this.order[i + 1] = id;
      }
    }
    this.renumberZIndices();
  }

  sendBackward() {
    const set = new Set(Array.from(this.selection).filter((id) => this.getNode(id) && !this.getNode(id).parentId));
    if (!set.size) return;
    this.pushHistory();
    for (let i = 1; i < this.order.length; i++) {
      const id = this.order[i];
      const prevId = this.order[i - 1];
      if (set.has(id) && !set.has(prevId)) {
        this.order[i] = prevId;
        this.order[i - 1] = id;
      }
    }
    this.renumberZIndices();
  }

  // ---------- Undo/Redo ----------

  undo() {
    if (!this._history.length) return;
    const prev = this._history.pop();
    const cur = this.snapshot();
    this._future.push(cur);
    this.restore(prev);
  }

  redo() {
    if (!this._future.length) return;
    const next = this._future.pop();
    const cur = this.snapshot();
    this._history.push(cur);
    this.restore(next);
  }
}

export const _internal = { genId, deepClone, bbox, isEditableTarget };
