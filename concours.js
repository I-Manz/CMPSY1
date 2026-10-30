/* Mode concours : 36 planches de 10 s, barre 100 % -> 0 % en 8 s, enchaînement automatique */
const CQ={n:36,dur:10,decay:8};
let cq={};
const cqSave=()=>{const all=load(),i=all.findIndex(x=>x.id==st.s.id);i<0?all.push(st.s):all[i]=st.s;save(all);window.Sync&&Sync.push(st.s)};

function startConcours(){
  st.s={id:Date.now(),start:Date.now(),mode:'concours',limit:CQ.dur,planned:CQ.n,items:[],curve:[]};
  app.innerHTML=`<div class="head"><div><h1>Concours</h1><div class="sub">${CQ.n} planches · ${CQ.dur} s chacune</div></div><button class="btn" id="back">← Menu</button></div>
  <div class="body"><p>Chaque planche dure ${CQ.dur} s et s’enchaîne automatiquement, sans pause. La barre descend de 100 % à 0 % en ${CQ.decay} s. Une bonne réponse remet la barre à 100 % ; une erreur la fait descendre plus vite : mieux vaut ne rien répondre que se tromper.</p>
  <button class="btn pri big" id="cgo">Démarrer</button></div>`;
  $('#back').onclick=menu;$('#cgo').onclick=cqBegin;
}
function cqBegin(){
  app.innerHTML=`<div class="head"><div><h1>Concours</h1><div class="sub" id="cn"></div></div><button class="btn" id="back">← Menu</button></div>
  <div class="body"><div class="op" id="op"></div>
  <div class="cbar"><i id="cb"></i></div><div class="row" style="margin-top:0"><span id="cp"></span><span id="cm"></span></div>
  <form id="f" novalidate><input class="ans" id="ans" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" maxlength="7" aria-label="Réponse">
  <div class="row"><span></span><button class="btn pri" type="submit">Valider</button></div></form></div>`;
  $('#back').onclick=()=>{if(confirm('Quitter le concours ? Les planches terminées sont conservées.'))menu()};
  $('#f').onsubmit=cqSubmit;
  $('#ans').oninput=e=>{e.target.value=e.target.value.replace(/[.,]/g,'')};
  cq={i:0};cqNew(performance.now());
  st.iv=setInterval(cqTick,50);
}
function cqNew(t){
  gen();Object.assign(cq,{op:st.op,res:st.res,v:100,rate:100/CQ.decay,locked:false,area:0,wrong:0,ans:'',tFirst:null,t0:t,last:t,nxt:0});
  $('#op').textContent=cq.op;$('#cn').textContent='Planche '+(cq.i+1)+'/'+CQ.n;
  const a=$('#ans');a.value='';a.className='ans';a.focus();$('#cm').textContent='';cqPaint();
}
function cqPaint(){
  const b=$('#cb');b.style.width=cq.v+'%';b.style.background='hsl('+Math.round(cq.v*1.2)+',75%,45%)';$('#cp').textContent=Math.round(cq.v)+' %';
}
function cqTick(){
  const now=performance.now(),e=(now-cq.t0)/1000;
  let dt=(now-cq.last)/1000;cq.last=now;
  if(e>CQ.dur)dt-=e-CQ.dur;
  if(!cq.locked)cq.v=Math.max(0,cq.v-cq.rate*dt);
  cq.area+=cq.v*dt;
  while(cq.nxt<CQ.dur&&cq.nxt<=e){st.s.curve.push(Math.round(cq.v));cq.nxt+=.5}
  if(e>=CQ.dur)return cqEnd();
  cqPaint();
}
function cqSubmit(ev){
  ev.preventDefault();const a=$('#ans'),v=a.value.trim();
  if(cq.locked||!v)return;
  if(parseInt(v,10)===cq.res){
    cq.locked=true;cq.v=100;cq.ans=v;cq.tFirst=Math.round((performance.now()-cq.t0)/100)/10;
    a.classList.add('ok');$('#cm').textContent='✓ Bonne réponse';
  }else{
    cq.wrong++;cq.ans=v;cq.v=Math.max(0,cq.v-25);cq.rate*=1.6;
    a.value='';a.classList.add('ko');setTimeout(()=>a.classList.remove('ko'),300);$('#cm').textContent='✗ Erreurs : '+cq.wrong;
  }
  a.focus();cqPaint();
}
function cqEnd(){
  const ok=cq.tFirst!=null,it=st.s.items;
  it.push({op:cq.op,res:cq.res,ans:cq.ans,s:ok?cq.tFirst:CQ.dur,ok,wrong:cq.wrong,sc:Math.round(cq.area/CQ.dur*10)/10});
  st.s.score=Math.round(it.reduce((a,x)=>a+x.sc,0)/it.length*10)/10;
  cqSave();cq.i++;
  if(cq.i>=CQ.n){clearInterval(st.iv);return concoursSummary(st.s,'menu')}
  cqNew(cq.t0+CQ.dur*1000);
}
function areaChart(v,o={}){
  const W=640,H=220,L=36,R=10,T=10,B=26,n=v.length;if(n<2)return'';
  const X=i=>L+i*(W-L-R)/(n-1),Y=p=>T+(H-T-B)*(1-p/100);
  const pts=v.map((p,i)=>X(i).toFixed(1)+','+Y(p).toFixed(1)).join(' ');
  let g='',xl='';
  [0,50,100].forEach(p=>g+=`<line x1="${L}" x2="${W-R}" y1="${Y(p)}" y2="${Y(p)}" stroke="var(--bd)" stroke-width=".6"/><text x="${L-6}" y="${Y(p)+4}" text-anchor="end">${p}</text>`);
  for(let m=0;m<=n/2;m+=60)xl+=`<text x="${X(Math.min(m*2,n-1))}" y="${H-8}" text-anchor="middle">${m/60}:00</text>`;
  return`<svg class="chart" viewBox="0 0 ${W} ${H}">${g}<polygon points="${L},${Y(0)} ${pts} ${X(n-1)},${Y(0)}" fill="#7c6fdc" fill-opacity=".18"/><polyline points="${pts}" fill="none" stroke="#7c6fdc" stroke-width="1.6"/>${o.lv!=null?`<line x1="${L}" x2="${W-R}" y1="${Y(o.lv)}" y2="${Y(o.lv)}" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="2 4" stroke-linecap="round"/><text x="${L+4}" y="${Y(o.lv)-4}" style="fill:#f59e0b">score ${Math.round(o.lv)} %</text>`:''}${o.sel>=0?`<line x1="${X(o.sel)}" x2="${X(o.sel)}" y1="${T}" y2="${Y(0)}" stroke="var(--tx)" stroke-width="1"/><circle cx="${X(o.sel)}" cy="${Y(v[o.sel])}" r="5" fill="#7c6fdc" stroke="var(--tx)" stroke-width="2"/>`:''}${xl}</svg>`;
}
function concoursSummary(s,back){
  clearInterval(st.iv);
  const it=s.items,n=it.length,okn=it.filter(x=>x.ok).length,err=it.reduce((a,x)=>a+(x.wrong||0),0),none=it.filter(x=>!x.ok&&!x.wrong).length;
  const sc=s.score!=null?s.score:(n?it.reduce((a,x)=>a+x.sc,0)/n:0);
  app.innerHTML=`<div class="head"><div><h1>Concours</h1><div class="sub">${fd(s.start)} · ${n}/${s.planned} planches</div></div><button class="btn" id="bk">← ${back=='menu'?'Menu':'Sessions'}</button></div>
  <div class="body"><div class="lab" style="text-align:center">SCORE FINAL</div><div class="big-n tc" id="sc" style="--c:#f59e0b;cursor:pointer">${Math.round(sc)} %</div>
  <div class="stats"><div><b>${okn}/${n}</b>bonnes réponses</div><div><b>${err}</b>réponses fausses</div><div><b>${none}</b>sans réponse</div></div>
  <h2>Pourcentage au cours du temps</h2><div class="sub" style="margin:6px 0">Touche le score pour tracer sa ligne, ou le graphique pour voir la planche correspondante.</div><div id="cw"></div><div class="tip" id="tip"></div>
  <h2>Détail</h2><table><tr><th>#</th><th>Opération</th><th>Réponse</th><th>Score</th></tr>
  ${it.map((x,i)=>`<tr><td>${i+1}</td><td>${x.op} = ${x.res}</td><td style="color:var(${x.ok?'--g':'--r'})">${x.ans||'–'}${x.ok&&x.wrong?' ('+x.wrong+' err.)':''}</td><td>${Math.round(x.sc)} %</td></tr>`).join('')}</table>
  ${back=='sessions'?'<button class="btn big" id="del" style="color:var(--r)">Supprimer cette session</button>':''}</div>`;
  $('#bk').onclick=back=='menu'?menu:sessions;
  const d=$('#del');if(d)d.onclick=()=>{if(confirm('Supprimer cette session ?')){save(load().filter(x=>x.id!=s.id));window.Sync&&Sync.remove([s.id]);sessions()}};
  const cv=s.curve||[],per=CQ.dur*2;let sel=-1,sl=false;
  const draw=()=>{
    $('#cw').innerHTML=areaChart(cv,{sel,lv:sl?sc:null});$('#sc').classList.toggle('on',sl);
    const t=$('#tip');if(sel<0){t.textContent='Aucun point sélectionné.';return}
    const pi=Math.min(it.length-1,Math.floor(sel/per)),x=it[pi],sec=sel/2;let r;
    if(!x.ans)r='<b>aucune réponse</b>';else{const df=parseInt(x.ans,10)-x.res;r=`ta réponse : <b>${x.ans}</b> (${x.ok?'✓ juste':'✗ écart '+(df>0?'+':'')+df})`}
    t.innerHTML=`<b>Planche ${pi+1}</b> · ${x.op} = <b>${x.res}</b><br>${r} · score de la planche ${Math.round(x.sc)} %<br>à ${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')} · barre à ${cv[sel]} %`;
  };
  $('#cw').onclick=e=>{const svg=$('#cw svg');if(!svg||cv.length<2)return;const r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*640;
    const i=Math.max(0,Math.min(cv.length-1,Math.round((x-36)/(640-36-10)*(cv.length-1))));sel=sel===i?-1:i;draw()};
  $('#sc').onclick=()=>{sl=!sl;draw()};
  draw();
}
