// Quiz mode: "Kéo số" — a slider the child drags to the correct number, then
// confirms. Only for numeric answers within a small range so it stays tappable.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  function numAnswer(q) {
    const t = window.HocVuiQuiz.helpers.correctText(q).trim();
    return /^\d{1,3}$/.test(t) ? parseInt(t, 10) : null;
  }

  reg('slider', {
    weight: 1,
    canUse(q) {
      const n = numAnswer(q); if (n == null || n > 100) return false;
      // Slider is confusing for youngest kids
      try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); if ((p.grade ?? 2) < 2) return false; } catch {}
      return true;
    },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ans = numAnswer(q);
      // Build a range around the answer (min 0), span ~ max(10, 2*ans).
      const span = Math.max(10, ans * 2);
      const min = Math.max(0, ans - Math.ceil(span / 2));
      const max = min + span;

      const wrap = helpers.el('div', 'qz-slider type-answer');
      const bubble = helpers.el('div', 'qz-slider-val', String(min));
      const input = helpers.el('input', 'qz-range');
      input.type = 'range'; input.min = String(min); input.max = String(max); input.step = '1'; input.value = String(min);
      const scale = helpers.el('div', 'qz-slider-scale');
      scale.innerHTML = `<span>${min}</span><span>${max}</span>`;
      const go = helpers.el('button', 'qz-go', '✓ Chốt số này');

      input.addEventListener('input', () => { bubble.textContent = input.value; });
      go.addEventListener('click', () => {
        const val = parseInt(input.value, 10);
        const ok = val === ans;
        wrap.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) bubble.textContent = val + '  →  ' + ans;
        finish(ok, String(val));
      });

      wrap.appendChild(bubble);
      wrap.appendChild(input);
      wrap.appendChild(scale);
      wrap.appendChild(go);
      optionsEl.appendChild(wrap);

      ctx.onReveal(() => { wrap.classList.add('reveal'); bubble.textContent = '👉 ' + ans; });
    },
  });
})();
