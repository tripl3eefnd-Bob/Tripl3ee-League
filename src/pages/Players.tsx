import React, { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Edit2, Search } from 'lucide-react'
import { useT } from '../i18n'
import { getGlobalPlayers, createGlobalPlayer, updateGlobalPlayer, deleteGlobalPlayer } from '../lib/db'
import type { GlobalPlayer, PlayerPosition } from '../types'

export default function Players() {
  const { t } = useT()
  const [players, setPlayers] = useState<GlobalPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<GlobalPlayer | null>(null)
  const [form, setForm] = useState({ name: '', position: 'FW' as PlayerPosition, number: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const data = await getGlobalPlayers()
    if (data) setPlayers(data)
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm({ name: '', position: 'FW', number: '' })
    setShowModal(true)
  }

  function openEdit(p: GlobalPlayer) {
    setEditing(p)
    setForm({ name: p.name, position: p.position, number: p.number?.toString() || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {
      name: form.name.trim(),
      position: form.position,
      number: form.number ? parseInt(form.number) : undefined,
    }
    if (editing) {
      const updated = await updateGlobalPlayer(editing.id, data)
      if (updated) setPlayers(prev => prev.map(p => p.id === editing.id ? updated : p))
    } else {
      const created = await createGlobalPlayer(data)
      if (created) setPlayers(prev => [...prev, created])
    }
    setSaving(false)
    setShowModal(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pemain ini?')) return
    await deleteGlobalPlayer(id)
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-yellow-400" />
          Data Pemain
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-yellow-600 text-white text-xs font-semibold hover:bg-yellow-500"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Pemain
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Cari pemain..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#111118] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">{t.common.loading}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-sm mb-4">{search ? 'Pemain tidak ditemukan' : 'Belum ada data pemain'}</p>
          {!search && (
            <button onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" />Tambah Pemain
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#111118] hover:bg-[#1a1a24] transition-colors border border-transparent hover:border-yellow-600/30 group">
              <div className="w-8 h-8 rounded-full bg-[#1e1e2a] flex items-center justify-center text-xs text-yellow-400 font-bold">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white">{p.name}</span>
                <span className="text-xs text-slate-500 ml-2">{p.position}{p.number ? ` · #${p.number}` : ''}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => openEdit(p)} className="p-1.5 text-slate-500 hover:text-yellow-400">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="w-[340px] bg-[#111118] rounded-xl p-5 border border-[#1e1e2a]">
            <h3 className="text-sm font-semibold text-white mb-4">
              {editing ? 'Edit Pemain' : 'Tambah Pemain Baru'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nama Pemain</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Posisi</label>
                  <select value={form.position}
                    onChange={e => setForm(p => ({ ...p, position: e.target.value as PlayerPosition }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none">
                    <option value="GK">GK</option>
                    <option value="DF">DF</option>
                    <option value="MF">MF</option>
                    <option value="FW">FW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">No. Punggung</label>
                  <input type="number" min="1" max="99" value={form.number}
                    onChange={e => setForm(p => ({ ...p, number: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2a] text-white text-sm focus:border-yellow-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg bg-[#1e1e2a] text-slate-300 text-sm">Batal</button>
                <button onClick={handleSave} disabled={saving || !form.name.trim()}
                  className="flex-1 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
