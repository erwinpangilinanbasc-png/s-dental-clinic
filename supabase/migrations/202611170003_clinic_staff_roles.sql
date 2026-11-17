-- S Dental Clinic demo team roles
-- Run this in Supabase SQL Editor before creating team role records.
create table if not exists public.clinic_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('admin','doctor','staff')),
  doctor_name text,
  created_at timestamptz not null default now(),
  constraint doctor_role_has_name check (role <> 'doctor' or doctor_name is not null)
);
alter table public.clinic_staff enable row level security;
drop policy if exists "Team members can read their own role" on public.clinic_staff;
create policy "Team members can read their own role"
on public.clinic_staff for select to authenticated
using (auth.uid() = user_id);
revoke all on public.clinic_staff from anon, public;
grant select on public.clinic_staff to authenticated;
-- Add role rows only from the Supabase SQL Editor after creating users
-- under Authentication > Users. Never expose service-role keys in the website.
