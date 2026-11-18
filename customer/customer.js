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

let sb=null;
const cfg=window.SUPABASE_CONFIG||{}, hasConfig=!!(cfg.url&&cfg.anonKey&&window.supabase);
sb=hasConfig?window.supabase.createClient(cfg.url,cfg.anonKey):null;
let user=null, authMode='login', pendingBooking=null;
$('#year').textContent=new Date().getFullYear();
const planModal=$('#planRequestModal'),planForm=$('#planRequestForm');
function closePlanModal(){planModal.classList.remove('open');planModal.setAttribute('aria-hidden','true')}
document.querySelectorAll('[data-plan-request]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();planForm.reset();$('#requestedPlan').value=button.dataset.planRequest;$('#planRequestMessage').textContent='Submitting a request does not activate a plan or require payment.';$('#submitPlanRequest').disabled=false;planModal.classList.add('open');planModal.setAttribute('aria-hidden','false')}));
$('#closePlanRequest').onclick=closePlanModal;
document.querySelectorAll('[data-plan-info]').forEach(button=>button.addEventListener('click',()=>{const plan=button.dataset.planInfo;const details={
 'Smile Care Visit':'Smile Care Visit includes an initial dental assessment, care recommendations, and next-visit guidance. Price: ₱800 per visit. Please confirm the final fee and included services with the clinic.',
 'Family Dental Day':'Family Dental Day helps coordinate dental visits for family members. It includes appointment coordination, individual care discussions, and visit reminders. Price: ₱1,500 coordination package for a family visit; dental examinations or treatments may have separate charges. Please confirm the final fee with the clinic.',
 'Smile Alignment Consult':'Smile Alignment Consult includes an alignment consultation, an overview of orthodontic options, and personalized next steps. Price: ₱1,000 for the consultation. Braces, aligners, records, and other treatment costs are not included. Please confirm the final fee with the clinic.'
};const panel=$('#chatPanel');panel.classList.add('open');panel.setAttribute('aria-hidden','false');const box=$('#chatMessages');const question=document.createElement('div');question.className='user-message';question.textContent='Tell me more about '+plan+'.';box.append(question);const reply=document.createElement('div');reply.className='bot-message';reply.textContent=details[plan]||'Please contact the clinic for details about this plan.';box.append(reply);box.scrollTop=box.scrollHeight;}));
planModal.addEventListener('click',e=>{if(e.target===planModal)closePlanModal()});
planForm.onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(planForm));const requests=JSON.parse(localStorage.getItem('sd_plan_requests')||'[]');const request={id:'PLN-'+String(Date.now()).slice(-8),plan:v.plan,name:v.name.trim(),email:v.email.trim(),phone:v.phone.trim(),message:v.message.trim(),createdAt:new Date().toISOString(),status:'Pending review'};requests.unshift(request);localStorage.setItem('sd_plan_requests',JSON.stringify(requests));const activities=JSON.parse(localStorage.getItem('sd_activities')||'[]');activities.unshift({time:new Date().toLocaleString('en-PH'),text:'Customer plan request received: '+request.name+' — '+request.plan});localStorage.setItem('sd_activities',JSON.stringify(activities.slice(0,60)));$('#planRequestMessage').textContent='Your request has been recorded in this browser demo. The clinic must review it before activation. This demo does not sync across different devices.';toast('Plan request submitted. Await clinic review.');$('#submitPlanRequest').disabled=true;setTimeout(()=>{closePlanModal();$('#submitPlanRequest').disabled=false},2200)};
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
async function checkDentistAvailability(){
 if(!availabilityPanel)return;
 const date=dateSelect.value,time=timeSelect.value,doctor=doctorSelect.value;
 availabilityPanel.className='availability-panel';
 if(!date||!time||!doctor){availabilityPanel.textContent='Choose a dentist, date, and time to check availability.';return}
 if(!sb){availabilityPanel.classList.add('unavailable');availabilityPanel.textContent='Clinic availability cannot be verified until the database connection is configured.';return}
 availabilityPanel.textContent='Checking the clinic schedule…';
 try{
  const {data,error}=await sb.rpc('check_customer_booking_slot',{
   p_doctor_name:doctor,p_date:date,p_time:toDatabaseTime(time),p_duration_minutes:30
  });
  if(error)throw error;
  if(data?.available){
   availabilityPanel.classList.add('available');
   availabilityPanel.innerHTML='<strong>Available</strong>'+doctor+' has an open slot at '+time+'. The appointment will be automatically confirmed only if this dentist has enabled that setting; otherwise it will remain pending.';
  }else{
   availabilityPanel.classList.add('unavailable');
   availabilityPanel.innerHTML='<strong>Not available</strong>'+String(data?.reason||'Please choose another time.');
  }
 }catch(err){
  availabilityPanel.classList.add('unavailable');
  availabilityPanel.innerHTML='<strong>Unable to check availability</strong>'+String(err.message||'Please try again.');
 }
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
const sampleServiceAmounts={'Dental consultation':300,'Tooth extraction':800,'Mouth guard':2500,'Teeth whitening':6000,'Dental implants':50000,'Oral prophylaxis':600,'Wisdom tooth removal':4500,'Gingivectomy':2500,'Dental veneers':4500,'Complete denture':8000,'Removable partial denture':3000,'Fixed partial denture (bridge)':8000,'Fluoride treatment':300,'Pits & fissure sealant':300,'Digital dental X-ray':300,'Other / Not sure yet':0};
function sampleAmount(service){return sampleServiceAmounts[service]||0}
function updatePaymentPreview(){
 const form=$('#bookingForm');if(!form)return;
 const service=form.elements.service.value,method=form.elements.paymentMethod.value,amount=sampleAmount(service);
 const amountText=amount?'₱'+amount.toLocaleString('en-PH'):'To be quoted by clinic';
 const preview=$('#paymentPreview');if(preview)preview.textContent='Sample estimated amount: '+amountText+(method?' · Preferred method: '+method:'');
 const qr=$('#gcashBalancePreview');if(qr)qr.textContent=method==='GCash (Online)'?'Demo GCash amount: '+amountText+'. No real payment is processed.':method==='Pay at clinic'?'Selected: Pay at the clinic. The sample balance is payable at reception.':'Choose a payment method to preview the sample balance.';
}
$('#bookingForm [name="service"]').addEventListener('change',updatePaymentPreview);
$('#bookingPaymentMethod').addEventListener('change',updatePaymentPreview);
function toDatabaseTime(value){
 const m=String(value||'').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
 if(!m)throw new Error('Please choose a valid appointment time.');
 let h=Number(m[1]),min=Number(m[2]);
 if(m[3]){if(m[3].toUpperCase()==='PM'&&h!==12)h+=12;if(m[3].toUpperCase()==='AM'&&h===12)h=0}
 return String(h).padStart(2,'0')+':'+String(min).padStart(2,'0')+':00';
}
function showBookingReceipt(data,result,status){
 const id=result?.id||('SDC-'+Date.now()),amount=sampleAmount(data.service),amountText=amount?'₱'+amount.toLocaleString('en-PH'):'To be quoted by clinic';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let layer=document.getElementById('bookingReceiptLayer');
 if(!layer){
  layer=document.createElement('div');layer.id='bookingReceiptLayer';layer.className='receipt-layer';
  layer.innerHTML='<section class="booking-receipt" role="dialog" aria-modal="true"><div class="receipt-actions"><button type="button" class="btn btn-outline" id="closeBookingReceipt">Close</button><button type="button" class="btn btn-primary" id="printBookingReceipt">Print receipt</button></div><div class="receipt-brand"><img src="../assets/clinic-logo.svg" alt=""><div><b>S Dental Clinic</b><small>APPOINTMENT CONFIRMATION</small></div></div><h2>Appointment receipt</h2><p class="receipt-subtitle">Please keep this receipt for your records.</p><div class="receipt-status" id="receiptStatus"></div><div class="receipt-number"><span>REFERENCE NUMBER</span><b id="receiptNumber"></b></div><div class="receipt-details" id="receiptDetails"></div><div class="receipt-total"><span>Estimated service amount</span><b id="receiptAmount"></b></div><p class="receipt-disclaimer">This is an appointment request/confirmation receipt, not an official payment receipt. No payment was processed. Payment status: PENDING. The final treatment fee will be confirmed by the clinic.</p><p class="receipt-thanks">Thank you for choosing S Dental Clinic.</p></section>';
  document.body.appendChild(layer);
  const style=document.createElement('style');style.textContent='.receipt-layer{position:fixed;inset:0;z-index:100;background:#10213c99;display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto}.booking-receipt{background:#fff;color:#1b2b43;width:min(620px,100%);max-height:94vh;overflow:auto;border-radius:16px;padding:30px;box-shadow:0 20px 70px #10213c44}.receipt-actions{display:flex;justify-content:flex-end;gap:10px;margin-bottom:22px}.receipt-brand{display:flex;align-items:center;gap:12px;border-bottom:1px solid #e1e9f2;padding-bottom:18px}.receipt-brand img{width:48px;height:48px;object-fit:contain}.receipt-brand b,.receipt-brand small{display:block}.receipt-brand b{font:800 17px Manrope}.receipt-brand small,.receipt-number span{font-size:9px;letter-spacing:1.5px;color:#6c7d94}.booking-receipt h2{font:800 27px Manrope;margin:24px 0 4px}.receipt-subtitle{color:#6c7d94;font-size:12px}.receipt-status{display:inline-block;margin:12px 0;padding:8px 12px;border-radius:20px;background:#e5f7ed;color:#16835f;font-size:11px;font-weight:700}.receipt-status.pending{background:#fff4df;color:#94600a}.receipt-number{display:flex;justify-content:space-between;gap:10px;background:#f5f8fc;padding:14px;border-radius:9px;margin:10px 0 18px}.receipt-number b{font-size:12px;overflow-wrap:anywhere}.receipt-details{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:6px 0 18px}.receipt-details span,.receipt-details b{display:block}.receipt-details span{font-size:10px;color:#6c7d94;margin-bottom:5px}.receipt-details b{font-size:12px;overflow-wrap:anywhere}.receipt-total{border-top:1px solid #e1e9f2;border-bottom:1px solid #e1e9f2;padding:17px 0;display:flex;justify-content:space-between;gap:12px;font-size:12px}.receipt-total b{font-size:17px;color:#172e57}.receipt-disclaimer{background:#fff8e8;color:#84621c;padding:13px;border-radius:8px;font-size:10px;line-height:1.6;margin-top:18px}.receipt-thanks{text-align:center;font-size:11px;color:#6c7d94;margin:20px 0 0}@media(max-width:520px){.booking-receipt{padding:20px}.receipt-details{grid-template-columns:1fr 1fr}.receipt-number{flex-direction:column}}@media print{body>*:not(#bookingReceiptLayer){display:none!important}#bookingReceiptLayer{position:static!important;display:block!important;background:#fff!important;padding:0!important;overflow:visible!important}.booking-receipt{width:100%!important;max-height:none!important;overflow:visible!important;box-shadow:none!important;border-radius:0!important;padding:12px!important}.receipt-actions{display:none!important}}';document.head.appendChild(style);
  layer.querySelector('#closeBookingReceipt').onclick=()=>layer.remove();
  layer.querySelector('#printBookingReceipt').onclick=()=>window.print();
 }
 layer.querySelector('#receiptStatus').textContent=status==='Confirmed'?'APPOINTMENT CONFIRMED':'PENDING CLINIC CONFIRMATION';
 layer.querySelector('#receiptStatus').classList.toggle('pending',status!=='Confirmed');
 layer.querySelector('#receiptNumber').textContent=id;
 const rows=[['Customer name',data.name],['Email address',data.email],['Contact number',data.phone],['Service',data.service],['Preferred date',data.date],['Preferred time',data.time],['Dentist',data.doctor],['Payment method',data.paymentMethod],['Payment status','Pending']];
 layer.querySelector('#receiptDetails').innerHTML=rows.map(([k,v])=>'<div><span>'+esc(k)+'</span><b>'+esc(v||'—')+'</b></div>').join('');
 layer.querySelector('#receiptAmount').textContent=amountText+' (estimate)';
 layer.hidden=false;
}
async function submitDemoBooking(data){
 if(!sb||!user){showAuth('Please log in before requesting an appointment.');return}
 const button=$('#bookingForm button[type="submit"]');if(button)button.disabled=true;
 try{
  const {data:result,error}=await sb.rpc('create_customer_appointment',{
   p_customer_name:data.name,p_customer_phone:data.phone,p_service:data.service,
   p_notes:data.notes||'',p_doctor_name:data.doctor,p_date:data.date,
   p_time:toDatabaseTime(data.time),p_payment_method:data.paymentMethod
  });
  if(error)throw error;
  const status=result?.status||'Pending',ref=result?.id?'Appointment reference: '+result.id:'';
  $('#bookingMessage').textContent=status==='Confirmed'
   ?'Your appointment is confirmed automatically because the selected dentist has enabled that setting. '+ref+' Payment is still pending; no payment was processed.'
   :'Your appointment request has been received and is pending clinic confirmation. '+ref+' Payment is still pending; no payment was processed.';
  toast(status==='Confirmed'?'Appointment confirmed.':'Appointment request submitted.');
  showBookingReceipt(data,result,status);
  $('#bookingForm').reset();updatePaymentPreview();checkDentistAvailability();
 }catch(err){
  $('#bookingMessage').textContent=err.message||'Unable to submit your appointment. Please try again.';
  toast(err.message||'Appointment could not be submitted.');
 }finally{if(button)button.disabled=false}
}
$('#bookingForm').onsubmit=async e=>{
 e.preventDefault();
 const data=Object.fromEntries(new FormData(e.currentTarget));
 if(!user){pendingBooking=data;showAuth('login');$('#authMessage').textContent=hasConfig?'Log in or create an account to continue.':'Connect Supabase authentication before customer sign-up and booking can be enabled.';return}
 await submitDemoBooking(data);
};
$('#menuToggle').onclick=()=>$('#mainNav').classList.toggle('open');document.querySelectorAll('#mainNav a').forEach(a=>a.onclick=()=>$('#mainNav').classList.remove('open'));
updatePaymentPreview();
const answers=[
[/book|appointment|schedule/i,'To request a visit, create an account, complete the appointment form, and choose your preferred date and time. The clinic must confirm availability before your appointment is final.'],
[/service|treatment|clean|filling|braces|orthodont/i,'The portal lists consultation, oral cleaning, tooth restoration, and orthodontic consultation. Please contact the clinic to confirm currently available treatments.'],
[/pay|payment|qr|bill|balance/i,'Please use only the clinic’s official payment instructions. Verify the recipient and amount before paying. The official clinic QR code has not been configured on this demo portal yet.'],
[/hour|open|location|address|contact|phone/i,'Clinic opening hours, address, and contact details have not yet been added to this demo. Please check directly with S Dental Clinic for the latest information.'],
[/price|cost|promo|offer|plan/i,'For current prices and payment options, please contact S Dental Clinic directly.'],
[/cancel|resched|change/i,'For cancellations or schedule changes, please contact the clinic directly. Online request management will be enabled after the clinic booking database is connected.'],
[/emergency|pain|hurt|swollen/i,'I can only provide general clinic information, not diagnose or assess symptoms. For urgent concerns, contact a qualified dental professional or seek appropriate urgent care.']
];
function botReply(q){const hit=answers.find(([re])=>re.test(q));return hit?hit[1]:'I can help with general questions about appointments, services, payment steps, and clinic information. Try asking “How do I book an appointment?”';}
function sendChat(q){if(!q.trim())return;const box=$('#chatMessages');const u=document.createElement('div');u.className='user-message';u.textContent=q;box.append(u);const b=document.createElement('div');b.className='bot-message';b.textContent=botReply(q);box.append(b);box.scrollTop=box.scrollHeight}
$('#openChat').onclick=()=>{$('#chatPanel').classList.add('open');$('#chatPanel').setAttribute('aria-hidden','false')};$('#closeChat').onclick=()=>{$('#chatPanel').classList.remove('open');$('#chatPanel').setAttribute('aria-hidden','true')};$('#chatForm').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,q=f.message.value;sendChat(q);f.reset()};document.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>sendChat(b.dataset.question));
})();