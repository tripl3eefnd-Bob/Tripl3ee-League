export type CompetitionType = 'league' | 'group_knockout' | 'multi_division'
export type LeagueFormat = 'single' | 'double'
export type MatchStatus = 'scheduled' | 'played' | 'skipped'
export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW'
export type EventType = 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'motm' | 'substitution' | 'own_goal' | 'penalty_goal'
export type Tiebreaker = 'gd' | 'gf' | 'h2h'
export type KnockoutRound = 'quarter' | 'semi' | 'final'

export interface League {
  id: string
  name: string
  season: string
  format: LeagueFormat
  competition_type: CompetitionType
  points_win: number
  points_draw: number
  points_loss: number
  tiebreaker: Tiebreaker[]
  status: 'active' | 'completed'
  num_teams: number
  num_groups?: number
  has_knockout?: boolean
  created_at: string
}

export interface Team {
  id: string
  league_id: string
  name: string
  short_name: string
  color: string
  logo_url?: string
  owner_name?: string
  created_at: string
}

export interface Player {
  id: string
  team_id: string
  name: string
  number: number
  position: PlayerPosition
  photo_url?: string
  is_active: boolean
  created_at: string
}

export interface Match {
  id: string
  league_id: string
  matchweek: number
  round_name?: string
  group_name?: string
  home_team_id: string
  away_team_id: string
  home_score?: number
  away_score?: number
  status: MatchStatus
  is_knockout: boolean
  knockout_round?: KnockoutRound
  parent_match_id?: string
  bracket_position?: 'top' | 'bottom'
  played_at?: string
  extra_time: boolean
  penalties: boolean
  home_penalties?: number
  away_penalties?: number
  created_at: string
}

export interface MatchEvent {
  id: string
  match_id: string
  type: EventType
  player_id: string
  team_id: string
  minute: number
  substitution_in_player_id?: string
  note?: string
}

export interface PlayerRating {
  id: string
  match_id: string
  player_id: string
  rating: number
}

export interface PlayerTransfer {
  id: string
  player_id: string
  from_team_id: string
  to_team_id: string
  matchweek: number
  created_at: string
}

export interface PlayerSuspension {
  id: string
  player_id: string
  league_id: string
  yellow_cards: number
  red_cards: number
  is_suspended: boolean
  suspension_until_matchweek?: number
}

export interface Standing {
  team_id: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  form: ('W' | 'D' | 'L')[]
}

export interface KnockoutBracket {
  id: string
  league_id: string
  round: number
  position: number
  match_id?: string
  parent_top_match_id?: string
  parent_bottom_match_id?: string
  team_source?: 'winner' | 'loser'
  team_id?: string
}

export interface SeasonArchive {
  id: string
  league_id: string
  season_name: string
  archived_data: any
  archived_at: string
}

export interface HallOfFameEntry {
  id: string
  league_id: string
  category: 'top_scorer' | 'best_player' | 'best_gk' | 'top_assist' | 'most_motm'
  player_id: string
  team_id: string
  season: string
  value: number
  created_at: string
}

export interface LeagueWithTeams extends League {
  teams?: TeamWithPlayers[]
}

export interface TeamWithPlayers extends Team {
  players?: Player[]
}

export interface MatchWithTeams extends Match {
  home_team?: Team
  away_team?: Team
  events?: MatchEvent[]
}
