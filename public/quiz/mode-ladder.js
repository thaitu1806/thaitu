// Quiz mode: "🪜 Thang Leo" — 4 answers stacked vertically as ladder rungs.
// Tap the correct rung to make a character climb up. Wrong = character falls.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('ladder', {
    weight: 1.0,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      const list = helpers.shuffle(helpers.optionList(q));

      const field = helpers.el('div', 'qz-ladder-field');
      optionsEl.appendChild(field);

      // Ladder rungs (bottom to top)
      const ladder = helpers.el('div', 'qz-ladder-rungs');
      let done = false;
      list.forEach((o, i) => {
        const rung = helpers.el('button', 'option-btn qz-ladder-rung qz-ladder-sprite');
        rung.textContent = o.text;
        rung.dataset.key = o.key;
        rung.style.setProperty('--i', String(i));
        var col = Math.floor(Math.random() * 4);
        rung.style.backgroundPosition = (col * 33.33) + '% 0';
        rung.addEventListener('click', () => {
          if (done) return;
          done = true;
          const ok = o.key === ck;
          rung.classList.add(ok ? 'correct' : 'wrong');
          if (ok) {
            climber.classList.add('climb');
            climber.style.setProperty('--target', String(i));
          } else {
            climber.classList.add('fall');
            ladder.querySelectorAll('.qz-ladder-rung').forEach(r => {
              if (r.dataset.key === ck) r.classList.add('correct');
            });
          }
          ladder.querySelectorAll('.qz-ladder-rung').forEach(r => r.classList.add('disabled'));
          finish(ok, o.text);
        });
        ladder.appendChild(rung);
      });
      field.appendChild(ladder);

      // Character below the ladder
      const climber = helpers.el('div', 'qz-ladder-climber');
      climber.innerHTML = '<img src="/img/climber.png" style="width:48px;height:48px;">';
      field.appendChild(climber);

      ctx.onReveal(() => {
        done = true;
        ladder.querySelectorAll('.qz-ladder-rung').forEach(r => {
          r.classList.add('disabled');
          if (r.dataset.key === ck) r.classList.add('correct');
        });
      });
    },
  });
})();
