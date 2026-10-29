const SUPABASE_READY = typeof window.supabase !== 'undefined' && window.EXPENSEFLOW_SUPABASE_URL && !window.EXPENSEFLOW_SUPABASE_URL.includes('YOUR_PROJECT_ID') && window.EXPENSEFLOW_SUPABASE_KEY && !window.EXPENSEFLOW_SUPABASE_KEY.includes('YOUR_SUPABASE');
const db = SUPABASE_READY ? window.supabase.createClient(window.EXPENSEFLOW_SUPABASE_URL, window.EXPENSEFLOW_SUPABASE_KEY) : null;
let remoteTransactions = null;
function getTransactions(){return JSON.parse(localStorage.getItem('transactions')||'[]')}
function setTransactions(rows){localStorage.setItem('transactions',JSON.stringify(rows));remoteTransactions=rows}
async function currentUser(){if(!db)return null;const {data}=await db.auth.getUser();return data?.user||null}
async function loadTransactions(){
  // Guest mode is local-only. Never use guest localStorage as a fallback for an authenticated account.
  if(!db){remoteTransactions=getTransactions();return remoteTransactions}
  const user=await currentUser();
  if(!user){remoteTransactions=getTransactions();return remoteTransactions}
  const {data,error}=await db.from('transactions').select('*').eq('user_id',user.id).order('transaction_date',{ascending:false});
  if(error){
    console.error("Could not load this user transactions:",error);
    const tbody=document.getElementById('transactionBody');
    if(tbody)tbody.innerHTML='<tr><td colspan="5" class="center">Could not load cloud transactions. Check your Supabase table and RLS policies, then refresh.</td></tr>';
    remoteTransactions=[];
    return remoteTransactions;
  }
  remoteTransactions=(data||[]).map(x=>({id:x.id,type:x.type,desc:x.description,amount:Number(x.amount),category:x.category,date:x.transaction_date}));
  return remoteTransactions;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function saveTransaction(type){let desc=document.getElementById('description').value.trim(),amount=parseFloat(document.getElementById('amount').value),category=document.getElementById('category').value,date=document.getElementById('date').value||new Date().toISOString().slice(0,10);if(!desc||!Number.isFinite(amount)||amount<=0){alert('Please enter a description and a valid amount.');return}const user=await currentUser();if(db&&user){const {error}=await db.from('transactions').insert({user_id:user.id,type,description:desc,amount,category,transaction_date:date});if(error){alert('Could not save to Supabase: '+error.message);return}}else{let rows=getTransactions();rows.push({id:Date.now(),type,desc,amount,category,date});setTransactions(rows)}alert(type+' saved!');location.href='dashboard.html'}
async function renderTransactions(){let tbody=document.getElementById('transactionBody');if(!tbody)return;let rows=await loadTransactions();tbody.innerHTML=rows.length?rows.slice().reverse().map(x=>`<tr><td>${escapeHtml(x.date)}</td><td>${escapeHtml(x.desc)}</td><td>${escapeHtml(x.category)}</td><td class="${x.type==='Income'?'success':'danger'}">${x.type==='Income'?'+':'-'} ₹${Number(x.amount).toFixed(2)}</td><td><button class="btn" onclick="deleteTransaction('${x.id}')">Delete</button></td></tr>`).join(''):'<tr><td colspan="5" class="center">No transactions yet.</td></tr>';}
async function deleteTransaction(id){if(!confirm('Delete this transaction?'))return;const user=await currentUser();if(db&&user){const {error}=await db.from('transactions').delete().eq('id',id).eq('user_id',user.id);if(error){alert(error.message);return}}else setTransactions(getTransactions().filter(x=>String(x.id)!==String(id)));await renderTransactions();await updateSummary()}
async function updateSummary(){let rows=await loadTransactions(),income=rows.filter(x=>x.type==='Income').reduce((a,x)=>a+Number(x.amount),0),expense=rows.filter(x=>x.type==='Expense').reduce((a,x)=>a+Number(x.amount),0);for(let [id,v] of [['income',income],['expenses',expense],['balance',income-expense]]){let e=document.getElementById(id);if(e)e.textContent='₹'+v.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}renderMonthlySummary(rows)}
function renderMonthlySummary(rows){const target=document.getElementById('monthlySummary');if(!target)return;const months={};rows.forEach(x=>{const key=(x.date||'').slice(0,7)||'Unknown';if(!months[key])months[key]={income:0,expenses:0,count:0};months[key][x.type==='Income'?'income':'expenses']+=Number(x.amount);months[key].count++});const keys=Object.keys(months).sort().reverse();target.innerHTML=keys.length?keys.map(k=>{const m=months[k],label=k==='Unknown'?k:new Date(k+'-01T12:00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'});return `<section class="month-card"><h3>${escapeHtml(label)}</h3><p class="success">Total income: ₹${m.income.toLocaleString('en-IN',{minimumFractionDigits:2})}</p><p class="danger">Total expenses: ₹${m.expenses.toLocaleString('en-IN',{minimumFractionDigits:2})}</p><p><strong>Balance: ₹${(m.income-m.expenses).toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></p><p class="small-note">${m.count} transactions</p></section>`}).join(''):'<p class="muted">Monthly totals will appear after you add income or expenses.</p>'}
function filterTable(){let q=(document.getElementById('search')?.value||'').toLowerCase();document.querySelectorAll('#transactionBody tr').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?'':'none')}
async function calculateBudget(){let budget=parseFloat(document.getElementById('budget').value)||0,rows=await loadTransactions(),spent=rows.filter(x=>x.type==='Expense').reduce((a,x)=>a+Number(x.amount),0),el=document.getElementById('budgetResult');if(el)el.textContent=`Spent: ₹${spent.toFixed(2)} | Remaining: ₹${(budget-spent).toFixed(2)}`}
async function signInOptional(){const name=document.getElementById('profileName').value.trim(),email=document.getElementById('profileEmail').value.trim(),password=document.getElementById('profilePassword')?.value;if(!name||!email||!password){alert('Enter name, email and password, or continue as guest.');return}if(!db){alert('Add your Supabase URL and publishable key in supabase-config.js first.');return}const {data,error}=await db.auth.signUp({email,password,options:{data:{name}}});if(error){alert(error.message);return}localStorage.setItem('expenseProfile',JSON.stringify({name,email}));alert(data.session?'Account created and signed in.':'Account created. Check your email to confirm, then sign in.');showProfile()}
async function signInExisting(){if(!db){alert('Add your Supabase URL and publishable key in supabase-config.js first.');return}const email=document.getElementById('profileEmail').value.trim(),password=document.getElementById('profilePassword').value;if(!email||!password){alert('Enter email and password.');return}const {error}=await db.auth.signInWithPassword({email,password});if(error){alert(error.message);return}await showProfile();await renderTransactions();await updateSummary();alert('Signed in successfully.')}
async function continueAsGuest(){if(db)await db.auth.signOut();localStorage.removeItem('expenseProfile');showProfile();alert('Continuing as guest. Guest transactions are stored on this device.')}
async function showProfile(){let info=document.getElementById('profileInfo'),form=document.getElementById('profileForm');if(!info||!form)return;let user=await currentUser();if(user){info.innerHTML=`<h2>Signed in</h2><p>${escapeHtml(user.email)}</p><p class="muted">Transactions are linked to your Supabase account.</p><button class="btn secondary" onclick="signOut()">Sign out</button>`;form.classList.add('hidden');return}let p=JSON.parse(localStorage.getItem('expenseProfile')||'null');info.innerHTML=p?`<h2>Guest profile: ${escapeHtml(p.name)}</h2><p>${escapeHtml(p.email)}</p>`:'<h2>Guest profile</h2><p class="muted">Sign in to sync your transactions securely across devices.</p>';form.classList.remove('hidden')}
async function signOut(){if(db)await db.auth.signOut();localStorage.removeItem('expenseProfile');showProfile()}
function initTheme(){const saved=localStorage.getItem('expenseTheme')||'light';document.documentElement.dataset.theme=saved;document.querySelectorAll('.theme-toggle').forEach(b=>{b.textContent=saved==='dark'?'☀️ Light':'🌙 Dark';b.onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('expenseTheme',next);document.querySelectorAll('.theme-toggle').forEach(x=>x.textContent=next==='dark'?'☀️ Light':'🌙 Dark')}})}
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  // Give a useful status instead of leaving the original "Connect Supabase"
  // notice visible after valid credentials have been entered.
  const status = document.querySelector('.supabase-status');
  if (status) {
    const url = window.EXPENSEFLOW_SUPABASE_URL || '';
    const key = window.EXPENSEFLOW_SUPABASE_KEY || '';
    const credentialsPresent =
      /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/.test(url) &&
      key.length > 20 &&
      !url.includes('YOUR_PROJECT_ID') &&
      !key.includes('YOUR_SUPABASE');

    if (!window.supabase) {
      status.textContent = 'Supabase library did not load. Check your internet connection and refresh this page.';
    } else if (!credentialsPresent) {
      status.textContent = 'Connect Supabase: open supabase-config.js and enter your Project URL and Publishable key.';
    } else {
      status.textContent = 'Supabase settings detected. Open Profile / Sign In and sign in to test cloud sync.';
    }
  }

  await renderTransactions();
  await updateSummary();
  await showProfile();
});
