// Quiz mode: "🎵 Nốt Nhạc" — music notes on a staff. Correct note plays a
// happy beep (523Hz); wrong note plays a low tone (200Hz) via Web Audio.
(function () {
  'use strict';
  function reg(id, def) {
    if (window.HocVuiQuiz && window.HocVuiQuiz.registerMode) window.HocVuiQuiz.registerMode(id, def);
    else { (window.__hvQuizPending = window.__hvQuizPending || []).push([id, def]); }
  }

  function playTone(freq, duration) {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ac = new AudioCtx();
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration / 1000);
      setTimeout(function () { ac.close(); }, duration + 100);
    } catch (e) { /* Web Audio not available */ }
  }

  reg('music', {
    weight: 1.0,
    canUse: function (q) { return window.HocVuiQuiz.helpers.optionList(q).length >= 3; },
    render: function (ctx) {
      var q = ctx.question;
      var questionEl = ctx.questionEl;
      var optionsEl = ctx.optionsEl;
      var helpers = ctx.helpers;
      var finish = ctx.finish;

      if (questionEl) questionEl.textContent = q.question_text;
      var ck = helpers.correctKey(q);
      var list = helpers.shuffle(helpers.optionList(q));

      var field = helpers.el('div', 'qz-music-field');
      optionsEl.appendChild(field);

      // Staff lines background
      var staff = helpers.el('div', 'qz-music-staff');
      for (var i = 0; i < 5; i++) {
        var line = helpers.el('div', 'qz-music-line');
        staff.appendChild(line);
      }
      field.appendChild(staff);

      var done = false;

      list.forEach(function (o, idx) {
        var note = helpers.el('button', 'option-btn qz-music-note', o.text);
        note.dataset.key = o.key;
        note.style.setProperty('--bounce-delay', (idx * 0.15) + 's');
        var col = Math.floor(Math.random() * 4);
        var sprn = document.createElement('span');
        sprn.className = 'qz-music-sprite';
        sprn.style.cssText = 'display:inline-block;width:60px;height:60px;background-position:' + (-col * 60) + 'px 0px';
        note.insertBefore(sprn, note.firstChild);
        note.addEventListener('click', function () {
          if (done) return;
          done = true;
          var ok = o.key === ck;
          note.classList.add(ok ? 'correct' : 'wrong');
          if (ok) {
            playTone(523, 200);
          } else {
            playTone(200, 200);
            field.querySelectorAll('.qz-music-note').forEach(function (n) {
              if (n.dataset.key === ck) n.classList.add('correct');
            });
          }
          field.querySelectorAll('.qz-music-note').forEach(function (n) {
            n.classList.add('disabled');
          });
          finish(ok, o.text);
        });
        field.appendChild(note);
      });

      ctx.onReveal(function () {
        done = true;
        field.querySelectorAll('.qz-music-note').forEach(function (n) {
          n.classList.add('disabled');
          if (n.dataset.key === ck) n.classList.add('correct');
        });
      });
    },
  });
})();
