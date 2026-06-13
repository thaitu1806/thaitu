(function () {
  // State
  let playerId = null;
  let playerDiamonds = 0;
  let playerLevel = 'bronze';
  let currentCategory = 'avatar';
  let allItems = [];
  let pendingPurchaseItem = null;

  // Level labels (Vietnamese)
  const LEVEL_LABELS = {
    bronze: '🥉 Đồng',
    silver: '🥈 Bạc',
    gold: '🥇 Vàng',
    diamond: '💎 Kim Cương',
    master: '👑 Bậc Thầy',
  };

  const LEVEL_ORDER = ['bronze', 'silver', 'gold', 'diamond', 'master'];

  // DOM elements
  const diamondCountEl = document.getElementById('diamond-count');
  const levelLabelEl = document.getElementById('level-label');
  const itemsGridEl = document.getElementById('items-grid');
  const loadingEl = document.getElementById('loading-state');
  const emptyEl = document.getElementById('empty-state');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalIcon = document.getElementById('modal-icon');
  const modalText = document.getElementById('modal-text');
  const modalPrice = document.getElementById('modal-price');
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirm = document.getElementById('modal-confirm');
  const toastEl = document.getElementById('toast');
  const toastTextEl = document.getElementById('toast-text');

  // Init
  function init() {
    const profile = localStorage.getItem('hocvui_profile');
    if (!profile) {
      window.location.href = '/home.html';
      return;
    }
    const parsed = JSON.parse(profile);
    playerId = parsed.id;

    setupTabs();
    setupModal();
    loadPlayerInfo();
    loadItems(currentCategory);
  }

  // Setup category tabs
  function setupTabs() {
    const select = document.getElementById('category-select');
    if (select) {
      select.addEventListener('change', () => {
        currentCategory = select.value;
        loadItems(currentCategory);
      });
    }
  }

  // Setup modal events
  function setupModal() {
    modalCancel.addEventListener('click', closeModal);
    modalConfirm.addEventListener('click', confirmPurchase);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Load player diamond info
  async function loadPlayerInfo() {
    try {
      const res = await fetch(`/api/players/${playerId}/diamonds`);
      const data = await res.json();
      if (data.error) return;

      playerDiamonds = data.total_diamonds || 0;
      const lifetimeDiamonds = data.lifetime_diamonds || 0;
      playerLevel = data.level || calculateLevel(lifetimeDiamonds);

      diamondCountEl.textContent = playerDiamonds;
      levelLabelEl.textContent = LEVEL_LABELS[playerLevel] || LEVEL_LABELS.bronze;
    } catch {
      // Fallback: try to get from players endpoint
      try {
        const res = await fetch(`/api/players?id=${playerId}`);
        const data = await res.json();
        if (data && data.total_diamonds != null) {
          playerDiamonds = data.total_diamonds || 0;
          playerLevel = calculateLevel(data.lifetime_diamonds || 0);
          diamondCountEl.textContent = playerDiamonds;
          levelLabelEl.textContent = LEVEL_LABELS[playerLevel] || LEVEL_LABELS.bronze;
        }
      } catch {
        // Silently fail
      }
    }
  }

  // Calculate level from lifetime diamonds
  function calculateLevel(lifetimeDiamonds) {
    if (lifetimeDiamonds >= 5000) return 'master';
    if (lifetimeDiamonds >= 1500) return 'diamond';
    if (lifetimeDiamonds >= 500) return 'gold';
    if (lifetimeDiamonds >= 100) return 'silver';
    return 'bronze';
  }

  // Load shop items by category
  async function loadItems(category) {
    showLoading();
    try {
      const res = await fetch(`/api/shop/items?category=${category}&player_id=${playerId}`);
      const data = await res.json();
      allItems = data.items || [];
      renderItems(allItems);
    } catch {
      allItems = [];
      renderItems([]);
    }
  }

  // Show loading state
  function showLoading() {
    loadingEl.style.display = '';
    emptyEl.style.display = 'none';
    // Remove existing item cards
    const cards = itemsGridEl.querySelectorAll('.item-card');
    cards.forEach(c => c.remove());
  }

  // Render items in the grid
  function renderItems(items) {
    loadingEl.style.display = 'none';
    // Remove existing item cards
    const cards = itemsGridEl.querySelectorAll('.item-card');
    cards.forEach(c => c.remove());

    if (items.length === 0) {
      emptyEl.style.display = '';
      return;
    }

    emptyEl.style.display = 'none';

    items.forEach(item => {
      const card = createItemCard(item);
      itemsGridEl.appendChild(card);
    });
  }

  // Create an item card element
  function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';

    // "MỚI" tag
    if (item.is_new) {
      const newTag = document.createElement('span');
      newTag.className = 'item-new-tag';
      newTag.textContent = 'MỚI';
      card.appendChild(newTag);
    }

    // Level badge (show if min_level > bronze)
    if (item.min_level && item.min_level !== 'bronze') {
      const levelBadge = document.createElement('span');
      levelBadge.className = `item-level-badge ${item.min_level}`;
      const levelNames = { silver: 'Bạc', gold: 'Vàng', diamond: 'KC', master: 'BT' };
      levelBadge.textContent = levelNames[item.min_level] || item.min_level;
      card.appendChild(levelBadge);
    }

    // Image or emoji
    const imageDiv = document.createElement('div');
    imageDiv.className = 'item-image';
    if (item.image_url && item.image_url.startsWith('http')) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name;
      img.loading = 'lazy';
      imageDiv.appendChild(img);
    } else {
      const emoji = document.createElement('span');
      emoji.className = 'item-emoji';
      emoji.textContent = item.image_url || getCategoryEmoji(item.category);
      imageDiv.appendChild(emoji);
    }
    card.appendChild(imageDiv);

    // Name
    const nameEl = document.createElement('span');
    nameEl.className = 'item-name';
    nameEl.textContent = item.name;
    card.appendChild(nameEl);

    // Price
    const priceEl = document.createElement('span');
    priceEl.className = 'item-price';
    priceEl.textContent = `💎 ${item.price_diamonds}`;
    card.appendChild(priceEl);

    // Buy button
    const buyBtn = document.createElement('button');
    buyBtn.className = 'buy-btn';

    const canAfford = playerDiamonds >= item.price_diamonds;
    const meetsLevel = LEVEL_ORDER.indexOf(playerLevel) >= LEVEL_ORDER.indexOf(item.min_level || 'bronze');

    if (!meetsLevel) {
      buyBtn.className += ' cannot-buy';
      const levelNames = { silver: 'Bạc', gold: 'Vàng', diamond: 'Kim Cương', master: 'Bậc Thầy' };
      buyBtn.textContent = `🔒 Cần ${levelNames[item.min_level] || item.min_level}`;
      buyBtn.disabled = true;
    } else if (!canAfford) {
      buyBtn.className += ' cannot-buy';
      buyBtn.textContent = 'Chưa đủ 💎';
      buyBtn.disabled = true;
    } else {
      buyBtn.className += ' can-buy';
      buyBtn.textContent = 'Mua 🛒';
      buyBtn.addEventListener('click', () => openPurchaseModal(item));
    }

    card.appendChild(buyBtn);
    return card;
  }

  // Get default emoji for category
  function getCategoryEmoji(category) {
    const emojis = {
      avatar: '🧑',
      frame: '🖼️',
      sticker: '⭐',
      powerup: '🧪',
      voucher: '🎁',
    };
    return emojis[category] || '🎀';
  }

  // Open purchase confirmation modal
  function openPurchaseModal(item) {
    pendingPurchaseItem = item;
    modalIcon.textContent = item.image_url && !item.image_url.startsWith('http')
      ? item.image_url
      : getCategoryEmoji(item.category);
    modalText.textContent = `Bạn muốn mua "${item.name}"?`;
    modalPrice.textContent = `💎 ${item.price_diamonds}`;
    modalOverlay.style.display = 'flex';
  }

  // Close modal
  function closeModal() {
    modalOverlay.style.display = 'none';
    pendingPurchaseItem = null;
  }

  // Confirm purchase
  async function confirmPurchase() {
    if (!pendingPurchaseItem) return;

    const item = pendingPurchaseItem;
    modalConfirm.disabled = true;
    modalConfirm.textContent = '⏳...';

    try {
      const res = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, item_id: item.id }),
      });
      const data = await res.json();

      if (data.ok) {
        // Update balance
        playerDiamonds = data.new_balance;
        diamondCountEl.textContent = playerDiamonds;
        closeModal();
        showToast(`🎉 Đã mua "${item.name}" thành công!`);
        // Reload items to update button states
        loadItems(currentCategory);
      } else {
        closeModal();
        showToast(`❌ ${data.error || 'Lỗi khi mua!'}`);
      }
    } catch {
      closeModal();
      showToast('❌ Lỗi kết nối!');
    }

    modalConfirm.disabled = false;
    modalConfirm.textContent = 'Mua nào! 🎉';
  }

  // Show toast notification
  function showToast(message) {
    toastTextEl.textContent = message;
    toastEl.style.display = '';
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.style.display = 'none';
    }, 3000);
  }

  // Start
  init();
})();
