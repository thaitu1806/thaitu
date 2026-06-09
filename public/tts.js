// === TTS (Text-to-Speech) Module ===
// Supports bilingual: Vietnamese question + English options
// Call: window.ttsSpeak(text, lang) for single language
// Call: window.ttsSpeakQuestion(question, options, subject) for smart bilingual

(function() {
  'use strict';

  function getBestVoice(lang) {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if (lang === 'vi') {
      let v = voices.find(v => v.lang === 'vi-VN');
      if (!v) v = voices.find(v => v.lang.startsWith('vi'));
      if (!v) v = voices.find(v => v.name.toLowerCase().includes('vietnam'));
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

  // Detect if text is mainly English (Latin chars with English words)
  function isEnglishText(text) {
    if (!text) return false;
    // Count English-only characters vs Vietnamese/special
    const englishChars = text.match(/[a-zA-Z0-9\s.,!?'"()-]/g) || [];
    const ratio = englishChars.length / text.length;
    // If >85% basic Latin → likely English content
    return ratio > 0.85;
  }

  // Detect language of each text segment
  function detectLang(text) {
    if (!text) return 'vi';
    // Vietnamese diacritics
    if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text)) {
      return 'vi';
    }
    return isEnglishText(text) ? 'en' : 'vi';
  }

  function setSpeakingState(active) {
    const btns = document.querySelectorAll('.btn-speak');
    btns.forEach(b => active ? b.classList.add('speaking') : b.classList.remove('speaking'));
  }

  // Speak a single utterance (returns Promise)
  function speakOne(text, lang) {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'vi-VN';
      const voice = getBestVoice(lang);
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
      utterance.rate = lang === 'en' ? 0.85 : 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  // Smart bilingual speak for quiz questions
  // Reads question in detected language, then options in their detected language
  window.ttsSpeakQuestion = function(questionText, optA, optB, optC, optD, subject) {
    if (!('speechSynthesis' in window) || !questionText) return;
    window.speechSynthesis.cancel();
    setSpeakingState(true);

    setTimeout(async () => {
      try {
        // Detect question language
        const qLang = detectLang(questionText);
        // Detect options language (check first option as representative)
        const optLang = detectLang(optA);

        // For English subject: question is often Vietnamese, options are English
        // For others: both Vietnamese
        const effectiveQlang = subject === 'english' ? (qLang === 'en' ? 'en' : 'vi') : 'vi';
        const effectiveOptLang = subject === 'english' ? (optLang === 'en' ? 'en' : detectLang(optA)) : 'vi';

        // Read question
        await speakOne(questionText, effectiveQlang);

        // Small pause between question and options
        await new Promise(r => setTimeout(r, 300));

        // Read options - if language differs from question, switch voice
        const optionsText = `A: ${optA}. B: ${optB}. C: ${optC}. D: ${optD}`;
        await speakOne(optionsText, effectiveOptLang);

      } catch(e) {}
      setSpeakingState(false);
    }, 100);
  };

  // Simple single-language speak (backward compatible)
  window.ttsSpeak = function(text, lang) {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    setSpeakingState(true);

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'vi-VN';
      const voice = getBestVoice(lang || 'vi');
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = () => setSpeakingState(false);
      utterance.onerror = () => setSpeakingState(false);
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  // Stop speech
  window.ttsStop = function() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingState(false);
  };
})();
