// === Học Vui — Draggable Fixed Widgets ===
// Makes fixed-position floating widgets (mascot, quest, sound toggle, etc.)
// draggable so kids can move them out of the way. Touch + mouse support.
// Remembers position per widget in localStorage.
// Include via <script src="/draggable-widget.js"></script> after the widgets load.
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.__hvDraggable) return;
  window.__hvDraggable = true;

  // Selectors for the floating widgets to make draggable
  var TARGETS = [
    '#hv-mascot',           // mascot body (right side)
    '#hv-mascot-toggle',    // mascot show/hide toggle (left side)
    '#hv-sound-toggle',     // sound mute toggle (left side)
    '.quest-widget',        // quest/NV badge (right side)
  ];

  var STORAGE_PREFIX = 'hv_wpos_';
  var DRAG_THRESHOLD = 8; // px movement before considering it a drag (not a tap)

  function init() {
    TARGETS.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      // Only make fixed/absolute elements draggable
      var cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'absolute') return;
      // Restore saved position
      restorePosition(el, sel);
      // Enable pointer-based drag
      makeDraggable(el, sel);
    });
  }

  function storageKey(sel) { return STORAGE_PREFIX + sel.replace(/[^a-z0-9]/gi, '_'); }

  function restorePosition(el, sel) {
    try {
      var saved = JSON.parse(localStorage.getItem(storageKey(sel)));
      if (!saved) return;
      // Clamp to viewport vertically only
      var vh = window.innerHeight;
      var y = Math.min(Math.max(saved.y, 0), vh - 20);
      el.style.top = y + 'px';
      el.style.bottom = 'auto';
      el.style.transform = 'none';
    } catch (e) {}
  }

  function savePosition(el, sel) {
    try {
      localStorage.setItem(storageKey(sel), JSON.stringify({
        y: parseInt(el.style.top) || 0,
      }));
    } catch (e) {}
  }

  function makeDraggable(el, sel) {
    var startX, startY, origLeft, origTop, dragging = false, moved = false;

    function onStart(e) {
      // Only primary finger / left mouse
      var touch = e.touches ? e.touches[0] : e;
      startX = touch.clientX;
      startY = touch.clientY;
      var r = el.getBoundingClientRect();
      origLeft = r.left;
      origTop = r.top;
      dragging = true;
      moved = false;
    }

    function onMove(e) {
      if (!dragging) return;
      var touch = e.touches ? e.touches[0] : e;
      var dy = touch.clientY - startY;
      if (!moved && Math.abs(dy) < DRAG_THRESHOLD) return;
      moved = true;
      e.preventDefault(); // prevent scroll while dragging
      var newY = origTop + dy;
      // Clamp to viewport vertically
      var vh = window.innerHeight;
      newY = Math.min(Math.max(newY, 0), vh - 20);
      el.style.top = newY + 'px';
      el.style.bottom = 'auto';
      el.style.transform = 'none';
    }

    function onEnd() {
      if (moved) {
        savePosition(el, sel);
      }
      dragging = false;
    }

    // Touch events
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    // Mouse events (for desktop testing)
    el.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', function () { if (dragging) onEnd(); });

    // Ensure the element can receive pointer events
    if (el.style.pointerEvents === 'none') {
      el.style.pointerEvents = 'auto';
    }
  }

  // Run after a short delay to let widgets inject themselves
  setTimeout(init, 1500);
  // Also re-run if quest widget appears later
  var obs = new MutationObserver(function () {
    if (document.querySelector('.quest-widget') && !document.querySelector('.quest-widget').__hvDrag) {
      init();
      document.querySelector('.quest-widget').__hvDrag = true;
    }
  });
  try { obs.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
})();
