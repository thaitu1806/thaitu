// Quiz mode: type the answer. Only applies to short answers (number ≤4 digits
// or a single short word). Numbers get an on-screen keypad; words get a text box.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('type', {
    weight: 2,
    canUse(q) { return window.HocVuiQuiz.helpers.isShortAnswer(q); },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const correct = helpers.correctText(q);
      const numeric = /^-?\d+$/.test(correct.trim());

      const wrap = helpers.el('div', 'qz-type type-answer');
      const display = helpers.el('div', 'qz-type-display', '?');
      wrap.appendChild(display);
      let value = '';
      const setVal = v => { value = v; display.textContent = value || '?'; };

      function submit(raw) {
        const guess = raw != null ? raw : value;
        if (!String(guess).trim()) return;
        const ok = helpers.norm(guess) === helpers.norm(correct);
        wrap.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) display.textContent = guess + '  →  ' + correct;
        finish(ok, String(guess));
      }

      if (numeric) {
        const pad = helpers.el('div', 'qz-pad');
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach(lbl => {
          const k = helpers.el('button', 'qz-key', lbl);
          k.addEventListener('click', () => {
            if (lbl === '⌫') setVal(value.slice(0, -1));
            else if (lbl === '✓') submit();
            else if (value.length < 5) setVal(value + lbl);
          });
          pad.appendChild(k);
        });
        wrap.appendChild(pad);
      } else {
        const input = helpers.el('input', 'qz-input');
        input.type = 'text'; input.maxLength = 12;
        input.setAttribute('autocomplete', 'off'); input.setAttribute('autocapitalize', 'off');
        input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(input.value); });
        const go = helpers.el('button', 'qz-go', '✓ Trả lời');
        go.addEventListener('click', () => submit(input.value));
        wrap.appendChild(input); wrap.appendChild(go);
        setTimeout(() => input.focus(), 60);
      }
      optionsEl.appendChild(wrap);

      ctx.onReveal(() => { wrap.classList.add('reveal'); display.textContent = '👉 ' + correct; });
    },
  });
})();
