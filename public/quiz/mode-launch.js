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

      // Decorative rockets: fly random path → explode → respawn (loop until done)
      var introEls = [];
      var orbitInterval = null;
      (function startOrbits() {
        function spawnRocket() {
          var mini = document.createElement('span');
          mini.className = 'qz-launch-intro';
          // Random start position (edge)
          var side = Math.floor(Math.random() * 4);
          var startX, startY, endX, endY;
          if (side === 0) { startX = Math.random() * 100; startY = -10; } // top
          else if (side === 1) { startX = 110; startY = Math.random() * 100; } // right
          else if (side === 2) { startX = Math.random() * 100; startY = 110; } // bottom
          else { startX = -10; startY = Math.random() * 100; } // left
          // Random end position (somewhere inside)
          endX = 20 + Math.random() * 60;
          endY = 20 + Math.random() * 60;
          mini.style.left = startX + '%';
          mini.style.top = startY + '%';
          // Random sprite
          var ic = Math.floor(Math.random() * 4);
          mini.style.backgroundImage = 'url(/img/launch-grid.png)';
          mini.style.backgroundSize = '200px 50px';
          mini.style.backgroundPosition = (-ic * 50) + 'px 0px';
          mini.style.transition = 'left 0.8s ease-in, top 0.8s ease-in';
          field.appendChild(mini);
          introEls.push(mini);
          // Fly to target
          requestAnimationFrame(function() {
            mini.style.left = endX + '%';
            mini.style.top = endY + '%';
          });
          // Explode after flight
          setTimeout(function() {
            mini.classList.add('explode');
            setTimeout(function() { mini.remove(); var idx = introEls.indexOf(mini); if (idx >= 0) introEls.splice(idx, 1); }, 500);
          }, 900);
        }
        // Spawn one immediately, then every 1.2s
        spawnRocket();
        orbitInterval = setInterval(function() { if (!done) spawnRocket(); }, 1200);
      })();
      function stopOrbits() {
        if (orbitInterval) { clearInterval(orbitInterval); orbitInterval = null; }
        introEls.forEach(function(m) { m.classList.add('explode'); });
        setTimeout(function() { introEls.forEach(function(m) { m.remove(); }); introEls = []; }, 500);
      }

      var done = false;

      list.forEach(function (o, i) {
        var rocket = helpers.el('button', 'option-btn qz-launch-rocket', o.text);
        rocket.dataset.key = o.key;
        rocket.style.setProperty('--vib-delay', (i * 0.1) + 's');
        var col = Math.floor(Math.random() * 4);
        var sprn = document.createElement('span');
        sprn.className = 'qz-launch-sprite';
        sprn.style.cssText = 'display:inline-block;width:60px;height:60px;background-position:' + (-col * 60) + 'px 0px';
        rocket.insertBefore(sprn, rocket.firstChild);
        rocket.addEventListener('click', function () {
          if (done) return;
          done = true;
          stopOrbits();
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
        stopOrbits();
        field.querySelectorAll('.qz-launch-rocket').forEach(function (r) {
          r.classList.add('disabled');
          if (r.dataset.key === ck) { r.classList.add('correct'); r.classList.add('liftoff'); }
        });
      });
    },
  });
})();
