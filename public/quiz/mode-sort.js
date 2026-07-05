// Quiz mode: "🔢 Xếp Thứ Tự" — tap numbers in ascending order.
// Shows 4 shuffled numeric options; user taps them smallest-to-largest.
// Correct sequence = win.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('sort', {
    weight: 1.0,
    canUse: function (q) {
      var list = window.HocVuiQuiz.helpers.optionList(q);
      if (list.length < 4) return false;
      // All 4 options must be numeric
      for (var i = 0; i < list.length; i++) {
        if (isNaN(parseFloat(list[i].text)) || !isFinite(list[i].text)) return false;
      }
      return true;
    },
    render: function (ctx) {
      var q = ctx.question;
      var questionEl = ctx.questionEl;
      var optionsEl = ctx.optionsEl;
      var helpers = ctx.helpers;
      var finish = ctx.finish;

      if (questionEl) questionEl.textContent = '🔢 Chạm số từ BÉ đến LỚN!';

      var ck = helpers.correctKey(q);
      var field = helpers.el('div', 'qz-sort-field');
      optionsEl.appendChild(field);

      // Instruction
      var hint = helpers.el('div', 'qz-sort-hint', 'Chạm số nhỏ nhất trước');
      field.appendChild(hint);

      // Sequence display area
      var seqArea = helpers.el('div', 'qz-sort-sequence');
      field.appendChild(seqArea);

      // Shuffled number chips
      var list = helpers.optionList(q);
      var sorted = list.slice().sort(function (a, b) { return parseFloat(a.text) - parseFloat(b.text); });
      var shuffled = helpers.shuffle(list.slice());

      var chipsWrap = helpers.el('div', 'qz-sort-chips');
      field.appendChild(chipsWrap);

      var tapped = [];
      var chipEls = [];

      shuffled.forEach(function (o, idx) {
        var chip = helpers.el('button', 'option-btn qz-sort-chip');
        chip.dataset.key = o.key;
        chip.textContent = o.text;
        chip.style.setProperty('--d', (idx * 0.05) + 's');
        chip.addEventListener('click', function () {
          var expectedIdx = tapped.length;
          var expected = sorted[expectedIdx];

          if (o.key === expected.key) {
            // Correct tap in sequence
            chip.classList.add('correct', 'disabled');
            tapped.push(o);

            // Add to sequence display
            var seqItem = helpers.el('span', 'qz-sort-seq-item correct', o.text);
            seqArea.appendChild(seqItem);

            // Check if done
            if (tapped.length === sorted.length) {
              // All correct, check if the correct_answer's option was in the right spot
              disableAll();
              finish(true, helpers.correctText(q));
            }
          } else {
            // Wrong order
            chip.classList.add('wrong');
            setTimeout(function () { chip.classList.remove('wrong'); }, 500);

            // Show what was expected
            var seqItem = helpers.el('span', 'qz-sort-seq-item wrong', o.text + '✗');
            seqArea.appendChild(seqItem);
            setTimeout(function () { seqArea.removeChild(seqItem); }, 600);

            // Fail after wrong tap
            disableAll();
            chipEls.forEach(function (c) {
              if (c.dataset.key === ck) c.classList.add('correct');
            });
            finish(false, o.text);
          }
        });
        chipsWrap.appendChild(chip);
        chipEls.push(chip);
      });

      function disableAll() {
        chipEls.forEach(function (c) { c.classList.add('disabled'); });
      }

      ctx.onReveal(function () {
        disableAll();
        chipEls.forEach(function (c) {
          if (c.dataset.key === ck) c.classList.add('correct');
        });
      });
    }
  });
})();
