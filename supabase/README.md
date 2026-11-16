# Semaphore 24-hour SMS reminders

This folder adds a **server-side reminder foundation**. The existing GitHub Pages app still stores appointments in browser localStorage, so reminders will not send until the clinic's appointment workflow is connected to the Supabase tables below. Do not use real patient data until staff authentication and access policies are implemented.

## What it does
- Creates a private appointment table and reminder queue.
- Queues one reminder for 24 hours before each confirmed appointment when the patient has opted in to SMS.
- Skips cancelled/unconfirmed appointments and appointments without SMS consent.
- A scheduled Supabase Edge Function sends due messages through Semaphore and records sent/failed status.
- Uses Philippine time in the SMS display. Appointment timestamps are stored as timezone-aware values.

## Setup
1. In Supabase Dashboard, open **SQL Editor** and run `migrations/202611170001_appointment_sms_reminders.sql`.
2. Deploy the Edge Function in `functions/send-appointment-reminders/index.ts` as `send-appointment-reminders`.
3. In Supabase **Edge Function Secrets**, set:
   - `SEMAPHORE_API_KEY` = the API key from the clinic's Semaphore account
   - `SEMAPHORE_SENDER_NAME` = optional approved sender name registered in Semaphore
   Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions. Never put these secrets in the website, `config.js`, or GitHub.
4. In SQL Editor, open `cron-setup.sql`. Replace the project URL and key placeholders in the two `vault.create_secret` statements, then run it. Use the project's service-role/secret key only in the private Supabase SQL Editor/Vault, never in chat or GitHub.
5. Confirm the Cron job appears in **Integrations → Cron** and inspect Edge Function logs after a due reminder is processed.
6. Connect the admin appointment create/edit workflow to `public.clinic_appointments` using authenticated staff accounts and role-based Row Level Security. Set `sms_consent=true` only after the patient has agreed to receive reminders. The current browser-only appointment form is not yet connected to this table.

## Important
- Semaphore's API may queue a message before carrier delivery; a successful API response is not proof the handset received it. Check Semaphore message history for final delivery status.
- Keep reminder messages minimal; do not include diagnoses, treatment details, or other health information.
- Test with a clinic-controlled number and explicit consent before enabling patient reminders.
- If a reminder fails, it is marked failed for staff review; this version does not automatically retry failed messages, avoiding accidental duplicate SMS.
- SMS charges and sender-name approval are managed in the clinic's Semaphore account.
