// Quiz mode: "🌊 Sóng Biển" — answer chips float on water, bobbing up and down
// with a sine-wave animation at different phases. Pure CSS animation (no RAF).
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('wave', {
    weight: 1.0,
    canUse: function (q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render: function (ctx) {
      var q = ctx.question;
      var questionEl = ctx.questionEl;
      var optionsEl = ctx.optionsEl;
      var helpers = ctx.helpers;
      var finish = ctx.finish;

      if (questionEl) questionEl.textContent = q.question_text;
      var ck = helpers.correctKey(q);
      var list = helpers.shuffle(helpers.optionList(q));

      var field = helpers.el('div', 'qz-wave-field qz-wave-bg');
      optionsEl.appendChild(field);

      var done = false;

      list.forEach(function (o, i) {
        var chip = helpers.el('button', 'option-btn qz-wave-chip', o.text);
        chip.dataset.key = o.key;
        chip.style.setProperty('--phase', (i * 0.8) + 's');
        chip.addEventListener('click', function () {
          if (done) return;
          done = true;
          var ok = o.key === ck;
          // Stop all bobbing
          field.querySelectorAll('.qz-wave-chip').forEach(function (c) {
            c.style.animationPlayState = 'paused';
            c.classList.add('disabled');
          });
          chip.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) {
            field.querySelectorAll('.qz-wave-chip').forEach(function (c) {
              if (c.dataset.key === ck) c.classList.add('correct');
            });
          }
          finish(ok, o.text);
        });
        field.appendChild(chip);
      });

      ctx.onReveal(function () {
        done = true;
        field.querySelectorAll('.qz-wave-chip').forEach(function (c) {
          c.style.animationPlayState = 'paused';
          c.classList.add('disabled');
          if (c.dataset.key === ck) c.classList.add('correct');
        });
      });
    },
  });
})();
