-- Run once, AFTER schema.sql. Shared cache keeps API costs independent of visitors.
create table public.church_youtube_cache (
 id integer primary key check(id=1),
 data jsonb,
 refreshed_at timestamptz,
 discovery_at timestamptz,
 lease_until timestamptz not null default '-infinity'
);
insert into public.church_youtube_cache(id) values(1);
alter table public.church_youtube_cache enable row level security;
revoke all on public.church_youtube_cache from anon, authenticated;
grant all on public.church_youtube_cache to service_role;
create function public.claim_youtube_refresh() returns boolean
 language plpgsql security definer set search_path='' as $$
 declare claimed integer;
 begin
  update public.church_youtube_cache set lease_until=now()+interval '110 seconds'
   where id=1 and lease_until<now() and (refreshed_at is null or refreshed_at<now()-interval '60 seconds');
  get diagnostics claimed = row_count;
  return claimed=1;
 end $$;
revoke all on function public.claim_youtube_refresh() from public,anon,authenticated;
grant execute on function public.claim_youtube_refresh() to service_role;
