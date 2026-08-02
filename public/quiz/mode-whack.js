// Quiz mode: "🔨 Đập Chuột Chũi" — moles carrying answers pop up from holes one
// at a time; tap the mole holding the correct answer. A timing/reflex twist on
// the same data. Moles peek up and duck back on a loop; tapping the right one
// wins, a wrong one is marked wrong. Cleans up its interval.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('whack', {
    weight: 1.5,
    canUse(q) {
      const list = window.HocVuiQuiz.helpers.optionList(q);
      // Keep texts short so they fit on a mole sign.
      return list.length >= 3 && list.every(o => o.text.length <= 12);
    },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      const field = helpers.el('div', 'qz-whack-field');
      optionsEl.appendChild(field);
      const list = helpers.shuffle(helpers.optionList(q));
      const holes = list.map((o, i) => {
        const hole = helpers.el('div', 'qz-hole qz-hole-sprite');
        // Random hole variant (4 cols × 1 row) — percentage: 0%, 33.33%, 66.66%, 100%
        var holeCol = Math.floor(Math.random() * 4);
        hole.style.backgroundPosition = (holeCol * 33.33) + '% 0';
        const mole = helpers.el('button', 'option-btn qz-mole');
        mole.dataset.key = o.key;
        // Random mole variant (4 cols × 1 row) — percentage
        const moleCol = Math.floor(Math.random() * 4);
        mole.innerHTML = '<span class="qz-mole-face qz-mole-sprite" style="background-position:' + (moleCol * 33.33) + '% 0"></span><span class="qz-mole-sign">' + o.text + '</span>';
        mole.addEventListener('click', () => {
          if (!hole.classList.contains('up')) return;   // only catchable while up
          const ok = o.key === ck;
          stop();
          mole.classList.add(ok ? 'correct' : 'wrong');
          field.querySelectorAll('.qz-hole').forEach(h => h.classList.add('up'));
          if (!ok) field.querySelectorAll('.qz-mole').forEach(m => { if (m.dataset.key === ck) m.classList.add('correct'); });
          field.querySelectorAll('.qz-mole').forEach(m => m.classList.add('disabled'));
          finish(ok, o.text);
        });
        hole.appendChild(mole);
        field.appendChild(hole);
        return hole;
      });

      // Pop moles up/down on a loop so several are catchable at any moment.
      let timer = null;
      function tick() {
        holes.forEach(h => { if (Math.random() < 0.5) h.classList.add('up'); else h.classList.remove('up'); });
        // guarantee at least one is up
        if (!holes.some(h => h.classList.contains('up'))) holes[Math.floor(Math.random() * holes.length)].classList.add('up');
      }
      tick();
      timer = setInterval(tick, 900);
      function stop() { if (timer) clearInterval(timer); timer = null; }

      ctx.onReveal(() => { stop(); field.querySelectorAll('.qz-hole').forEach(h => h.classList.add('up')); field.querySelectorAll('.qz-mole').forEach(m => { m.classList.add('disabled'); if (m.dataset.key === ck) m.classList.add('correct'); }); });
    },
  });
})();
