// Quiz mode: "🪄 Phép Thuật" — potion bottles in a row, each labeled with an answer.
// Tap the correct bottle for a golden glow; wrong bottle smokes.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('spell', {
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

      var field = helpers.el('div', 'qz-spell-field');
      optionsEl.appendChild(field);

      var done = false;

      list.forEach(function (o, i) {
        var bottle = helpers.el('button', 'option-btn qz-spell-bottle', o.text);
        bottle.dataset.key = o.key;
        bottle.style.setProperty('--delay', (i * 0.2) + 's');
        bottle.addEventListener('click', function () {
          if (done) return;
          done = true;
          var ok = o.key === ck;
          bottle.classList.add(ok ? 'correct' : 'wrong');
          bottle.classList.add(ok ? 'glow' : 'smoke');
          if (!ok) {
            field.querySelectorAll('.qz-spell-bottle').forEach(function (b) {
              if (b.dataset.key === ck) { b.classList.add('correct'); b.classList.add('glow'); }
            });
          }
          field.querySelectorAll('.qz-spell-bottle').forEach(function (b) {
            b.classList.add('disabled');
          });
          finish(ok, o.text);
        });
        field.appendChild(bottle);
      });

      ctx.onReveal(function () {
        done = true;
        field.querySelectorAll('.qz-spell-bottle').forEach(function (b) {
          b.classList.add('disabled');
          if (b.dataset.key === ck) { b.classList.add('correct'); b.classList.add('glow'); }
        });
      });
    },
  });
})();
