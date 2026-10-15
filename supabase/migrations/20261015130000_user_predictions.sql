-- Phase 6b: Match Predictions storage with strict per-user RLS
-- Safe to re-run in the Supabase SQL editor.

create table if not exists public.user_predictions (
  user_id         uuid        not null references auth.users (id) on delete cascade,
  match_id        text        not null check (char_length(match_id) between 1 and 64),
  home_team       text        not null,
  away_team       text        not null,
  league_name     text,
  predicted_home  int         not null check (predicted_home >= 0 and predicted_home <= 30),
  predicted_away  int         not null check (predicted_away >= 0 and predicted_away <= 30),
  actual_home     int,
  actual_away     int,
  points          int         check (points in (0, 2, 3)),
  outcome         text        check (outcome in ('exact', 'outcome', 'wrong')),
  updated_at      timestamptz not null default now(),
  primary key (user_id, match_id)
);

alter table public.user_predictions enable row level security;

drop policy if exists "Own predictions" on public.user_predictions;
create policy "Own predictions" on public.user_predictions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.user_predictions from anon;
grant select, insert, update, delete on public.user_predictions to authenticated;
