# Team login and roles setup

The admin and doctor use the same sign-in page. Their access is assigned by the role stored in Supabase.

## 1. Install the role table
In Supabase, open **SQL Editor**, create a new query, paste the contents of `supabase/migrations/202611170003_clinic_staff_roles.sql`, and run it.

## 2. Create team sign-in accounts
In Supabase, open **Authentication → Users → Add user**. Create one account for each team member. Do not share passwords in chat or commit them to GitHub.

## 3. Assign each account a role
Copy the user's UUID from Authentication → Users, then run a query like this in SQL Editor (replace the example values):

```sql
insert into public.clinic_staff (user_id, display_name, role, doctor_name)
values ('USER-UUID-HERE', 'Clinic Administrator', 'admin', null);
```

Use `doctor` for a dentist and set `doctor_name` to the matching dentist name already listed in the demo. Use `staff` for clinic staff. For example:

```sql
insert into public.clinic_staff (user_id, display_name, role, doctor_name)
values ('USER-UUID-HERE', 'Front Desk Staff', 'staff', null);
```

## Demo permissions
- **Admin:** full access to all pages and management actions.
- **Doctor:** dashboard, patient viewing, appointment schedule, own schedule view, and treatment checklist.
- **Staff:** dashboard, add/view patient records, view-only appointment schedule and doctor availability, and update the treatment checklist. Staff cannot edit appointments, change doctor schedules, or access payments and reports.

## Important limitations
This is a role-gated demo interface. Existing patients, appointments, schedules, payments, and checklist data are still stored in each browser's localStorage, not in Supabase. The role table protects role lookup, but it does not yet provide database-level access control for those records. Do not use real patient information or treat this as a production clinic system until the data is migrated to Supabase with appropriate table-level RLS and privacy safeguards.
