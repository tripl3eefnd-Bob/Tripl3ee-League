import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Plus, ArrowRight, Trash2 } from 'lucide-react'
import { useT } from '../i18n'
import { getLeagues, deleteLeague } from '../lib/db'
import type { League } from '../types'

export default function Leagues() {
  const { t } = useT()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  async function load() {
    const data = await getLeagues()
    if (data) setLeagues(data)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm(t.league.delete_confirm)) return
    await deleteLeague(id)
    setLeagues(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-emerald-400" />
          {t.nav.leagues}
        </h1>
        <Link
          to="/leagues/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.league.create}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{t.common.loading}</div>
      ) : leagues.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">{t.common.no_data}</p>
          <Link
            to="/leagues/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium"
          >
            <Plus className="w-5 h-5" />
            {t.league.create}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {leagues.map(league => (
            <div
              key={league.id}
              className="group flex items-center justify-between p-4 rounded-xl bg-slate-800 border border-slate-700"
            >
              <Link to={`/leagues/${league.id}`} className="flex-1 flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${league.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <div>
                  <h3 className="font-semibold text-white">{league.name}</h3>
                  <p className="text-sm text-slate-400">
                    {league.season} · {league.num_teams} tim · {league.format === 'double' ? t.league.double : t.league.single}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  league.status === 'active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'
                }`}>
                  {league.status === 'active' ? t.league.active : t.league.completed}
                </span>
                <button
                  onClick={() => handleDelete(league.id)}
                  className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ArrowRight className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
