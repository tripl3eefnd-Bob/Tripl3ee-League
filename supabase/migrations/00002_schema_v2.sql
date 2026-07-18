-- Triple3E League Manager Database Schema v2
-- Changes: category, global_players, injury event type, motm_player_id

-- 1. Add category column to leagues
alter table if exists leagues add column if not exists category text default 'adult' check (category in ('children', 'adult'));

-- 2. Add injury to match_events type check
alter table if exists match_events drop constraint if exists match_events_type_check;
alter table if exists match_events add constraint match_events_type_check check (type in ('goal', 'assist', 'yellow_card', 'red_card', 'motm', 'substitution', 'own_goal', 'penalty_goal', 'injury'));

-- 3. Add motm_player_id to matches
alter table if exists matches add column if not exists motm_player_id uuid references players(id);

-- 4. Create global_players table
create table if not exists global_players (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  position text not null default 'FW' check (position in ('GK', 'DF', 'MF', 'FW')),
  number int,
  created_at timestamptz not null default now()
);

alter table global_players enable row level security;

create policy "Allow all for now" on global_players for all using (true) with check (true);

create index global_players_name_idx on global_players(name);
