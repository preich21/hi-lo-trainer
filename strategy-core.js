/* strategy-core.js — shared by strategy.html, table.html and index.html (Level 5).
   Basic strategy tables for every rule set, playing any hand, Hi-Lo deviations,
   expected results (infinite-deck model), explanations and the explanation sheet.
   Pages set RULES (table rules) and may define window.bsRecord(cellId) → {seen,wrong} for the sheet. */

/* ---------- Explanation sheet: styles and markup (added once per page) ---------- */
(function(){
  const css=`:root{--a-h:#24493d;--a-s:#cdd9d2;--a-d:#d8b45a;--a-p:#5b8fd6;--a-r:#a77bd1}
.a-H{background:var(--a-h);color:var(--text)}
.a-S{background:var(--a-s);color:var(--ink)}
.a-D{background:var(--a-d);color:#2a2008}
.a-P{background:var(--a-p);color:#0b1830}
.a-R{background:var(--a-r);color:#1d0f2b}
.scrim{position:fixed;inset:0;background:rgba(3,14,10,.6);z-index:20}
.sheet{position:fixed;left:0;right:0;bottom:0;z-index:21;max-height:86vh;overflow-y:auto;background:var(--felt);border-top:1px solid var(--line);border-radius:20px 20px 0 0;box-shadow:0 -18px 40px rgba(0,0,0,.45);
  padding:18px max(16px,env(safe-area-inset-right,0px)) calc(20px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));animation:rise .18s ease-out}
@keyframes rise{from{transform:translateY(24px);opacity:.5}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.sheet{animation:none}}
.sheet-in{max-width:540px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
.sheet-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.sheet-head h2{font-size:1.3rem;text-wrap:balance}
.sheet-head .play{display:inline-block;margin-top:6px;font:600 .8rem var(--f-mono);padding:3px 9px;border-radius:6px}
.close{appearance:none;border:0;background:rgba(255,255,255,.08);color:var(--text);width:36px;height:36px;border-radius:50%;font-size:1.2rem;cursor:pointer;flex:none}
.close:focus-visible{outline:2px solid var(--brass);outline-offset:2px}
.why{display:flex;flex-direction:column;gap:8px;font-size:.93rem;line-height:1.55;margin:0}
.why p{margin:0;max-width:62ch}
.callout{border-left:3px solid var(--brass);padding:2px 0 2px 10px;color:var(--text)}
.rnote{border-left:3px solid var(--a-p);padding:2px 0 2px 10px;color:var(--muted);font-size:.86rem}
.evt{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.evt th{font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600;text-align:right;padding:4px 0 6px}
.evt th:first-child{text-align:left}
.evt td{padding:8px 0;border-top:1px solid rgba(216,180,90,.14);font-family:var(--f-mono);text-align:right}
.evt td:first-child{font-family:var(--f-body);text-align:left}
.evt tr.best td{color:var(--text);font-weight:600}
.evt tr:not(.best) td{color:var(--muted)}
.chip-s{font:600 .62rem var(--f-body);text-transform:uppercase;letter-spacing:.07em;padding:2px 6px;border-radius:999px;margin-left:6px;vertical-align:1px}
.chip-s.chart{background:var(--brass);color:#2a2008}
.chip-s.top{background:rgba(255,255,255,.12);color:var(--text)}
.sh-small{font-size:.8rem;color:var(--muted);line-height:1.5;margin:0}
.linkish{all:unset;cursor:pointer;color:var(--text);text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:3px}
.linkish:focus-visible{outline:2px solid var(--brass);outline-offset:2px;border-radius:2px}
html.locked{overflow:hidden}
.scrim{touch-action:none}
.sheet{overscroll-behavior:contain}
.ev-head{display:flex;align-items:center;gap:8px;position:relative;margin-top:4px}
.info{appearance:none;border:1px solid var(--line);background:transparent;color:var(--muted);width:22px;height:22px;border-radius:50%;font:600 .78rem/1 var(--f-mono);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0}
.info[aria-expanded="true"]{background:var(--brass);color:#2a2008;border-color:var(--brass)}
.info:focus-visible{outline:2px solid var(--brass);outline-offset:2px}
.tip{position:absolute;top:calc(100% + 8px);left:0;right:0;max-width:340px;z-index:2;background:var(--felt-deep);border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:.84rem;line-height:1.5;color:var(--text);box-shadow:0 10px 24px rgba(0,0,0,.4)}
.tip p{margin:0}.tip p+p{margin-top:6px;color:var(--muted)}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  if(!document.getElementById('sheet'))document.body.insertAdjacentHTML('beforeend',`<div class="scrim" id="scrim" hidden></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" hidden><div class="sheet-in" id="sheet-body"></div></div>`);
})();

/* ---------- Strategy tables (4–8 decks, dealer stands on soft 17, double after split, late surrender) ----------
   Columns: dealer 2 3 4 5 6 7 8 9 10 A.
   H hit · S stand · D double · P split · R surrender (if not offered: hit).
   Adjustments for other rules are applied in actionFor(). */
const UPS=['2','3','4','5','6','7','8','9','10','A'];
const BASE={
  hard:{8:'HHHHHHHHHH',9:'HDDDDHHHHH',10:'DDDDDDDDHH',11:'DDDDDDDDDH',12:'HHSSSHHHHH',13:'SSSSSHHHHH',14:'SSSSSHHHHH',15:'SSSSSHHHRH',16:'SSSSSHHRRR',17:'SSSSSSSSSS'},
  soft:{13:'HHHDDHHHHH',14:'HHHDDHHHHH',15:'HHDDDHHHHH',16:'HHDDDHHHHH',17:'HDDDDHHHHH',18:'SDDDDSSHHH',19:'SSSSSSSSSS',20:'SSSSSSSSSS'},
  pair:{A:'PPPPPPPPPP',10:'SSSSSSSSSS',9:'PPPPPSPPSS',8:'PPPPPPPPPP',7:'PPPPPPHHHH',6:'PPPPPHHHHH',5:'DDDDDDDDHH',4:'HHHPPHHHHH',3:'PPPPPPHHHH',2:'PPPPPPHHHH'}
};
const ACTION={H:'Hit',S:'Stand',D:'Double',P:'Split',R:'Surrender'};
const DEFAULT_RULES={h17:false,holeCard:false,das:true,surrender:false};
let RULES={...DEFAULT_RULES};


function actionFor(cat,row,ui,rules=RULES){
  const up=UPS[ui];
  let a=BASE[cat][row][ui];
  let fallback=null; // what to do if surrender isn't offered
  if(a==='R')fallback='H';
  if(!rules.das&&cat==='pair'){
    if((row==='2'||row==='3')&&(up==='2'||up==='3'))a='H';
    if(row==='4'&&(up==='5'||up==='6'))a='H';
    if(row==='6'&&up==='2')a='H';
  }
  if(rules.h17){
    if(cat==='hard'&&row==='11'&&up==='A')a='D';
    if(cat==='soft'&&row==='18'&&up==='2')a='D';
    if(cat==='soft'&&row==='19'&&up==='6')a='D';
    if(cat==='hard'&&row==='15'&&up==='A'){a='R';fallback='H'}
    if(cat==='hard'&&row==='17'&&up==='A'){a='R';fallback='S'}
    if(cat==='pair'&&row==='8'&&up==='A'){a='R';fallback='P'}
  }
  const surrender=rules.surrender&&rules.holeCard;
  if(a==='R'&&!surrender)a=fallback;
  if(!rules.holeCard){
    if(cat==='hard'&&row==='11'&&(up==='10'||up==='A'))a='H';
    if(cat==='pair'&&row==='8'&&(up==='10'||up==='A'))a='H';
    if(cat==='pair'&&row==='A'&&up==='A')a='H';
  }
  return a;
}
const ROWS=[
  ...Object.keys(BASE.hard).map(r=>['hard',r]),
  ...Object.keys(BASE.soft).map(r=>['soft',r]),
  ...Object.keys(BASE.pair).map(r=>['pair',r])
];
const cellId=(cat,row,ui)=>`${cat}-${row}-${UPS[ui]}`;
function rowLabel(cat,row){
  if(cat==='hard')return `Hard ${row}`;
  if(cat==='soft')return `A,${row-11}`;
  return row==='A'?'A,A':row==='10'?'10,10':`${row},${row}`;
}
function handName(cat,row){
  if(cat==='hard')return `Hard ${row}`;
  if(cat==='soft')return `Soft ${row} (A,${row-11})`;
  return `Pair of ${row==='A'?'Aces':row==='10'?'tens':row+'s'}`;
}

/* ---------- Expected results (infinite-deck model) ----------
   Cards: 1 = Ace … 10 = any ten-value card. Each rank 1/13, tens 4/13.
   With a hole card the dealer has already checked for blackjack, so results are conditional on no dealer blackjack.
   Without a hole card a dealer blackjack takes the whole bet, including doubles and splits. */
const PR=c=>c===10?4/13:1/13;
function addCard(t,s,c){if(c===1){if(t+11<=21){t+=11;s=true}else t+=1}else t+=c;if(t>21&&s){t-=10;s=false}return [t,s]}
const MODEL_CACHE=new Map();
function model(rules=RULES){
  const key=`${rules.h17}|${rules.holeCard}`;
  if(MODEL_CACHE.has(key))return MODEL_CACHE.get(key);
  const memo=new Map();
  const dealerFrom=(t,s)=>{ // → probabilities of ending on [17,18,19,20,21,bust]
    const k=t*2+(s?1:0);
    if(memo.has(k))return memo.get(k);
    let out=[0,0,0,0,0,0];
    if(t>21)out[5]=1;
    else if(t>=18||(t===17&&!(s&&rules.h17)))out[t-17]=1;
    else for(let c=1;c<=10;c++){const [nt,ns]=addCard(t,s,c);const d=dealerFrom(nt,ns);for(let i=0;i<6;i++)out[i]+=PR(c)*d[i]}
    memo.set(k,out);return out;
  };
  const up={};
  for(let u=1;u<=10;u++){
    const [t0,s0]=addCard(0,false,u);
    let dist=[0,0,0,0,0,0],tot=0,pBJ=0;
    for(let c=1;c<=10;c++){
      if((u===1&&c===10)||(u===10&&c===1)){pBJ+=PR(c);continue}
      const [t,s]=addCard(t0,s0,c),d=dealerFrom(t,s);
      for(let i=0;i<6;i++)dist[i]+=PR(c)*d[i];
      tot+=PR(c);
    }
    up[u]={dist:dist.map(x=>x/tot),pBJ};
  }
  const m={up};MODEL_CACHE.set(key,m);return m;
}
const upNum=ui=>ui===9?1:ui+2;
function dealerBust(ui,rules=RULES){const {dist,pBJ}=model(rules).up[upNum(ui)];return rules.holeCard?dist[5]:(1-pBJ)*dist[5]}
function evsFor(cat,row,ui,rules=RULES){
  const {dist,pBJ}=model(rules).up[upNum(ui)];
  const standE=t=>{if(t>21)return -1;let e=dist[5];for(let d=17;d<=21;d++)e+=(t>d?1:t<d?-1:0)*dist[d-17];return e};
  const memo=new Map();
  const best=(t,s)=>{
    if(t>21)return -1;
    const k=t*2+(s?1:0);if(memo.has(k))return memo.get(k);
    const v=Math.max(standE(t),hitE(t,s));memo.set(k,v);return v;
  };
  const hitE=(t,s)=>{let e=0;for(let c=1;c<=10;c++){const [nt,ns]=addCard(t,s,c);e+=PR(c)*(nt>21?-1:best(nt,ns))}return e};
  const dblE=(t,s)=>{let e=0;for(let c=1;c<=10;c++){const [nt]=addCard(t,s,c);e+=PR(c)*standE(nt)}return 2*e};
  let t,s,x=null;
  if(cat==='hard'){t=+row;s=false}
  else if(cat==='soft'){t=+row;s=true}
  else{x=row==='A'?1:+row;[t,s]=addCard(...addCard(0,false,x),x)}
  const adj=(e,mult)=>rules.holeCard?e:(1-pBJ)*e-pBJ*mult;
  const out={S:adj(standE(t),1),H:adj(hitE(t,s),1),D:adj(dblE(t,s),2)};
  if(x!==null){
    let h=0;
    for(let c=1;c<=10;c++){
      const [nt,ns]=addCard(...addCard(0,false,x),c);
      h+=PR(c)*(x===1?standE(nt):Math.max(best(nt,ns),rules.das?dblE(nt,ns):-Infinity));
    }
    out.P=adj(2*h,2);
  }
  if(rules.surrender&&rules.holeCard)out.R=-0.5;
  return out;
}

/* ---------- Explanations ---------- */
const upName=ui=>UPS[ui]==='A'?'Ace':UPS[ui];
const art=ui=>UPS[ui]==='A'?'an Ace':UPS[ui]==='8'?'an 8':'a '+UPS[ui];
const pct=x=>Math.round(x*100);
function bustLine(ui){return `A dealer ${upName(ui)} busts about ${pct(dealerBust(ui))}% of the time${RULES.holeCard?' once they have checked for blackjack':''}.`}
const FREE=`A soft hand can't bust with one card: if you go over 21, the Ace simply counts as 1.`;
function explain(cat,row,ui,a){
  const u=ui+2, up=upName(ui), B=bustLine(ui);
  const surr=t=>`${t} against a dealer ${up} loses more than half your bet on average, whether you hit or stand. Surrendering costs exactly half, so it's the cheaper option.`;
  if(cat==='hard'){
    const t=+row;
    if(a==='R')return [surr(t)];
    if(t<=8)return [`With ${t} you can't bust with one more card, and the total is too low to be worth doubling. Take a card.`];
    if(t===9){
      if(a==='D')return [`9 becomes 19 with a ten, the most likely next card. Against a weak dealer card like ${up} that makes you the favourite, so put more money on the table and double.`];
      if(u===2)return [`Against 3–6 you double 9, because 19 is likely and the dealer is weak.`,`Exception: a dealer 2 busts less often than 3–6, so doubling 9 doesn't quite pay. Just hit.`];
      return [`Against a dealer ${up} the dealer usually finishes on 17–21. 9 isn't strong enough to double into that, so just hit.`];
    }
    if(t===10){
      if(a==='D')return [`10 becomes 20 with a ten, the most likely next card. That beats what a dealer ${up} usually ends with, so double.`];
      return [`A dealer ${up} starts at least as strong as your 10, so doubling doesn't pay. Hit.`];
    }
    if(t===11){
      if(a==='D')return [`11 is the best total to double: every ten makes 21, and one card can't bust you.`];
      if(u===11&&!RULES.h17)return [`Normally you double 11. An Ace is the dealer's strongest card, and when the dealer stands on soft 17, doubling comes out slightly worse than hitting.${RULES.holeCard?'':' Without a hole card it is even clearer, because a dealer blackjack would also take your doubled bet.'}`];
      return [`Normally you double 11. Without a hole card the dealer hasn't checked for blackjack, and a dealer blackjack would also take your doubled bet. Against ${art(ui)} that risk tips it to hitting.`];
    }
    if(t===12){
      if(a==='S')return [`12 is a stiff hand: hitting busts on any ten, about 31% of cards. ${B} Let the dealer take the risk and stand.`];
      if(u<=3)return [`12 is a stiff hand, and against the dealer's 4–6 you stand.`,`Exception: a dealer 2 or 3 busts less often, while 12 only busts on a ten. Hitting is slightly better here.`];
    }
    if(t<=16){
      if(a==='S')return [`${t} is a stiff hand: one more card busts you often. ${B} The dealer has to keep hitting until 17, so stand and let them bust.`];
      return [`A dealer ${up} busts only about ${pct(dealerBust(ui))}% of the time and usually finishes on 17–21. Standing on ${t} only wins when the dealer busts, so you have to take the risk and hit.`];
    }
    return [`Hitting 17 busts on any 5 or higher, about 69% of cards. Always stand on hard 17.`];
  }
  if(cat==='soft'){
    const t=+row,x=t-11,name=`Soft ${t} (A,${x})`;
    if(t<=17){
      if(a==='D')return [`${name} is weak on its own, but one more card can't hurt it. ${FREE} ${B} Against that, it pays to double and take the card at twice the bet.`];
      return [`${name} is weak on its own${t===17?' and only wins when the dealer busts':''}. ${FREE} So improve it by hitting.${t===17?' Never stand on soft 17.':''}`];
    }
    if(t===18){
      if(a==='D')return [`${B} Against that, doubling soft 18 earns more than standing, even though the extra card can leave you with a weaker total.`];
      if(a==='H')return [`A dealer ${up} often reaches 19 or 20, so soft 18 loses more than it wins. ${FREE} Hit and try to improve.`];
      if(u===2)return [`Soft 18 beats a dealer who ends on 17 and ties one who ends on 18.`,`Against 3–6 you double soft 18. A dealer 2 busts less often, so here standing is better.`];
      return [`Soft 18 beats a dealer who ends on 17 and ties one who ends on 18. With ${art(ui)} showing, those are the dealer's most likely results, so stand.`];
    }
    if(a==='D')return [`Soft 19 is a strong hand, but when the dealer hits soft 17, a dealer 6 busts often enough that doubling earns slightly more than standing.`];
    return [`${name} is a strong hand. Stand.`];
  }
  const r=row;
  if(a==='R')return [`Normally you always split 8s. But against an Ace when the dealer hits soft 17, 16 is so bad that surrendering loses less than splitting.`];
  if(r==='A'){
    if(a==='P')return [`Two Aces count as soft 12, a weak hand. Split them, and each Ace becomes 21 with a ten or a solid hand with most other cards. You usually get only one card per Ace after splitting.`];
    return [`Normally you always split Aces. Without a hole card a dealer blackjack would take both split bets, and against an Ace that risk is high enough that hitting soft 12 is better.`];
  }
  if(r==='10')return [`20 is one of the best hands in the game. Splitting tens trades it for two hands that start with 10. Always stand.`];
  if(r==='9'){
    if(a==='P')return [`18 is good but not great. Against a dealer ${up}, two hands starting with 9 earn more than one 18.`];
    if(u===7)return [`Normally you split 9s against the dealer's small and medium cards.`,`Exception: against a 7 the dealer's most likely result is 17, which your 18 already beats. Stand.`];
    return [`Against a dealer ${up} both 18 and two hands starting with 9 lose more than they win. Standing on 18 loses the least.`];
  }
  if(r==='8'){
    if(a==='P')return [`16 is the worst hand in blackjack. Two hands starting with 8 are much better, so split 8s.`];
    return [`Normally you always split 8s. Without a hole card a dealer blackjack would take both split bets, so against ${art(ui)} you play 16 and hit instead.`];
  }
  if(r==='7'){
    if(a==='P')return [`14 is a stiff hand. Against a dealer ${up}, two hands starting with 7 do better than playing 14.`];
    return [`Against a dealer ${up}, two 7s are too weak to split. Play the hand as a stiff 14 and hit.`];
  }
  if(r==='6'){
    if(a==='P')return [`12 is a stiff hand. Against a weak dealer card like ${up}, two hands starting with 6 do better.`];
    return [`Against a dealer ${up}, two 6s don't make two good hands. Play 12 and hit.`];
  }
  if(r==='5')return [`Never split 5s: two hands starting with 5 are weak, but 10 is a great total. Play it as a hard 10${a==='D'?' and double':' and hit'} against a dealer ${up}.`];
  if(r==='4'){
    if(a==='P')return [`Against a dealer 5 or 6, which bust often, splitting 4s pays because you can double when either hand draws a good card.`];
    return [`Two 4s make a hard 8: one card can't bust you. Hit.`];
  }
  if(a==='P')return [`${2*+r} is a weak start. Against a dealer ${up}, two hands do better, especially when you can double after splitting.`];
  return [`Against a dealer ${up}, two small hands are too weak to split. Hit.`];
}
const RULE_FLIP={
  holeCard:{label:v=>v?'At a table with a hole card':'At a table without a hole card',why:'Without a hole card the dealer only checks for blackjack at the end, and a dealer blackjack then also takes the extra money you put in by doubling or splitting.'},
  h17:{label:v=>v?'If the dealer hits soft 17':'If the dealer stands on soft 17',why:'A dealer who hits soft 17 busts a little more often but also improves some 17s, which shifts these close decisions.'},
  das:{label:v=>v?'If doubling after a split is allowed':'If doubling after a split is not allowed',why:'Being able to double after splitting makes splitting small pairs worth it against weak dealer cards.'},
  surrender:{label:v=>v?'If surrender is offered':'Without surrender',why:'Surrender only pays when a hand loses more than half the bet on average.'}
};
function ruleNotes(cat,row,ui,a){
  const notes=[];
  for(const k of Object.keys(RULE_FLIP)){
    if(k==='surrender'&&!RULES.holeCard)continue;
    const alt={...RULES,[k]:!RULES[k]};
    const b=actionFor(cat,row,ui,alt);
    if(b!==a)notes.push(`${RULE_FLIP[k].label(alt[k])}: ${ACTION[b].toLowerCase()} instead. ${RULE_FLIP[k].why}`);
  }
  return notes;
}

/* ---------- Explanation sheet ---------- */
const sheet=document.getElementById('sheet'),scrim=document.getElementById('scrim');
let sheetReturn=null,sheetOnClose=null;
const fmtEV=e=>(e>=0?'+':'−')+Math.abs(e).toFixed(3);
const fmtEur=e=>(e>=0?'+':'−')+'€'+Math.abs(e*10).toFixed(2);
function openSheet(cat,row,ui,onClose){
  const a=actionFor(cat,row,ui),ev=evsFor(cat,row,ui);
  const rows=Object.entries(ev).sort((x,y)=>y[1]-x[1]);
  const top=rows[0][0],gap=rows[0][1]-rows[1][1];
  const paras=explain(cat,row,ui,a);
  const notes=ruleNotes(cat,row,ui,a);
  const st=window.bsRecord?window.bsRecord(cellId(cat,row,ui)):null;
  let modelNote='';
  if(top!==a)modelNote=`<p class="sh-small">In this simplified model, ${ACTION[top].toLowerCase()} comes out ahead by ${(ev[top]-ev[a]).toFixed(3)}. The chart is worked out for a real 4–8 deck shoe, where the cards already dealt shift the odds very slightly. Follow the chart.</p>`;
  else if(gap<0.02)modelNote=`<p class="sh-small">Close call: the two best options are less than €0.20 apart per €10 bet.</p>`;
  document.getElementById('sheet-body').innerHTML=`
    <div class="sheet-head"><div><h2 id="sheet-title">${handName(cat,row)} vs dealer ${upName(ui)}</h2><span class="play a-${a}">${ACTION[a]}</span></div>
      <button class="close" id="sheet-close" aria-label="Close">×</button></div>
    <div class="why">${paras.map((p,i)=>`<p${i>0?' class="callout"':''}>${p}</p>`).join('')}${notes.map(n=>`<p class="rnote">${n}</p>`).join('')}</div>
    <div class="ev-head"><h3 id="ev-title">Expected results</h3><button type="button" class="info" id="ev-info" aria-expanded="false" aria-controls="ev-tip" aria-label="What do these numbers mean?">i</button>
      <div class="tip" id="ev-tip" role="note" hidden><p>What each option wins or loses on average, assuming you play the rest of the hand correctly. Negative means the hand loses money on average; the chart picks the option that loses least or wins most.</p><p>${RULES.holeCard?'The dealer has already checked for blackjack.':'Includes the chance that the dealer has blackjack.'} Calculated for your table rules with a simplified infinite-deck model.</p></div></div>
    <table class="evt" aria-labelledby="ev-title"><thead><tr><th>Option</th><th>Per bet</th><th>Per €10</th></tr></thead><tbody>
      ${rows.map(([k,v])=>`<tr class="${k===a?'best':''}"><td>${ACTION[k]}${k===a?'<span class="chip-s chart">Chart</span>':''}${k===top&&k!==a?'<span class="chip-s top">Model</span>':''}</td><td>${fmtEV(v)}</td><td>${fmtEur(v)}</td></tr>`).join('')}
    </tbody></table>
    ${modelNote}
    ${st?`<p class="sh-small">Your record on this hand: ${st.seen-st.wrong} of ${st.seen} right.</p>`:''}`;
  sheetReturn=document.activeElement;sheetOnClose=onClose||null;
  scrim.hidden=false;sheet.hidden=false;sheet.scrollTop=0;
  document.documentElement.classList.add('locked');
  const info=document.getElementById('ev-info'),tip=document.getElementById('ev-tip');
  info.onclick=e=>{e.stopPropagation();const open=tip.hidden;tip.hidden=!open;info.setAttribute('aria-expanded',open)};
  document.getElementById('sheet-close').onclick=closeSheet;
  document.getElementById('sheet-close').focus();
}
function closeSheet(){
  if(sheet.hidden)return;
  sheet.hidden=true;scrim.hidden=true;
  document.documentElement.classList.remove('locked');
  const cb=sheetOnClose;sheetOnClose=null;
  if(sheetReturn&&document.contains(sheetReturn))sheetReturn.focus();
  if(cb)cb();
}
scrim.onclick=closeSheet;
function closeTip(){const t=document.getElementById('ev-tip');if(t&&!t.hidden){t.hidden=true;document.getElementById('ev-info').setAttribute('aria-expanded','false');return true}return false}
sheet.addEventListener('click',e=>{if(!e.target.closest('#ev-tip,#ev-info'))closeTip()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden){e.preventDefault();if(!closeTip())closeSheet()}});

/* ---------- Playing any hand (three cards and more, after splits) ---------- */
const RANK_VAL=r=>r==='A'?1:(r==='J'||r==='Q'||r==='K'||r==='10')?10:+r;
function handTotal(cards){let t=0,aces=0;for(const c of cards){const v=RANK_VAL(c.r);t+=v;if(v===1)aces++}let soft=false;if(aces&&t+10<=21){t+=10;soft=true}return {total:t,soft}}
const upIndex=rank=>{const v=RANK_VAL(rank);return v===1?9:v-2};
function classify(cards,canSplit){
  const {total,soft}=handTotal(cards);
  if(cards.length===2&&canSplit){const a=RANK_VAL(cards[0].r),b=RANK_VAL(cards[1].r);if(a===b)return {cat:'pair',row:a===1?'A':String(a),total,soft}}
  if(total>=21)return {cat:'done',total,soft};
  if(soft&&total>=13)return {cat:'soft',row:String(total),total,soft};
  if(soft)return {cat:'soft12',total,soft};
  return {cat:'hard',row:String(Math.min(17,Math.max(8,total))),total,soft};
}
/* opt: {canDouble, canSplit, canSurrender}. Returns {a, cat, row, ui}. */
function basicPlay(cards,upRank,opt,rules=RULES){
  const ui=upIndex(upRank),k=classify(cards,opt.canSplit);
  if(k.cat==='done')return {a:'S',cat:k.cat,ui};
  if(k.cat==='soft12')return {a:'H',cat:k.cat,ui};
  let a=actionFor(k.cat,k.row,ui,{...rules,surrender:rules.surrender&&!!opt.canSurrender});
  if(a==='D'&&!opt.canDouble)a=(k.cat==='soft'&&(k.row==='18'||k.row==='19'))?'S':'H';
  return {a,cat:k.cat,row:k.row,ui};
}

/* ---------- Hi-Lo deviations: Illustrious 18 + Fab 4 (multi-deck) ----------
   "at": play this at or above the index. "below": play this below the index. Otherwise the chart.
   Fab 4 entries only apply where surrender is offered. Insurance is handled by insuranceIndex. */
const INSURANCE_INDEX=3;
const DEVIATIONS=[
  {cat:'hard',row:'16',up:'10',index:0,at:'S'},
  {cat:'hard',row:'15',up:'10',index:4,at:'S'},
  {cat:'pair',row:'10',up:'5',index:5,at:'P'},
  {cat:'pair',row:'10',up:'6',index:4,at:'P'},
  {cat:'hard',row:'10',up:'10',index:4,at:'D'},
  {cat:'hard',row:'12',up:'3',index:2,at:'S'},
  {cat:'hard',row:'12',up:'2',index:3,at:'S'},
  {cat:'hard',row:'11',up:'A',index:1,at:'D'},
  {cat:'hard',row:'9',up:'2',index:1,at:'D'},
  {cat:'hard',row:'10',up:'A',index:4,at:'D'},
  {cat:'hard',row:'9',up:'7',index:3,at:'D'},
  {cat:'hard',row:'16',up:'9',index:5,at:'S'},
  {cat:'hard',row:'13',up:'2',index:-1,below:'H'},
  {cat:'hard',row:'12',up:'4',index:0,below:'H'},
  {cat:'hard',row:'12',up:'5',index:-2,below:'H'},
  {cat:'hard',row:'12',up:'6',index:-1,below:'H'},
  {cat:'hard',row:'13',up:'3',index:-2,below:'H'},
  {cat:'hard',row:'14',up:'10',index:3,at:'R',fab:true},
  {cat:'hard',row:'15',up:'10',index:0,at:'R',fab:true},
  {cat:'hard',row:'15',up:'9',index:2,at:'R',fab:true},
  {cat:'hard',row:'15',up:'A',index:1,at:'R',fab:true}
];
const fmtTC=v=>v>0?'+'+v:v<0?'−'+Math.abs(v):'0';
function devFind(cat,row,up,fab){return DEVIATIONS.find(d=>!!d.fab===fab&&d.cat===cat&&d.row===row&&d.up===up)}
function applyI18(base,tc,opt){
  if(base.a==='R'||!base.row)return {...base,dev:null};
  const d=devFind(base.cat,base.row,UPS[base.ui],false);
  if(!d)return {...base,dev:null};
  let a=base.a;
  if(d.at!==undefined){if(tc>=d.index)a=d.at}else if(tc<d.index)a=d.below;
  if((a==='D'&&!opt.canDouble)||(a==='P'&&!opt.canSplit))a=base.a;
  return {...base,a,dev:a!==base.a?d:null,chart:base.a};
}
/* The play a counter makes: basic strategy, changed by the deviations at this true count. */
function countedPlay(cards,upRank,opt,rules,tc){
  const base=basicPlay(cards,upRank,opt,rules);
  if(!base.row)return {...base,dev:null};
  const sur=rules.surrender&&rules.holeCard&&opt.canSurrender;
  const fab=sur?devFind(base.cat,base.row,UPS[base.ui],true):null;
  if(fab){
    if(tc>=fab.index)return {...base,a:'R',dev:base.a==='R'?null:fab,chart:base.a};
    const noSur=basicPlay(cards,upRank,{...opt,canSurrender:false},rules);
    const r=applyI18(noSur,tc,opt);
    return {...r,dev:r.a!==base.a?(r.dev||fab):null,chart:base.a};
  }
  return applyI18(base,tc,opt);
}
function devText(d,chart){
  if(d.at!==undefined)return `Deviation: ${rowLabel(d.cat,d.row)} vs ${d.up==='A'?'Ace':d.up}, ${ACTION[d.at].toLowerCase()} at true count ${fmtTC(d.index)} or higher (the chart says ${ACTION[chart].toLowerCase()}).`;
  return `Deviation: ${rowLabel(d.cat,d.row)} vs ${d.up==='A'?'Ace':d.up}, ${ACTION[d.below].toLowerCase()} below true count ${fmtTC(d.index)} (the chart says ${ACTION[chart].toLowerCase()}).`;
}
