-- Optional a1score accounts: sync follows and settings across devices.
-- Apply in the Supabase SQL editor (or `supabase db push`). Safe to re-run.
-- Every row belongs to one auth user and is only visible to that user (RLS).

-- Follows: one row per followed player / club / league.
create table if not exists public.user_follows (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  type       text        not null check (type in ('player', 'club', 'league')),
  entity_id  text        not null check (char_length(entity_id) between 1 and 100),
  -- Display snapshot (name, slug, crest, value when followed); small by design.
  data       jsonb       not null default '{}'::jsonb check (octet_length(data::text) <= 4000),
  saved_at   timestamptz not null default now(),
  primary key (user_id, type, entity_id)
);

-- Settings: one row per user; null = not set on any device yet.
create table if not exists public.user_settings (
  user_id     uuid        primary key references auth.users (id) on delete cascade,
  theme       text        check (theme in ('system', 'light', 'dark')),
  currency    text        check (currency in ('EUR', 'GBP', 'USD')),
  units       text        check (units in ('metric', 'imperial')),
  tv_country  text        check (tv_country ~ '^[A-Z]{2}$'),
  updated_at  timestamptz not null default now()
);

alter table public.user_follows  enable row level security;
alter table public.user_settings enable row level security;

-- Signed-in users see and change only their own rows; anonymous users get nothing.
drop policy if exists "Own follows" on public.user_follows;
create policy "Own follows" on public.user_follows
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Own settings" on public.user_settings;
create policy "Own settings" on public.user_settings
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.user_follows, public.user_settings from anon;
grant select, insert, update, delete on public.user_follows, public.user_settings to authenticated;

-- Cap follows per user so one account can't fill the table.
create or replace function public.limit_user_follows() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.user_follows where user_id = new.user_id) >= 500 then
    raise exception 'follow limit reached' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists limit_user_follows on public.user_follows;
create trigger limit_user_follows before insert on public.user_follows
  for each row execute function public.limit_user_follows();

-- Lets a signed-in user delete their own account (and, by cascade, all rows above).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
