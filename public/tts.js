// === TTS (Text-to-Speech) Module ===
// Bilingual: text in "quotes" → English voice, rest → Vietnamese voice

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

  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {};
  }

  function setSpeakingState(active) {
    document.querySelectorAll('.btn-speak').forEach(b =>
      active ? b.classList.add('speaking') : b.classList.remove('speaking')
    );
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

  // Split text by quoted segments: "Hello" nghĩa là gì?
  // Returns: [{text:'Hello', lang:'en'}, {text:' nghĩa là gì?', lang:'vi'}]
  function splitByQuotes(text) {
    const segments = [];
    // Match text inside "" or "" or "" (straight + smart quotes)
    const regex = /[""\u201C]([^""\u201D]+)[""\u201D]/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Vietnamese text before the quote
      const before = text.slice(lastIdx, match.index);
      if (before.trim()) segments.push({ text: before, lang: 'vi' });

      // English text inside quotes
      segments.push({ text: match[1], lang: 'en' });
      lastIdx = match.index + match[0].length;
    }

    // Remaining text after last quote
    const remaining = text.slice(lastIdx);
    if (remaining.trim()) segments.push({ text: remaining, lang: 'vi' });

    return segments;
  }

  // Check if text has Vietnamese diacritics
  function hasVietnamese(text) {
    return /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text);
  }

  // Smart bilingual speak for quiz questions
  window.ttsSpeakQuestion = function(questionText, optA, optB, optC, optD, subject) {
    if (!('speechSynthesis' in window) || !questionText) return;

    // Toggle: if already speaking, stop
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeakingState(false);
      return;
    }

    setSpeakingState(true);

    setTimeout(async () => {
      try {
        if (subject === 'english') {
          // Split question by quoted English words
          const segments = splitByQuotes(questionText);

          if (segments.length > 1) {
            // Has mixed content → read each segment with correct voice
            for (const seg of segments) {
              await speakOne(seg.text, seg.lang);
            }
          } else {
            // No quotes → read whole question as Vietnamese
            await speakOne(questionText, 'vi');
          }

          // Pause before options
          await new Promise(r => setTimeout(r, 250));

          // Options: detect language
          const optText = `A: ${optA}. B: ${optB}. C: ${optC}. D: ${optD}`;
          const optLang = hasVietnamese(optA) ? 'vi' : 'en';
          await speakOne(optText, optLang);
        } else {
          // Math/Vietnamese: read everything in Vietnamese
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

  window.ttsStop = function() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingState(false);
  };
})();
