// Quiz mode: "🎰 Slot Machine" — 3 spinning columns show answers cycling through;
// the child taps STOP on each column to lock it. If all 3 show the correct answer
// when stopped → win. Timing challenge + visual fun.
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
      const list = helpers.optionList(q).map(o => o.text);

      const field = helpers.el('div', 'qz-slot-field');
      optionsEl.appendChild(field);

      // Machine frame
      const machine = helpers.el('div', 'qz-slot-machine');
      field.appendChild(machine);

      // 3 columns
      var COLS = 3;
      var columns = [];
      var stopped = 0;
      var results = [];

      for (let c = 0; c < COLS; c++) {
        const col = helpers.el('div', 'qz-slot-col');
        const reel = helpers.el('div', 'qz-slot-reel');
        // Fill reel with cycling items (repeat list multiple times)
        const items = helpers.shuffle([...list, ...list, ...list]);
        items.forEach(txt => {
          const item = helpers.el('span', 'qz-slot-item', txt);
          reel.appendChild(item);
        });
        col.appendChild(reel);
        const stopBtn = helpers.el('button', 'qz-slot-stop', 'STOP');
        stopBtn.addEventListener('click', () => stopColumn(c));
        col.appendChild(stopBtn);
        machine.appendChild(col);
        // Animate: cycle through items
        const speed = 80 + c * 30; // slightly different speeds
        let pos = Math.floor(Math.random() * items.length);
        const interval = setInterval(() => {
          pos = (pos + 1) % items.length;
          reel.style.transform = 'translateY(-' + (pos * 40) + 'px)';
        }, speed);
        columns.push({ col, reel, stopBtn, interval, items, pos, stopped: false });
      }

      // Instruction
      const hint = helpers.el('p', 'qz-slot-hint', '🎰 Bấm STOP khi thấy đáp án đúng!');
      field.appendChild(hint);

      let done = false;

      function stopColumn(idx) {
        if (done) return;
        const c = columns[idx];
        if (c.stopped) return;
        c.stopped = true;
        clearInterval(c.interval);
        c.stopBtn.classList.add('disabled');
        c.stopBtn.textContent = '✓';
        // Determine which answer is currently visible
        const visibleIdx = c.pos % c.items.length;
        const visibleText = c.items[visibleIdx];
        results.push(visibleText);
        stopped++;

        if (stopped === COLS) {
          done = true;
          // Check: majority vote — if 2+ columns show the correct answer → win
          const correctCount = results.filter(t => t === correctText).length;
          const ok = correctCount >= 2;
          machine.classList.add(ok ? 'correct' : 'wrong');
          hint.textContent = ok ? '🎉 Jackpot! Đúng rồi!' : '❌ Sai! Đáp án: ' + correctText;
          hint.className = 'qz-slot-hint ' + (ok ? 'good' : 'bad');
          finish(ok, results.join(' | '));
        }
      }

      ctx.onReveal(() => {
        done = true;
        columns.forEach(c => { clearInterval(c.interval); c.stopBtn.classList.add('disabled'); });
        hint.textContent = '👉 ' + correctText;
        hint.className = 'qz-slot-hint good';
      });
    },
  });
})();
