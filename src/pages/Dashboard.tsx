import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Plus, Users, Calendar, BarChart3, ArrowRight } from 'lucide-react'
import { useT } from '../i18n'
import { getLeagues } from '../lib/db'
import type { League } from '../types'

export default function Dashboard() {
  const { t } = useT()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeagues().then(data => {
      if (data) setLeagues(data)
      setLoading(false)
    })
  }, [])

  const activeLeagues = leagues.filter(l => l.status === 'active')
  const completedLeagues = leagues.filter(l => l.status === 'completed')

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-8 lg:mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
          <Trophy className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2">{t.app.name}</h1>
        <p className="text-slate-400">{t.app.subtitle}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          to="/leagues/new"
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
        >
          <Plus className="w-8 h-8 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">{t.league.create}</span>
        </Link>
        <Link
          to="/leagues"
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
        >
          <Trophy className="w-8 h-8 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">{t.nav.leagues}</span>
        </Link>
        <Link
          to="/settings"
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 transition-colors"
        >
          <BarChart3 className="w-8 h-8 text-purple-400" />
          <span className="text-sm font-medium text-purple-400">{t.settings.title}</span>
        </Link>
      </div>

      {/* Active Leagues */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">{t.common.loading}</div>
      ) : activeLeagues.length > 0 ? (
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            {t.league.active}
          </h2>
          <div className="space-y-3">
            {activeLeagues.map(league => (
              <Link
                key={league.id}
                to={`/leagues/${league.id}`}
                className="block p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{league.name}</h3>
                    <p className="text-sm text-slate-400">
                      {league.season} · {league.format === 'double' ? t.league.double : t.league.single} · {league.num_teams} tim
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : completedLeagues.length > 0 ? (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">{t.season.view_archive}</h2>
          <div className="space-y-3">
            {completedLeagues.map(league => (
              <Link
                key={league.id}
                to={`/leagues/${league.id}`}
                className="block p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{league.name}</h3>
                    <p className="text-sm text-slate-500">{league.season} · {t.league.completed}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-600" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16">
          <Trophy className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">{t.common.no_data}</p>
          <Link
            to="/leagues/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t.league.create}
          </Link>
        </div>
      )}
    </div>
  )
}
