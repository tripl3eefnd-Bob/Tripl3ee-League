import React, { useState, useEffect } from 'react'
import { Plus, User, Trash2, Database } from 'lucide-react'
import { useT } from '../i18n'
import { createTeam, updateTeam, deleteTeam, createPlayer, updatePlayer, deletePlayer, getPlayers } from '../lib/db'
import { getGlobalPlayers, importGlobalPlayerToTeam } from '../lib/db'
import type { League, Team, Player, PlayerPosition, GlobalPlayer } from '../types'

interface Props {
  league: League
  teams: Team[]
  onTeamsChange: (t: Team[]) => void
}

export default function TeamsTab({ league, teams, onTeamsChange }: Props) {
  const { t } = useT()
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamForm, setTeamForm] = useState({ name: '', short_name: '', color: '#eab308', owner_name: '' })
  const [players, setPlayers] = useState<Player[]>([])
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [playerForm, setPlayerForm] = useState({ name: '', number: 1, position: 'FW' as PlayerPosition, is_active: true })
  const [globalPlayers, setGlobalPlayers] = useState<GlobalPlayer[]>([])
  const [searchGlobal, setSearchGlobal] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadGlobalPlayers()
  }, [])

  async function loadGlobalPlayers() {
    const data = await getGlobalPlayers()
    if (data) setGlobalPlayers(data)
  }

  function openTeamModal(team?: Team) {
    if (team) {
      setEditingTeam(team)
      setTeamForm({ name: team.name, short_name: team.short_name, color: team.color, owner_name: team.owner_name || '' })
    } else {
      setEditingTeam(null)
      setTeamForm({ name: '', short_name: '', color: '#eab308', owner_name: '' })
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

  function openPlayerModal(teamId: string, player?: Player) {
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

  function openImportModal(teamId: string) {
    setSelectedTeamId(teamId)
    setSearchGlobal('')
    setShowImportModal(true)
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

  async function handleImportGlobal(gp: GlobalPlayer) {
    if (!selectedTeamId) return
    const taken = players.filter(p => p.team_id === selectedTeamId)
    const number = gp.number || (taken.length + 1)
    await importGlobalPlayerToTeam(gp.id, selectedTeamId, number)
    await loadPlayers(selectedTeamId)
  }

  const teamPlayers = (teamId: string) => players.filter(p => p.team_id === teamId)

  const filteredGlobal = globalPlayers.filter(p =>
    p.name.toLowerCase().includes(searchGlobal.toLowerCase())
  )

  return (
    <div>
      <button
        onClick={() => openTeamModal()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-500 mb-4"
      >
        <Plus className="w-4 h-4" />
        {t.team.create}
      </button>

      {teams.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{t.common.no_data}</div>
      ) : (
        <div className="grid gap-4">
          {teams.map(team => (
            <div key={team.id} className="p-4 rounded-lg bg-[#111118] border border-[#1e1e2a]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: team.color }} />
                  <div>
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    <p className="text-xs text-slate-400">{team.short_name}{team.owner_name ? ` · ${team.owner_name}` : ''}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openTeamModal(team)} className="text-xs text-slate-400 hover:text-white">Edit</button>
                  <button onClick={() => removeTeam(team.id)} className="text-xs text-red-400 hover:text-red-300">Hapus</button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase">Pemain ({teamPlayers(team.id).length})</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openImportModal(team.id)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                    >
                      <Database className="w-3 h-3" />
                      Ambil
                    </button>
                    <button
                      onClick={() => openPlayerModal(team.id)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Tambah
                    </button>
                  </div>
                </div>
                {teamPlayers(team.id).length === 0 ? (
                  <p className="text-xs text-slate-600 italic py-2">Belum ada pemain</p>
                ) : (
                  teamPlayers(team.id).map(player => (
                    <div key={player.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#1a1a24]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono w-6">{player.number}</span>
                        <span className={`text-sm ${player.is_active ? 'text-white' : 'text-slate-500'}`}>{player.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e2a] text-slate-400">{player.position}</span>
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

      {showTeamModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end lg:items-center justify-center">
          <div className="w-full lg:max-w-md bg-[#111118] rounded-t-2xl lg:rounded-2xl p-6 border border-[#1e1e2a]">
            <h3 className="text-sm font-semibold text-white mb-4">{editingTeam ? 'Edit Tim' : 'Tambah Tim'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nama Tim</label>
                <input type="text" value={teamForm.name}
                  onChange={e => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Singkatan</label>
                  <input type="text" maxLength={3} value={teamForm.short_name}
                    onChange={e => setTeamForm(prev => ({ ...prev, short_name: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Warna</label>
                  <input type="color" value={teamForm.color}
                    onChange={e => setTeamForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Pemilik</label>
                <input type="text" value={teamForm.owner_name}
                  onChange={e => setTeamForm(prev => ({ ...prev, owner_name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTeamModal(false)} className="flex-1 py-2 rounded-lg bg-[#1e1e2a] text-slate-300 text-sm">Batal</button>
                <button onClick={saveTeam} disabled={saving || !teamForm.name} className="flex-1 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPlayerModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end lg:items-center justify-center">
          <div className="w-full lg:max-w-md bg-[#111118] rounded-t-2xl lg:rounded-2xl p-6 border border-[#1e1e2a]">
            <h3 className="text-sm font-semibold text-white mb-4">{editingPlayer ? 'Edit Pemain' : 'Tambah Pemain'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nama Pemain</label>
                <input type="text" value={playerForm.name}
                  onChange={e => setPlayerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">No. Punggung</label>
                  <input type="number" min={1} max={99} value={playerForm.number}
                    onChange={e => setPlayerForm(prev => ({ ...prev, number: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Posisi</label>
                  <select value={playerForm.position}
                    onChange={e => setPlayerForm(prev => ({ ...prev, position: e.target.value as PlayerPosition }))}
                    className="w-full px-4 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none">
                    <option value="GK">GK</option>
                    <option value="DF">DF</option>
                    <option value="MF">MF</option>
                    <option value="FW">FW</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPlayerModal(false)} className="flex-1 py-2 rounded-lg bg-[#1e1e2a] text-slate-300 text-sm">Batal</button>
                <button onClick={savePlayer} disabled={saving || !playerForm.name} className="flex-1 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="w-[380px] bg-[#111118] rounded-xl p-5 border border-[#1e1e2a] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Ambil dari Data Pemain</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-500 hover:text-white text-sm">Tutup</button>
            </div>
            <input type="text" placeholder="Cari pemain..." value={searchGlobal}
              onChange={e => setSearchGlobal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none mb-3" />
            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredGlobal.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Belum ada data pemain tersimpan</p>
              ) : (
                filteredGlobal.map(gp => (
                  <button key={gp.id} onClick={() => handleImportGlobal(gp)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a24] text-left transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[#1e1e2a] flex items-center justify-center text-xs text-yellow-400 font-bold">
                      {gp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-white">{gp.name}</span>
                      <span className="text-xs text-slate-500 ml-2">{gp.position}{gp.number ? ` · #${gp.number}` : ''}</span>
                    </div>
                    <span className="text-xs text-yellow-400">Pilih</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
