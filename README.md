# Better Health — Physiotherapy & Chiropractic (React Native + Expo + Supabase)

Roles: **patient, doctor, assistant, admin, super_admin**. All security lives in Supabase (RLS + SQL functions); hidden buttons are UX only.

## 1. Fill in your keys (the only thing you must change)

```bash
cp .env.example .env
```
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
```
Use only the publishable/anon key. **Never** put the `service_role` key, DB password or tokens in the app or in GitHub.

In `app.json` replace: `owner`, `extra.eas.projectId` (run `eas init`), and `android.package` if you want another id (default `com.betterhealth.app`).
Developer photo/links: edit `src/config.ts`.

## 2. Supabase setup (SQL editor, run in order)

1. `supabase/migrations/001_schema.sql`
2. `002_functions.sql`
3. `003_rls.sql`
4. `004_storage.sql`
5. `005_seed.sql`

Then in **Authentication → Providers → Email** decide whether "Confirm email" is on (the app handles both).
**Authentication → URL Configuration → Redirect URLs**: add `betterhealth://reset-password` (password reset link).

### First Super Admin (one time)
Register your own account in the app, then run in the SQL editor:
```sql
update profiles set role = 'super_admin' where email = 'YOU@EXAMPLE.COM';
```
Log in with **Admin Login**. Everything else (doctors, assistants, other admins) is granted from inside the app. Public sign-up can never create an admin.

### Add real data (nothing is invented)
Admin → Manage → **Clinic settings** (name, address, phone, hours, policies) → **Doctors** (add doctor, photo, working hours, link login by email) → **Services** (edit prices).

### Optional
- Reminders: enable `pg_cron`, then `select cron.schedule('bh-reminders','0 * * * *','select send_appointment_reminders()');`
- Push notifications: the app registers Expo push tokens into `profiles.expo_push_token`, but **delivery needs a server step** (an Edge Function / webhook on `notifications` insert calling the Expo push API). Not included — in-app + Realtime notifications work without it.

## 3. Run & build

```bash
npm install
npx expo install --fix      # aligns package versions with your Expo SDK
npx expo start --android

npm i -g eas-cli && eas login && eas init
eas build -p android --profile preview      # APK for testing
eas build -p android --profile production   # AAB for Play Store
```
Use `eas credentials` to manage signing; this project never generates or replaces keystores on its own.

## 4. GitHub
```bash
git init && git add . && git commit -m "Better Health app"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git && git push -u origin main
```
`.env` is git-ignored.

## 5. How the main flow works
Patient books → `book_appointment()` (re-checks doctor, slot, duplicates; a DB exclusion constraint blocks double-booking) → status **pending** + admin notified → Admin **approve/reject** (`approve_appointment` / `reject_appointment`, reason required, row-locked) → patient notified → confirmed screen only shows "Appointment Confirmed!" once status is approved. Cancel, reschedule, complete are likewise SQL functions with history logging.

## 6. Status & known limitations (honest list)
- **Database tested locally**: all 5 SQL files apply cleanly on PostgreSQL 16 (with Supabase stubs) and 18 workflow/permission checks passed (signup always creates a patient, double-booking blocked, patient cannot approve or self-promote, approve/reject/cancel, history, stats, reports). Real Supabase RLS for doctor/assistant roles and Storage policies were **not** exercised.
- **App not yet run**: the React Native code could not be installed/compiled or tested on a device in the build environment (no npm access). Only a syntax check passed. Expect small type/runtime fixes on first run; the Android/UI QA scenarios have not been executed.
- Expo owner is set to `better1` (your username). If `eas build` says the project belongs to another account, change `owner` in app.json to `better1s-team`.
- Package versions in `package.json` are targeted at Expo SDK 54 — run `npx expo install --fix`.
- Illustrations are original vector (SVG) art drawn in code — simpler than the soft-3D look of the reference image. Replace with designer art in `src/components/illustrations.tsx` if you want photoreal/3D.
- Service images upload (`service-images` bucket) is provisioned but the service form uses category artwork, not per-service uploads.
- Online payments are not implemented (the Payment Methods page says pay-at-clinic).
- Push delivery server not included (see above). Assistant "notify patients" permission exists in data but has no dedicated send screen.
- Doctors edit their own hours/blocked time and personal info; bio/qualification editing for doctors is done by the admin.
