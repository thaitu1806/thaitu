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

      // Decorative sparkles fly around continuously until answer is chosen
      var spellParticles = [];
      var spellInterval = null;
      (function startSparkles() {
        function spawnSparkle() {
          var sp = document.createElement('span');
          sp.className = 'qz-spell-particle';
          // Random start from edges
          var side = Math.floor(Math.random() * 4);
          var startX, startY;
          if (side === 0) { startX = Math.random() * 100; startY = -8; }
          else if (side === 1) { startX = 108; startY = Math.random() * 100; }
          else if (side === 2) { startX = Math.random() * 100; startY = 108; }
          else { startX = -8; startY = Math.random() * 100; }
          sp.style.left = startX + '%';
          sp.style.top = startY + '%';
          // Random end inside
          var endX = 15 + Math.random() * 70;
          var endY = 15 + Math.random() * 70;
          sp.style.transition = 'left 0.7s ease-in, top 0.7s ease-in';
          // Random spell wand sprite
          var spCol = Math.floor(Math.random() * 4);
          sp.style.backgroundPosition = (-spCol * 36) + 'px 0px';
          field.appendChild(sp);
          spellParticles.push(sp);
          requestAnimationFrame(function() { sp.style.left = endX + '%'; sp.style.top = endY + '%'; });
          // Burst after arrival
          setTimeout(function() { sp.classList.add('burst'); setTimeout(function() { sp.remove(); var idx = spellParticles.indexOf(sp); if (idx >= 0) spellParticles.splice(idx, 1); }, 400); }, 750);
        }
        spawnSparkle();
        spellInterval = setInterval(function() { if (!done) spawnSparkle(); }, 600);
      })();
      function stopSparkles() {
        if (spellInterval) { clearInterval(spellInterval); spellInterval = null; }
        spellParticles.forEach(function(s) { s.classList.add('burst'); });
        setTimeout(function() { spellParticles.forEach(function(s) { s.remove(); }); spellParticles = []; }, 400);
      }

      var done = false;

      list.forEach(function (o, i) {
        var bottle = helpers.el('button', 'option-btn qz-spell-bottle', o.text);
        bottle.dataset.key = o.key;
        bottle.style.setProperty('--delay', (i * 0.2) + 's');
        var col = Math.floor(Math.random() * 4);
        var sprn = document.createElement('span');
        sprn.className = 'qz-spell-sprite';
        sprn.style.cssText = 'display:inline-block;width:60px;height:60px;background-position:' + (-col * 60) + 'px 0px';
        bottle.insertBefore(sprn, bottle.firstChild);
        bottle.addEventListener('click', function () {
          if (done) return;
          done = true;
          stopSparkles();
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
        stopSparkles();
        field.querySelectorAll('.qz-spell-bottle').forEach(function (b) {
          b.classList.add('disabled');
          if (b.dataset.key === ck) { b.classList.add('correct'); b.classList.add('glow'); }
        });
      });
    },
  });
})();
