import React, { useMemo } from 'react'
import { Swords } from 'lucide-react'
import { useT } from '../i18n'
import type { League, Team, MatchWithTeams } from '../types'

interface Props {
  league: League
  teams: Team[]
  matches: MatchWithTeams[]
}

type KnockoutRound = 'quarter' | 'semi' | 'final'

export default function KnockoutTab({ league, teams, matches }: Props) {
  const { t } = useT()

  const knockoutMatches = useMemo(() => {
    return matches.filter(m => m.is_knockout)
  }, [matches])

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])

  const rounds: { key: KnockoutRound; label: string }[] = [
    { key: 'quarter', label: t.knockout.quarter },
    { key: 'semi', label: t.knockout.semi },
    { key: 'final', label: t.knockout.final },
  ]

  if (knockoutMatches.length === 0) {
    return (
      <div className="text-center py-12">
        <Swords className="w-16 h-16 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-400">{t.common.no_data}</p>
        <p className="text-xs text-slate-500 mt-2">Mode knockout akan tersedia setelah fase grup selesai</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {rounds.map(round => {
        const roundMatches = knockoutMatches.filter(m => m.knockout_round === round.key)
        if (roundMatches.length === 0) return null

        return (
          <section key={round.key}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Swords className="w-5 h-5 text-emerald-400" />
              {round.label}
            </h3>

            {/* Bracket */}
            <div className="grid gap-4 lg:grid-cols-2">
              {roundMatches.map(match => {
                const home = teamMap.get(match.home_team_id)
                const away = teamMap.get(match.away_team_id)
                const isPlayed = match.status === 'played'
                const winner = isPlayed && match.home_score != null && match.away_score != null
                  ? (match.home_score > match.away_score ? home : match.away_score > match.home_score ? away : null)
                  : null

                return (
                  <div key={match.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: home?.color || '#666' }} />
                        <span className={`text-sm font-medium ${isPlayed && match.home_score && match.away_score && match.home_score > match.away_score ? 'text-emerald-400' : 'text-white'}`}>
                          {home?.short_name || 'TBD'}
                        </span>
                      </div>
                      {isPlayed ? (
                        <div className="flex items-center gap-2 px-3">
                          <span className="font-bold text-white">{match.home_score}</span>
                          <span className="text-slate-500">-</span>
                          <span className="font-bold text-white">{match.away_score}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">vs</span>
                      )}
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className={`text-sm font-medium ${isPlayed && match.home_score && match.away_score && match.away_score > match.home_score ? 'text-emerald-400' : 'text-white'}`}>
                          {away?.short_name || 'TBD'}
                        </span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: away?.color || '#666' }} />
                      </div>
                    </div>
                    {winner && (
                      <p className="text-center text-xs text-emerald-500 font-medium">
                        ✓ {winner.name} {t.common.edit}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
