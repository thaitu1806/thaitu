// Quiz mode: "🎯 Kéo Nối" — drag a line from the question box to the correct answer.
// Touch + mouse support. Visual connector line stretches during drag.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('match', {
    weight: 1.0,
    canUse: function (q) {
      return window.HocVuiQuiz.helpers.optionList(q).length >= 3;
    },
    render: function (ctx) {
      var q = ctx.question;
      var questionEl = ctx.questionEl;
      var optionsEl = ctx.optionsEl;
      var helpers = ctx.helpers;
      var finish = ctx.finish;

      if (questionEl) questionEl.textContent = q.question_text;

      var ck = helpers.correctKey(q);
      var field = helpers.el('div', 'qz-match-field');
      optionsEl.appendChild(field);

      // Left: question source box
      var srcBox = helpers.el('div', 'qz-match-source', q.question_text);
      srcBox.dataset.key = 'source';
      field.appendChild(srcBox);

      // Right: answer targets
      var targetsWrap = helpers.el('div', 'qz-match-targets');
      field.appendChild(targetsWrap);

      var list = helpers.shuffle(helpers.optionList(q));
      var targetEls = [];
      list.forEach(function (o) {
        var tgt = helpers.el('button', 'option-btn qz-match-target');
        tgt.dataset.key = o.key;
        tgt.textContent = o.text;
        targetsWrap.appendChild(tgt);
        targetEls.push(tgt);
      });

      // Connector line (a stretched div)
      var line = helpers.el('div', 'qz-match-line');
      line.style.display = 'none';
      field.appendChild(line);

      var dragging = false;
      var startX = 0, startY = 0;

      function getPos(e) {
        var t = e.touches ? e.touches[0] : e;
        return { x: t.clientX, y: t.clientY };
      }

      function updateLine(x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1;
        var len = Math.sqrt(dx * dx + dy * dy);
        var angle = Math.atan2(dy, dx) * 180 / Math.PI;
        var fieldRect = field.getBoundingClientRect();
        line.style.display = 'block';
        line.style.width = len + 'px';
        line.style.left = (x1 - fieldRect.left) + 'px';
        line.style.top = (y1 - fieldRect.top) + 'px';
        line.style.transform = 'rotate(' + angle + 'deg)';
      }

      function findTarget(x, y) {
        for (var i = 0; i < targetEls.length; i++) {
          var r = targetEls[i].getBoundingClientRect();
          if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
            return targetEls[i];
          }
        }
        return null;
      }

      function onStart(e) {
        if (dragging) return;
        e.preventDefault();
        dragging = true;
        var pos = getPos(e);
        var srcRect = srcBox.getBoundingClientRect();
        startX = srcRect.right;
        startY = srcRect.top + srcRect.height / 2;
        updateLine(startX, startY, pos.x, pos.y);
        srcBox.classList.add('qz-match-active');
      }

      function onMove(e) {
        if (!dragging) return;
        e.preventDefault();
        var pos = getPos(e);
        updateLine(startX, startY, pos.x, pos.y);
        // Highlight hovered target
        targetEls.forEach(function (t) { t.classList.remove('qz-match-hover'); });
        var hit = findTarget(pos.x, pos.y);
        if (hit) hit.classList.add('qz-match-hover');
      }

      function onEnd(e) {
        if (!dragging) return;
        dragging = false;
        srcBox.classList.remove('qz-match-active');
        targetEls.forEach(function (t) { t.classList.remove('qz-match-hover'); });

        var pos = e.changedTouches ? e.changedTouches[0] : e;
        var hit = findTarget(pos.clientX, pos.clientY);

        if (!hit) {
          line.style.display = 'none';
          return;
        }

        var ok = hit.dataset.key === ck;
        line.classList.add(ok ? 'qz-match-line-correct' : 'qz-match-line-wrong');

        if (ok) {
          hit.classList.add('correct');
          disableAll();
          finish(true, hit.textContent);
        } else {
          hit.classList.add('wrong');
          setTimeout(function () {
            hit.classList.remove('wrong');
            line.style.display = 'none';
            line.classList.remove('qz-match-line-wrong');
          }, 600);
        }
      }

      function disableAll() {
        targetEls.forEach(function (t) { t.classList.add('disabled'); });
        cleanup();
      }

      // Bind events
      srcBox.addEventListener('mousedown', onStart);
      srcBox.addEventListener('touchstart', onStart, { passive: false });
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchend', onEnd);

      function cleanup() {
        srcBox.removeEventListener('mousedown', onStart);
        srcBox.removeEventListener('touchstart', onStart);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchend', onEnd);
      }

      ctx.onReveal(function () {
        dragging = false;
        line.style.display = 'none';
        targetEls.forEach(function (t) {
          t.classList.add('disabled');
          if (t.dataset.key === ck) t.classList.add('correct');
        });
        cleanup();
      });
    }
  });
})();
