# Push notifications (send-push) — setup

## The problem this fixes

Before this, notifications only appeared inside the app while it was open
(Supabase Realtime). When the app was closed, nothing could arrive on screen,
because no server ever sent a push to Expo. This function is that server step.

## How it works

1. The app registers an Expo push token into `profiles.expo_push_token`
   (`src/lib/notifications.tsx`, on a real device after login).
2. Any new row in `public.notifications` (appointment approved/rejected/
   cancelled/rescheduled/completed, or a reminder) triggers this function.
3. The function reads the recipient's token and POSTs to the Expo Push API
   with `channelId: 'default'`, high priority and a badge — no sound, by design.

## Remaining deploy steps — push does NOT work until BOTH are done

### (a) Deploy the function (Supabase CLI, once)

```sh
supabase link --project-ref <your-project-ref>
supabase functions deploy send-push
```

### (b) Create a Database Webhook (Supabase Dashboard, once)

Dashboard → Database → Webhooks → Create a new webhook:

- Table: `public.notifications`
- Events: `INSERT` only
- Type: HTTP Request, Method: POST
- URL: `https://<your-project-ref>.supabase.co/functions/v1/send-push`

Then make a **new Expo preview build** from latest `main` (the app side
already contains the HIGH-importance `default` channel) and test with the
app fully closed/killed, on a real device, with notification permission
granted. In-app notifications keep working while open even before (a)/(b).
