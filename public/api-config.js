/**
 * API base configuration for Hoc Vui.
 *
 * - On the web (served from your domain/Vercel), API calls go to the same origin.
 * - Inside Capacitor (Android/iOS native shell) the app is served from
 *   `http://localhost` / `capacitor://localhost`, so `/api/...` would hit the
 *   device itself. We intercept fetch and prepend a configured remote base URL.
 *
 * To change the production API base, edit API_BASE_URL below or build with a
 * different value before `npx cap sync`.
 */
(function () {
  // 👉 Set this to your deployed API base (no trailing slash).
  //    Leave as empty string for plain web builds.
  var API_BASE_URL = 'https://your-app.vercel.app';

  // Detect Capacitor native shell.
  var isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  // Also treat capacitor:// and file:// protocols as native-ish.
  var protocol = window.location && window.location.protocol;
  var nativeProtocol = protocol === 'capacitor:' || protocol === 'file:';

  window.API_BASE_URL = (isNative || nativeProtocol) ? API_BASE_URL : '';

  if (!window.API_BASE_URL) return; // Web build — nothing to patch.

  var originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        input = window.API_BASE_URL + input;
      } else if (input && typeof input === 'object' && typeof input.url === 'string' && input.url.startsWith('/api/')) {
        // Request object — clone with rewritten URL.
        input = new Request(window.API_BASE_URL + input.url, input);
      }
    } catch (e) {
      // If anything goes wrong, fall through to original fetch.
    }
    return originalFetch(input, init);
  };

  // Also patch WebSocket so v4 online duel can reach the remote server when
  // someone runs the native app against a deployed WS endpoint.
  var WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
  var OriginalWebSocket = window.WebSocket;
  if (OriginalWebSocket) {
    window.WebSocket = function (url, protocols) {
      try {
        if (typeof url === 'string' && url.startsWith('/')) {
          url = WS_BASE_URL + url;
        }
      } catch (e) {}
      return protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);
    };
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
  }
})();
