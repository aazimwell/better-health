// Supabase Edge Function: send-push
// Called by a Supabase Database Webhook on INSERT into public.notifications.
// It looks up the recipient's Expo push token and delivers the notification
// through the Expo Push API, so it arrives even when the app is closed/killed.
// No secret is stored in this file: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// come from the function's environment (set automatically by Supabase).
// deno-lint-ignore-file no-explicit-any
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body = await req.json().catch(() => ({}));
    // Database Webhook shape: { record: {...} }. Direct calls may send the row itself.
    const record = body.record ?? body;
    const user_id = record?.user_id;
    const title = record?.title;
    const text = record?.body;
    const appointment_id = record?.appointment_id ?? null;
    if (!user_id || !title || !text) {
      return Response.json(
        { skipped: true, reason: "missing user_id/title/body in payload" },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("expo_push_token")
      .eq("id", user_id)
      .single();
    if (error || !profile?.expo_push_token) {
      // Silently skip: the user has not registered a push token yet
      // (e.g. never logged in on a real device, or notification permission denied).
      return Response.json(
        { skipped: true, reason: "no expo push token for user" },
        { headers: corsHeaders },
      );
    }

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        to: profile.expo_push_token,
        title,
        body: text,
        data: { appointment_id },
        channelId: "default",
        priority: "high",
        badge: 1,
        // No sound field: the app is configured for silent (banner + badge) alerts.
      }),
    });
    const expoJson = await expoRes.json().catch(() => ({}));
    return Response.json(
      { delivered: expoRes.ok, expo: expoJson },
      { status: expoRes.ok ? 200 : 502, headers: corsHeaders },
    );
  } catch (e) {
    return Response.json(
      { error: String(e) },
      { status: 500, headers: corsHeaders },
    );
  }
});
