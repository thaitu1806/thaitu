// Quiz mode: "🎯 Bắn Cung" — 4 targets show answers; the child drags an arrow
// and releases toward the correct target. Hit animation + miss feedback.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('archer', {
    weight: 1.2,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      const list = helpers.shuffle(helpers.optionList(q));

      const field = helpers.el('div', 'qz-archer-field');
      optionsEl.appendChild(field);

      // Targets
      const targetRow = helpers.el('div', 'qz-archer-targets');
      const targets = [];
      list.forEach((o) => {
        const t = helpers.el('div', 'qz-archer-target');
        t.dataset.key = o.key;
        t.innerHTML = '<span class="qz-target-ring">🎯</span><span class="qz-target-label">' + o.text + '</span>';
        targetRow.appendChild(t);
        targets.push(t);
      });
      field.appendChild(targetRow);

      // Arrow (drag source)
      const bow = helpers.el('div', 'qz-archer-bow');
      bow.innerHTML = '<span class="qz-arrow">🏹</span><span class="qz-bow-hint">← Kéo mũi tên vào bia đúng!</span>';
      field.appendChild(bow);

      let done = false;
      const arrow = bow.querySelector('.qz-arrow');

      // Drag handling (touch + mouse)
      let startX = 0, startY = 0, dragging = false;
      function onStart(e) {
        if (done) return;
        const p = e.touches ? e.touches[0] : e;
        startX = p.clientX; startY = p.clientY;
        dragging = true;
        arrow.classList.add('dragging');
        e.preventDefault();
      }
      function onMove(e) {
        if (!dragging) return;
        const p = e.touches ? e.touches[0] : e;
        const dx = p.clientX - startX, dy = p.clientY - startY;
        arrow.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        e.preventDefault();
      }
      function onEnd(e) {
        if (!dragging || done) return;
        dragging = false;
        arrow.classList.remove('dragging');
        const p = e.changedTouches ? e.changedTouches[0] : e;
        // Determine which target was hit
        let hit = null;
        targets.forEach(t => {
          const r = t.getBoundingClientRect();
          if (p.clientX >= r.left && p.clientX <= r.right && p.clientY >= r.top && p.clientY <= r.bottom) hit = t;
        });
        if (!hit) {
          // Missed — reset arrow
          arrow.style.transform = '';
          return;
        }
        done = true;
        const ok = hit.dataset.key === ck;
        // Animate arrow flying to target
        arrow.style.transform = '';
        arrow.classList.add('qz-arrow-hit');
        hit.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) targets.forEach(t => { if (t.dataset.key === ck) t.classList.add('correct'); });
        targets.forEach(t => t.classList.add('disabled'));
        const label = hit.querySelector('.qz-target-label');
        finish(ok, label ? label.textContent : '');
      }

      arrow.addEventListener('touchstart', onStart, { passive: false });
      arrow.addEventListener('mousedown', onStart);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchend', onEnd);
      document.addEventListener('mouseup', onEnd);

      ctx.onReveal(() => {
        done = true;
        targets.forEach(t => { t.classList.add('disabled'); if (t.dataset.key === ck) t.classList.add('correct'); });
      });
    },
  });
})();
