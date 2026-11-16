(()=>{
const $=s=>document.querySelector(s), toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)};
const cfg=window.SUPABASE_CONFIG||{}, hasConfig=!!(cfg.url&&cfg.anonKey&&window.supabase), sb=hasConfig?window.supabase.createClient(cfg.url,cfg.anonKey):null;
let user=null, authMode='login', pendingBooking=null;
$('#year').textContent=new Date().getFullYear();
const dateInput=$('input[name="date"]');dateInput.min=new Date().toISOString().slice(0,10);
function showAuth(mode='login'){authMode=mode;$('#authModal').classList.add('open');$('#authModal').setAttribute('aria-hidden','false');renderAuth()}
function closeModal(id){$('#'+id).classList.remove('open');$('#'+id).setAttribute('aria-hidden','true')}
function renderAuth(){const signup=authMode==='signup';$('#authTitle').textContent=signup?'Create your account.':'Welcome back.';$('#authIntro').textContent=signup?'Register to request and manage appointment visits.':'Log in to continue with your appointment request.';$('#authNameWrap').hidden=!signup;$('#authNameWrap input').required=signup;$('#authSubmit').textContent=signup?'Create account':'Log in';document.querySelectorAll('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===authMode));$('#authMessage').textContent=hasConfig?'Your account is securely managed by the clinic portal.':'Demo mode: connect Supabase to enable real customer accounts.'}
function updateUser(u){user=u;$('#userState').textContent=u?(u.email||'Signed in'):'Login required';$('#userState').classList.toggle('logged',!!u);const name=$('#bookingForm [name="name"]'),email=$('#bookingForm [name="email"]');if(u){if(u.user_metadata?.full_name)name.value=u.user_metadata.full_name;email.value=u.email||'';name.readOnly=!!u.user_metadata?.full_name;email.readOnly=!!u.email}else{name.readOnly=false;email.readOnly=false}}
if(sb){sb.auth.getSession().then(({data})=>updateUser(data.session?.user||null));sb.auth.onAuthStateChange((_event,session)=>updateUser(session?.user||null))}
$('#loginNav').onclick=()=>showAuth('login');$('#signupNav').onclick=()=>showAuth('signup');document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));$('#authModal').onclick=e=>{if(e.target.id==='authModal')closeModal('authModal')};document.querySelectorAll('[data-auth-tab]').forEach(b=>b.onclick=()=>{authMode=b.dataset.authTab;renderAuth()});
$('#authForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),email=f.get('email'),password=f.get('password'),fullName=f.get('fullName');if(!hasConfig){toast('Supabase is not connected yet. Account sign-in is unavailable.');$('#authMessage').textContent='Add the Supabase Project URL and anon/public key in config.js to enable authentication.';return}$('#authSubmit').disabled=true;try{if(authMode==='signup'){const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name:fullName}}});if(error)throw error;if(data.session){updateUser(data.user);toast('Account created. You can continue booking.')}else{$('#authMessage').textContent='Check your email for the confirmation link, then log in.';toast('Check your email to confirm your account.')} }else{const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;updateUser(data.user);toast('You are logged in.')}if(user){closeModal('authModal');if(pendingBooking){submitDemoBooking(pendingBooking);pendingBooking=null}}}catch(err){$('#authMessage').textContent=err.message||'Unable to authenticate.'}finally{$('#authSubmit').disabled=false}};
function submitDemoBooking(data){
 const now=new Date().toISOString();
 const requests=JSON.parse(localStorage.getItem('sd_customer_requests')||'[]');
 requests.unshift({...data,createdAt:now,status:'Pending'});
 localStorage.setItem('sd_customer_requests',JSON.stringify(requests));
 // Demo bridge: the staff dashboard reads these same-origin localStorage keys.
 // This only syncs on the same browser/device; it is not a cross-device clinic database.
 const appts=JSON.parse(localStorage.getItem('sd_appts')||'[]');
 appts.push({date:data.date,time:data.time,patient:data.name,treatment:data.service,doctor:'To be assigned',status:'Pending',customerEmail:data.email,customerPhone:data.phone,customerRequest:true});
 localStorage.setItem('sd_appts',JSON.stringify(appts));
 const patients=JSON.parse(localStorage.getItem('sd_patients')||'[]');
 if(!patients.some(p=>(p.email&&p.email.toLowerCase()===data.email.toLowerCase())||p.name.toLowerCase()===data.name.toLowerCase())){
  patients.unshift({id:'PT-'+String(Date.now()).slice(-6),name:data.name,contact:data.phone,email:data.email,last:'Not visited yet',status:'Active'});
  localStorage.setItem('sd_patients',JSON.stringify(patients));
 }
 const activities=JSON.parse(localStorage.getItem('sd_activities')||'[]');
 activities.unshift({time:new Date().toLocaleString('en-PH'),text:'Customer appointment request received: '+data.name+' ('+data.service+')'});
 localStorage.setItem('sd_activities',JSON.stringify(activities.slice(0,60)));
 $('#bookingMessage').textContent='Your request has been added to the staff dashboard on this browser. The clinic must review and confirm it. This demo does not sync across different devices yet.';
 toast('Appointment request added to this browser demo.');
}
$('#bookingForm').onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));if(!user){pendingBooking=data;showAuth('login');$('#authMessage').textContent=hasConfig?'Log in or create an account to continue.':'Connect Supabase authentication before customer sign-up and booking can be enabled.';return}submitDemoBooking(data)};
$('#menuToggle').onclick=()=>$('#mainNav').classList.toggle('open');document.querySelectorAll('#mainNav a').forEach(a=>a.onclick=()=>$('#mainNav').classList.remove('open'));
const answers=[
[/book|appointment|schedule/i,'To request a visit, create an account, complete the appointment form, and choose your preferred date and time. The clinic must confirm availability before your appointment is final.'],
[/service|treatment|clean|filling|braces|orthodont/i,'The portal lists consultation, oral cleaning, tooth restoration, and orthodontic consultation as example service categories. Please contact the clinic to confirm the treatments currently offered.'],
[/pay|payment|qr|bill|balance/i,'Please use only the clinic’s official payment instructions. Verify the recipient and amount before paying. The official clinic QR code has not been configured on this demo portal yet.'],
[/hour|open|location|address|contact|phone/i,'Clinic opening hours, address, and contact details have not yet been added to this demo. Please check directly with S Dental Clinic for the latest information.'],
[/price|cost|promo|offer|plan/i,'The plans shown are sample descriptions, not active promotions or confirmed prices. Contact the clinic for current prices, availability, and inclusions.'],
[/cancel|resched|change/i,'For cancellations or schedule changes, please contact the clinic directly. Online request management will be enabled after the clinic booking database is connected.'],
[/emergency|pain|hurt|swollen/i,'I can only provide general clinic information, not diagnose or assess symptoms. For urgent concerns, contact a qualified dental professional or seek appropriate urgent care.']
];
function botReply(q){const hit=answers.find(([re])=>re.test(q));return hit?hit[1]:'I can help with general questions about appointments, services, payment steps, plans, and clinic information. Try asking “How do I book an appointment?”';}
function sendChat(q){if(!q.trim())return;const box=$('#chatMessages');const u=document.createElement('div');u.className='user-message';u.textContent=q;box.append(u);const b=document.createElement('div');b.className='bot-message';b.textContent=botReply(q);box.append(b);box.scrollTop=box.scrollHeight}
$('#openChat').onclick=()=>{$('#chatPanel').classList.add('open');$('#chatPanel').setAttribute('aria-hidden','false')};$('#closeChat').onclick=()=>{$('#chatPanel').classList.remove('open');$('#chatPanel').setAttribute('aria-hidden','true')};$('#chatForm').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,q=f.message.value;sendChat(q);f.reset()};document.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>sendChat(b.dataset.question));
})();