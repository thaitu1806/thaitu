/* game-progress.js — Show per-game progress badges on home page cards */
(function () {
  'use strict';

  // Only run on home page
  var path = location.pathname;
  if (path !== '/' && path !== '/home.html' && path !== '/index.html') return;

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '.gp-badge{display:flex;align-items:center;gap:6px;padding:4px 8px;margin-top:4px;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#fff8e1);font-size:0.7rem;line-height:1.2;flex-wrap:wrap;animation:gpFade .4s ease}',
    '.gp-stars{letter-spacing:1px}',
    '.gp-dots{display:flex;gap:2px;font-size:0.65rem}',
    '.gp-diamonds{color:#7c4dff;font-weight:700}',
    '.gp-hint{color:#ff6d00;font-weight:600;font-size:0.65rem;width:100%}',
    '@keyframes gpFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}'
  ].join('\n');
  document.head.appendChild(style);

  function getProfile() {
    try { return JSON.parse(localStorage.getItem('hocvui_profile')); } catch (e) { return null; }
  }

  function modeFromPath(p) {
    // data-path is like "/v2/", extract "v2"
    var m = (p || '').match(/\/(v\d+)\//);
    return m ? m[1] : null;
  }

  function renderStars(best) {
    var s = Math.min(Math.max(best || 0, 0), 3);
    return '⭐'.repeat(s) + '☆'.repeat(3 - s);
  }

  function renderDots(stats) {
    // 🟢 = played, 🔵 = medium ≥80%, 🟣 = hard ≥80%
    var played = (stats.plays || 0) > 0;
    var diffs = stats.difficulties_played || [];
    var hasMedium = diffs.indexOf('medium') >= 0;
    var hasHard = diffs.indexOf('hard') >= 0;
    // We need per-difficulty accuracy for mastery. We only have overall best_accuracy.
    // Approximate: if they played medium/hard AND best_accuracy >= 80, count it.
    var acc = stats.best_accuracy || 0;
    var mediumMastery = hasMedium && acc >= 80;
    var hardMastery = hasHard && acc >= 80;

    var dots = '';
    dots += played ? '🟢' : '⚫';
    dots += mediumMastery ? '🔵' : '⚫';
    dots += hardMastery ? '🟣' : '⚫';
    return dots;
  }

  function getHint(stats) {
    var diffs = stats.difficulties_played || [];
    var plays = stats.plays || 0;
    var acc = stats.best_accuracy || 0;
    var hasMedium = diffs.indexOf('medium') >= 0;
    var hasHard = diffs.indexOf('hard') >= 0;

    if (plays === 0) return '▸ Thử chơi nào!';
    if (!hasMedium) return '▸ Thử mức Vừa!';
    if (hasMedium && acc < 80) return '▸ Đạt 80% mức Vừa!';
    if (hasMedium && acc >= 80 && !hasHard) return '▸ Chinh phục mức Khó!';
    if (hasHard && acc < 80) return '▸ Đạt 80% mức Khó!';
    if (hasHard && acc >= 80) return '🏆 Bậc Thầy!';
    return '';
  }

  function renderBadge(stats) {
    var el = document.createElement('div');
    el.className = 'gp-badge';
    el.innerHTML =
      '<span class="gp-stars">' + renderStars(stats.best_stars) + '</span>' +
      '<span class="gp-dots">' + renderDots(stats) + '</span>' +
      '<span class="gp-diamonds">💎 ' + (stats.total_diamonds || 0) + '</span>' +
      '<span class="gp-hint">' + getHint(stats) + '</span>';
    return el;
  }

  function applyBadges(statsMap) {
    var cards = document.querySelectorAll('.game-card[data-path]');
    cards.forEach(function (card) {
      // Remove any existing badge (in case of re-render)
      var old = card.querySelector('.gp-badge');
      if (old) old.remove();

      var mode = modeFromPath(card.getAttribute('data-path'));
      if (!mode) return;
      var stats = statsMap[mode] || { plays: 0, best_stars: 0, best_accuracy: 0, total_diamonds: 0, difficulties_played: [] };

      card.appendChild(renderBadge(stats));
    });
  }

  function init() {
    var profile = getProfile();
    if (!profile || !profile.id) return;

    fetch('/api/players/' + profile.id + '/game-stats')
      .then(function (res) { return res.ok ? res.json() : {}; })
      .then(function (data) {
        if (!data || typeof data !== 'object') data = {};
        applyBadges(data);

        // Re-apply when cards re-render (search/filter changes the grid)
        var grid = document.getElementById('game-grid');
        if (grid) {
          var observer = new MutationObserver(function () { applyBadges(data); });
          observer.observe(grid, { childList: true });
        }
        var recentGrid = document.getElementById('recent-grid');
        if (recentGrid) {
          var observer2 = new MutationObserver(function () { applyBadges(data); });
          observer2.observe(recentGrid, { childList: true });
        }
      })
      .catch(function () { applyBadges({}); });
  }

  // Wait for DOM + profile (profile gate may be active)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 800); });
  } else {
    setTimeout(init, 800);
  }
})();
