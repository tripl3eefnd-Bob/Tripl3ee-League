import { supabase } from './supabase'
import type {
  League, Team, Player, Match, MatchEvent, PlayerRating,
  PlayerSuspension, HallOfFameEntry, SeasonArchive,
} from '../types'

// --- LEAGUES ---
export async function getLeagues() {
  const { data } = await supabase.from('leagues').select('*').order('created_at', { ascending: false })
  return data as League[] | null
}

export async function getLeague(id: string) {
  const { data } = await supabase.from('leagues').select('*').eq('id', id).single()
  return data as League | null
}

export async function createLeague(league: Omit<League, 'id' | 'created_at'>) {
  const { data } = await supabase.from('leagues').insert(league).select().single()
  return data as League | null
}

export async function updateLeague(id: string, updates: Partial<League>) {
  const { data } = await supabase.from('leagues').update(updates).eq('id', id).select().single()
  return data as League | null
}

export async function deleteLeague(id: string) {
  await supabase.from('leagues').delete().eq('id', id)
}

// --- TEAMS ---
export async function getTeams(leagueId: string) {
  const { data } = await supabase.from('teams').select('*').eq('league_id', leagueId).order('name')
  return data as Team[] | null
}

export async function createTeam(team: Omit<Team, 'id' | 'created_at'>) {
  const { data } = await supabase.from('teams').insert(team).select().single()
  return data as Team | null
}

export async function updateTeam(id: string, updates: Partial<Team>) {
  const { data } = await supabase.from('teams').update(updates).eq('id', id).select().single()
  return data as Team | null
}

export async function deleteTeam(id: string) {
  await supabase.from('teams').delete().eq('id', id)
}

// --- PLAYERS ---
export async function getPlayers(teamId: string) {
  const { data } = await supabase.from('players').select('*').eq('team_id', teamId).order('number')
  return data as Player[] | null
}

export async function getPlayersByLeague(leagueId: string) {
  const { data } = await supabase
    .from('players')
    .select('*, teams!inner(league_id)')
    .eq('teams.league_id', leagueId)
    .order('name')
  return data as (Player & { teams: { league_id: string } })[] | null
}

export async function createPlayer(player: Omit<Player, 'id' | 'created_at'>) {
  const { data } = await supabase.from('players').insert(player).select().single()
  return data as Player | null
}

export async function updatePlayer(id: string, updates: Partial<Player>) {
  const { data } = await supabase.from('players').update(updates).eq('id', id).select().single()
  return data as Player | null
}

export async function deletePlayer(id: string) {
  await supabase.from('players').delete().eq('id', id)
}

// --- MATCHES ---
export async function getMatches(leagueId: string) {
  const { data } = await supabase
    .from('matches')
    .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
    .eq('league_id', leagueId)
    .order('matchweek')
    .order('created_at')
  return data as any[] | null
}

export async function createMatch(match: Omit<Match, 'id' | 'created_at'>) {
  const { data } = await supabase.from('matches').insert(match).select().single()
  return data as Match | null
}

export async function createMatches(matches: Omit<Match, 'id' | 'created_at'>[]) {
  const { data } = await supabase.from('matches').insert(matches).select()
  return data as Match[] | null
}

export async function updateMatch(id: string, updates: Partial<Match>) {
  const { data } = await supabase.from('matches').update(updates).eq('id', id).select().single()
  return data as Match | null
}

export async function deleteMatch(id: string) {
  await supabase.from('matches').delete().eq('id', id)
}

// --- MATCH EVENTS ---
export async function getMatchEvents(matchId: string) {
  const { data } = await supabase
    .from('match_events')
    .select('*')
    .eq('match_id', matchId)
    .order('minute')
  return data as MatchEvent[] | null
}

export async function getEventsByLeague(leagueId: string) {
  const { data } = await supabase
    .from('match_events')
    .select('*, matches!inner(league_id)')
    .eq('matches.league_id', leagueId)
  return data as (MatchEvent & { matches: { league_id: string } })[] | null
}

export async function createMatchEvent(event: Omit<MatchEvent, 'id'>) {
  const { data } = await supabase.from('match_events').insert(event).select().single()
  return data as MatchEvent | null
}

export async function deleteMatchEvent(id: string) {
  await supabase.from('match_events').delete().eq('id', id)
}

// --- PLAYER RATINGS ---
export async function getPlayerRatings(matchId: string) {
  const { data } = await supabase.from('player_ratings').select('*').eq('match_id', matchId)
  return data as PlayerRating[] | null
}

export async function upsertPlayerRating(rating: Omit<PlayerRating, 'id'>) {
  const { data } = await supabase
    .from('player_ratings')
    .upsert(rating, { onConflict: 'match_id,player_id' })
    .select()
    .single()
  return data as PlayerRating | null
}

// --- SUSPENSIONS ---
export async function getSuspensions(leagueId: string) {
  const { data } = await supabase
    .from('player_suspensions')
    .select('*')
    .eq('league_id', leagueId)
  return data as PlayerSuspension[] | null
}

export async function upsertSuspension(s: Omit<PlayerSuspension, 'id'>) {
  const { data } = await supabase
    .from('player_suspensions')
    .upsert(s, { onConflict: 'player_id,league_id' })
    .select()
    .single()
  return data as PlayerSuspension | null
}

// --- HALL OF FAME ---
export async function getHallOfFame(leagueId: string) {
  const { data } = await supabase
    .from('hall_of_fame')
    .select('*')
    .eq('league_id', leagueId)
    .order('value', { ascending: false })
  return data as HallOfFameEntry[] | null
}

export async function createHallOfFameEntry(entry: Omit<HallOfFameEntry, 'id' | 'created_at'>) {
  const { data } = await supabase.from('hall_of_fame').insert(entry).select().single()
  return data as HallOfFameEntry | null
}

// --- ARCHIVES ---
export async function getArchives(leagueId: string) {
  const { data } = await supabase
    .from('season_archives')
    .select('*')
    .eq('league_id', leagueId)
    .order('archived_at', { ascending: false })
  return data as SeasonArchive[] | null
}

export async function createArchive(archive: Omit<SeasonArchive, 'id' | 'archived_at'>) {
  const { data } = await supabase.from('season_archives').insert(archive).select().single()
  return data as SeasonArchive | null
}

// --- STORAGE ---
export async function uploadFile(bucket: string, path: string, file: File) {
  const { data } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  return data
}

export function getFileUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
