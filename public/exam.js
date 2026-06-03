// === EXAM PAGE ===
let currentExam = null;
let answers = {}; // { questionId: 'a'|'b'|'c'|'d' }
let currentQ = 0;
let examTimer = null;
let examStartTime = 0;
let timeRemaining = 0;

// Auto-fill name from profile
(async function() {
  const profile = localStorage.getItem('hocvui_profile');
  if (!profile) {
    window.location.href = '/';
    return;
  }
  const p = JSON.parse(profile);
  try {
    const res = await fetch(`/api/players?id=${p.id}`);
    const data = await res.json();
    if (!data || data.error || !data.id) {
      localStorage.removeItem('hocvui_profile');
      window.location.href = '/';
      return;
    }
    localStorage.setItem('hocvui_profile', JSON.stringify({ id: data.id, name: data.name }));
    const el = document.getElementById('exam-player');
    if (el) {
      el.value = data.name;
      el.style.display = 'none';
      document.getElementById('exam-player-label').style.display = 'block';
      document.getElementById('exam-player-label').textContent = `Chào ${data.name}! 📝`;
    }
  } catch {
    // Network error - trust local
    const el = document.getElementById('exam-player');
    if (el) {
      el.value = p.name;
      el.style.display = 'none';
      document.getElementById('exam-player-label').style.display = 'block';
      document.getElementById('exam-player-label').textContent = `Chào ${p.name}! 📝`;
    }
  }
})();

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Tabs
document.querySelectorAll('.etab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.etab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.etab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`etab-${tab.dataset.tab}`).classList.add('active');
    if (tab.dataset.tab === 'history') loadHistory();
  });
});

// Load exams
async function loadExams() {
  try {
    const res = await fetch('/api/exams');
    const exams = await res.json();
    const list = document.getElementById('exam-list');
    if (exams.length === 0) { list.innerHTML = '<p>Chưa có bài thi nào. Bố mẹ tạo trong Admin nhé!</p>'; return; }
    list.innerHTML = exams.map(e => `
      <div class="exam-card" onclick="startExam(${e.id})">
        <div class="exam-card-title">${e.title}</div>
        <div class="exam-card-meta">
          <span>${e.subject === 'math' ? '🔢 Toán' : e.subject === 'vietnamese' ? '📖 TV' : '📚 Mix'}</span>
          <span>${e.difficulty === 'easy' ? '⭐ Dễ' : e.difficulty === 'medium' ? '⭐⭐ TB' : e.difficulty === 'hard' ? '⭐⭐⭐ Khó' : '🎯 Mix'}</span>
          <span>📝 ${e.total_questions} câu</span>
          <span>⏱️ ${e.time_limit_minutes} phút</span>
        </div>
      </div>
    `).join('');
  } catch { document.getElementById('exam-list').innerHTML = '<p>Lỗi tải bài thi</p>'; }
}

async function loadHistory() {
  const name = document.getElementById('exam-player').value.trim();
  const el = document.getElementById('exam-history');
  if (!name) { el.innerHTML = '<p>Nhập tên ở trên để xem lịch sử</p>'; return; }
  try {
    const res = await fetch(`/api/exams?action=history&name=${encodeURIComponent(name)}`);
    const history = await res.json();
    if (history.length === 0) { el.innerHTML = '<p>Chưa có lịch sử thi</p>'; return; }
    el.innerHTML = history.map(h => {
      const gradeClass = h.grade.startsWith('A') ? 'grade-a' : h.grade === 'B' ? 'grade-b' : 'grade-c';
      return `<div class="history-item">
        <div class="hi-left">
          <span class="hi-title">${h.title}</span>
          <span class="hi-date">${new Date(h.taken_at).toLocaleString('vi')} • ${h.correct_answers}/${h.total_questions} đúng • ${formatTime(h.time_spent_seconds)}</span>
        </div>
        <div class="hi-grade ${gradeClass}">${h.grade}</div>
      </div>`;
    }).join('');
  } catch { el.innerHTML = '<p>Lỗi tải lịch sử</p>'; }
}

// Start exam
async function startExam(examId) {
  const name = document.getElementById('exam-player').value.trim();
  if (!name) { alert('Nhập tên con trước nhé!'); document.getElementById('exam-player').focus(); return; }

  try {
    const res = await fetch(`/api/exams?id=${examId}`);
    currentExam = await res.json();
  } catch { alert('Lỗi tải bài thi'); return; }

  if (!currentExam.questions || currentExam.questions.length === 0) { alert('Bài thi chưa có câu hỏi'); return; }

  answers = {};
  currentQ = 0;
  examStartTime = Date.now();
  timeRemaining = currentExam.time_limit_minutes * 60;

  document.getElementById('taking-title').textContent = currentExam.title;
  showScreen('exam-taking');
  renderQuestion();
  startExamTimer();
}

// Render question
function renderQuestion() {
  const q = currentExam.questions[currentQ];
  document.getElementById('tq-number').textContent = `Câu ${currentQ + 1}/${currentExam.questions.length}`;
  document.getElementById('tq-text').textContent = q.question_text;

  const btns = document.querySelectorAll('.to-btn');
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  btns.forEach((btn, i) => {
    btn.textContent = `${'ABCD'[i]}. ${opts[i]}`;
    btn.className = 'to-btn';
    if (answers[q.id] === btn.dataset.opt) btn.classList.add('selected');
  });

  // Progress
  document.getElementById('taking-progress-fill').style.width = `${((currentQ + 1) / currentExam.questions.length) * 100}%`;

  // Nav dots
  renderDots();
}

function renderDots() {
  const dots = document.getElementById('nav-dots');
  dots.innerHTML = currentExam.questions.map((q, i) => {
    const answered = answers[q.id] ? 'answered' : '';
    const current = i === currentQ ? 'current' : '';
    return `<div class="nav-dot ${answered} ${current}" onclick="goToQ(${i})"></div>`;
  }).join('');
}

function goToQ(idx) {
  currentQ = idx;
  renderQuestion();
}

// Answer selection
document.getElementById('taking-options').addEventListener('click', (e) => {
  const btn = e.target.closest('.to-btn');
  if (!btn) return;
  const q = currentExam.questions[currentQ];
  answers[q.id] = btn.dataset.opt;
  document.querySelectorAll('.to-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  renderDots();
});

// Navigation
document.getElementById('btn-prev').addEventListener('click', () => {
  if (currentQ > 0) { currentQ--; renderQuestion(); }
});
document.getElementById('btn-next').addEventListener('click', () => {
  if (currentQ < currentExam.questions.length - 1) { currentQ++; renderQuestion(); }
});

// Timer
function startExamTimer() {
  clearInterval(examTimer);
  updateTimerDisplay();
  examTimer = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    if (timeRemaining <= 0) { clearInterval(examTimer); submitExam(); }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('taking-timer');
  const min = Math.floor(timeRemaining / 60);
  const sec = timeRemaining % 60;
  el.textContent = `⏱️ ${min}:${sec.toString().padStart(2, '0')}`;
  el.className = 'taking-timer';
  if (timeRemaining <= 60) el.classList.add('danger');
  else if (timeRemaining <= 180) el.classList.add('warning');
}

// Submit
document.getElementById('btn-submit-exam').addEventListener('click', () => {
  const answered = Object.keys(answers).length;
  const total = currentExam.questions.length;
  if (answered < total) {
    if (!confirm(`Bạn mới trả lời ${answered}/${total} câu. Nộp bài?`)) return;
  }
  submitExam();
});

async function submitExam() {
  clearInterval(examTimer);
  const name = document.getElementById('exam-player').value.trim();
  const timeSpent = Math.round((Date.now() - examStartTime) / 1000);

  const answerList = currentExam.questions.map(q => ({
    question_id: q.id,
    answer: answers[q.id] || null,
  }));

  try {
    const res = await fetch(`/api/exams?id=${currentExam.id}&action=submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: name, answers: answerList, time_spent_seconds: timeSpent }),
    });
    const result = await res.json();
    showResult(result, timeSpent);
  } catch {
    alert('Lỗi nộp bài!');
  }
}

function showResult(result, timeSpent) {
  const gradeColors = { 'A+': '#4CAF50', 'A': '#66BB6A', 'B': '#FF9800', 'C': '#FF5722', 'D': '#f44336', 'F': '#9E9E9E' };
  document.getElementById('result-grade').textContent = result.grade;
  document.getElementById('result-grade').style.color = gradeColors[result.grade] || '#333';
  document.getElementById('result-score-text').textContent = `${result.score} điểm`;
  document.getElementById('rs-correct').textContent = `${result.correct}/${result.total}`;
  document.getElementById('rs-time').textContent = formatTime(timeSpent);
  document.getElementById('rs-grade2').textContent = result.grade;

  // Review
  const review = document.getElementById('result-review');
  review.innerHTML = '<h3 style="margin-bottom:10px">📋 Chi tiết:</h3>' + result.detail.map((d, i) => {
    const q = currentExam.questions[i];
    const optMap = { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d };
    return `<div class="review-item ${d.is_correct ? 'correct' : 'wrong'}">
      <div class="review-q">${i + 1}. ${q.question_text}</div>
      <div class="review-a">
        ${d.answer ? `Chọn: ${d.answer.toUpperCase()}. ${optMap[d.answer] || ''}` : 'Chưa trả lời'}
        ${!d.is_correct ? ` → Đáp án: ${d.correct_answer.toUpperCase()}. ${optMap[d.correct_answer]}` : ' ✓'}
      </div>
    </div>`;
  }).join('');

  showScreen('exam-result');
}

document.getElementById('btn-back-exams').addEventListener('click', () => {
  showScreen('exam-home');
  loadExams();
});

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Init
loadExams();
