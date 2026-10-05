const $=s=>document.querySelector(s);
function openAuth(mode="login"){ $("#modal").style.display="flex"; renderAuth(mode) }
function closeAuth(){ $("#modal").style.display="none" }
function renderAuth(mode){
 $("#auth").innerHTML=mode==="login"?`<div class="form"><div class="eyebrow">WELCOME BACK</div><h2>Sign in</h2><input id="email" type="email" placeholder="Email"><input id="password" type="password" placeholder="Password"><button class="primary" onclick="login()">Sign in</button><p>New here? <span class="switch" onclick="renderAuth('register')">Create account</span></p></div>`:
`<div class="form"><div class="eyebrow">JOIN THE PLATFORM</div><h2>Create account</h2><input id="name" placeholder="Full name"><input id="email" type="email" placeholder="Email"><input id="password" type="password" placeholder="Password (8+ characters)"><input id="referral" placeholder="Referral code (optional)"><button class="primary" onclick="register()">Create account</button><p>Already registered? <span class="switch" onclick="renderAuth('login')">Sign in</span></p></div>`;
}
async function api(url,opts={}){const token=localStorage.token;opts.headers={...(opts.headers||{}),'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})};const r=await fetch(url,opts);const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d}
async function login(){try{const d=await api('/api/login',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});localStorage.token=d.token;showDashboard()}catch(e){alert(e.message)}}
async function register(){try{const d=await api('/api/register',{method:'POST',body:JSON.stringify({name:$('#name').value,email:$('#email').value,password:$('#password').value,referral:$('#referral').value})});localStorage.token=d.token;showDashboard()}catch(e){alert(e.message)}}
async function showDashboard(){
  closeAuth();
  const d=await api('/api/me');
  document.body.innerHTML=`<header><a class="logo" href="/">Earning<span>CryptoEH</span></a>
  <nav><a href="#overview">Overview</a><a href="#activity">Activity</a><button onclick="logout()">Logout</button></nav></header>
  <main class="dash">
    <div class="dashnav"><div><div class="eyebrow">EARNINGCRYPTOEH • USER AREA</div><h1>Welcome, ${esc(d.user.name)}</h1><p class="muted">Manage your account and track your digital-asset activity.</p></div>
    <div><button class="primary" onclick="requestTx('deposit_request')">+ Deposit Request</button> <button onclick="requestTx('withdraw_request')">Withdraw</button></div></div>
    <section id="overview" class="stats">
      <div class="stat"><small>AVAILABLE BALANCE</small><strong>$${Number(d.user.balance).toFixed(2)}</strong><span class="stat-note">Current account balance</span></div>
      <div class="stat"><small>REFERRAL CODE</small><strong>${esc(d.user.referral_code)}</strong><span class="stat-note">Share your code</span></div>
      <div class="stat"><small>ACCOUNT STATUS</small><strong>Active</strong><span class="stat-note">Verified platform account</span></div>
    </section>
    <section class="dash-grid">
      <div class="panel"><div class="panel-head"><div><div class="eyebrow">PORTFOLIO</div><h2>Account overview</h2></div><span class="live-dot">● Live</span></div>
        <div class="mini-chart"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="chart-labels"><span>30 days</span><span>Activity visualization</span><span>Today</span></div>
      </div>
      <div class="panel"><div class="eyebrow">QUICK ACTIONS</div><h2>Manage account</h2>
        <button class="action-card" onclick="requestTx('deposit_request')"><b>＋</b><span><strong>Deposit request</strong><small>Submit a new funding request</small></span>→</button>
        <button class="action-card" onclick="requestTx('withdraw_request')"><b>↗</b><span><strong>Withdrawal request</strong><small>Request available balance</small></span>→</button>
        <button class="action-card" onclick="navigator.clipboard?.writeText(location.origin+'/register?ref='+d.user.referral_code);alert('Referral link copied')"><b>↗</b><span><strong>Invite friends</strong><small>Copy your referral link</small></span>→</button>
      </div>
    </section>
    <section id="activity" class="panel activity"><div class="panel-head"><div><div class="eyebrow">TRANSACTIONS</div><h2>Recent activity</h2></div><span class="muted">${d.transactions.length} records</span></div>
      <div class="table-wrap"><table class="table"><tr><th>TYPE</th><th>AMOUNT</th><th>STATUS</th><th>DATE</th></tr>${d.transactions.length?d.transactions.map(t=>`<tr><td><b>${esc(t.type.replace('_',' '))}</b></td><td>$${Number(t.amount).toFixed(2)}</td><td><span class="pill">${esc(t.status)}</span></td><td>${esc(t.created_at)}</td></tr>`).join(''):`<tr><td colspan="4" class="empty">No transactions yet.</td></tr>`}</table></div>
    </section>
  </main>`;
}
async function showAdmin(){
  closeAuth();
  try{
    const [users,tx]=await Promise.all([api('/api/admin/users'),api('/api/admin/transactions')]);
    document.body.innerHTML=`<header><a class="logo" href="/">Earning<span>CryptoEH</span></a><nav><span class="admin-badge">ADMIN</span><button onclick="logout()">Logout</button></nav></header>
    <main class="dash"><div class="dashnav"><div><div class="eyebrow">CONTROL CENTER</div><h1>Admin Dashboard</h1><p class="muted">Manage platform users and transaction requests.</p></div></div>
    <section class="stats"><div class="stat"><small>TOTAL USERS</small><strong>${users.length}</strong><span class="stat-note">Registered accounts</span></div><div class="stat"><small>PENDING REQUESTS</small><strong>${tx.filter(x=>x.status==='pending').length}</strong><span class="stat-note">Needs review</span></div><div class="stat"><small>TRANSACTIONS</small><strong>${tx.length}</strong><span class="stat-note">Recent records</span></div></section>
    <section class="panel activity"><div class="panel-head"><div><div class="eyebrow">REQUEST QUEUE</div><h2>Transaction requests</h2></div></div>
    <div class="table-wrap"><table class="table"><tr><th>ID</th><th>USER</th><th>TYPE</th><th>AMOUNT</th><th>STATUS</th><th>ACTION</th></tr>${tx.map(t=>`<tr><td>#${t.id}</td><td>${esc(t.email)}</td><td>${esc(t.type)}</td><td>$${Number(t.amount).toFixed(2)}</td><td><span class="pill">${esc(t.status)}</span></td><td>${t.status==='pending'?`<button class="small-btn" onclick="reviewTx(${t.id},'approved')">Approve</button> <button class="small-btn danger" onclick="reviewTx(${t.id},'rejected')">Reject</button>`:'—'}</td></tr>`).join('')}</table></div></section>
    <section class="panel activity"><div class="panel-head"><div><div class="eyebrow">USERS</div><h2>Registered users</h2></div></div><div class="table-wrap"><table class="table"><tr><th>ID</th><th>NAME</th><th>EMAIL</th><th>BALANCE</th><th>JOINED</th></tr>${users.map(u=>`<tr><td>#${u.id}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>$${Number(u.balance).toFixed(2)}</td><td>${esc(u.created_at)}</td></tr>`).join('')}</table></div></section></main>`;
  }catch(e){alert(e.message);location.href='/'}
}
async function reviewTx(id,status){try{await api('/api/admin/transactions/'+id,{method:'POST',body:JSON.stringify({status})});showAdmin()}catch(e){alert(e.message)}}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
async function requestTx(type){const amount=prompt(type==='deposit_request'?'Deposit amount:':'Withdrawal amount:');if(!amount)return;try{await api('/api/transactions',{method:'POST',body:JSON.stringify({type,amount:Number(amount)})});alert('Request submitted.');showDashboard()}catch(e){alert(e.message)}}
function logout(){localStorage.removeItem('token');location.href='/'}
if(location.pathname==='/dashboard'&&localStorage.token)showDashboard();
if(location.pathname==='/admin'&&localStorage.token)showAdmin();