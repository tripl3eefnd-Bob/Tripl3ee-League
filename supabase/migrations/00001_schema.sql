-- Triple3E League Manager Database Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Leagues
create table if not exists leagues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  season text not null default '2025/2026',
  format text not null default 'single' check (format in ('single', 'double')),
  competition_type text not null default 'league' check (competition_type in ('league', 'group_knockout', 'multi_division')),
  points_win int not null default 3,
  points_draw int not null default 1,
  points_loss int not null default 0,
  tiebreaker jsonb not null default '["gd", "gf", "h2h"]',
  status text not null default 'active' check (status in ('active', 'completed')),
  num_teams int not null default 8,
  num_groups int,
  has_knockout boolean default false,
  created_at timestamptz not null default now()
);

alter table leagues enable row level security;

create policy "Allow all for now" on leagues for all using (true) with check (true);

-- Teams
create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid not null references leagues(id) on delete cascade,
  name text not null,
  short_name text not null,
  color text not null default '#10b981',
  logo_url text,
  owner_name text,
  created_at timestamptz not null default now()
);

alter table teams enable row level security;

create policy "Allow all for now" on teams for all using (true) with check (true);

create index teams_league_id_idx on teams(league_id);

-- Players
create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  number int not null default 1,
  position text not null default 'FW' check (position in ('GK', 'DF', 'MF', 'FW')),
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table players enable row level security;

create policy "Allow all for now" on players for all using (true) with check (true);

create index players_team_id_idx on players(team_id);

-- Player Transfers
create table if not exists player_transfers (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references players(id) on delete cascade,
  from_team_id uuid not null references teams(id) on delete cascade,
  to_team_id uuid not null references teams(id) on delete cascade,
  matchweek int not null,
  created_at timestamptz not null default now()
);

alter table player_transfers enable row level security;

create policy "Allow all for now" on player_transfers for all using (true) with check (true);

-- Player Suspensions
create table if not exists player_suspensions (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references players(id) on delete cascade,
  league_id uuid not null references leagues(id) on delete cascade,
  yellow_cards int not null default 0,
  red_cards int not null default 0,
  is_suspended boolean not null default false,
  suspension_until_matchweek int,
  updated_at timestamptz not null default now(),
  unique(player_id, league_id)
);

alter table player_suspensions enable row level security;

create policy "Allow all for now" on player_suspensions for all using (true) with check (true);

-- Matches
create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid not null references leagues(id) on delete cascade,
  matchweek int not null,
  round_name text,
  group_name text,
  home_team_id uuid not null references teams(id) on delete cascade,
  away_team_id uuid not null references teams(id) on delete cascade,
  home_score int,
  away_score int,
  status text not null default 'scheduled' check (status in ('scheduled', 'played', 'skipped')),
  is_knockout boolean not null default false,
  knockout_round text check (knockout_round in ('quarter', 'semi', 'final')),
  parent_match_id uuid references matches(id),
  bracket_position text check (bracket_position in ('top', 'bottom')),
  played_at timestamptz,
  extra_time boolean not null default false,
  penalties boolean not null default false,
  home_penalties int,
  away_penalties int,
  created_at timestamptz not null default now()
);

alter table matches enable row level security;

create policy "Allow all for now" on matches for all using (true) with check (true);

create index matches_league_id_idx on matches(league_id);
create index matches_matchweek_idx on matches(matchweek);

-- Match Events
create table if not exists match_events (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  type text not null check (type in ('goal', 'assist', 'yellow_card', 'red_card', 'motm', 'substitution', 'own_goal', 'penalty_goal')),
  player_id uuid not null references players(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  minute int not null default 0,
  substitution_in_player_id uuid references players(id),
  note text,
  created_at timestamptz not null default now()
);

alter table match_events enable row level security;

create policy "Allow all for now" on match_events for all using (true) with check (true);

create index match_events_match_id_idx on match_events(match_id);

-- Player Ratings
create table if not exists player_ratings (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  rating numeric(3,1) not null check (rating >= 1.0 and rating <= 10.0),
  unique(match_id, player_id)
);

alter table player_ratings enable row level security;

create policy "Allow all for now" on player_ratings for all using (true) with check (true);

-- Season Archives
create table if not exists season_archives (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid not null references leagues(id) on delete cascade,
  season_name text not null,
  archived_data jsonb not null,
  archived_at timestamptz not null default now()
);

alter table season_archives enable row level security;

create policy "Allow all for now" on season_archives for all using (true) with check (true);

-- Hall of Fame
create table if not exists hall_of_fame (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid not null references leagues(id) on delete cascade,
  category text not null check (category in ('top_scorer', 'best_player', 'best_gk', 'top_assist', 'most_motm')),
  player_id uuid not null references players(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  season text not null,
  value int not null default 0,
  created_at timestamptz not null default now()
);

alter table hall_of_fame enable row level security;

create policy "Allow all for now" on hall_of_fame for all using (true) with check (true);
