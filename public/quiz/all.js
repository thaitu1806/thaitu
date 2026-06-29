// === Học Vui — Quiz mode bundle loader ===
// Loads ALL answer-mode plugins so a game only needs two includes:
//   <script src="/quiz/engine.js"></script>
//   <script src="/quiz/all.js"></script>
// To add a new question type later: create public/quiz/mode-<id>.js and add its
// id to the MODES list below — every game that uses this bundle gets it
// automatically, with NO per-game edits.
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  if (window.__hvQuizAllLoaded) return;
  window.__hvQuizAllLoaded = true;

  // Register the available modes here. Order doesn't matter (engine queues
  // registrations that arrive before it loads).
  const MODES = [
    'choice',
    'truefalse',
    'type',
    'tap',
    'mystery',
    'slider',
    'eliminate',
    'catch',
  ];

  // Resolve this script's folder so mode files load from the same place
  // regardless of where the page lives (works for /vNN/, /lab/<g>/, root pages).
  let base = '/quiz/';
  try {
    const cur = document.currentScript && document.currentScript.src;
    if (cur) base = cur.slice(0, cur.lastIndexOf('/') + 1);
  } catch (e) {}

  MODES.forEach(id => {
    const s = document.createElement('script');
    s.src = base + 'mode-' + id + '.js';
    s.async = false;          // preserve order, run before game.js continues
    document.head.appendChild(s);
  });
})();
