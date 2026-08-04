// === Interactive "Phép Trừ trong phạm vi 10" Lesson for Grade 1 ===
// Hooks into openTopic('sub1'). 4-step CPA: Visual Remove → Number Bond → Practice (3 types) → Reward
(function () {
  'use strict';
  const S = () => window.HocVuiSprite;
  const N = () => window.HocVuiNumbers;
  const NUM_W = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín','mười'];
  function speak(t){if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='vi-VN';u.rate=0.85;u.pitch=1.1;const v=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('vi'));if(v)u.voice=v;window.speechSynthesis.speak(u);}
  function speakerBtn(t){return `<button class="lc-speak-btn" onclick="window._lessonSub1.speak('${t.replace(/'/g,"\\'")}')">`+'<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';}
  function numHtml(n,sz){return N()?N().html(n,sz||36):`<span style="font-weight:900;font-size:${sz||36}px;">${n}</span>`;}
  let state={step:0,score:0,total:0,round:0,removed:0,_a:0,_b:0,_ans:0,_item:null};
  function $(id){return document.getElementById(id);}
  function rand(a){return a[Math.floor(Math.random()*a.length)];}
  function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
  function playSound(t){if(window.HocVuiSound)window.HocVuiSound.play(t);}
  function shuffle(a){return[...a].sort(()=>Math.random()-0.5);}
  const PRAISE=['Giỏi lắm!','Tuyệt vời!','Đúng rồi!','Hay quá!'];
  const ENCOURAGE=['Thử lại nhé!','Đếm lại nào!','Cố lên!'];
  function getScreen(){return $('sub1-interactive-screen');}
  function show(){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));getScreen().classList.add('active');}
  function updateProgress(){const b=getScreen().querySelector('.ls1-progress-bar');if(b)b.style.width=((state.step+1)/4*100)+'%';}

  // STEP 0: Visual Remove — tap items to remove them
  function renderRemove(){
    state.step=0;state.removed=0;
    const a=randInt(6,9),b=randInt(2,4),ans=a-b;
    state._a=a;state._b=b;state._ans=ans;
    const item=S().randomKidFriendlyData();state._item=item;
    const items=Array.from({length:a},(_,i)=>`<div class="ls1-item" id="ls1-item-${i}" onclick="window._lessonSub1.tapRemove(${i})">${S().html(item.s,item.r,item.c,40)}</div>`).join('');
    getScreen().querySelector('.ls1-body').innerHTML=`
      <div class="ls1-remove-section">
        <p class="ls1-title">Bớt đi ${b} hình! ${speakerBtn('Chạm vào '+NUM_W[b]+' hình để bớt đi')}</p>
        <p class="ls1-hint">Chạm ${b} hình để chúng bay đi!</p>
        <div class="ls1-items-area" id="ls1-items-area">${items}</div>
        <div class="ls1-counter" id="ls1-counter">Đã bớt: ${numHtml(0,32)} / ${numHtml(b,32)}</div>
        <div class="ls1-equation" id="ls1-eq" style="opacity:0">${numHtml(a,36)} <span class="ls1-minus">−</span> ${numHtml(b,36)} <span class="ls1-eq-sign">=</span> ${numHtml(ans,36)}</div>
        <div class="ls1-feedback" id="ls1-remove-fb"></div>
      </div>`;
    updateProgress();
  }
  function tapRemove(idx){
    const el=$('ls1-item-'+idx);
    if(!el||el.classList.contains('ls1-removed'))return;
    if(state.removed>=state._b)return;
    el.classList.add('ls1-removed');state.removed++;
    playSound('click');
    const c=$('ls1-counter');if(c)c.innerHTML=`Đã bớt: ${numHtml(state.removed,32)} / ${numHtml(state._b,32)}`;
    if(state.removed>=state._b){
      setTimeout(()=>{
        playSound('correct');const eq=$('ls1-eq');if(eq)eq.style.opacity='1';
        speak(`${NUM_W[state._a]} trừ ${NUM_W[state._b]} bằng ${NUM_W[state._ans]}`);
        const fb=$('ls1-remove-fb');if(fb)fb.innerHTML=`<div class="ls1-fb-ok">${rand(PRAISE)} Còn lại ${state._ans}!</div><button class="lc-btn lc-btn-primary" onclick="window._lessonSub1.startBond()" style="margin-top:10px;">Tiếp: Tách-Gộp!</button>`;
      },500);
    }
  }

  // STEP 1: Number Bond — find missing part (subtraction as inverse)
  function startBond(){state.step=1;state.round=0;state.score=0;state.total=0;nextBond();}
  function nextBond(){
    if(state.round>=3){startPractice();return;}state.round++;
    const total=randInt(6,10),part=randInt(1,total-1),missing=total-part;
    const wrongs=new Set();while(wrongs.size<2){const w=randInt(1,9);if(w!==missing)wrongs.add(w);}
    const options=shuffle([missing,...wrongs]),correctIdx=options.indexOf(missing);
    const item=state._item||S().randomKidFriendlyData();
    const dots=Array.from({length:total},(_,i)=>`<span class="ls1-bond-dot ${i<part?'ls1-dot-keep':'ls1-dot-gone'}">${S().html(item.s,item.r,item.c,24)}</span>`).join('');
    getScreen().querySelector('.ls1-body').innerHTML=`
      <div class="ls1-bond-section">
        <div class="ls1-header-row"><span class="ls1-round-badge">Tách-Gộp ${state.round}/3</span><span class="ls1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="ls1-question">${numHtml(total,40)} − ${numHtml(part,40)} = <span class="ls1-bond-missing">?</span> ${speakerBtn(NUM_W[total]+' trừ '+NUM_W[part]+' bằng mấy?')}</p>
        <div class="ls1-bond-visual">${dots}</div>
        <p class="ls1-hint">${part} hình giữ lại, còn lại mấy?</p>
        <div class="ls1-options" id="ls1-bond-opts">${options.map((o,i)=>`<button class="ls1-opt" onclick="window._lessonSub1.answerBond(${i},${correctIdx},${missing})">${numHtml(o,36)}</button>`).join('')}</div>
        <div class="ls1-feedback" id="ls1-bond-fb"></div>
      </div>`;
    updateProgress();
  }
  function answerBond(picked,correctIdx,answer){
    state.total++;const opts=getScreen().querySelectorAll('.ls1-opt');
    opts.forEach((o,i)=>{o.style.pointerEvents='none';if(i===correctIdx)o.classList.add('ls1-opt-correct');if(i===picked&&i!==correctIdx)o.classList.add('ls1-opt-wrong');});
    const fb=$('ls1-bond-fb');
    if(picked===correctIdx){state.score++;playSound('correct');if(fb)fb.innerHTML=`<div class="ls1-fb-ok">${rand(PRAISE)}</div>`;}
    else{playSound('wrong');if(fb)fb.innerHTML=`<div class="ls1-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${answer}</div>`;}
    setTimeout(()=>nextBond(),1500);
  }

  // STEP 2: Practice — 3 types (cross-out, count-back, bubble-pop)
  function startPractice(){state.step=2;state.round=0;nextPractice();}
  function nextPractice(){
    if(state.round>=6){showReward();return;}state.round++;
    if(state.round<=2) renderCrossOut();
    else if(state.round<=4) renderCountBack();
    else renderBubblePop();
  }
  // Dạng 1: Gạch bỏ — tap items to cross out, then pick answer
  function renderCrossOut(){
    const a=randInt(5,9),b=randInt(1,4),ans=a-b;
    state._pA=a;state._pB=b;state._pAns=ans;state._crossed=0;
    const item=S().randomKidFriendlyData();
    const items=Array.from({length:a},(_,i)=>`<span class="ls1-cross-item" id="ls1-xi-${i}" onclick="window._lessonSub1.tapCross(${i})">${S().html(item.s,item.r,item.c,28)}</span>`).join('');
    const wrongs=new Set();while(wrongs.size<3){const w=randInt(1,9);if(w!==ans)wrongs.add(w);}
    const options=shuffle([ans,...wrongs]),correctIdx=options.indexOf(ans);
    state._crossCorrect=correctIdx;state._crossOpts=options;
    getScreen().querySelector('.ls1-body').innerHTML=`
      <div class="ls1-practice-section">
        <div class="ls1-header-row"><span class="ls1-round-badge">Câu ${state.round}/6</span><span class="ls1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="ls1-question">${numHtml(a,40)} <span class="ls1-minus">−</span> ${numHtml(b,40)} = ? ${speakerBtn(NUM_W[a]+' trừ '+NUM_W[b])}</p>
        <p class="ls1-hint">Gạch bỏ ${b} hình, đếm còn lại!</p>
        <div class="ls1-cross-area" id="ls1-cross-area">${items}</div>
        <div class="ls1-options ls1-opts-hidden" id="ls1-cross-opts">${options.map((o,i)=>`<button class="ls1-opt" onclick="window._lessonSub1.answerPractice(${i},${correctIdx},${ans})">${numHtml(o,36)}</button>`).join('')}</div>
        <div class="ls1-feedback" id="ls1-practice-fb"></div>
      </div>`;
    updateProgress();
  }
  function tapCross(idx){
    const el=$('ls1-xi-'+idx);
    if(!el||el.classList.contains('ls1-crossed'))return;
    if(state._crossed>=state._pB)return;
    el.classList.add('ls1-crossed');state._crossed++;playSound('click');
    if(state._crossed>=state._pB){
      // Show options
      const opts=$('ls1-cross-opts');if(opts)opts.classList.remove('ls1-opts-hidden');
    }
  }

  // Dạng 2: Đếm lùi trên tia số
  function renderCountBack(){
    const a=randInt(5,10),b=randInt(1,3),ans=a-b;
    const wrongs=new Set();while(wrongs.size<3){const w=randInt(1,9);if(w!==ans)wrongs.add(w);}
    const options=shuffle([ans,...wrongs]),correctIdx=options.indexOf(ans);
    // Number line 0-10
    const line=Array.from({length:11},(_,i)=>{
      let cls='ls1-nl-num';
      if(i===a)cls+=' ls1-nl-start';
      if(i===ans)cls+=' ls1-nl-end';
      if(i>ans&&i<a)cls+=' ls1-nl-path';
      return `<span class="${cls}">${numHtml(i,18)}</span>`;
    }).join('');
    getScreen().querySelector('.ls1-body').innerHTML=`
      <div class="ls1-practice-section">
        <div class="ls1-header-row"><span class="ls1-round-badge">Câu ${state.round}/6</span><span class="ls1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="ls1-question">${numHtml(a,40)} <span class="ls1-minus">−</span> ${numHtml(b,40)} = ? ${speakerBtn('Đếm lùi '+NUM_W[b]+' bước từ '+NUM_W[a])}</p>
        <p class="ls1-hint">Đếm lùi ${b} bước từ ${a}!</p>
        <div class="ls1-number-line">${line}</div>
        <div class="ls1-jump-arrows">${Array.from({length:b},(_,i)=>`<span class="ls1-jump">↶</span>`).join('')}</div>
        <div class="ls1-options" id="ls1-cb-opts">${options.map((o,i)=>`<button class="ls1-opt" onclick="window._lessonSub1.answerPractice(${i},${correctIdx},${ans})">${numHtml(o,36)}</button>`).join('')}</div>
        <div class="ls1-feedback" id="ls1-practice-fb"></div>
      </div>`;
    updateProgress();
  }
  // Dạng 3: Bubble Pop — chọn số đúng để "chích bóng"
  function renderBubblePop(){
    const a=randInt(6,10),b=randInt(2,5),ans=a-b;
    const wrongs=new Set();while(wrongs.size<3){const w=randInt(1,9);if(w!==ans)wrongs.add(w);}
    const options=shuffle([ans,...wrongs]),correctIdx=options.indexOf(ans);
    getScreen().querySelector('.ls1-body').innerHTML=`
      <div class="ls1-practice-section">
        <div class="ls1-header-row"><span class="ls1-round-badge">Câu ${state.round}/6</span><span class="ls1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="ls1-question">Giải cứu! ${speakerBtn(NUM_W[a]+' trừ '+NUM_W[b]+' bằng mấy?')}</p>
        <div class="ls1-bubble">
          <div class="ls1-bubble-eq">${numHtml(a,48)} <span class="ls1-minus">−</span> ${numHtml(b,48)}</div>
          ${S().randomKidFriendly(56)}
        </div>
        <p class="ls1-hint">Chọn số đúng để chích vỡ bong bóng!</p>
        <div class="ls1-options" id="ls1-bp-opts">${options.map((o,i)=>`<button class="ls1-opt ls1-spike" onclick="window._lessonSub1.answerPractice(${i},${correctIdx},${ans})">${numHtml(o,36)}</button>`).join('')}</div>
        <div class="ls1-feedback" id="ls1-practice-fb"></div>
      </div>`;
    updateProgress();
  }

  // Answer handler for all practice types
  function answerPractice(picked,correctIdx,answer){
    state.total++;const opts=getScreen().querySelectorAll('.ls1-opt');
    opts.forEach((o,i)=>{o.style.pointerEvents='none';if(i===correctIdx)o.classList.add('ls1-opt-correct');if(i===picked&&i!==correctIdx)o.classList.add('ls1-opt-wrong');});
    const fb=$('ls1-practice-fb');
    if(picked===correctIdx){state.score++;playSound('correct');if(fb)fb.innerHTML=`<div class="ls1-fb-ok">${rand(PRAISE)}</div>`;}
    else{playSound('wrong');if(fb)fb.innerHTML=`<div class="ls1-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${answer}</div>`;}
    setTimeout(()=>nextPractice(),1400);
  }
  // STEP 3: Reward
  function showReward(){
    state.step=3;playSound('win');
    const stars=state.score>=8?3:state.score>=5?2:1;
    const starsHtml=Array.from({length:3},(_,i)=>S().el(2,0,0,i<stars?36:24,i>=stars?'ls1-star-dim':'')).join(' ');
    const msg=stars===3?'Xuất sắc! Thợ săn phép trừ!':stars===2?'Tốt lắm! Trừ giỏi rồi!':'Cố gắng thêm nhé!';
    getScreen().querySelector('.ls1-body').innerHTML=`
      <div class="ls1-reward">
        <div class="ls1-reward-stars">${starsHtml}</div>
        <h2 class="ls1-reward-title">${msg}</h2>
        <div class="ls1-reward-score">Đúng <strong>${state.score}</strong> / ${state.total} câu</div>
        <div class="ls1-reward-concepts"><div class="ls1-concept">Phép trừ = bớt đi, lấy ra</div><div class="ls1-concept">a + b = c thì c − a = b</div></div>
        <div class="ls1-reward-actions"><button class="lc-btn lc-btn-secondary" onclick="window._lessonSub1.restart()">Học lại</button><button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button></div>
      </div>`;
    if(window.HocVuiCollection&&window.HocVuiCollection.reward)window.HocVuiCollection.reward(stars);
    updateProgress();
  }
  // Public API
  function restart(){state={step:0,score:0,total:0,round:0,removed:0,_a:0,_b:0,_ans:0,_item:null};renderRemove();}
  function open(){show();restart();}
  window._lessonSub1={open,restart,speak,tapRemove,startBond,answerBond,tapCross,answerPractice};
  // Hook
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{if(typeof openTopic==='function'){const _o=openTopic;window.openTopic=function(t){if(t==='sub1'){window._lessonSub1.open();return;}_o(t);};}},0);});
})();
