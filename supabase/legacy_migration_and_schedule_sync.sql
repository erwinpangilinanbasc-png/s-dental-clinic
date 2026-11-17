-- S Dental Clinic: legacy appointment import and schedule-policy correction
-- Run once in Supabase SQL Editor after appointment_booking.sql.

-- Legacy browser appointments do not have a Supabase Auth customer account.
alter table public.clinic_appointments
  alter column customer_user_id drop not null;

alter table public.clinic_appointments
  add column if not exists source_legacy_id text;

create unique index if not exists clinic_appointments_source_legacy_id_uidx
  on public.clinic_appointments(source_legacy_id)
  where source_legacy_id is not null;

-- Scope doctor write access to the doctor's own schedule and blocks.
drop policy if exists "Clinic team manages dentist schedules" on public.clinic_doctor_schedules;
create policy "Clinic team manages dentist schedules"
on public.clinic_doctor_schedules for all to authenticated
using (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (s.role = 'admin' or
        (s.role = 'doctor' and s.doctor_name = clinic_doctor_schedules.doctor_name))
  )
)
with check (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (s.role = 'admin' or
        (s.role = 'doctor' and s.doctor_name = clinic_doctor_schedules.doctor_name))
  )
);

drop policy if exists "Clinic team manages dentist blocked dates" on public.clinic_doctor_blocks;
create policy "Clinic team manages dentist blocked dates"
on public.clinic_doctor_blocks for all to authenticated
using (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (s.role = 'admin' or
        (s.role = 'doctor' and s.doctor_name = clinic_doctor_blocks.doctor_name))
  )
)
with check (
  exists (
    select 1 from public.clinic_staff s
    where s.user_id = auth.uid()
      and (s.role = 'admin' or
        (s.role = 'doctor' and s.doctor_name = clinic_doctor_schedules.doctor_name))
  )
);

-- Import is only available to an authenticated clinic administrator.
create or replace function public.migrate_legacy_appointments(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  if auth.uid() is null or not exists (
    select 1 from public.clinic_staff
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only a clinic administrator can import legacy appointments.';
  end if;

  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Legacy appointment data must be an array.';
  end if;

  with inserted as (
    insert into public.clinic_appointments (
      customer_user_id, customer_email, customer_name, customer_phone,
      service, notes, doctor_name, appointment_date, appointment_time,
      payment_method, payment_status, status, source_legacy_id
    )
    select
      null,
      coalesce(x->>'customer_email',''),
      coalesce(nullif(trim(x->>'customer_name'),''),'Legacy appointment'),
      coalesce(x->>'customer_phone',''),
      coalesce(nullif(trim(x->>'service'),''),'Consultation'),
      nullif(x->>'notes',''),
      coalesce(nullif(trim(x->>'doctor_name'),''),'Dr. Ana Reyes'),
      (x->>'appointment_date')::date,
      (x->>'appointment_time')::time,
      coalesce(nullif(x->>'payment_method',''),'Pay at clinic'),
      coalesce(nullif(x->>'payment_status',''),'Pending'),
      case when x->>'status' in ('Pending','Confirmed','Cancelled')
        then x->>'status' else 'Pending' end,
      x->>'source_legacy_id'
    from jsonb_array_elements(p_rows) x
    where nullif(x->>'source_legacy_id','') is not null
      and nullif(x->>'appointment_date','') is not null
      and nullif(x->>'appointment_time','') is not null
    on conflict (source_legacy_id) where source_legacy_id is not null do nothing
    returning id
  )
  select count(*) into inserted_count from inserted;

  return jsonb_build_object('inserted', inserted_count);
end;
$$;

revoke all on function public.migrate_legacy_appointments(jsonb) from public, anon;
grant execute on function public.migrate_legacy_appointments(jsonb) to authenticated;
