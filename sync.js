/* Synchronisation Supabase (optionnelle) : fusionne les sessions entre appareils */
(function(){
const C=window.CM1_CONFIG||{},K='cm1_sessions_v2',D='cm1_deleted';
const sb=(C.url&&C.key&&window.supabase)?window.supabase.createClient(C.url,C.key):null;
const rd=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const $=s=>document.querySelector(s);
let user=null,msg='',busy=false;
const S={onChange:null};

S.panel=()=>sb?'<div id="sync"></div>':'';
function render(){
  const el=$('#sync');if(!el)return;
  const ae=document.activeElement,keep={};
  ['sy-e','sy-p'].forEach(i=>{const x=$('#'+i);if(x)keep[i]=x.value});
  const html=user
   ?`<h2>☁ Synchronisation</h2><div class="sub">Connecté : ${user.email}</div>
     <div class="menu"><button class="btn" id="sy-now">Synchroniser</button><button class="btn" id="sy-out">Se déconnecter</button></div><div class="sub">${msg}</div>`
   :`<h2>☁ Synchronisation</h2><input id="sy-e" type="email" placeholder="E-mail" autocomplete="email">
     <input id="sy-p" type="password" placeholder="Mot de passe (6 caractères min.)" autocomplete="current-password">
     <div class="menu" style="margin-top:0"><button class="btn pri" id="sy-in">Se connecter</button><button class="btn" id="sy-up">Créer un compte</button></div><div class="sub">${msg}</div>`;
  if(el.dataset.h===html)return;
  el.dataset.h=html;el.innerHTML=html+'<div class="sub" style="font-size:.7rem;opacity:.6">sync v3</div>';
  Object.keys(keep).forEach(i=>{const x=$('#'+i);if(x)x.value=keep[i]});
  if(ae&&ae.id&&$('#'+ae.id))$('#'+ae.id).focus();
  el.onclick=async e=>{
    const b=e.target.closest('button');if(!b||!b.id.startsWith('sy-'))return;const id=b.id;
    if(id==='sy-now')return run();
    if(id==='sy-out'){await sb.auth.signOut();user=null;msg='';return render()}
    const em=$('#sy-e').value.trim(),pw=$('#sy-p').value;
    if(!em||!pw){msg='Entre un e-mail et un mot de passe.';return render()}
    const r=id==='sy-in'?await sb.auth.signInWithPassword({email:em,password:pw}):await sb.auth.signUp({email:em,password:pw});
    if(r.error){msg='Erreur : '+r.error.message;return render()}
    if(r.data.session){user=r.data.user;run()}else{msg='Compte créé : confirme ton e-mail, puis connecte-toi.';render()}
  };
}
async function run(){
  if(!sb||!user||busy)return;busy=true;msg='Synchronisation…';render();
  try{
    const dead=rd(D);
    if(dead.length){const r=await sb.from('sessions').delete().in('id',dead);if(r.error)throw r.error;wr(D,[])}
    const r=await sb.from('sessions').select('id,data');if(r.error)throw r.error;
    const loc=new Map(rd(K).map(s=>[s.id,s])),rem=new Map(r.data.map(x=>[x.id,x.data])),up=[];
    for(const id of new Set([...loc.keys(),...rem.keys()])){
      const a=loc.get(id),b=rem.get(id);
      if(!b||(a&&a.items.length>b.items.length))up.push({user_id:user.id,id,data:a,updated_at:new Date().toISOString()});
      else if(!a||b.items.length>a.items.length)loc.set(id,b);
    }
    if(up.length){const w=await sb.from('sessions').upsert(up,{onConflict:'user_id,id'});if(w.error)throw w.error}
    wr(K,[...loc.values()].sort((x,y)=>x.start-y.start));
    msg='Synchronisé ✓ '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    S.onChange&&S.onChange();
  }catch(e){msg='Erreur : '+(e.message||e)}
  busy=false;render();
}
S.bind=render;
S.run=run;
S.push=async s=>{if(!sb||!user)return;try{await sb.from('sessions').upsert({user_id:user.id,id:s.id,data:s,updated_at:new Date().toISOString()},{onConflict:'user_id,id'})}catch(e){}};
S.remove=ids=>{if(!sb)return;wr(D,[...new Set([...rd(D),...ids])]);run()};
S.init=async()=>{
  if(!sb)return;
  const r=await sb.auth.getSession();user=(r.data.session&&r.data.session.user)||null;
  sb.auth.onAuthStateChange((_e,s)=>{user=(s&&s.user)||null});
  render();run();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)run()});
};
window.Sync=S;
})();
