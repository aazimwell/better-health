-- =====================================================================
-- Better Health — 005 seed (PLACEHOLDERS — edit later in Admin → Services)
-- Only the first doctor (name only) is seeded; add others from Admin → Doctors.
-- Prices below are placeholders taken from the design reference.
-- =====================================================================
insert into clinic_settings (id, clinic_name, address, opening_hours, email)
values (1, 'Better Health Chiropractic Center', 'Khilgaon, Dhaka 2100', 'Daily: 8:00 AM – 10:00 PM', 'azim4web@gmail.com')
on conflict (id) do update set clinic_name = excluded.clinic_name, address = excluded.address,
  opening_hours = excluded.opening_hours, email = excluded.email;

-- First doctor. Qualifications, photo and fee are left blank: edit them in Admin → Doctors.
insert into doctors (full_name)
select 'Ashrafu Islam Shipon' where not exists (select 1 from doctors);

-- DEFAULT working hours = clinic hours (8:00–22:00, every day, 30-min slots). Change in Admin → Doctors.
insert into doctor_schedules (doctor_id, weekday, start_time, end_time, slot_minutes)
select d.id, w, '08:00', '22:00', 30 from doctors d, generate_series(1,7) w
where d.full_name = 'Ashrafu Islam Shipon'
on conflict (doctor_id, weekday, start_time) do nothing;

insert into services (name, description, category, price) values
 ('Physiotherapy Consultation','Pain relief, mobility, recovery','Physiotherapy',800),
 ('Chiropractic Adjustment','Spine & joint alignment','Chiropractic',1200),
 ('Sports Injury Treatment','Get back to your game','Sports Injury',1000),
 ('Post-Surgery Rehabilitation','Recover with expert care','Rehabilitation',1500),
 ('Back Pain Treatment','Targeted relief for back pain','Physiotherapy',1000),
 ('Neck Pain Treatment','Ease neck stiffness and pain','Chiropractic',1000),
 ('Rehabilitation Session','Build strength and mobility','Rehabilitation',900);

-- ---------------------------------------------------------------------
-- FIRST ADMIN BOOTSTRAP (run ONCE, after you register your own account
-- in the app). Replace the email, then run in the SQL editor:
--
--   update profiles set role = 'super_admin' where email = 'YOU@EXAMPLE.COM';
--
-- Afterwards, grant doctor / assistant / admin roles from inside the app.
-- ---------------------------------------------------------------------
-- Optional daily reminders (Database → Extensions → enable pg_cron):
--   select cron.schedule('bh-reminders','0 * * * *','select send_appointment_reminders()');
