-- S Dental Clinic: secure appointment reminder queue
-- Apply this migration in the Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.clinic_appointments (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  patient_phone text not null,
  appointment_at timestamptz not null,
  dentist_name text not null,
  status text not null default 'Confirmed' check (status in ('Confirmed','Pending','Cancelled','Completed')),
  sms_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sms_reminder_queue (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.clinic_appointments(id) on delete cascade,
  reminder_type text not null default '24_hour',
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','skipped')),
  semaphore_message_id text,
  error_message text,
  sent_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, reminder_type)
);

create index if not exists sms_reminder_due_idx
  on public.sms_reminder_queue (scheduled_at)
  where status = 'pending';

alter table public.clinic_appointments enable row level security;
alter table public.sms_reminder_queue enable row level security;
-- No anon/authenticated policies are added. Browser users cannot read/write these tables
-- until proper staff authentication and role-based policies are implemented.

create or replace function public.sync_24h_sms_reminder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'Confirmed' and new.sms_consent = true then
    insert into public.sms_reminder_queue (appointment_id, scheduled_at, status)
    values (new.id, new.appointment_at - interval '24 hours',
      case when new.appointment_at - interval '24 hours' <= now() then 'pending' else 'pending' end)
    on conflict (appointment_id, reminder_type)
    do update set scheduled_at = excluded.scheduled_at,
      status = case
        when public.sms_reminder_queue.status = 'sent' then 'sent'
        else 'pending'
      end,
      error_message = null,
      updated_at = now();
  else
    update public.sms_reminder_queue
      set status = 'skipped', updated_at = now()
      where appointment_id = new.id and status <> 'sent';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clinic_appointment_sms_reminder on public.clinic_appointments;
create trigger clinic_appointment_sms_reminder
before insert or update of appointment_at, status, sms_consent
on public.clinic_appointments
for each row execute function public.sync_24h_sms_reminder();

create or replace function public.claim_due_sms_reminders(batch_size integer default 50)
returns table (
  reminder_id uuid,
  appointment_id uuid,
  patient_name text,
  patient_phone text,
  appointment_at timestamptz,
  dentist_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select q.id
    from public.sms_reminder_queue q
    join public.clinic_appointments a on a.id = q.appointment_id
    where q.status = 'pending'
      and q.scheduled_at <= now()
      and a.status = 'Confirmed'
      and a.sms_consent = true
      and a.appointment_at > now()
    order by q.scheduled_at
    limit greatest(1, least(batch_size, 100))
    for update of q skip locked
  ),
  claimed as (
    update public.sms_reminder_queue q
      set status = 'processing', attempts = q.attempts + 1, updated_at = now()
    from due
    where q.id = due.id
    returning q.id, q.appointment_id
  )
  select c.id, a.id, a.patient_name, a.patient_phone, a.appointment_at, a.dentist_name
  from claimed c
  join public.clinic_appointments a on a.id = c.appointment_id;
end;
$$;

revoke all on function public.claim_due_sms_reminders(integer) from public, anon, authenticated;
grant execute on function public.claim_due_sms_reminders(integer) to service_role;
