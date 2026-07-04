// Quiz mode: "🏗️ Xếp Gạch" — 4 bricks fall slowly from top; tap the correct
// one to stack it on the wall. Wrong brick shatters.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('stack', {
    weight: 1.0,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      const list = helpers.shuffle(helpers.optionList(q)).slice(0, 4);

      const field = helpers.el('div', 'qz-stack-field');
      optionsEl.appendChild(field);

      // Wall base
      const wall = helpers.el('div', 'qz-stack-wall');
      wall.innerHTML = '<span class="qz-stack-base">🧱🧱🧱</span>';
      field.appendChild(wall);

      // Falling bricks
      const brickRow = helpers.el('div', 'qz-stack-bricks');
      let done = false;

      list.forEach((o, i) => {
        const brick = helpers.el('button', 'option-btn qz-stack-brick');
        brick.textContent = o.text;
        brick.dataset.key = o.key;
        brick.style.animationDelay = (i * 0.2) + 's';
        brick.addEventListener('click', () => {
          if (done) return;
          done = true;
          const ok = o.key === ck;
          brick.classList.add(ok ? 'correct' : 'wrong');
          if (ok) {
            brick.classList.add('stacked');
            wall.classList.add('grow');
          } else {
            brick.classList.add('shatter');
            brickRow.querySelectorAll('.qz-stack-brick').forEach(b => {
              if (b.dataset.key === ck) b.classList.add('correct', 'stacked');
            });
          }
          brickRow.querySelectorAll('.qz-stack-brick').forEach(b => b.classList.add('disabled'));
          finish(ok, o.text);
        });
        brickRow.appendChild(brick);
      });
      field.appendChild(brickRow);

      ctx.onReveal(() => {
        done = true;
        brickRow.querySelectorAll('.qz-stack-brick').forEach(b => {
          b.classList.add('disabled');
          if (b.dataset.key === ck) b.classList.add('correct');
        });
      });
    },
  });
})();
