// Quiz mode: "🎪 Xiếc Xoay" — answers on a slow-spinning wheel.
// Items counter-rotate to stay upright. Tap the correct answer to stop.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('spin', {
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

      var field = helpers.el('div', 'qz-spin-field');
      optionsEl.appendChild(field);

      var wheel = helpers.el('div', 'qz-spin-wheel');
      wheel.classList.add('spinning');
      field.appendChild(wheel);

      var done = false;
      var angles = [0, 90, 180, 270];

      list.forEach(function (o, i) {
        var item = helpers.el('button', 'option-btn qz-spin-item', o.text);
        item.dataset.key = o.key;
        var angle = angles[i % 4];
        // Position at radius using rotate + translateY + counter-rotate
        item.style.transform = 'rotate(' + angle + 'deg) translateY(-90px) rotate(-' + angle + 'deg)';
        item.addEventListener('click', function () {
          if (done) return;
          done = true;
          wheel.classList.remove('spinning');
          var ok = o.key === ck;
          item.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) {
            wheel.querySelectorAll('.qz-spin-item').forEach(function (el) {
              if (el.dataset.key === ck) el.classList.add('correct');
            });
          }
          wheel.querySelectorAll('.qz-spin-item').forEach(function (el) {
            el.classList.add('disabled');
          });
          finish(ok, o.text);
        });
        wheel.appendChild(item);
      });

      ctx.onReveal(function () {
        done = true;
        wheel.classList.remove('spinning');
        wheel.querySelectorAll('.qz-spin-item').forEach(function (el) {
          el.classList.add('disabled');
          if (el.dataset.key === ck) el.classList.add('correct');
        });
      });
    },
  });
})();
