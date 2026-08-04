// === Interactive "So Sánh Số" (>, <, =) Lesson for Grade 1 ===
// Hooks into openTopic('compare1'). 4-step: Croc Demo → Towers → Practice (3 types) → Reward
(function () {
  'use strict';
  const S = () => window.HocVuiSprite;
  const N = () => window.HocVuiNumbers;
  const NUM_W = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín','mười'];
  function speak(t){if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='vi-VN';u.rate=0.85;u.pitch=1.1;const v=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('vi'));if(v)u.voice=v;window.speechSynthesis.speak(u);}
  function speakerBtn(t){return `<button class="lc-speak-btn" onclick="window._lessonCmp1.speak('${t.replace(/'/g,"\\'")}')">`+'<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';}
  function numHtml(n,sz){return N()?N().html(n,sz||36):`<span style="font-weight:900;font-size:${sz||36}px;">${n}</span>`;}
  let state={step:0,score:0,total:0,round:0};
  function $(id){return document.getElementById(id);}
  function rand(a){return a[Math.floor(Math.random()*a.length)];}
  function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
  function playSound(t){if(window.HocVuiSound)window.HocVuiSound.play(t);}
  function shuffle(a){return[...a].sort(()=>Math.random()-0.5);}
  const PRAISE=['Giỏi lắm!','Tuyệt vời!','Đúng rồi!','Hay quá!'];
  const ENCOURAGE=['Thử lại nhé!','Nhìn kỹ nào!','Cố lên!'];
  function getScreen(){return $('compare1-interactive-screen');}
  function show(){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));getScreen().classList.add('active');}
  function updateProgress(){const b=getScreen().querySelector('.lcm1-progress-bar');if(b)b.style.width=((state.step+1)/4*100)+'%';}
  // Crocodile SVG facing left (mouth opens to left = left is bigger)
  function crocSvg(dir){
    if(dir==='left')return `<svg width="60" height="40" viewBox="0 0 60 40"><polygon points="0,20 60,2 60,38" fill="#4caf50" stroke="#2e7d32" stroke-width="2"/><circle cx="50" cy="12" r="3" fill="#333"/></svg>`;
    if(dir==='right')return `<svg width="60" height="40" viewBox="0 0 60 40"><polygon points="60,20 0,2 0,38" fill="#4caf50" stroke="#2e7d32" stroke-width="2"/><circle cx="10" cy="12" r="3" fill="#333"/></svg>`;
    return `<svg width="60" height="20" viewBox="0 0 60 20"><line x1="5" y1="7" x2="55" y2="7" stroke="#e65100" stroke-width="4" stroke-linecap="round"/><line x1="5" y1="13" x2="55" y2="13" stroke="#e65100" stroke-width="4" stroke-linecap="round"/></svg>`;
  }
  function signFor(a,b){return a>b?'>':a<b?'<':'=';}
  function signName(s){return s==='>'?'lớn hơn':s==='<'?'nhỏ hơn':'bằng';}

  // STEP 0: Crocodile Demo — show how the croc mouth works
  function renderDemo(){
    state.step=0;
    const a=randInt(4,8),b=randInt(1,a-1);
    const sign=signFor(a,b);
    const crocDir=a>b?'left':'right';
    const item=S().randomKidFriendlyData();
    const leftDots=Array.from({length:a},()=>S().html(item.s,item.r,item.c,28)).join(' ');
    const rightDots=Array.from({length:b},()=>S().html(item.s,item.r,item.c,28)).join(' ');
    getScreen().querySelector('.lcm1-body').innerHTML=`
      <div class="lcm1-demo-section">
        <p class="lcm1-title">Cá Sấu Tham Ăn! ${speakerBtn('Cá sấu há miệng về phía nhiều hơn')}</p>
        <p class="lcm1-hint">Cá sấu luôn quay miệng về phía NHIỀU hơn!</p>
        <div class="lcm1-compare-row">
          <div class="lcm1-side">${leftDots}<div class="lcm1-num">${numHtml(a,48)}</div></div>
          <div class="lcm1-croc" id="lcm1-croc">${crocSvg(crocDir)}</div>
          <div class="lcm1-side">${rightDots}<div class="lcm1-num">${numHtml(b,48)}</div></div>
        </div>
        <div class="lcm1-equation">${numHtml(a,40)} <span class="lcm1-sign">${sign}</span> ${numHtml(b,40)}</div>
        <p class="lcm1-desc">${a} <strong>${signName(sign)}</strong> ${b} ${speakerBtn(NUM_W[a]+' '+signName(sign)+' '+NUM_W[b])}</p>
        <button class="lc-btn lc-btn-primary" onclick="window._lessonCmp1.renderEqual()" style="margin-top:12px;">Xem dấu =</button>
      </div>`;
    updateProgress();
  }
  function renderEqual(){
    const n=randInt(3,7);
    const item=S().randomKidFriendlyData();
    const dots=Array.from({length:n},()=>S().html(item.s,item.r,item.c,28)).join(' ');
    getScreen().querySelector('.lcm1-body').innerHTML=`
      <div class="lcm1-demo-section">
        <p class="lcm1-title">Khi hai bên bằng nhau? ${speakerBtn('Khi hai bên bằng nhau cá sấu khép miệng')}</p>
        <p class="lcm1-hint">Hai bên giống hệt nhau — cá sấu khép miệng!</p>
        <div class="lcm1-compare-row">
          <div class="lcm1-side">${dots}<div class="lcm1-num">${numHtml(n,48)}</div></div>
          <div class="lcm1-croc">${crocSvg('equal')}</div>
          <div class="lcm1-side">${dots}<div class="lcm1-num">${numHtml(n,48)}</div></div>
        </div>
        <div class="lcm1-equation">${numHtml(n,40)} <span class="lcm1-sign">=</span> ${numHtml(n,40)}</div>
        <p class="lcm1-desc">${n} <strong>bằng</strong> ${n}</p>
        <button class="lc-btn lc-btn-primary" onclick="window._lessonCmp1.startPractice()" style="margin-top:12px;">Luyện tập!</button>
      </div>`;
    updateProgress();
  }

  // STEP 2: Practice — 3 types
  function startPractice(){state.step=2;state.round=0;state.score=0;state.total=0;nextPractice();}
  function nextPractice(){
    if(state.round>=6){showReward();return;}state.round++;
    if(state.round<=2) renderType1();
    else if(state.round<=4) renderType2();
    else renderType3();
  }
  // Dạng 1: Chọn dấu đúng (>, <, =) giữa 2 số
  function renderType1(){
    const a=randInt(1,10),b=randInt(1,10);
    const correct=signFor(a,b);
    getScreen().querySelector('.lcm1-body').innerHTML=`
      <div class="lcm1-practice-section">
        <div class="lcm1-header-row"><span class="lcm1-round-badge">Câu ${state.round}/6</span><span class="lcm1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="lcm1-question">Điền dấu! ${speakerBtn(NUM_W[a]+' so với '+NUM_W[b])}</p>
        <div class="lcm1-equation-big">${numHtml(a,56)} <span class="lcm1-sign-slot">?</span> ${numHtml(b,56)}</div>
        <div class="lcm1-sign-options" id="lcm1-opts">
          <button class="lcm1-sign-btn" onclick="window._lessonCmp1.answerSign('>','${correct}')"><span class="lcm1-sign-text">&gt;</span></button>
          <button class="lcm1-sign-btn" onclick="window._lessonCmp1.answerSign('<','${correct}')"><span class="lcm1-sign-text">&lt;</span></button>
          <button class="lcm1-sign-btn" onclick="window._lessonCmp1.answerSign('=','${correct}')"><span class="lcm1-sign-text">=</span></button>
        </div>
        <div class="lcm1-feedback" id="lcm1-fb"></div>
      </div>`;
    updateProgress();
  }
  function answerSign(picked,correct){
    state.total++;const btns=getScreen().querySelectorAll('.lcm1-sign-btn');
    btns.forEach(b=>{b.style.pointerEvents='none';if(b.textContent.trim()===correct)b.classList.add('lcm1-btn-correct');});
    const fb=$('lcm1-fb');
    if(picked===correct){
      state.score++;playSound('correct');
      if(fb)fb.innerHTML=`<div class="lcm1-fb-ok">${rand(PRAISE)}</div>`;
    }else{
      playSound('wrong');btns.forEach(b=>{if(b.textContent.trim()===picked)b.classList.add('lcm1-btn-wrong');});
      if(fb)fb.innerHTML=`<div class="lcm1-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${correct}</div>`;
    }
    setTimeout(()=>nextPractice(),1400);
  }
  // Dạng 2: So sánh biểu thức với số (3+2 vs 6)
  function renderType2(){
    const a1=randInt(1,5),a2=randInt(1,5),sumA=a1+a2;
    const b=randInt(1,10);
    const correct=signFor(sumA,b);
    getScreen().querySelector('.lcm1-body').innerHTML=`
      <div class="lcm1-practice-section">
        <div class="lcm1-header-row"><span class="lcm1-round-badge">Câu ${state.round}/6</span><span class="lcm1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="lcm1-question">So sánh! ${speakerBtn(NUM_W[a1]+' cộng '+NUM_W[a2]+' so với '+NUM_W[b])}</p>
        <div class="lcm1-equation-big">${numHtml(a1,40)}+${numHtml(a2,40)} <span class="lcm1-sign-slot">?</span> ${numHtml(b,56)}</div>
        <p class="lcm1-hint">${a1}+${a2}=${sumA}, so sánh ${sumA} với ${b}</p>
        <div class="lcm1-sign-options" id="lcm1-opts">
          <button class="lcm1-sign-btn" onclick="window._lessonCmp1.answerSign('>','${correct}')"><span class="lcm1-sign-text">&gt;</span></button>
          <button class="lcm1-sign-btn" onclick="window._lessonCmp1.answerSign('<','${correct}')"><span class="lcm1-sign-text">&lt;</span></button>
          <button class="lcm1-sign-btn" onclick="window._lessonCmp1.answerSign('=','${correct}')"><span class="lcm1-sign-text">=</span></button>
        </div>
        <div class="lcm1-feedback" id="lcm1-fb"></div>
      </div>`;
    updateProgress();
  }
  // Dạng 3: Điền số thiếu (4 < ? < 6)
  function renderType3(){
    const lo=randInt(2,7),hi=lo+2,answer=lo+1;
    const wrongs=new Set();while(wrongs.size<2){const w=randInt(1,10);if(w!==answer)wrongs.add(w);}
    const options=shuffle([answer,...wrongs]),correctIdx=options.indexOf(answer);
    getScreen().querySelector('.lcm1-body').innerHTML=`
      <div class="lcm1-practice-section">
        <div class="lcm1-header-row"><span class="lcm1-round-badge">Câu ${state.round}/6</span><span class="lcm1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="lcm1-question">Tìm số! ${speakerBtn('Số nào nằm giữa '+NUM_W[lo]+' và '+NUM_W[hi])}</p>
        <div class="lcm1-equation-big">${numHtml(lo,48)} <span class="lcm1-sign">&lt;</span> <span class="lcm1-sign-slot">?</span> <span class="lcm1-sign">&lt;</span> ${numHtml(hi,48)}</div>
        <div class="lcm1-options" id="lcm1-t3-opts">${options.map((o,i)=>`<button class="lcm1-opt" onclick="window._lessonCmp1.answerT3(${i},${correctIdx},${answer})">${numHtml(o,40)}</button>`).join('')}</div>
        <div class="lcm1-feedback" id="lcm1-fb"></div>
      </div>`;
    updateProgress();
  }
  function answerT3(picked,correctIdx,answer){
    state.total++;const opts=getScreen().querySelectorAll('.lcm1-opt');
    opts.forEach((o,i)=>{o.style.pointerEvents='none';if(i===correctIdx)o.classList.add('lcm1-btn-correct');if(i===picked&&i!==correctIdx)o.classList.add('lcm1-btn-wrong');});
    const fb=$('lcm1-fb');
    if(picked===correctIdx){state.score++;playSound('correct');if(fb)fb.innerHTML=`<div class="lcm1-fb-ok">${rand(PRAISE)}</div>`;}
    else{playSound('wrong');if(fb)fb.innerHTML=`<div class="lcm1-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${answer}</div>`;}
    setTimeout(()=>nextPractice(),1400);
  }

  // STEP 3: Reward
  function showReward(){
    state.step=3;playSound('win');
    const stars=state.score>=5?3:state.score>=3?2:1;
    const starsHtml=Array.from({length:3},(_,i)=>S().el(2,0,0,i<stars?36:24,i>=stars?'lcm1-star-dim':'')).join(' ');
    const msg=stars===3?'Xuất sắc! Chuyên gia So sánh!':stars===2?'Tốt lắm! Giỏi rồi!':'Cố gắng thêm nhé!';
    getScreen().querySelector('.lcm1-body').innerHTML=`
      <div class="lcm1-reward">
        <div class="lcm1-reward-stars">${starsHtml}</div>
        <h2 class="lcm1-reward-title">${msg}</h2>
        <div class="lcm1-reward-score">Đúng <strong>${state.score}</strong> / ${state.total} câu</div>
        <div class="lcm1-reward-concepts"><div class="lcm1-concept">Miệng cá sấu há về phía LỚN hơn</div><div class="lcm1-concept">> lớn hơn, < nhỏ hơn, = bằng nhau</div></div>
        <div class="lcm1-reward-actions"><button class="lc-btn lc-btn-secondary" onclick="window._lessonCmp1.restart()">Học lại</button><button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button></div>
      </div>`;
    if(window.HocVuiCollection&&window.HocVuiCollection.reward)window.HocVuiCollection.reward(stars);
    updateProgress();
  }
  function restart(){state={step:0,score:0,total:0,round:0};renderDemo();}
  function open(){show();restart();}
  window._lessonCmp1={open,restart,speak,renderEqual,startPractice,answerSign,answerT3};
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{if(typeof openTopic==='function'){const _o=openTopic;window.openTopic=function(t){if(t==='compare1'){window._lessonCmp1.open();return;}_o(t);};}},0);});
})();
