// V34 - Nhạc Sĩ Nhí (Little Musician)
(function() {
'use strict';

const STORAGE_KEY = 'v34_music';
const NOTES_PER_SONG = 8;
const TIMER_SECONDS = 10;

const SONGS = [
  { name: 'Twinkle Star', icon: '⭐' },
  { name: 'Happy Song', icon: '😊' },
  { name: 'River Flow', icon: '🌊' },
  { name: 'Morning Bird', icon: '🐦' },
  { name: 'Dancing Rain', icon: '🌧️' }
];

// Note frequencies for C major scale (C4 to C5)
const NOTE_FREQS = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
const NOTE_EMOJIS = ['🎵', '🎶', '🎵', '🎶', '🎵', '🎶', '🎵', '🎶'];

// Audio context
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playNote(index) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.value = NOTE_FREQS[index % NOTE_FREQS.length];

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) { /* Audio not supported */ }
}

function playDiscordant() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.value = 150 + Math.random() * 100;

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch(e) { /* Audio not supported */ }
}

function playSongComplete() {
  try {
    const ctx = getAudioContext();
    // Play a quick ascending arpeggio
    NOTE_FREQS.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.4);
    });
  } catch(e) {}
}

// State
let state = {
  currentSong: 0,
  combo: 0,
  totalNotes: 0,
  completedSongs: [],
  questions: [],
  questionIndex: 0,
  timer: null,
  timeLeft: TIMER_SECONDS,
  totalCorrect: 0,
  totalAnswered: 0
};

function getPlayerId() {
  try {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    return p.id || null;
  } catch { return null; }
}

function getGrade() {
  try {
    const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    return p.grade || 2;
  } catch { return 2; }
}

function loadSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return { completedSongs: [], totalSongs: 0 };
}

function savePersist(songs) {
  const saved = loadSaved();
  saved.totalSongs = (saved.totalSongs || 0) + songs.length;
  songs.forEach(s => {
    if (!saved.completedSongs.includes(s)) saved.completedSongs.push(s);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

// Screen management
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Init
function init() {
  const saved = loadSaved();
  document.getElementById('songs-count').textContent = saved.completedSongs.length;
  renderSongsGrid(saved.completedSongs);

  document.getElementById('btn-start').onclick = startGame;
  document.getElementById('btn-replay').onclick = startGame;
  document.getElementById('btn-next-song').onclick = nextSong;
}

function renderSongsGrid(completed) {
  const grid = document.getElementById('songs-grid');
  grid.innerHTML = SONGS.map(s => {
    const done = completed.includes(s.name);
    return `<div class="song-badge ${done ? 'completed' : ''}">${s.icon} ${s.name}</div>`;
  }).join('');
}

async function startGame() {
  // Fetch questions
  try {
    const grade = getGrade();
    const subjects = ['math', 'vietnamese', 'english'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=40&grade=${grade}`);
    const data = await res.json();
    if (!data || data.length === 0) {
      alert('Không tải được câu hỏi!');
      return;
    }
    state.questions = data;
  } catch(e) {
    alert('Lỗi kết nối!');
    return;
  }

  state.currentSong = 0;
  state.combo = 0;
  state.totalNotes = 0;
  state.completedSongs = [];
  state.questionIndex = 0;
  state.totalCorrect = 0;
  state.totalAnswered = 0;

  showScreen('play-screen');
  startSong();
}

function startSong() {
  const song = SONGS[state.currentSong];
  state.combo = 0;

  document.getElementById('song-name').textContent = `${song.icon} ${song.name}`;
  document.getElementById('combo-display').textContent = `🔥 0/${NOTES_PER_SONG}`;
  document.getElementById('notes-row').innerHTML = '';

  showQuestion();
}

function showQuestion() {
  if (state.questionIndex >= state.questions.length) {
    state.questionIndex = 0;
  }
  const q = state.questions[state.questionIndex];
  state.questionIndex++;

  document.getElementById('q-text').textContent = q.question_text;
  document.getElementById('q-feedback').textContent = '';

  const optionsEl = document.getElementById('q-options');
  const options = [
    { label: 'A', text: q.option_a },
    { label: 'B', text: q.option_b },
    { label: 'C', text: q.option_c },
    { label: 'D', text: q.option_d }
  ];

  optionsEl.innerHTML = options.map(opt => `
    <div class="q-option" data-answer="${opt.label}">${opt.text}</div>
  `).join('');

  optionsEl.querySelectorAll('.q-option').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn, q));
  });

  startTimer();
}

function startTimer() {
  state.timeLeft = TIMER_SECONDS;
  const fill = document.getElementById('timer-fill');
  fill.style.width = '100%';
  fill.classList.remove('warning');

  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.timeLeft -= 0.1;
    const pct = (state.timeLeft / TIMER_SECONDS) * 100;
    fill.style.width = pct + '%';

    if (state.timeLeft <= 3) fill.classList.add('warning');

    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      handleTimeout();
    }
  }, 100);
}

function handleTimeout() {
  document.getElementById('q-feedback').textContent = '⏰ Hết giờ!';
  document.querySelectorAll('.q-option').forEach(b => b.classList.add('disabled'));
  state.totalAnswered++;
  handleWrongNote();
}

function handleAnswer(btn, question) {
  clearInterval(state.timer);
  const selected = btn.dataset.answer.toLowerCase();
  const correct = question.correct_answer.toLowerCase();

  document.querySelectorAll('.q-option').forEach(b => b.classList.add('disabled'));
  state.totalAnswered++;

  if (selected === correct) {
    btn.classList.add('correct');
    document.getElementById('q-feedback').textContent = '✅ Đúng! +1 nốt nhạc';
    state.totalCorrect++;
    handleCorrectNote();
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('.q-option').forEach(b => {
      if (b.dataset.answer.toLowerCase() === correct) b.classList.add('correct');
    });
    document.getElementById('q-feedback').textContent = '❌ Sai! Lệch nhịp...';
    handleWrongNote();
  }
}

function handleCorrectNote() {
  state.combo++;
  state.totalNotes++;

  // Play the note
  playNote(state.combo - 1);

  // Add note to staff
  addNoteToStaff(state.combo - 1, false);

  // Update combo display
  const comboEl = document.getElementById('combo-display');
  comboEl.textContent = `🔥 ${state.combo}/${NOTES_PER_SONG}`;
  comboEl.classList.add('pulse');
  setTimeout(() => comboEl.classList.remove('pulse'), 300);

  setTimeout(() => {
    if (state.combo >= NOTES_PER_SONG) {
      // Song complete!
      songComplete();
    } else {
      showQuestion();
    }
  }, 800);
}

function handleWrongNote() {
  playDiscordant();

  // Add discordant note visual
  addNoteToStaff(-1, true);

  // Reset combo but keep some notes (lose half)
  const keptNotes = Math.floor(state.combo / 2);
  state.combo = keptNotes;

  // Update display
  document.getElementById('combo-display').textContent = `🔥 ${state.combo}/${NOTES_PER_SONG}`;

  // Rebuild notes display
  setTimeout(() => {
    rebuildNotesDisplay();
    showQuestion();
  }, 1000);
}

function addNoteToStaff(noteIndex, isDiscordant) {
  const row = document.getElementById('notes-row');
  const noteEl = document.createElement('span');
  noteEl.className = 'note-item' + (isDiscordant ? ' discordant' : '');

  if (isDiscordant) {
    noteEl.textContent = '💥';
  } else {
    noteEl.textContent = NOTE_EMOJIS[noteIndex % NOTE_EMOJIS.length];
  }

  row.appendChild(noteEl);
}

function rebuildNotesDisplay() {
  const row = document.getElementById('notes-row');
  row.innerHTML = '';
  for (let i = 0; i < state.combo; i++) {
    const noteEl = document.createElement('span');
    noteEl.className = 'note-item';
    noteEl.textContent = NOTE_EMOJIS[i % NOTE_EMOJIS.length];
    noteEl.style.animationDelay = (i * 0.05) + 's';
    row.appendChild(noteEl);
  }
}

function songComplete() {
  clearInterval(state.timer);
  const song = SONGS[state.currentSong];
  state.completedSongs.push(song.name);

  playSongComplete();

  document.getElementById('song-anim').textContent = song.icon;
  document.getElementById('song-msg').textContent = `🎉 Hoàn thành "${song.name}"!`;
  document.getElementById('song-detail').textContent = `${NOTE_EMOJIS.join(' ')}`;

  showScreen('song-screen');
}

function nextSong() {
  state.currentSong++;

  if (state.currentSong >= SONGS.length) {
    endGame();
    return;
  }

  state.combo = 0;
  showScreen('play-screen');
  startSong();
}

function endGame() {
  clearInterval(state.timer);

  const completed = state.completedSongs.length;
  document.getElementById('result-score').textContent = completed;

  // Show songs list
  const songsEl = document.getElementById('result-songs');
  songsEl.innerHTML = SONGS.map(s => {
    const done = state.completedSongs.includes(s.name);
    return `<div class="song-result ${done ? '' : 'incomplete'}">${s.icon} ${s.name} ${done ? '✅' : '❌'}</div>`;
  }).join('');

  if (completed >= 4) {
    document.getElementById('result-title').textContent = '🏆 Nhạc Sĩ Tài Năng!';
  } else if (completed >= 2) {
    document.getElementById('result-title').textContent = '⭐ Nghệ Sĩ Nhí!';
  } else {
    document.getElementById('result-title').textContent = '💪 Tập luyện thêm nhé!';
  }

  savePersist(state.completedSongs);
  saveSession(completed);

  showScreen('result-screen');

  // checkAndShowPrompt
  if (window.checkAndShowPrompt && getPlayerId()) {
    window.checkAndShowPrompt(getPlayerId());
  }
}

async function saveSession(completed) {
  const playerId = getPlayerId();
  if (!playerId) return;
  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: playerId,
        subject: 'mixed',
        difficulty: 'easy',
        score: completed * 10,
        total_questions: state.totalAnswered,
        correct_answers: state.totalCorrect,
        stars_earned: completed >= 4 ? 3 : completed >= 2 ? 2 : completed >= 1 ? 1 : 0,
        combo_max: NOTES_PER_SONG,
        mode: 'v34'
      })
    });
  } catch(e) { /* non-critical */ }
}

// Start
init();

})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only, additive) =====
// V34's game logic lives in a private IIFE above — none of its functions are
// global. This block wires the animated musician sprite, particles and the
// guide/exit modals purely by observing the DOM, so the embedded logic is
// never modified.
(function () {
  'use strict';

  // Track gameplay intervals so the exit button can stop loops cleanly.
  // (The logic's `state.timer` is private, so we shadow setInterval here.)
  const activeIntervals = new Set();
  const _setInterval = window.setInterval.bind(window);
  const _clearInterval = window.clearInterval.bind(window);
  window.setInterval = function (fn, ms) {
    const id = _setInterval(fn, ms);
    activeIntervals.add(id);
    return id;
  };
  window.clearInterval = function (id) {
    activeIntervals.delete(id);
    return _clearInterval(id);
  };
  function stopAllLoops() {
    activeIntervals.forEach(id => _clearInterval(id));
    activeIntervals.clear();
  }

  const MUSICIANS = ['violinist', 'guitarist', 'pianist', 'singer'];
  let musicianChar = null;
  let birdChar = null;
  let happyTimer = null;

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function mountStage() {
    const C = window.HocVuiCharacters;
    const host = document.getElementById('musician-host');
    const birdHost = document.getElementById('bird-host');
    if (host) {
      host.innerHTML = '';
      musicianChar = null;
      if (C && C.hasSpecies('violinist')) {
        musicianChar = C.createCharacter(pick(MUSICIANS), host, { state: 'idle' });
      } else {
        host.textContent = '🎻';
      }
    }
    if (birdHost) {
      birdHost.innerHTML = '';
      birdChar = null;
      if (C && C.hasSpecies('songbird')) {
        birdChar = C.createCharacter('songbird', birdHost, { state: 'idle' });
      } else {
        birdHost.textContent = '🐦';
      }
    }
  }

  function celebrate() {
    if (musicianChar) musicianChar.setState('happy');
    if (birdChar) birdChar.setState('happy');
    const stage = document.getElementById('musician-stage');
    if (stage) spawnParticles(stage, 'note', 5);
    clearTimeout(happyTimer);
    happyTimer = setTimeout(() => {
      if (musicianChar) musicianChar.setState('idle');
      if (birdChar) birdChar.setState('idle');
    }, 800);
  }

  // Particle helper — floating music notes / sparkles around the stage.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    const NOTES = ['\u266A', '\u266B', '\u2669']; // ♪ ♫ ♩ (legacy-safe glyphs)
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      if (kind === 'note') p.textContent = NOTES[i % NOTES.length];
      p.style.setProperty('--tx', (Math.random() * 90 - 45) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 50 + 30) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.18) + 's');
      p.style.left = (30 + Math.random() * 40) + '%';
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v34_spawnParticles = spawnParticles;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function mountHeroBand() {
    const C = window.HocVuiCharacters;
    const band = document.getElementById('hero-band');
    if (!band) return;
    band.innerHTML = '';
    const cast = ['violinist', 'note-mascot', 'songbird'];
    cast.forEach(id => {
      const slot = document.createElement('div');
      slot.className = 'hero-slot';
      band.appendChild(slot);
      if (C && C.hasSpecies(id)) C.createCharacter(id, slot, { state: 'idle' });
    });
  }

  ready(function () {
    const $ = id => document.getElementById(id);

    mountHeroBand();

    // Mount the musician whenever the play screen becomes active.
    const play = $('play-screen');
    if (play) {
      const obs = new MutationObserver(() => {
        if (play.classList.contains('active')) mountStage();
      });
      obs.observe(play, { attributes: true, attributeFilter: ['class'] });
      if (play.classList.contains('active')) mountStage();
    }

    // Watch the staff for freshly played notes → celebrate on a real note.
    const notesRow = $('notes-row');
    if (notesRow) {
      const noteObs = new MutationObserver(muts => {
        for (const m of muts) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1 && node.classList.contains('note-item') &&
                !node.classList.contains('discordant')) {
              celebrate();
              return;
            }
          }
        }
      });
      noteObs.observe(notesRow, { childList: true });
    }

    // Guide modal -----------------------------------------------------------
    const guide = $('guide-modal');
    const guideBtn = $('btn-guide');
    if (guide && guideBtn) {
      guideBtn.addEventListener('click', () => { guide.style.display = 'flex'; });
      const close = $('btn-guide-close');
      if (close) close.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }

    // Exit modal (styled, no window.confirm) --------------------------------
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const cancel = $('btn-exit-cancel');
      if (cancel) cancel.addEventListener('click', () => { exit.style.display = 'none'; });
      const confirm = $('btn-exit-confirm');
      if (confirm) confirm.addEventListener('click', () => {
        exit.style.display = 'none';
        stopAllLoops();
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
