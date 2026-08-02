// Quiz mode: "🎰 Slot Machine" — a single reel cycles through answers one by one;
// the child taps the big STOP button when the correct answer is showing.
// Simple tick-based animation (not RAF) so it's slow enough for kids.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('slot', {
    weight: 1.0,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const correctText = helpers.correctText(q);
      const list = helpers.shuffle(helpers.optionList(q));
      const texts = list.map(o => o.text);

      // Build UI
      const field = helpers.el('div', 'qz-slot-field');
      optionsEl.appendChild(field);

      const machine = helpers.el('div', 'qz-slot-machine qz-slot-sprite');
      // Random slot frame variant (4 cols × 1 row)
      machine.style.backgroundPosition = (Math.floor(Math.random() * 4) * 33.33) + '% 0%';
      field.appendChild(machine);

      // Chase lights
      const lights = helpers.el('div', 'qz-slot-lights');
      for (var i = 0; i < 8; i++) {
        var bulb = helpers.el('span', 'qz-slot-bulb');
        bulb.style.animationDelay = (i * 0.15) + 's';
        lights.appendChild(bulb);
      }
      machine.appendChild(lights);

      // Single display showing current answer (no scrolling reel, just text swap)
      var display = helpers.el('div', 'qz-slot-display');
      var displayText = helpers.el('div', 'qz-slot-display-text', texts[0]);
      display.appendChild(displayText);
      machine.appendChild(display);

      // Big STOP button
      var stopBtn = helpers.el('button', 'qz-slot-stop-big', '🛑 STOP');
      machine.appendChild(stopBtn);

      // Hint
      var hint = helpers.el('p', 'qz-slot-hint', '🎰 Bấm STOP khi thấy đáp án đúng!');
      field.appendChild(hint);

      // Animation: cycle through texts with setInterval
      var currentIdx = 0;
      var done = false;
      var interval = setInterval(function () {
        currentIdx = (currentIdx + 1) % texts.length;
        displayText.textContent = texts[currentIdx];
        // Brief scale pulse on change
        displayText.classList.remove('qz-slot-pulse');
        void displayText.offsetWidth; // force reflow
        displayText.classList.add('qz-slot-pulse');
      }, 750); // 750ms per item — slow enough to read!

      stopBtn.addEventListener('click', function () {
        if (done) return;
        done = true;
        clearInterval(interval);
        stopBtn.classList.add('disabled');

        var stoppedText = texts[currentIdx];
        var ok = stoppedText === correctText;

        machine.classList.add(ok ? 'win' : 'lose');
        stopBtn.textContent = ok ? '🎉 JACKPOT!' : '❌ Sai!';
        displayText.classList.add(ok ? 'qz-slot-correct' : 'qz-slot-wrong');
        hint.textContent = ok ? '🎉 Đúng rồi!' : '❌ Đáp án: ' + correctText;
        hint.className = 'qz-slot-hint ' + (ok ? 'good' : 'bad');

        if (ok) spawnSparkles(machine, helpers);
        finish(ok, stoppedText);
      });

      function spawnSparkles(parent, h) {
        for (var j = 0; j < 10; j++) {
          var s = h.el('span', 'qz-slot-sparkle');
          s.style.setProperty('--angle', (j * 36) + 'deg');
          parent.appendChild(s);
          setTimeout(function () { s.remove(); }, 800);
        }
      }

      ctx.onReveal(function () {
        done = true;
        clearInterval(interval);
        stopBtn.classList.add('disabled');
        displayText.textContent = correctText;
        displayText.classList.add('qz-slot-correct');
        hint.textContent = '👉 ' + correctText;
        hint.className = 'qz-slot-hint good';
      });
    },
  });
})();
