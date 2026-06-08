// === TTS (Text-to-Speech) Module ===
// Include this script + add a button with class "btn-speak" near questions
// Call: window.ttsSpeak(text, lang) from any game version

(function() {
  'use strict';

  // Detect best voice
  function getBestVoice(lang) {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if (lang === 'vi') {
      let v = voices.find(v => v.lang === 'vi-VN');
      if (!v) v = voices.find(v => v.lang.startsWith('vi'));
      if (!v) v = voices.find(v => v.name.toLowerCase().includes('vietnam'));
      // Fallback: Indonesian voice reads Latin text somewhat OK
      if (!v) v = voices.find(v => v.lang.startsWith('id'));
      return v || null;
    } else {
      let v = voices.find(v => /google.*english/i.test(v.name));
      if (!v) v = voices.find(v => v.lang.startsWith('en'));
      return v || null;
    }
  }

  // Pre-load voices
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {};
  }

  // Main speak function - exposed globally
  window.ttsSpeak = function(text, lang) {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'vi-VN';

      const voice = getBestVoice(lang || 'vi');
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Animate any active speak button
      const btns = document.querySelectorAll('.btn-speak');
      btns.forEach(b => b.classList.add('speaking'));
      utterance.onend = () => btns.forEach(b => b.classList.remove('speaking'));
      utterance.onerror = () => btns.forEach(b => b.classList.remove('speaking'));

      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  // Stop speech
  window.ttsStop = function() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    document.querySelectorAll('.btn-speak').forEach(b => b.classList.remove('speaking'));
  };
})();
