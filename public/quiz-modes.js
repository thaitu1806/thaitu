// === Học Vui — Shared Quiz Answer Engine ===
// Renders the "answer" part of a question in one of several interaction modes,
// so a graphics game (e.g. v48) keeps its scene but the way the child answers
// VARIES per question: classic choice, true/false, or type-the-answer.
//
// Usage:
//   const q = HocVuiQuiz.render({
//     questionEl, optionsEl, question, onResult, mode (optional)
//   });
//   // ...later on timeout:
//   q.revealTimeout();   // shows the right answer, locks input
//
// onResult(ok, selText) is called once when the child answers.
// IMPORTANT: input elements carry classes containing "option"/"answer" and get
// .correct/.wrong applied, so the shared sounds/mascot/collection/engagement
// observers continue to fire automatically — no extra wiring per game.
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.HocVuiQuiz) return;

  function correctText(q) {
    const k = 'option_' + String(q.correct_answer || '').toLowerCase();
    return q[k] != null ? String(q[k]) : '';
  }
  function optionList(q) {
    return ['a', 'b', 'c', 'd']
      .map(k => ({ key: k, text: q['option_' + k] }))
      .filter(o => o.text != null && String(o.text).trim() !== '')
      .map(o => ({ key: o.key, text: String(o.text) }));
  }
  function wrongList(q) {
    const ck = String(q.correct_answer || '').toLowerCase();
    return optionList(q).filter(o => o.key !== ck);
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // Is the correct answer short enough to type comfortably (number or short word)?
  function typeable(q) {
    const t = correctText(q).trim();
    if (!t) return false;
    if (/^-?\d{1,4}$/.test(t)) return true;            // a number up to 4 digits
    if (/^[\p{L}]{1,6}$/u.test(t)) return true;        // a single short word
    return false;
  }

  function pickMode(q, forced) {
    const modes = ['choice', 'truefalse'];
    if (typeable(q)) modes.push('type');
    // weight: choice common, others sprinkle in
    if (forced && modes.includes(forced)) return forced;
    const bag = ['choice', 'choice', 'truefalse'];
    if (typeable(q)) bag.push('type', 'truefalse');
    return bag[Math.floor(Math.random() * bag.length)];
  }

  // ── Renderers ──────────────────────────────────────────────────────────────
  function render(opts) {
    const q = opts.question;
    const qEl = opts.questionEl;
    const box = opts.optionsEl;
    const onResult = opts.onResult || function () {};
    const mode = pickMode(q, opts.mode);
    let locked = false;
    box.innerHTML = '';
    box.className = box.className.replace(/\bqz-mode-\w+\b/g, '').trim() + ' qz-mode-' + mode;

    const ck = String(q.correct_answer || '').toLowerCase();
    const correct = correctText(q);

    function finish(ok, selText) {
      if (locked) return; locked = true;
      onResult(!!ok, selText != null ? selText : '');
    }

    // ---- MODE: classic multiple choice ----
    if (mode === 'choice') {
      if (qEl) qEl.textContent = q.question_text;
      shuffle(optionList(q)).forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'option-btn'; btn.dataset.key = o.key; btn.textContent = o.text;
        btn.addEventListener('click', () => {
          if (locked) return;
          const ok = o.key === ck;
          revealChoice(box, ck, o.key, ok);
          finish(ok, o.text);
        });
        box.appendChild(btn);
      });
      return makeHandle(() => revealChoice(box, ck, null, false));
    }

    // ---- MODE: true / false ----
    if (mode === 'truefalse') {
      const wrongs = wrongList(q);
      let isTrue = Math.random() < 0.5;
      if (!isTrue && wrongs.length === 0) isTrue = true;
      const shown = isTrue ? correct : wrongs[Math.floor(Math.random() * wrongs.length)].text;
      const base = (q.question_text || '').trim();
      let stmt;
      if (/=\s*\?\s*$/.test(base)) stmt = base.replace(/=\s*\?\s*$/, '= ' + shown);
      else if (/\?\s*$/.test(base)) stmt = base + '  →  ' + shown;
      else stmt = base + '  →  ' + shown;
      if (qEl) qEl.textContent = stmt;

      const mk = (label, val, cls) => {
        const b = document.createElement('button');
        b.className = 'option-btn tf-btn ' + cls; b.textContent = label;
        b.addEventListener('click', () => {
          if (locked) return;
          const ok = (val === isTrue);
          // mark chosen + the truthful choice
          b.classList.add(ok ? 'correct' : 'wrong');
          finish(ok, label);
        });
        return b;
      };
      box.appendChild(mk('❌ Sai', false, 'tf-no'));
      box.appendChild(mk('✅ Đúng', true, 'tf-yes'));
      return makeHandle(() => {
        // reveal: highlight the correct truth button
        box.querySelectorAll('.tf-btn').forEach(b => {
          const isYes = b.classList.contains('tf-yes');
          if (isYes === isTrue) b.classList.add('correct');
        });
      });
    }

    // ---- MODE: type the answer ----
    if (qEl) qEl.textContent = q.question_text;
    const numeric = /^-?\d+$/.test(correct.trim());
    const wrap = document.createElement('div');
    wrap.className = 'qz-type type-answer';
    const display = document.createElement('div');
    display.className = 'qz-type-display'; display.textContent = '';
    wrap.appendChild(display);
    let value = '';
    function setVal(v) { value = v; display.textContent = value || '?'; }
    setVal('');

    if (numeric) {
      const pad = document.createElement('div');
      pad.className = 'qz-pad';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach(lbl => {
        const k = document.createElement('button');
        k.className = 'qz-key'; k.textContent = lbl;
        k.addEventListener('click', () => {
          if (locked) return;
          if (lbl === '⌫') setVal(value.slice(0, -1));
          else if (lbl === '✓') submit();
          else if (value.length < 5) setVal(value + lbl);
        });
        pad.appendChild(k);
      });
      wrap.appendChild(pad);
    } else {
      const input = document.createElement('input');
      input.type = 'text'; input.className = 'qz-input'; input.maxLength = 12;
      input.setAttribute('autocomplete', 'off'); input.setAttribute('autocapitalize', 'off');
      input.addEventListener('input', () => { value = input.value; });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
      const go = document.createElement('button');
      go.className = 'qz-go'; go.textContent = '✓ Trả lời';
      go.addEventListener('click', submit);
      wrap.appendChild(input); wrap.appendChild(go);
      setTimeout(() => input.focus(), 60);
    }
    box.appendChild(wrap);

    function norm(s) { return String(s).trim().toLowerCase().normalize('NFC'); }
    function submit() {
      if (locked) return;
      const guess = numeric ? value : (wrap.querySelector('.qz-input') ? wrap.querySelector('.qz-input').value : value);
      if (!String(guess).trim()) return;
      const ok = norm(guess) === norm(correct);
      wrap.classList.add(ok ? 'correct' : 'wrong');
      if (!ok) { display.textContent = guess + '  →  ' + correct; }
      finish(ok, String(guess));
    }
    return makeHandle(() => { wrap.classList.add('reveal'); display.textContent = '👉 ' + correct; });

    function makeHandle(revealFn) {
      return {
        mode,
        revealTimeout() { if (locked) return; locked = true; try { revealFn(); } catch (e) {} },
        isLocked() { return locked; },
      };
    }
  }

  function revealChoice(box, ck, sel, ok) {
    box.querySelectorAll('.option-btn').forEach(b => {
      b.classList.add('disabled');
      if (b.dataset.key === ck) b.classList.add('correct');
      else if (sel && b.dataset.key === sel && !ok) b.classList.add('wrong');
    });
  }

  window.HocVuiQuiz = { render, typeable, correctText };
})();
