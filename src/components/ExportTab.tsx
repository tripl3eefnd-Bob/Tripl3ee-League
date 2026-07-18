import React, { useCallback, useRef } from 'react'
import { Download, Upload, Share2, FileText, FileSpreadsheet, Camera } from 'lucide-react'
import { useT } from '../i18n'
import { calculateStandings } from '../lib/utils'
import type { League, Team, MatchWithTeams } from '../types'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

interface Props {
  league: League
  teams: Team[]
  matches: MatchWithTeams[]
}

export default function ExportTab({ league, teams, matches }: Props) {
  const { t } = useT()
  const standingsRef = useRef<HTMLDivElement>(null)

  const standings = calculateStandings(matches, teams, league.tiebreaker)

  const teamMap = new Map(teams.map(t => [t.id, t]))

  // Export JSON Backup
  const handleBackup = useCallback(() => {
    const data = {
      league,
      teams: teams.map(t => ({ ...t, league_id: undefined })),
      matches: matches.map(m => ({ ...m, league_id: undefined })),
      exported_at: new Date().toISOString(),
      version: '1.0',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    saveAs(blob, `${league.name.replace(/\s+/g, '_')}_backup.json`)
  }, [league, teams, matches])

  // Restore JSON
  const handleRestore = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const data = JSON.parse(text)
        alert('Data loaded! Import logic will restore to Supabase.')
        console.log('Restore data:', data)
      } catch {
        alert('Invalid JSON file')
      }
    }
    input.click()
  }, [])

  // Export Excel
  const handleExcel = useCallback(() => {
    const wb = XLSX.utils.book_new()

    // Standings sheet
    const standingRows = standings.map((s, i) => ({
      [t.standing.pos]: i + 1,
      [t.standing.team]: teamMap.get(s.team_id)?.name || '',
      [t.standing.mp]: s.played,
      [t.standing.w]: s.won,
      [t.standing.d]: s.drawn,
      [t.standing.l]: s.lost,
      [t.standing.gf]: s.goals_for,
      [t.standing.ga]: s.goals_against,
      [t.standing.gd]: s.goal_difference,
      [t.standing.pts]: s.points,
    }))
    const ws1 = XLSX.utils.json_to_sheet(standingRows)
    XLSX.utils.book_append_sheet(wb, ws1, 'Klasemen')

    // Matches sheet
    const matchRows = matches.map(m => ({
      Pekan: m.matchweek,
      'Tuan Rumah': teamMap.get(m.home_team_id)?.name || '',
      Skor: m.status === 'played' ? `${m.home_score ?? ''}-${m.away_score ?? ''}` : m.status,
      Tamu: teamMap.get(m.away_team_id)?.name || '',
    }))
    const ws2 = XLSX.utils.json_to_sheet(matchRows)
    XLSX.utils.book_append_sheet(wb, ws2, 'Jadwal')

    XLSX.writeFile(wb, `${league.name.replace(/\s+/g, '_')}_data.xlsx`)
  }, [standings, teamMap, matches, league, t])

  // Export PDF
  const handlePDF = useCallback(async () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    let y = 20

    // Title
    doc.setFontSize(18)
    doc.text(league.name, 105, y, { align: 'center' })
    y += 8
    doc.setFontSize(11)
    doc.text(`${league.season}`, 105, y, { align: 'center' })
    y += 10

    // Standings table
    doc.setFontSize(12)
    doc.text('Klasemen', 14, y)
    y += 6

    const headers = ['#', 'Tim', 'M', 'M', 'S', 'K', 'GM', 'GK', 'SG', 'PTS']
    const colWidths = [8, 60, 8, 8, 8, 8, 10, 10, 10, 10]
    let x = 14

    doc.setFontSize(8)
    doc.setFont(undefined, 'bold')
    headers.forEach((h, i) => {
      doc.text(h, x + colWidths[i] / 2, y, { align: 'center' })
      x += colWidths[i]
    })
    y += 4

    doc.setFont(undefined, 'normal')
    standings.forEach((s, i) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      const team = teamMap.get(s.team_id)
      x = 14
      const row = [
        String(i + 1),
        team?.name || '-',
        String(s.played),
        String(s.won),
        String(s.drawn),
        String(s.lost),
        String(s.goals_for),
        String(s.goals_against),
        String(s.goal_difference),
        String(s.points),
      ]
      row.forEach((val, j) => {
        doc.text(val, x + colWidths[j] / 2, y, { align: 'center' })
        x += colWidths[j]
      })
      y += 4
    })

    doc.save(`${league.name.replace(/\s+/g, '_')}_klasemen.pdf`)
  }, [league, standings, teamMap])

  // Share to WhatsApp
  const handleWhatsApp = useCallback(() => {
    let text = `🏆 *${league.name}*\n📅 ${league.season}\n\n*${t.standing.title}*\n\n`
    text += `# | Tim | M | W | D | L | GF | GA | GD | PTS\n`
    text += `---|----|--|--|--|--|----|----|----|----\n`
    standings.forEach((s, i) => {
      const team = teamMap.get(s.team_id)
      text += `${i + 1} | ${team?.name || '-'} | ${s.played} | ${s.won} | ${s.drawn} | ${s.lost} | ${s.goals_for} | ${s.goals_against} | ${s.goal_difference} | ${s.points}\n`
    })
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }, [league, standings, teamMap, t])

  // Screenshot
  const handleScreenshot = useCallback(async () => {
    if (!standingsRef.current) return
    const canvas = await html2canvas(standingsRef.current, {
      backgroundColor: '#1e293b',
      scale: 2,
    })
    canvas.toBlob(blob => {
      if (blob) saveAs(blob, `${league.name.replace(/\s+/g, '_')}_klasemen.png`)
    })
  }, [league])

  const actions = [
    { icon: Download, label: t.export.json_backup, onClick: handleBackup, color: 'bg-emerald-600' },
    { icon: Upload, label: t.export.json_restore, onClick: handleRestore, color: 'bg-blue-600' },
    { icon: FileText, label: t.export.pdf, onClick: handlePDF, color: 'bg-red-600' },
    { icon: FileSpreadsheet, label: t.export.excel_import, onClick: handleExcel, color: 'bg-green-600' },
    { icon: Share2, label: t.export.share_wa, onClick: handleWhatsApp, color: 'bg-emerald-600' },
    { icon: Camera, label: t.export.screenshot, onClick: handleScreenshot, color: 'bg-purple-600' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {actions.map(action => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl ${action.color}/20 border border-white/10 hover:${action.color}/30 transition-colors`}
            >
              <Icon className="w-8 h-8 text-white" />
              <span className="text-sm font-medium text-white text-center">{action.label}</span>
            </button>
          )
        })}
      </div>

      {/* Standings preview for screenshot */}
      <div ref={standingsRef} className="p-6 rounded-xl bg-slate-800 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">{league.name}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Tim</th>
              <th className="p-2 text-center">M</th>
              <th className="p-2 text-center">W</th>
              <th className="p-2 text-center">D</th>
              <th className="p-2 text-center">L</th>
              <th className="p-2 text-center">GF</th>
              <th className="p-2 text-center">GA</th>
              <th className="p-2 text-center">GD</th>
              <th className="p-2 text-center">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const team = teamMap.get(s.team_id)
              return (
                <tr key={s.team_id} className="border-b border-slate-800">
                  <td className="p-2 text-slate-400">{i + 1}</td>
                  <td className="p-2 text-white font-medium">{team?.name || '-'}</td>
                  <td className="p-2 text-center text-slate-300">{s.played}</td>
                  <td className="p-2 text-center text-emerald-400">{s.won}</td>
                  <td className="p-2 text-center text-yellow-400">{s.drawn}</td>
                  <td className="p-2 text-center text-red-400">{s.lost}</td>
                  <td className="p-2 text-center text-slate-300">{s.goals_for}</td>
                  <td className="p-2 text-center text-slate-300">{s.goals_against}</td>
                  <td className="p-2 text-center text-slate-300">{s.goal_difference}</td>
                  <td className="p-2 text-center font-bold text-white">{s.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
