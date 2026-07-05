// Quiz mode: "🏓 Đập Bóng" — swipe a ball toward the correct answer goal.
// Ball sits in center. 4 answer goals at top/right/bottom/left edges.
// User swipes to launch the ball. Max 3 tries.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  reg('pong', {
    weight: 1.0,
    canUse: function (q) {
      var list = window.HocVuiQuiz.helpers.optionList(q);
      return list.length >= 3;
    },
    render: function (ctx) {
      var q = ctx.question;
      var questionEl = ctx.questionEl;
      var optionsEl = ctx.optionsEl;
      var helpers = ctx.helpers;
      var finish = ctx.finish;

      if (questionEl) questionEl.textContent = q.question_text;

      var ck = helpers.correctKey(q);
      var field = helpers.el('div', 'qz-pong-field');
      optionsEl.appendChild(field);

      var list = helpers.shuffle(helpers.optionList(q)).slice(0, 4);
      // Positions: top, right, bottom, left
      var positions = ['top', 'right', 'bottom', 'left'];

      // Create goals at edges
      var goalEls = [];
      list.forEach(function (o, i) {
        var goal = helpers.el('div', 'option-btn qz-pong-goal qz-pong-goal-' + positions[i]);
        goal.dataset.key = o.key;
        goal.textContent = o.text;
        field.appendChild(goal);
        goalEls.push(goal);
      });

      // Ball in center
      var ball = helpers.el('div', 'qz-pong-ball', '⚽');
      field.appendChild(ball);

      var hint = helpers.el('div', 'qz-pong-hint', '👆 Vuốt bóng về đáp án đúng!');
      field.appendChild(hint);

      var tries = 0;
      var maxTries = 3;
      var animating = false;
      var done = false;
      var swipeStartX = 0, swipeStartY = 0, swipeStartTime = 0;

      function onStart(e) {
        if (done || animating) return;
        e.preventDefault();
        e.stopPropagation();
        document.body.style.overflow = 'hidden';
        var t = e.touches ? e.touches[0] : e;
        swipeStartX = t.clientX;
        swipeStartY = t.clientY;
        swipeStartTime = Date.now();
      }

      function onSwipeMove(e) {
        if (done || animating) return;
        e.preventDefault();
      }

      function onEnd(e) {
        if (done || animating) return;
        document.body.style.overflow = '';
        var t = e.changedTouches ? e.changedTouches[0] : e;
        var dx = t.clientX - swipeStartX;
        var dy = t.clientY - swipeStartY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var elapsed = Date.now() - swipeStartTime;

        // Require minimum swipe distance and speed
        if (dist < 30 || elapsed > 1000) return;

        // Determine primary direction
        var dir;
        if (Math.abs(dx) > Math.abs(dy)) {
          dir = dx > 0 ? 'right' : 'left';
        } else {
          dir = dy > 0 ? 'bottom' : 'top';
        }

        launchBall(dir);
      }

      function launchBall(dir) {
        animating = true;
        tries++;
        ball.classList.add('qz-pong-launch', 'qz-pong-launch-' + dir);

        // Find which goal is in that direction
        var idx = positions.indexOf(dir);
        var hitGoal = idx >= 0 && idx < goalEls.length ? goalEls[idx] : null;
        var hitKey = hitGoal ? hitGoal.dataset.key : '';
        var ok = hitKey === ck;

        setTimeout(function () {
          if (ok) {
            done = true;
            if (hitGoal) hitGoal.classList.add('correct');
            ball.classList.add('qz-pong-score');
            disableAll();
            finish(true, hitGoal ? hitGoal.textContent : '');
          } else {
            if (hitGoal) {
              hitGoal.classList.add('wrong');
              setTimeout(function () { hitGoal.classList.remove('wrong'); }, 400);
            }
            // Bounce back
            ball.className = 'qz-pong-ball';
            ball.textContent = '⚽';
            animating = false;

            if (tries >= maxTries) {
              // Out of tries
              done = true;
              disableAll();
              goalEls.forEach(function (g) {
                if (g.dataset.key === ck) g.classList.add('correct');
              });
              finish(false, hitGoal ? hitGoal.textContent : '');
            } else {
              // Update hint with remaining tries
              hint.textContent = '❌ Thử lại! Còn ' + (maxTries - tries) + ' lượt';
            }
          }
        }, 400);
      }

      function disableAll() {
        ball.removeEventListener('mousedown', onStart);
        ball.removeEventListener('touchstart', onStart);
        ball.removeEventListener('touchmove', onSwipeMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchend', onEnd);
        goalEls.forEach(function (g) { g.classList.add('disabled'); });
        document.body.style.overflow = '';
      }

      ball.addEventListener('mousedown', onStart);
      ball.addEventListener('touchstart', onStart, { passive: false });
      ball.addEventListener('touchmove', onSwipeMove, { passive: false });
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchend', onEnd);

      ctx.onReveal(function () {
        done = true;
        animating = false;
        disableAll();
        goalEls.forEach(function (g) {
          if (g.dataset.key === ck) g.classList.add('correct');
        });
      });
    }
  });
})();
