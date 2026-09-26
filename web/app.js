
const $=id=>document.getElementById(id), fields=['hand1','hand2','board','dead'];
const I18N={
 en:{
navCalculator:"Calculator",navGuide:"How to use",navDocs:"Documentation",guideTitle:"How to read the result",guideSteps:"Choose both known hands, select the street, then fill the board. Add only known dead cards. Try a preset example before entering your own cards.",guideEquity:"Equity is expected pot share: each win counts as one pot and each tie as half a pot. Win probability alone excludes ties.",guideLimits:"This model assumes two fixed hands and a fair remaining deck. It does not choose a betting action or estimate unknown hand ranges. Preflop takes longer because every legal board is counted.",
  pageTitle:"Heads-up Exact · Poker Odds Calculator",description:"Exact heads-up Texas Hold’em odds. Enter two known hands, a board, and optional dead cards. All calculations run on your device.",
  eyebrow:"Texas Hold'em · Two known hands",title:"Heads-up odds",subtitle:"Two known hands. Any street. Optional dead cards.",
  player1:"Player 1",player2:"Player 2",board:"Board",preflop:"Preflop",flop:"Flop",turn:"Turn",river:"River",deadCards:"Dead cards",optional:"optional",clear:"Clear",deadHint:"Known folded or unavailable cards.",clearAll:"Clear all cards",calculate:"Calculate exact odds",cancel:"Cancel calculation",
  exPreflop:"Preflop",exFlop:"Flop draw",exTurn:"Turn + dead cards",exRiver:"River split",tapHint:"Tap a card to choose, replace or remove it.",
  showdownEquity:"Showdown equity",chooseCalc:"Choose the cards and calculate.",conditional:"All results are conditional on the cards you know. Equity includes half of each split pot.",player1Caps:"PLAYER 1",player2Caps:"PLAYER 2",
  outcome:"Outcome",boards:"Boards",probability:"Probability",p1Exact:"Player 1 exact equity",exactCounts:"Exact counts & fractions",
  methodNote:"Method: full enumeration of legal board combinations. All calculations run on your device. No random sampling. Percentages are rounded for display. This is not a universal closed-form equity formula.",
  deadNote:"Known dead cards are excluded from the deck. Unknown folded cards and unknown burn cards remain unknown; do not guess them. Assumes a fair remaining deck and showdown without further folds.",
  chooseCard:"Choose a card",removeCard:"Remove card",done:"Done",
  noBoard:"No community cards yet",exampleLoaded:"Example loaded. Calculate to see the result.",needCards:"Choose a card for every empty slot.",
  countingLater:"Counting every legal board…",countingPreflop:"Counting all preflop boards. This may take tens of seconds…",counting:"Counting boards",complete:"Complete. All legal boards counted.",workerError:"Could not start the calculator. Refresh and try again.",cancelled:"Calculation cancelled.",
  p1Wins:"Player 1 wins",p2Wins:"Player 2 wins",tie:"Tie",legalBoards:"legal boards",selectedDead:"dead cards selected. Tap cards to add.",chooseNth:"Choose card {n} of {total}. Used cards are unavailable.",
  card:"card",chooseACard:"choose a card",groups:{hand1:"Player 1",hand2:"Player 2",board:"Board",dead:"Dead cards"},
  suits:{s:"spades",h:"hearts",d:"diamonds",c:"clubs"},ranks:{A:"Ace",K:"King",Q:"Queen",J:"Jack",T:"10"}
 },
 zh:{
navCalculator:"计算器",navGuide:"使用说明",navDocs:"项目文档",guideTitle:"怎么看计算结果",guideSteps:"选好双方已知手牌，选择阶段并填入公共牌；只添加确实已知的死牌。可以先试预设例子，再输入自己的牌。",guideEquity:"底池权益是预期可分得的底池份额：赢牌计一份，平局计半份；单独的赢牌概率不含平局。",guideLimits:"模型假设双方手牌固定、剩余牌堆公平。它不替你决定下注，也不估计未知手牌范围。翻牌前需要遍历所有合法牌面，因此更慢。",
  pageTitle:"单挑精确胜率 · 德州扑克概率计算器",description:"精确计算双人德州扑克摊牌胜率。输入双方已知手牌、公共牌和可选死牌，全部计算都在本机浏览器完成。",
  eyebrow:"德州扑克 · 双方手牌已知",title:"单挑胜率",subtitle:"双方手牌已知。支持所有街道。可选死牌。",
  player1:"玩家 1",player2:"玩家 2",board:"公共牌",preflop:"翻牌前",flop:"翻牌",turn:"转牌",river:"河牌",deadCards:"死牌",optional:"可选",clear:"清除",deadHint:"已知弃牌或不可用的牌。",clearAll:"清空所有牌",calculate:"精确计算胜率",cancel:"取消计算",
  exPreflop:"翻牌前",exFlop:"翻牌听牌",exTurn:"转牌 + 死牌",exRiver:"河牌平分",tapHint:"点击牌面即可选择、替换或移除。",
  showdownEquity:"摊牌权益",chooseCalc:"请选择牌面并开始计算。",conditional:"所有结果都基于你已知的牌。平分底池时，权益按一半计入。",player1Caps:"玩家 1",player2Caps:"玩家 2",
  outcome:"结果",boards:"牌面组合",probability:"概率",p1Exact:"玩家 1 精确权益",exactCounts:"精确计数与分数",
  methodNote:"方法：穷举所有合法公共牌组合。全部计算在你的设备上完成，不使用随机模拟。百分比仅在显示时四舍五入；这不是一个通用的闭式胜率公式。",
  deadNote:"已知死牌会从牌堆中剔除。未知弃牌和未知烧牌仍然保持未知，不应猜测。假设剩余牌堆公平，并且之后不会再有人弃牌。",
  chooseCard:"选择一张牌",removeCard:"移除这张牌",done:"完成",
  noBoard:"尚无公共牌",exampleLoaded:"示例已载入。点击计算查看结果。",needCards:"请为每个空位选择一张牌。",
  countingLater:"正在穷举所有合法牌面…",countingPreflop:"正在计算全部翻牌前组合，可能需要几十秒…",counting:"正在计算牌面",complete:"计算完成。已穷举所有合法牌面。",workerError:"无法启动计算器，请刷新后重试。",cancelled:"计算已取消。",
  p1Wins:"玩家 1 获胜",p2Wins:"玩家 2 获胜",tie:"平局",legalBoards:"个合法牌面",selectedDead:"张死牌已选择。继续点击牌面即可添加。",chooseNth:"选择第 {n}/{total} 张牌。已使用的牌不可选。",
  card:"第",chooseACard:"选择一张牌",groups:{hand1:"玩家 1",hand2:"玩家 2",board:"公共牌",dead:"死牌"},
  suits:{s:"黑桃",h:"红桃",d:"方块",c:"梅花"},ranks:{A:"A",K:"K",Q:"Q",J:"J",T:"10"}
 }
};
let lang=localStorage.getItem('headsUpLang')||((navigator.language||'').toLowerCase().startsWith('zh')?'zh':'en');
const t=k=>I18N[lang][k]??k;
function applyLanguage(){
 document.documentElement.lang=lang==='zh'?'zh-CN':'en';
 document.title=t('pageTitle');
 document.querySelector('meta[name="description"]').setAttribute('content',t('description'));
 document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(I18N[lang][key]!=null)el.textContent=I18N[lang][key];});
 document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
 document.querySelectorAll('[data-lang]').forEach(b=>b.disabled=false);
 $('hand1').setAttribute('aria-label',lang==='zh'?'玩家 1 手牌':'Player 1 hole cards');
 $('hand2').setAttribute('aria-label',lang==='zh'?'玩家 2 手牌':'Player 2 hole cards');
 $('board').setAttribute('aria-label',lang==='zh'?'公共牌':'Community cards');
 $('dead').setAttribute('aria-label',lang==='zh'?'死牌':'Dead cards');
 $('picker-close').setAttribute('aria-label',lang==='zh'?'关闭选牌窗口':'Close card picker');
 $('deck').setAttribute('aria-label',lang==='zh'?'一副牌':'Deck of cards');
 render();
}
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;localStorage.setItem('headsUpLang',lang);applyLanguage();});

const examples=[['As Ah','Kc Kd','',''],['As Qs','9c 9d','Js Ts 9h','Ks 2h'],['As Ah','Kc Kd','2c 7d 9h Js','Ks Kh'],['2s 3s','4c 5d','As Ks Qs Js Ts','']];
const state={hand1:[null,null],hand2:[null,null],board:[],dead:[]};
const suitIcons={s:'♠',h:'♥',d:'♦',c:'♣'};
function groupLabel(group){return I18N[lang].groups[group];}
function cardName(c){return lang==='zh'?I18N.zh.suits[c[1]]+I18N.zh.ranks[c[0]]:(I18N.en.ranks[c[0]]||c[0])+' of '+I18N.en.suits[c[1]];}
let target=null, addingDead=false, returnFocus=null;
function clearResults(){$('results').hidden=true;$('placeholder').hidden=false;}
function changed(){clearResults();$('status').textContent='';$('status').className='';render();}
function face(button,card){
 button.className='playing-card'+(!card?' empty':/[hd]$/.test(card)?' red':'');button.replaceChildren();
 if(!card){button.textContent='+';return;}
 const rank=document.createElement('span');rank.textContent=card[0]==='T'?'10':card[0];
 const suit=document.createElement('span');suit.className='suit';suit.textContent=suitIcons[card[1]];button.append(rank,suit);
}
function slot(group,index,card){
 const b=document.createElement('button');b.type='button';face(b,card);b.dataset.group=group;b.dataset.index=index;
 b.setAttribute('aria-label',groupLabel(group)+' '+t('card')+' '+(index+1)+(card?': '+cardName(card):': '+t('chooseACard')));
 b.onclick=()=>openPicker(group,index);return b;
}
function render(){
 for(const group of fields){
  $(group).replaceChildren();state[group].forEach((card,i)=>$(group).append(slot(group,i,card)));
  if(group==='dead'&&state.dead.length<43)$(group).append(slot(group,state.dead.length,null));
  if(group==='board'&&!state.board.length){const p=document.createElement('span');p.className='muted';p.textContent=t('noBoard');$(group).append(p);}
 }
 $('clear-dead').disabled=!state.dead.length;
 document.querySelectorAll('[data-street]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.street===state.board.length)));
}
function openPicker(group,index){target={group,index};addingDead=group==='dead'&&index===state.dead.length;returnFocus={group,index};renderDeck();$('picker').showModal();}
function renderDeck(){
 const {group,index}=target, current=state[group][index];
 $('picker-title').textContent=groupLabel(group);$('picker-hint').textContent=group==='dead'?state.dead.length+' '+t('selectedDead'):t('chooseNth').replace('{n}',index+1).replace('{total}',state[group].length);
 $('remove-card').hidden=!current;$('deck').replaceChildren();
 for(const suit of ['s','h','d','c']){
  const row=document.createElement('div');row.className='deck-row';row.setAttribute('role','group');row.setAttribute('aria-label',I18N[lang].suits[suit]);
  for(const rank of 'AKQJT98765432'){
   const card=rank+suit,b=document.createElement('button');b.type='button';face(b,card);b.dataset.card=card;b.setAttribute('aria-label',cardName(card));b.setAttribute('aria-pressed',String(card===current));
   b.disabled=fields.some(g=>state[g].some((c,i)=>c===card&&!(g===group&&i===index)));
   b.onclick=()=>chooseCard(card);row.append(b);
  }$('deck').append(row);
 }
}
function chooseCard(card){
 const {group,index}=target;state[group][index]=card;changed();
 if(addingDead&&state.dead.length<43){target.index=state.dead.length;renderDeck();return;}
 const next=state[group].indexOf(null);
 if(group!=='dead'&&next>=0){target.index=next;renderDeck();return;}
 $('picker').close();
}
$('picker-close').onclick=$('picker-done').onclick=()=>$('picker').close();
$('picker').addEventListener('close',()=>{if(returnFocus)document.querySelector('[data-group="'+returnFocus.group+'"][data-index="'+Math.min(returnFocus.index,state[returnFocus.group].length)+'"]')?.focus();target=null;});
$('remove-card').onclick=()=>{const {group,index}=target;if(group==='dead')state.dead.splice(index,1);else state[group][index]=null;changed();$('picker').close();};
$('clear-dead').onclick=()=>{state.dead=[];changed();};
$('reset').onclick=()=>{state.hand1=[null,null];state.hand2=[null,null];state.board=[];state.dead=[];changed();};
for(const b of document.querySelectorAll('[data-street]'))b.onclick=()=>{state.board=Array.from({length:+b.dataset.street},(_,i)=>state.board[i]||null);changed();};
document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{examples[+b.dataset.example].forEach((v,i)=>state[fields[i]]=v?v.split(' '):[]);changed();$('status').textContent=t('exampleLoaded');});
applyLanguage();
let worker=null, cancelJob=null;
$('cancel').onclick=()=>{if(worker)worker.terminate();if(cancelJob)cancelJob(new Error(t('cancelled')));};
const pct=(x,digits=6)=>(100*x).toFixed(digits)+'%';
$('form').onsubmit=async e=>{
 e.preventDefault();clearResults();$('status').className='';
 if(fields.some(g=>state[g].some(c=>!c))){$('status').className='error';$('status').textContent=t('needCards');return;}
 const data=Object.fromEntries(fields.map(id=>[id,state[id].join(' ')]));
 $('status').textContent=data.board.trim()?t('countingLater'):t('countingPreflop');
 const controls=document.querySelectorAll('input,button:not(#cancel)');controls.forEach(b=>b.disabled=true);$('cancel').hidden=false;
 try{
  const r=await new Promise((resolve,reject)=>{
   cancelJob=reject;worker=new Worker('./worker.mjs',{type:'module'});
   worker.onmessage=({data:message})=>{
    if(message.progress){const {done,total}=message.progress;$('status').textContent=t('counting')+': '+done.toLocaleString()+' / '+total.toLocaleString()+' ('+(100*done/total).toFixed(1)+'%)';}
    else if(message.error)reject(new Error(message.error));else resolve(message.result);
   };
   worker.onerror=()=>reject(new Error(t('workerError')));
   worker.postMessage(data);
  });
  $('eq1').textContent=pct(r.equity.decimal,2);$('eq2').textContent=pct(r.opponent_equity.decimal,2);
  $('bar1').style.width=(100*r.equity.decimal)+'%';$('bar2').style.width=(100*r.opponent_equity.decimal)+'%';
  $('outcomes').replaceChildren();
  for(const [label,count,p] of [[t('p1Wins'),r.wins,r.win_probability],[t('p2Wins'),r.losses,r.loss_probability],[t('tie'),r.ties,r.tie_probability]]){
   const tr=document.createElement('tr');for(const v of [label,count.toLocaleString(),pct(p.decimal)]){const td=document.createElement('td');td.textContent=v;tr.append(td);}$('outcomes').append(tr);
  }
  $('space').textContent=r.sample_space+' = '+r.total.toLocaleString()+' '+t('legalBoards');
  $('fraction').textContent=r.equity.fraction;$('raw').textContent=JSON.stringify(r,null,2);
  $('placeholder').hidden=true;$('results').hidden=false;$('status').textContent=t('complete');
 }catch(error){$('status').className='error';$('status').textContent=error.message;}
 finally{if(worker)worker.terminate();worker=null;cancelJob=null;$('cancel').hidden=true;controls.forEach(b=>b.disabled=false);render();}
};
