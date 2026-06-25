/**
 * Parent Dashboard - Frontend Logic
 * Handles: login, register, link-by-code, link-by-name, child list, child detail
 */
(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────
  let currentParent = null; // { id, username, display_name }

  // ─── DOM Refs ───────────────────────────────────────────────────
  const authScreen = document.getElementById('auth-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authError = document.getElementById('auth-error');

  // ─── Init ───────────────────────────────────────────────────────
  function init() {
    // Check for saved session
    const saved = localStorage.getItem('hocvui_parent');
    if (saved) {
      currentParent = JSON.parse(saved);
      showDashboard();
    }

    // Auto-fill code from URL params (QR scan flow)
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
      const codeInput = document.getElementById('link-code-input');
      if (codeInput) {
        codeInput.value = codeFromUrl.toUpperCase().slice(0, 6);
      }
    }

    setupAuthListeners();
    setupDashboardListeners();
  }

  // ─── Auth ───────────────────────────────────────────────────────
  function setupAuthListeners() {
    document.getElementById('btn-login').addEventListener('click', handleLogin);
    document.getElementById('login-pin').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });

    document.getElementById('btn-register').addEventListener('click', handleRegister);
    document.getElementById('reg-pin').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleRegister();
    });

    document.getElementById('show-register').addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      hideAuthError();
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
      e.preventDefault();
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      hideAuthError();
    });
  }

  async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const pin = document.getElementById('login-pin').value;

    if (!username || !pin) {
      showAuthError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const res = await fetch('/api/parent?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAuthError(data.error || 'Đăng nhập thất bại');
        return;
      }
      currentParent = data;
      localStorage.setItem('hocvui_parent', JSON.stringify(data));
      showDashboard();
    } catch (err) {
      showAuthError('Lỗi kết nối, vui lòng thử lại');
    }
  }

  async function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const display_name = document.getElementById('reg-display').value.trim();
    const pin = document.getElementById('reg-pin').value;

    if (!username || !pin) {
      showAuthError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (pin.length < 4) {
      showAuthError('Mã PIN cần ít nhất 4 ký tự');
      return;
    }

    try {
      const res = await fetch('/api/parent?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin, display_name: display_name || username }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAuthError(data.error || 'Đăng ký thất bại');
        return;
      }
      // Auto-login after register
      currentParent = { id: data.id, username: data.username, display_name: display_name || username };
      localStorage.setItem('hocvui_parent', JSON.stringify(currentParent));
      showDashboard();
    } catch (err) {
      showAuthError('Lỗi kết nối, vui lòng thử lại');
    }
  }

  function showAuthError(msg) {
    authError.textContent = msg;
    authError.classList.remove('hidden');
  }

  function hideAuthError() {
    authError.textContent = '';
    authError.classList.add('hidden');
  }

  // ─── Dashboard ──────────────────────────────────────────────────
  function showDashboard() {
    authScreen.classList.remove('active');
    dashboardScreen.classList.add('active');
    document.getElementById('parent-greeting').textContent =
      `Xin chào, ${currentParent.display_name || currentParent.username}!`;

    // Show link-by-code section
    const linkCodeSection = document.getElementById('link-by-code-section');
    if (linkCodeSection) linkCodeSection.classList.remove('hidden');

    // Auto-fill code from URL if logged in after QR scan
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
      const codeInput = document.getElementById('link-code-input');
      if (codeInput && !codeInput.value) {
        codeInput.value = codeFromUrl.toUpperCase().slice(0, 6);
      }
    }

    loadChildren();
  }

  function setupDashboardListeners() {
    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
      currentParent = null;
      localStorage.removeItem('hocvui_parent');
      dashboardScreen.classList.remove('active');
      authScreen.classList.add('active');
      hideAuthError();
    });

    // Link by code
    document.getElementById('btn-link-by-code').addEventListener('click', handleLinkByCode);
    document.getElementById('link-code-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLinkByCode();
    });
    // Auto-uppercase code input
    document.getElementById('link-code-input').addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    // Add child by name (existing flow)
    document.getElementById('btn-add-child').addEventListener('click', () => {
      document.getElementById('add-child-form').classList.toggle('hidden');
    });
    document.getElementById('btn-cancel-add').addEventListener('click', () => {
      document.getElementById('add-child-form').classList.add('hidden');
      document.getElementById('child-name-input').value = '';
      document.getElementById('add-child-error').textContent = '';
    });
    document.getElementById('btn-confirm-add').addEventListener('click', handleLinkByName);

    // Back from child detail
    document.getElementById('btn-back-list').addEventListener('click', () => {
      document.getElementById('child-detail').classList.add('hidden');
      document.querySelector('.children-section').style.display = '';
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });
  }

  // ─── Link by Code ──────────────────────────────────────────────
  async function handleLinkByCode() {
    const input = document.getElementById('link-code-input');
    const messageEl = document.getElementById('link-code-message');
    const btn = document.getElementById('btn-link-by-code');
    const code = input.value.trim().toUpperCase();

    // Clear previous message
    messageEl.classList.add('hidden');
    messageEl.className = 'link-code-message hidden';

    if (!code || code.length !== 6) {
      showLinkCodeMessage('Mã liên kết phải gồm 6 ký tự', 'error');
      return;
    }

    if (!currentParent || !currentParent.id) {
      showLinkCodeMessage('Vui lòng đăng nhập trước', 'error');
      return;
    }

    // Disable button during request
    btn.disabled = true;
    btn.textContent = 'Đang liên kết...';

    try {
      const res = await fetch('/api/parent?action=link-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: currentParent.id, link_code: code }),
      });
      const data = await res.json();

      if (!res.ok) {
        showLinkCodeMessage(data.error || 'Liên kết thất bại', 'error');
        return;
      }

      // Success
      const childName = data.player ? data.player.name : '';
      showLinkCodeMessage(`✅ Đã liên kết thành công với ${childName}!`, 'success');
      input.value = '';

      // Clear URL params after successful link
      if (window.history.replaceState) {
        const url = new URL(window.location);
        url.searchParams.delete('code');
        window.history.replaceState({}, '', url);
      }

      // Reload children list
      loadChildren();
    } catch (err) {
      showLinkCodeMessage('Lỗi kết nối, vui lòng thử lại', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Liên kết';
    }
  }

  function showLinkCodeMessage(msg, type) {
    const messageEl = document.getElementById('link-code-message');
    messageEl.textContent = msg;
    messageEl.className = `link-code-message ${type}`;
    messageEl.classList.remove('hidden');
  }

  // ─── Link by Name (existing flow) ──────────────────────────────
  async function handleLinkByName() {
    const nameInput = document.getElementById('child-name-input');
    const errorEl = document.getElementById('add-child-error');
    const name = nameInput.value.trim();

    errorEl.textContent = '';

    if (!name) {
      errorEl.textContent = 'Vui lòng nhập tên con';
      return;
    }

    try {
      const res = await fetch('/api/parent?action=link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: currentParent.id, player_name: name }),
      });
      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || 'Liên kết thất bại';
        return;
      }

      // Success
      nameInput.value = '';
      document.getElementById('add-child-form').classList.add('hidden');
      loadChildren();
    } catch (err) {
      errorEl.textContent = 'Lỗi kết nối, vui lòng thử lại';
    }
  }

  // ─── Load Children ──────────────────────────────────────────────
  async function loadChildren() {
    if (!currentParent) return;

    const listEl = document.getElementById('children-list');
    try {
      const res = await fetch(`/api/parent?action=children&parent_id=${currentParent.id}`);
      const children = await res.json();

      if (!Array.isArray(children) || children.length === 0) {
        listEl.innerHTML = '<p style="color:#999;font-size:0.9rem;text-align:center;padding:20px 0;">Chưa liên kết con nào. Nhập mã liên kết ở trên để bắt đầu!</p>';
        return;
      }

      listEl.innerHTML = children.map(child => `
        <div class="child-card" data-id="${child.id}">
          <div class="child-avatar">${(child.name || '?')[0].toUpperCase()}</div>
          <div class="child-info">
            <div class="child-name">${child.name || 'Chưa đặt tên'}</div>
            <div class="child-meta">⭐ ${child.total_stars || 0} · 🎮 ${child.total_games || 0} lượt · Lớp ${child.grade || '?'}</div>
          </div>
        </div>
      `).join('');

      // Click to view detail
      listEl.querySelectorAll('.child-card').forEach(card => {
        card.addEventListener('click', () => {
          const playerId = card.dataset.id;
          showChildDetail(playerId, children.find(c => String(c.id) === playerId));
        });
      });
    } catch (err) {
      listEl.innerHTML = '<p style="color:#dc2626;font-size:0.9rem;">Không thể tải danh sách</p>';
    }
  }

  // ─── Child Detail ───────────────────────────────────────────────
  async function showChildDetail(playerId, childData) {
    document.querySelector('.children-section').style.display = 'none';
    const detailEl = document.getElementById('child-detail');
    detailEl.classList.remove('hidden');

    document.getElementById('child-detail-name').textContent = `📚 ${childData.name || 'Học sinh'}`;

    // Overview stats
    const overview = document.getElementById('child-overview');
    overview.innerHTML = `
      <div class="stat-box"><div class="stat-value">⭐ ${childData.total_stars || 0}</div><div class="stat-label">Sao</div></div>
      <div class="stat-box"><div class="stat-value">💎 ${childData.total_diamonds || 0}</div><div class="stat-label">Kim cương</div></div>
      <div class="stat-box"><div class="stat-value">🔥 ${childData.current_streak || 0}</div><div class="stat-label">Streak</div></div>
      <div class="stat-box"><div class="stat-value">🎮 ${childData.total_games || 0}</div><div class="stat-label">Lượt chơi</div></div>
    `;

    // Load detailed stats
    try {
      const res = await fetch(`/api/parent?action=child-stats&parent_id=${currentParent.id}&player_id=${playerId}`);
      if (!res.ok) return;
      const stats = await res.json();

      // Performance tab
      const perfTab = document.getElementById('tab-performance');
      if (stats.bySubject && stats.bySubject.length > 0) {
        perfTab.innerHTML = stats.bySubject.map(s => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;">
            <span style="font-weight:700;">${s.subject} (${s.difficulty})</span>
            <span style="color:${s.accuracy >= 70 ? '#16a34a' : '#dc2626'};font-weight:700;">${s.accuracy}% (${s.correct}/${s.total})</span>
          </div>
        `).join('');
      } else {
        perfTab.innerHTML = '<p style="color:#999;padding:12px 0;">Chưa có dữ liệu</p>';
      }

      // Sessions tab
      const sessTab = document.getElementById('tab-sessions');
      if (stats.sessions && stats.sessions.length > 0) {
        sessTab.innerHTML = stats.sessions.map(s => `
          <div style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:0.85rem;">
            <div style="font-weight:700;">${s.subject} - ${s.difficulty}</div>
            <div style="color:#666;">📅 ${s.played_at ? new Date(s.played_at).toLocaleDateString('vi-VN') : '?'} · ✅ ${s.correct_answers}/${s.total_questions} · ⭐ ${s.stars_earned || 0}</div>
          </div>
        `).join('');
      } else {
        sessTab.innerHTML = '<p style="color:#999;padding:12px 0;">Chưa có lịch sử</p>';
      }

      // Exams tab
      const examTab = document.getElementById('tab-exams');
      if (stats.exams && stats.exams.length > 0) {
        examTab.innerHTML = stats.exams.map(e => `
          <div style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:0.85rem;">
            <div style="font-weight:700;">${e.title || e.subject}</div>
            <div style="color:#666;">📅 ${e.taken_at ? new Date(e.taken_at).toLocaleDateString('vi-VN') : '?'} · Điểm: ${e.score} · Hạng: ${e.grade}</div>
          </div>
        `).join('');
      } else {
        examTab.innerHTML = '<p style="color:#999;padding:12px 0;">Chưa thi lần nào</p>';
      }

      // Vouchers tab
      const voucherTab = document.getElementById('tab-vouchers');
      if (stats.vouchers && stats.vouchers.length > 0) {
        voucherTab.innerHTML = stats.vouchers.map(v => `
          <div style="padding:10px 0;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:0.9rem;">${v.item_name}</div>
              <div style="color:#666;font-size:0.8rem;">💎 ${v.price_diamonds} · ${v.requested_at ? new Date(v.requested_at).toLocaleDateString('vi-VN') : ''}</div>
            </div>
            <div>${v.status === 'pending'
              ? `<button class="btn-small btn-accent" onclick="approveVoucher(${v.id}, 'approved')">✅</button>
                 <button class="btn-small" onclick="approveVoucher(${v.id}, 'rejected')" style="background:#dc2626;margin-left:4px;">❌</button>`
              : `<span style="font-size:0.8rem;color:${v.status === 'approved' ? '#16a34a' : '#dc2626'};">${v.status === 'approved' ? '✅ Đã duyệt' : '❌ Từ chối'}</span>`
            }</div>
          </div>
        `).join('');
      } else {
        voucherTab.innerHTML = '<p style="color:#999;padding:12px 0;">Chưa có phiếu đổi thưởng</p>';
      }
    } catch (err) {
      // Silently fail
    }
  }

  // ─── Voucher Approval (global for inline onclick) ───────────────
  window.approveVoucher = async function (voucherId, status) {
    if (!currentParent) return;
    try {
      const res = await fetch('/api/parent?action=approve-voucher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: currentParent.id, voucher_id: voucherId, status }),
      });
      if (res.ok) {
        // Reload current child detail by re-clicking the back button and current card
        const childName = document.getElementById('child-detail-name').textContent;
        // Simple: just reload the page section
        const detail = document.getElementById('child-detail');
        const cards = document.querySelectorAll('.child-card');
        if (cards.length > 0) {
          // Find currently viewed child and refresh
          const activeCard = Array.from(cards).find(c => {
            const name = c.querySelector('.child-name');
            return name && childName.includes(name.textContent);
          });
          if (activeCard) activeCard.click();
        }
      }
    } catch (err) {
      // Silently fail
    }
  };

  // ─── Start ──────────────────────────────────────────────────────
  init();
})();
