// Quiz mode: "🎨 Vẽ Số" — draw freely on a canvas area, then tap to confirm answer.
// Only for numeric short answers (1-2 digits). The drawing is for fun/engagement;
// the actual answer is confirmed by tapping one of the options below.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('draw', {
    weight: 1.0,
    canUse: function (q) {
      var h = window.HocVuiQuiz.helpers;
      if (!h.isShortAnswer(q)) return false;
      var ct = h.correctText(q).trim();
      // Must be a 1-2 digit number
      return /^-?\d{1,2}$/.test(ct);
    },
    render: function (ctx) {
      var q = ctx.question;
      var questionEl = ctx.questionEl;
      var optionsEl = ctx.optionsEl;
      var helpers = ctx.helpers;
      var finish = ctx.finish;

      if (questionEl) questionEl.textContent = q.question_text;

      var ck = helpers.correctKey(q);
      var correctText = helpers.correctText(q).trim();
      var field = helpers.el('div', 'qz-draw-field');
      optionsEl.appendChild(field);

      // Step 1: Choose answer FIRST (no guide visible yet)
      var promptLabel = helpers.el('div', 'qz-draw-prompt', '✏️ Chọn đáp án rồi vẽ số đó!');
      field.appendChild(promptLabel);

      var btnWrap = helpers.el('div', 'qz-draw-btns');
      field.appendChild(btnWrap);

      // Generate options: correct + 3 nearby wrong numbers
      var correctNum = parseInt(correctText, 10);
      var choices = [correctNum];
      var offsets = [-2, -1, 1, 2, 3];
      for (var i = 0; i < offsets.length && choices.length < 4; i++) {
        var n = correctNum + offsets[i];
        if (n >= 0 && choices.indexOf(n) === -1) choices.push(n);
      }
      while (choices.length < 4) { choices.push(correctNum + choices.length + 1); }
      choices = choices.slice(0, 4);
      var shuffled = helpers.shuffle(choices.map(function (n) { return { num: n, text: String(n) }; }));

      var allBtns = [];
      var chosenNum = null;

      shuffled.forEach(function (item) {
        var btn = helpers.el('button', 'option-btn qz-draw-btn');
        btn.textContent = item.text;
        btn.dataset.key = item.text === correctText ? ck : 'wrong';
        btn.addEventListener('click', function () {
          if (chosenNum !== null) return; // already chose
          chosenNum = item.num;
          var ok = item.num === correctNum;
          btn.classList.add(ok ? 'correct' : 'wrong');
          allBtns.forEach(function (b) { b.classList.add('disabled'); });
          if (!ok) {
            allBtns.forEach(function (b) {
              if (parseInt(b.textContent, 10) === correctNum) b.classList.add('correct');
            });
          }
          // Step 2: Show canvas with guide number to trace
          showCanvas(ok ? item.num : correctNum, ok);
          finish(ok, item.text);
        });
        btnWrap.appendChild(btn);
        allBtns.push(btn);
      });

      function showCanvas(numToTrace, wasCorrect) {
        var canvasWrap = helpers.el('div', 'qz-draw-canvas-wrap');
        field.appendChild(canvasWrap);

        var canvas = document.createElement('canvas');
        canvas.className = 'qz-draw-canvas';
        canvas.width = 200;
        canvas.height = 160;
        canvas.style.touchAction = 'none';
        canvasWrap.appendChild(canvas);

        // Show guide number to trace
        var guide = helpers.el('div', 'qz-draw-guide', String(numToTrace));
        canvasWrap.appendChild(guide);

        var hint2 = helpers.el('div', 'qz-draw-hint', wasCorrect ? '🎉 Đúng! Vẽ theo số nào!' : '✏️ Vẽ lại số đúng nào!');
        field.appendChild(hint2);

        var drawCtx = canvas.getContext('2d');
        drawCtx.strokeStyle = wasCorrect ? '#4caf50' : '#f44336';
        drawCtx.lineWidth = 6;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';

        var drawing = false;
        function lockScroll() { document.body.style.overflow = 'hidden'; }
        function unlockScroll() { document.body.style.overflow = ''; }

        function getCanvasPos(e) {
          var rect = canvas.getBoundingClientRect();
          var t = e.touches ? e.touches[0] : e;
          return { x: t.clientX - rect.left, y: t.clientY - rect.top };
        }
        function startDraw(e) { e.preventDefault(); e.stopPropagation(); drawing = true; lockScroll(); var pos = getCanvasPos(e); drawCtx.beginPath(); drawCtx.moveTo(pos.x, pos.y); }
        function moveDraw(e) { if (!drawing) return; e.preventDefault(); e.stopPropagation(); var pos = getCanvasPos(e); drawCtx.lineTo(pos.x, pos.y); drawCtx.stroke(); }
        function endDraw() { if (drawing) { drawing = false; unlockScroll(); } }

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', moveDraw);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseleave', endDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', moveDraw, { passive: false });
        canvas.addEventListener('touchend', endDraw);
      }

      function disableAll() {
        allBtns.forEach(function (b) { b.classList.add('disabled'); });
      }

      ctx.onReveal(function () {
        disableAll();
        allBtns.forEach(function (b) {
          if (parseInt(b.textContent, 10) === correctNum) b.classList.add('correct');
        });
      });
    }
  });
})();
