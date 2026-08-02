// Quiz mode: "🪙 Thẻ Cào" — each answer is hidden under a scratch-off canvas.
// The child drags/touches to scratch away the cover (like a real scratch card).
// When ~40% is scratched, the card auto-reveals. Then tap to choose the answer.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  // Load scratch cover sprite image once
  let coverImg = null;
  function getCoverImg() {
    if (coverImg) return coverImg;
    coverImg = new Image();
    coverImg.src = '/img/scratch-grid.png';
    return coverImg;
  }

  reg('scratch', {
    weight: 1.5,
    canUse(q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 2; },
    render(ctx) {
      const { question: q, questionEl, optionsEl, helpers, finish } = ctx;
      if (questionEl) questionEl.textContent = q.question_text;
      const ck = helpers.correctKey(q);
      optionsEl.classList.add('qz-scratch-field');
      let done = false;

      helpers.shuffle(helpers.optionList(q)).forEach((o, i) => {
        const card = helpers.el('div', 'option-btn qz-scratch');
        card.dataset.key = o.key;
        card.style.setProperty('--d', (i * 0.05) + 's');

        // Answer text (hidden under canvas)
        const label = helpers.el('span', 'qz-scratch-label', o.text);
        card.appendChild(label);

        // Canvas overlay (the scratchable surface)
        const canvas = document.createElement('canvas');
        canvas.className = 'qz-scratch-canvas';
        canvas.width = 160;
        canvas.height = 80;
        card.appendChild(canvas);

        const cctx = canvas.getContext('2d');
        let revealed = false;

        // Draw the scratch cover
        function drawCover() {
          const img = getCoverImg();
          const variant = Math.floor(Math.random() * 4);
          const cellW = img.naturalWidth / 4;
          const draw = () => {
            cctx.drawImage(img, variant * cellW, 0, cellW, img.naturalHeight, 0, 0, canvas.width, canvas.height);
          };
          if (img.complete) draw();
          else {
            // Fallback: solid silver while loading
            cctx.fillStyle = '#c0c8d4';
            cctx.fillRect(0, 0, canvas.width, canvas.height);
            img.onload = draw;
          }
        }
        drawCover();

        // Scratch logic
        let scratching = false;
        function getPos(e) {
          const rect = canvas.getBoundingClientRect();
          const t = e.touches ? e.touches[0] : e;
          return { x: (t.clientX - rect.left) * (canvas.width / rect.width), y: (t.clientY - rect.top) * (canvas.height / rect.height) };
        }
        function scratch(pos) {
          cctx.globalCompositeOperation = 'destination-out';
          cctx.beginPath();
          cctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
          cctx.fill();
          checkReveal();
        }
        function checkReveal() {
          if (revealed) return;
          const data = cctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let cleared = 0;
          for (let j = 3; j < data.length; j += 16) { if (data[j] === 0) cleared++; }
          const total = Math.ceil(data.length / 16);
          if (cleared / total > 0.4) {
            revealed = true;
            justScratched = true;
            setTimeout(() => { justScratched = false; }, 500);
            canvas.style.opacity = '0';
            canvas.style.pointerEvents = 'none';
            card.classList.add('revealed');
          }
        }

        function onStart(e) {
          if (revealed || done) return;
          scratching = true;
          scratch(getPos(e));
          e.preventDefault();
        }
        function onMove(e) {
          if (!scratching || revealed || done) return;
          scratch(getPos(e));
          e.preventDefault();
        }
        function onEnd() { scratching = false; }

        canvas.addEventListener('touchstart', onStart, { passive: false });
        canvas.addEventListener('touchmove', onMove, { passive: false });
        canvas.addEventListener('touchend', onEnd);
        canvas.addEventListener('mousedown', onStart);
        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseup', onEnd);
        canvas.addEventListener('mouseleave', onEnd);

        // Block click events that come from scratching (touch → click bubble)
        let justScratched = false;
        canvas.addEventListener('touchend', () => { justScratched = true; setTimeout(() => { justScratched = false; }, 500); });
        canvas.addEventListener('mouseup', () => { justScratched = true; setTimeout(() => { justScratched = false; }, 500); });

        // Tap to select (after revealed) — only if not from a scratch gesture
        card.addEventListener('click', (e) => {
          if (justScratched) return;
          if (!revealed || done) return;
          done = true;
          const ok = o.key === ck;
          card.classList.add(ok ? 'correct' : 'wrong');
          optionsEl.querySelectorAll('.qz-scratch').forEach(c => {
            c.classList.add('disabled', 'revealed');
            c.querySelector('.qz-scratch-canvas').style.opacity = '0';
            if (!ok && c.dataset.key === ck) c.classList.add('correct');
          });
          finish(ok, o.text);
        });

        optionsEl.appendChild(card);
      });

      ctx.onReveal(() => {
        done = true;
        optionsEl.querySelectorAll('.qz-scratch').forEach(c => {
          c.classList.add('disabled', 'revealed');
          const cv = c.querySelector('.qz-scratch-canvas');
          if (cv) cv.style.opacity = '0';
          if (c.dataset.key === ck) c.classList.add('correct');
        });
      });
    },
  });
})();
