import React, { useState, useMemo, useEffect } from 'react'
import { Play, X, RefreshCw, Check, Plus, Trash2, Goal, Shield, Award, AlertTriangle } from 'lucide-react'
import { useT } from '../i18n'
import { updateMatch, createMatchEvent, createMatchEvents, deleteMatchEvent, deleteMatchEventsByMatch, getMatchEvents, createMatches, deleteMatch, getPlayers } from '../lib/db'
import { generateRoundRobin } from '../lib/utils'
import type { League, Team, MatchWithTeams, MatchEvent, EventType, Player } from '../types'

interface Props {
  league: League
  teams: Team[]
  matches: MatchWithTeams[]
  onMatchesChange: (m: MatchWithTeams[]) => void
}

export default function FixturesTab({ league, teams, matches, onMatchesChange }: Props) {
  const { t } = useT()
  const [filterTeam, setFilterTeam] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null)
  const [form, setForm] = useState({ home_score: 0, away_score: 0 })
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [eventForm, setEventForm] = useState({ type: 'goal' as EventType, player_id: '', assist_id: '', minute: 0, team_id: '' })
  const [saving, setSaving] = useState(false)

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams])

  const filteredMatches = useMemo(() => {
    if (!filterTeam) return matches
    return matches.filter(m => m.home_team_id === filterTeam || m.away_team_id === filterTeam)
  }, [matches, filterTeam])

  const matchweeks = useMemo(() => {
    const mws = new Set(filteredMatches.map(m => m.matchweek))
    return Array.from(mws).sort((a, b) => a - b)
  }, [filteredMatches])

  const homePlayers = useMemo(() =>
    players.filter(p => p.team_id === selectedMatch?.home_team_id), [players, selectedMatch])
  const awayPlayers = useMemo(() =>
    players.filter(p => p.team_id === selectedMatch?.away_team_id), [players, selectedMatch])
  const allMatchPlayers = useMemo(() =>
    players.filter(p => p.team_id === selectedMatch?.home_team_id || p.team_id === selectedMatch?.away_team_id),
    [players, selectedMatch])

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

  async function handleSkip(match: MatchWithTeams) {
    const updated = await updateMatch(match.id, { status: 'skipped', home_score: null, away_score: null })
    if (updated) onMatchesChange(matches.map(m => m.id === match.id ? { ...m, ...updated } : m))
  }

  async function openModal(match: MatchWithTeams) {
    setSelectedMatch(match)
    setForm({ home_score: match.home_score ?? 0, away_score: match.away_score ?? 0 })
    setShowAddEvent(false)
    setEventForm({ type: 'goal', player_id: '', assist_id: '', minute: 0, team_id: '' })

    const [evts, pls] = await Promise.all([
      getMatchEvents(match.id),
      getPlayers(match.home_team_id),
      getPlayers(match.away_team_id),
    ])
    const homeP = await getPlayers(match.home_team_id) || []
    const awayP = await getPlayers(match.away_team_id) || []
    setPlayers([...homeP, ...awayP])
    setEvents(evts || [])
    setShowModal(true)
  }

  async function saveScore() {
    if (!selectedMatch) return
    setSaving(true)
    const updated = await updateMatch(selectedMatch.id, {
      home_score: form.home_score,
      away_score: form.away_score,
      status: 'played',
      played_at: new Date().toISOString(),
    })
    if (updated) onMatchesChange(matches.map(m => m.id === selectedMatch.id ? { ...m, ...updated } : m))
    setSaving(false)
  }

  async function addEvent() {
    if (!selectedMatch || !eventForm.player_id) return
    const evt: Omit<MatchEvent, 'id'> = {
      match_id: selectedMatch.id,
      type: eventForm.type,
      player_id: eventForm.player_id,
      team_id: eventForm.team_id,
      minute: eventForm.minute,
    }
    if (eventForm.type === 'goal' && eventForm.assist_id) {
      const assistEvt: Omit<MatchEvent, 'id'> = {
        match_id: selectedMatch.id,
        type: 'assist',
        player_id: eventForm.assist_id,
        team_id: eventForm.team_id,
        minute: eventForm.minute,
      }
      const created = await createMatchEvents([evt, assistEvt])
      if (created) setEvents(prev => [...prev, ...created])
    } else {
      const created = await createMatchEvent(evt)
      if (created) setEvents(prev => [...prev, created])
    }
    setShowAddEvent(false)
    setEventForm({ type: 'goal', player_id: '', assist_id: '', minute: 0, team_id: '' })
  }

  async function removeEvent(id: string) {
    await deleteMatchEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  function getEventIcon(type: string) {
    switch (type) {
      case 'goal': case 'own_goal': case 'penalty_goal': return <Goal className="w-3 h-3 text-yellow-400" />
      case 'assist': return <Goal className="w-3 h-3 text-blue-400" />
      case 'yellow_card': return <Shield className="w-3 h-3 text-yellow-300" />
      case 'red_card': return <Shield className="w-3 h-3 text-red-500" />
      case 'motm': return <Award className="w-3 h-3 text-purple-400" />
      case 'injury': return <AlertTriangle className="w-3 h-3 text-orange-400" />
      default: return <></>
    }
  }

  function getEventLabel(type: string) {
    switch (type) {
      case 'goal': return 'Gol'
      case 'own_goal': return 'Gol Bunuh Diri'
      case 'penalty_goal': return 'Penalti'
      case 'assist': return 'Assist'
      case 'yellow_card': return 'Kuning'
      case 'red_card': return 'Merah'
      case 'motm': return 'MOTM'
      case 'injury': return 'Cedera'
      default: return type
    }
  }

  // Group events by team
  const homeEvents = events.filter(e => e.team_id === selectedMatch?.home_team_id)
  const awayEvents = events.filter(e => e.team_id === selectedMatch?.away_team_id)

  if (matches.length === 0 && teams.length >= 2) {
    return (
      <div className="text-center py-16">
        <RefreshCw className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-sm mb-2">{teams.length} tim · {league.format === 'double' ? 'Double RR' : 'Single RR'}</p>
        <button
          onClick={handleGenerateFixtures}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Memuat...' : 'Generate Jadwal'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {['Semua', ...teams.map(t => t.short_name)].slice(0, 7).map(label => (
            <button
              key={label}
              onClick={() => setFilterTeam(label === 'Semua' ? '' : teams.find(t => t.short_name === label)?.id || '')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                (label === 'Semua' && !filterTeam) || teams.find(t => t.id === filterTeam)?.short_name === label
                  ? 'bg-yellow-600/20 text-yellow-400'
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

      {matchweeks.map(mw => {
        const weekMatches = filteredMatches.filter(m => m.matchweek === mw)
        return (
          <div key={mw} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pekan {mw}</span>
              <span className="text-[10px] text-slate-600">({weekMatches.filter(m => m.status === 'played').length}/{weekMatches.length})</span>
            </div>
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
                        ? 'bg-[#111118] border-l-2 border-yellow-600'
                        : isSkipped
                        ? 'bg-[#111118]/50 border-l-2 border-slate-600'
                        : 'bg-[#111118] hover:bg-[#1a1a24] border-l-2 border-transparent hover:border-yellow-600/50'
                    }`}
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: home?.color || '#666' }} />
                      <span className={`text-sm font-medium ${isPlayed ? 'text-white' : 'text-slate-300'}`}>
                        {home?.short_name || home?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isPlayed ? (
                        <button onClick={() => openModal(match)} className="flex items-center gap-2.5 hover:opacity-80">
                          <span className="text-lg font-bold text-white tabular-nums">{match.home_score}</span>
                          <span className="text-xs text-slate-600">:</span>
                          <span className="text-lg font-bold text-white tabular-nums">{match.away_score}</span>
                        </button>
                      ) : isSkipped ? (
                        <span className="text-[10px] uppercase text-slate-600 tracking-wider font-medium">Skip</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openModal(match)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-yellow-600/20 text-yellow-400 text-[11px] font-semibold hover:bg-yellow-600/30"
                          >
                            <Play className="w-3 h-3" />
                            Skor
                          </button>
                          <button
                            onClick={() => handleSkip(match)}
                            className="px-2 py-1 rounded-md text-[11px] text-slate-500 hover:text-white"
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </div>

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

      {/* Modal */}
      {showModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111118] rounded-xl border border-[#1e1e2a] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1e1e2a]">
              <h3 className="text-sm font-semibold text-white">Input Hasil Pertandingan</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Team names */}
              <div className="flex items-center justify-between text-center">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{teamMap.get(selectedMatch.home_team_id)?.name}</p>
                </div>
                <div className="px-4">
                  <p className="text-xs text-slate-500">VS</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{teamMap.get(selectedMatch.away_team_id)?.name}</p>
                </div>
              </div>

              {/* Score input */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <input type="number" min="0" value={form.home_score}
                    onChange={e => setForm(p => ({ ...p, home_score: parseInt(e.target.value) || 0 }))}
                    className="w-20 h-16 text-center text-2xl font-bold rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white focus:border-yellow-500 outline-none" />
                </div>
                <span className="text-xl text-slate-600 font-bold">:</span>
                <div className="text-center">
                  <input type="number" min="0" value={form.away_score}
                    onChange={e => setForm(p => ({ ...p, away_score: parseInt(e.target.value) || 0 }))}
                    className="w-20 h-16 text-center text-2xl font-bold rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white focus:border-yellow-500 outline-none" />
                </div>
              </div>

              <button onClick={saveScore} disabled={saving}
                className="w-full py-2.5 rounded-lg bg-yellow-600 text-white text-sm font-semibold hover:bg-yellow-500 disabled:opacity-50">
                <Check className="w-4 h-4 inline mr-1.5" />{saving ? 'Menyimpan...' : 'Simpan Skor'}
              </button>

              {/* Match Events Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kronologi Pertandingan</h4>
                  <button onClick={() => {
                    setShowAddEvent(true)
                    setEventForm({ type: 'goal', player_id: '', assist_id: '', minute: 0, team_id: selectedMatch.home_team_id })
                  }} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" />Tambah Event
                  </button>
                </div>

                {/* Events list grouped by team */}
                {events.length === 0 ? (
                  <p className="text-xs text-slate-600 italic text-center py-3">Belum ada event</p>
                ) : (
                  <div className="space-y-1">
                    {/* Home events */}
                    {homeEvents.map(e => {
                      const player = players.find(p => p.id === e.player_id)
                      return (
                        <div key={e.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0a0a0f]">
                          <div className="flex items-center gap-2">
                            {getEventIcon(e.type)}
                            <span className="text-xs text-slate-400">{e.minute}'</span>
                            <span className="text-xs text-white">{player?.name || '?'}</span>
                            <span className="text-[10px] text-slate-500">{getEventLabel(e.type)}</span>
                          </div>
                          <button onClick={() => removeEvent(e.id)} className="text-slate-600 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                    {/* Away events */}
                    {awayEvents.map(e => {
                      const player = players.find(p => p.id === e.player_id)
                      return (
                        <div key={e.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0a0a0f]">
                          <div className="flex items-center gap-2">
                            {getEventIcon(e.type)}
                            <span className="text-xs text-slate-400">{e.minute}'</span>
                            <span className="text-xs text-white">{player?.name || '?'}</span>
                            <span className="text-[10px] text-slate-500">{getEventLabel(e.type)}</span>
                          </div>
                          <button onClick={() => removeEvent(e.id)} className="text-slate-600 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Add Event Form */}
              {showAddEvent && (
                <div className="p-3 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-slate-400">Tambah Event</h5>
                    <button onClick={() => setShowAddEvent(false)} className="text-xs text-slate-500 hover:text-white">Tutup</button>
                  </div>

                  {/* Event type buttons */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['goal', 'yellow_card', 'red_card', 'motm', 'injury', 'own_goal'] as EventType[]).map(type => (
                      <button key={type} onClick={() => setEventForm(p => ({ ...p, type }))}
                        className={`px-2 py-1.5 rounded text-[10px] font-medium border transition-colors ${
                          eventForm.type === type
                            ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400'
                            : 'bg-[#111118] border-[#1e1e2a] text-slate-400 hover:text-white'
                        }`}>
                        {getEventLabel(type)}
                      </button>
                    ))}
                  </div>

                  {/* Team selector */}
                  <div className="flex gap-2">
                    <button onClick={() => setEventForm(p => ({ ...p, team_id: selectedMatch.home_team_id, player_id: '' }))}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium border ${
                        eventForm.team_id === selectedMatch.home_team_id
                          ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400'
                          : 'bg-[#111118] border-[#1e1e2a] text-slate-400'
                      }`}>
                      {teamMap.get(selectedMatch.home_team_id)?.short_name}
                    </button>
                    <button onClick={() => setEventForm(p => ({ ...p, team_id: selectedMatch.away_team_id, player_id: '' }))}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium border ${
                        eventForm.team_id === selectedMatch.away_team_id
                          ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400'
                          : 'bg-[#111118] border-[#1e1e2a] text-slate-400'
                      }`}>
                      {teamMap.get(selectedMatch.away_team_id)?.short_name}
                    </button>
                  </div>

                  {/* Player selector */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">
                      {eventForm.type === 'goal' ? 'Pencetak Gol' :
                       eventForm.type === 'own_goal' ? 'Pemain (Gol Bunuh Diri)' :
                       eventForm.type === 'motm' ? 'Pemain Terbaik' :
                       eventForm.type === 'injury' ? 'Pemain Cedera' :
                       'Pemain'}
                    </label>
                    <select value={eventForm.player_id} onChange={e => setEventForm(p => ({ ...p, player_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#111118] border border-[#1e1e2a] text-white text-xs focus:border-yellow-500 outline-none">
                      <option value="">Pilih pemain</option>
                      {(eventForm.team_id === selectedMatch.home_team_id ? homePlayers : awayPlayers).map(p => (
                        <option key={p.id} value={p.id}>#{p.number} {p.name} ({p.position})</option>
                      ))}
                    </select>
                  </div>

                  {/* Assist selector (for goals) */}
                  {eventForm.type === 'goal' && (
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Assist (opsional)</label>
                      <select value={eventForm.assist_id} onChange={e => setEventForm(p => ({ ...p, assist_id: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#111118] border border-[#1e1e2a] text-white text-xs focus:border-yellow-500 outline-none">
                        <option value="">Tidak ada assist</option>
                        {(eventForm.team_id === selectedMatch.home_team_id ? homePlayers : awayPlayers).map(p => (
                          <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Minute */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Menit</label>
                    <input type="number" min="0" max="120" value={eventForm.minute}
                      onChange={e => setEventForm(p => ({ ...p, minute: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#111118] border border-[#1e1e2a] text-white text-xs focus:border-yellow-500 outline-none" />
                  </div>

                  <button onClick={addEvent}
                    className="w-full py-2 rounded-lg bg-yellow-600 text-white text-xs font-medium hover:bg-yellow-500">
                    <Plus className="w-3 h-3 inline mr-1" />Tambahkan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
