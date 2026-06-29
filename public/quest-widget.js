/**
 * Quest Widget - Floating quest panel for game pages
 * Include via <script src="/quest-widget.js"></script>
 * 
 * Features:
 * - Floating collapsible panel (bottom-right)
 * - Shows today's quests with progress bars
 * - Quest completion notification with diamond animation
 * - All-quests-complete celebration
 * - Vietnamese text throughout
 */
(function () {
  'use strict';

  // ─── CSS Injection ───────────────────────────────────────────────
  const WIDGET_CSS = `
    .quest-widget {
      position: fixed;
      bottom: auto;
      top: 50%;
      right: 12px;
      transform: translateY(20px);
      z-index: 9990;
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
    }

    .quest-toggle-btn {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .quest-toggle-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }

    .quest-toggle-btn:active {
      transform: scale(0.95);
    }

    .quest-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 0.7rem;
      font-weight: 800;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
      animation: quest-badge-pulse 2s infinite;
    }

    @keyframes quest-badge-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }

    .quest-badge.hidden {
      display: none;
    }

    .quest-panel {
      position: absolute;
      bottom: 60px;
      right: 0;
      width: 280px;
      max-height: 400px;
      background: white;
      border-radius: 18px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
      overflow: hidden;
      display: none;
      animation: quest-panel-in 0.25s ease-out;
    }

    .quest-panel.open {
      display: block;
    }

    @keyframes quest-panel-in {
      from { opacity: 0; transform: translateY(10px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .quest-panel-header {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .quest-panel-header h3 {
      color: white;
      font-size: 1rem;
      font-weight: 800;
      margin: 0;
      flex: 1;
    }

    .quest-panel-header .quest-close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .quest-panel-body {
      padding: 12px;
      overflow-y: auto;
      max-height: 320px;
    }

    .quest-item {
      background: #f8fafc;
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 8px;
      transition: background 0.2s;
    }

    .quest-item:last-child {
      margin-bottom: 0;
    }

    .quest-item.completed {
      background: #ecfdf5;
    }

    .quest-item-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .quest-item-icon {
      font-size: 1rem;
      flex-shrink: 0;
    }

    .quest-item-desc {
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
      flex: 1;
      line-height: 1.3;
    }

    .quest-item.completed .quest-item-desc {
      color: #059669;
      text-decoration: line-through;
    }

    .quest-item-reward {
      font-size: 0.7rem;
      font-weight: 700;
      color: #6366f1;
      white-space: nowrap;
    }

    .quest-progress-bar {
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .quest-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #a855f7);
      border-radius: 3px;
      transition: width 0.4s ease-out;
    }

    .quest-item.completed .quest-progress-fill {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .quest-progress-text {
      font-size: 0.7rem;
      color: #6b7280;
      font-weight: 600;
      text-align: right;
    }

    .quest-item.completed .quest-progress-text {
      color: #059669;
    }

    .quest-loading {
      text-align: center;
      padding: 30px 10px;
      color: #9ca3af;
      font-size: 0.9rem;
    }

    .quest-loading-emoji {
      font-size: 2rem;
      display: block;
      margin-bottom: 8px;
      animation: quest-bounce 1s infinite alternate;
    }

    @keyframes quest-bounce {
      from { transform: translateY(0); }
      to { transform: translateY(-6px); }
    }

    .quest-error {
      text-align: center;
      padding: 20px 10px;
      color: #ef4444;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Notification toast */
    .quest-notification {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      background: white;
      border-radius: 16px;
      padding: 14px 20px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 10000;
      opacity: 0;
      transition: transform 0.4s ease-out, opacity 0.4s ease-out;
      max-width: 320px;
    }

    .quest-notification.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    .quest-notification-icon {
      font-size: 1.8rem;
      flex-shrink: 0;
    }

    .quest-notification-text {
      font-size: 0.85rem;
      font-weight: 700;
      color: #333;
      line-height: 1.3;
    }

    .quest-notification-diamonds {
      font-size: 1rem;
      font-weight: 800;
      color: #6366f1;
      margin-top: 2px;
    }

    /* Diamond float animation */
    .quest-diamond-float {
      position: fixed;
      pointer-events: none;
      z-index: 10001;
      font-size: 1.5rem;
      animation: quest-diamond-rise 1.5s ease-out forwards;
    }

    @keyframes quest-diamond-rise {
      0% { opacity: 1; transform: translateY(0) scale(1); }
      50% { opacity: 1; transform: translateY(-40px) scale(1.3); }
      100% { opacity: 0; transform: translateY(-80px) scale(0.8); }
    }

    /* Celebration overlay */
    .quest-celebration {
      position: fixed;
      inset: 0;
      z-index: 10002;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .quest-celebration.active {
      opacity: 1;
    }

    .quest-celebration-text {
      font-size: 1.8rem;
      font-weight: 900;
      color: white;
      text-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
      text-align: center;
      animation: quest-celebrate-pop 0.6s ease-out;
    }

    @keyframes quest-celebrate-pop {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }

    .quest-confetti {
      position: fixed;
      inset: 0;
      z-index: 10001;
      pointer-events: none;
      overflow: hidden;
    }

    .quest-confetti-piece {
      position: absolute;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      animation: quest-confetti-fall 2.5s ease-in forwards;
    }

    @keyframes quest-confetti-fall {
      0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
  `;

  function injectCSS() {
    const style = document.createElement('style');
    style.id = 'quest-widget-styles';
    style.textContent = WIDGET_CSS;
    document.head.appendChild(style);
  }

  // ─── Widget State ────────────────────────────────────────────────
  let quests = [];
  let isOpen = false;
  let playerId = null;
  let widgetEl = null;

  // ─── Helpers ─────────────────────────────────────────────────────
  function getPlayerId() {
    try {
      const profile = localStorage.getItem('hocvui_profile');
      if (profile) {
        const data = JSON.parse(profile);
        return data.id || data.player_id || null;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function getQuestIcon(questType) {
    const icons = {
      play_any: '🎮',
      play_mode: '🎯',
      combo_streak: '🔥',
      accuracy: '🎯',
      learn_lesson: '📖',
    };
    return icons[questType] || '⭐';
  }

  // ─── API ─────────────────────────────────────────────────────────
  async function fetchQuests() {
    if (!playerId) return [];
    try {
      const res = await fetch(`/api/players/${playerId}/quests`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.quests || [];
    } catch (e) {
      return [];
    }
  }

  // ─── Rendering ───────────────────────────────────────────────────
  function render() {
    if (!widgetEl) return;

    const incompleteCount = quests.filter(q => !q.is_completed).length;

    // Badge
    const badge = widgetEl.querySelector('.quest-badge');
    if (badge) {
      badge.textContent = incompleteCount;
      badge.classList.toggle('hidden', incompleteCount === 0);
    }

    // Panel body
    const body = widgetEl.querySelector('.quest-panel-body');
    if (!body) return;

    if (quests.length === 0) {
      body.innerHTML = `
        <div class="quest-loading">
          <span class="quest-loading-emoji">📋</span>
          <p>Đang tải nhiệm vụ...</p>
        </div>
      `;
      return;
    }

    body.innerHTML = quests.map(q => {
      const isCompleted = q.is_completed;
      const progress = Math.min(q.current_value, q.target_value);
      const pct = Math.round((progress / q.target_value) * 100);
      const icon = isCompleted ? '✅' : getQuestIcon(q.quest_type);

      return `
        <div class="quest-item ${isCompleted ? 'completed' : ''}">
          <div class="quest-item-header">
            <span class="quest-item-icon">${icon}</span>
            <span class="quest-item-desc">${q.quest_description}</span>
            <span class="quest-item-reward">+${q.diamond_reward}💎</span>
          </div>
          <div class="quest-progress-bar">
            <div class="quest-progress-fill" style="width: ${pct}%"></div>
          </div>
          <div class="quest-progress-text">${progress}/${q.target_value}</div>
        </div>
      `;
    }).join('');
  }

  // ─── Widget Creation ─────────────────────────────────────────────
  function createWidget() {
    widgetEl = document.createElement('div');
    widgetEl.className = 'quest-widget';
    widgetEl.innerHTML = `
      <div class="quest-panel">
        <div class="quest-panel-header">
          <h3>📋 Nhiệm vụ hôm nay</h3>
          <button class="quest-close-btn" title="Đóng">✕</button>
        </div>
        <div class="quest-panel-body">
          <div class="quest-loading">
            <span class="quest-loading-emoji">📋</span>
            <p>Đang tải nhiệm vụ...</p>
          </div>
        </div>
      </div>
      <button class="quest-toggle-btn" title="Nhiệm vụ hằng ngày">
        📋
        <span class="quest-badge hidden">0</span>
      </button>
    `;

    document.body.appendChild(widgetEl);

    // Toggle panel
    const toggleBtn = widgetEl.querySelector('.quest-toggle-btn');
    const panel = widgetEl.querySelector('.quest-panel');
    const closeBtn = widgetEl.querySelector('.quest-close-btn');

    toggleBtn.addEventListener('click', () => {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
    });

    closeBtn.addEventListener('click', () => {
      isOpen = false;
      panel.classList.remove('open');
    });
  }

  // ─── Notifications ───────────────────────────────────────────────
  function showNotification(text, diamonds) {
    const notif = document.createElement('div');
    notif.className = 'quest-notification';
    notif.innerHTML = `
      <span class="quest-notification-icon">🎉</span>
      <div>
        <div class="quest-notification-text">${text}</div>
        <div class="quest-notification-diamonds">+${diamonds} 💎</div>
      </div>
    `;
    document.body.appendChild(notif);

    // Trigger animation
    requestAnimationFrame(() => {
      notif.classList.add('show');
    });

    // Show diamond float animation
    showDiamondFloat();

    // Remove after delay
    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => notif.remove(), 400);
    }, 3000);
  }

  function showDiamondFloat() {
    const diamond = document.createElement('div');
    diamond.className = 'quest-diamond-float';
    diamond.textContent = '💎';
    diamond.style.left = (window.innerWidth / 2 - 12) + 'px';
    diamond.style.top = '80px';
    document.body.appendChild(diamond);
    setTimeout(() => diamond.remove(), 1600);
  }

  function showCelebration() {
    // Confetti
    const confettiEl = document.createElement('div');
    confettiEl.className = 'quest-confetti';
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'quest-confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = '-10px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = (Math.random() * 0.8) + 's';
      piece.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (6 + Math.random() * 8) + 'px';
      confettiEl.appendChild(piece);
    }
    document.body.appendChild(confettiEl);

    // Celebration text
    const celebEl = document.createElement('div');
    celebEl.className = 'quest-celebration active';
    celebEl.innerHTML = `
      <div class="quest-celebration-text">
        🎊 Hoàn thành tất cả!<br>+15 💎 Bonus!
      </div>
    `;
    document.body.appendChild(celebEl);

    // Clean up after animation
    setTimeout(() => {
      confettiEl.remove();
      celebEl.remove();
    }, 3500);
  }

  // ─── Global API ──────────────────────────────────────────────────
  /**
   * Called externally when a quest is completed.
   * @param {Object} questData - { quest_description, diamond_reward, all_complete }
   */
  window.questWidgetNotifyCompletion = function (questData) {
    if (!questData) return;

    const { quest_description, diamond_reward, all_complete } = questData;

    // Show quest completion notification
    if (quest_description && diamond_reward) {
      showNotification(
        `Hoàn thành: ${quest_description}`,
        diamond_reward
      );
    }

    // Show celebration if all quests complete
    if (all_complete) {
      setTimeout(() => showCelebration(), 1000);
    }

    // Refresh quests data
    setTimeout(async () => {
      quests = await fetchQuests();
      render();
    }, 500);
  };

  // ─── Initialization ──────────────────────────────────────────────
  async function init() {
    playerId = getPlayerId();
    if (!playerId) return; // No player logged in, don't show widget

    injectCSS();
    createWidget();

    // Fetch quests
    quests = await fetchQuests();
    render();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
