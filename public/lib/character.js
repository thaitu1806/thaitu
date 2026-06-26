// Học Vui — Character sprite system (vanilla, zero deps).
// Public API:
//   HocVuiCharacters.registerSpecies(id, { svg, classPrefix })
//   HocVuiCharacters.createCharacter(id, container, opts) → { setState, getState, destroy, root }
// State is reflected as a CSS class on the root wrapper:
//   <div class="hv-char hv-char--<id> is-<state>">…SVG…</div>
// CSS in each game version defines @keyframes for is-idle / is-happy / is-scared / is-rescued.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.HocVuiCharacters) return;

  const registry = new Map();

  function registerSpecies(id, def) {
    if (!id || typeof id !== 'string') throw new Error('species id required');
    if (!def || typeof def.svg !== 'string') throw new Error('species needs svg string');
    registry.set(id, { svg: def.svg, classPrefix: def.classPrefix || '' });
  }

  function hasSpecies(id) { return registry.has(id); }

  function createCharacter(id, container, opts) {
    const def = registry.get(id);
    if (!def) throw new Error('unknown species: ' + id);
    if (!container || !container.appendChild) throw new Error('container element required');
    opts = opts || {};
    let state = opts.state || 'idle';

    const root = document.createElement('div');
    root.className = 'hv-char hv-char--' + id + ' is-' + state;
    if (def.classPrefix) root.dataset.species = id;
    root.innerHTML = def.svg;
    if (opts.size) {
      root.style.width = opts.size + 'px';
      root.style.height = opts.size + 'px';
    }
    container.appendChild(root);

    function setState(next) {
      if (!next || next === state) return;
      const prev = state;
      root.classList.remove('is-' + prev);
      root.classList.add('is-' + next);
      state = next;
      if (typeof opts.onStateChange === 'function') {
        try { opts.onStateChange(next, prev); } catch (e) {}
      }
    }

    function getState() { return state; }

    function destroy() {
      if (root.parentNode) root.parentNode.removeChild(root);
    }

    return { setState, getState, destroy, root };
  }

  window.HocVuiCharacters = { registerSpecies, createCharacter, hasSpecies };
})();
