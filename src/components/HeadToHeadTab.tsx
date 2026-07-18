import React, { useState, useMemo } from 'react'
import { Swords } from 'lucide-react'
import { useT } from '../i18n'
import type { League, Team, MatchWithTeams } from '../types'

interface Props {
  league: League
  teams: Team[]
  matches: MatchWithTeams[]
}

export default function HeadToHeadTab({ league, teams, matches }: Props) {
  const { t } = useT()
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')

  const teamList = useMemo(() => teams.filter(t => t.id !== teamA), [teams, teamA])

  const h2hMatches = useMemo(() => {
    if (!teamA || !teamB) return []
    return matches.filter(m => {
      const involvesBoth = (m.home_team_id === teamA && m.away_team_id === teamB) || (m.home_team_id === teamB && m.away_team_id === teamA)
      return involvesBoth && (m.status === 'played' || m.status === 'skipped')
    }).sort((a, b) => a.matchweek - b.matchweek)
  }, [matches, teamA, teamB])

  const h2hStats = useMemo(() => {
    if (h2hMatches.length === 0) return null
    let wonA = 0, wonB = 0, drawn = 0, goalsA = 0, goalsB = 0
    for (const m of h2hMatches) {
      if (m.status !== 'played' || m.home_score == null || m.away_score == null) continue
      const aIsHome = m.home_team_id === teamA
      const aScore = aIsHome ? m.home_score : m.away_score
      const bScore = aIsHome ? m.away_score : m.home_score
      goalsA += aScore; goalsB += bScore
      if (aScore > bScore) wonA++; else if (bScore > aScore) wonB++; else drawn++
    }
    return { wonA, wonB, drawn, goalsA, goalsB, total: h2hMatches.filter(m => m.status === 'played').length }
  }, [h2hMatches, teamA, teamB])

  const teamAMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])
  const teamObjA = teamAMap.get(teamA); const teamObjB = teamAMap.get(teamB)

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Swords className="w-5 h-5 text-yellow-400" />Head to Head</h2>

      <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
        <div className="flex-1 w-full">
          <label className="block text-xs text-slate-500 mb-1">Tim A</label>
          <select value={teamA} onChange={e => { setTeamA(e.target.value); if (e.target.value === teamB) setTeamB('') }}
            className="w-full px-4 py-3 rounded-lg bg-[#111118] border border-[#1e1e2a] text-white focus:border-yellow-500 outline-none">
            <option value="">Pilih Tim</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#1e1e2a] flex items-center justify-center"><Swords className="w-5 h-5 text-slate-400" /></div>
        <div className="flex-1 w-full">
          <label className="block text-xs text-slate-500 mb-1">Tim B</label>
          <select value={teamB} onChange={e => setTeamB(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#111118] border border-[#1e1e2a] text-white focus:border-yellow-500 outline-none">
            <option value="">Pilih Tim</option>
            {teamList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {!teamA || !teamB ? (
        <div className="text-center py-16 text-slate-500"><Swords className="w-16 h-16 mx-auto mb-4 text-slate-700" /><p>Pilih dua tim untuk head to head</p></div>
      ) : (
        <div>
          {h2hStats && h2hStats.total > 0 ? (
            <div className="p-6 rounded-lg bg-[#111118] border border-[#1e1e2a] mb-6">
              <p className="text-center text-slate-400 text-sm mb-6">{h2hStats.total} pertemuan</p>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-2" style={{ backgroundColor: teamObjA?.color || '#666' }} />
                  <p className="font-semibold text-white">{teamObjA?.short_name || teamObjA?.name}</p>
                  <p className="text-3xl font-bold text-white mt-2">{h2hStats.goalsA}</p>
                  <p className="text-xs text-slate-400">Gol</p>
                  <p className="text-lg font-bold text-yellow-400 mt-1">{h2hStats.wonA}W</p>
                </div>
                <div className="px-6 text-center">
                  <p className="text-2xl font-bold text-slate-400">VS</p>
                  <p className="text-slate-500 text-sm mt-2">{h2hStats.wonA} - {h2hStats.drawn} - {h2hStats.wonB}</p>
                  <p className="text-xs text-slate-500">M - S - K</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-2" style={{ backgroundColor: teamObjB?.color || '#666' }} />
                  <p className="font-semibold text-white">{teamObjB?.short_name || teamObjB?.name}</p>
                  <p className="text-3xl font-bold text-white mt-2">{h2hStats.goalsB}</p>
                  <p className="text-xs text-slate-400">Gol</p>
                  <p className="text-lg font-bold text-yellow-400 mt-1">{h2hStats.wonB}W</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-[#111118] border border-[#1e1e2a] mb-6 text-center"><p className="text-slate-400">Belum ada pertemuan</p></div>
          )}

          <h3 className="font-semibold text-white mb-3">Riwayat Pertemuan</h3>
          {h2hMatches.length === 0 ? <p className="text-slate-500 text-sm">Belum ada pertandingan</p>
            : <div className="space-y-2">
              {h2hMatches.map(m => {
                const home = teamAMap.get(m.home_team_id); const away = teamAMap.get(m.away_team_id)
                const isPlayed = m.status === 'played'; const isSkipped = m.status === 'skipped'
                return (
                  <div key={m.id} className="flex items-center justify-between p-4 rounded-lg bg-[#111118]/50 border border-[#1e1e2a]/50">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: home?.color || '#666' }} />
                      <span className={`text-sm font-medium ${isPlayed && m.home_score != null && m.away_score != null && m.home_score > m.away_score ? 'text-yellow-400' : 'text-white'}`}>{home?.short_name || home?.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">Pekan {m.matchweek}</span>
                      {isPlayed ? <span className="text-lg font-bold text-white">{m.home_score} - {m.away_score}</span>
                        : isSkipped ? <span className="text-sm italic text-slate-500">Skip</span> : <span className="text-sm text-slate-500">vs</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className={`text-sm font-medium ${isPlayed && m.away_score != null && m.home_score != null && m.away_score > m.home_score ? 'text-yellow-400' : 'text-white'}`}>{away?.short_name || away?.name}</span>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: away?.color || '#666' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          }
        </div>
      )}
    </div>
  )
}
