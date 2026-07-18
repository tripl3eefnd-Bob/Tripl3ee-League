import React, { useMemo, useState, useEffect } from 'react'
import { Search, Award, Swords, Shield, Zap } from 'lucide-react'
import { useT } from '../i18n'
import { getEventsByLeague, getPlayerRatings, getPlayersByLeague } from '../lib/db'
import { calculatePlayerStats } from '../lib/utils'
import type { League, Team, MatchWithTeams, Player } from '../types'

interface Props {
  league: League
  teams: Team[]
  matches: MatchWithTeams[]
}

export default function StatsTab({ league, teams, matches }: Props) {
  const { t } = useT()
  const [allPlayers, setAllPlayers] = useState<(Player & { team_id: string })[]>([])
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [league.id])

  async function loadData() {
    const [playerData, eventData] = await Promise.all([
      getPlayersByLeague(league.id),
      getEventsByLeague(league.id),
    ])
    if (playerData) setAllPlayers(playerData.map(p => ({ ...p, team_id: (p as any).teams.league_id })))
    if (eventData) setEvents(eventData.map(e => ({ ...e, team_id: (e as any).matches.league_id })))
  }

  const stats = useMemo(() => calculatePlayerStats(events), [events])
  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])
  const playerMap = useMemo(() => new Map(allPlayers.map(p => [p.id, p])), [allPlayers])

  const topScorers = useMemo(() => {
    return Array.from(stats.goals.entries())
      .map(([playerId, total]) => ({ playerId, total, player: playerMap.get(playerId) }))
      .filter(x => x.player)
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)
  }, [stats, playerMap])

  const topAssists = useMemo(() => {
    return Array.from(stats.assists.entries())
      .map(([playerId, total]) => ({ playerId, total, player: playerMap.get(playerId) }))
      .filter(x => x.player)
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)
  }, [stats, playerMap])

  const topCards = useMemo(() => {
    const combined = new Map<string, { yellow: number; red: number }>()
    for (const [id, count] of stats.yellowCards) {
      if (!combined.has(id)) combined.set(id, { yellow: 0, red: 0 })
      combined.get(id)!.yellow = count
    }
    for (const [id, count] of stats.redCards) {
      if (!combined.has(id)) combined.set(id, { yellow: 0, red: 0 })
      combined.get(id)!.red = count
    }
    return Array.from(combined.entries())
      .map(([playerId, cards]) => ({ playerId, ...cards, player: playerMap.get(playerId) }))
      .filter(x => x.player)
      .sort((a, b) => (b.yellow + b.red * 3) - (a.yellow + a.red * 3))
      .slice(0, 20)
  }, [stats, playerMap])

  const topMotm = useMemo(() => {
    return Array.from(stats.motm.entries())
      .map(([playerId, total]) => ({ playerId, total, player: playerMap.get(playerId) }))
      .filter(x => x.player)
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)
  }, [stats, playerMap])

  const filteredPlayers = allPlayers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder={t.stats.search_player}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
        />
      </div>

      {search ? (
        /* Player search results */
        <div className="space-y-2">
          {filteredPlayers.map(p => (
            <div key={p.id} className="p-3 rounded-xl bg-slate-800 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{p.name}</span>
                  <span className="text-slate-500 text-sm ml-2">
                    {teamMap.get(p.team_id)?.name || '-'} · #{p.number} · {p.position}
                  </span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-emerald-400">G: {stats.goals.get(p.id) || 0}</span>
                  <span className="text-blue-400">A: {stats.assists.get(p.id) || 0}</span>
                  <span className="text-yellow-400">YK: {stats.yellowCards.get(p.id) || 0}</span>
                  <span className="text-red-400">MK: {stats.redCards.get(p.id) || 0}</span>
                  <span className="text-purple-400">MOTM: {stats.motm.get(p.id) || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Stats tables */
        <div className="space-y-8">
          {/* Top Scorers */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              {t.stats.top_scorer}
            </h3>
            <div className="space-y-1">
              {topScorers.map((item, i) => (
                <div key={item.playerId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono w-6">{i + 1}</span>
                    <span className="text-white">{item.player?.name}</span>
                    <span className="text-xs text-slate-500">{teamMap.get(item.player?.team_id || '')?.short_name}</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{item.total}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Top Assists */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              {t.stats.top_assist}
            </h3>
            <div className="space-y-1">
              {topAssists.map((item, i) => (
                <div key={item.playerId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono w-6">{i + 1}</span>
                    <span className="text-white">{item.player?.name}</span>
                    <span className="text-xs text-slate-500">{teamMap.get(item.player?.team_id || '')?.short_name}</span>
                  </div>
                  <span className="text-blue-400 font-bold">{item.total}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Most Cards */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              {t.stats.most_cards}
            </h3>
            <div className="space-y-1">
              {topCards.map((item, i) => (
                <div key={item.playerId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono w-6">{i + 1}</span>
                    <span className="text-white">{item.player?.name}</span>
                    <span className="text-xs text-slate-500">{teamMap.get(item.player?.team_id || '')?.short_name}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-yellow-400">{item.yellow} YK</span>
                    <span className="text-red-400">{item.red} MK</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Most MOTM */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Swords className="w-5 h-5 text-purple-400" />
              {t.stats.most_motm}
            </h3>
            <div className="space-y-1">
              {topMotm.map((item, i) => (
                <div key={item.playerId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono w-6">{i + 1}</span>
                    <span className="text-white">{item.player?.name}</span>
                    <span className="text-xs text-slate-500">{teamMap.get(item.player?.team_id || '')?.short_name}</span>
                  </div>
                  <span className="text-purple-400 font-bold">{item.total}x</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
