import React, { useState, useMemo } from 'react'
import { Play, X, RefreshCw, Check } from 'lucide-react'
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
    if (status === 'skipped') { updates.home_score = null; updates.away_score = null }
    const updated = await updateMatch(match.id, updates)
    if (updated) onMatchesChange(matches.map(m => m.id === match.id ? { ...m, ...updated } : m))
  }

  async function openResultModal(match: MatchWithTeams) {
    setSelectedMatchId(match.id)
    setResultForm({ home_score: match.home_score ?? 0, away_score: match.away_score ?? 0 })
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
    if (updated) onMatchesChange(matches.map(m => m.id === selectedMatchId ? { ...m, ...updated } : m))
    setShowResultModal(false)
    setSelectedMatchId(null)
  }

  if (matches.length === 0 && teams.length >= 2) {
    return (
      <div className="text-center py-16">
        <RefreshCw className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-sm mb-2">{teams.length} tim · {league.format === 'double' ? t.league.double : t.league.single}</p>
        <button
          onClick={handleGenerateFixtures}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? t.common.loading : 'Generate Jadwal'}
        </button>
      </div>
    )
  }

  // === FLASHSCORE-STYLE MATCH CARDS ===
  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {['Semua', ...teams.map(t => t.short_name)].slice(0, 7).map(label => (
            <button
              key={label}
              onClick={() => setFilterTeam(label === 'Semua' ? '' : teams.find(t => t.short_name === label)?.id || '')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                (label === 'Semua' && !filterTeam) || teams.find(t => t.id === filterTeam)?.short_name === label
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={handleRegenerate} className="text-xs text-slate-500 hover:text-white">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Match list by matchweek */}
      {matchweeks.map(mw => {
        const weekMatches = filteredMatches.filter(m => m.matchweek === mw)
        return (
          <div key={mw} className="mb-6">
            {/* Matchweek header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pekan {mw}
              </span>
              <span className="text-[10px] text-slate-600">
                ({weekMatches.filter(m => m.status === 'played').length}/{weekMatches.length})
              </span>
            </div>

            {/* Match cards - Flashscore style */}
            <div className="space-y-1">
              {weekMatches.map(match => {
                const home = teamMap.get(match.home_team_id)
                const away = teamMap.get(match.away_team_id)
                const isPlayed = match.status === 'played'
                const isSkipped = match.status === 'skipped'

                return (
                  <div
                    key={match.id}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isPlayed
                        ? 'bg-[#1a1f33] border-l-2 border-emerald-600'
                        : isSkipped
                        ? 'bg-[#1a1f33]/50 border-l-2 border-slate-600'
                        : 'bg-[#1a1f33] hover:bg-[#222840] border-l-2 border-transparent hover:border-emerald-600/50'
                    }`}
                  >
                    {/* Home team */}
                    <div className="flex-1 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: home?.color || '#666' }} />
                      <span className={`text-sm font-medium ${isPlayed ? 'text-white' : 'text-slate-300'}`}>
                        {home?.short_name || home?.name}
                      </span>
                    </div>

                    {/* Score / Status */}
                    <div className="flex items-center gap-3">
                      {isPlayed ? (
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg font-bold text-white tabular-nums">{match.home_score}</span>
                          <span className="text-xs text-slate-600">:</span>
                          <span className="text-lg font-bold text-white tabular-nums">{match.away_score}</span>
                        </div>
                      ) : isSkipped ? (
                        <span className="text-[10px] uppercase text-slate-600 tracking-wider font-medium">Skip</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openResultModal(match)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/20 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-600/30"
                          >
                            <Play className="w-3 h-3" />
                            Skor
                          </button>
                          <button
                            onClick={() => handleStatusChange(match, 'skipped')}
                            className="px-2 py-1 rounded-md text-[11px] text-slate-500 hover:text-white"
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Away team */}
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <span className={`text-sm font-medium ${isPlayed ? 'text-white' : 'text-slate-300'}`}>
                        {away?.short_name || away?.name}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: away?.color || '#666' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Result Modal */}
      {showResultModal && selectedMatchId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="w-[320px] bg-[#1a1f33] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">Input Skor</h3>
              <button onClick={() => setShowResultModal(false)} className="p-1 text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 mb-5">
              <input type="number" min="0" value={resultForm.home_score}
                onChange={e => setResultForm(p => ({ ...p, home_score: parseInt(e.target.value) || 0 }))}
                className="w-16 h-14 text-center text-xl font-bold rounded-lg bg-[#0f1322] border border-[#2a2f45] text-white focus:border-emerald-500 outline-none" />
              <span className="text-lg text-slate-600">:</span>
              <input type="number" min="0" value={resultForm.away_score}
                onChange={e => setResultForm(p => ({ ...p, away_score: parseInt(e.target.value) || 0 }))}
                className="w-16 h-14 text-center text-xl font-bold rounded-lg bg-[#0f1322] border border-[#2a2f45] text-white focus:border-emerald-500 outline-none" />
            </div>
            <button onClick={saveResult}
              className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500">
              <Check className="w-4 h-4 inline mr-1.5" />Simpan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
