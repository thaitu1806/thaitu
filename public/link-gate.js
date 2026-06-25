/**
 * Link Gate - Mandatory gate overlay for premium features
 * Include via <script src="/link-gate.js"></script>
 *
 * Exports (on window):
 * - showLinkGate(linkCode, playerId, options) — show the full-screen gate overlay
 * - hideLinkGate() — programmatically dismiss the gate
 *
 * Options:
 * - onUnlocked: callback when status becomes 'linked'
 *
 * Requirements: 5.3, 5.4, 8.2, 8.3
 */
(function () {
  'use strict';

  // ─── Minimal QR Code Generator (inline, no dependencies) ────────
  // Generates a simple QR code as an SVG string.
  // Based on a minimal QR encoder for alphanumeric/byte mode.
  // For simplicity, we use a lookup-table approach for version 2 (25x25) QR.
  // This is a stripped-down implementation sufficient for short URLs.

  const QR = (function () {
    // Galois field arithmetic for Reed-Solomon
    const GF256_EXP = new Uint8Array(256);
    const GF256_LOG = new Uint8Array(256);
    (function initGF() {
      let v = 1;
      for (let i = 0; i < 255; i++) {
        GF256_EXP[i] = v;
        GF256_LOG[v] = i;
        v = (v << 1) ^ (v >= 128 ? 0x11d : 0);
      }
      GF256_EXP[255] = GF256_EXP[0];
    })();

    function gfMul(a, b) {
      if (a === 0 || b === 0) return 0;
      return GF256_EXP[(GF256_LOG[a] + GF256_LOG[b]) % 255];
    }

    function rsEncode(data, nsym) {
      const gen = [1];
      for (let i = 0; i < nsym; i++) {
        const newGen = new Array(gen.length + 1).fill(0);
        for (let j = 0; j < gen.length; j++) {
          newGen[j] ^= gen[j];
          newGen[j + 1] ^= gfMul(gen[j], GF256_EXP[i]);
        }
        gen.length = newGen.length;
        for (let j = 0; j < newGen.length; j++) gen[j] = newGen[j];
      }

      const remainder = new Uint8Array(nsym);
      for (let i = 0; i < data.length; i++) {
        const coef = data[i] ^ remainder[0];
        for (let j = 0; j < nsym - 1; j++) {
          remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], coef);
        }
        remainder[nsym - 1] = gfMul(gen[nsym], coef);
      }
      return remainder;
    }

    // Place modules in the QR matrix
    function createMatrix(version) {
      const size = version * 4 + 17;
      const matrix = [];
      const reserved = [];
      for (let i = 0; i < size; i++) {
        matrix.push(new Uint8Array(size));
        reserved.push(new Uint8Array(size));
      }
      return { matrix, reserved, size };
    }

    function addFinderPattern(matrix, reserved, row, col) {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = row + r, cc = col + c;
          if (rr < 0 || cc < 0 || rr >= matrix.length || cc >= matrix.length) continue;
          reserved[rr][cc] = 1;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
              matrix[rr][cc] = 1;
            }
          }
        }
      }
    }

    function addTimingPatterns(matrix, reserved, size) {
      for (let i = 8; i < size - 8; i++) {
        reserved[6][i] = 1;
        reserved[i][6] = 1;
        matrix[6][i] = i % 2 === 0 ? 1 : 0;
        matrix[i][6] = i % 2 === 0 ? 1 : 0;
      }
    }

    function addAlignmentPattern(matrix, reserved, row, col) {
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          reserved[row + r][col + c] = 1;
          if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
            matrix[row + r][col + c] = 1;
          }
        }
      }
    }

    function placeData(matrix, reserved, size, bits) {
      let bitIdx = 0;
      let upward = true;
      for (let col = size - 1; col >= 1; col -= 2) {
        if (col === 6) col = 5; // skip timing column
        const rows = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
        for (const row of rows) {
          for (let c = 0; c < 2; c++) {
            const cc = col - c;
            if (reserved[row][cc]) continue;
            matrix[row][cc] = bitIdx < bits.length ? bits[bitIdx] : 0;
            bitIdx++;
          }
        }
        upward = !upward;
      }
    }

    function applyMask(matrix, reserved, size, maskNum) {
      const maskFn = [
        (r, c) => (r + c) % 2 === 0,
        (r, c) => r % 2 === 0,
        (r, c) => c % 3 === 0,
        (r, c) => (r + c) % 3 === 0,
        (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
        (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
        (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
        (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
      ][maskNum];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!reserved[r][c] && maskFn(r, c)) {
            matrix[r][c] ^= 1;
          }
        }
      }
    }

    function addFormatInfo(matrix, reserved, size, ecLevel, maskNum) {
      // Format info for L level (01) with mask patterns
      const formatBits = [
        0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
        0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0
      ];
      const bits = formatBits[ecLevel * 8 + maskNum];
      // Place format info around finders
      for (let i = 0; i < 15; i++) {
        const bit = (bits >> (14 - i)) & 1;
        // Top-left
        if (i < 6) { matrix[8][i] = bit; reserved[8][i] = 1; }
        else if (i === 6) { matrix[8][7] = bit; reserved[8][7] = 1; }
        else if (i === 7) { matrix[8][8] = bit; reserved[8][8] = 1; }
        else if (i === 8) { matrix[7][8] = bit; reserved[7][8] = 1; }
        else { matrix[14 - i][8] = bit; reserved[14 - i][8] = 1; }
        // Bottom-left and top-right
        if (i < 8) {
          matrix[size - 1 - i][8] = bit;
          reserved[size - 1 - i][8] = 1;
        } else {
          matrix[8][size - 15 + i] = bit;
          reserved[8][size - 15 + i] = 1;
        }
      }
      // Dark module
      matrix[size - 8][8] = 1;
      reserved[size - 8][8] = 1;
    }

    function encodeByteMode(text) {
      const bytes = new TextEncoder().encode(text);
      return bytes;
    }

    // Simple QR generation (Version 1-4, EC Level L, Byte mode)
    function generate(text) {
      const data = encodeByteMode(text);
      const len = data.length;

      // Determine version based on data capacity (EC Level L, Byte mode)
      // V1: 17 bytes, V2: 32 bytes, V3: 53 bytes, V4: 78 bytes
      let version, totalDataCodewords, ecCodewords;
      if (len <= 17) { version = 1; totalDataCodewords = 19; ecCodewords = 7; }
      else if (len <= 32) { version = 2; totalDataCodewords = 34; ecCodewords = 10; }
      else if (len <= 53) { version = 3; totalDataCodewords = 55; ecCodewords = 15; }
      else if (len <= 78) { version = 4; totalDataCodewords = 80; ecCodewords = 20; }
      else { throw new Error('Text too long for QR version 4'); }

      const size = version * 4 + 17;

      // Build data codewords
      const codewords = new Uint8Array(totalDataCodewords);
      let idx = 0;
      // Mode indicator (0100 = byte) + character count
      codewords[idx++] = (0x40 | (len >> 4)) & 0xff;
      codewords[idx++] = ((len & 0x0f) << 4 | (data[0] >> 4)) & 0xff;
      for (let i = 0; i < len - 1; i++) {
        codewords[idx++] = ((data[i] & 0x0f) << 4 | (data[i + 1] >> 4)) & 0xff;
      }
      codewords[idx++] = ((data[len - 1] & 0x0f) << 4) & 0xff;
      // Terminator + padding
      if (idx < totalDataCodewords) codewords[idx++] = 0;
      let padToggle = false;
      while (idx < totalDataCodewords) {
        codewords[idx++] = padToggle ? 0x11 : 0xec;
        padToggle = !padToggle;
      }

      // Reed-Solomon error correction
      const ecBytes = rsEncode(codewords, ecCodewords);

      // Interleave data + EC (single block for V1-4 EC L)
      const allBytes = new Uint8Array(totalDataCodewords + ecCodewords);
      allBytes.set(codewords);
      allBytes.set(ecBytes, totalDataCodewords);

      // Convert to bit array
      const bits = [];
      for (const byte of allBytes) {
        for (let b = 7; b >= 0; b--) {
          bits.push((byte >> b) & 1);
        }
      }

      // Build matrix
      const { matrix, reserved } = createMatrix(version);
      addFinderPattern(matrix, reserved, 0, 0);
      addFinderPattern(matrix, reserved, 0, size - 7);
      addFinderPattern(matrix, reserved, size - 7, 0);
      addTimingPatterns(matrix, reserved, size);

      // Alignment pattern (V2+)
      if (version >= 2) {
        const alignPos = [[], [], [6, 18], [6, 22], [6, 26]][version];
        for (const r of alignPos) {
          for (const c of alignPos) {
            if (reserved[r][c]) continue;
            addAlignmentPattern(matrix, reserved, r, c);
          }
        }
      }

      // Reserve format info area
      addFormatInfo(matrix, reserved, size, 0, 0); // placeholder

      // Place data
      placeData(matrix, reserved, size, bits);

      // Apply mask 0 (simplest) and set format info
      applyMask(matrix, reserved, size, 0);

      // Re-apply format info with correct mask
      addFormatInfo(matrix, reserved, size, 0, 0);

      return { matrix, size };
    }

    function toSVG(qr, cellSize) {
      cellSize = cellSize || 4;
      const margin = cellSize * 2;
      const svgSize = qr.size * cellSize + margin * 2;
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`;
      svg += `<rect width="${svgSize}" height="${svgSize}" fill="white"/>`;
      for (let r = 0; r < qr.size; r++) {
        for (let c = 0; c < qr.size; c++) {
          if (qr.matrix[r][c]) {
            svg += `<rect x="${margin + c * cellSize}" y="${margin + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#2d5a27"/>`;
          }
        }
      }
      svg += '</svg>';
      return svg;
    }

    return { generate, toSVG };
  })();

  // ─── CSS for Link Gate ──────────────────────────────────────────
  const GATE_CSS = `
    .link-gate-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: linkGateFadeIn 0.4s ease-out;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      overflow-y: auto;
    }

    @keyframes linkGateFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .link-gate-container {
      background: white;
      border-radius: 28px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
      animation: linkGatePopIn 0.5s ease-out;
    }

    @keyframes linkGatePopIn {
      from { transform: scale(0.8) translateY(20px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }

    .link-gate-icon {
      font-size: 3.5rem;
      margin-bottom: 12px;
      animation: linkGateBounce 2s infinite alternate;
    }

    @keyframes linkGateBounce {
      from { transform: scale(1) rotate(-3deg); }
      to { transform: scale(1.1) rotate(3deg); }
    }

    .link-gate-title {
      font-size: 1.5rem;
      font-weight: 900;
      color: #4a1d8e;
      margin-bottom: 8px;
      line-height: 1.3;
    }

    .link-gate-subtitle {
      font-size: 1rem;
      color: #666;
      margin-bottom: 20px;
      line-height: 1.4;
    }

    .link-gate-code-section {
      background: linear-gradient(135deg, #f3e8ff, #ede9fe);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .link-gate-code-label {
      font-size: 0.85rem;
      color: #6b21a8;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .link-gate-code {
      font-size: 2.5rem;
      font-weight: 900;
      letter-spacing: 6px;
      color: #4a1d8e;
      font-family: 'Courier New', monospace;
      user-select: all;
      margin-bottom: 10px;
    }

    .link-gate-copy-btn {
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 10px 20px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .link-gate-copy-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(109, 40, 217, 0.4);
    }

    .link-gate-copy-btn:active {
      transform: scale(0.95);
    }

    .link-gate-copy-btn.copied {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .link-gate-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 20px 0;
      color: #9ca3af;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .link-gate-divider::before,
    .link-gate-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }

    .link-gate-qr-section {
      margin-bottom: 20px;
    }

    .link-gate-qr-label {
      font-size: 0.85rem;
      color: #6b21a8;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .link-gate-qr {
      display: inline-block;
      background: white;
      padding: 8px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .link-gate-qr svg {
      display: block;
      width: 140px;
      height: 140px;
    }

    .link-gate-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #9ca3af;
      margin-top: 16px;
    }

    .link-gate-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid #e5e7eb;
      border-top-color: #8b5cf6;
      border-radius: 50%;
      animation: linkGateSpin 0.8s linear infinite;
    }

    @keyframes linkGateSpin {
      to { transform: rotate(360deg); }
    }

    .link-gate-unlocked {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(16, 185, 129, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: linkGateFadeIn 0.3s ease-out;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
    }

    .link-gate-unlocked-icon {
      font-size: 5rem;
      animation: linkGateUnlockPop 0.6s ease-out;
    }

    @keyframes linkGateUnlockPop {
      0% { transform: scale(0); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }

    .link-gate-unlocked-text {
      color: white;
      font-size: 1.8rem;
      font-weight: 900;
      margin-top: 16px;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  `;

  // ─── State ──────────────────────────────────────────────────────
  let overlayEl = null;
  let pollingInterval = null;
  let onUnlockedCallback = null;
  let styleInjected = false;

  // ─── Helpers ────────────────────────────────────────────────────
  function injectStyles() {
    if (styleInjected) return;
    const style = document.createElement('style');
    style.id = 'link-gate-styles';
    style.textContent = GATE_CSS;
    document.head.appendChild(style);
    styleInjected = true;
  }

  function copyToClipboard(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '✅ Đã sao chép!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '📋 Sao chép mã';
          btn.classList.remove('copied');
        }, 2000);
      });
    } else {
      // Fallback
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      btn.textContent = '✅ Đã sao chép!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋 Sao chép mã';
        btn.classList.remove('copied');
      }, 2000);
    }
  }

  // ─── Polling ────────────────────────────────────────────────────
  function startPolling(playerId) {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/players/${playerId}/link-status`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'linked') {
          stopPolling();
          showUnlockedAnimation();
        }
      } catch (e) {
        // Silently retry on next interval
      }
    }, 5000);
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  function showUnlockedAnimation() {
    // Show success overlay
    const unlocked = document.createElement('div');
    unlocked.className = 'link-gate-unlocked';
    unlocked.innerHTML = `
      <div class="link-gate-unlocked-icon">🎉</div>
      <div class="link-gate-unlocked-text">Đã mở khóa!</div>
    `;
    document.body.appendChild(unlocked);

    // Auto dismiss after 2 seconds
    setTimeout(() => {
      unlocked.remove();
      hideLinkGate();
      if (onUnlockedCallback) {
        onUnlockedCallback();
      }
    }, 2000);
  }

  // ─── Public API ─────────────────────────────────────────────────

  /**
   * Show the link gate overlay.
   * @param {string} linkCode - The player's 6-character link code
   * @param {string|number} playerId - The player's ID for polling
   * @param {Object} [options] - Options
   * @param {Function} [options.onUnlocked] - Callback when link status becomes 'linked'
   */
  function showLinkGate(linkCode, playerId, options) {
    options = options || {};
    onUnlockedCallback = options.onUnlocked || null;

    // Remove existing overlay if any
    hideLinkGate();
    injectStyles();

    // Generate QR code
    const origin = window.location ? window.location.origin : '';
    const qrUrl = `${origin}/parent.html?code=${linkCode}`;
    let qrSVG = '';
    try {
      const qr = QR.generate(qrUrl);
      qrSVG = QR.toSVG(qr, 4);
    } catch (e) {
      // If QR generation fails, show URL text instead
      qrSVG = `<div style="font-size:0.75rem;color:#666;padding:10px;">Mở: ${qrUrl}</div>`;
    }

    // Create overlay
    overlayEl = document.createElement('div');
    overlayEl.className = 'link-gate-overlay';
    overlayEl.id = 'link-gate-overlay';
    overlayEl.innerHTML = `
      <div class="link-gate-container">
        <div class="link-gate-icon">🔒👨‍👩‍👧</div>
        <div class="link-gate-title">Cần liên kết ba mẹ!</div>
        <div class="link-gate-subtitle">Đưa mã này cho ba mẹ để liên kết nhé! 🌟</div>

        <div class="link-gate-code-section">
          <div class="link-gate-code-label">Mã liên kết của con</div>
          <div class="link-gate-code">${linkCode}</div>
          <button class="link-gate-copy-btn" id="link-gate-copy-btn">📋 Sao chép mã</button>
        </div>

        <div class="link-gate-divider">Hoặc quét QR code này</div>

        <div class="link-gate-qr-section">
          <div class="link-gate-qr">${qrSVG}</div>
        </div>

        <div class="link-gate-status">
          <div class="link-gate-spinner"></div>
          <span>Đang chờ ba mẹ liên kết...</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);

    // Copy button handler
    const copyBtn = overlayEl.querySelector('#link-gate-copy-btn');
    copyBtn.addEventListener('click', () => copyToClipboard(linkCode, copyBtn));

    // Start polling for link status
    startPolling(playerId);
  }

  /**
   * Programmatically hide/dismiss the link gate overlay.
   */
  function hideLinkGate() {
    stopPolling();
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
    // Also remove any unlocked overlay
    const unlocked = document.querySelector('.link-gate-unlocked');
    if (unlocked) unlocked.remove();
  }

  // ─── Expose on window ───────────────────────────────────────────
  window.showLinkGate = showLinkGate;
  window.hideLinkGate = hideLinkGate;

})();

// ─── Post-Session Prompt System ─────────────────────────────────
// Separate IIFE for the soft prompt (not a mandatory gate)
(function () {
  'use strict';

  const PROMPT_CSS = `
    .link-prompt-overlay {
      position: fixed;
      inset: 0;
      z-index: 99990;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: linkPromptFadeIn 0.3s ease-out;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      backdrop-filter: blur(2px);
    }

    @keyframes linkPromptFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .link-prompt-box {
      background: white;
      border-radius: 24px;
      padding: 28px 24px;
      text-align: center;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
      max-width: 340px;
      width: 88%;
      animation: linkPromptPopIn 0.4s ease-out;
    }

    @keyframes linkPromptPopIn {
      from { transform: scale(0.85) translateY(16px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }

    .link-prompt-icon {
      font-size: 2.8rem;
      margin-bottom: 10px;
    }

    .link-prompt-text {
      font-size: 1.1rem;
      font-weight: 700;
      color: #4a1d8e;
      margin-bottom: 18px;
      line-height: 1.4;
    }

    .link-prompt-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .link-prompt-btn-link {
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      color: white;
      border: none;
      border-radius: 14px;
      padding: 12px 20px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .link-prompt-btn-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(109, 40, 217, 0.4);
    }

    .link-prompt-btn-link:active {
      transform: scale(0.96);
    }

    .link-prompt-btn-dismiss {
      background: transparent;
      color: #9ca3af;
      border: none;
      border-radius: 14px;
      padding: 10px 20px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s;
    }

    .link-prompt-btn-dismiss:hover {
      color: #6b7280;
    }
  `;

  let promptStyleInjected = false;

  function injectPromptStyles() {
    if (promptStyleInjected) return;
    const style = document.createElement('style');
    style.id = 'link-prompt-styles';
    style.textContent = PROMPT_CSS;
    document.head.appendChild(style);
    promptStyleInjected = true;
  }

  /**
   * Show a soft prompt modal to encourage parent linking.
   * @param {string} message - The prompt message text
   * @param {string} linkCode - The player's link code
   * @param {string|number} playerId - The player's ID
   */
  function showSoftPrompt(message, linkCode, playerId) {
    injectPromptStyles();

    // Remove existing prompt if any
    const existing = document.querySelector('.link-prompt-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'link-prompt-overlay';
    overlay.innerHTML = `
      <div class="link-prompt-box">
        <div class="link-prompt-icon">👨‍👩‍👧‍👦🌟</div>
        <div class="link-prompt-text">${message}</div>
        <div class="link-prompt-buttons">
          <button class="link-prompt-btn-link">🔗 Liên kết ngay</button>
          <button class="link-prompt-btn-dismiss">Để sau</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // "Liên kết ngay" → show the full link gate with code + QR
    overlay.querySelector('.link-prompt-btn-link').addEventListener('click', () => {
      overlay.remove();
      if (window.showLinkGate) {
        window.showLinkGate(linkCode, playerId);
      }
    });

    // "Để sau" → dismiss and call POST to update status
    overlay.querySelector('.link-prompt-btn-dismiss').addEventListener('click', async () => {
      overlay.remove();
      try {
        await fetch(`/api/players/${playerId}/link-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'dismiss' }),
        });
      } catch (e) {
        // Non-critical, silently fail
      }
    });
  }

  /**
   * Check link status and show appropriate prompt after a game session ends.
   * Call this after session save completes.
   * @param {string|number} playerId - The player's ID
   */
  async function checkAndShowPrompt(playerId) {
    if (!playerId) return;

    try {
      const res = await fetch(`/api/players/${playerId}/link-status`);
      if (!res.ok) return;
      const data = await res.json();

      // Already linked — no prompt needed
      if (data.status === 'linked') return;

      // Check once-per-day constraint
      const today = new Date().toISOString().split('T')[0];
      if (data.last_prompt_date === today) return;

      // Soft prompt: unlinked + session_count >= 1
      if (data.status === 'unlinked' && data.session_count >= 1) {
        showSoftPrompt('Muốn ba mẹ xem thành tích không? 🌟', data.code, playerId);
        return;
      }

      // Milestone prompts: prompted + (session_count >= 5 OR streak >= 3)
      if (data.status === 'prompted') {
        if (data.session_count >= 5) {
          showSoftPrompt('Ba mẹ sẽ tự hào lắm đó! Liên kết ngay nhé 🏆', data.code, playerId);
        } else if (data.current_streak >= 3) {
          showSoftPrompt('Con giỏi quá! Cho ba mẹ biết nhé 🔥', data.code, playerId);
        }
      }
    } catch (e) {
      // Network error — silently skip prompt
    }
  }

  // ─── Expose on window ───────────────────────────────────────────
  window.checkAndShowPrompt = checkAndShowPrompt;

})();
