import type { Standing, Team, Match } from '../types'

export function generateRoundRobin(teams: Team[], double: boolean): { home_team_id: string; away_team_id: string; matchweek: number }[] {
  const ids = teams.map(t => t.id)
  const n = ids.length
  const fixtures: { home_team_id: string; away_team_id: string; matchweek: number }[] = []

  if (n < 2) return []

  const isOdd = n % 2 !== 0
  const clubs = isOdd ? [...ids, 'BYE'] : [...ids]
  const totalRounds = clubs.length - 1
  const matchesPerRound = Math.floor(clubs.length / 2)

  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = clubs[match]
      const away = clubs[clubs.length - 1 - match]
      if (home !== 'BYE' && away !== 'BYE') {
        if (round % 2 === 0) {
          fixtures.push({ home_team_id: home, away_team_id: away, matchweek: round + 1 })
        } else {
          fixtures.push({ home_team_id: away, away_team_id: home, matchweek: round + 1 })
        }
      }
    }
    clubs.splice(1, 0, clubs.pop()!)
  }

  if (double) {
    const secondLeg = fixtures.map(f => ({
      home_team_id: f.away_team_id,
      away_team_id: f.home_team_id,
      matchweek: f.matchweek + totalRounds,
    }))
    fixtures.push(...secondLeg)
  }

  return fixtures
}

export function calculateStandings(matches: Match[], teams: Team[], tiebreakers: string[]): Standing[] {
  const map = new Map<string, Standing>()

  for (const t of teams) {
    map.set(t.id, {
      team_id: t.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
      form: [],
    })
  }

  for (const m of matches) {
    if (m.status !== 'played' || m.home_score == null || m.away_score == null) continue
    const h = map.get(m.home_team_id)
    const a = map.get(m.away_team_id)
    if (!h || !a) continue

    h.played++
    a.played++
    h.goals_for += m.home_score
    h.goals_against += m.away_score
    a.goals_for += m.away_score
    a.goals_against += m.home_score

    if (m.home_score > m.away_score) {
      h.won++; a.lost++
      h.form.push('W'); a.form.push('L')
    } else if (m.home_score < m.away_score) {
      a.won++; h.lost++
      a.form.push('W'); h.form.push('L')
    } else {
      h.drawn++; a.drawn++
      h.form.push('D'); a.form.push('D')
    }
  }

  for (const s of map.values()) {
    s.goal_difference = s.goals_for - s.goals_against
    s.points = s.won * 3 + s.drawn * 1
    s.form = s.form.slice(-5)
  }

  const standings = Array.from(map.values())

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    for (const tb of tiebreakers) {
      if (tb === 'gd') {
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
      } else if (tb === 'gf') {
        if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for
      } else if (tb === 'h2h') {
        const h2h = getHeadToHead(matches, a.team_id, b.team_id)
        if (h2h !== 0) return h2h
      }
    }
    return 0
  })

  return standings
}

function getHeadToHead(matches: Match[], teamA: string, teamB: string): number {
  let ptsA = 0, ptsB = 0
  for (const m of matches) {
    if (m.status !== 'played' || m.home_score == null || m.away_score == null) continue
    const isAHome = m.home_team_id === teamA && m.away_team_id === teamB
    const isBHome = m.home_team_id === teamB && m.away_team_id === teamA
    if (!isAHome && !isBHome) continue
    if (isAHome) {
      if (m.home_score > m.away_score) ptsA += 3
      else if (m.home_score < m.away_score) ptsB += 3
      else { ptsA += 1; ptsB += 1 }
    } else {
      if (m.home_score > m.away_score) ptsB += 3
      else if (m.home_score < m.away_score) ptsA += 3
      else { ptsA += 1; ptsB += 1 }
    }
  }
  if (ptsA !== ptsB) return ptsB - ptsA
  return 0
}

export function calculatePlayerStats(events: { type: string; player_id: string; team_id: string }[]) {
  const goals = new Map<string, number>()
  const assists = new Map<string, number>()
  const yellowCards = new Map<string, number>()
  const redCards = new Map<string, number>()
  const motm = new Map<string, number>()

  for (const e of events) {
    switch (e.type) {
      case 'goal':
      case 'own_goal':
      case 'penalty_goal':
        goals.set(e.player_id, (goals.get(e.player_id) || 0) + 1)
        break
      case 'assist':
        assists.set(e.player_id, (assists.get(e.player_id) || 0) + 1)
        break
      case 'yellow_card':
        yellowCards.set(e.player_id, (yellowCards.get(e.player_id) || 0) + 1)
        break
      case 'red_card':
        redCards.set(e.player_id, (redCards.get(e.player_id) || 0) + 1)
        break
      case 'motm':
        motm.set(e.player_id, (motm.get(e.player_id) || 0) + 1)
        break
    }
  }

  return { goals, assists, yellowCards, redCards, motm }
}

export function generateGroups(teamIds: string[], numGroups: number): string[][] {
  const groups: string[][] = Array.from({ length: numGroups }, () => [])
  teamIds.forEach((id, i) => groups[i % numGroups].push(id))
  return groups
}

export function generateKnockoutBracket(teamIds: string[]): { round: number; position: number }[] {
  const n = teamIds.length
  const positions: { round: number; position: number }[] = []
  let round = 1
  let count = n
  while (count > 1) {
    for (let i = 0; i < count; i++) {
      positions.push({ round, position: i + 1 })
    }
    count = Math.ceil(count / 2)
    round++
  }
  return positions
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
