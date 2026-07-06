/* game-progress.js — Show per-game progress badges on home page cards */
(function () {
  'use strict';

  // Only run on home page
  var path = location.pathname;
  if (path !== '/' && path !== '/home.html' && path !== '/index.html') return;

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '.gp-badge{display:flex;align-items:center;gap:6px;padding:10px 10px 12px;margin-top:8px;border-radius:0 0 18px 18px;background:linear-gradient(180deg,#f8f9fa,#e8eaf6);font-size:0.72rem;line-height:1.2;flex-wrap:wrap;justify-content:center;animation:gpFade .5s ease;width:calc(100% + 20px);margin-left:-10px;margin-bottom:-14px;order:99;border-top:1px solid rgba(0,0,0,0.06);clear:both}',
    '.game-card{flex-wrap:wrap !important}',
    '.gp-stars{display:flex;gap:2px}',
    '.gp-star{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:0.8rem;background:linear-gradient(180deg,#fff,#f5f5f5);border:1.5px solid #e0e0e0;box-shadow:0 2px 0 #d0d0d0}',
    '.gp-star.on{background:linear-gradient(180deg,#fff8e1,#ffecb3);border-color:#ffc107;box-shadow:0 2px 0 #f9a825,0 0 6px rgba(255,193,7,0.3)}',
    '.gp-dots{display:flex;gap:4px}',
    '.gp-dot{width:20px;height:20px;border-radius:50%;background:linear-gradient(180deg,#e0e0e0,#bdbdbd);border:1.5px solid #9e9e9e;box-shadow:inset 0 2px 3px rgba(255,255,255,0.4),0 2px 4px rgba(0,0,0,0.15)}',
    '.gp-dot.on-green{background:linear-gradient(180deg,#a5d6a7,#4caf50);border-color:#2e7d32;box-shadow:inset 0 2px 3px rgba(255,255,255,0.3),0 0 8px rgba(76,175,80,0.4)}',
    '.gp-dot.on-blue{background:linear-gradient(180deg,#90caf9,#1e88e5);border-color:#1565c0;box-shadow:inset 0 2px 3px rgba(255,255,255,0.3),0 0 8px rgba(30,136,229,0.4)}',
    '.gp-dot.on-purple{background:linear-gradient(180deg,#ce93d8,#8e24aa);border-color:#6a1b9a;box-shadow:inset 0 2px 3px rgba(255,255,255,0.3),0 0 8px rgba(142,36,170,0.4)}',
    '.gp-diamonds{display:flex;align-items:center;gap:3px;padding:3px 10px;border-radius:8px;background:linear-gradient(180deg,#e3f2fd,#bbdefb);border:1.5px solid #64b5f6;box-shadow:0 2px 0 #42a5f5;color:#1565c0;font-weight:900;font-size:0.72rem}',
    '.gp-hint{width:100%;margin-top:6px;padding:8px 12px;border-radius:10px;text-align:center;background:linear-gradient(180deg,#ff9800,#f57c00);border:none;border-bottom:3px solid #e65100;color:#fff;font-weight:900;font-size:0.73rem;box-shadow:0 3px 8px rgba(255,152,0,0.3);text-shadow:0 1px 1px rgba(0,0,0,0.2);letter-spacing:0.3px}',
    '.gp-badge .gp-hint.gp-master{background:linear-gradient(180deg,#7c4dff,#651fff);border-bottom-color:#4a148c;box-shadow:0 3px 8px rgba(124,77,255,0.3)}',
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
    var html = '';
    for (var i = 0; i < 3; i++) {
      html += '<span class="gp-star' + (i < s ? ' on' : '') + '">' + (i < s ? '⭐' : '☆') + '</span>';
    }
    return html;
  }

  function renderDots(stats) {
    var played = (stats.plays || 0) > 0;
    var diffs = stats.difficulties_played || [];
    var hasMedium = diffs.indexOf('medium') >= 0;
    var hasHard = diffs.indexOf('hard') >= 0;
    var acc = stats.best_accuracy || 0;
    var mediumMastery = hasMedium && acc >= 80;
    var hardMastery = hasHard && acc >= 80;

    var d1 = played ? 'gp-dot on-green' : 'gp-dot';
    var d2 = mediumMastery ? 'gp-dot on-blue' : 'gp-dot';
    var d3 = hardMastery ? 'gp-dot on-purple' : 'gp-dot';
    return '<span class="' + d1 + '"></span><span class="' + d2 + '"></span><span class="' + d3 + '"></span>';
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
