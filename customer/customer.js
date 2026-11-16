(()=>{
const $=s=>document.querySelector(s), toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)};

function showReschedulePage(){
 const token=new URLSearchParams(location.search).get('reschedule');if(!token)return;
 const page=document.createElement('section');page.className='section';page.style.minHeight='70vh';page.innerHTML='<div class="form-card" style="max-width:650px;margin:30px auto"><span class="eyebrow">APPOINTMENT UPDATE</span><h2>Review your new appointment time</h2><div id="rescheduleContent"><p>Loading your appointment update…</p></div></div>';const main=document.querySelector('main');main.prepend(page);Array.from(main.children).slice(1).forEach(el=>el.hidden=true);
 const all=JSON.parse(localStorage.getItem('sd_reschedules')||'[]'),item=all.find(x=>x.token===token);
 const root=page.querySelector('#rescheduleContent');
 if(!item){root.innerHTML='<p>This appointment link is unavailable on this device. Please contact S Dental Clinic for help. Links in this demo only work in the same browser where the request was created.</p>';return}
 if(item.status==='Awaiting response'){
  root.innerHTML='<p>Your original appointment with <b>'+item.originalDoctor+'</b> on <b>'+item.originalDate+'</b> at <b>'+item.originalTime+'</b> was affected by an emergency leave.</p><div class="availability-panel available"><strong>Suggested replacement</strong>'+item.proposedDate+' at '+item.proposedTime+' with '+item.proposedDoctor+'</div><p>Please choose one option below.</p><div class="emergency-actions"><button class="btn btn-primary" id="acceptReschedule">Confirm new schedule</button><button class="btn btn-outline" id="showAlternate">Request another schedule</button><button class="btn btn-outline" id="cancelReschedule">Cancel appointment</button></div><form id="alternateForm" hidden style="margin-top:18px"><label>Preferred date<input type="date" name="date" min="'+new Date().toISOString().slice(0,10)+'" required></label><label>Preferred time<select name="time" required><option value="">Choose a time</option><option>09:00 AM</option><option>10:00 AM</option><option>11:00 AM</option><option>01:00 PM</option><option>02:00 PM</option><option>03:00 PM</option><option>04:00 PM</option></select></label><button class="btn btn-primary">Send preferred schedule</button></form><p class="form-foot" id="rescheduleMessage">Your appointment is not changed until you confirm a proposal.</p>';
  const update=(status,extra={})=>{item.status=status;Object.assign(item,extra);localStorage.setItem('sd_reschedules',JSON.stringify(all));const appts=JSON.parse(localStorage.getItem('sd_appts')||'[]');const appt=appts.find(a=>a.rescheduleToken===token);if(appt){if(status==='Confirmed'){appt.date=item.proposedDate;appt.time=item.proposedTime;appt.doctor=item.proposedDoctor;appt.status='Confirmed'}else if(status==='Cancelled'){appt.status='Cancelled'}else appt.status='Reschedule requested'}localStorage.setItem('sd_appts',JSON.stringify(appts));root.innerHTML='<div class="availability-panel available"><strong>Response recorded</strong>'+status+'. The clinic can review your response.</div>';};
  $('#acceptReschedule').onclick=()=>update('Confirmed');
  $('#cancelReschedule').onclick=()=>{if(confirm('Are you sure you want to cancel this appointment?'))update('Cancelled')};
  $('#showAlternate').onclick=()=>{$('#alternateForm').hidden=false};
  $('#alternateForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);update('Alternative requested',{preferredDate:f.get('date'),preferredTime:f.get('time')})};
 }else root.innerHTML='<div class="availability-panel"><strong>Response already recorded</strong>'+item.status+'. If you need help, contact the clinic directly.</div>';
}
showReschedulePage();
\nconst cfg=window.SUPABASE_CONFIG||{}, hasConfig=!!(cfg.url&&cfg.anonKey&&window.supabase), sb=hasConfig?window.supabase.createClient(cfg.url,cfg.anonKey):null;
let user=null, authMode='login', pendingBooking=null;
$('#year').textContent=new Date().getFullYear();
const gcashName=(cfg.gcashMerchantName||'').trim(),gcashQr=(cfg.gcashQrImageUrl||'').trim();
if(gcashName)$('#gcashMerchantStatus').textContent='Merchant account: '+gcashName+'. Please verify this exact name in GCash before confirming payment.';
if(gcashQr && (/^https:\/\//i.test(gcashQr)||/^\.\.\//.test(gcashQr)||/^\.\//.test(gcashQr)||/^assets\//.test(gcashQr))){
 const qr=$('#gcashQrImage');qr.src=gcashQr;qr.hidden=false;$('#gcashQrPlaceholder').hidden=true;
 qr.onerror=()=>{qr.hidden=true;$('#gcashQrPlaceholder').hidden=false;$('#gcashMerchantStatus').textContent='The configured QR image could not be loaded. Please pay at the clinic and contact staff.'};
}

const dateInput=$('input[name="date"]');dateInput.min=new Date().toISOString().slice(0,10);
const doctorSelect=$('#bookingDoctor'),dateSelect=$('#bookingForm [name="date"]'),timeSelect=$('#bookingForm [name="time"]'),availabilityPanel=$('#availabilityPanel');
const defaultHours={days:['Mon','Tue','Wed','Thu','Fri'],start:'09:00',end:'17:00',breakStart:'10:30',breakEnd:'10:45',lunchStart:'12:00',lunchEnd:'13:00'};
const readClinic=(key,fallback)=>{try{return JSON.parse(localStorage.getItem('sd_'+key))??fallback}catch{return fallback}};
const toMinutes=t=>{if(!t)return NaN;const m=String(t).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);if(!m)return NaN;let hh=Number(m[1]),mm=Number(m[2]);if(m[3]){if(m[3].toUpperCase()==='PM'&&hh!==12)hh+=12;if(m[3].toUpperCase()==='AM'&&hh===12)hh=0}return hh*60+mm};
const dayShort=date=>new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'});
const fmtTime=m=>{let h=Math.floor(m/60),min=m%60;return String((h%12)||12).padStart(2,'0')+':'+String(min).padStart(2,'0')+' '+(h>=12?'PM':'AM')};
function getClinicSchedule(){return {doctors:readClinic('doctors',[{name:'Dr. Ana Reyes',specialty:'General dentistry'},{name:'Dr. Marco Lim',specialty:'Orthodontics'}]),hours:readClinic('hours',{}),blocks:readClinic('blocks',[]),appointments:readClinic('appts',[])}}
function populateDentists(){const s=getClinicSchedule(),current=doctorSelect.value;doctorSelect.innerHTML='<option value="">Choose a dentist</option>'+s.doctors.map(d=>'<option value="'+String(d.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">'+d.name+'</option>').join('');if(current&&s.doctors.some(d=>d.name===current))doctorSelect.value=current;else if(s.doctors.length===1)doctorSelect.value=s.doctors[0].name;checkDentistAvailability()}
function appointmentMinute(value){return toMinutes(value)}
function checkDentistAvailability(){
 if(!availabilityPanel)return;
 const date=dateSelect.value,time=timeSelect.value,doctor=doctorSelect.value;
 availabilityPanel.className='availability-panel';
 if(!date||!time||!doctor){availabilityPanel.textContent='Choose a dentist, date, and time to check availability.';return}
 const s=getClinicSchedule(),hours=s.hours[doctor]||defaultHours,day=dayShort(date),minute=appointmentMinute(time),duration=30;
 const blocked=s.blocks.find(b=>b.date===date&&(!b.doctor||b.doctor===doctor));
 const weekdayNames={Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday',Sun:'Sunday'};
 if(blocked){availabilityPanel.classList.add('unavailable');availabilityPanel.innerHTML='<strong>Not available</strong>'+doctor+' is marked '+(blocked.reason||'unavailable')+' on this date.';return}
 if(!hours.days?.includes(day)){availabilityPanel.classList.add('unavailable');availabilityPanel.innerHTML='<strong>Not a working day</strong>'+doctor+' does not have working hours set for '+weekdayNames[day]+'.';return}
 const start=toMinutes(hours.start),end=toMinutes(hours.end);
 if(!Number.isFinite(start)||!Number.isFinite(end)||minute<start||minute+duration>end){availabilityPanel.classList.add('unavailable');availabilityPanel.innerHTML='<strong>Outside working hours</strong>'+doctor+' schedule is '+fmtTime(start)+'–'+fmtTime(end)+'. Please choose another time.';return}
 const breaks=[['breakStart','breakEnd','Break'],['lunchStart','lunchEnd','Lunch']].filter(([a,b])=>hours[a]&&hours[b]);
 const rest=breaks.find(([a,b])=>minute<toMinutes(hours[b])&&minute+duration>toMinutes(hours[a]));
 if(rest){availabilityPanel.classList.add('unavailable');availabilityPanel.innerHTML='<strong>Unavailable during '+rest[2].toLowerCase()+'</strong>Please choose a time outside '+fmtTime(toMinutes(hours[rest[0]]))+'–'+fmtTime(toMinutes(hours[rest[1]]))+'.';return}
 const busy=s.appointments.find(a=>a.date===date&&a.doctor===doctor&&!/cancel/i.test(a.status||'')&&Math.abs(appointmentMinute(a.time)-minute)<duration);
 if(busy){availabilityPanel.classList.add('unavailable');availabilityPanel.innerHTML='<strong>Time slot already has an appointment</strong>'+doctor+' has another booking around '+(busy.time||'this time')+'. Try a different time.';return}
 availabilityPanel.classList.add('available');availabilityPanel.innerHTML='<strong>Appears available</strong>'+doctor+' works '+fmtTime(start)+'–'+fmtTime(end)+' on '+weekdayNames[day]+'. The clinic must still confirm this request.';
}
doctorSelect.addEventListener('change',checkDentistAvailability);dateSelect.addEventListener('change',checkDentistAvailability);timeSelect.addEventListener('change',checkDentistAvailability);
window.addEventListener('storage',e=>{if(['sd_doctors','sd_hours','sd_blocks','sd_appts'].includes(e.key)){populateDentists()}});
populateDentists();

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
 appts.push({date:data.date,time:data.time,patient:data.name,treatment:data.service,doctor:data.doctor,status:'Pending',customerEmail:data.email,customerPhone:data.phone,customerRequest:true});
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