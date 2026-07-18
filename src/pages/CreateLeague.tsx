import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useT } from '../i18n'
import { createLeague } from '../lib/db'
import type { League, CompetitionType, LeagueFormat, Tiebreaker } from '../types'

export default function CreateLeague() {
  const { t } = useT()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    season: new Date().getFullYear().toString(),
    format: 'single' as LeagueFormat,
    competition_type: 'league' as CompetitionType,
    points_win: 3, points_draw: 1, points_loss: 0,
    tiebreaker: ['gd', 'gf', 'h2h'] as Tiebreaker[],
    num_teams: 8, num_groups: 2, has_knockout: false,
  })

  const teamOptions = [4, 6, 8, 10, 12, 14, 16, 18, 20]

  function toggleTiebreaker(tb: Tiebreaker) {
    setForm(p => ({ ...p, tiebreaker: p.tiebreaker.includes(tb) ? p.tiebreaker.filter(t => t !== tb) : [...p.tiebreaker, tb] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const league = await createLeague({
      name: form.name, season: form.season, format: form.format,
      competition_type: form.competition_type,
      points_win: form.points_win, points_draw: form.points_draw, points_loss: form.points_loss,
      tiebreaker: form.tiebreaker, status: 'active', num_teams: form.num_teams,
      num_groups: form.competition_type === 'group_knockout' ? form.num_groups : undefined,
      has_knockout: form.competition_type !== 'league',
    })
    setSaving(false)
    if (league) navigate(`/leagues/${league.id}`)
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm mb-5">
        <ArrowLeft className="w-4 h-4" />Kembali
      </button>
      <h1 className="text-lg font-bold text-white mb-5">Buat Liga Baru</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div className="p-4 rounded-lg bg-[#1a1f33] space-y-4 border border-[#2a2f45]">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Informasi Dasar</h2>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nama Liga</label>
            <input type="text" required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[#0f1322] border border-[#2a2f45] text-white text-sm focus:border-emerald-500 outline-none"
              placeholder="Contoh: Liga Sore RW 05" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Musim</label>
              <input type="text" value={form.season}
                onChange={e => setForm(p => ({ ...p, season: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0f1322] border border-[#2a2f45] text-white text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Jumlah Tim</label>
              <select value={form.num_teams}
                onChange={e => setForm(p => ({ ...p, num_teams: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0f1322] border border-[#2a2f45] text-white text-sm focus:border-emerald-500 outline-none">
                {teamOptions.map(n => <option key={n} value={n}>{n} Tim</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#1a1f33] space-y-4 border border-[#2a2f45]">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Format Kompetisi</h2>
          <div className="grid grid-cols-3 gap-2">
            {(['league', 'group_knockout', 'multi_division'] as CompetitionType[]).map(type => (
              <button key={type} type="button" onClick={() => setForm(p => ({ ...p, competition_type: type }))}
                className={`p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                  form.competition_type === type
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-[#0f1322] border-[#2a2f45] text-slate-400 hover:border-slate-500'
                }`}>
                {type === 'league' ? 'Liga' : type === 'group_knockout' ? 'Grup+KO' : 'Multi Divisi'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Format</label>
              <select value={form.format}
                onChange={e => setForm(p => ({ ...p, format: e.target.value as LeagueFormat }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0f1322] border border-[#2a2f45] text-white text-sm focus:border-emerald-500 outline-none">
                <option value="single">Single RR</option>
                <option value="double">Double RR</option>
              </select>
            </div>
            {form.competition_type === 'group_knockout' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Jumlah Grup</label>
                <select value={form.num_groups}
                  onChange={e => setForm(p => ({ ...p, num_groups: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f1322] border border-[#2a2f45] text-white text-sm focus:border-emerald-500 outline-none">
                  {[2, 4, 8].map(n => <option key={n} value={n}>{n} Grup</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#1a1f33] space-y-4 border border-[#2a2f45]">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Poin & Tiebreaker</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'points_win' as const, label: 'Menang' },
              { key: 'points_draw' as const, label: 'Seri' },
              { key: 'points_loss' as const, label: 'Kalah' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-slate-500 mb-1">{label}</label>
                <input type="number" value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f1322] border border-[#2a2f45] text-white text-sm focus:border-emerald-500 outline-none" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['gd', 'gf', 'h2h'] as Tiebreaker[]).map(tb => (
              <button key={tb} type="button" onClick={() => toggleTiebreaker(tb)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  form.tiebreaker.includes(tb)
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-[#0f1322] border-[#2a2f45] text-slate-400'
                }`}>
                {tb === 'gd' ? 'Selisih Gol' : tb === 'gf' ? 'Gol Masuk' : 'Head-to-Head'}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving || !form.name}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50">
          <Save className="w-4 h-4" />{saving ? 'Menyimpan...' : 'Buat Liga'}
        </button>
      </form>
    </div>
  )
}
