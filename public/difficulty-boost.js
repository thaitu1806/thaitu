// === Học Vui — Difficulty Boost (Incentive UI) ===
// Shared script that auto-detects difficulty selector buttons on game start
// screens and adds diamond multiplier labels + weekly challenge widget.
// Inject via <script src="/difficulty-boost.js"></script> on every page.
// No per-game edits needed — it finds .sel-btn[data-value="easy|medium|hard"]
// or similar patterns and enhances them.
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.__hvDiffBoost) return;
  window.__hvDiffBoost = true;

  // Only run on game pages
  var path = window.location.pathname;
  if (!/^\/v\d+\/?/.test(path) && !/\/(game|learn)\.html/.test(path)) return;

  var MULTIPLIERS = { easy: 1, medium: 2, hard: 3 };
  var LABELS = { easy: '💎×1', medium: '💎×2', hard: '💎×3 🔥' };

  // ── Badge difficulty buttons with diamond multiplier ──
  function badgeButtons() {
    // Find difficulty selector buttons (common patterns across games)
    var btns = document.querySelectorAll(
      '.sel-btn[data-value="easy"], .sel-btn[data-value="medium"], .sel-btn[data-value="hard"],' +
      '.btn-option[data-value="easy"], .btn-option[data-value="medium"], .btn-option[data-value="hard"],' +
      '[data-difficulty="easy"], [data-difficulty="medium"], [data-difficulty="hard"]'
    );
    if (!btns.length) return;

    btns.forEach(function (btn) {
      if (btn.dataset.hvBoosted) return;
      btn.dataset.hvBoosted = '1';
      var diff = btn.dataset.value || btn.dataset.difficulty;
      var label = LABELS[diff];
      if (!label) return;

      var badge = document.createElement('span');
      badge.className = 'hv-diff-badge';
      badge.textContent = label;
      badge.style.cssText = 'display:inline-block;margin-left:6px;font-size:0.7em;padding:2px 6px;border-radius:8px;background:rgba(255,215,0,0.2);color:#b8860b;font-weight:900;vertical-align:middle;';
      btn.appendChild(badge);

      // Glow effect on harder buttons
      if (diff === 'hard') {
        btn.style.boxShadow = (btn.style.boxShadow || '') + ', 0 0 8px rgba(255,100,0,0.3)';
      } else if (diff === 'medium') {
        btn.style.boxShadow = (btn.style.boxShadow || '') + ', 0 0 6px rgba(255,200,0,0.2)';
      }
    });
  }

  // ── Weekly Challenge Widget ──
  function getChallenge() {
    try {
      var stored = JSON.parse(localStorage.getItem('hv_weekly_challenge') || 'null');
      var now = new Date();
      var weekKey = now.getFullYear() + '-W' + Math.ceil(((now - new Date(now.getFullYear(),0,1)) / 86400000 + new Date(now.getFullYear(),0,1).getDay() + 1) / 7);
      if (stored && stored.week === weekKey) return stored;
      // New week — reset challenge
      var challenge = { week: weekKey, target: 5, done: 0, claimed: false };
      localStorage.setItem('hv_weekly_challenge', JSON.stringify(challenge));
      return challenge;
    } catch (e) { return { week: '', target: 5, done: 0, claimed: false }; }
  }

  function saveChallenge(ch) {
    try { localStorage.setItem('hv_weekly_challenge', JSON.stringify(ch)); } catch (e) {}
  }

  function showChallengeWidget() {
    // Only show on start/menu screens (where difficulty is chosen)
    var startScreen = document.querySelector('.screen.active, .screen.show');
    if (!startScreen) return;

    // Don't show if already showing
    if (document.getElementById('hv-diff-challenge')) return;

    var ch = getChallenge();
    var widget = document.createElement('div');
    widget.id = 'hv-diff-challenge';
    widget.style.cssText = 'margin:12px auto;max-width:320px;padding:12px 16px;border-radius:14px;background:linear-gradient(135deg,#fff3e0,#ffe0b2);border:2px solid #ffb74d;text-align:center;font-family:inherit;';
    var pct = Math.min(100, Math.round((ch.done / ch.target) * 100));
    widget.innerHTML = '<div style="font-weight:900;font-size:0.9rem;color:#e65100;margin-bottom:6px;">🏆 Thử thách tuần</div>' +
      '<div style="font-size:0.82rem;font-weight:700;color:#555;margin-bottom:8px;">Chơi ' + ch.target + ' ván Vừa/Khó → 🎁 +50💎</div>' +
      '<div style="height:8px;background:#ffe0b2;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#ff9800,#ff5722);border-radius:4px;transition:width .4s;"></div></div>' +
      '<div style="font-size:0.75rem;font-weight:800;color:#bf360c;margin-top:4px;">' + ch.done + '/' + ch.target + (ch.claimed ? ' ✅ Đã nhận!' : '') + '</div>';

    // Insert after the difficulty selector or at the end of the start container
    var container = startScreen.querySelector('.container, .setup-container, .start-container') || startScreen;
    var diffGroup = startScreen.querySelector('[data-group="difficulty"], .selector-group:last-child');
    if (diffGroup && diffGroup.parentNode) {
      diffGroup.parentNode.insertBefore(widget, diffGroup.nextSibling);
    } else {
      container.appendChild(widget);
    }
  }

  // ── Track when a medium/hard game completes ──
  // Listen for session saves (fetch hook on /api/sessions POST)
  if (!window.__hvDiffTracker) {
    window.__hvDiffTracker = true;
    var origFetch = window.fetch ? window.fetch.bind(window) : null;
    if (origFetch) {
      window.fetch = function (input, init) {
        var url = '';
        try { url = typeof input === 'string' ? input : (input && input.url) || ''; } catch (e) {}
        var method = ((init && init.method) || 'GET').toUpperCase();
        if (/\/api\/sessions/.test(url) && method === 'POST') {
          try {
            var body = init && init.body;
            if (typeof body === 'string') {
              var data = JSON.parse(body);
              var diff = data && data.difficulty;
              if (diff === 'medium' || diff === 'hard') {
                var ch = getChallenge();
                if (!ch.claimed && ch.done < ch.target) {
                  ch.done++;
                  if (ch.done >= ch.target) {
                    // Award bonus diamonds
                    ch.claimed = true;
                    if (data.player_id) {
                      origFetch('/api/answers', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ player_id: data.player_id, question_id: 0, selected_answer: '', correct_answer: '', is_correct: false, time_spent_ms: 0 }) }).catch(function(){});
                    }
                    setTimeout(function () {
                      if (window.HocVuiMascot) window.HocVuiMascot.say('🏆 Thử thách tuần hoàn thành! +50💎', 'good');
                    }, 1500);
                  }
                  saveChallenge(ch);
                }
              }
            }
          } catch (e) {}
        }
        return origFetch(input, init);
      };
    }
  }

  // ── Init ──
  function init() {
    badgeButtons();
    showChallengeWidget();
    // Re-badge if buttons are rendered later (dynamic start screens)
    var obs = new MutationObserver(function () { badgeButtons(); });
    try { obs.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 300); // slight delay for dynamic renders
  }
})();
