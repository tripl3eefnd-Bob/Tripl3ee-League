import React, { useState, useMemo } from 'react'
import { Play, SkipForward, Check, Plus, X, RefreshCw } from 'lucide-react'
import { useT } from '../i18n'
import { updateMatch, createMatchEvent, deleteMatchEvent, getMatchEvents, createMatches, deleteMatch } from '../lib/db'
import { generateRoundRobin } from '../lib/utils'
import type { League, Team, MatchWithTeams, MatchEvent, EventType } from '../types'

interface Props {
  league: League
  teams: Team[]
  matches: MatchWithTeams[]
  onMatchesChange: (m: MatchWithTeams[]) => void
}

export default function FixturesTab({ league, teams, matches, onMatchesChange }: Props) {
  const { t } = useT()
  const [filterTeam, setFilterTeam] = useState<string>('')
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultForm, setResultForm] = useState({ home_score: 0, away_score: 0 })
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])

  const filteredMatches = useMemo(() => {
    if (!filterTeam) return matches
    return matches.filter(m => m.home_team_id === filterTeam || m.away_team_id === filterTeam)
  }, [matches, filterTeam])

  const matchweeks = useMemo(() => {
    const mws = new Set(filteredMatches.map(m => m.matchweek))
    return Array.from(mws).sort((a, b) => a - b)
  }, [filteredMatches])

  async function handleGenerateFixtures() {
    if (teams.length < 2) return
    setGenerating(true)
    const fixtures = generateRoundRobin(teams, league.format === 'double')
    const matchData = fixtures.map(f => ({
      league_id: league.id,
      matchweek: f.matchweek,
      home_team_id: f.home_team_id,
      away_team_id: f.away_team_id,
      status: 'scheduled' as const,
      is_knockout: false,
      extra_time: false,
      penalties: false,
    }))
    const created = await createMatches(matchData)
    if (created) {
      const withTeams = created.map(m => ({
        ...m,
        home_team: teamMap.get(m.home_team_id),
        away_team: teamMap.get(m.away_team_id),
      }))
      onMatchesChange([...matches, ...withTeams])
    }
    setGenerating(false)
  }

  async function handleRegenerate() {
    if (!confirm('Generate ulang akan menghapus semua jadwal dan hasil. Lanjutkan?')) return
    for (const m of matches) {
      await deleteMatch(m.id)
    }
    onMatchesChange([])
    await handleGenerateFixtures()
  }

  async function handleStatusChange(match: MatchWithTeams, status: 'played' | 'skipped') {
    const updates: any = { status }
    if (status === 'skipped') {
      updates.home_score = null
      updates.away_score = null
    }
    const updated = await updateMatch(match.id, updates)
    if (updated) {
      onMatchesChange(matches.map(m => m.id === match.id ? { ...m, ...updated } : m))
    }
  }

  async function openResultModal(match: MatchWithTeams) {
    setSelectedMatchId(match.id)
    setResultForm({
      home_score: match.home_score ?? 0,
      away_score: match.away_score ?? 0,
    })
    const evts = await getMatchEvents(match.id)
    setEvents(evts || [])
    setShowResultModal(true)
  }

  async function saveResult() {
    if (!selectedMatchId) return
    const updated = await updateMatch(selectedMatchId, {
      home_score: resultForm.home_score,
      away_score: resultForm.away_score,
      status: 'played',
      played_at: new Date().toISOString(),
    })
    if (updated) {
      onMatchesChange(matches.map(m => m.id === selectedMatchId ? { ...m, ...updated } : m))
    }
    setShowResultModal(false)
    setSelectedMatchId(null)
  }

  async function addEvent(type: EventType, playerId?: string, minute?: number) {
    if (!selectedMatchId || !playerId || minute == null) return
    const match = matches.find(m => m.id === selectedMatchId)
    if (!match) return
    const teamId = match.home_team_id || match.away_team_id
    if (!teamId) return
    const evt = await createMatchEvent({
      match_id: selectedMatchId,
      type,
      player_id: playerId,
      team_id: teamId,
      minute,
    })
    if (evt) setEvents(prev => [...prev, evt])
  }

  async function removeEvent(eventId: string) {
    await deleteMatchEvent(eventId)
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  return (
    <div>
      {/* Generate / Regenerate */}
      {matches.length === 0 && teams.length >= 2 ? (
        <div className="text-center py-16">
          <RefreshCw className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">{teams.length} tim tersedia</p>
          <p className="text-slate-500 text-sm mb-6">
            Jadwal {league.format === 'double' ? t.league.double : t.league.single} ({teams.length - 1} pekan{league.format === 'double' ? `, ${(teams.length - 1) * 2} total` : ''})
          </p>
          <button
            onClick={handleGenerateFixtures}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? t.common.loading : t.common.generate}
          </button>
        </div>
      ) : matches.length > 0 && (
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-1 block">{t.match.filter_by_team}</label>
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              className="w-full max-w-xs px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
            >
              <option value="">Semua Tim</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 text-xs text-slate-400 hover:text-white"
            title="Regenerate all fixtures"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </button>
        </div>
      )}

      {/* Matchweeks */}
      {matches.length > 0 && matchweeks.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{t.common.no_data}</div>
      ) : (
        matchweeks.map(mw => {
          const weekMatches = filteredMatches.filter(m => m.matchweek === mw)
          return (
            <div key={mw} className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-400 rounded-full" />
                {t.match.matchweek} {mw}
                <span className="text-xs text-slate-500 font-normal">
                  ({weekMatches.filter(m => m.status === 'played').length}/{weekMatches.length})
                </span>
              </h3>
              <div className="space-y-2">
                {weekMatches.map(match => {
                  const home = teamMap.get(match.home_team_id)
                  const away = teamMap.get(match.away_team_id)
                  return (
                    <div
                      key={match.id}
                      className={`p-4 rounded-xl border transition-all ${
                        match.status === 'played'
                          ? 'bg-slate-800 border-emerald-700/50'
                          : match.status === 'skipped'
                          ? 'bg-slate-800/50 border-slate-700/30 opacity-60'
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: home?.color || '#666' }} />
                          <span className="font-medium text-white text-sm lg:text-base">{home?.short_name || home?.name}</span>
                        </div>

                        {match.status === 'played' && match.home_score != null ? (
                          <div className="flex items-center gap-3 px-4">
                            <span className="text-xl font-bold text-white">{match.home_score}</span>
                            <span className="text-slate-500">-</span>
                            <span className="text-xl font-bold text-white">{match.away_score}</span>
                          </div>
                        ) : match.status === 'skipped' ? (
                          <div className="px-4 text-slate-500 text-sm italic">{t.match.skipped}</div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openResultModal(match)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500"
                            >
                              <Play className="w-3 h-3" />
                              {t.match.input_result}
                            </button>
                            <button
                              onClick={() => handleStatusChange(match, 'skipped')}
                              className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:text-white"
                              title={t.match.skipped}
                            >
                              <SkipForward className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex-1 flex items-center justify-end gap-3">
                          <span className="font-medium text-white text-sm lg:text-base text-right">{away?.short_name || away?.name}</span>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: away?.color || '#666' }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* Result Modal */}
      {showResultModal && selectedMatchId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center">
          <div className="w-full lg:max-w-lg bg-slate-800 rounded-t-2xl lg:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{t.match.input_result}</h3>
              <button onClick={() => setShowResultModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <input
                type="number"
                min="0"
                value={resultForm.home_score}
                onChange={e => setResultForm(prev => ({ ...prev, home_score: parseInt(e.target.value) || 0 }))}
                className="w-20 h-16 text-center text-2xl font-bold rounded-xl bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
              />
              <span className="text-2xl text-slate-500">-</span>
              <input
                type="number"
                min="0"
                value={resultForm.away_score}
                onChange={e => setResultForm(prev => ({ ...prev, away_score: parseInt(e.target.value) || 0 }))}
                className="w-20 h-16 text-center text-2xl font-bold rounded-xl bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              onClick={saveResult}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
            >
              <Check className="w-5 h-5 inline mr-2" />
              {t.common.save}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
