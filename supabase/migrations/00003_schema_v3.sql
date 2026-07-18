-- Triple3E League Manager Database Schema v3
-- Changes: global_players -> participants, participant_id in teams

-- 1. Rename global_players to participants
alter table if exists global_players rename to participants;

-- 2. Drop old RLS policies for global_players, recreate for participants
drop policy if exists "Allow all for now" on global_players;
alter table if exists participants enable row level security;
create policy "Allow all for now" on participants for all using (true) with check (true);

-- 3. Rename indexes
drop index if exists global_players_name_idx;
create index if not exists participants_name_idx on participants(name);

-- 4. Add participant_id to teams
alter table if exists teams add column if not exists participant_id uuid references participants(id);

create index if not exists teams_participant_id_idx on teams(participant_id);
