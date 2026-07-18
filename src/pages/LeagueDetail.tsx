import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Users, Calendar, BarChart3, Swords, Download, Repeat } from 'lucide-react'
import { useT } from '../i18n'
import { getLeague, getTeams, getMatches, deleteLeague, updateLeague } from '../lib/db'
import type { League, Team, MatchWithTeams } from '../types'
import StandingsTab from '../components/StandingsTab'
import FixturesTab from '../components/FixturesTab'
import TeamsTab from '../components/TeamsTab'
import StatsTab from '../components/StatsTab'
import KnockoutTab from '../components/KnockoutTab'
import ExportTab from '../components/ExportTab'
import HeadToHeadTab from '../components/HeadToHeadTab'

type Tab = 'standings' | 'fixtures' | 'teams' | 'stats' | 'knockout' | 'h2h' | 'export'

const tabs: { id: Tab; icon: any; label: string }[] = [
  { id: 'standings', icon: Trophy, label: 'Klasemen' },
  { id: 'fixtures', icon: Calendar, label: 'Jadwal' },
  { id: 'teams', icon: Users, label: 'Tim' },
  { id: 'stats', icon: BarChart3, label: 'Statistik' },
  { id: 'h2h', icon: Repeat, label: 'H2H' },
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
    Promise.all([getLeague(id), getTeams(id), getMatches(id)]).then(([l, tm, m]) => {
      setLeague(l)
      if (tm) setTeams(tm)
      if (m) setMatches(m)
      setLoading(false)
    })
  }, [id])

  async function handleComplete() {
    if (!id || !confirm('Tandai liga ini sebagai selesai?')) return
    await updateLeague(id, { status: 'completed' })
    if (league) setLeague({ ...league, status: 'completed' })
  }

  async function handleDelete() {
    if (!confirm(t.league.delete_confirm)) return
    if (id) await deleteLeague(id)
    window.location.href = '/leagues'
  }

  if (loading) return <div className="text-center py-12 text-slate-500 text-sm">{t.common.loading}</div>
  if (!league) return (
    <div className="text-center py-12">
      <p className="text-slate-400 text-sm mb-4">Liga tidak ditemukan</p>
      <Link to="/leagues" className="text-yellow-400 text-sm hover:underline">Kembali</Link>
    </div>
  )

  const TabContent: Record<Tab, React.ReactNode> = {
    standings: <StandingsTab league={league} teams={teams} matches={matches} />,
    fixtures: <FixturesTab league={league} teams={teams} matches={matches} onMatchesChange={setMatches} />,
    teams: <TeamsTab league={league} teams={teams} onTeamsChange={setTeams} />,
    stats: <StatsTab league={league} teams={teams} matches={matches} />,
    knockout: <KnockoutTab league={league} teams={teams} matches={matches} />,
    h2h: <HeadToHeadTab league={league} teams={teams} matches={matches} />,
    export: <ExportTab league={league} teams={teams} matches={matches} />,
  }

  const playedMatches = matches.filter(m => m.status === 'played').length
  const totalMatches = matches.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link to="/leagues" className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
        <div className="flex items-center gap-2">
          {league.status === 'active' && (
            <button onClick={handleComplete} className="text-xs text-slate-500 hover:text-yellow-400">Selesai</button>
          )}
          <button onClick={handleDelete} className="text-xs text-slate-500 hover:text-red-400">Hapus</button>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-xl lg:text-2xl font-bold text-white">{league.name}</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
            league.status === 'active' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-slate-600/20 text-slate-400'
          }`}>{league.status === 'active' ? 'Aktif' : 'Selesai'}</span>
        </div>
        <p className="text-xs text-slate-500">
          {league.season} · {league.category === 'children' ? 'Anak-Anak' : 'Dewasa'} · {league.num_teams} tim · {league.format === 'double' ? 'Double RR' : 'Single RR'}
          {totalMatches > 0 && ` · ${playedMatches}/${totalMatches} main`}
        </p>
      </div>

      <div className="flex gap-0.5 mb-5 overflow-x-auto scrollbar-hide border-b border-[#1e1e2a]">
        {tabs.filter(tab => tab.id !== 'knockout' || league.competition_type !== 'league').map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'text-yellow-400 border-yellow-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {TabContent[activeTab]}
    </div>
  )
}
