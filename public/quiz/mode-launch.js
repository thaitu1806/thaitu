// Quiz mode: "🚀 Phóng Tên Lửa" — rockets on launch pads labeled with answers.
// Correct rocket flies up; wrong rocket shakes and smokes.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('launch', {
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

      var field = helpers.el('div', 'qz-launch-field');
      optionsEl.appendChild(field);

      var done = false;

      list.forEach(function (o, i) {
        var rocket = helpers.el('button', 'option-btn qz-launch-rocket', o.text);
        rocket.dataset.key = o.key;
        rocket.style.setProperty('--vib-delay', (i * 0.1) + 's');
        rocket.addEventListener('click', function () {
          if (done) return;
          done = true;
          var ok = o.key === ck;
          rocket.classList.add(ok ? 'correct' : 'wrong');
          rocket.classList.add(ok ? 'liftoff' : 'broken');
          if (!ok) {
            field.querySelectorAll('.qz-launch-rocket').forEach(function (r) {
              if (r.dataset.key === ck) { r.classList.add('correct'); r.classList.add('liftoff'); }
            });
          }
          field.querySelectorAll('.qz-launch-rocket').forEach(function (r) {
            r.classList.add('disabled');
          });
          finish(ok, o.text);
        });
        field.appendChild(rocket);
      });

      ctx.onReveal(function () {
        done = true;
        field.querySelectorAll('.qz-launch-rocket').forEach(function (r) {
          r.classList.add('disabled');
          if (r.dataset.key === ck) { r.classList.add('correct'); r.classList.add('liftoff'); }
        });
      });
    },
  });
})();
