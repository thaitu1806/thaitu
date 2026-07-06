/* game-progress.js — Show per-game progress badges on home page cards */
(function () {
  'use strict';

  // Only run on home page
  var path = location.pathname;
  if (path !== '/' && path !== '/home.html' && path !== '/index.html') return;

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '.gp-badge{display:flex;align-items:center;gap:6px;padding:8px 10px;margin-top:10px;border-radius:12px;background:linear-gradient(135deg,#ede7f6,#e8f5e9,#fff8e1);font-size:0.72rem;line-height:1.2;flex-wrap:wrap;animation:gpFade .5s ease;width:100%;order:99;border:1.5px solid rgba(149,117,205,0.25);box-shadow:0 2px 8px rgba(149,117,205,0.12);clear:both}',
    '.game-card{flex-wrap:wrap !important}',
    '.gp-stars{letter-spacing:2px;font-size:0.85rem;filter:drop-shadow(0 1px 3px rgba(255,193,7,0.5));animation:gpStarPulse 2s ease-in-out infinite}',
    '@keyframes gpStarPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}',
    '.gp-dots{display:flex;gap:4px;font-size:0.8rem;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.15))}',
    '.gp-diamonds{color:#7c4dff;font-weight:900;font-size:0.75rem;background:linear-gradient(135deg,rgba(124,77,255,0.12),rgba(124,77,255,0.05));padding:2px 8px;border-radius:8px;border:1px solid rgba(124,77,255,0.2)}',
    '.gp-hint{color:#fff;font-weight:800;font-size:0.68rem;width:100%;margin-top:4px;padding:5px 10px;border-radius:8px;background:linear-gradient(135deg,#ff6d00,#ff9100);display:inline-block;text-shadow:0 1px 1px rgba(0,0,0,0.2);box-shadow:0 2px 6px rgba(255,109,0,0.35);letter-spacing:0.3px;animation:gpHintBounce 2.5s ease-in-out infinite}',
    '@keyframes gpHintBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}',
    '.gp-badge .gp-hint.gp-master{background:linear-gradient(135deg,#7c4dff,#aa00ff);box-shadow:0 2px 6px rgba(124,77,255,0.35)}',
    '@keyframes gpFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
    '.game-card.gp-tier-easy{background-image:url(/frames/easy-frame.svg);background-size:100% 100%;background-repeat:no-repeat;padding:18px 18px;border:none;box-shadow:0 4px 14px rgba(102,187,106,0.2)}',
    '.game-card.gp-tier-medium{background-image:url(/frames/medium-frame.svg);background-size:100% 100%;background-repeat:no-repeat;padding:18px 18px;border:none;box-shadow:0 4px 14px rgba(66,165,245,0.2)}',
    '.game-card.gp-tier-hard{background-image:url(/frames/hard-frame.svg);background-size:100% 100%;background-repeat:no-repeat;padding:18px 18px;border:none;box-shadow:0 4px 16px rgba(171,71,188,0.25),0 0 8px rgba(123,31,162,0.12);animation:cardUp .4s ease both,gpHardGlow 2.5s ease-in-out infinite alternate}',
    '@keyframes gpHardGlow{0%{box-shadow:0 4px 16px rgba(171,71,188,0.2)}100%{box-shadow:0 4px 20px rgba(171,71,188,0.35),0 0 10px rgba(123,31,162,0.15)}}',
    '.game-card.gp-mastered{background-image:url(/frames/dragon-frame.svg);background-size:100% 100%;background-repeat:no-repeat;background-color:#f3e5f5;padding:18px 18px;border:none;box-shadow:0 4px 18px rgba(156,39,176,0.25),0 0 0 2px rgba(255,215,0,0.25);animation:cardUp .4s ease both,gpMasterGlow 3s ease-in-out infinite}',
    '@keyframes gpMasterGlow{0%,100%{box-shadow:0 4px 18px rgba(156,39,176,0.25),0 0 0 2px rgba(255,215,0,0.25)}50%{box-shadow:0 6px 24px rgba(156,39,176,0.4),0 0 0 3px rgba(255,215,0,0.4)}}'
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
    var hint = getHint(stats);
    var hintClass = hint.indexOf('Bậc Thầy') >= 0 ? 'gp-hint gp-master' : 'gp-hint';
    el.innerHTML =
      '<span class="gp-stars">' + renderStars(stats.best_stars) + '</span>' +
      '<span class="gp-dots">' + renderDots(stats) + '</span>' +
      '<span class="gp-diamonds">💎 ' + (stats.total_diamonds || 0) + '</span>' +
      '<span class="' + hintClass + '">' + hint + '</span>';
    return el;
  }

  function getTier(stats) {
    var diffs = stats.difficulties_played || [];
    var acc = stats.best_accuracy || 0;
    var plays = stats.plays || 0;
    if (plays === 0) return '';
    if (diffs.indexOf('hard') >= 0 && acc >= 80) return 'gp-mastered';
    if (diffs.indexOf('hard') >= 0) return 'gp-tier-hard';
    if (diffs.indexOf('medium') >= 0 && acc >= 80) return 'gp-tier-medium';
    if (diffs.indexOf('medium') >= 0) return 'gp-tier-easy';
    return 'gp-tier-easy';
  }

  var TIER_CLASSES = ['gp-mastered', 'gp-tier-hard', 'gp-tier-medium', 'gp-tier-easy'];

  function applyBadges(statsMap) {
    var cards = document.querySelectorAll('.game-card[data-path]');
    cards.forEach(function (card) {
      // Remove any existing badge (in case of re-render)
      var old = card.querySelector('.gp-badge');
      if (old) old.remove();

      var mode = modeFromPath(card.getAttribute('data-path'));
      if (!mode) return;
      var stats = statsMap[mode] || { plays: 0, best_stars: 0, best_accuracy: 0, total_diamonds: 0, difficulties_played: [] };

      // Tier-based border
      TIER_CLASSES.forEach(function (c) { card.classList.remove(c); });
      var tier = getTier(stats);
      if (tier) card.classList.add(tier);

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
