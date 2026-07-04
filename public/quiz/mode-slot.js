// Quiz mode: "🎰 Slot Machine" — a single flashy reel spins through all answers;
// the child taps the big STOP button when the correct answer is visible.
// One-column design with neon glow, sparkles, and a satisfying result animation.
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
      const ck = helpers.correctKey(q);
      const correctText = helpers.correctText(q);
      const list = helpers.shuffle(helpers.optionList(q));
      const texts = list.map(o => o.text);

      // Build the machine
      const field = helpers.el('div', 'qz-slot-field');
      optionsEl.appendChild(field);

      const machine = helpers.el('div', 'qz-slot-machine');
      field.appendChild(machine);

      // Decorative lights
      const lights = helpers.el('div', 'qz-slot-lights');
      for (let i = 0; i < 8; i++) {
        const bulb = helpers.el('span', 'qz-slot-bulb');
        bulb.style.animationDelay = (i * 0.15) + 's';
        lights.appendChild(bulb);
      }
      machine.appendChild(lights);

      // Single reel window (shows 3 items, center one is "selected")
      const window_ = helpers.el('div', 'qz-slot-window');
      const reel = helpers.el('div', 'qz-slot-reel');
      // Build a long repeating strip of answers
      const strip = [...texts, ...texts, ...texts, ...texts, ...texts];
      strip.forEach(txt => {
        const item = helpers.el('div', 'qz-slot-item', txt);
        reel.appendChild(item);
      });
      window_.appendChild(reel);
      // Center indicator (pointer showing which item counts)
      const pointer = helpers.el('div', 'qz-slot-pointer');
      pointer.innerHTML = '▶';
      window_.appendChild(pointer);
      machine.appendChild(window_);

      // Big STOP button
      const stopBtn = helpers.el('button', 'qz-slot-stop-big', '🛑 STOP');
      machine.appendChild(stopBtn);

      // Hint text
      const hint = helpers.el('p', 'qz-slot-hint', '🎰 Bấm STOP khi thấy đáp án đúng!');
      field.appendChild(hint);

      // Animation state
      const ITEM_H = 52; // px per item (match CSS)
      let pos = 0;
      let speed = 4; // px per frame
      let raf = null;
      let done = false;
      let slowingDown = false;
      let targetPos = null;

      function frame() {
        if (slowingDown) {
          // Decelerate toward target
          const dist = targetPos - pos;
          if (Math.abs(dist) < 1) {
            pos = targetPos;
            reel.style.transform = 'translateY(-' + pos + 'px)';
            onStopped();
            return;
          }
          pos += dist * 0.12;
        } else {
          pos += speed;
          // Loop around
          if (pos >= strip.length * ITEM_H) pos -= texts.length * ITEM_H;
        }
        reel.style.transform = 'translateY(-' + pos + 'px)';
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);

      stopBtn.addEventListener('click', () => {
        if (done || slowingDown) return;
        slowingDown = true;
        stopBtn.classList.add('pressed');
        // Find the nearest item center position
        const currentIdx = Math.round(pos / ITEM_H);
        // Snap to the nearest full item (add a few items for deceleration feel)
        targetPos = (currentIdx + 3) * ITEM_H;
      });

      function onStopped() {
        done = true;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        // Determine which text is at the center position
        const idx = Math.round(pos / ITEM_H) % texts.length;
        const stoppedText = texts[idx];
        const ok = stoppedText === correctText;

        machine.classList.add(ok ? 'win' : 'lose');
        stopBtn.textContent = ok ? '🎉 JACKPOT!' : '❌ Sai rồi!';
        stopBtn.classList.add('disabled');
        hint.textContent = ok ? '🎉 Đúng rồi! Tuyệt vời!' : '❌ Đáp án đúng: ' + correctText;
        hint.className = 'qz-slot-hint ' + (ok ? 'good' : 'bad');

        // Sparkle burst on win
        if (ok) spawnSparkles(machine);
        finish(ok, stoppedText);
      }

      function spawnSparkles(parent) {
        for (let i = 0; i < 12; i++) {
          const s = helpers.el('span', 'qz-slot-sparkle');
          s.style.setProperty('--angle', (i * 30) + 'deg');
          s.style.animationDelay = (Math.random() * 0.2) + 's';
          parent.appendChild(s);
          setTimeout(() => s.remove(), 800);
        }
      }

      ctx.onReveal(() => {
        done = true;
        if (raf) cancelAnimationFrame(raf);
        stopBtn.classList.add('disabled');
        hint.textContent = '👉 ' + correctText;
        hint.className = 'qz-slot-hint good';
      });
    },
  });
})();
