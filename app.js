
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const fmt=d=>d?new Date(d+'T00:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}):'—';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem('sd_'+k))??f}catch{return f}};
let selectedScheduleDoctor='';
let planRequests=read('plan_requests',[]);
let payments=read('payments',[]);
let patients=read('patients',[{id:'PT-00124',name:'Maria Santos',contact:'0917 123 4567',last:'Nov 16, 2026',status:'Active'},{id:'PT-00123',name:'John Cruz',contact:'0918 234 5678',last:'Nov 15, 2026',status:'Active'}]);
let appointments=read('appts',[{date:today(),time:'09:00 AM',patient:'Maria Santos',treatment:'Cleaning',doctor:'Dr. Ana Reyes',status:'Confirmed'},{date:today(),time:'10:30 AM',patient:'John Cruz',treatment:'Tooth filling',doctor:'Dr. Marco Lim',status:'Pending'}]);
let activities=read('activities',[]), blocks=read('blocks',[]), checks=read('checks',{}), hours=read('hours',{}), doctors=read('doctors',[{name:'Dr. Ana Reyes',specialty:'General dentistry'},{name:'Dr. Marco Lim',specialty:'Orthodontics'}]), page='dashboard', reportPeriod='This month';
function save(){Object.entries({patients,appts:appointments,activities,blocks,checks,hours,doctors,payments}).forEach(([k,v])=>localStorage.setItem('sd_'+k,JSON.stringify(v)))}
function log(t){activities.unshift({time:new Date().toLocaleString('en-PH'),text:t});activities=activities.slice(0,60);save()}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(window.sdToastTimer);window.sdToastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400)}
function badge(s){return '<span class="status '+String(s).toLowerCase()+'">'+esc(s)+'</span>'}
const pageNames={payments:'Payments',dashboard:'Dashboard',patients:'Patients',activities:'Activities',reports:'Reports',schedule:'Schedule',doctors:'Doctors',doctorSchedule:'Doctor Schedule',checklist:'Treatment Preparation Checklist',reportPreview:'Generated Report'};
function go(p){page=p;document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===p));$('#sidebar').classList.remove('open');$('#pageTitle').textContent=pageNames[p]||'Dashboard';$('#crumbPage').textContent=pageNames[p]||'Dashboard';$('#quickAdd').style.display=p==='dashboard'?'':'none';render();window.scrollTo(0,0)}
function appointmentRows(list,showDate){return list.map(a=>'<tr>'+(showDate?'<td>'+fmt(a.date)+'</td>':'')+'<td>'+esc(a.time)+'</td><td>'+esc(a.patient)+'</td><td>'+esc(a.treatment)+'</td><td>'+esc(a.doctor)+'</td><td>'+badge(a.status)+'</td><td>'+esc(a.paymentMethod||'—')+'<br><small class="muted">'+esc(a.paymentStatus||'Not recorded')+'</small></td><td><button class="btn soft" data-edit="'+appointments.indexOf(a)+'">Edit</button></td></tr>').join('')||'<tr><td colspan="'+(showDate?8:7)+'" class="empty">No appointments found.</td></tr>'}
function dash(){let list=appointments.filter(a=>a.date===today()),confirmed=appointments.filter(a=>a.status==='Confirmed').length;return '<div class="stats-grid"><div class="stat-card"><div class="label">Total patients</div><div class="value">'+patients.length+'</div><div class="trend">Registered patient records</div></div><div class="stat-card"><div class="label">Today’s appointments</div><div class="value">'+list.length+'</div><div class="trend">'+confirmed+' confirmed overall</div></div><div class="stat-card"><div class="label">Available doctors</div><div class="value">'+doctors.length+' of '+doctors.length+'</div><div class="trend">Clinic doctor profiles</div></div><div class="stat-card"><div class="label">Pending appointments</div><div class="value">'+appointments.filter(a=>a.status==='Pending').length+'</div><div class="trend">Awaiting confirmation</div></div></div><div class="dashboard-grid"><div class="panel"><div class="panel-head"><h2>Today’s appointments</h2><button class="btn soft" data-go="schedule">View schedule</button></div><div class="table-wrap"><table><thead><tr><th>TIME</th><th>PATIENT</th><th>TREATMENT</th><th>DOCTOR</th><th>STATUS</th><th>PAYMENT METHOD / STATUS</th><th></th></tr></thead><tbody>'+appointmentRows(list,false)+'</tbody></table></div></div><div class="panel"><div class="panel-head"><h2>Doctor availability</h2><button class="btn soft" data-go="doctorSchedule">Manage</button></div>'+doctors.map(d=>'<div class="doctor-row"><b>'+esc(d.name)+'</b><p class="muted">'+esc(d.specialty)+' · Active</p></div>').join('')+'</div></div><div class="panel"><div class="panel-head"><h2>Recent activity</h2><button class="btn soft" data-go="activities">View all</button></div>'+(activities.slice(0,5).map(a=>'<div class="activity-row"><time>'+esc(a.time)+'</time>'+esc(a.text)+'</div>').join('')||'<p class="muted">No recent activity yet.</p>')+'</div>'}
function patientRows(list){return list.map((p)=>'<tr><td>'+esc(p.id)+'</td><td>'+esc(p.name)+'</td><td>'+esc(p.contact)+'</td><td>'+esc(p.last)+'</td><td>'+badge(p.status)+'</td><td><button class="btn soft" data-pedit="'+patients.indexOf(p)+'">View / Edit</button></td></tr>').join('')||'<tr><td colspan="6" class="empty">No patients found.</td></tr>'}
function patientsPage(){return '<div class="panel"><div class="panel-head"><div><h2>Patient records</h2><p class="muted">Manage patient profiles, contact details, and dental history.</p></div><button class="btn primary" data-act="addPatient">＋ Add patient</button></div><div class="toolbar"><input class="search" id="psearch" placeholder="Search name or patient ID"><select id="pstatus"><option value="">All statuses</option><option>Active</option><option>Inactive</option></select></div><div class="table-wrap"><table><thead><tr><th>PATIENT ID</th><th>PATIENT NAME</th><th>CONTACT</th><th>LAST VISIT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody id="prows">'+patientRows(patients)+'</tbody></table></div></div>'}
function activitiesPage(){return '<div class="panel"><div class="panel-head"><h2>Activity log</h2><button class="btn" data-act="clearLog">Clear activity</button></div>'+(activities.map(a=>'<div class="activity-row"><time>'+esc(a.time)+'</time>'+esc(a.text)+'</div>').join('')||'<p class="muted">No activities recorded yet.</p>')+'</div>'}
function reportsPage(){let confirmed=appointments.filter(a=>a.status==='Confirmed').length,pending=appointments.filter(a=>a.status==='Pending').length,cancelled=appointments.filter(a=>a.status==='Cancelled').length;return '<div class="panel"><div class="panel-head"><div><h2>Clinic performance report</h2><p class="muted">Review clinic activity and generate a printable report.</p></div><div class="toolbar"><select id="reportPeriod"><option>This month</option><option>This week</option><option>All records</option></select><button class="btn primary" data-act="generateReport">Generate report</button></div></div><div class="report-kpis">'+[['Patients',patients.length],['Appointments',appointments.length],['Confirmed',confirmed],['Pending',pending]].map(x=>'<div class="stat-card"><div class="label">'+x[0]+'</div><div class="value">'+x[1]+'</div></div>').join('')+'</div><h3>Appointment status breakdown</h3><div class="report-bars">'+[['Confirmed',confirmed],['Pending',pending],['Cancelled',cancelled]].map(x=>'<div class="bar-row"><span>'+x[0]+'</span><div class="bar-track"><i style="width:'+(appointments.length?x[1]/appointments.length*100:0)+'%"></i></div><b>'+x[1]+'</b></div>').join('')+'</div><div class="panel-head"><h3>Appointment records</h3><button class="btn soft" data-act="print">🖨 Print</button></div><div class="table-wrap"><table><thead><tr><th>DATE</th><th>TIME</th><th>PATIENT</th><th>TREATMENT</th><th>DOCTOR</th><th>STATUS</th><th></th></tr></thead><tbody>'+appointmentRows(appointments,true)+'</tbody></table></div></div>'}
function schedulePage(){let list=appointments.filter(a=>a.date===($('#sdate')?.value||today())&&(!$('#sdoctor')?.value||a.doctor===$('#sdoctor').value));return '<div class="panel"><div class="panel-head"><div><h2>Appointment schedule</h2><p class="muted">View and manage daily clinic appointments.</p></div><button class="btn primary" data-act="addAppt">＋ New appointment</button></div><div class="toolbar"><label class="field">Date<input id="sdate" type="date" value="'+today()+'"></label><select id="sdoctor"><option value="">All doctors</option>'+doctors.map(d=>'<option>'+esc(d.name)+'</option>').join('')+'</select></div><div class="table-wrap"><table><thead><tr><th>TIME</th><th>PATIENT</th><th>TREATMENT</th><th>DOCTOR</th><th>STATUS</th><th>PAYMENT METHOD / STATUS</th><th></th></tr></thead><tbody id="srows">'+appointmentRows(list,false)+'</tbody></table></div></div>'}
function doctorsPage(){return '<div class="two-col"><div class="panel"><div class="panel-head"><h2>Doctors</h2><button class="btn primary" data-act="addDoctor">＋ Add doctor</button></div>'+doctors.map((d,i)=>'<div class="doctor-row"><b>'+esc(d.name)+'</b><p class="muted">'+esc(d.specialty)+'</p><button class="btn soft" data-doctor-schedule="'+i+'">Manage schedule</button></div>').join('')+'</div><div class="panel"><h2>Doctor overview</h2><p class="muted">Update working hours, breaks, leave dates, and weekly appointments.</p><button class="btn soft" data-go="doctorSchedule">Open doctor schedule</button></div></div>'}

function timeMinutes(value){const m=String(value||'').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);if(!m)return NaN;let h=+m[1],n=+m[2];if(m[3]){if(m[3].toUpperCase()==='PM'&&h!==12)h+=12;if(m[3].toUpperCase()==='AM'&&h===12)h=0}return h*60+n}
function displayTime(min){let h=Math.floor(min/60),m=min%60;return String((h%12)||12).padStart(2,'0')+':'+String(m).padStart(2,'0')+' '+(h>=12?'PM':'AM')}
function nearestReplacementSlot(original,requests){
 const duration=30,originalMinute=timeMinutes(original.time),base=new Date(original.date+'T00:00:00');
 for(let offset=0;offset<60;offset++){
  const day=new Date(base);day.setDate(day.getDate()+offset);
  const date=[day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-');
  const weekday=day.toLocaleDateString('en-US',{weekday:'short'});
  const candidates=Array.from({length:17},(_,i)=>9*60+i*30).filter(m=>m+duration<=17*60);
  if(offset===0)candidates.sort((a,b)=>Math.abs(a-originalMinute)-Math.abs(b-originalMinute));
  for(const minute of candidates){
   for(const d of doctors){
    const h=hours[d.name]||{days:['Mon','Tue','Wed','Thu','Fri'],start:'09:00',end:'17:00',breakStart:'10:30',breakEnd:'10:45',lunchStart:'12:00',lunchEnd:'13:00'};
    if(!h.days?.includes(weekday)||minute<timeMinutes(h.start)||minute+duration>timeMinutes(h.end))continue;
    if(blocks.some(b=>b.date===date&&(!b.doctor||b.doctor===d.name)))continue;
    const pauses=[['breakStart','breakEnd'],['lunchStart','lunchEnd']].some(([a,b])=>h[a]&&h[b]&&minute<timeMinutes(h[b])&&minute+duration>timeMinutes(h[a]));
    if(pauses)continue;
    const occupied=appointments.some(a=>a!==original&&a.date===date&&a.doctor===d.name&&!/cancel/i.test(a.status||'')&&Math.abs(timeMinutes(a.time)-minute)<duration);
    const held=requests.some(r=>r.proposedDate===date&&r.proposedDoctor===d.name&&r.status==='Awaiting response'&&Math.abs(timeMinutes(r.proposedTime)-minute)<duration);
    if(occupied||held)continue;
    return {date,time:displayTime(minute),doctor:d.name};
   }
  }
 }
 return null;
}
function emergencyReschedules(){return read('reschedules',[])}
function emergencyQueueMarkup(){
 const items=emergencyReschedules();
 if(!items.length)return '<p class="muted">No emergency rescheduling requests yet.</p>';
 return items.map(r=>'<div class="emergency-request"><div><b>'+esc(r.patient)+'</b><p class="muted">'+fmt(r.originalDate)+' · '+esc(r.originalTime)+' · '+esc(r.originalDoctor)+'</p><p>Proposed: <strong>'+fmt(r.proposedDate)+' at '+esc(r.proposedTime)+'</strong> with <strong>'+esc(r.proposedDoctor)+'</strong></p><small>Response: '+esc(r.status)+'</small></div><div class="emergency-actions"><a class="btn soft" href="sms:'+encodeURIComponent(r.phone||'')+'?&body='+encodeURIComponent('S Dental Clinic: Your appointment schedule has changed. Please review and respond here: '+r.link)+'">Open SMS draft</a><button class="btn soft" data-copy-link="'+esc(r.link)+'">Copy link</button></div></div>').join('');
}

function doctorSchedulePage(){let doctor=selectedScheduleDoctor||doctors[0]?.name||'Dr. Ana Reyes',h=hours[doctor]||{days:['Mon','Tue','Wed','Thu','Fri'],start:'09:00',end:'17:00',breakStart:'10:30',breakEnd:'10:45',lunchStart:'12:00',lunchEnd:'13:00'};
 let confirmationPanel=clinicRole==='doctor'?'<div class="panel" style="margin-bottom:16px"><h2>Appointment confirmation preference</h2><label class="inline-check"><input type="checkbox" id="autoConfirmToggle" '+(clinicProfile?.auto_confirm_appointments?'checked':'')+'> Automatically confirm available customer appointments</label><p class="muted">When enabled, new customer bookings in an available slot are confirmed immediately. Otherwise, they remain pending for clinic review.</p></div>':'';let week=Array.from({length:7},(_,i)=>{let d=new Date(),offset=(d.getDay()+6)%7;d.setDate(d.getDate()-offset+i);let key=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');return '<div class="day-col"><b>'+d.toLocaleDateString('en',{weekday:'short',day:'numeric'})+'</b>'+(blocks.filter(b=>b.date===key&&(!b.doctor||b.doctor===doctor)).map(b=>'<div class="event blocked">'+esc(b.reason)+'</div>').join(''))+appointments.filter(a=>a.date===key&&a.doctor===doctor).map(a=>'<div class="event">'+esc(a.time)+'<br>'+esc(a.patient)+'</div>').join('')+'</div>'}).join('');return confirmationPanel+'<div class="two-col"><div class="panel"><h2>Working hours</h2><form id="hoursForm"><div class="field"><label>Doctor</label><select name="doctor" id="hoursDoctor">'+doctors.map(d=>'<option '+(d.name===doctor?'selected':'')+'>'+esc(d.name)+'</option>').join('')+'</select></div><div class="field"><label>Available working days</label><div class="days-picker">'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>'<label><input type="checkbox" name="days" value="'+d+'" '+(h.days.includes(d)?'checked':'')+'> '+d+'</label>').join('')+'</div></div><div class="two-col"><div class="field"><label>Start time</label><input name="start" type="time" value="'+h.start+'"></div><div class="field"><label>End time</label><input name="end" type="time" value="'+h.end+'"></div><div class="field"><label>Break start</label><input name="breakStart" type="time" value="'+h.breakStart+'"></div><div class="field"><label>Break end</label><input name="breakEnd" type="time" value="'+h.breakEnd+'"></div><div class="field"><label>Lunch start</label><input name="lunchStart" type="time" value="'+h.lunchStart+'"></div><div class="field"><label>Lunch end</label><input name="lunchEnd" type="time" value="'+h.lunchEnd+'"></div></div><button class="btn primary">Save availability</button></form></div><div class="panel"><h2>Unavailable dates / emergency leave</h2><form id="blockform"><div class="field"><label>Doctor</label><select name="doctor">'+doctors.map(d=>'<option>'+esc(d.name)+'</option>').join('')+'</select></div><div class="field"><label>Date</label><input name="date" type="date" min="'+today()+'" required></div><div class="field"><label>Reason</label><select name="reason"><option>Unavailable</option><option>Emergency leave</option><option>Personal leave</option></select></div><button class="btn primary">Block date</button></form><h3>Blocked dates</h3>'+(blocks.map((b,i)=>'<div class="activity-row">'+fmt(b.date)+' · '+esc(b.doctor||'All doctors')+' · '+esc(b.reason)+' <button class="btn danger" data-unblock="'+i+'">Remove</button></div>').join('')||'<p class="muted">No blocked dates.</p>')+'</div></div><div class="panel"><div class="panel-head"><h2>Weekly appointments</h2><span class="muted">Monday – Sunday</span></div><div class="week-grid">'+week+'</div></div><div class="panel"><div class="panel-head"><div><h2>Emergency rescheduling</h2><p class="muted">The nearest available slot is proposed, including another dentist when needed. Customers must respond before changes are final.</p></div></div>'+emergencyQueueMarkup()+'</div>'}
const checklistGroups=[['Reception / Assistant',['Confirm patient identity and appointment','Review medical history and allergies','Confirm consent forms are completed','Prepare patient record and imaging','Ensure room is clean and ready']],['Dentist / Treatment preparation',['Review treatment plan and clinical notes','Confirm planned procedure with patient','Check required instruments and materials','Verify equipment readiness','Document pre-treatment observations']]];
function checklistPage(){let total=10,done=Object.values(checks).filter(Boolean).length;return '<div class="panel"><div class="panel-head"><div><h2>Treatment preparation checklist</h2><p class="muted">Complete the preparation tasks before starting a treatment.</p></div><b>'+done+' / '+total+' completed</b></div><div class="progress"><span style="width:'+(done/total*100)+'%"></span></div></div><div class="two-col">'+checklistGroups.map((g,i)=>'<div class="panel"><div class="panel-head"><h2>'+g[0]+'</h2><span class="muted">'+g[1].filter((t,j)=>checks[i+'-'+j]).length+'/'+g[1].length+'</span></div>'+g[1].map((t,j)=>'<label class="check-item"><input type="checkbox" data-check="'+i+'-'+j+'" '+(checks[i+'-'+j]?'checked':'')+'>'+t+'</label>').join('')+'</div>').join('')+'</div><div class="panel"><div class="panel-head"><div><h2>Checklist status</h2><p class="muted">Progress is saved on this device.</p></div><button class="btn" data-act="resetChecks">Reset checklist</button></div><button class="btn primary" data-act="completeChecklist" '+(done<total?'disabled':'')+'>Mark preparation complete</button></div>'}
function reportPreview(){let confirmed=appointments.filter(a=>a.status==='Confirmed').length,pending=appointments.filter(a=>a.status==='Pending').length,cancelled=appointments.filter(a=>a.status==='Cancelled').length;return '<div class="report-toolbar no-print"><button class="btn soft" data-go="reports">← Back to Reports</button><button class="btn primary" data-act="print">🖨 Print now</button></div><article class="print-sheet"><div class="print-brand"><img src="assets/clinic-logo.svg" alt=""><div><h2>S Dental Clinic</h2><p>Clinic Management Report</p></div></div><h1>Clinic Performance Report</h1><p class="muted">Report period: '+esc(reportPeriod)+' · Generated '+new Date().toLocaleString('en-PH')+'</p><hr><h3>Summary</h3><div class="report-kpis">'+[['Patients',patients.length],['Appointments',appointments.length],['Confirmed',confirmed],['Pending',pending]].map(x=>'<div class="stat-card"><div class="label">'+x[0]+'</div><div class="value">'+x[1]+'</div></div>').join('')+'</div><h3>Appointment breakdown</h3><table><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody><tr><td>Confirmed</td><td>'+confirmed+'</td></tr><tr><td>Pending</td><td>'+pending+'</td></tr><tr><td>Cancelled</td><td>'+cancelled+'</td></tr></tbody></table><h3>Appointment records</h3><table><thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Treatment</th><th>Doctor</th><th>Status</th></tr></thead><tbody>'+appointments.map(a=>'<tr><td>'+fmt(a.date)+'</td><td>'+esc(a.time)+'</td><td>'+esc(a.patient)+'</td><td>'+esc(a.treatment)+'</td><td>'+esc(a.doctor)+'</td><td>'+esc(a.status)+'</td></tr>').join('')+'</tbody></table><footer>Generated by S Dental Clinic Management System · Page 1</footer></article>'}
function modal(title,html,submit){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modalBackdrop').classList.add('open');let f=$('#modalBody form');if(f)f.onsubmit=e=>{e.preventDefault();submit(Object.fromEntries(new FormData(f)));$('#modalBackdrop').classList.remove('open')}}
function apptModal(a){modal(a?'Edit appointment':'New appointment','<form><div class="field"><label>Patient name</label><input name="patient" required value="'+esc(a?.patient||'')+'" '+(a?.dbId?'readonly':'')+'></div><div class="field"><label>Date</label><input name="date" type="date" min="'+today()+'" required value="'+(a?.date||today())+'" '+(a?.dbId?'readonly':'')+'></div><div class="field"><label>Time</label><input name="time" type="time" required value="'+(a?.time24||'09:00')+'" '+(a?.dbId?'readonly':'')+'></div><div class="field"><label>Treatment</label><input name="treatment" required value="'+esc(a?.treatment||'Consultation')+'" '+(a?.dbId?'readonly':'')+'></div><div class="field"><label>Doctor</label><input name="doctor" required value="'+esc(a?.doctor||'')+'" '+(a?.dbId?'readonly':'')+'></div><div class="field"><label>Status</label><select name="status">'+['Confirmed','Pending','Cancelled'].map(x=>'<option '+(a?.status===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div><div class="modal-actions"><button class="btn primary">Save appointment</button></div></form>',async v=>{if(a?.dbId){const {error}=await window.clinicSupabase.from('clinic_appointments').update({status:v.status}).eq('id',a.dbId);if(error){toast(error.message||'Could not update appointment');return}await syncSharedAppointments();log('Appointment status updated for '+a.patient+' to '+v.status);render();toast('Appointment status updated');return}let dt=new Date('2000-01-01T'+v.time);v.time=dt.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});let i=appointments.indexOf(a);if(i>=0)appointments[i]=v;else appointments.push(v);save();log('Appointment saved for '+v.patient);render();toast('Appointment saved')})}
function patientModal(p){modal(p?'Edit patient':'Add patient','<form><div class="field"><label>Patient name</label><input name="name" required value="'+esc(p?.name||'')+'"></div><div class="field"><label>Contact number</label><input name="contact" required value="'+esc(p?.contact||'')+'"></div><div class="field"><label>Status</label><select name="status"><option '+(p?.status==='Active'?'selected':'')+'>Active</option><option '+(p?.status==='Inactive'?'selected':'')+'>Inactive</option></select></div><button class="btn primary">Save patient</button></form>',v=>{if(p)Object.assign(p,v);else patients.push({id:'PT-'+String(Date.now()).slice(-5),...v,last:fmt(today())});save();log('Patient record saved: '+v.name);render();toast('Patient saved')})}

function money(n){return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n)||0)}
function paymentBalance(p){return Math.max(0,(Number(p.due)||0)-(Number(p.paid)||0))}
function paymentStatus(p){if(paymentBalance(p)<=0)return 'Paid';if(p.dueDate&&p.dueDate<today())return 'Overdue';return Number(p.paid)>0?'Partial':'Unpaid'}
function planRequestsPage(){
 planRequests=read('plan_requests',[]);
 const pending=planRequests.filter(r=>r.status==='Pending review').length;
 const active=planRequests.filter(r=>r.status==='Approved — active').length;
 const rows=planRequests.map(r=>'<tr><td><b>'+esc(r.id)+'</b></td><td>'+fmt((r.createdAt||'').slice(0,10))+'</td><td>'+esc(r.name)+'</td><td>'+esc(r.email)+'<br>'+esc(r.phone)+'</td><td>'+esc(r.plan)+'</td><td>'+esc(r.message||'—')+'</td><td>'+badge(r.status)+'</td><td>'+(r.status==='Pending review'?'<div class="payment-actions"><button class="btn primary" data-plan-approve="'+esc(r.id)+'">Approve</button><button class="btn danger" data-plan-decline="'+esc(r.id)+'">Decline</button></div>':'—')+'</td></tr>').join('');
 return '<div class="stats-grid"><div class="stat-card"><div class="label">Total requests</div><div class="value">'+planRequests.length+'</div></div><div class="stat-card"><div class="label">Awaiting review</div><div class="value">'+pending+'</div></div><div class="stat-card"><div class="label">Approved plans</div><div class="value">'+active+'</div></div></div><div class="panel"><div class="panel-head"><div><h2>Customer plan requests</h2><p class="muted">Review each request. Approving marks the plan active; declining records the decision.</p></div><button class="btn soft" data-act="refreshPlanRequests">Refresh requests</button></div><div class="table-wrap"><table><thead><tr><th>REQUEST</th><th>DATE</th><th>CUSTOMER</th><th>CONTACT</th><th>PLAN</th><th>MESSAGE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>'+(rows||'<tr><td colspan="8" class="empty">No plan requests yet.</td></tr>')+'</tbody></table></div><p class="muted">Demo limitation: requests are stored in this browser only. They will not appear on another device until a shared database is connected.</p></div>';
}
function paymentsPage(){
 const totalDue=payments.reduce((s,p)=>s+(Number(p.due)||0),0),totalPaid=payments.reduce((s,p)=>s+(Number(p.paid)||0),0),balance=payments.reduce((s,p)=>s+paymentBalance(p),0),overdue=payments.filter(p=>paymentStatus(p)==='Overdue').length;
 return '<div class="stats-grid"><div class="stat-card"><div class="label">Total billed</div><div class="value">'+money(totalDue)+'</div><div class="trend">Recorded invoice amounts</div></div><div class="stat-card"><div class="label">Payments received</div><div class="value">'+money(totalPaid)+'</div><div class="trend">Recorded collections</div></div><div class="stat-card"><div class="label">Outstanding balance</div><div class="value">'+money(balance)+'</div><div class="trend">Remaining on invoices</div></div><div class="stat-card"><div class="label">Overdue invoices</div><div class="value">'+overdue+'</div><div class="trend">Past due date with balance remaining</div></div></div>'+
 '<div class="panel"><div class="panel-head"><div><h2>Create an invoice</h2><p class="muted">Record the service, amount due, due date, and any initial payment.</p></div></div><form id="paymentForm" class="payment-form"><div class="field"><label>Patient</label><select name="patient" required><option value="">Select patient</option>'+patients.map(p=>'<option>'+esc(p.name)+'</option>').join('')+'</select></div><div class="field"><label>Treatment / invoice description</label><input name="description" placeholder="e.g. Dental cleaning" required></div><div class="field"><label>Invoice amount (₱)</label><input name="due" type="number" min="0.01" step="0.01" required></div><div class="field"><label>Initial amount received (₱)</label><input name="paid" type="number" min="0" step="0.01" value="0" required></div><div class="field"><label>Payment method</label><select name="method"><option>Cash</option><option>GCash</option><option>Bank transfer</option><option>Card</option><option>Other</option></select></div><div class="field"><label>Invoice date</label><input name="date" type="date" value="'+today()+'" required></div><div class="field"><label>Due date</label><input name="dueDate" type="date" value="'+today()+'" required></div><div class="field"><label>Reference number (optional)</label><input name="reference" placeholder="Receipt or transaction reference"></div><div class="payment-submit"><button class="btn primary">＋ Create invoice</button></div></form></div>'+
 '<div class="panel"><div class="panel-head"><div><h2>Invoices and payment history</h2><p class="muted">Add installment payments and print receipts for recorded transactions.</p></div><input class="search" id="paymentSearch" placeholder="Search patient or invoice ID"></div><div class="table-wrap"><table><thead><tr><th>INVOICE</th><th>DATE / DUE</th><th>PATIENT</th><th>DESCRIPTION</th><th>INVOICE</th><th>PAYMENT METHOD</th><th>RECEIVED</th><th>BALANCE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody id="paymentRows">'+paymentRows(payments)+'</tbody></table></div></div>';
}
function paymentRows(list){return list.map(p=>{let due=Number(p.due)||0,paid=Number(p.paid)||0;return '<tr><td><b>'+esc(p.invoiceId||p.id)+'</b></td><td>'+fmt(p.date)+'<br><small class="muted">Due: '+fmt(p.dueDate||p.date)+'</small></td><td>'+esc(p.patient)+'</td><td>'+esc(p.description)+'</td><td>'+money(due)+'</td><td>'+esc(p.method||'—')+'</td><td>'+money(paid)+'</td><td>'+money(paymentBalance(p))+'</td><td>'+badge(paymentStatus(p))+'</td><td><div class="payment-actions"><button class="btn soft" data-payment-add="'+esc(p.id)+'" '+(paymentBalance(p)<=0?'disabled':'')+'>Add payment</button><button class="btn" data-payment-receipt="'+esc(p.id)+'">Receipt</button></div></td></tr>'}).join('')||'<tr><td colspan="10" class="empty">No invoices yet. Create an invoice to get started.</td></tr>'}
function printPaymentReceipt(p,transaction){
 const tx=transaction||((p.transactions||[]).slice(-1)[0])||{amount:p.paid||0,method:p.method||'—',date:p.date,reference:p.reference};
 const w=window.open('','_blank','width=760,height=800');if(!w){toast('Allow pop-ups to print the receipt');return}
 w.document.write('<!doctype html><html><head><title>Payment Receipt</title><style>body{font:14px Arial,sans-serif;color:#172e57;padding:40px;max-width:650px;margin:auto}header{display:flex;justify-content:space-between;border-bottom:2px solid #172e57;padding-bottom:18px}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin:24px 0}td{padding:12px;border-bottom:1px solid #ddd}.total{font-size:22px;font-weight:bold;text-align:right}.muted{color:#64748b}.foot{margin-top:45px;border-top:1px dashed #aaa;padding-top:18px}@media print{button{display:none}}</style></head><body><header><div><h1>S Dental Clinic</h1><div class="muted">OFFICIAL PAYMENT RECEIPT</div></div><div><b>'+esc(p.invoiceId||p.id)+'</b><br>'+fmt(tx.date||p.date)+'</div></header><table><tr><td>Patient</td><td>'+esc(p.patient)+'</td></tr><tr><td>Description</td><td>'+esc(p.description)+'</td></tr><tr><td>Payment method</td><td>'+esc(tx.method||'—')+'</td></tr><tr><td>Reference</td><td>'+esc(tx.reference||'—')+'</td></tr><tr><td>Payment date</td><td>'+fmt(tx.date||p.date)+'</td></tr><tr><td>Invoice total</td><td>'+money(p.due)+'</td></tr><tr><td>Received this transaction</td><td>'+money(tx.amount)+'</td></tr><tr><td>Total received to date</td><td>'+money(p.paid)+'</td></tr><tr><td>Remaining balance</td><td>'+money(paymentBalance(p))+'</td></tr></table><div class="total">Receipt amount: '+money(tx.amount)+'</div><div class="foot muted">Thank you for choosing S Dental Clinic. Please keep this receipt for your records.</div><script>window.onload=()=>window.print()<\/script></body></html>');w.document.close();
}
function bindPayments(){
 const form=$('#paymentForm');
 if(form)form.onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(form));v.due=Number(v.due);v.paid=Number(v.paid);if(v.paid>v.due){toast('Initial payment cannot exceed invoice amount');return}const id='PAY-'+String(Date.now()).slice(-8);const p={id,invoiceId:'INV-'+String(Date.now()).slice(-8),...v,transactions:v.paid>0?[{amount:v.paid,method:v.method,date:v.date,reference:v.reference||''}]:[]};payments.unshift(p);save();log('Invoice '+p.invoiceId+' created for '+v.patient+' — '+money(v.due));render();toast('Invoice created successfully')};
 const search=$('#paymentSearch');if(search)search.oninput=()=>{let q=search.value.toLowerCase();$('#paymentRows').innerHTML=paymentRows(payments.filter(p=>(p.patient+' '+p.description+' '+(p.invoiceId||p.id)).toLowerCase().includes(q)));bindPaymentActions()};
 bindPaymentActions();
}
function bindPaymentActions(){
 document.querySelectorAll('[data-payment-add]').forEach(b=>b.onclick=()=>{const p=payments.find(x=>x.id===b.dataset.paymentAdd);if(!p)return;modal('Add installment payment','<form><p class="muted">Invoice '+esc(p.invoiceId||p.id)+' · Remaining balance: <b>'+money(paymentBalance(p))+'</b></p><div class="field"><label>Amount received (₱)</label><input name="amount" type="number" min="0.01" max="'+paymentBalance(p).toFixed(2)+'" step="0.01" required></div><div class="field"><label>Payment method</label><select name="method"><option>Cash</option><option>GCash</option><option>Bank transfer</option><option>Card</option><option>Other</option></select></div><div class="field"><label>Payment date</label><input name="date" type="date" value="'+today()+'" required></div><div class="field"><label>Reference number (optional)</label><input name="reference"></div><button class="btn primary">Save payment</button></form>',v=>{const amount=Number(v.amount);if(!(amount>0)||amount>paymentBalance(p)){toast('Enter an amount up to the remaining balance');return}p.paid=(Number(p.paid)||0)+amount;p.transactions=p.transactions||[];p.transactions.push({amount,method:v.method,date:v.date,reference:v.reference||''});save();log('Installment payment received for '+p.patient+' — '+money(amount));render();toast('Payment added; balance updated')})});
 document.querySelectorAll('[data-payment-receipt]').forEach(b=>b.onclick=()=>{const p=payments.find(x=>x.id===b.dataset.paymentReceipt);if(p)printPaymentReceipt(p)});
}

function render(){let views={planRequests:planRequestsPage,payments:paymentsPage,dashboard:dash,patients:patientsPage,activities:activitiesPage,reports:reportsPage,schedule:schedulePage,doctors:doctorsPage,doctorSchedule:doctorSchedulePage,checklist:checklistPage,reportPreview:reportPreview};$('#pageContent').innerHTML=(views[page]||dash)();bind();bindPayments()}
function bind(){
 if($('#autoConfirmToggle'))$('#autoConfirmToggle').onchange=async e=>{
 const toggle=e.target;toggle.disabled=true;
 try{
  const {error}=await window.clinicSupabase.from('clinic_staff').update({auto_confirm_appointments:toggle.checked}).eq('user_id',clinicSession.user.id);
  if(error)throw error;
  clinicProfile.auto_confirm_appointments=toggle.checked;
  toast(toggle.checked?'Automatic confirmation enabled.':'Automatic confirmation disabled.');
 }catch(err){toggle.checked=!toggle.checked;toast(err.message||'Could not save this preference.')}
 finally{toggle.disabled=false}
};

 document.querySelectorAll('[data-plan-approve]').forEach(b=>b.onclick=()=>{const r=planRequests.find(x=>x.id===b.dataset.planApprove);if(!r)return;r.status='Approved — active';r.reviewedAt=new Date().toISOString();localStorage.setItem('sd_plan_requests',JSON.stringify(planRequests));log('Plan request approved for '+r.name+' — '+r.plan);render();toast('Plan approved and marked active')});
 document.querySelectorAll('[data-plan-decline]').forEach(b=>b.onclick=()=>{const r=planRequests.find(x=>x.id===b.dataset.planDecline);if(!r)return;r.status='Declined';r.reviewedAt=new Date().toISOString();localStorage.setItem('sd_plan_requests',JSON.stringify(planRequests));log('Plan request declined for '+r.name+' — '+r.plan);render();toast('Plan request declined')});
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>apptModal(appointments[+b.dataset.edit]));document.querySelectorAll('[data-pedit]').forEach(b=>b.onclick=()=>patientModal(patients[+b.dataset.pedit]));document.querySelectorAll('[data-check]').forEach(b=>b.onchange=()=>{checks[b.dataset.check]=b.checked;save();render()});document.querySelectorAll('[data-copy-link]').forEach(b=>b.onclick=()=>{navigator.clipboard?.writeText(b.dataset.copyLink).then(()=>toast('Customer link copied')).catch(()=>toast('Copy unavailable; open the SMS draft instead'))});document.querySelectorAll('[data-unblock]').forEach(b=>b.onclick=()=>{blocks.splice(+b.dataset.unblock,1);save();render();toast('Blocked date removed')});document.querySelectorAll('[data-doctor-schedule]').forEach(b=>b.onclick=()=>go('doctorSchedule'));document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{let a=b.dataset.act;if(a==='refreshPlanRequests'){planRequests=read('plan_requests',[]);render()}if(a==='addAppt')apptModal();if(a==='addPatient')patientModal();if(a==='print')window.print();if(a==='generateReport'){reportPeriod=$('#reportPeriod')?.value||'This month';go('reportPreview')}if(a==='clearLog'){activities=[];save();render()}if(a==='resetChecks'){checks={};save();render();toast('Checklist reset')}if(a==='completeChecklist'){log('Treatment preparation checklist completed');toast('Preparation marked complete')}if(a==='addDoctor')modal('Add doctor','<form><div class="field"><label>Doctor name</label><input name="name" required></div><div class="field"><label>Specialty</label><input name="specialty" required></div><button class="btn primary">Save doctor</button></form>',v=>{doctors.push(v);save();log('Doctor added: '+v.name);render();toast('Doctor added')})});if($('#psearch'))$('#psearch').oninput=filterPatients;if($('#pstatus'))$('#pstatus').onchange=filterPatients;if($('#sdate')){let filter=()=>$('#srows').innerHTML=appointmentRows(appointments.filter(a=>a.date===$('#sdate').value&&(!$('#sdoctor').value||a.doctor===$('#sdoctor').value)),false);$('#sdate').onchange=filter;$('#sdoctor').onchange=filter}if($('#hoursForm'))$('#hoursForm').onsubmit=e=>{e.preventDefault();let f=new FormData(e.target),d=f.get('doctor');selectedScheduleDoctor=d;hours[d]={days:f.getAll('days'),start:f.get('start'),end:f.get('end'),breakStart:f.get('breakStart'),breakEnd:f.get('breakEnd'),lunchStart:f.get('lunchStart'),lunchEnd:f.get('lunchEnd')};save();log('Working hours updated for '+d);toast('Availability saved on this device')};if($('#hoursDoctor'))$('#hoursDoctor').onchange=()=>{selectedScheduleDoctor=$('#hoursDoctor').value;render()};if($('#blockform'))$('#blockform').onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(e.target));if(blocks.some(x=>x.date===v.date&&x.doctor===v.doctor)){toast('This date is already blocked for this doctor');return}blocks.push(v);if(v.reason==='Emergency leave'){const affected=appointments.filter(a=>a.date===v.date&&a.doctor===v.doctor&&!/cancel/i.test(a.status||''));const requests=emergencyReschedules();let created=0;affected.forEach(a=>{const slot=nearestReplacementSlot(a,requests);if(!slot){requests.push({id:'RS-'+Date.now()+'-'+created,patient:a.patient,phone:a.customerPhone||'',email:a.customerEmail||'',originalDate:a.date,originalTime:a.time,originalDoctor:a.doctor,proposedDate:'',proposedTime:'',proposedDoctor:'',status:'Needs admin help',link:'',createdAt:new Date().toISOString()});a.status='Reschedule pending';created++;return}const token=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(36).slice(2));const link=location.origin+location.pathname.replace(/index\.html$/,'')+'customer/?reschedule='+encodeURIComponent(token);requests.push({id:'RS-'+Date.now()+'-'+created,token,link,patient:a.patient,phone:a.customerPhone||'',email:a.customerEmail||'',originalDate:a.date,originalTime:a.time,originalDoctor:a.doctor,proposedDate:slot.date,proposedTime:slot.time,proposedDoctor:slot.doctor,status:'Awaiting response',appointmentDate:a.date,appointmentTime:a.time,appointmentDoctor:a.doctor,createdAt:new Date().toISOString()});a.status='Reschedule pending';a.rescheduleToken=token;created++});localStorage.setItem('sd_reschedules',JSON.stringify(requests));log(v.doctor+' emergency leave on '+v.date+'; '+created+' affected appointment(s) queued for customer response');}else log(v.doctor+' marked '+v.date+' as '+v.reason);save();render();toast(v.reason==='Emergency leave'?'Emergency leave saved; proposals prepared where possible.':'Unavailable date saved')}}
function filterPatients(){let q=$('#psearch').value.toLowerCase(),s=$('#pstatus').value;$('#prows').innerHTML=patientRows(patients.filter(p=>(p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q))&&(!s||p.status===s)))}
$('#mainNav').onclick=e=>{let b=e.target.closest('[data-page]');if(b)go(b.dataset.page)};$('#quickAdd').onclick=()=>apptModal();$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');$('#closeModal').onclick=()=>$('#modalBackdrop').classList.remove('open');$('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')$('#modalBackdrop').classList.remove('open')};$('#todayLabel').textContent=new Date().toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric',year:'numeric'});go('dashboard');
if(window.SUPABASE_CONFIG?.url&&window.SUPABASE_CONFIG?.anonKey&&window.supabase){window.clinicSupabase=window.supabase.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.anonKey)}


// --- Supabase team authentication and role-based demo navigation ---
let clinicSession=null, clinicProfile=null, clinicRole=null;
const ROLE_PAGES={
 admin:['dashboard','patients','payments','planRequests','activities','reports','schedule','doctors','doctorSchedule','checklist'],
 doctor:['dashboard','patients','schedule','doctorSchedule','checklist'],
 staff:['dashboard','patients','schedule','doctorSchedule','checklist']
};
function roleCan(pageName){return !!clinicRole && (ROLE_PAGES[clinicRole]||[]).includes(pageName)}
const originalGo=go;
go=function(nextPage){
 if(clinicRole&&!roleCan(nextPage)){toast('Your account does not have access to that page.');return}
 originalGo(nextPage);
 if(clinicRole==='staff'&&nextPage==='schedule')makeScheduleReadOnly();
 if(clinicRole==='staff'&&nextPage==='doctorSchedule')makeDoctorScheduleReadOnly();
 if(clinicRole==='doctor'&&nextPage==='schedule')filterDoctorSchedule();
 if(clinicRole==='doctor'&&nextPage==='doctorSchedule'&&clinicProfile?.doctor_name)selectedScheduleDoctor=clinicProfile.doctor_name;
 if(clinicRole==='doctor'&&nextPage==='doctorSchedule')makeDoctorOwnSchedule();
};
const originalRender=render;
render=function(){
 if(!clinicRole)return;
 document.querySelectorAll('#mainNav [data-page]').forEach(b=>{b.hidden=!roleCan(b.dataset.page)});
 $('#quickAdd').hidden=clinicRole!=='admin';
 if(clinicRole==='staff'&&page==='schedule'){
   $('#pageContent').innerHTML=staffScheduleMarkup();
   bind();
   makeScheduleReadOnly();
   return;
 }
 if(clinicRole==='staff'&&page==='doctorSchedule'){
   $('#pageContent').innerHTML=staffDoctorScheduleMarkup();
   return;
 }
 originalRender();
 if(clinicRole==='staff'){
   document.querySelectorAll('[data-edit],[data-unblock],[data-doctor-schedule],[data-act="addAppt"],[data-act="addDoctor"]').forEach(b=>b.remove());
   if(page==='patients')document.querySelectorAll('[data-pedit]').forEach(b=>{b.textContent='View';b.onclick=()=>patientViewModal(patients[+b.dataset.pedit])});
   if(page==='dashboard')document.querySelectorAll('[data-edit]').forEach(b=>b.remove());
 }
 if(clinicRole==='doctor'){
   document.querySelectorAll('[data-act="addAppt"],[data-edit],[data-unblock],[data-act="addDoctor"],[data-act="clearLog"],[data-act="generateReport"]').forEach(b=>b.remove());
   if(page==='patients')document.querySelectorAll('[data-pedit]').forEach(b=>b.textContent='View');
 }
};
function staffScheduleMarkup(){
 const list=appointments.slice().sort((x,y)=>(x.date+x.time).localeCompare(y.date+y.time));
 return '<div class="panel"><div class="panel-head"><div><h2>Appointment schedule</h2><p class="muted">Staff access is view-only. Appointment changes are handled by an administrator.</p></div></div><div class="toolbar"><label class="field">Date<input id="sdate" type="date" value="'+today()+'"></label><select id="sdoctor"><option value="">All doctors</option>'+doctors.map(d=>'<option>'+esc(d.name)+'</option>').join('')+'</select></div><div class="table-wrap"><table><thead><tr><th>TIME</th><th>PATIENT</th><th>TREATMENT</th><th>DOCTOR</th><th>STATUS</th><th>PAYMENT METHOD / STATUS</th></tr></thead><tbody id="srows">'+list.filter(x=>x.date===today()).map(x=>'<tr><td>'+esc(x.time)+'</td><td>'+esc(x.patient)+'</td><td>'+esc(x.treatment)+'</td><td>'+esc(x.doctor)+'</td><td>'+badge(x.status)+'</td><td>'+esc(x.paymentMethod||'—')+'<br><small class="muted">'+esc(x.paymentStatus||'Not recorded')+'</small></td></tr>').join('')+'</tbody></table></div></div>';
}
function makeScheduleReadOnly(){
 const refresh=()=>{const d=$('#sdate')?.value||today(),doc=$('#sdoctor')?.value||'';$('#srows').innerHTML=appointments.filter(x=>x.date===d&&(!doc||x.doctor===doc)).map(x=>'<tr><td>'+esc(x.time)+'</td><td>'+esc(x.patient)+'</td><td>'+esc(x.treatment)+'</td><td>'+esc(x.doctor)+'</td><td>'+badge(x.status)+'</td><td>'+esc(x.paymentMethod||'—')+'<br><small class="muted">'+esc(x.paymentStatus||'Not recorded')+'</small></td></tr>').join('')||'<tr><td colspan="6" class="empty">No appointments found.</td></tr>'};
 if($('#sdate'))$('#sdate').onchange=refresh;if($('#sdoctor'))$('#sdoctor').onchange=refresh;
}
function staffDoctorScheduleMarkup(){
 return '<div class="panel"><div class="panel-head"><div><h2>Doctor availability</h2><p class="muted">View-only schedule information for clinic staff.</p></div></div><div class="toolbar"><select id="staffDoctorSelect">'+doctors.map(d=>'<option>'+esc(d.name)+'</option>').join('')+'</select></div><div id="staffDoctorInfo"></div></div>';
}
function renderStaffDoctorInfo(){
 const name=$('#staffDoctorSelect')?.value||doctors[0]?.name,h=hours[name]||{days:['Mon','Tue','Wed','Thu','Fri'],start:'09:00',end:'17:00',breakStart:'10:30',breakEnd:'10:45',lunchStart:'12:00',lunchEnd:'13:00'};
 $('#staffDoctorInfo').innerHTML='<h3>'+esc(name)+'</h3><p><b>Working days:</b> '+esc((h.days||[]).join(', '))+'</p><p><b>Hours:</b> '+esc(h.start)+' – '+esc(h.end)+'</p><p><b>Break:</b> '+esc(h.breakStart)+' – '+esc(h.breakEnd)+'</p><p><b>Lunch:</b> '+esc(h.lunchStart)+' – '+esc(h.lunchEnd)+'</p><h3>Unavailable dates</h3>'+(blocks.filter(b=>!b.doctor||b.doctor===name).map(b=>'<p>'+fmt(b.date)+' · '+esc(b.reason)+'</p>').join('')||'<p class="muted">No blocked dates recorded.</p>');
}
function makeDoctorScheduleReadOnly(){const s=$('#staffDoctorSelect');if(s){s.onchange=renderStaffDoctorInfo;renderStaffDoctorInfo()}}
function filterDoctorSchedule(){
 if(!clinicProfile?.doctor_name)return;
 const sel=$('#sdoctor');if(sel){sel.innerHTML='<option>'+esc(clinicProfile.doctor_name)+'</option>';sel.disabled=true}
 const refresh=()=>{const d=$('#sdate')?.value||today();$('#srows').innerHTML=appointments.filter(x=>x.date===d&&x.doctor===clinicProfile.doctor_name).map(x=>'<tr><td>'+esc(x.time)+'</td><td>'+esc(x.patient)+'</td><td>'+esc(x.treatment)+'</td><td>'+esc(x.doctor)+'</td><td>'+badge(x.status)+'</td><td>'+esc(x.paymentMethod||'—')+'<br><small class="muted">'+esc(x.paymentStatus||'Not recorded')+'</small></td></tr>').join('')||'<tr><td colspan="6" class="empty">No appointments found.</td></tr>'};
 if($('#sdate'))$('#sdate').onchange=refresh;refresh();
}
function makeDoctorOwnSchedule(){
 const own=clinicProfile?.doctor_name;if(!own)return;
 const sel=$('#hoursDoctor');if(sel){sel.innerHTML='<option>'+esc(own)+'</option>';sel.value=own;sel.disabled=true}
 const blockDoctor=$('#blockform select[name="doctor"]');if(blockDoctor){blockDoctor.innerHTML='<option>'+esc(own)+'</option>';blockDoctor.value=own}
}
function patientViewModal(p){
 if(!p)return;
 modal('Patient profile','<div class="field"><label>Patient ID</label><p>'+esc(p.id)+'</p></div><div class="field"><label>Patient name</label><p>'+esc(p.name)+'</p></div><div class="field"><label>Contact number</label><p>'+esc(p.contact)+'</p></div><div class="field"><label>Last visit</label><p>'+esc(p.last||'—')+'</p></div><div class="field"><label>Status</label><p>'+esc(p.status||'—')+'</p></div><p class="muted">View-only patient profile.</p>');
}
async function syncSharedAppointments(){
 if(!window.clinicSupabase||!clinicSession)return;
 const {data,error}=await window.clinicSupabase.from('clinic_appointments')
  .select('id,customer_name,customer_email,customer_phone,service,doctor_name,appointment_date,appointment_time,status,payment_method,payment_status,notes')
  .order('appointment_date',{ascending:true}).order('appointment_time',{ascending:true});
 if(error)throw error;
 const local=appointments.filter(a=>!a.dbId);
 const shared=(data||[]).map(a=>({
  dbId:a.id,id:a.id,date:a.appointment_date,time:(()=>{const [h,m]=String(a.appointment_time).split(':').map(Number);return String((h%12)||12).padStart(2,'0')+':'+String(m||0).padStart(2,'0')+' '+(h>=12?'PM':'AM')})(),
  patient:a.customer_name,treatment:a.service,doctor:a.doctor_name,status:a.status,
  customerEmail:a.customer_email,customerPhone:a.customer_phone,
  paymentMethod:a.payment_method,paymentStatus:a.payment_status||'Pending',notes:a.notes||'',customerRequest:true
 }));
 appointments=[...local,...shared];
 localStorage.setItem('sd_appts',JSON.stringify(appointments));
}
function showAuth(message=''){
 $('#authGate').style.display='grid';document.querySelector('.app-shell').style.display='none';
 $('#loginMessage').textContent=message;
}
async function showApp(){
 $('#authGate').style.display='none';document.querySelector('.app-shell').style.display='flex';
 $('#signedInName').textContent=clinicProfile?.display_name||clinicSession?.user?.email||'Team member';
 $('#signedInRole').textContent=(clinicRole||'').toUpperCase()+' ACCESS';
 try{await syncSharedAppointments()}catch(err){toast('Could not load shared appointments: '+(err.message||'Please refresh.'))}
 render();go('dashboard');
}
async function loadClinicProfile(session){
 clinicSession=session;
 const {data,error}=await window.clinicSupabase.from('clinic_staff').select('display_name,role,doctor_name,auto_confirm_appointments').eq('user_id',session.user.id).maybeSingle();
 if(error)throw error;
 if(!data)throw new Error('Your account has no clinic role yet. Ask the administrator to assign your role in the Supabase setup.');
 if(!['admin','doctor','staff'].includes(data.role))throw new Error('This account has an unsupported role.');
 clinicProfile=data;clinicRole=data.role;
}
async function startClinicAuth(){
 if(!window.clinicSupabase){showAuth('Supabase connection is not configured. Check config.js and reload.');return}
 const {data:{session},error}=await window.clinicSupabase.auth.getSession();
 if(error){showAuth(error.message);return}
 if(session){
  try{await loadClinicProfile(session);showApp()}catch(e){await window.clinicSupabase.auth.signOut();showAuth(e.message)}
 }else showAuth();
}
$('#loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget),button=$('#loginButton');button.disabled=true;button.textContent='Signing in…';$('#loginMessage').textContent='';
 try{
  const {data,error}=await window.clinicSupabase.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});
  if(error)throw error;
  await loadClinicProfile(data.session);showApp();
 }catch(err){$('#loginMessage').textContent=err.message||'Unable to sign in.'}
 finally{button.disabled=false;button.textContent='Sign in'}
});
$('#logoutButton').addEventListener('click',async()=>{await window.clinicSupabase.auth.signOut();clinicSession=null;clinicProfile=null;clinicRole=null;showAuth('You have signed out.')});
if(window.clinicSupabase){window.clinicSupabase.auth.onAuthStateChange(async(event,session)=>{
 if(event==='SIGNED_OUT'){clinicSession=null;clinicProfile=null;clinicRole=null;showAuth()}
})}
document.querySelector('.app-shell').style.display='none';
startClinicAuth();
