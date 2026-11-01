-- =====================================================================
-- Better Health — 004 storage buckets & policies
-- profile-photos is PRIVATE (path: <user_id>/avatar.jpg, read via signed URLs).
-- The other buckets are public-read, admin-write.
-- =====================================================================
insert into storage.buckets (id, name, public) values
  ('profile-photos',  'profile-photos',  false),
  ('doctor-photos',   'doctor-photos',   true),
  ('clinic-assets',   'clinic-assets',   true),
  ('service-images',  'service-images',  true),
  ('developer-assets','developer-assets',true)
on conflict (id) do nothing;

-- profile photos: owner full access; admins read; doctors read photos of their patients
create policy "profile photos owner write" on storage.objects for all to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "profile photos staff read" on storage.objects for select to authenticated
  using (bucket_id = 'profile-photos' and (
    is_admin() or assistant_can('view_patients')
    or doctor_has_patient(((storage.foldername(name))[1])::uuid)));

-- public buckets: anyone can read, only admins write
create policy "public assets read" on storage.objects for select to anon, authenticated
  using (bucket_id in ('doctor-photos','clinic-assets','service-images','developer-assets'));
create policy "admin assets write" on storage.objects for all to authenticated
  using (bucket_id in ('doctor-photos','clinic-assets','service-images','developer-assets') and is_admin())
  with check (bucket_id in ('doctor-photos','clinic-assets','service-images','developer-assets') and is_admin());
-- a doctor may upload their own photo into doctor-photos/<doctor_id>/...
create policy "doctor own photo write" on storage.objects for all to authenticated
  using (bucket_id = 'doctor-photos' and (storage.foldername(name))[1] = my_doctor_id()::text)
  with check (bucket_id = 'doctor-photos' and (storage.foldername(name))[1] = my_doctor_id()::text);
