import React, { useMemo } from 'react'
import { useT } from '../i18n'
import { calculateStandings } from '../lib/utils'
import type { League, Team, MatchWithTeams } from '../types'

interface Props {
  league: League
  teams: Team[]
  matches: MatchWithTeams[]
}

export default function StandingsTab({ league, teams, matches }: Props) {
  const { t } = useT()

  const standings = useMemo(() => {
    return calculateStandings(matches, teams, league.tiebreaker)
  }, [matches, teams, league.tiebreaker])

  if (standings.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>{t.common.no_data}</p>
        <p className="text-xs mt-2">Tambahkan tim dan mulai pertandingan untuk melihat klasemen</p>
      </div>
    )
  }

  const teamMap = new Map(teams.map(t => [t.id, t]))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
            <th className="p-3 text-left">{t.standing.pos}</th>
            <th className="p-3 text-left">{t.standing.team}</th>
            <th className="p-3 text-center">{t.standing.mp}</th>
            <th className="p-3 text-center">{t.standing.w}</th>
            <th className="p-3 text-center">{t.standing.d}</th>
            <th className="p-3 text-center">{t.standing.l}</th>
            <th className="p-3 text-center">{t.standing.gf}</th>
            <th className="p-3 text-center">{t.standing.ga}</th>
            <th className="p-3 text-center">{t.standing.gd}</th>
            <th className="p-3 text-center font-bold">{t.standing.pts}</th>
            <th className="p-3 text-center">{t.standing.form}</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const team = teamMap.get(s.team_id)
            if (!team) return null
            const bgClass = i < 4 ? 'bg-emerald-600/5' : i % 2 === 0 ? 'bg-slate-800/50' : ''
            return (
              <tr key={s.team_id} className={`${bgClass} border-b border-slate-800 hover:bg-slate-700/30`}>
                <td className="p-3 font-mono text-slate-400">{i + 1}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color || '#666' }} />
                    <span className="font-medium text-white">{team.short_name || team.name}</span>
                  </div>
                </td>
                <td className="p-3 text-center text-slate-300">{s.played}</td>
                <td className="p-3 text-center text-emerald-400">{s.won}</td>
                <td className="p-3 text-center text-yellow-400">{s.drawn}</td>
                <td className="p-3 text-center text-red-400">{s.lost}</td>
                <td className="p-3 text-center text-slate-300">{s.goals_for}</td>
                <td className="p-3 text-center text-slate-300">{s.goals_against}</td>
                <td className={`p-3 text-center font-mono ${
                  s.goal_difference > 0 ? 'text-emerald-400' : s.goal_difference < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
                </td>
                <td className="p-3 text-center font-bold text-white text-base">{s.points}</td>
                <td className="p-3 text-center">
                  <div className="flex gap-0.5 justify-center">
                    {s.form.map((r, j) => (
                      <span
                        key={j}
                        className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded ${
                          r === 'W' ? 'bg-emerald-600/30 text-emerald-400'
                            : r === 'D' ? 'bg-yellow-600/30 text-yellow-400'
                            : 'bg-red-600/30 text-red-400'
                        }`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
