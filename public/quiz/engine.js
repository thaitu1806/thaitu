// === Học Vui — Quiz Engine (core) ===
// A pluggable "answer engine": question TYPES register themselves as modes, and
// any game calls HocVuiQuiz.render(...) to show one randomly-chosen applicable
// mode for a given question. Adding a new question type later = drop in a new
// `quiz-mode-*.js` file that calls HocVuiQuiz.registerMode(...) — no game edits.
//
// Mode contract:
//   HocVuiQuiz.registerMode(id, {
//     weight,                     // number or (q)=>number  (selection weight; default 1)
//     canUse(question),           // optional → boolean (is this mode valid for q?)
//     render(ctx)                 // required → returns { revealTimeout?() }
//   })
//   ctx = {
//     question, questionEl, optionsEl,
//     helpers,                    // shared utilities (see below)
//     finish(ok, text),           // call exactly once when the child answers
//     onReveal(fn)                // register a reveal-on-timeout callback
//   }
//
// render() should apply classes containing "option"/"answer" + .correct/.wrong
// so the shared sounds/mascot/collection/engagement observers fire automatically.
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // Allow modes to queue registration before the engine is defined.
  const pending = window.__hvQuizPending || [];

  if (window.HocVuiQuiz && window.HocVuiQuiz.__core) return; // already initialized

  // ── Shared helpers given to every mode ──
  const helpers = {
    correctKey(q) { return String(q.correct_answer || '').toLowerCase(); },
    correctText(q) {
      const k = 'option_' + helpers.correctKey(q);
      return q[k] != null ? String(q[k]) : '';
    },
    optionList(q) {
      return ['a', 'b', 'c', 'd']
        .map(k => ({ key: k, text: q['option_' + k] }))
        .filter(o => o.text != null && String(o.text).trim() !== '')
        .map(o => ({ key: o.key, text: String(o.text) }));
    },
    wrongList(q) {
      const ck = helpers.correctKey(q);
      return helpers.optionList(q).filter(o => o.key !== ck);
    },
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    norm(s) { return String(s == null ? '' : s).trim().toLowerCase().normalize('NFC'); },
    // a short answer (number ≤4 digits or single short word) — handy for type/builder modes
    isShortAnswer(q) {
      const t = helpers.correctText(q).trim();
      if (!t) return false;
      if (/^-?\d{1,4}$/.test(t)) return true;
      if (/^[\p{L}]{1,6}$/u.test(t)) return true;
      return false;
    },
    el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; },
  };

  const modes = new Map(); // id -> def

  function registerMode(id, def) {
    if (!id || !def || typeof def.render !== 'function') return;
    modes.set(id, {
      id,
      weight: def.weight != null ? def.weight : 1,
      canUse: typeof def.canUse === 'function' ? def.canUse : () => true,
      render: def.render,
    });
  }

  function applicableModes(q) {
    const out = [];
    modes.forEach(m => { try { if (m.canUse(q)) out.push(m); } catch (e) {} });
    return out;
  }

  function pickMode(q, forcedId) {
    if (forcedId && modes.has(forcedId)) {
      const m = modes.get(forcedId);
      try { if (m.canUse(q)) return m; } catch (e) {}
    }
    const pool = applicableModes(q);
    if (pool.length === 0) return null;
    // weighted random
    const weights = pool.map(m => Math.max(0, typeof m.weight === 'function' ? m.weight(q) : m.weight));
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return pool[Math.floor(Math.random() * pool.length)];
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  function render(opts) {
    const q = opts.question;
    const box = opts.optionsEl;
    const qEl = opts.questionEl;
    const onResultCb = opts.onResult || function () {};
    const mode = pickMode(q, opts.mode);

    if (box) {
      box.innerHTML = '';
      box.className = (box.className || '').replace(/\bqz-mode-\w+\b/g, '').trim() + (mode ? ' qz-mode-' + mode.id : '');
    }

    let locked = false;
    let revealFn = null;
    const ctx = {
      question: q,
      questionEl: qEl,
      optionsEl: box,
      helpers,
      finish(ok, text) {
        if (locked) return; locked = true;
        try { onResultCb(!!ok, text != null ? text : ''); } catch (e) {}
      },
      onReveal(fn) { revealFn = fn; },
    };

    if (!mode) {
      // No mode available → degrade gracefully to plain text (shouldn't happen
      // if choice mode is loaded, since it applies to everything).
      if (qEl) qEl.textContent = q.question_text || '';
      return { mode: null, revealTimeout() {}, isLocked: () => locked };
    }

    let handle = null;
    try { handle = mode.render(ctx); } catch (e) { handle = null; }
    return {
      mode: mode.id,
      revealTimeout() {
        if (locked) return; locked = true;
        try { if (revealFn) revealFn(); else if (handle && handle.revealTimeout) handle.revealTimeout(); } catch (e) {}
      },
      isLocked() { return locked; },
    };
  }

  window.HocVuiQuiz = {
    __core: true,
    registerMode,
    render,
    helpers,
    // introspection
    listModes() { return Array.from(modes.keys()); },
    hasMode(id) { return modes.has(id); },
    // back-compat shims used by older callers
    correctText: helpers.correctText,
    typeable: helpers.isShortAnswer,
  };

  // flush any modes that registered before the engine loaded
  pending.forEach(args => { try { registerMode(args[0], args[1]); } catch (e) {} });
  window.__hvQuizPending = { push(args) { registerMode(args[0], args[1]); } };
})();
