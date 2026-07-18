import React, { useState } from 'react'
import { Plus, User, Camera, Trash2 } from 'lucide-react'
import { useT } from '../i18n'
import { createTeam, updateTeam, deleteTeam, createPlayer, updatePlayer, deletePlayer, getPlayers, uploadFile, getFileUrl } from '../lib/db'
import type { League, Team, Player, PlayerPosition } from '../types'

interface Props {
  league: League
  teams: Team[]
  onTeamsChange: (t: Team[]) => void
}

export default function TeamsTab({ league, teams, onTeamsChange }: Props) {
  const { t } = useT()
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamForm, setTeamForm] = useState({ name: '', short_name: '', color: '#10b981', owner_name: '' })
  const [players, setPlayers] = useState<Player[]>([])
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [playerForm, setPlayerForm] = useState({ name: '', number: 1, position: 'FW' as PlayerPosition, is_active: true })
  const [saving, setSaving] = useState(false)

  function openTeamModal(team?: Team) {
    if (team) {
      setEditingTeam(team)
      setTeamForm({ name: team.name, short_name: team.short_name, color: team.color, owner_name: team.owner_name || '' })
    } else {
      setEditingTeam(null)
      setTeamForm({ name: '', short_name: '', color: '#10b981', owner_name: '' })
    }
    setShowTeamModal(true)
  }

  async function saveTeam() {
    setSaving(true)
    if (editingTeam) {
      const updated = await updateTeam(editingTeam.id, teamForm)
      if (updated) onTeamsChange(teams.map(t => t.id === editingTeam.id ? updated : t))
    } else {
      const team = await createTeam({ ...teamForm, league_id: league.id })
      if (team) onTeamsChange([...teams, team])
    }
    setSaving(false)
    setShowTeamModal(false)
  }

  async function removeTeam(id: string) {
    if (!confirm(t.team.delete_confirm)) return
    await deleteTeam(id)
    onTeamsChange(teams.filter(t => t.id !== id))
  }

  async function openPlayerModal(teamId: string, player?: Player) {
    setSelectedTeamId(teamId)
    if (player) {
      setEditingPlayer(player)
      setPlayerForm({ name: player.name, number: player.number, position: player.position, is_active: player.is_active })
    } else {
      setEditingPlayer(null)
      setPlayerForm({ name: '', number: 1, position: 'FW', is_active: true })
    }
    setShowPlayerModal(true)
  }

  async function loadPlayers(teamId: string) {
    const data = await getPlayers(teamId)
    if (data) {
      setPlayers(prev => {
        const filtered = prev.filter(p => p.team_id !== teamId)
        return [...filtered, ...data]
      })
    }
  }

  async function savePlayer() {
    if (!selectedTeamId) return
    setSaving(true)
    if (editingPlayer) {
      await updatePlayer(editingPlayer.id, playerForm)
    } else {
      await createPlayer({ ...playerForm, team_id: selectedTeamId })
    }
    await loadPlayers(selectedTeamId)
    setSaving(false)
    setShowPlayerModal(false)
  }

  async function removePlayer(id: string, teamId: string) {
    await deletePlayer(id)
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  const teamPlayers = (teamId: string) => players.filter(p => p.team_id === teamId)

  return (
    <div>
      <button
        onClick={() => openTeamModal()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 mb-4"
      >
        <Plus className="w-4 h-4" />
        {t.team.create}
      </button>

      {teams.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{t.common.no_data}</div>
      ) : (
        <div className="grid gap-4">
          {teams.map(team => (
            <div key={team.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: team.color }} />
                  <div>
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    <p className="text-xs text-slate-400">{team.short_name}{team.owner_name ? ` · ${team.owner_name}` : ''}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openTeamModal(team)} className="text-xs text-slate-400 hover:text-white">{t.common.edit}</button>
                  <button onClick={() => removeTeam(team.id)} className="text-xs text-red-400 hover:text-red-300">{t.common.delete}</button>
                </div>
              </div>

              {/* Players */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase">{t.team.name} ({teamPlayers(team.id).length})</span>
                  <button
                    onClick={() => openPlayerModal(team.id)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {t.player.create}
                  </button>
                </div>
                {teamPlayers(team.id).length === 0 ? (
                  <p className="text-xs text-slate-600 italic py-2">Belum ada pemain</p>
                ) : (
                  teamPlayers(team.id).map(player => (
                    <div key={player.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-700/30">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono w-6">{player.number}</span>
                        <span className={`text-sm ${player.is_active ? 'text-white' : 'text-slate-500'}`}>{player.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{player.position}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openPlayerModal(team.id, player)} className="text-xs text-slate-500 hover:text-white">Edit</button>
                        <button onClick={() => removePlayer(player.id, team.id)} className="text-xs text-red-500 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center">
          <div className="w-full lg:max-w-md bg-slate-800 rounded-t-2xl lg:rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{editingTeam ? t.team.edit : t.team.create}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t.team.name}</label>
                <input
                  type="text" value={teamForm.name}
                  onChange={e => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">{t.team.short_name}</label>
                  <input
                    type="text" maxLength={3} value={teamForm.short_name}
                    onChange={e => setTeamForm(prev => ({ ...prev, short_name: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">{t.team.color}</label>
                  <input
                    type="color" value={teamForm.color}
                    onChange={e => setTeamForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 rounded-lg bg-slate-700 border border-slate-600 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t.team.owner}</label>
                <input
                  type="text" value={teamForm.owner_name}
                  onChange={e => setTeamForm(prev => ({ ...prev, owner_name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTeamModal(false)} className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300">{t.common.cancel}</button>
                <button onClick={saveTeam} disabled={saving || !teamForm.name} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium disabled:opacity-50">
                  {saving ? t.common.loading : t.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center">
          <div className="w-full lg:max-w-md bg-slate-800 rounded-t-2xl lg:rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{editingPlayer ? t.player.edit : t.player.create}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t.player.name}</label>
                <input
                  type="text" value={playerForm.name}
                  onChange={e => setPlayerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">{t.player.number}</label>
                  <input
                    type="number" min={1} max={99} value={playerForm.number}
                    onChange={e => setPlayerForm(prev => ({ ...prev, number: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">{t.player.position}</label>
                  <select
                    value={playerForm.position}
                    onChange={e => setPlayerForm(prev => ({ ...prev, position: e.target.value as PlayerPosition }))}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="GK">GK</option>
                    <option value="DF">DF</option>
                    <option value="MF">MF</option>
                    <option value="FW">FW</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPlayerModal(false)} className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300">{t.common.cancel}</button>
                <button onClick={savePlayer} disabled={saving || !playerForm.name} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium disabled:opacity-50">
                  {saving ? t.common.loading : t.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
