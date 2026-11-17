-- S Dental Clinic: shared appointment booking and dentist auto-confirmation
-- Run this entire file in Supabase SQL Editor. Safe to re-run.
-- This creates the database foundation; frontend integration is a separate deployment step.

alter table public.clinic_staff
  add column if not exists auto_confirm_appointments boolean not null default false;

drop policy if exists "Doctors manage own auto-confirm preference" on public.clinic_staff;
create policy "Doctors manage own auto-confirm preference"
on public.clinic_staff for update to authenticated
using (auth.uid() = user_id and role = 'doctor')
with check (auth.uid() = user_id and role = 'doctor');
grant update (auto_confirm_appointments) on public.clinic_staff to authenticated;

create table if not exists public.clinic_doctor_schedules (
  doctor_name text primary key,
  working_days text[] not null default array['Mon','Tue','Wed','Thu','Fri'],
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  break_start time,
  break_end time,
  lunch_start time,
  lunch_end time,
  updated_at timestamptz not null default now(),
  constraint valid_working_hours check (start_time < end_time),
  constraint valid_break check (break_start is null or break_end is null or break_start < break_end),
  constraint valid_lunch check (lunch_start is null or lunch_end is null or lunch_start < lunch_end)
);
alter table public.clinic_doctor_schedules enable row level security;
drop policy if exists "Anyone can read dentist schedules" on public.clinic_doctor_schedules;
create policy "Anyone can read dentist schedules"
on public.clinic_doctor_schedules for select to anon, authenticated using (true);
drop policy if exists "Clinic team manages dentist schedules" on public.clinic_doctor_schedules;
create policy "Clinic team manages dentist schedules"
on public.clinic_doctor_schedules for all to authenticated
using (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (s.role = 'admin' or (s.role = 'doctor' and s.doctor_name = doctor_name))
  )
)
with check (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (s.role = 'admin' or (s.role = 'doctor' and s.doctor_name = doctor_name))
  )
);
grant select on public.clinic_doctor_schedules to anon, authenticated;
grant insert, update, delete on public.clinic_doctor_schedules to authenticated;

create table if not exists public.clinic_doctor_blocks (
  id uuid primary key default gen_random_uuid(),
  doctor_name text not null,
  blocked_date date not null,
  reason text not null default 'Unavailable',
  created_at timestamptz not null default now(),
  unique (doctor_name, blocked_date)
);
alter table public.clinic_doctor_blocks enable row level security;
drop policy if exists "Anyone can read dentist blocked dates" on public.clinic_doctor_blocks;
create policy "Anyone can read dentist blocked dates"
on public.clinic_doctor_blocks for select to anon, authenticated using (true);
drop policy if exists "Clinic team manages dentist blocked dates" on public.clinic_doctor_blocks;
create policy "Clinic team manages dentist blocked dates"
on public.clinic_doctor_blocks for all to authenticated
using (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (s.role = 'admin' or (s.role = 'doctor' and s.doctor_name = doctor_name))
  )
)
with check (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (s.role = 'admin' or (s.role = 'doctor' and s.doctor_name = doctor_name))
  )
);
grant select on public.clinic_doctor_blocks to anon, authenticated;
grant insert, update, delete on public.clinic_doctor_blocks to authenticated;

create table if not exists public.clinic_appointments (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  customer_email text not null,
  customer_name text not null,
  customer_phone text not null,
  service text not null,
  notes text,
  doctor_name text not null,
  appointment_date date not null,
  appointment_time time not null,
  duration_minutes integer not null default 30 check (duration_minutes between 15 and 240),
  payment_method text not null,
  payment_status text not null default 'Pending',
  status text not null check (status in ('Pending','Confirmed','Cancelled')),
  auto_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists clinic_appointments_doctor_date_idx
  on public.clinic_appointments (doctor_name, appointment_date, appointment_time);
create index if not exists clinic_appointments_customer_idx
  on public.clinic_appointments (customer_user_id, created_at desc);
alter table public.clinic_appointments enable row level security;
drop policy if exists "Customers read their own appointments" on public.clinic_appointments;
create policy "Customers read their own appointments"
on public.clinic_appointments for select to authenticated
using (customer_user_id = auth.uid());
drop policy if exists "Clinic team reads appointments" on public.clinic_appointments;
create policy "Clinic team reads appointments"
on public.clinic_appointments for select to authenticated
using (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (
        s.role = 'admin'
        or s.role = 'staff'
        or (s.role = 'doctor' and s.doctor_name = doctor_name)
      )
  )
);
drop policy if exists "Clinic team updates appointments" on public.clinic_appointments;
create policy "Clinic team updates appointments"
on public.clinic_appointments for update to authenticated
using (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (s.role = 'admin' or (s.role = 'doctor' and s.doctor_name = doctor_name))
  )
)
with check (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (s.role = 'admin' or (s.role = 'doctor' and s.doctor_name = doctor_name))
  )
);
grant select on public.clinic_appointments to authenticated;
grant update (status) on public.clinic_appointments to authenticated;
revoke insert, delete on public.clinic_appointments from anon, authenticated;

-- Initial demo hours for the two existing dentists. Adjust these in the management UI later.
insert into public.clinic_doctor_schedules
  (doctor_name, working_days, start_time, end_time, break_start, break_end, lunch_start, lunch_end)
values
  ('Dr. Ana Reyes', array['Mon','Tue','Wed','Thu','Fri'], '09:00','17:00','10:30','10:45','12:00','13:00'),
  ('Dr. Marco Lim', array['Mon','Tue','Wed','Thu','Fri'], '09:00','17:00','10:30','10:45','12:00','13:00')
on conflict (doctor_name) do nothing;

create or replace function public.check_customer_booking_slot(
  p_doctor_name text,
  p_date date,
  p_time time,
  p_duration_minutes integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sched public.clinic_doctor_schedules%rowtype;
  day_code text;
begin
  if p_date < current_date then
    return jsonb_build_object('available', false, 'reason', 'Please choose a future date.');
  end if;
  if p_duration_minutes < 15 or p_duration_minutes > 240 then
    return jsonb_build_object('available', false, 'reason', 'Invalid appointment duration.');
  end if;
  select * into sched from public.clinic_doctor_schedules where doctor_name = p_doctor_name;
  if not found then
    return jsonb_build_object('available', false, 'reason', 'Dentist schedule is not configured.');
  end if;
  day_code := to_char(p_date, 'Dy');
  if not day_code = any(sched.working_days) then
    return jsonb_build_object('available', false, 'reason', 'Dentist is not working on this day.');
  end if;
  if p_time < sched.start_time or p_time + make_interval(mins => p_duration_minutes) > sched.end_time then
    return jsonb_build_object('available', false, 'reason', 'Selected time is outside working hours.');
  end if;
  if exists (
    select 1 from public.clinic_doctor_blocks b
    where b.doctor_name = p_doctor_name and b.blocked_date = p_date
  ) then
    return jsonb_build_object('available', false, 'reason', 'Dentist is unavailable on this date.');
  end if;
  if (sched.break_start is not null and sched.break_end is not null
      and p_time < sched.break_end and p_time + make_interval(mins => p_duration_minutes) > sched.break_start)
     or (sched.lunch_start is not null and sched.lunch_end is not null
      and p_time < sched.lunch_end and p_time + make_interval(mins => p_duration_minutes) > sched.lunch_start) then
    return jsonb_build_object('available', false, 'reason', 'Selected time overlaps a break or lunch period.');
  end if;
  if exists (
    select 1 from public.clinic_appointments a
    where a.doctor_name = p_doctor_name
      and a.appointment_date = p_date
      and a.status <> 'Cancelled'
      and p_time < a.appointment_time + make_interval(mins => a.duration_minutes)
      and p_time + make_interval(mins => p_duration_minutes) > a.appointment_time
  ) then
    return jsonb_build_object('available', false, 'reason', 'This time slot has already been booked.');
  end if;
  return jsonb_build_object('available', true, 'reason', 'The selected slot is available.');
end;
$$;
grant execute on function public.check_customer_booking_slot(text,date,time,integer) to anon, authenticated;

create or replace function public.create_customer_appointment(
  p_customer_name text,
  p_customer_phone text,
  p_service text,
  p_notes text,
  p_doctor_name text,
  p_date date,
  p_time time,
  p_payment_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  email_value text := coalesce(auth.jwt()->>'email','');
  auto_confirm_value boolean := false;
  slot jsonb;
  created public.clinic_appointments%rowtype;
begin
  if uid is null then
    raise exception 'Please log in before requesting an appointment.';
  end if;
  if length(trim(coalesce(p_customer_name,''))) < 2
     or length(trim(coalesce(p_customer_phone,''))) < 7
     or length(trim(coalesce(p_service,''))) < 2
     or length(trim(coalesce(p_doctor_name,''))) < 2 then
    raise exception 'Please complete the required appointment details.';
  end if;
  if p_payment_method not in ('GCash (Online)','Pay at clinic') then
    raise exception 'Please select a valid payment method.';
  end if;

  -- Serialize bookings for a dentist/date so two simultaneous requests cannot claim the same slot.
  perform pg_advisory_xact_lock(hashtext(p_doctor_name), hashtext(p_date::text));
  slot := public.check_customer_booking_slot(p_doctor_name,p_date,p_time,30);
  if coalesce((slot->>'available')::boolean,false) is not true then
    raise exception '%', coalesce(slot->>'reason','Selected slot is unavailable.');
  end if;

  select coalesce(s.auto_confirm_appointments,false) into auto_confirm_value
  from public.clinic_staff s
  where s.role = 'doctor' and s.doctor_name = p_doctor_name
  order by s.created_at limit 1;

  insert into public.clinic_appointments (
    customer_user_id, customer_email, customer_name, customer_phone,
    service, notes, doctor_name, appointment_date, appointment_time,
    duration_minutes, payment_method, status, auto_confirmed
  ) values (
    uid, email_value, trim(p_customer_name), trim(p_customer_phone),
    trim(p_service), nullif(trim(coalesce(p_notes,'')),''), p_doctor_name,
    p_date, p_time, 30, p_payment_method,
    case when auto_confirm_value then 'Confirmed' else 'Pending' end,
    auto_confirm_value
  ) returning * into created;

  return jsonb_build_object(
    'id', created.id,
    'status', created.status,
    'auto_confirmed', created.auto_confirmed,
    'doctor_name', created.doctor_name,
    'appointment_date', created.appointment_date,
    'appointment_time', created.appointment_time
  );
end;
$$;
revoke all on function public.create_customer_appointment(text,text,text,text,text,date,time,text) from public, anon;
grant execute on function public.create_customer_appointment(text,text,text,text,text,date,time,text) to authenticated;
