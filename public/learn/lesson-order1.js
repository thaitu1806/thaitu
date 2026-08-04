// === Interactive "Thứ Tự Số" (Number Order) Lesson for Grade 1 ===
// Hooks into openTopic('order1'). 4-step: House Demo → Rules → Practice (3 types) → Reward
(function () {
  'use strict';
  const S = () => window.HocVuiSprite;
  const N = () => window.HocVuiNumbers;
  const NUM_W = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín','mười','mười một','mười hai','mười ba','mười bốn','mười lăm','mười sáu','mười bảy','mười tám','mười chín','hai mươi'];
  function speak(t){if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='vi-VN';u.rate=0.85;u.pitch=1.1;const v=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('vi'));if(v)u.voice=v;window.speechSynthesis.speak(u);}
  function speakerBtn(t){return `<button class="lc-speak-btn" onclick="window._lessonOrd1.speak('${t.replace(/'/g,"\\'")}')">`+'<img src="/img/sound-on.png" style="width:22px;height:22px;"></button>';}
  function numHtml(n,sz){return N()?N().html(n,sz||36):`<span style="font-weight:900;font-size:${sz||36}px;">${n}</span>`;}
  let state={step:0,score:0,total:0,round:0,_picked:[]};
  function $(id){return document.getElementById(id);}
  function rand(a){return a[Math.floor(Math.random()*a.length)];}
  function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
  function playSound(t){if(window.HocVuiSound)window.HocVuiSound.play(t);}
  function shuffle(a){return[...a].sort(()=>Math.random()-0.5);}
  const PRAISE=['Giỏi lắm!','Tuyệt vời!','Đúng rồi!','Hay quá!'];
  const ENCOURAGE=['Thử lại nhé!','Nhìn kỹ nào!','Cố lên!'];
  function getScreen(){return $('order1-interactive-screen');}
  function show(){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));getScreen().classList.add('active');}
  function updateProgress(){const b=getScreen().querySelector('.lor1-progress-bar');if(b)b.style.width=((state.step+1)/4*100)+'%';}

  // STEP 0: House Neighbors Demo
  function renderDemo(){
    state.step=0;
    const mid=randInt(3,8);const prev=mid-1;const next=mid+1;
    getScreen().querySelector('.lor1-body').innerHTML=`
      <div class="lor1-demo-section">
        <p class="lor1-title">Hàng xóm của số ${mid}! ${speakerBtn('Hàng xóm của số '+NUM_W[mid])}</p>
        <p class="lor1-hint">Chạm vào ngôi nhà để tìm hàng xóm!</p>
        <div class="lor1-houses">
          <div class="lor1-house lor1-house-prev" id="lor1-h-prev" onclick="window._lessonOrd1.tapHouse('prev',${prev},${mid})">
            ${S().html(5,3,0,40)}
            <div class="lor1-house-num" id="lor1-hn-prev">?</div>
            <div class="lor1-house-label">Liền trước</div>
          </div>
          <div class="lor1-house lor1-house-mid">
            ${S().html(5,3,2,40)}
            <div class="lor1-house-num">${numHtml(mid,40)}</div>
          </div>
          <div class="lor1-house lor1-house-next" id="lor1-h-next" onclick="window._lessonOrd1.tapHouse('next',${next},${mid})">
            ${S().html(5,3,4,40)}
            <div class="lor1-house-num" id="lor1-hn-next">?</div>
            <div class="lor1-house-label">Liền sau</div>
          </div>
        </div>
        <div class="lor1-number-line">${Array.from({length:11},(_,i)=>`<span class="lor1-nl ${i===mid?'lor1-nl-active':''}">${numHtml(i,16)}</span>`).join('')}</div>
        <div class="lor1-info" id="lor1-info"></div>
        <div id="lor1-demo-next"></div>
      </div>`;
    updateProgress();
  }
  let _demoRevealed=0;
  function tapHouse(which,val,mid){
    _demoRevealed++;playSound('click');
    const el=$(which==='prev'?'lor1-hn-prev':'lor1-hn-next');
    if(el)el.innerHTML=numHtml(val,40);
    const info=$('lor1-info');
    if(which==='prev'){
      speak(`${NUM_W[val]} là số liền trước của ${NUM_W[mid]}`);
      if(info)info.innerHTML=`<p><strong>${val}</strong> là số liền TRƯỚC của ${mid} (${mid} − 1 = ${val})</p>`;
    }else{
      speak(`${NUM_W[val]} là số liền sau của ${NUM_W[mid]}`);
      if(info)info.innerHTML=`<p><strong>${val}</strong> là số liền SAU của ${mid} (${mid} + 1 = ${val})</p>`;
    }
    if(_demoRevealed>=2){
      setTimeout(()=>{const nx=$('lor1-demo-next');if(nx)nx.innerHTML=`<button class="lc-btn lc-btn-primary" onclick="window._lessonOrd1.startPractice()">Luyện tập!</button>`;},600);
    }
  }

  // STEP 2: Practice — 3 types
  function startPractice(){state.step=2;state.round=0;state.score=0;state.total=0;nextPractice();}
  function nextPractice(){
    if(state.round>=6){showReward();return;}state.round++;
    if(state.round<=2) renderTrain();
    else if(state.round<=4) renderFindNeighbor();
    else renderSort();
  }
  // Dạng 1: Chuyến tàu hỏa — điền số thiếu trong dãy liên tiếp
  function renderTrain(){
    const start=randInt(3,15);const seq=[start,start+1,start+2,start+3];
    const hideIdx=randInt(1,2);const answer=seq[hideIdx];
    const wrongs=new Set();while(wrongs.size<2){const w=randInt(start-2,start+5);if(w!==answer&&w>0)wrongs.add(w);}
    const options=shuffle([answer,...wrongs]),correctIdx=options.indexOf(answer);
    const trainHtml=seq.map((n,i)=>i===hideIdx?`<span class="lor1-wagon lor1-wagon-empty">?</span>`:`<span class="lor1-wagon">${numHtml(n,28)}</span>`).join('');
    getScreen().querySelector('.lor1-body').innerHTML=`
      <div class="lor1-practice-section">
        <div class="lor1-header-row"><span class="lor1-round-badge">Câu ${state.round}/6</span><span class="lor1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="lor1-question">Toa tàu số mấy? ${speakerBtn('Điền số còn thiếu vào toa tàu')}</p>
        <div class="lor1-train">${trainHtml}</div>
        <div class="lor1-options" id="lor1-opts">${options.map((o,i)=>`<button class="lor1-opt" onclick="window._lessonOrd1.answer(${i},${correctIdx},${answer})">${numHtml(o,36)}</button>`).join('')}</div>
        <div class="lor1-feedback" id="lor1-fb"></div>
      </div>`;
    updateProgress();
  }
  // Dạng 2: Tìm số liền trước/liền sau
  function renderFindNeighbor(){
    const n=randInt(2,18);const askPrev=Math.random()>0.5;
    const answer=askPrev?n-1:n+1;
    const question=askPrev?`Số liền TRƯỚC của ${n}?`:`Số liền SAU của ${n}?`;
    const wrongs=new Set();while(wrongs.size<2){const w=randInt(Math.max(0,n-3),n+3);if(w!==answer&&w>=0)wrongs.add(w);}
    const options=shuffle([answer,...wrongs]),correctIdx=options.indexOf(answer);
    getScreen().querySelector('.lor1-body').innerHTML=`
      <div class="lor1-practice-section">
        <div class="lor1-header-row"><span class="lor1-round-badge">Câu ${state.round}/6</span><span class="lor1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="lor1-question">${question} ${speakerBtn(question)}</p>
        <div class="lor1-target">${numHtml(n,64)}</div>
        <p class="lor1-hint">${askPrev?'Bớt 1: '+n+' − 1 = ?':'Thêm 1: '+n+' + 1 = ?'}</p>
        <div class="lor1-options" id="lor1-opts">${options.map((o,i)=>`<button class="lor1-opt" onclick="window._lessonOrd1.answer(${i},${correctIdx},${answer})">${numHtml(o,36)}</button>`).join('')}</div>
        <div class="lor1-feedback" id="lor1-fb"></div>
      </div>`;
    updateProgress();
  }
  // Dạng 3: Sắp xếp — tap theo thứ tự bé→lớn
  function renderSort(){
    const nums=shuffle([randInt(1,5),randInt(6,10),randInt(11,15),randInt(16,20)]);
    const sorted=[...nums].sort((a,b)=>a-b);
    state._sorted=sorted;state._picked=[];
    const numsHtml=nums.map((n,i)=>`<button class="lor1-sort-item" id="lor1-si-${i}" onclick="window._lessonOrd1.tapSort(${i},${n})">${numHtml(n,32)}</button>`).join('');
    getScreen().querySelector('.lor1-body').innerHTML=`
      <div class="lor1-practice-section">
        <div class="lor1-header-row"><span class="lor1-round-badge">Câu ${state.round}/6</span><span class="lor1-score-badge">${S().named('star',16)} ${state.score}</span></div>
        <p class="lor1-question">Xếp từ BÉ đến LỚN! ${speakerBtn('Xếp từ bé đến lớn')}</p>
        <div class="lor1-sort-items" id="lor1-sort-items">${numsHtml}</div>
        <div class="lor1-sort-slots" id="lor1-sort-slots">${sorted.map((_,i)=>`<span class="lor1-slot" id="lor1-slot-${i}">${i+1}</span>`).join('')}</div>
        <div class="lor1-feedback" id="lor1-fb"></div>
      </div>`;
    updateProgress();
  }
  function tapSort(idx,val){
    const expected=state._sorted[state._picked.length];
    if(val!==expected){playSound('wrong');const el=$('lor1-si-'+idx);if(el)el.classList.add('lor1-sort-shake');setTimeout(()=>{if(el)el.classList.remove('lor1-sort-shake');},400);return;}
    state._picked.push(val);playSound('click');
    const el=$('lor1-si-'+idx);if(el){el.classList.add('lor1-sort-done');el.style.pointerEvents='none';}
    const slot=$('lor1-slot-'+( state._picked.length-1));if(slot){slot.innerHTML=numHtml(val,24);slot.classList.add('lor1-slot-filled');}
    if(state._picked.length>=state._sorted.length){
      state.score++;state.total++;playSound('correct');
      const fb=$('lor1-fb');if(fb)fb.innerHTML=`<div class="lor1-fb-ok">${rand(PRAISE)}</div>`;
      setTimeout(()=>nextPractice(),1400);
    }
  }

  // Answer handler for type 1 & 2
  function answer(picked,correctIdx,ans){
    state.total++;const opts=getScreen().querySelectorAll('.lor1-opt');
    opts.forEach((o,i)=>{o.style.pointerEvents='none';if(i===correctIdx)o.classList.add('lor1-opt-correct');if(i===picked&&i!==correctIdx)o.classList.add('lor1-opt-wrong');});
    const fb=$('lor1-fb');
    if(picked===correctIdx){state.score++;playSound('correct');if(fb)fb.innerHTML=`<div class="lor1-fb-ok">${rand(PRAISE)}</div>`;}
    else{playSound('wrong');if(fb)fb.innerHTML=`<div class="lor1-fb-wrong">${rand(ENCOURAGE)} Đáp án: ${ans}</div>`;}
    setTimeout(()=>nextPractice(),1400);
  }
  // STEP 3: Reward
  function showReward(){
    state.step=3;playSound('win');
    const stars=state.score>=5?3:state.score>=3?2:1;
    const starsHtml=Array.from({length:3},(_,i)=>S().el(2,0,0,i<stars?36:24,i>=stars?'lor1-star-dim':'')).join(' ');
    const msg=stars===3?'Xuất sắc! Đội trưởng Dãy số!':stars===2?'Tốt lắm!':'Cố gắng thêm nhé!';
    getScreen().querySelector('.lor1-body').innerHTML=`
      <div class="lor1-reward">
        <div class="lor1-reward-stars">${starsHtml}</div>
        <h2 class="lor1-reward-title">${msg}</h2>
        <div class="lor1-reward-score">Đúng <strong>${state.score}</strong> / ${state.total} câu</div>
        <div class="lor1-reward-concepts"><div class="lor1-concept">Liền trước = bớt 1</div><div class="lor1-concept">Liền sau = thêm 1</div></div>
        <div class="lor1-reward-actions"><button class="lc-btn lc-btn-secondary" onclick="window._lessonOrd1.restart()">Học lại</button><button class="lc-btn lc-btn-primary" onclick="showScreen('menu-screen')">Về menu</button></div>
      </div>`;
    if(window.HocVuiCollection&&window.HocVuiCollection.reward)window.HocVuiCollection.reward(stars);
    updateProgress();
  }
  function restart(){state={step:0,score:0,total:0,round:0,_picked:[]};_demoRevealed=0;renderDemo();}
  function open(){show();restart();}
  window._lessonOrd1={open,restart,speak,tapHouse,startPractice,answer,tapSort};
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{if(typeof openTopic==='function'){const _o=openTopic;window.openTopic=function(t){if(t==='order1'){window._lessonOrd1.open();return;}_o(t);};}},0);});
})();
