const K='cm1_sessions_v2',LIMITS=[0,10,20,30,45,60],FAST=10;
const $=s=>document.querySelector(s),app=$('#app');
const load=()=>{try{return JSON.parse(localStorage.getItem(K))||[]}catch(e){return[]}};
const save=a=>{try{localStorage.setItem(K,JSON.stringify(a))}catch(e){}};
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const med=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const fs=x=>x==null?'–':x.toFixed(1)+' s',fp=x=>x==null?'–':Math.round(x)+' %',f1=x=>x==null?'–':x.toFixed(1);
const fd=t=>new Date(t).toLocaleString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
let st={nq:36,limit:0,s:null,op:'',res:0,val:'',done:false,t0:0,iv:null};

function stats(it){
  const n=it.length,ok=it.filter(x=>x.ok),fast=it.filter(x=>x.s<=FAST),fo=ok.filter(x=>x.s<=FAST),T=a=>a.map(x=>x.s);
  const acc=n?ok.length/n:null,accF=n?fo.length/n:null;
  return{n,nok:ok.length,all:med(T(it)),ok:med(T(ok)),fast:med(T(fast)),fo:med(T(fo)),
    min:n?Math.min(...T(it)):null,max:n?Math.max(...T(it)):null,
    acc:acc==null?null:acc*100,pf:accF==null?null:accF*100,p36:acc==null?null:acc*36,p36f:accF==null?null:accF*36};
}
function chart(pts,o={}){
  if(!pts.length)return'';
  const W=640,H=260,L=44,R=16,T=14,B=30,n=pts.length;
  let mx=o.max||Math.ceil(Math.max(...pts.map(p=>p.v),o.ref||0,1)*1.15);
  const X=i=>L+(n==1?(W-L-R)/2:i*(W-L-R)/(n-1)),Y=v=>T+(H-T-B)*(1-v/mx),cl=y=>Math.min(H-B,Math.max(T,y));
  const P=pts.map((p,i)=>[X(i),Y(p.v)]);
  let d='';
  if(n>1){d=`M${P[0]}`;for(let i=0;i<n-1;i++){const a=P[i-1]||P[i],b=P[i],c=P[i+1],e=P[i+2]||c;
    d+=`C${b[0]+(c[0]-a[0])/6},${cl(b[1]+(c[1]-a[1])/6)} ${c[0]-(e[0]-b[0])/6},${cl(c[1]-(e[1]-b[1])/6)} ${c}`}}
  let g='';for(let k=0;k<=4;k++){const v=mx*k/4,y=Y(v);g+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="var(--bd)" stroke-width=".6"/><text x="${L-6}" y="${y+4}" text-anchor="end">${Math.round(v*10)/10}${o.unit||''}</text>`}
  const step=Math.ceil(n/8);let xl='';pts.forEach((p,i)=>{if(i%step==0)xl+=`<text x="${X(i)}" y="${H-10}" text-anchor="middle">${p.l??i+1}</text>`});
  const ref=o.ref!=null?`<line x1="${L}" x2="${W-R}" y1="${Y(o.ref)}" y2="${Y(o.ref)}" stroke="#f97316" stroke-width="1.6" stroke-dasharray="5 4"/><text x="${W-R}" y="${Y(o.ref)-5}" text-anchor="end" style="fill:#f97316">${o.ref}${o.unit||''}</text>`:'';
  return`<svg class="chart" viewBox="0 0 ${W} ${H}">${g}${ref}<path d="${d}" fill="none" stroke="${o.line||'#2563eb'}" stroke-width="2.2"/>${pts.map((p,i)=>`<circle cx="${P[i][0]}" cy="${P[i][1]}" r="4.5" fill="${p.c||'#2563eb'}"/>`).join('')}${xl}</svg>`;
}
const cards=s=>`<div class="stats">
<div class="hl"><b>${s.nok}/${s.n}</b>bonnes réponses (${fp(s.acc)})</div>
<div class="hl"><b>${f1(s.p36)}/36</b>projection concours (toutes bonnes)</div>
<div class="hl"><b>${f1(s.p36f)}/36</b>projection concours (bonnes ≤ ${FAST} s)</div>
<div><b>${fs(s.all)}</b>médiane toutes réponses</div><div><b>${fs(s.ok)}</b>médiane bonnes réponses</div>
<div><b>${fs(s.fast)}</b>médiane réponses ≤ ${FAST} s</div><div><b>${fs(s.fo)}</b>médiane bonnes ≤ ${FAST} s</div>
<div><b>${fs(s.min)}</b>temps mini</div><div><b>${fs(s.max)}</b>temps maxi</div>
<div><b>${fp(s.pf)}</b>bonnes réponses ≤ ${FAST} s</div></div>`;

/* ---------- Menu ---------- */
function menu(){
  clearInterval(st.iv);st.s=null;
  app.innerHTML=`<div class="head"><div><h1>CM1</h1><div class="sub">Psychomoteur Cadets · Entraînement</div></div></div>
  <div class="body"><label for="nq">Nombre de questions par session</label><input id="nq" type="number" inputmode="numeric" min="1" max="500" value="${st.nq}">
  <label for="lim">Chrono</label><select id="lim">${LIMITS.map(l=>`<option value="${l}" ${l==st.limit?'selected':''}>${l?l+' s par question':'Sans chrono'}</option>`).join('')}</select>
  <button class="btn pri big" id="go">Démarrer une session</button>
  <div class="menu"><button class="btn" id="b1">📊 Stats des sessions</button><button class="btn" id="b2">📈 Progression</button>
  <button class="btn" id="b3">⬇ Exporter (JSON)</button><button class="btn" id="b4">⬇ Exporter (CSV)</button>
  <button class="btn" id="b5" style="grid-column:1/-1;color:var(--r)">🗑 Effacer toutes les données</button></div>${window.Sync?Sync.panel():''}</div>`;
  window.Sync&&Sync.bind();
  $('#go').onclick=()=>{st.nq=Math.max(1,Math.min(500,+$('#nq').value||36));st.limit=+$('#lim').value;start()};
  $('#b1').onclick=sessions;$('#b2').onclick=()=>progress('session');
  $('#b3').onclick=()=>dl('cm1-export.json',JSON.stringify(load(),null,1),'application/json');
  $('#b4').onclick=()=>{const r=['session,date,question,operation,resultat,reponse,temps_s,correct'];
    load().forEach(s=>s.items.forEach((x,i)=>r.push([s.id,new Date(s.start).toISOString(),i+1,'"'+x.op+'"',x.res,x.ans,x.s,x.ok?1:0].join(','))));
    dl('cm1-export.csv',r.join('\n'),'text/csv')};
  $('#b5').onclick=()=>{if(confirm('Effacer toutes les sessions (sur tous tes appareils si la synchro est active) ?')){const ids=load().map(s=>s.id);save([]);window.Sync&&Sync.remove(ids);menu()}};
}
function dl(name,txt,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

/* ---------- Session ---------- */
function start(){st.s={id:Date.now(),start:Date.now(),limit:st.limit,planned:st.nq,items:[]};question()}
function gen(){
  const k=rnd(3,4);let t=rnd(60,260),s=String(t);
  for(let i=1;i<k;i++){if(Math.random()<.5&&t>12){const m=rnd(10,Math.min(t,130));t-=m;s+=' - '+m}else{const m=rnd(10,130);t+=m;s+=' + '+m}}
  st.op=s;st.res=t;
}
function question(){
  st.val='';st.done=false;gen();st.t0=performance.now();const i=st.s.items.length+1;
  app.innerHTML=`<div class="head"><div><h1>CM1</h1><div class="sub">Question ${i}/${st.s.planned}</div></div><button class="btn" id="back">← Menu</button></div>
  <div class="body"><div class="lab">OPÉRATION</div><div class="op" id="op">${st.op}</div><form id="f" autocomplete="off" novalidate><input class="ans" id="ans" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" maxlength="7" aria-label="Réponse">
  <div class="row"><span id="tm">${st.limit?'⏱ '+st.limit+' s':''}</span><button class="btn" id="act" type="submit">Correction</button></div></form></div>`;
  $('#f').onsubmit=e=>{e.preventDefault();act()};
  $('#back').onclick=quit;
  $('#ans').focus();clearInterval(st.iv);st.iv=setInterval(tick,200);
}
function quit(){
  if(st.s.items.length&&!confirm('Quitter la session ? Les réponses déjà données sont conservées.'))return;
  if(!st.s.items.length&&!confirm('Retour au menu ?'))return;
  menu();
}
function tick(){if(st.done)return;const e=(performance.now()-st.t0)/1000;
  if(st.limit){$('#tm').textContent='⏱ '+Math.max(0,Math.ceil(st.limit-e))+' s';if(e>=st.limit)finish(true)}}
function act(){
  if(!st.done){finish(false);$('#ans').focus();return}
  st.s.items.length>=st.s.planned?summary(st.s,'menu'):question();
}
function finish(timeout){
  if(st.done)return;st.done=true;clearInterval(st.iv);
  st.val=$('#ans').value.trim();
  const raw=(performance.now()-st.t0)/1000,s=Math.round((st.limit?Math.min(raw,st.limit):raw)*10)/10;
  const ok=!timeout&&st.val!==''&&st.val!=='-'&&parseInt(st.val,10)===st.res;
  st.s.items.push({op:st.op,res:st.res,ans:st.val,s,ok});
  const all=load(),i=all.findIndex(x=>x.id==st.s.id);i<0?all.push(st.s):all[i]=st.s;save(all);window.Sync&&Sync.push(st.s);
  $('#op').textContent=st.op+' = '+st.res;const a=$('#ans');a.classList.add(ok?'ok':'ko');
  if(timeout&&!st.val)a.value='Temps écoulé';
  $('#tm').textContent='Temps : '+Math.round(s)+' sec';
  const b=$('#act');b.textContent=st.s.items.length>=st.s.planned?'Terminer':'Suivant';b.classList.add('pri');
}

/* ---------- Résumé / sessions ---------- */
function summary(s,back){
  clearInterval(st.iv);
  const pts=s.items.map(x=>({v:x.s,c:x.ok?'#16a34a':'#ef4444'}));
  app.innerHTML=`<div class="head"><div><h1>Session</h1><div class="sub">${fd(s.start)} · ${s.items.length}/${s.planned} questions${s.limit?' · '+s.limit+' s':''}</div></div><button class="btn" id="bk">← ${back=='menu'?'Menu':'Sessions'}</button></div>
  <div class="body">${s.items.length?cards(stats(s.items)):''}
  <h2>Temps par question</h2><div class="legend"><span><i style="background:#16a34a"></i>bonne</span><span><i style="background:#ef4444"></i>fausse</span><span style="color:#f97316">- - - limite ${FAST} s</span></div>
  ${chart(pts,{ref:FAST,unit:'s'})}
  <h2>Détail</h2><table><tr><th>#</th><th>Opération</th><th>Réponse</th><th>Temps</th></tr>
  ${s.items.map((x,i)=>`<tr><td>${i+1}</td><td>${x.op} = ${x.res}</td><td style="color:var(${x.ok?'--g':'--r'})">${x.ans||'–'}</td><td>${x.s} s</td></tr>`).join('')}</table>
  ${back=='sessions'?'<button class="btn big" id="del" style="color:var(--r)">Supprimer cette session</button>':''}</div>`;
  $('#bk').onclick=back=='menu'?menu:sessions;
  const d=$('#del');if(d)d.onclick=()=>{if(confirm('Supprimer cette session ?')){save(load().filter(x=>x.id!=s.id));window.Sync&&Sync.remove([s.id]);sessions()}};
}
function sessions(){
  const all=load().filter(s=>s.items.length).reverse();
  app.innerHTML=`<div class="head"><div><h1>Sessions</h1><div class="sub">${all.length} session(s)</div></div><button class="btn" id="bk">← Menu</button></div>
  <div class="body">${all.map((s,i)=>{const t=stats(s.items);return`<div class="tr" data-i="${i}"><div class="dt">${fd(s.start)}<br><span class="m">${s.items.length}/${s.planned} questions · médiane bonnes ${fs(t.ok)}</span></div><b>${t.nok}/${t.n}</b></div>`}).join('')||'<p class="sub">Aucune session pour le moment.</p>'}</div>`;
  $('#bk').onclick=menu;document.querySelectorAll('.tr').forEach(r=>r.onclick=()=>summary(all[r.dataset.i],'sessions'));
}

/* ---------- Progression ---------- */
const MET={ok:{t:'Médiane bonnes réponses',u:'s',f:s=>s.ok,ref:FAST},pf:{t:'% bonnes ≤ 10 s',u:'%',f:s=>s.pf,max:100},p36:{t:'Projection /36',u:'',f:s=>s.p36,max:36}};
let pm='ok';
function progress(mode){
  const all=load().filter(s=>s.items.length);let groups=[];
  if(mode=='session')groups=all.map(s=>({l:new Date(s.start).toLocaleDateString('fr-FR',{day:'numeric',month:'numeric'}),it:s.items}));
  else{const m={};all.forEach(s=>{const d=new Date(s.start);if(mode=='week'){d.setDate(d.getDate()-((d.getDay()+6)%7))}
    const k=d.toISOString().slice(0,10);(m[k]=m[k]||{l:d.toLocaleDateString('fr-FR',{day:'numeric',month:'numeric'}),it:[]}).it.push(...s.items)});
    groups=Object.keys(m).sort().map(k=>m[k])}
  const M=MET[pm],rows=groups.map(g=>({l:g.l,n:g.it.length,s:stats(g.it)}));
  const pts=rows.filter(r=>M.f(r.s)!=null).map(r=>({v:M.f(r.s),l:r.l}));
  const seg=(items,cur,fn)=>`<div class="seg">${items.map(([k,t])=>`<button class="btn ${k==cur?'on':''}" data-k="${k}">${t}</button>`).join('')}</div>`;
  app.innerHTML=`<div class="head"><div><h1>Progression</h1><div class="sub">Évolution de tes performances</div></div><button class="btn" id="bk">← Menu</button></div>
  <div class="body"><div class="lab">REGROUPEMENT</div><div id="g1">${seg([['session','Par session'],['day','Par jour'],['week','Par semaine']],mode)}</div>
  <div class="lab">INDICATEUR</div><div id="g2">${seg(Object.entries(MET).map(([k,v])=>[k,v.t]),pm)}</div>
  ${pts.length?chart(pts,{unit:M.u,ref:M.ref,max:M.max}):'<p class="sub">Pas encore de données.</p>'}
  <table><tr><th>Période</th><th>Q.</th><th>Méd. bonnes</th><th>≤10 s</th><th>/36</th></tr>${[...rows].reverse().map(r=>`<tr><td>${r.l}</td><td>${r.n}</td><td>${fs(r.s.ok)}</td><td>${fp(r.s.pf)}</td><td>${f1(r.s.p36)}</td></tr>`).join('')}</table></div>`;
  $('#bk').onclick=menu;
  $('#g1').onclick=e=>{const k=e.target.dataset.k;if(k)progress(k)};
  $('#g2').onclick=e=>{const k=e.target.dataset.k;if(k){pm=k;progress(mode)}};
}
menu();
if(window.Sync){Sync.onChange=()=>{if(!st.s&&$('#go'))menu()};Sync.init()}
