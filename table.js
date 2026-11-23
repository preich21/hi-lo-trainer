/* table.js — shared blackjack table for Level 5 (index.html) and full play (table.html).
   Shoe with cut card, round engine (real dealing order, hole card or European no-hole-card,
   insurance, peek, hit / stand / double / split / surrender, dealer S17/H17, payouts),
   table view and discard tray. Needs strategy-core.js (handTotal, RANK_VAL, basicPlay).
   Everything lives under window.TBL. */
(function(){
const TBL={};
const RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS=[['♠',0],['♥',1],['♦',1],['♣',0]];
TBL.hilo=r=>{const v=RANK_VAL(r);return v>=2&&v<=6?1:v>=7&&v<=9?0:-1};
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}

/* ---------- Shoe ---------- */
TBL.Shoe=class{
  constructor(decks,penetration=1){
    this.decks=decks;this.cards=[];
    for(let d=0;d<decks;d++)for(const r of RANKS)for(const [s,red] of SUITS)this.cards.push({r,s,red});
    shuffle(this.cards);
    this.pos=0;this.cut=Math.round(decks*52*penetration);
  }
  draw(){return this.cards[this.pos++]}
  get dealt(){return this.pos}
  get left(){return this.cards.length-this.pos}
  decksLeft(){return this.left/52}
  pastCut(){return this.pos>=this.cut}
};

/* ---------- Pacing that can be cancelled (leaving the page, Stop, new shoe) ---------- */
class Abort extends Error{}
TBL.isAbort=e=>e instanceof Abort;
TBL.Pacer=class{
  constructor(){this.dead=false;this.timers=new Set();this.waits=new Set()}
  sleep(ms){return new Promise((res,rej)=>{
    if(this.dead)return rej(new Abort());
    const t=setTimeout(()=>{this.timers.delete(t);this.dead?rej(new Abort()):res()},ms);
    this.timers.add(t);
  })}
  /* Wait for the user: fn(resolve) sets up the UI and calls resolve(value). */
  wait(fn){return new Promise((res,rej)=>{
    if(this.dead)return rej(new Abort());
    const w={rej};this.waits.add(w);
    fn(v=>{this.waits.delete(w);this.dead?rej(new Abort()):res(v)});
  })}
  kill(){this.dead=true;this.timers.forEach(clearTimeout);this.waits.forEach(w=>w.rej(new Abort()));this.timers.clear();this.waits.clear()}
};

/* ---------- One round ----------
   o = {shoe, rules, interval (s per card), pacer, view,
        seats:[{name, human, bet}],
        decide(seatIdx, handIdx, hand, opt, ctx) → Promise<'H'|'S'|'D'|'P'|'R'>,
        insurance(seatIdx, ctx) → Promise<bool>   (only asked for human seats),
        onCard(card)  every card the moment it is visible }
   Returns {seats (with hands, net), dealer, dealerBJ}. */
const isBJ=cs=>cs.length===2&&handTotal(cs).total===21;
TBL.isBJ=isBJ;
TBL.playRound=async function(o){
  const {shoe,rules,view}=o;
  const gap=()=>o.pacer.sleep(o.interval*1000);
  const seats=o.seats.map((s,i)=>({...s,i,hands:[{cards:[],bet:s.bet||1}],insured:false,net:0}));
  const dealer={cards:[],hole:null};
  const ctx={seats,dealer,rules};
  const seen=c=>{if(o.onCard)o.onCard(c)};
  const give=async(s,h,c)=>{c._new=true;h.cards.push(c);seen(c);view.seat(s);await gap();c._new=false};
  const dealerCard=async(c,faceDown)=>{c._new=true;if(faceDown)dealer.hole=c;else{dealer.cards.push(c);seen(c)}view.dealer(dealer);await gap();c._new=false};
  const reveal=async()=>{const c=dealer.hole;dealer.hole=null;c._new=true;dealer.cards.push(c);seen(c);view.dealer(dealer);await gap();c._new=false};
  view.start(seats,dealer);

  for(const s of seats)await give(s,s.hands[0],shoe.draw());
  await dealerCard(shoe.draw(),false);
  for(const s of seats)await give(s,s.hands[0],shoe.draw());
  if(rules.holeCard)await dealerCard(shoe.draw(),true);
  const up=dealer.cards[0].r,upV=RANK_VAL(up);

  for(const s of seats)if(isBJ(s.hands[0].cards))s.hands[0].bj=true;
  if(upV===1)for(const s of seats)s.insured=s.human?!!(await o.insurance(s.i,ctx)):false;
  if(rules.holeCard&&(upV===1||upV===10)){
    if(isBJ([dealer.cards[0],dealer.hole])){await reveal();return finish(true)}
    view.note('Dealer checked: no blackjack');
  }

  for(const s of seats){
    for(let hi=0;hi<s.hands.length;hi++){
      const h=s.hands[hi];
      view.focus(s.i,hi);
      if(h.cards.length===1)await give(s,h,shoe.draw());
      if(!h.split&&s.hands.length===1&&isBJ(h.cards)){h.bj=true;view.seat(s);continue}
      if(h.splitAces)continue;
      while(true){
        if(handTotal(h.cards).total>=21)break;
        const opt={
          canDouble:h.cards.length===2&&(!h.split||rules.das),
          canSplit:h.cards.length===2&&RANK_VAL(h.cards[0].r)===RANK_VAL(h.cards[1].r)&&s.hands.length<4,
          canSurrender:rules.surrender&&rules.holeCard&&h.cards.length===2&&s.hands.length===1
        };
        const a=await o.decide(s.i,hi,h,opt,ctx);
        if(a==='S')break;
        if(a==='H'){await give(s,h,shoe.draw());continue}
        if(a==='D'&&opt.canDouble){h.bet*=2;h.doubled=true;await give(s,h,shoe.draw());break}
        if(a==='R'&&opt.canSurrender){h.surrendered=true;view.seat(s);break}
        if(a==='P'&&opt.canSplit){
          const aces=RANK_VAL(h.cards[0].r)===1;
          const moved=h.cards.pop();
          h.split=true;h.splitAces=aces;
          s.hands.splice(hi+1,0,{cards:[moved],bet:h.bet,split:true,splitAces:aces});
          view.seat(s);
          await give(s,h,shoe.draw());
          if(aces)break;
          continue;
        }
        break; /* an action that isn't allowed counts as stand */
      }
      view.seat(s);
    }
  }
  view.focus(null);

  const live=seats.some(s=>s.hands.some(h=>!h.surrendered&&!h.bj&&handTotal(h.cards).total<=21));
  if(rules.holeCard)await reveal();
  else await dealerCard(shoe.draw(),false);
  const dbj=isBJ(dealer.cards);
  if(live&&!dbj){
    while(true){
      const {total,soft}=handTotal(dealer.cards);
      if(total>21||total>=18||(total===17&&!(soft&&rules.h17)))break;
      await dealerCard(shoe.draw(),false);
    }
  }
  return finish(dbj);

  function finish(dbj){
    const d=handTotal(dealer.cards).total;
    for(const s of seats){
      let net=0;
      if(s.insured){const ins=s.hands[0].bet/2;s.insNet=dbj?2*ins:-ins;net+=s.insNet}
      for(const h of s.hands){
        const t=handTotal(h.cards).total;
        if(h.surrendered){h.net=-h.bet/2;h.res='Surrender'}
        else if(h.bj){h.net=dbj?0:1.5*h.bet;h.res=dbj?'Push':'Blackjack'}
        else if(dbj){h.net=-h.bet;h.res='Dealer blackjack'}
        else if(t>21){h.net=-h.bet;h.res='Bust'}
        else if(d>21||t>d){h.net=h.bet;h.res='Win'}
        else if(t<d){h.net=-h.bet;h.res='Lose'}
        else{h.net=0;h.res='Push'}
        net+=h.net;
      }
      s.net=net;
    }
    view.results(seats,dealer,dbj);
    return {seats,dealer,dealerBJ:dbj};
  }
};

/* Computer players: perfect basic strategy for the table rules. */
TBL.botDecide=(rules)=>async(si,hi,h,opt,ctx)=>basicPlay(h.cards,ctx.dealer.cards[0].r,opt,rules).a;

/* ---------- Table view ---------- */
const css=`
.tbl{display:flex;flex-direction:column;gap:12px;width:100%}
.tbl-top{display:flex;align-items:flex-start;justify-content:center;gap:14px}
.tbl-dealer{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.tbl-lbl{font-size:.72rem;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.tbl-lbl b{color:var(--text);font-weight:600;font-family:var(--f-mono)}
.tbl-note{font-size:.72rem;color:var(--muted);min-height:1em}
.tbl-seats{display:grid;grid-template-columns:repeat(var(--cols,4),minmax(0,1fr));gap:8px 6px}
.tbl-seat{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 2px;border-radius:12px;border:1px solid transparent;min-width:0}
.tbl-seat.me{border-color:var(--brass);background:rgba(216,180,90,.06)}
.tbl-seat.empty{opacity:.35}
.tbl-hands{display:flex;flex-wrap:wrap;gap:4px 8px;justify-content:center;min-height:var(--mch,46px)}
.tbl-hand{display:flex;flex-direction:column;align-items:center;gap:3px;border-radius:8px;padding:2px}
.tbl-hand.focus{outline:2px solid var(--brass);outline-offset:1px}
.mcs{display:flex;padding-right:var(--mco,14px)}
.mc{width:var(--mcw,32px);height:var(--mch,46px);margin-right:calc(-1 * var(--mco,14px));background:var(--ivory);color:var(--ink);border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:flex-start;padding:2px 3px;font:600 var(--mcf,.72rem)/1 var(--f-display);flex:none}
.mc i{font-style:normal;font-size:.9em}
.mc.r{color:var(--red)}
.mc.back{background:repeating-linear-gradient(45deg,#7a2430 0 4px,#8f2c39 4px 8px);border:2px solid var(--ivory)}
.mc.new{animation:mcin .14s ease-out}
@keyframes mcin{from{transform:translateY(-8px);opacity:.3}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.mc.new{animation:none}}
.res{font:600 .66rem var(--f-body);padding:1px 6px;border-radius:999px;white-space:nowrap}
.res.win{background:rgba(63,191,111,.2);color:#9ee6b6}
.res.lose{background:rgba(226,72,79,.18);color:#ffb3b6}
.res.push{background:rgba(255,255,255,.1);color:var(--text)}
.tbl.big .tbl-dealer{--mcw:44px;--mch:62px;--mco:22px;--mcf:.95rem}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

const mc=c=>`<div class="mc${c.red?' r':''}${c._new?' new':''}">${c.r}<i>${c.s}</i></div>`;
const back=c=>`<div class="mc back${c&&c._new?' new':''}" aria-label="face-down card"></div>`;
function totalText(cards){if(!cards.length)return '';const {total,soft}=handTotal(cards);return total>21?`${total} bust`:soft&&total<21?`soft ${total}`:String(total)}
TBL.totalText=totalText;
TBL.mcHTML=mc;
function resBadge(h){
  if(!h.res)return '';
  const n=h.net,cls=n>0?'win':n<0?'lose':'push';
  const amt=n===0?'':` ${n>0?'+':'−'}${String(+Math.abs(n).toFixed(2))}`;
  return `<span class="res ${cls}">${h.res}${amt}</span>`;
}
TBL.View=class{
  /* root: element; opts: {seats: number, me: index or null, big: bool (large dealer cards), tray: html fn or null} */
  constructor(root,opts){
    this.root=root;this.o=opts;
    const cols=opts.seats<=4?opts.seats:4;
    root.innerHTML=`<div class="tbl${opts.big?' big':''}">
      <div class="tbl-top"><div class="tbl-dealer"><span class="tbl-lbl">Dealer <b data-dt></b></span><div class="mcs" data-dc></div><span class="tbl-note" data-note></span></div>${opts.tray?'<div data-tray></div>':''}</div>
      <div class="tbl-seats" style="--cols:${cols};${cols<=2?'--mcw:44px;--mch:62px;--mco:22px;--mcf:.95rem':cols===3?'--mcw:38px;--mch:54px;--mco:18px;--mcf:.85rem':'--mco:20px'}">${Array.from({length:opts.seats},(_,i)=>`<div class="tbl-seat${i===opts.me?' me':''}" data-s="${i}"><div class="tbl-hands"></div><span class="tbl-lbl">${i===opts.me?'You':'Seat '+(i+1)}</span></div>`).join('')}</div>
    </div>`;
    this.dc=root.querySelector('[data-dc]');this.dt=root.querySelector('[data-dt]');this.nt=root.querySelector('[data-note]');
    this.trayEl=root.querySelector('[data-tray]');
    this.focused=null;
  }
  start(seats,dealer){this.seats=seats;this.dealerM=dealer;this.focused=null;this.nt.textContent='';seats.forEach(s=>this.seat(s));this.dealer(dealer);if(this.onUpdate)this.onUpdate()}
  clear(){this.root.querySelectorAll('.tbl-hands').forEach(e=>e.innerHTML='');this.dc.innerHTML='';this.dt.textContent='';this.nt.textContent='';if(this.onUpdate)this.onUpdate()}
  seat(s){
    const el=this.root.querySelector(`[data-s="${s.i}"] .tbl-hands`);
    el.innerHTML=s.hands.map((h,hi)=>`<div class="tbl-hand${this.focused&&this.focused[0]===s.i&&this.focused[1]===hi?' focus':''}"><div class="mcs">${h.cards.map(mc).join('')}</div><span class="tbl-lbl"><b>${totalText(h.cards)}</b>${h.doubled?' ×2':''}${h.surrendered?' · surrendered':''}</span>${resBadge(h)}</div>`).join('');
    if(this.onUpdate)this.onUpdate(s);
  }
  dealer(d){
    this.dc.innerHTML=d.cards.map(mc).join('')+(d.hole?back(d.hole):'');
    this.dt.textContent=d.cards.length?totalText(d.cards):'';
    if(this.onUpdate)this.onUpdate();
  }
  focus(si,hi){const prev=this.focused;this.focused=si==null?null:[si,hi];if(this.seats){if(prev)this.seat(this.seats[prev[0]]);if(si!=null)this.seat(this.seats[si])}}
  note(t){this.nt.textContent=t}
  results(seats,dealer,dbj){seats.forEach(s=>this.seat(s));this.note(dbj?'Dealer blackjack':handTotal(dealer.cards).total>21?'Dealer busts':'');if(this.onUpdate)this.onUpdate()}
  setTray(html){if(this.trayEl)this.trayEl.innerHTML=html}
};

/* ---------- Discard tray (side view, to scale) ---------- */
TBL.trayHTML=function(inTray,decks,opts={}){
  const dp=opts.deckPx||30,W=opts.width||150,top=10,h=decks*dp,bottom=top+h,L=34,R=L+(opts.inner||92);
  const stackTop=bottom-inTray*dp;
  let edges='',seed=Math.round(inTray*977+decks*31)||7;
  const jit=()=>{seed=(seed*16807)%2147483647;return seed/2147483647-0.5};
  const cards=Math.round(inTray*52);
  for(let i=0;i<cards;i+=3){const y=(bottom-(i/52)*dp).toFixed(1);edges+=`M${(L+3+jit()*2).toFixed(1)} ${y}H${(R-3+jit()*2).toFixed(1)}`}
  let m='';
  if(opts.marks){
    for(let k=1;k<decks;k++){const y=bottom-k*dp;
      m+=`<line x1="${L-6}" x2="${R+6}" y1="${y}" y2="${y}" style="stroke:var(--brass);stroke-width:1;stroke-dasharray:3 3"/><text x="${L-10}" y="${y+3.5}" text-anchor="end" style="fill:var(--muted);font:10px var(--f-mono)">${k}</text>`}
  }
  return `<div class="tray-box" style="display:flex;flex-direction:column;align-items:center"><svg viewBox="0 0 ${W} ${bottom+8}" width="${opts.px||W}" role="img" aria-label="Discard tray of a ${decks}-deck shoe">
    <rect x="${L}" y="${top}" width="${R-L}" height="${h}" rx="4" style="fill:rgba(233,239,233,.06);stroke:rgba(233,239,233,.32);stroke-width:1.2"/>
    ${inTray>0?`<rect x="${L+2}" y="${stackTop}" width="${R-L-4}" height="${bottom-stackTop}" rx="1.5" style="fill:#efe8d6"/><path d="${edges}" style="stroke:rgba(60,48,30,.22);stroke-width:.6;fill:none"/>`:''}
    ${m}
    <rect x="${L-4}" y="${bottom}" width="${R-L+8}" height="5" rx="2" style="fill:rgba(233,239,233,.32)"/>
  </svg>${opts.caption?`<span class="tbl-lbl">${opts.caption}</span>`:''}</div>`;
};

window.TBL=TBL;
})();
