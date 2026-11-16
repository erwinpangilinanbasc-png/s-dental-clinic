// S Dental Clinic — scheduled 24-hour appointment SMS reminders
// Secrets required in Supabase Edge Function settings:
// SEMAPHORE_API_KEY, optional SEMAPHORE_SENDER_NAME
// Supabase supplies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const suppliedKey = req.headers.get("apikey") ?? "";
  if (!serviceKey || suppliedKey !== serviceKey) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const semaphoreKey = Deno.env.get("SEMAPHORE_API_KEY");
  const senderName = Deno.env.get("SEMAPHORE_SENDER_NAME");
  if (!supabaseUrl || !serviceKey || !semaphoreKey) {
    return json({ error: "Missing server configuration. Set the Supabase and Semaphore secrets." }, 500);
  }

  const claimedResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/claim_due_sms_reminders`, {
    method: "POST",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ batch_size: 50 })
  });
  if (!claimedResponse.ok) {
    const detail = await claimedResponse.text();
    return json({ error: "Could not claim due reminders", detail }, 502);
  }

  const reminders = await claimedResponse.json();
  const results = [];
  for (const reminder of reminders) {
    const when = new Date(reminder.appointment_at);
    const dateText = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila", weekday: "short", month: "short", day: "numeric", year: "numeric"
    }).format(when);
    const timeText = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit"
    }).format(when);
    const message = `S Dental Clinic reminder: You have an appointment on ${dateText} at ${timeText} with ${reminder.dentist_name}. Please contact the clinic if you need to make changes.`;

    try {
      const body = new URLSearchParams({
        apikey: semaphoreKey,
        number: normalizePhilippineNumber(reminder.patient_phone),
        message
      });
      if (senderName) body.set("sendername", senderName);

      const smsResponse = await fetch("https://api.semaphore.co/api/v4/messages", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });
      const smsResult = await smsResponse.json().catch(() => ({}));
      const accepted = smsResponse.ok && Array.isArray(smsResult) && smsResult.length > 0 &&
        !["failed", "refunded"].includes(String(smsResult[0]?.status ?? "").toLowerCase());
      if (!accepted) throw new Error(JSON.stringify(smsResult).slice(0, 500));

      await updateReminder(supabaseUrl, serviceKey, reminder.reminder_id, {
        status: "sent",
        semaphore_message_id: String(smsResult[0].message_id ?? ""),
        sent_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString()
      });
      results.push({ reminder_id: reminder.reminder_id, status: "sent" });
    } catch (error) {
      await updateReminder(supabaseUrl, serviceKey, reminder.reminder_id, {
        status: "failed",
        error_message: String(error).slice(0, 500),
        updated_at: new Date().toISOString()
      });
      results.push({ reminder_id: reminder.reminder_id, status: "failed" });
    }
  }
  return json({ processed: results.length, results });
});

function normalizePhilippineNumber(value: string): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("09") && digits.length === 11) return "63" + digits.slice(1);
  if (digits.startsWith("9") && digits.length === 10) return "63" + digits;
  if (digits.startsWith("63") && digits.length === 12) return digits;
  throw new Error("Invalid Philippine mobile number format");
}

async function updateReminder(base: string, key: string, id: string, values: Record<string, unknown>) {
  const response = await fetch(`${base}/rest/v1/sms_reminder_queue?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(values)
  });
  if (!response.ok) throw new Error(`Could not update reminder status: ${response.status}`);
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
