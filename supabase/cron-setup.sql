-- Run after deploying the send-appointment-reminders Edge Function.
-- Replace the two placeholders with values stored in Supabase Vault.
-- Never commit actual keys or paste them into GitHub.
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
select vault.create_secret('YOUR_SUPABASE_SERVICE_ROLE_OR_SECRET_KEY', 'reminder_invoker_key');

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  's-dental-clinic-24h-sms-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/send-appointment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_invoker_key')
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 15000
  );
  $$
);
