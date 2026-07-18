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

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])

  if (standings.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-sm">Belum ada data klasemen</p>
        <p className="text-xs text-slate-600 mt-1">Tambahkan tim dan mulai pertandingan</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-3 lg:-mx-6">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-[#2a2f45]">
            <th className="p-3 text-left text-[10px] uppercase text-slate-500 font-semibold w-8">#</th>
            <th className="p-3 text-left text-[10px] uppercase text-slate-500 font-semibold">{t.standing.team}</th>
            <th className="p-3 text-center text-[10px] uppercase text-slate-500 font-semibold w-8">{t.standing.mp}</th>
            <th className="p-3 text-center text-[10px] uppercase text-slate-500 font-semibold w-8">{t.standing.w}</th>
            <th className="p-3 text-center text-[10px] uppercase text-slate-500 font-semibold w-8">{t.standing.d}</th>
            <th className="p-3 text-center text-[10px] uppercase text-slate-500 font-semibold w-8">{t.standing.l}</th>
            <th className="p-3 text-center text-[10px] uppercase text-slate-500 font-semibold w-10">{t.standing.gf}</th>
            <th className="p-3 text-center text-[10px] uppercase text-slate-500 font-semibold w-10">{t.standing.ga}</th>
            <th className="p-3 text-center text-[10px] uppercase text-slate-500 font-semibold w-10">{t.standing.gd}</th>
            <th className="p-3 text-center text-[10px] uppercase text-slate-500 font-semibold w-12">{t.standing.pts}</th>
            <th className="p-3 text-center text-[10px] uppercase text-slate-500 font-semibold">{t.standing.form}</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const team = teamMap.get(s.team_id)
            if (!team) return null
            return (
              <tr key={s.team_id} className="border-b border-[#1a1f33] hover:bg-[#1a1f33]/50 transition-colors">
                <td className="p-3">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold ${
                    i === 0 ? 'bg-emerald-600/20 text-emerald-400' :
                    i < 4 ? 'bg-emerald-600/10 text-emerald-400' :
                    'text-slate-500'
                  }`}>{i + 1}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: team.color || '#475569' }} />
                    <span className="font-medium text-white">{team.name}</span>
                  </div>
                </td>
                <td className="p-3 text-center text-slate-400">{s.played}</td>
                <td className="p-3 text-center text-emerald-400">{s.won}</td>
                <td className="p-3 text-center text-yellow-500">{s.drawn}</td>
                <td className="p-3 text-center text-red-400">{s.lost}</td>
                <td className="p-3 text-center text-slate-300">{s.goals_for}</td>
                <td className="p-3 text-center text-slate-300">{s.goals_against}</td>
                <td className={`p-3 text-center font-mono text-sm ${
                  s.goal_difference > 0 ? 'text-emerald-400' : s.goal_difference < 0 ? 'text-red-400' : 'text-slate-500'
                }`}>
                  {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
                </td>
                <td className="p-3 text-center font-bold text-white text-base">{s.points}</td>
                <td className="p-3">
                  <div className="flex gap-0.5 justify-center">
                    {s.form.map((r, j) => (
                      <span key={j} className={`w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-sm ${
                        r === 'W' ? 'bg-emerald-600/30 text-emerald-400' :
                        r === 'D' ? 'bg-yellow-600/30 text-yellow-400' :
                        'bg-red-600/30 text-red-400'
                      }`}>{r}</span>
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
