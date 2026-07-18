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
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-400" />
          {t.nav.leagues}
        </h1>
        <Link
          to="/leagues/new"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.league.create}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">{t.common.loading}</div>
      ) : leagues.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-sm mb-4">{t.common.no_data}</p>
          <Link to="/leagues/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">
            <Plus className="w-4 h-4" />{t.league.create}
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {leagues.map(league => (
            <div key={league.id} className="group flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a1f33] hover:bg-[#222840] transition-colors border-l-2 border-transparent hover:border-emerald-600">
              <Link to={`/leagues/${league.id}`} className="flex-1 flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${league.status === 'active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{league.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      league.status === 'active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'
                    }`}>
                      {league.status === 'active' ? t.league.active : t.league.completed}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {league.season} · {league.num_teams} tim
                  </p>
                </div>
              </Link>
              <button onClick={() => handleDelete(league.id)} className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
