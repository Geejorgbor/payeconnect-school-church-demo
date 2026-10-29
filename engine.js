/* Payeconnect demo engine — plain JS, data stays in this browser (localStorage). All sample data is fictional. */
(function(){
const C=window.APP, KEY=C.key, WA='https://wa.me/231888916127?text='+encodeURIComponent('Hello Payeconnect, I saw the '+C.title+' demo and I would like to know more.');
const $=s=>document.querySelector(s), esc=v=>String(v==null?'':v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const H={
 today:()=>iso(new Date()),
 daysAgo:n=>{const d=new Date();d.setDate(d.getDate()-n);return iso(d)},
 daysAhead:n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)},
 money:v=>(C.currency||'$')+' '+(Number(v)||0).toLocaleString(undefined,{maximumFractionDigits:2}),
 sum:(a,f)=>a.reduce((s,r)=>s+(Number(typeof f=='function'?f(r):r[f])||0),0),
 month:d=>String(d||'').slice(0,7),
 monthName:m=>{const [y,mo]=m.split('-');return new Date(y,mo-1,1).toLocaleString(undefined,{month:'short',year:'numeric'})},
 lastMonths:n=>{const o=[];const d=new Date();d.setDate(1);for(let i=n-1;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);o.push(x.getFullYear()+'-'+pad(x.getMonth()+1))}return o},
 lastDays:n=>{const o=[];for(let i=n-1;i>=0;i--)o.push(H.daysAgo(i));return o},
 pick:(a,i)=>a[i%a.length],
 esc, esc
};
let db, user=null, cur='dashboard';
function seed(){const d={users:C.users.map((u,i)=>({id:i+1,...u})),audit:[],seq:100000};Object.entries(C.modules).forEach(([k,m],i)=>{d[k]=(m.seed?m.seed(H):[]).map((r,n)=>({id:(i+1)*1000+n+1,...r}))});return d}
function load(){try{db=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!db||!db.users){db=seed();save()}for(const k of Object.keys(C.modules))if(!db[k])db[k]=[]}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function log(action,detail){db.audit.unshift({id:++db.seq,when:new Date().toLocaleString(),user:user?user.u:'-',role:user?user.role:'-',action,detail});db.audit=db.audit.slice(0,500);save()}
H.db=()=>db;H.save=save;H.log=log;H.user=()=>user;H.nid=()=>++db.seq;
H.ref=(mod,id)=>{const m=C.modules[mod];const r=(db[mod]||[]).find(x=>x.id==id);return r?(m.display?m.display(r):r[m.fields[0].k]):''};
H.go=id=>{cur=id;render()};
function fieldVal(m,f,r){let v=r[f.k];if(f.t=='ref')return H.ref(f.ref,v);if(f.t=='money')return H.money(v);if(f.calc)return f.calc(r,H);return v==null?'':v}
// charts
function chart(cv,c){const dpr=window.devicePixelRatio||1,W=cv.clientWidth||600,Hh=220;cv.width=W*dpr;cv.height=Hh*dpr;const x=cv.getContext('2d');x.scale(dpr,dpr);x.font='11px Inter,system-ui,sans-serif';
 const vals=c.values.map(Number),max=Math.max(1,...vals),L=48,B=34,T=12,w=W-L-10,h=Hh-B-T,n=vals.length;
 x.strokeStyle='#e3e8f1';x.fillStyle='#68748c';for(let i=0;i<=4;i++){const y=T+h-h*i/4;x.beginPath();x.moveTo(L,y);x.lineTo(W-10,y);x.stroke();const lab=max*i/4;x.fillText(lab>=1000?(lab/1000).toFixed(1)+'k':Math.round(lab),4,y+4)}
 const bw=w/n;x.textAlign='center';
 if(c.type=='line'){x.strokeStyle='#1f4a9a';x.lineWidth=2.5;x.beginPath();vals.forEach((v,i)=>{const px=L+bw*i+bw/2,py=T+h-h*v/max;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();x.fillStyle='#0b1f4b';vals.forEach((v,i)=>{x.beginPath();x.arc(L+bw*i+bw/2,T+h-h*v/max,3.5,0,7);x.fill()})}
 else vals.forEach((v,i)=>{x.fillStyle=c.colors?c.colors[i%c.colors.length]:(i%2?'#1f4a9a':'#0b1f4b');const bh=h*v/max;x.fillRect(L+bw*i+bw*.18,T+h-bh,bw*.64,bh)});
 x.fillStyle='#4a5774';const step=Math.ceil(n/10);c.labels.forEach((l,i)=>{if(i%step==0)x.fillText(String(l).slice(0,12),L+bw*i+bw/2,Hh-14)})}
function blocks(o){let s='';if(o.alerts&&o.alerts.length)s+='<div class="card"><h3>Alerts</h3>'+o.alerts.map(a=>`<div class="alert ${a.cls||''}">${esc(a.text)}</div>`).join('')+'</div>';
 if(o.kpis)s='<div class="kpis">'+o.kpis.map(k=>`<div class="kpi"><small>${esc(k.label)}</small><b>${esc(k.value)}</b></div>`).join('')+'</div>'+s;
 if(o.charts)s+='<div class="grid2">'+o.charts.map((c,i)=>`<div class="card"><h3>${esc(c.title)}</h3><canvas data-ch="${i}"></canvas></div>`).join('')+'</div>';
 if(o.table)s+=`<div class="card"><h3>${esc(o.table.title||'Details')}</h3><div class="tbl-wrap">${tbl(o.table.cols,o.table.rows)}</div></div>`;
 if(o.html)s+=o.html;return s}
function drawCharts(el,o){if(o.charts)el.querySelectorAll('canvas[data-ch]').forEach(cv=>chart(cv,o.charts[cv.dataset.ch]))}
function tbl(cols,rows){return `<table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(v=>`<td>${v&&v.html?v.html:esc(v)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${cols.length}" style="color:#68748c">No records</td></tr>`}</tbody></table>`}
H.tbl=tbl;
function printDoc(title,inner){const p=$('#print');p.innerHTML=`<div style="display:flex;justify-content:space-between;border-bottom:2px solid #0b1f4b;padding-bottom:10px;margin-bottom:14px"><div><h2>${esc(C.title)}</h2><div class="muted">${esc(C.orgType)}</div></div><div style="text-align:right"><b>${esc(title)}</b><div class="muted">Printed ${new Date().toLocaleString()}</div></div></div>${inner}<p class="muted" style="margin-top:24px;border-top:1px solid #ccc;padding-top:8px">Built by Payeconnect – WhatsApp +231 888 916 127 · Demo data</p>`;setTimeout(()=>window.print(),50)}
H.print=printDoc;
function receipt(mod,r){const m=C.modules[mod];if(m.receipt&&typeof m.receipt=='function')return printDoc(m.receiptTitle||'Receipt',m.receipt(r,H));
 printDoc((m.singular||m.label)+' #'+r.id,'<table>'+m.fields.map(f=>`<tr><th style="width:40%">${esc(f.l)}</th><td>${esc(fieldVal(m,f,r))}</td></tr>`).join('')+'</table>')}
// views
function canSee(id){if(!user)return false;const a=C.roles&&C.roles[user.role];if(!a||a=='*')return true;return a.includes(id)}
function navItems(){return C.nav.filter(n=>n.h||canSee(n.id))}
function render(){if(!user)return loginView();
 const items=navItems();if(!canSee(cur))cur='dashboard';
 const it=C.nav.find(n=>n.id==cur)||{label:'Dashboard'};
 document.body.innerHTML=`<div class="app"><aside class="side" id="side"><div class="brand"><div class="logo">${esc(C.logo||'P')}</div><div>${esc(C.title)}<small>${esc(C.orgType)}</small></div></div><nav class="nav">${items.map(n=>n.h?`<div class="nav-h">${esc(n.h)}</div>`:`<a data-go="${n.id}" class="${n.id==cur?'on':''}">${n.icon||'•'} ${esc(n.label)}</a>`).join('')}</nav>
 <div class="side-foot">Signed in as <b>${esc(user.name)}</b> (${esc(user.role)})<br><a href="#" id="logout" style="color:#fff">Sign out</a> · <a href="#" id="reset" style="color:#fff">Reset demo data</a><br><br>Built by Payeconnect<br><a href="${WA}" target="_blank" rel="noopener">WhatsApp +231 888 916 127</a></div></aside>
 <div class="main"><div class="top"><button class="menu-btn" id="mb" aria-label="Menu">☰</button><h2>${esc(it.label)}</h2><span class="who">${esc(user.name)} · ${esc(user.role)}</span></div><div class="content" id="ct"></div>
 <div class="wa"><a href="${WA}" target="_blank" rel="noopener">Built by Payeconnect – chat with us on WhatsApp +231 888 916 127</a></div></div></div><div id="print" class="print"></div><div id="modal"></div>`;
 document.querySelectorAll('[data-go]').forEach(a=>a.onclick=()=>{cur=a.dataset.go;render()});
 $('#mb').onclick=e=>{e.stopPropagation();$('#side').classList.toggle('open')};
 $('#logout').onclick=e=>{e.preventDefault();log('Sign out','');user=null;sessionStorage.removeItem(KEY+'_u');render()};
 $('#reset').onclick=e=>{e.preventDefault();if(confirm('Reset all demo data to the original sample?')){const u=user;db=seed();save();user=u;log('Reset demo data','');render()}};
 const el=$('#ct');
 if(cur=='dashboard'){const o=C.dashboard(db,H);el.innerHTML=(C.dashIntro?`<div class="card" style="background:#0b1f4b;color:#fff">${C.dashIntro}</div>`:'')+blocks(o);drawCharts(el,o)}
 else if(cur=='reports')reportsView(el);
 else if(cur=='users')usersView(el);
 else if(cur=='audit'){el.innerHTML=`<div class="toolbar"><input id="q" placeholder="Search audit log..."><button class="btn ghost" id="pr">🖨 Print</button></div><div class="tbl-wrap" id="tw"></div>`;const f=()=>{const q=$('#q').value.toLowerCase();const rows=db.audit.filter(a=>JSON.stringify(a).toLowerCase().includes(q)).map(a=>[a.when,a.user,a.role,a.action,a.detail]);$('#tw').innerHTML=tbl(['When','User','Role','Action','Detail'],rows);return rows};f();$('#q').oninput=f;$('#pr').onclick=()=>printDoc('Audit Log',tbl(['When','User','Role','Action','Detail'],f()))}
 else if(C.pages&&C.pages[cur])C.pages[cur](el,H);
 else if(C.modules[cur])listView(el,cur);
}
function listView(el,mod){const m=C.modules[mod];const cols=m.cols||m.fields.slice(0,6).map(f=>f.k);
 el.innerHTML=`${m.intro?`<div class="alert ok">${m.intro}</div>`:''}<div class="toolbar"><input id="q" placeholder="Search ${esc(m.label.toLowerCase())}..."><button class="btn" id="add">+ Add ${esc(m.singular||'')}</button><button class="btn ghost" id="pr">🖨 Print list</button></div><div class="tbl-wrap" id="tw"></div><p style="color:#68748c;font-size:12.5px" id="cnt"></p>`;
 const fs=cols.map(k=>m.fields.find(f=>f.k==k)||{k,l:k});
 const rowsOf=()=>{const q=$('#q').value.toLowerCase();return db[mod].filter(r=>!q||m.fields.map(f=>fieldVal(m,f,r)).join(' ').toLowerCase().includes(q)).sort((a,b)=>m.sort?m.sort(a,b):b.id-a.id)};
 const f=()=>{const rows=rowsOf();$('#tw').innerHTML=`<table><thead><tr>${fs.map(c=>`<th>${esc(c.l)}</th>`).join('')}${m.tag?'<th>Status</th>':''}<th></th></tr></thead><tbody>${rows.map(r=>{const t=m.tag&&m.tag(r,H);return `<tr>${fs.map(c=>`<td>${esc(fieldVal(m,c,r))}</td>`).join('')}${m.tag?`<td>${t?`<span class="tag ${t.cls||''}">${esc(t.text)}</span>`:''}</td>`:''}<td><div class="acts"><button class="btn sm ghost" data-e="${r.id}">Edit</button>${m.receipt!==false?`<button class="btn sm ghost" data-p="${r.id}">🖨 ${esc(m.printLabel||'Print')}</button>`:''}<button class="btn sm red" data-d="${r.id}">✕</button></div></td></tr>`}).join('')||`<tr><td colspan="9" style="color:#68748c">No records found</td></tr>`}</tbody></table>`;
  $('#cnt').textContent=rows.length+' record(s)';
  el.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>edit(mod,db[mod].find(r=>r.id==b.dataset.e)));
  el.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>receipt(mod,db[mod].find(r=>r.id==b.dataset.p)));
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const r=db[mod].find(x=>x.id==b.dataset.d);if(confirm('Delete this record?')){if(m.onDelete)m.onDelete(r,H);db[mod]=db[mod].filter(x=>x!==r);log('Delete '+(m.singular||m.label),'#'+r.id+' '+fieldVal(m,m.fields[0],r));save();f()}})};
 f();$('#q').oninput=f;$('#add').onclick=()=>edit(mod,null);
 $('#pr').onclick=()=>printDoc(m.label,tbl(fs.map(c=>c.l),rowsOf().map(r=>fs.map(c=>fieldVal(m,c,r)))));
}
function input(f,v){const id='f_'+f.k;if(f.calc)return '';let h=`<div><label for="${id}">${esc(f.l)}${f.req?' *':''}</label>`;
 if(f.t=='select')h+=`<select id="${id}">${f.opts.map(o=>`<option ${o==v?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
 else if(f.t=='ref'){const m=C.modules[f.ref];h+=`<select id="${id}"><option value="">— select —</option>${db[f.ref].map(r=>`<option value="${r.id}" ${r.id==v?'selected':''}>${esc(m.display?m.display(r):r[m.fields[0].k])}</option>`).join('')}</select>`}
 else if(f.t=='area')h+=`<textarea id="${id}" rows="3">${esc(v)}</textarea>`;
 else h+=`<input id="${id}" type="${f.t=='money'||f.t=='number'?'number':f.t=='date'?'date':'text'}" ${f.t=='money'?'step="0.01"':''} value="${esc(v)}">`;
 return h+'</div>'}
function edit(mod,r){const m=C.modules[mod];const isNew=!r;const v=r||{};
 $('#modal').innerHTML=`<div class="modal-bg"><div class="modal"><h3>${isNew?'Add':'Edit'} ${esc(m.singular||m.label)}</h3><div class="row">${m.fields.map(f=>input(f,v[f.k]!=null?v[f.k]:(typeof f.def=='function'?f.def(H):f.def!=null?f.def:''))).join('')}</div><div class="err" id="merr"></div><div class="foot"><button class="btn ghost" id="mc">Cancel</button><button class="btn" id="ms">Save</button></div></div></div>`;
 $('#mc').onclick=()=>$('#modal').innerHTML='';
 $('#ms').onclick=()=>{const n={...v};for(const f of m.fields){if(f.calc)continue;let x=$('#f_'+f.k).value;if(f.req&&!x){$('#merr').textContent=f.l+' is required';return}if(f.t=='money'||f.t=='number')x=x===''?'':Number(x);n[f.k]=x}
  const old=isNew?null:{...r};if(m.before){const e=m.before(n,H,old);if(e){$('#merr').textContent=e;return}}
  if(isNew){n.id=++db.seq;db[mod].push(n)}else Object.assign(r,n);
  log((isNew?'Add ':'Edit ')+(m.singular||m.label),'#'+n.id+' '+fieldVal(m,m.fields[0],n));save();$('#modal').innerHTML='';render()}}
function reportsView(el){const rs=C.reports;el.innerHTML=`<div class="toolbar"><select id="rs" style="max-width:340px">${rs.map((r,i)=>`<option value="${i}">${esc(r.label)}</option>`).join('')}</select><input id="rp" type="${'month'}" style="max-width:200px" value="${H.month(H.today())}" title="Period"><button class="btn ghost" id="pr">🖨 Print report</button></div><div id="ro"></div>`;
 let o;const f=()=>{const r=rs[$('#rs').value];$('#rp').style.display=r.period?'':'none';$('#rp').type=r.period=='year'?'number':'month';if(r.period=='year'&&String($('#rp').value).length!=4)$('#rp').value=new Date().getFullYear();if(r.period=='month'&&String($('#rp').value).length!=7)$('#rp').value=H.month(H.today());o=r.run(db,H,$('#rp').value);$('#ro').innerHTML=blocks(o);drawCharts($('#ro'),o)};
 f();$('#rs').onchange=f;$('#rp').onchange=f;
 $('#pr').onclick=()=>{const r=rs[$('#rs').value];let s=(o.kpis||[]).map(k=>`<p><b>${esc(k.label)}:</b> ${esc(k.value)}</p>`).join('');if(o.table)s+=tbl(o.table.cols,o.table.rows);if(o.printHtml)s+=o.printHtml;printDoc(r.label+(r.period?' – '+$('#rp').value:''),s)}}
function usersView(el){const roles=Object.keys(C.roles||{Admin:'*'});
 el.innerHTML=`<div class="alert ok">Each user signs in with their own login. What they can see depends on their role.</div><div class="toolbar"><button class="btn" id="add">+ Add user</button></div><div class="tbl-wrap">${tbl(['Name','Username','Role','Can access',''],db.users.map(u=>[u.name,u.u,u.role,(C.roles&&C.roles[u.role]&&C.roles[u.role]!='*')?C.roles[u.role].map(id=>(C.nav.find(n=>n.id==id)||{}).label).filter(Boolean).join(', '):'Everything',{html:`<button class="btn sm ghost" data-e="${u.id}">Edit</button> ${u.id!=user.id?`<button class="btn sm red" data-d="${u.id}">✕</button>`:''}`}]))}</div>`;
 const ed=u=>{const v=u||{};$('#modal').innerHTML=`<div class="modal-bg"><div class="modal"><h3>${u?'Edit':'Add'} user</h3><label>Full name</label><input id="un" value="${esc(v.name)}"><label>Username</label><input id="uu" value="${esc(v.u)}"><label>Password</label><input id="up" value="${esc(v.p)}"><label>Role</label><select id="ur">${roles.map(r=>`<option ${r==v.role?'selected':''}>${r}</option>`).join('')}</select><div class="err" id="merr"></div><div class="foot"><button class="btn ghost" id="mc">Cancel</button><button class="btn" id="ms">Save</button></div></div></div>`;
  $('#mc').onclick=()=>$('#modal').innerHTML='';$('#ms').onclick=()=>{const n={name:$('#un').value,u:$('#uu').value.trim(),p:$('#up').value,role:$('#ur').value};if(!n.name||!n.u||!n.p){$('#merr').textContent='All fields are required';return}if(db.users.some(x=>x.u==n.u&&x!==u)){$('#merr').textContent='Username already used';return}if(u)Object.assign(u,n);else db.users.push({id:++db.seq,...n});log((u?'Edit':'Add')+' user',n.u+' ('+n.role+')');save();$('#modal').innerHTML='';render()}};
 $('#add').onclick=()=>ed(null);el.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>ed(db.users.find(u=>u.id==b.dataset.e)));
 el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const u=db.users.find(x=>x.id==b.dataset.d);if(confirm('Remove user '+u.u+'?')){db.users=db.users.filter(x=>x!==u);log('Remove user',u.u);save();render()}})}
function loginView(){const others=C.users.slice(1);
 document.body.innerHTML=`<div class="login"><div class="login-art"><div class="brand"><div class="logo">${esc(C.logo||'P')}</div><div>${esc(C.title)}<br><small style="opacity:.7;font-weight:500">${esc(C.orgType)}</small></div></div><div><h1>${esc(C.headline||C.title)}</h1><p>${esc(C.tagline||'')}</p><div class="feats">${(C.features||[]).map(f=>`<div>✓ ${esc(f)}</div>`).join('')}</div></div><div style="opacity:.7;font-size:12.5px">Free demo · sample data only · works on phone, tablet and computer</div></div>
 <div class="login-form"><form class="lf" id="lf"><h2>Sign in</h2><p class="sub">${esc(C.loginNote||'Welcome. Sign in to open the system.')}</p><div class="demo-box">Demo login: <b>${esc(C.users[0].u)}</b> / <b>${esc(C.users[0].p)}</b>${others.length?'<br><span style="color:#68748c">Other roles: '+others.map(u=>`<b>${esc(u.u)}</b> / <b>${esc(u.p)}</b> (${esc(u.role)})`).join(', ')+'</span>':''}</div>
 <label for="lu">Username</label><input id="lu" autocomplete="username" value="${esc(C.users[0].u)}"><label for="lp">Password</label><input id="lp" type="password" autocomplete="current-password" value="${esc(C.users[0].p)}"><button class="btn block" id="lb" type="submit">Sign in</button><div class="err" id="lerr"></div>
 <div class="pcf"><a href="${WA}" target="_blank" rel="noopener">Built by Payeconnect – chat with us on WhatsApp +231 888 916 127</a></div></form></div></div>`;
 $('#lf').onsubmit=e=>{e.preventDefault();const u=db.users.find(x=>x.u==$('#lu').value.trim()&&x.p==$('#lp').value);if(!u){$('#lerr').textContent='Wrong username or password. Use the demo login shown above.';return}user=u;sessionStorage.setItem(KEY+'_u',u.id);log('Sign in','');cur='dashboard';render()}}
load();const su=sessionStorage.getItem(KEY+'_u');if(su)user=db.users.find(u=>u.id==su)||null;render();
window.addEventListener('resize',()=>{if(user&&(cur=='dashboard'))render()});
})();
