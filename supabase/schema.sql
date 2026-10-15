-- Run once in the Supabase SQL editor. This installation is one church per project.
create extension if not exists pgcrypto with schema extensions;
create table public.church_content (
  id integer primary key check (id = 1),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.church_content enable row level security;
create policy "Anyone can read church pages" on public.church_content for select to anon, authenticated using (true);
create policy "Pastor can publish" on public.church_content for all to authenticated
  using ((auth.jwt()->'app_metadata'->>'role') = 'pastor')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'pastor');
grant select on public.church_content to anon, authenticated;
grant insert, update, delete on public.church_content to authenticated;
create function public.stamp_church_content() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger stamp_church_content before update on public.church_content for each row execute function public.stamp_church_content();

-- Recovery records are never exposed to browser users.
create table public.church_recovery_pins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin_hash text not null,
  expires_at timestamptz not null,
  issued_by uuid not null references auth.users(id),
  used_at timestamptz
);
create table public.church_recovery_attempts (
  email_hash text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);
alter table public.church_recovery_pins enable row level security;
alter table public.church_recovery_attempts enable row level security;
revoke all on public.church_recovery_pins, public.church_recovery_attempts from anon, authenticated;

create function public.issue_church_pin(member_email text, recovery_pin text, pastor_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare target_id uuid;
begin
  if recovery_pin !~ '^[0-9]{10,16}$' then return false; end if;
  if not exists(select 1 from auth.users where id = pastor_id and raw_app_meta_data->>'role' = 'pastor') then return false; end if;
  select id into target_id from auth.users where lower(email)=lower(trim(member_email))
    and coalesce(raw_app_meta_data->>'role','') <> 'pastor' and email_confirmed_at is not null;
  if target_id is null then return false; end if;
  insert into public.church_recovery_pins(user_id,pin_hash,expires_at,issued_by)
    values(target_id,extensions.crypt(recovery_pin, extensions.gen_salt('bf',10)),now()+interval '30 minutes',pastor_id)
    on conflict(user_id) do update set pin_hash=excluded.pin_hash,expires_at=excluded.expires_at,issued_by=excluded.issued_by,used_at=null;
  -- Issuing a new PIN does NOT clear the rate limiter.
  return true;
end $$;

create function public.redeem_church_pin(member_email text, recovery_pin text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_id uuid; hashed text; attempt public.church_recovery_attempts%rowtype; pin public.church_recovery_pins%rowtype;
begin
  hashed := encode(extensions.digest(lower(trim(member_email)), 'sha256'),'hex');
  insert into public.church_recovery_attempts(email_hash) values(hashed) on conflict do nothing;
  select * into attempt from public.church_recovery_attempts where email_hash=hashed for update;
  if attempt.window_start < now()-interval '15 minutes' then
    update public.church_recovery_attempts set window_start=now(),attempts=0 where email_hash=hashed;
    attempt.attempts := 0;
  end if;
  if attempt.attempts >= 5 then return null; end if;
  update public.church_recovery_attempts set attempts=attempts+1 where email_hash=hashed;
  select id into target_id from auth.users where lower(email)=lower(trim(member_email))
    and coalesce(raw_app_meta_data->>'role','') <> 'pastor' and email_confirmed_at is not null;
  if target_id is null then return null; end if;
  select * into pin from public.church_recovery_pins where user_id=target_id for update;
  if pin.user_id is null or pin.used_at is not null or pin.expires_at < now() then return null; end if;
  if extensions.crypt(recovery_pin,pin.pin_hash) <> pin.pin_hash then return null; end if;
  update public.church_recovery_pins set used_at=now() where user_id=target_id;
  return target_id;
end $$;
revoke all on function public.issue_church_pin(text,text,uuid) from public, anon, authenticated;
revoke all on function public.redeem_church_pin(text,text) from public, anon, authenticated;
grant execute on function public.issue_church_pin(text,text,uuid) to service_role;
grant execute on function public.redeem_church_pin(text,text) to service_role;

-- AFTER the pastor creates and confirms their account, replace the email and run:
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb)
--   || '{"role":"pastor"}'::jsonb where lower(email) = lower('pastor@yourchurch.org');
-- Then sign out and sign in to refresh the role. Never put this role in user_metadata.
-- Optional monthly maintenance:
-- delete from public.church_recovery_attempts where window_start < now()-interval '1 day';
-- delete from public.church_recovery_pins where expires_at < now()-interval '1 day';
