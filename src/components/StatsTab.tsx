import React, { useMemo, useState, useEffect } from 'react'
import { Search, Award, Swords, Shield, Zap, ChevronLeft, User, Goal, Eye, Ban } from 'lucide-react'
import { useT } from '../i18n'
import { getEventsByLeague, getPlayersByLeague } from '../lib/db'
import { calculatePlayerStats } from '../lib/utils'
import type { League, Team, MatchWithTeams, Player, MatchEvent } from '../types'

interface Props {
  league: League
  teams: Team[]
  matches: MatchWithTeams[]
}

export default function StatsTab({ league, teams, matches }: Props) {
  const { t } = useT()
  const [allPlayers, setAllPlayers] = useState<(Player & { team_id: string })[]>([])
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState<(MatchEvent & { team_id: string })[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [league.id])

  async function loadData() {
    const [playerData, eventData] = await Promise.all([
      getPlayersByLeague(league.id),
      getEventsByLeague(league.id),
    ])
    if (playerData) setAllPlayers(playerData.map(p => ({ ...p, team_id: (p as any).teams?.league_id || '' })))
    if (eventData) setEvents(eventData.map(e => ({ ...e, team_id: (e as any).matches?.league_id || '' })))
  }

  const stats = useMemo(() => calculatePlayerStats(events), [events])
  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])
  const playerMap = useMemo(() => new Map(allPlayers.map(p => [p.id, p])), [allPlayers])

  // Played matches per player (appearances)
  const appearances = useMemo(() => {
    const ap = new Map<string, number>()
    for (const m of matches) {
      if (m.status !== 'played') continue
      const teamPlayerIds = allPlayers.filter(p => p.team_id === m.home_team_id || p.team_id === m.away_team_id).map(p => p.id)
      for (const pid of teamPlayerIds) {
        ap.set(pid, (ap.get(pid) || 0) + 1)
      }
    }
    return ap
  }, [matches, allPlayers])

  // Clean sheets per goalkeeper
  const cleanSheets = useMemo(() => {
    const cs = new Map<string, number>()
    for (const m of matches) {
      if (m.status !== 'played' || m.home_score == null || m.away_score == null) continue
      const homeGks = allPlayers.filter(p => p.team_id === m.home_team_id && p.position === 'GK')
      const awayGks = allPlayers.filter(p => p.team_id === m.away_team_id && p.position === 'GK')
      if (m.away_score === 0) {
        for (const gk of homeGks) cs.set(gk.id, (cs.get(gk.id) || 0) + 1)
      }
      if (m.home_score === 0) {
        for (const gk of awayGks) cs.set(gk.id, (cs.get(gk.id) || 0) + 1)
      }
    }
    return cs
  }, [matches, allPlayers])

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

  const topCleanSheets = useMemo(() => {
    return Array.from(cleanSheets.entries())
      .map(([playerId, total]) => ({ playerId, total, player: playerMap.get(playerId) }))
      .filter(x => x.player)
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)
  }, [cleanSheets, playerMap])

  // Per-player detail
  const selectedPlayer = selectedPlayerId ? playerMap.get(selectedPlayerId) : null

  const playerMatchHistory = useMemo(() => {
    if (!selectedPlayerId) return []
    const teamId = allPlayers.find(p => p.id === selectedPlayerId)?.team_id
    if (!teamId) return []
    return matches
      .filter(m => m.status === 'played' && (m.home_team_id === teamId || m.away_team_id === teamId))
      .map(m => {
        const isHome = m.home_team_id === teamId
        const opponentId = isHome ? m.away_team_id : m.home_team_id
        const won = isHome ? (m.home_score ?? 0) > (m.away_score ?? 0) : (m.away_score ?? 0) > (m.home_score ?? 0)
        const drawn = (m.home_score ?? 0) === (m.away_score ?? 0)
        return {
          match: m,
          opponent: teamMap.get(opponentId),
          isHome,
          won,
          drawn,
          result: isHome ? `${m.home_score}-${m.away_score}` : `${m.away_score}-${m.home_score}`,
        }
      })
      .reverse()
      .slice(0, 10)
  }, [selectedPlayerId, matches, allPlayers, teamMap])

  const filteredPlayers = allPlayers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // Player detail view
  if (selectedPlayer && selectedPlayerId) {
    const team = teamMap.get(selectedPlayer.team_id)
    const pGoals = stats.goals.get(selectedPlayerId) || 0
    const pAssists = stats.assists.get(selectedPlayerId) || 0
    const pYellow = stats.yellowCards.get(selectedPlayerId) || 0
    const pRed = stats.redCards.get(selectedPlayerId) || 0
    const pMotm = stats.motm.get(selectedPlayerId) || 0
    const pApps = appearances.get(selectedPlayerId) || 0
    const pCS = cleanSheets.get(selectedPlayerId) || 0

    return (
      <div>
        <button
          onClick={() => setSelectedPlayerId(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke statistik
        </button>

        <div className="p-6 rounded-xl bg-slate-800 border border-slate-700 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{selectedPlayer.name}</h3>
              <p className="text-sm text-slate-400">
                #{selectedPlayer.number} · {selectedPlayer.position}
                {team && ` · ${team.name}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-700/50 text-center">
              <p className="text-2xl font-bold text-white">{pApps}</p>
              <p className="text-xs text-slate-400">Penampilan</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50 text-center">
              <p className="text-2xl font-bold text-emerald-400">{pGoals}</p>
              <p className="text-xs text-slate-400">Gol</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50 text-center">
              <p className="text-2xl font-bold text-blue-400">{pAssists}</p>
              <p className="text-xs text-slate-400">Assist</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50 text-center">
              <p className="text-2xl font-bold text-purple-400">{pMotm}</p>
              <p className="text-xs text-slate-400">MOTM</p>
            </div>
            {selectedPlayer.position === 'GK' && (
              <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                <p className="text-2xl font-bold text-emerald-400">{pCS}</p>
                <p className="text-xs text-slate-400">Clean Sheet</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-slate-700/50 text-center">
              <p className="text-2xl font-bold text-yellow-400">{pYellow}</p>
              <p className="text-xs text-slate-400">Kartu Kuning</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50 text-center">
              <p className="text-2xl font-bold text-red-400">{pRed}</p>
              <p className="text-xs text-slate-400">Kartu Merah</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/50 text-center">
              <p className="text-2xl font-bold text-slate-300">
                {pApps > 0 ? (pGoals / pApps).toFixed(2) : '0'}
              </p>
              <p className="text-xs text-slate-400">Gol/Penampilan</p>
            </div>
          </div>
        </div>

        {/* Match history */}
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Riwayat Pertandingan Terakhir</h4>
        <div className="space-y-2">
          {playerMatchHistory.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada pertandingan</p>
          ) : (
            playerMatchHistory.map(({ match, opponent, isHome, won, drawn, result }) => (
              <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${won ? 'bg-emerald-400' : drawn ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-slate-400">Pekan {match.matchweek}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isHome ? (
                    <><span className="text-sm text-white font-medium">{opponent?.short_name}</span><span className="text-sm text-slate-500">vs</span></>
                  ) : (
                    <><span className="text-sm text-slate-500">vs</span><span className="text-sm text-white font-medium">{opponent?.short_name}</span></>
                  )}
                </div>
                <span className={`text-sm font-bold ${won ? 'text-emerald-400' : drawn ? 'text-yellow-400' : 'text-red-400'}`}>
                  {result}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Main stats view
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
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              className="w-full text-left p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{p.name}</span>
                  <span className="text-slate-500 text-sm ml-2">
                    {teamMap.get(p.team_id)?.name || '-'} · #{p.number} · {p.position}
                  </span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-emerald-400">{stats.goals.get(p.id) || 0}G</span>
                  <span className="text-blue-400">{stats.assists.get(p.id) || 0}A</span>
                  <span className="text-yellow-400">{stats.yellowCards.get(p.id) || 0}YK</span>
                  <span className="text-red-400">{stats.redCards.get(p.id) || 0}MK</span>
                  <span className="text-purple-400">{stats.motm.get(p.id) || 0}MOTM</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Scorers */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Goal className="w-5 h-5 text-emerald-400" />
              {t.stats.top_scorer}
            </h3>
            <div className="space-y-1">
              {topScorers.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Belum ada gol</p>
              ) : (
                topScorers.map((item, i) => (
                  <button
                    key={item.playerId}
                    onClick={() => setSelectedPlayerId(item.playerId)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-emerald-600/30 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{i + 1}</span>
                      <span className="text-white">{item.player?.name}</span>
                      <span className="text-xs text-slate-500">{teamMap.get(item.player?.team_id || '')?.short_name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">{item.total}</span>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Top Assists */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              {t.stats.top_assist}
            </h3>
            <div className="space-y-1">
              {topAssists.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Belum ada assist</p>
              ) : (
                topAssists.map((item, i) => (
                  <button
                    key={item.playerId}
                    onClick={() => setSelectedPlayerId(item.playerId)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono w-6">{i + 1}</span>
                      <span className="text-white">{item.player?.name}</span>
                      <span className="text-xs text-slate-500">{teamMap.get(item.player?.team_id || '')?.short_name}</span>
                    </div>
                    <span className="text-blue-400 font-bold">{item.total}</span>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Most MOTM */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              {t.stats.most_motm}
            </h3>
            <div className="space-y-1">
              {topMotm.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Belum ada MOTM</p>
              ) : (
                topMotm.map((item, i) => (
                  <button
                    key={item.playerId}
                    onClick={() => setSelectedPlayerId(item.playerId)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono w-6">{i + 1}</span>
                      <span className="text-white">{item.player?.name}</span>
                      <span className="text-xs text-slate-500">{teamMap.get(item.player?.team_id || '')?.short_name}</span>
                    </div>
                    <span className="text-purple-400 font-bold">{item.total}x</span>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Most Cards */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              {t.stats.most_cards}
            </h3>
            <div className="space-y-1">
              {topCards.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Belum ada kartu</p>
              ) : (
                topCards.map((item, i) => (
                  <button
                    key={item.playerId}
                    onClick={() => setSelectedPlayerId(item.playerId)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono w-6">{i + 1}</span>
                      <span className="text-white">{item.player?.name}</span>
                      <span className="text-xs text-slate-500">{teamMap.get(item.player?.team_id || '')?.short_name}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-yellow-400">{item.yellow} YK</span>
                      <span className="text-red-400">{item.red} MK</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Clean Sheets */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              Clean Sheet (Kiper)
            </h3>
            <div className="space-y-1">
              {topCleanSheets.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Belum ada data</p>
              ) : (
                topCleanSheets.map((item, i) => (
                  <button
                    key={item.playerId}
                    onClick={() => setSelectedPlayerId(item.playerId)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono w-6">{i + 1}</span>
                      <span className="text-white">{item.player?.name}</span>
                      <span className="text-xs text-slate-500">{teamMap.get(item.player?.team_id || '')?.short_name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">{item.total} CS</span>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
