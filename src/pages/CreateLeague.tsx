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
    points_win: 3,
    points_draw: 1,
    points_loss: 0,
    tiebreaker: ['gd', 'gf', 'h2h'] as Tiebreaker[],
    num_teams: 8,
    num_groups: 2,
    has_knockout: false,
  })

  const teamOptions = [4, 6, 8, 10, 12, 14, 16, 18, 20]

  function toggleTiebreaker(tb: Tiebreaker) {
    setForm(prev => ({
      ...prev,
      tiebreaker: prev.tiebreaker.includes(tb)
        ? prev.tiebreaker.filter(t => t !== tb)
        : [...prev.tiebreaker, tb],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const league = await createLeague({
      name: form.name,
      season: form.season,
      format: form.format,
      competition_type: form.competition_type,
      points_win: form.points_win,
      points_draw: form.points_draw,
      points_loss: form.points_loss,
      tiebreaker: form.tiebreaker,
      status: 'active',
      num_teams: form.num_teams,
      num_groups: form.competition_type === 'group_knockout' ? form.num_groups : undefined,
      has_knockout: form.competition_type !== 'league',
    })
    setSaving(false)
    if (league) navigate(`/leagues/${league.id}`)
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        {t.common.back}
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">{t.league.create}</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <div className="p-6 rounded-xl bg-slate-800 border border-slate-700 space-y-4">
          <h2 className="font-semibold text-white">Informasi Dasar</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t.league.name}</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
              placeholder="Contoh: Liga Sore RW 05"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t.league.season}</label>
            <input
              type="text"
              value={form.season}
              onChange={e => setForm(prev => ({ ...prev, season: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
              placeholder="2025/2026"
            />
          </div>
        </div>

        {/* Format */}
        <div className="p-6 rounded-xl bg-slate-800 border border-slate-700 space-y-4">
          <h2 className="font-semibold text-white">Format Kompetisi</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-2">{t.league.competition_type}</label>
            <div className="grid grid-cols-3 gap-3">
              {(['league', 'group_knockout', 'multi_division'] as CompetitionType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, competition_type: type }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    form.competition_type === type
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {type === 'league' ? t.league.type_league
                    : type === 'group_knockout' ? t.league.type_group_knockout
                    : t.league.type_multi_division}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">{t.league.num_teams}</label>
              <select
                value={form.num_teams}
                onChange={e => setForm(prev => ({ ...prev, num_teams: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
              >
                {teamOptions.map(n => <option key={n} value={n}>{n} Tim</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">{t.league.format}</label>
              <select
                value={form.format}
                onChange={e => setForm(prev => ({ ...prev, format: e.target.value as LeagueFormat }))}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
              >
                <option value="single">{t.league.single}</option>
                <option value="double">{t.league.double}</option>
              </select>
            </div>
          </div>
          {form.competition_type === 'group_knockout' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">{t.league.num_groups}</label>
              <select
                value={form.num_groups}
                onChange={e => setForm(prev => ({ ...prev, num_groups: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
              >
                {[2, 4, 8].map(n => <option key={n} value={n}>{n} Grup</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Points & Tiebreaker */}
        <div className="p-6 rounded-xl bg-slate-800 border border-slate-700 space-y-4">
          <h2 className="font-semibold text-white">Poin & Tiebreaker</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">{t.league.points_win}</label>
              <input
                type="number"
                value={form.points_win}
                onChange={e => setForm(prev => ({ ...prev, points_win: parseInt(e.target.value) || 3 }))}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">{t.league.points_draw}</label>
              <input
                type="number"
                value={form.points_draw}
                onChange={e => setForm(prev => ({ ...prev, points_draw: parseInt(e.target.value) || 1 }))}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">{t.league.points_loss}</label>
              <input
                type="number"
                value={form.points_loss}
                onChange={e => setForm(prev => ({ ...prev, points_loss: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">{t.league.tiebreakers}</label>
            <div className="flex flex-wrap gap-2">
              {(['gd', 'gf', 'h2h'] as Tiebreaker[]).map(tb => (
                <button
                  key={tb}
                  type="button"
                  onClick={() => toggleTiebreaker(tb)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    form.tiebreaker.includes(tb)
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-700 border-slate-600 text-slate-400'
                  }`}
                >
                  {tb === 'gd' ? 'Selisih Gol' : tb === 'gf' ? 'Gol Masuk' : 'Head-to-Head'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !form.name}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-5 h-5" />
          {saving ? t.common.loading : t.common.save}
        </button>
      </form>
    </div>
  )
}
