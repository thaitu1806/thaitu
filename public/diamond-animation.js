/**
 * Diamond Animation Overlay
 * Include via <script src="/diamond-animation.js"></script>
 *
 * Displays a floating "+X 💎" animation when diamonds are earned.
 * Self-contained: injects its own CSS, no dependencies.
 *
 * Global API:
 *   window.showDiamondEarned(amount, x, y)
 *     - amount: number of diamonds earned
 *     - x, y: optional coordinates (defaults to center-top of viewport)
 */
(function () {
  'use strict';

  // ─── CSS Injection ───────────────────────────────────────────────
  const DIAMOND_CSS = `
    @keyframes diamond-float-up {
      0% {
        opacity: 1;
        transform: translateY(0) scale(0.5);
      }
      20% {
        opacity: 1;
        transform: translateY(-10px) scale(1.1);
      }
      50% {
        opacity: 1;
        transform: translateY(-40px) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(-80px) scale(0.8);
      }
    }

    .diamond-earned-anim {
      position: fixed;
      z-index: 99999;
      pointer-events: none;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      font-size: 1.6rem;
      font-weight: 900;
      color: #f59e0b;
      text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.2),
        0 0 10px rgba(245, 158, 11, 0.4);
      white-space: nowrap;
      animation: diamond-float-up 1.5s ease-out forwards;
      user-select: none;
    }
  `;

  let cssInjected = false;

  function injectCSS() {
    if (cssInjected) return;
    const style = document.createElement('style');
    style.id = 'diamond-animation-styles';
    style.textContent = DIAMOND_CSS;
    document.head.appendChild(style);
    cssInjected = true;
  }

  // ─── Global API ──────────────────────────────────────────────────

  /**
   * Show a floating "+X 💎" animation.
   * @param {number} amount - Number of diamonds earned
   * @param {number} [x] - X position (px from left). Defaults to center of viewport.
   * @param {number} [y] - Y position (px from top). Defaults to top area of viewport.
   */
  window.showDiamondEarned = function (amount, x, y) {
    if (!amount || amount <= 0) return;

    // Ensure CSS is injected
    injectCSS();

    // Default position: center-top of viewport
    const posX = (typeof x === 'number') ? x : (window.innerWidth / 2);
    const posY = (typeof y === 'number') ? y : 80;

    // Create element
    const el = document.createElement('div');
    el.className = 'diamond-earned-anim';
    el.textContent = '+' + amount + ' 💎';

    // Position (centered on the given coordinates)
    el.style.left = posX + 'px';
    el.style.top = posY + 'px';
    el.style.transform = 'translateX(-50%)';

    document.body.appendChild(el);

    // Self-cleanup after animation completes
    el.addEventListener('animationend', function () {
      el.remove();
    });

    // Fallback removal in case animationend doesn't fire
    setTimeout(function () {
      if (el.parentNode) {
        el.remove();
      }
    }, 1700);
  };
})();
