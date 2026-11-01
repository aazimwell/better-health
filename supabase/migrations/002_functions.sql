-- =====================================================================
-- Better Health — 002 functions (role helpers, transactional workflows)
-- All appointment state changes go through these SECURITY DEFINER
-- functions; clients have no direct INSERT/UPDATE on appointments.
-- =====================================================================
alter table appointments add column if not exists reminder_sent boolean not null default false;

-- role helpers ---------------------------------------------------------
create or replace function my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and is_active
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(my_role() in ('admin','super_admin'), false)
$$;

create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(my_role() = 'super_admin', false)
$$;

create or replace function my_doctor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select d.id from doctors d
  join profiles p on p.id = d.profile_id
  where d.profile_id = auth.uid() and d.is_active and p.is_active and p.role = 'doctor'
$$;

create or replace function assistant_can(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from assistants a join profiles p on p.id = a.profile_id
    where a.profile_id = auth.uid() and a.is_active and p.is_active and p.role = 'assistant'
      and coalesce((a.permissions ->> perm)::boolean, false)
  )
$$;

create or replace function can_manage_appointments() returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin() or assistant_can('manage_appointments')
$$;

-- protect privileged columns from non-admin updates --------------------
create or replace function protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_admin() then return new; end if;   -- SQL editor / admin
  new.role := old.role;
  new.is_active := old.is_active;
  new.id := old.id;
  return new;
end $$;
create trigger profiles_protect before update on profiles for each row execute function protect_profile_fields();

create or replace function protect_doctor_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if pg_trigger_depth() > 1 or auth.uid() is null or is_admin() then return new; end if;
  new.is_active := old.is_active;
  new.consultation_fee := old.consultation_fee;
  new.profile_id := old.profile_id;
  new.rating_avg := old.rating_avg;
  new.rating_count := old.rating_count;
  return new;
end $$;
create trigger doctors_protect before update on doctors for each row execute function protect_doctor_fields();

-- notification + audit helpers -----------------------------------------
create or replace function push_notification(p_user uuid, p_cat text, p_title text, p_body text, p_appt uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare pref notification_preferences;
begin
  select * into pref from notification_preferences where user_id = p_user;
  if found then
    if p_cat = 'appointment' and not pref.appointment_updates then return; end if;
    if p_cat = 'announcement' and not pref.announcements then return; end if;
    if p_cat = 'reminder' and not pref.reminders then return; end if;
  end if;
  insert into notifications(user_id, category, title, body, appointment_id)
  values (p_user, p_cat, p_title, p_body, p_appt);
end $$;
revoke all on function push_notification(uuid,text,text,text,uuid) from public, anon, authenticated;

create or replace function notify_admins(p_title text, p_body text, p_appt uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from profiles where role in ('admin','super_admin') and is_active loop
    perform push_notification(r.id, 'appointment', p_title, p_body, p_appt);
  end loop;
end $$;
revoke all on function notify_admins(text,text,uuid) from public, anon, authenticated;

create or replace function log_admin(p_action text, p_entity text, p_entity_id uuid, p_details jsonb default null)
returns void language sql security definer set search_path = public as $$
  insert into admin_activity_logs(actor_id, action, entity, entity_id, details)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_details)
$$;
revoke all on function log_admin(text,text,uuid,jsonb) from public, anon, authenticated;

-- available slots --------------------------------------------------------
create or replace function get_available_slots(p_doctor uuid, p_date date, p_exclude uuid default null)
returns table(slot_start time, slot_end time)
language sql stable security definer set search_path = public as $$
  with clinic as (select now() at time zone timezone as local_now from clinic_settings where id = 1),
  gen as (
    select g as gts, g + make_interval(mins => s.slot_minutes) as gte
    from doctor_schedules s,
         generate_series(p_date + s.start_time,
                         p_date + s.end_time - make_interval(mins => s.slot_minutes),
                         make_interval(mins => s.slot_minutes)) g
    where s.doctor_id = p_doctor and s.weekday = extract(isodow from p_date)::int
  )
  select gts::time, gte::time
  from gen, clinic
  where exists (select 1 from doctors d where d.id = p_doctor and d.is_active)
    and gts > clinic.local_now
    and not exists (
      select 1 from appointments a
      where a.doctor_id = p_doctor and a.status in ('pending','approved')
        and (p_exclude is null or a.id <> p_exclude)
        and a.slot && tsrange(gts, gte))
    and not exists (
      select 1 from doctor_time_slots b
      where b.doctor_id = p_doctor and b.slot_date = p_date and b.is_blocked
        and tsrange(p_date + b.start_time, p_date + b.end_time) && tsrange(gts, gte))
  order by gts
$$;

-- book ------------------------------------------------------------------
create or replace function book_appointment(
  p_service uuid, p_doctor uuid, p_date date, p_start time, p_reason text, p_notes text default null)
returns appointments language plpgsql security definer set search_path = public as $$
declare v_end time; v_row appointments; v_pname text; v_sname text; v_dname text;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  if my_role() is distinct from 'patient' then raise exception 'Only patients can book appointments'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Please describe your symptoms or reason for visit'; end if;
  select name into v_sname from services where id = p_service and is_active;
  if v_sname is null then raise exception 'This service is not available'; end if;
  select full_name into v_dname from doctors where id = p_doctor and is_active;
  if v_dname is null then raise exception 'This doctor is not available'; end if;

  select s.slot_end into v_end from get_available_slots(p_doctor, p_date) s where s.slot_start = p_start;
  if v_end is null then raise exception 'This time slot is no longer available'; end if;

  if exists (select 1 from appointments a
             where a.patient_id = auth.uid() and a.status in ('pending','approved')
               and a.slot && tsrange(p_date + p_start, p_date + v_end)) then
    raise exception 'You already have an active appointment at this time';
  end if;

  begin
    insert into appointments(patient_id, doctor_id, service_id, appointment_date, start_time, end_time, patient_reason, patient_notes)
    values (auth.uid(), p_doctor, p_service, p_date, p_start, v_end, trim(p_reason), nullif(trim(coalesce(p_notes,'')), ''))
    returning * into v_row;
  exception when exclusion_violation then
    raise exception 'This time slot was just taken. Please choose another.';
  end;

  select full_name into v_pname from profiles where id = auth.uid();
  perform notify_admins('New appointment request',
    coalesce(nullif(v_pname,''),'A patient') || ' requested ' || v_sname || ' with ' || v_dname ||
    ' on ' || to_char(p_date,'DD Mon YYYY') || ' at ' || to_char(p_start,'HH12:MI AM'), v_row.id);
  return v_row;
end $$;

-- approve ---------------------------------------------------------------
create or replace function approve_appointment(p_id uuid)
returns appointments language plpgsql security definer set search_path = public as $$
declare v_row appointments;
begin
  if not is_admin() then raise exception 'Admin permission required'; end if;
  select * into v_row from appointments where id = p_id for update;
  if not found then raise exception 'Appointment not found'; end if;
  if v_row.status <> 'pending' then raise exception 'This request was already processed (%).', v_row.status; end if;
  if not exists (select 1 from doctors where id = v_row.doctor_id and is_active) then
    raise exception 'The selected doctor is no longer active. Reassign the doctor first.';
  end if;
  update appointments set status = 'approved', approved_by = auth.uid(), approved_at = now(),
         rejection_reason = null where id = p_id returning * into v_row;
  perform push_notification(v_row.patient_id, 'appointment', 'Appointment approved',
    'Your appointment on ' || to_char(v_row.appointment_date,'DD Mon YYYY') || ' at ' ||
    to_char(v_row.start_time,'HH12:MI AM') || ' is confirmed.', v_row.id);
  perform log_admin('appointment_approved', 'appointment', p_id, null);
  return v_row;
end $$;

-- reject ----------------------------------------------------------------
create or replace function reject_appointment(p_id uuid, p_reason text, p_comment text default null)
returns appointments language plpgsql security definer set search_path = public as $$
declare v_row appointments;
begin
  if not is_admin() then raise exception 'Admin permission required'; end if;
  if coalesce(trim(p_reason),'') = '' then raise exception 'A rejection reason is required'; end if;
  select * into v_row from appointments where id = p_id for update;
  if not found then raise exception 'Appointment not found'; end if;
  if v_row.status <> 'pending' then raise exception 'This request was already processed (%).', v_row.status; end if;
  update appointments set status = 'rejected', rejection_reason = trim(p_reason),
         admin_comment = nullif(trim(coalesce(p_comment,'')),'') where id = p_id returning * into v_row;
  perform push_notification(v_row.patient_id, 'appointment', 'Appointment rejected',
    'Reason: ' || trim(p_reason), v_row.id);
  perform log_admin('appointment_rejected', 'appointment', p_id, jsonb_build_object('reason', p_reason));
  return v_row;
end $$;

-- cancel ----------------------------------------------------------------
create or replace function cancel_appointment(p_id uuid, p_reason text default null)
returns appointments language plpgsql security definer set search_path = public as $$
declare v_row appointments; v_hours int; v_local timestamp; v_is_owner boolean;
begin
  select * into v_row from appointments where id = p_id for update;
  if not found then raise exception 'Appointment not found'; end if;
  v_is_owner := v_row.patient_id = auth.uid();
  if not (v_is_owner or can_manage_appointments()) then raise exception 'You cannot cancel this appointment'; end if;
  if v_row.status not in ('pending','approved') then raise exception 'This appointment can no longer be cancelled'; end if;

  if v_is_owner and v_row.status = 'approved' then
    select cancellation_hours, now() at time zone timezone into v_hours, v_local from clinic_settings where id = 1;
    if (v_row.appointment_date + v_row.start_time) - make_interval(hours => v_hours) < v_local then
      raise exception 'Approved appointments can only be cancelled at least % hours in advance. Please contact the clinic.', v_hours;
    end if;
  end if;

  update appointments set status = 'cancelled', cancelled_by = auth.uid(),
         cancellation_reason = nullif(trim(coalesce(p_reason,'')),'') where id = p_id returning * into v_row;
  if v_is_owner then
    perform notify_admins('Appointment cancelled', 'A patient cancelled ' || v_row.booking_ref, v_row.id);
  else
    perform push_notification(v_row.patient_id, 'appointment', 'Appointment cancelled',
      'Your appointment ' || v_row.booking_ref || ' was cancelled by the clinic.', v_row.id);
    perform log_admin('appointment_cancelled', 'appointment', p_id, null);
  end if;
  return v_row;
end $$;

-- reschedule / change doctor ----------------------------------------------
create or replace function reschedule_appointment(p_id uuid, p_date date, p_start time, p_doctor uuid default null)
returns appointments language plpgsql security definer set search_path = public as $$
declare v_row appointments; v_doc uuid; v_end time;
begin
  if not can_manage_appointments() then raise exception 'Permission required'; end if;
  select * into v_row from appointments where id = p_id for update;
  if not found then raise exception 'Appointment not found'; end if;
  if v_row.status not in ('pending','approved') then raise exception 'Only pending or approved appointments can be rescheduled'; end if;
  v_doc := coalesce(p_doctor, v_row.doctor_id);
  select s.slot_end into v_end from get_available_slots(v_doc, p_date, p_id) s where s.slot_start = p_start;
  if v_end is null then raise exception 'That time slot is not available'; end if;
  begin
    update appointments set doctor_id = v_doc, appointment_date = p_date, start_time = p_start, end_time = v_end
    where id = p_id returning * into v_row;
  exception when exclusion_violation then
    raise exception 'That time slot was just taken. Please choose another.';
  end;
  perform push_notification(v_row.patient_id, 'appointment', 'Appointment rescheduled',
    'Your appointment is now on ' || to_char(p_date,'DD Mon YYYY') || ' at ' || to_char(p_start,'HH12:MI AM'), v_row.id);
  perform log_admin('appointment_rescheduled', 'appointment', p_id, null);
  return v_row;
end $$;

-- complete ----------------------------------------------------------------
create or replace function complete_appointment(p_id uuid, p_summary text default null, p_internal_note text default null)
returns appointments language plpgsql security definer set search_path = public as $$
declare v_row appointments;
begin
  select * into v_row from appointments where id = p_id for update;
  if not found then raise exception 'Appointment not found'; end if;
  if not (is_admin() or v_row.doctor_id = my_doctor_id()) then raise exception 'Only the assigned doctor or an admin can complete this'; end if;
  if v_row.status <> 'approved' then raise exception 'Only approved appointments can be completed'; end if;
  update appointments set status = 'completed', completed_at = now(),
         treatment_summary = nullif(trim(coalesce(p_summary,'')),'') where id = p_id returning * into v_row;
  if coalesce(trim(p_internal_note),'') <> '' then
    insert into patient_notes(patient_id, appointment_id, author_id, note)
    values (v_row.patient_id, p_id, auth.uid(), trim(p_internal_note));
  end if;
  perform push_notification(v_row.patient_id, 'appointment', 'Appointment completed',
    'Your visit ' || v_row.booking_ref || ' is marked completed. Thank you!', v_row.id);
  return v_row;
end $$;

create or replace function set_admin_comment(p_id uuid, p_comment text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not can_manage_appointments() then raise exception 'Permission required'; end if;
  update appointments set admin_comment = nullif(trim(coalesce(p_comment,'')),'') where id = p_id;
end $$;

-- notification read state ---------------------------------------------------
create or replace function mark_notification_read(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update notifications set is_read = true where id = p_id and user_id = auth.uid()
$$;
create or replace function mark_all_notifications_read() returns void
language sql security definer set search_path = public as $$
  update notifications set is_read = true where user_id = auth.uid() and not is_read
$$;

-- admin: roles ---------------------------------------------------------------
create or replace function admin_set_role(p_email text, p_role user_role, p_doctor_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_p profiles;
begin
  if not is_admin() then raise exception 'Admin permission required'; end if;
  if p_role in ('admin','super_admin') and not is_super_admin() then raise exception 'Only a Super Admin can grant admin roles'; end if;
  select * into v_p from profiles where lower(email) = lower(trim(p_email));
  if not found then raise exception 'No registered account with that email. Ask the person to register first.'; end if;
  if v_p.id = auth.uid() then raise exception 'You cannot change your own role'; end if;
  if v_p.role in ('admin','super_admin') and not is_super_admin() then raise exception 'Only a Super Admin can change an admin'; end if;

  update profiles set role = p_role, is_active = true where id = v_p.id;

  if p_role = 'doctor' then
    if p_doctor_id is not null then
      update doctors set profile_id = v_p.id where id = p_doctor_id;
    elsif not exists (select 1 from doctors where profile_id = v_p.id) then
      insert into doctors(profile_id, full_name) values (v_p.id, v_p.full_name);
    end if;
  elsif p_role = 'assistant' then
    insert into assistants(profile_id) values (v_p.id) on conflict (profile_id) do update set is_active = true;
  elsif p_role = 'patient' then
    update doctors set profile_id = null where profile_id = v_p.id;
    update assistants set is_active = false where profile_id = v_p.id;
  end if;
  perform log_admin('role_changed', 'profile', v_p.id, jsonb_build_object('role', p_role));
end $$;

create or replace function apply_for_admin(p_message text default '') returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  if is_admin() then raise exception 'You already have admin access'; end if;
  insert into admin_applications(user_id, message) values (auth.uid(), coalesce(p_message,''));
exception when unique_violation then
  raise exception 'You already have a pending application';
end $$;

create or replace function review_admin_application(p_id uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v admin_applications;
begin
  if not is_super_admin() then raise exception 'Only a Super Admin can review admin applications'; end if;
  select * into v from admin_applications where id = p_id and status = 'pending' for update;
  if not found then raise exception 'Application not found or already reviewed'; end if;
  update admin_applications set status = case when p_approve then 'approved' else 'declined' end,
         reviewed_by = auth.uid() where id = p_id;
  if p_approve then update profiles set role = 'admin' where id = v.user_id; end if;
  perform log_admin('admin_application_reviewed', 'profile', v.user_id, jsonb_build_object('approved', p_approve));
end $$;

create or replace function send_announcement(p_title text, p_body text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not is_admin() then raise exception 'Admin permission required'; end if;
  if coalesce(trim(p_title),'') = '' then raise exception 'Title is required'; end if;
  insert into notifications(user_id, category, title, body)
  select p.id, 'announcement', trim(p_title), coalesce(p_body,'')
  from profiles p left join notification_preferences np on np.user_id = p.id
  where p.role = 'patient' and p.is_active and coalesce(np.announcements, true);
  get diagnostics n = row_count;
  perform log_admin('announcement_sent', 'notification', null, jsonb_build_object('title', p_title));
  return n;
end $$;

-- admin: dashboard & reports --------------------------------------------------
create or replace function admin_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare today date; res jsonb;
begin
  if not (is_admin() or assistant_can('view_appointments')) then raise exception 'Permission required'; end if;
  select (now() at time zone timezone)::date into today from clinic_settings where id = 1;
  select jsonb_build_object(
    'total_patients',  (select count(*) from profiles where role = 'patient'),
    'total_doctors',   (select count(*) from doctors),
    'total_assistants',(select count(*) from assistants),
    'today',     (select count(*) from appointments where appointment_date = today and status in ('pending','approved','completed')),
    'pending',   (select count(*) from appointments where status = 'pending'),
    'approved',  (select count(*) from appointments where status = 'approved'),
    'completed', (select count(*) from appointments where status = 'completed'),
    'cancelled', (select count(*) from appointments where status = 'cancelled'),
    'weekly', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'count',
                 (select count(*) from appointments a where a.appointment_date = d::date and a.status <> 'rejected')) order by d), '[]')
               from generate_series(today - 6, today, interval '1 day') d),
    'monthly', (select coalesce(jsonb_agg(jsonb_build_object('month', to_char(m,'Mon'), 'count',
                 (select count(*) from appointments a where date_trunc('month', a.appointment_date) = m and a.status <> 'rejected')) order by m), '[]')
               from generate_series(date_trunc('month', today) - interval '5 months', date_trunc('month', today), interval '1 month') m)
  ) into res;
  return res;
end $$;

create or replace function admin_report(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admin permission required'; end if;
  return jsonb_build_object(
    'from', p_from, 'to', p_to,
    'by_status', (select coalesce(jsonb_object_agg(status, c), '{}') from
                   (select status, count(*) c from appointments where appointment_date between p_from and p_to group by status) t),
    'by_doctor', (select coalesce(jsonb_agg(jsonb_build_object('name', d.full_name, 'total', t.c, 'completed', t.done)), '[]')
                  from (select doctor_id, count(*) c, count(*) filter (where status = 'completed') done
                        from appointments where appointment_date between p_from and p_to group by doctor_id) t
                  join doctors d on d.id = t.doctor_id),
    'by_service', (select coalesce(jsonb_agg(jsonb_build_object('name', s.name, 'total', t.c)), '[]')
                   from (select service_id, count(*) c from appointments where appointment_date between p_from and p_to group by service_id) t
                   join services s on s.id = t.service_id),
    'registrations', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', c) order by day), '[]')
                      from (select created_at::date as day, count(*) as c from profiles
                            where role = 'patient' and created_at::date between p_from and p_to group by 1) t)
  );
end $$;

-- reminders: schedule with pg_cron (see README) -----------------------------
create or replace function send_appointment_reminders() returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; v_local timestamp;
begin
  select now() at time zone timezone into v_local from clinic_settings where id = 1;
  for r in select * from appointments
           where status = 'approved' and not reminder_sent
             and (appointment_date + start_time) between v_local and v_local + interval '24 hours' loop
    perform push_notification(r.patient_id, 'reminder', 'Appointment reminder',
      'You have an appointment on ' || to_char(r.appointment_date,'DD Mon') || ' at ' || to_char(r.start_time,'HH12:MI AM'), r.id);
    update appointments set reminder_sent = true where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function send_appointment_reminders() from public, anon, authenticated;

-- grants: callable by signed-in users (each function enforces its own checks) ---
revoke all on function book_appointment(uuid,uuid,date,time,text,text) from public, anon;
revoke all on function approve_appointment(uuid) from public, anon;
revoke all on function reject_appointment(uuid,text,text) from public, anon;
revoke all on function cancel_appointment(uuid,text) from public, anon;
revoke all on function reschedule_appointment(uuid,date,time,uuid) from public, anon;
revoke all on function complete_appointment(uuid,text,text) from public, anon;
revoke all on function set_admin_comment(uuid,text) from public, anon;
revoke all on function admin_set_role(text,user_role,uuid) from public, anon;
revoke all on function apply_for_admin(text) from public, anon;
revoke all on function review_admin_application(uuid,boolean) from public, anon;
revoke all on function send_announcement(text,text) from public, anon;
revoke all on function admin_dashboard_stats() from public, anon;
revoke all on function admin_report(date,date) from public, anon;
grant execute on function get_available_slots(uuid,date,uuid) to authenticated;
grant execute on function book_appointment(uuid,uuid,date,time,text,text) to authenticated;
grant execute on function approve_appointment(uuid) to authenticated;
grant execute on function reject_appointment(uuid,text,text) to authenticated;
grant execute on function cancel_appointment(uuid,text) to authenticated;
grant execute on function reschedule_appointment(uuid,date,time,uuid) to authenticated;
grant execute on function complete_appointment(uuid,text,text) to authenticated;
grant execute on function set_admin_comment(uuid,text) to authenticated;
grant execute on function mark_notification_read(uuid) to authenticated;
grant execute on function mark_all_notifications_read() to authenticated;
grant execute on function admin_set_role(text,user_role,uuid) to authenticated;
grant execute on function apply_for_admin(text) to authenticated;
grant execute on function review_admin_application(uuid,boolean) to authenticated;
grant execute on function send_announcement(text,text) to authenticated;
grant execute on function admin_dashboard_stats() to authenticated;
grant execute on function admin_report(date,date) to authenticated;
