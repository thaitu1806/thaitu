// Quiz mode: "🫧 Bắt Bọt" — floating bubbles with answers rise upward.
// Pop the WRONG bubbles (they burst). Leave only the correct one standing.
// If user pops the correct bubble → wrong answer.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('bubble', {
    weight: 1.0,
    canUse: function (q) {
      return window.HocVuiQuiz.helpers.optionList(q).length >= 3;
    },
    render: function (ctx) {
      var q = ctx.question;
      var questionEl = ctx.questionEl;
      var optionsEl = ctx.optionsEl;
      var helpers = ctx.helpers;
      var finish = ctx.finish;

      if (questionEl) questionEl.textContent = q.question_text;

      var ck = helpers.correctKey(q);
      var field = helpers.el('div', 'qz-bubble-field');
      optionsEl.appendChild(field);

      var hint = helpers.el('div', 'qz-bubble-hint', '🫧 Bấm vỡ đáp án SAI!');
      field.appendChild(hint);

      var arena = helpers.el('div', 'qz-bubble-arena');
      field.appendChild(arena);

      // Spawn decorative background bubbles for ambiance
      for (var d = 0; d < 6; d++) {
        var deco = helpers.el('span', 'qz-bubble-deco');
        deco.style.left = (10 + Math.random() * 80) + '%';
        deco.style.bottom = '-12px';
        deco.style.width = (8 + Math.random() * 14) + 'px';
        deco.style.height = deco.style.width;
        deco.style.animationDelay = (Math.random() * 4) + 's';
        deco.style.animationDuration = (4 + Math.random() * 4) + 's';
        arena.appendChild(deco);
      }

      var list = helpers.shuffle(helpers.optionList(q));
      var n = list.length;
      var bubbleData = [];
      var remaining = n;
      var done = false;
      var autoTimer = null;

      list.forEach(function (o, i) {
        var bubble = helpers.el('button', 'option-btn qz-bubble-item qz-bubble-sprite');
        bubble.dataset.key = o.key;
        // Label below the bubble
        var lbl = document.createElement('span');
        lbl.className = 'qz-bubble-label';
        lbl.textContent = o.text;
        bubble.appendChild(lbl);
        bubble.style.left = ((i + 0.5) * (100 / n)) + '%';
        var yStart = 10 + (i % 3) * 25;
        // Random sprite variant
        function randomBubbleSprite(el) {
          var c = Math.floor(Math.random() * 4);
          var r = Math.floor(Math.random() * 2);
          el.style.backgroundPosition = (-c * 74) + 'px ' + (-r * 74) + 'px';
        }
        randomBubbleSprite(bubble);

        bubble.addEventListener('click', function () {
          if (done) return;
          if (o.key === ck) {
            // Popped the correct one — wrong!
            done = true;
            stop();
            bubble.classList.add('wrong', 'qz-bubble-burst');
            disableAll();
            // Reveal correct
            setTimeout(function () {
              bubbleData.forEach(function (bd) {
                if (bd.o.key === ck && bd.el !== bubble) bd.el.classList.add('correct');
              });
            }, 300);
            finish(false, o.text);
          } else {
            // Popped a wrong one — good!
            bubble.classList.add('qz-bubble-burst');
            remaining--;
            setTimeout(function () { bubble.style.visibility = 'hidden'; }, 400);

            // Check if only 1 remains (the correct one)
            if (remaining === 1) {
              done = true;
              stop();
              autoTimer = setTimeout(function () {
                bubbleData.forEach(function (bd) {
                  if (bd.o.key === ck) {
                    bd.el.classList.add('correct', 'qz-bubble-winner');
                  }
                });
                disableAll();
                finish(true, helpers.correctText(q));
              }, 800);
            }
          }
        });

        arena.appendChild(bubble);
        bubbleData.push({ el: bubble, o: o, y: yStart, speed: 0.012 + Math.random() * 0.01, sway: Math.random() * Math.PI * 2 });
      });

      // Animation loop
      var raf = null, last = 0;
      function frame(t) {
        if (!last) last = t;
        var dt = Math.min(50, t - last); last = t;
        bubbleData.forEach(function (b) {
          if (b.el.style.visibility === 'hidden') return;
          b.y += b.speed * dt;
          if (b.y > 105) {
            b.y = -15;
            // Random new bubble sprite on re-appear
            var c = Math.floor(Math.random() * 4);
            var r = Math.floor(Math.random() * 2);
            b.el.style.backgroundPosition = (-c * 74) + 'px ' + (-r * 74) + 'px';
          }
          b.sway += dt * 0.002;
          b.el.style.bottom = b.y + '%';
          b.el.style.transform = 'translateX(calc(-50% + ' + (Math.sin(b.sway) * 12) + 'px))';
        });
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);

      function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

      function disableAll() {
        bubbleData.forEach(function (bd) { bd.el.classList.add('disabled'); });
      }

      ctx.onReveal(function () {
        done = true;
        stop();
        if (autoTimer) clearTimeout(autoTimer);
        disableAll();
        bubbleData.forEach(function (bd) {
          if (bd.o.key === ck) bd.el.classList.add('correct');
        });
      });
    }
  });
})();
