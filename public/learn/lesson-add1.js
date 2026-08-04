// === Interactive "Phép Cộng trong phạm vi 10" Lesson for Grade 1 ===
// Hooks into openTopic('add1'). 4-step CPA flow.
(function () {
  'use strict';
  const S = () => window.HocVuiSprite;
  const N = () => window.HocVuiNumbers;
  const NUM_W = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín','mười'];
  function speak(t){if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='vi-VN';u.rate=0.85;u.pitch=1.1;const v=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('vi'));if(v)u.voice=v;window.speechSynthesis.speak(u);}
  function speakerBtn(t){return `<button class="lc-speak-btn" onclick="window._lessonAdd1.speak('${t.replace(/'/g,"\\'")}')">`+'<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';}
  function numHtml(n,sz){return N()?N().html(n,sz||36):`<span style="font-weight:900;font-size:${sz||36}px;">${n}</span>`;}
  let state={step:0,score:0,total:0,round:0,combined:0,_a:0,_b:0,_sum:0,_item:null};
  function $(id){return document.getElementById(id);}
  function rand(a){return a[Math.floor(Math.random()*a.length)];}
  function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
  function playSound(t){if(window.HocVuiSound)window.HocVuiSound.play(t);}
  function shuffle(a){return[...a].sort(()=>Math.random()-0.5);}
  const PRAISE=['Giỏi lắm!','Tuyệt vời!','Đúng rồi!','Hay quá!'];
  const ENCOURAGE=['Thử lại nhé!','Đếm lại nào!','Cố lên!'];
  function getScreen(){return $('add1-interactive-screen');}
  function show(){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));getScreen().classList.add('active');}
  function updateProgress(){const b=getScreen().querySelector('.la1-progress-bar');if(b)b.style.width=((state.step+1)/4*100)+'%';}

  // STEP 0: Visual Combine
  function renderCombine(){
    state.step=0;state.combined=0;
    const a=randInt(2,5),b=randInt(1,5),sum=a+b;
    state._a=a;state._b=b;state._sum=sum;
    const item=S().randomKidFriendlyData();state._item=item;
    const left=Array.from({length:a},(_,i)=>`<div class="la1-combine-item" id="la1-left-${i}" onclick="window._lessonAdd1.tapCombine('left',${i})">${S().html(item.s,item.r,item.c,40)}</div>`).join('');
    const right=Array.from({length:b},(_,i)=>`<div class="la1-combine-item" id="la1-right-${i}" onclick="window._lessonAdd1.tapCombine('right',${i})">${S().html(item.s,item.r,item.c,40)}</div>`).join('');
    getScreen().querySelector('.la1-body').innerHTML=`
      <div class="la1-combine-section">
        <p class="la1-title">Gộp lại xem có bao nhiêu! ${speakerBtn('Gộp lại xem có bao nhiêu')}</p>
        <p class="la1-hint">Chạm từng hình để gộp vào đĩa!</p>
        <div class="la1-combine-area">
          <div class="la1-group">${left}</div>
          <div class="la1-plate"><div class="la1-plate-label" id="la1-plate-num">${numHtml(0,48)}</div></div>
          <div class="la1-group">${right}</div>
        </div>
        <div class="la1-equation" id="la1-eq" style="opacity:0">${numHtml(a,32)} <span class="la1-op">+</span> ${numHtml(b,32)} <span class="la1-op">=</span> ${numHtml(sum,32)}</div>
        <div class="la1-feedback" id="la1-combine-fb"></div>
      </div>`;
    updateProgress();
  }
  function tapCombine(side,idx){
    const el=$(`la1-${side}-${idx}`);
    if(!el||el.classList.contains('la1-combined'))return;
    el.classList.add('la1-combined');state.combined++;
    playSound('click');if(state.combined<=10)speak(NUM_W[state.combined]);
    const p=$('la1-plate-num');if(p)p.innerHTML=numHtml(state.combined,48);
    if(state.combined>=state._sum){
      setTimeout(()=>{playSound('correct');const eq=$('la1-eq');if(eq)eq.style.opacity='1';
        speak(`${NUM_W[state._a]} cộng ${NUM_W[state._b]} bằng ${NUM_W[state._sum]}`);
        const fb=$('la1-combine-fb');if(fb)fb.innerHTML=`<div class="la1-fb-ok">${rand(PRAISE)}</div><button class="lc-btn lc-btn-primary" onclick="window._lessonAdd1.startBond()" style="margin-top:10px;">Tiếp: Tách-Gộp!</button>`;
      },500);
    }
  }

  // STEP 1: Number Bond
  function startBond(){state.step=1;state.round=0;state.score=0;state.total=0;nextBond();}
  function nextBond(){
    if(state.round>=3){startPractice();return;}state.round++;
    const total=randInt(5,10),partA=randInt(1,total-1),partB=total-partA;
    const askFirst=Math.random()>0.5,missing=askFirst?partA:partB,given=askFirst?partB:partA;
    const wrongs=new Set();while(wrongs.size<2){const w=randInt(1,9);if(w!==missing)wrongs.add(w);}
    const options=shuffle([missing,...wrongs]),correctIdx=options.indexOf(missing);
    const bond=askFirst?`${numHtml(total,48)} = <span class="la1-bond-missing">?</span> + ${numHtml(given,48)}`:`${numHtml(total,48)} = ${numHtml(given,48)} + <span class="la1-bond-missing">?</span>`;
    const item=state._item||S().randomKidFriendlyData();
    const dots=Array.from({length:total},(_,i)=>`<span class="la1-bond-dot ${i<(askFirst?partA:given)?'la1-dot-a':'la1-dot-b'}">${S().html(item.s,item.r,item.c,24)}</span>`).join('');
    getScreen().querySelector('.la1-body').innerHTML=`
      <div class="la1-bond-section">
        <div class="la1-bond-header"><span class="la1-round-badge">Tách-Gộp ${state.round}/3</span><span class="la1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="la1-question">Điền số còn thiếu! ${speakerBtn('Điền số còn thiếu')}</p>
        <div class="la1-bond-display">${bond}</div>
        <div class="la1-bond-visual">${dots}</div>
        <div class="la1-options" id="la1-bond-opts">${options.map((o,i)=>`<button class="la1-opt" onclick="window._lessonAdd1.answerBond(${i},${correctIdx},${missing})">${numHtml(o,36)}</button>`).join('')}</div>
        <div class="la1-feedback" id="la1-bond-fb"></div>
      </div>`;
    updateProgress();
  }
  function answerBond(picked,correctIdx,answer){
    state.total++;const opts=getScreen().querySelectorAll('.la1-opt');
    opts.forEach((o,i)=>{o.style.pointerEvents='none';if(i===correctIdx)o.classList.add('la1-opt-correct');if(i===picked&&i!==correctIdx)o.classList.add('la1-opt-wrong');});
    const fb=$('la1-bond-fb');
    if(picked===correctIdx){state.score++;playSound('correct');if(fb)fb.innerHTML=`<div class="la1-fb-ok">${rand(PRAISE)}</div>`;}
    else{playSound('wrong');if(fb)fb.innerHTML=`<div class="la1-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${answer}</div>`;}
    setTimeout(()=>nextBond(),1500);
  }

  // STEP 2: Practice (3 dạng xen kẽ)
  function startPractice(){state.step=2;state.round=0;nextPractice();}
  function nextPractice(){
    if(state.round>=6){showReward();return;}state.round++;
    if(state.round<=2) renderType1(); // Dạng 1: a + b = ?
    else if(state.round<=4) renderType2(); // Dạng 2: tìm số cộng thêm (tổng = a + ?)
    else renderType3(); // Dạng 3: bài toán lời văn
  }
  // Dạng 1: a + b = ?
  function renderType1(){
    const a=randInt(1,7),b=randInt(1,10-a),answer=a+b;
    const wrongs=new Set();while(wrongs.size<3){const w=randInt(2,10);if(w!==answer)wrongs.add(w);}
    const options=shuffle([answer,...wrongs]),correctIdx=options.indexOf(answer);
    const item=S().randomKidFriendlyData();
    const dotsA=Array.from({length:a},()=>S().html(item.s,item.r,item.c,20)).join('');
    const dotsB=Array.from({length:b},()=>S().html(item.s,item.r,item.c,20)).join('');
    getScreen().querySelector('.la1-body').innerHTML=`
      <div class="la1-practice-section">
        <div class="la1-bond-header"><span class="la1-round-badge">Câu ${state.round}/6</span><span class="la1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <div class="la1-equation-big">${numHtml(a,56)} <span class="la1-op">+</span> ${numHtml(b,56)} <span class="la1-op">=</span> <span class="la1-op">?</span></div>
        <div class="la1-dots-hint"><span class="la1-dots-group la1-dots-a">${dotsA}</span><span class="la1-dots-plus">+</span><span class="la1-dots-group la1-dots-b">${dotsB}</span></div>
        <div class="la1-options" id="la1-practice-opts">${options.map((o,i)=>`<button class="la1-opt" onclick="window._lessonAdd1.answerPractice(${i},${correctIdx},${answer})">${numHtml(o,40)}</button>`).join('')}</div>
        <div class="la1-feedback" id="la1-practice-fb"></div>
      </div>`;
    updateProgress();
  }
  // Dạng 2: Tìm số cộng thêm — "Tổng là 8, có 3, cần thêm ?"
  function renderType2(){
    const total=randInt(6,10),given=randInt(1,total-1),answer=total-given;
    const wrongs=new Set();while(wrongs.size<3){const w=randInt(1,9);if(w!==answer)wrongs.add(w);}
    const options=shuffle([answer,...wrongs]),correctIdx=options.indexOf(answer);
    const question=`Tạo tổng ${total}!`;
    getScreen().querySelector('.la1-body').innerHTML=`
      <div class="la1-practice-section">
        <div class="la1-bond-header"><span class="la1-round-badge">Câu ${state.round}/6</span><span class="la1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="la1-question">${question} ${speakerBtn(question)}</p>
        <div class="la1-equation-big">${numHtml(given,56)} <span class="la1-op">+</span> <span class="la1-op la1-bond-missing">?</span> <span class="la1-op">=</span> ${numHtml(total,56)}</div>
        <p class="la1-hint">Cần thêm bao nhiêu để được ${total}?</p>
        <div class="la1-options" id="la1-practice-opts">${options.map((o,i)=>`<button class="la1-opt" onclick="window._lessonAdd1.answerPractice(${i},${correctIdx},${answer})">${numHtml(o,40)}</button>`).join('')}</div>
        <div class="la1-feedback" id="la1-practice-fb"></div>
      </div>`;
    updateProgress();
  }
  // Dạng 3: Bài toán lời văn — chọn biểu thức đúng
  function renderType3(){
    const WORD_PROBLEMS=[
      {a:3,b:4,text:'Trong sân có 3 con gà. Có thêm 4 con chạy vào.'},
      {a:5,b:2,text:'Bạn An có 5 viên bi. Bạn Bình cho thêm 2 viên.'},
      {a:2,b:6,text:'Trên cây có 2 con chim. Bay đến thêm 6 con nữa.'},
      {a:4,b:3,text:'Trong hộp có 4 cái bánh. Mẹ bỏ thêm 3 cái.'},
      {a:1,b:7,text:'Bé có 1 bông hoa. Bố tặng thêm 7 bông.'},
      {a:6,b:3,text:'Trên bàn có 6 quả cam. Chị để thêm 3 quả.'},
    ];
    const p=rand(WORD_PROBLEMS);
    const correctExpr=`${p.a} + ${p.b} = ${p.a+p.b}`;
    const wrongExpr1=`${p.a} - ${p.b} = ${p.a-p.b>=0?p.a-p.b:p.b-p.a}`;
    const wrongExpr2=`${p.b} + ${p.b} = ${p.b*2}`;
    const correctHtml=`${numHtml(p.a,32)} + ${numHtml(p.b,32)} = ${numHtml(p.a+p.b,32)}`;
    const wrongHtml1=`${numHtml(p.a,32)} - ${numHtml(p.b,32)} = ${numHtml(p.a-p.b>=0?p.a-p.b:p.b-p.a,32)}`;
    const wrongHtml2=`${numHtml(p.b,32)} + ${numHtml(p.b,32)} = ${numHtml(p.b*2,32)}`;
    const optionsHtml=shuffle([{h:correctHtml,c:true},{h:wrongHtml1,c:false},{h:wrongHtml2,c:false}]);
    const correctIdx=optionsHtml.findIndex(o=>o.c);
    getScreen().querySelector('.la1-body').innerHTML=`
      <div class="la1-practice-section">
        <div class="la1-bond-header"><span class="la1-round-badge">Câu ${state.round}/6</span><span class="la1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="la1-question">Chọn phép tính đúng! ${speakerBtn(p.text)}</p>
        <div class="la1-word-problem">${p.text}<br><strong>Hỏi: Có tất cả bao nhiêu?</strong></div>
        <div class="la1-options la1-opts-col" id="la1-practice-opts">${optionsHtml.map((o,i)=>`<button class="la1-opt la1-opt-wide" onclick="window._lessonAdd1.answerPractice(${i},${correctIdx},${i===correctIdx})">${o.h}</button>`).join('')}</div>
        <div class="la1-feedback" id="la1-practice-fb"></div>
      </div>`;
    updateProgress();
  }
  function answerPractice(picked,correctIdx,answer){
    state.total++;const opts=getScreen().querySelectorAll('.la1-opt');
    opts.forEach((o,i)=>{o.style.pointerEvents='none';if(i===correctIdx)o.classList.add('la1-opt-correct');if(i===picked&&i!==correctIdx)o.classList.add('la1-opt-wrong');});
    const fb=$('la1-practice-fb');
    if(picked===correctIdx){state.score++;playSound('correct');if(fb)fb.innerHTML=`<div class="la1-fb-ok">${rand(PRAISE)}</div>`;}
    else{playSound('wrong');if(fb)fb.innerHTML=`<div class="la1-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${answer}</div>`;}
    setTimeout(()=>nextPractice(),1400);
  }

  // STEP 3: Reward
  function showReward(){
    state.step=3;playSound('win');
    const stars=state.score>=8?3:state.score>=5?2:1;
    const starsHtml=Array.from({length:3},(_,i)=>S().el(2,0,0,i<stars?36:24,i>=stars?'la1-star-dim':'')).join(' ');
    const msg=stars===3?'Xuất sắc! Bậc thầy Phép cộng!':stars===2?'Tốt lắm! Cộng giỏi rồi!':'Cố gắng thêm nhé!';
    getScreen().querySelector('.la1-body').innerHTML=`
      <div class="la1-reward">
        <div class="la1-reward-stars">${starsHtml}</div>
        <h2 class="la1-reward-title">${msg}</h2>
        <div class="la1-reward-score">Đúng <strong>${state.score}</strong> / ${state.total} câu</div>
        <div class="la1-reward-concepts"><div class="la1-concept">Phép cộng = gộp hai nhóm lại</div><div class="la1-concept">a + b = b + a</div></div>
        <div class="la1-reward-actions"><button class="lc-btn lc-btn-secondary" onclick="window._lessonAdd1.restart()">Học lại</button><button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button></div>
      </div>`;
    if(window.HocVuiCollection&&window.HocVuiCollection.reward)window.HocVuiCollection.reward(stars);
    updateProgress();
  }
  // Public API
  function restart(){state={step:0,score:0,total:0,round:0,combined:0,_a:0,_b:0,_sum:0,_item:null};renderCombine();}
  function open(){show();restart();}
  window._lessonAdd1={open,restart,speak,tapCombine,startBond,answerBond,answerPractice};
  // Hook
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{if(typeof openTopic==='function'){const _o=openTopic;window.openTopic=function(t){if(t==='add1'){window._lessonAdd1.open();return;}_o(t);};}},0);});
})();
