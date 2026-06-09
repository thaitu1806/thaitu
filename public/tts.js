// === TTS (Text-to-Speech) Module ===
// Bilingual: auto-splits Vietnamese/English segments for natural reading

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

  function setSpeakingState(active) {
    const btns = document.querySelectorAll('.btn-speak');
    btns.forEach(b => active ? b.classList.add('speaking') : b.classList.remove('speaking'));
  }

  // Speak one segment, returns Promise
  function speakOne(text, lang) {
    return new Promise((resolve) => {
      if (!text.trim()) { resolve(); return; }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'vi-VN';
      const voice = getBestVoice(lang);
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  // Check if a word/phrase is English (no Vietnamese diacritics, common English pattern)
  function isVietnamese(text) {
    return /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text);
  }

  // Split mixed text into [{text, lang}] segments
  // Handles: "Tired" nghĩa là gì? → [{text:'"Tired"', lang:'en'}, {text:' nghĩa là gì?', lang:'vi'}]
  function splitMixedText(text) {
    const segments = [];
    // Split by quoted English words AND standalone English words in Vietnamese context
    // Pattern: capture quoted strings, or sequences of pure ASCII words surrounded by Vietnamese
    const regex = /("[^"]+"|"[^"]+"|'[^']+'|「[^」]+」)|([a-zA-Z][\w'-]*(?:\s+[a-zA-Z][\w'-]*)*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Text before this match (Vietnamese)
      const before = text.slice(lastIndex, match.index);
      if (before.trim()) {
        segments.push({ text: before, lang: 'vi' });
      }

      // The matched English part
      let eng = match[0];
      // Remove quotes for cleaner pronunciation
      const cleaned = eng.replace(/["""''「」]/g, '').trim();
      if (cleaned) {
        // Only treat as English if it doesn't contain Vietnamese diacritics
        if (!isVietnamese(cleaned)) {
          segments.push({ text: cleaned, lang: 'en' });
        } else {
          segments.push({ text: eng, lang: 'vi' });
        }
      }

      lastIndex = match.index + match[0].length;
    }

    // Remaining text
    const remaining = text.slice(lastIndex);
    if (remaining.trim()) {
      segments.push({ text: remaining, lang: 'vi' });
    }

    return segments;
  }

  // Smart bilingual speak for quiz questions
  window.ttsSpeakQuestion = function(questionText, optA, optB, optC, optD, subject) {
    if (!('speechSynthesis' in window) || !questionText) return;
    window.speechSynthesis.cancel();
    setSpeakingState(true);

    setTimeout(async () => {
      try {
        if (subject === 'english') {
          // Split question into Vietnamese/English segments
          const segments = splitMixedText(questionText);

          // Read question segments with appropriate voices
          for (const seg of segments) {
            await speakOne(seg.text, seg.lang);
          }

          // Pause before options
          await new Promise(r => setTimeout(r, 300));

          // Options are typically English for English subject
          const optText = `A: ${optA}. B: ${optB}. C: ${optC}. D: ${optD}`;
          // Check if options are Vietnamese (e.g., "Mệt mỏi", "Vui vẻ")
          const optLang = isVietnamese(optA) ? 'vi' : 'en';
          await speakOne(optText, optLang);
        } else {
          // Pure Vietnamese - read everything in one go
          const fullText = `${questionText}. A: ${optA}. B: ${optB}. C: ${optC}. D: ${optD}`;
          await speakOne(fullText, 'vi');
        }
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
