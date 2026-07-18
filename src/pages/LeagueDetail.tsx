import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Users, Calendar, BarChart3, Swords, Download, Settings } from 'lucide-react'
import { useT } from '../i18n'
import { getLeague, getTeams, getMatches, deleteLeague } from '../lib/db'
import type { League, Team, MatchWithTeams } from '../types'
import StandingsTab from '../components/StandingsTab'
import FixturesTab from '../components/FixturesTab'
import TeamsTab from '../components/TeamsTab'
import StatsTab from '../components/StatsTab'
import KnockoutTab from '../components/KnockoutTab'
import ExportTab from '../components/ExportTab'

type Tab = 'standings' | 'fixtures' | 'teams' | 'stats' | 'knockout' | 'export'

const tabs: { id: Tab; icon: any; label: string }[] = [
  { id: 'standings', icon: Trophy, label: 'Klasemen' },
  { id: 'fixtures', icon: Calendar, label: 'Jadwal' },
  { id: 'teams', icon: Users, label: 'Tim' },
  { id: 'stats', icon: BarChart3, label: 'Statistik' },
  { id: 'knockout', icon: Swords, label: 'Knockout' },
  { id: 'export', icon: Download, label: 'Export' },
]

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useT()
  const [league, setLeague] = useState<League | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('standings')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getLeague(id),
      getTeams(id),
      getMatches(id),
    ]).then(([l, tm, m]) => {
      setLeague(l)
      if (tm) setTeams(tm)
      if (m) setMatches(m)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return <div className="text-center py-12 text-slate-500">{t.common.loading}</div>
  }

  if (!league) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">League not found</p>
        <Link to="/leagues" className="text-emerald-400 hover:underline">{t.common.back}</Link>
      </div>
    )
  }

  async function handleDelete() {
    if (!confirm(t.league.delete_confirm)) return
    if (id) await deleteLeague(id)
    window.location.href = '/leagues'
  }

  const TabContent: Record<Tab, React.ReactNode> = {
    standings: <StandingsTab league={league} teams={teams} matches={matches} />,
    fixtures: <FixturesTab league={league} teams={teams} matches={matches} onMatchesChange={setMatches} />,
    teams: <TeamsTab league={league} teams={teams} onTeamsChange={setTeams} />,
    stats: <StatsTab league={league} teams={teams} matches={matches} />,
    knockout: <KnockoutTab league={league} teams={teams} matches={matches} />,
    export: <ExportTab league={league} teams={teams} matches={matches} />,
  }

  const totalMatchweeks = league.format === 'double'
    ? (league.num_teams - 1) * 2
    : league.num_teams - 1

  const playedMatches = matches.filter(m => m.status === 'played').length
  const totalMatches = matches.length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/leagues" className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </Link>
        <button onClick={handleDelete} className="text-sm text-red-400 hover:text-red-300">
          {t.common.delete}
        </button>
      </div>

      {/* League Info */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <h1 className="text-2xl lg:text-3xl font-bold text-white">{league.name}</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${
            league.status === 'active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'
          }`}>
            {league.status === 'active' ? t.league.active : t.league.completed}
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          {league.season} · {league.num_teams} tim · {league.format === 'double' ? t.league.double : t.league.single}
          {league.competition_type === 'group_knockout' && ` · ${t.league.type_group_knockout}`}
          {league.competition_type === 'multi_division' && ` · ${t.league.type_multi_division}`}
        </p>
        {totalMatches > 0 && (
          <p className="text-slate-500 text-xs mt-1">
            {playedMatches}/{totalMatches} pertandingan dimainkan
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-6 pb-2 scrollbar-hide">
        {tabs.filter(tab => tab.id !== 'knockout' || league.competition_type !== 'league').map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {TabContent[activeTab]}
    </div>
  )
}
