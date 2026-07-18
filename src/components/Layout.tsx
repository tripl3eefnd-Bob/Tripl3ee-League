import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useT } from '../i18n'
import { useTheme } from '../hooks/useTheme'
import { Trophy, Home, Settings, Moon, Sun, Languages, Users } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: 'Beranda' },
  { path: '/leagues', icon: Trophy, label: 'Liga' },
  { path: '/players', icon: Users, label: 'Pemain' },
  { path: '/settings', icon: Settings, label: 'Pengaturan' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { toggleLang, lang } = useT()
  const { toggleTheme, isDark } = useTheme()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <header className="bg-[#111118] border-b border-[#1e1e2a]">
        <div className="max-w-7xl mx-auto px-3 lg:px-6">
          <div className="flex items-center h-12 lg:h-14 gap-2">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-sm lg:text-base text-white tracking-tight">Triple3E</span>
            </Link>

            <nav className="flex items-center ml-4 gap-1">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 lg:px-4 h-10 text-xs lg:text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-yellow-600/15 text-yellow-400'
                        : 'text-slate-400 hover:text-white hover:bg-[#1e1e2a]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="flex-1" />

            <div className="flex items-center gap-1">
              <button onClick={toggleLang} className="px-2 h-8 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-[#1e1e2a]">
                {lang.toUpperCase()}
              </button>
              <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1e1e2a]">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 lg:px-6 py-4 lg:py-6">
        {children}
      </main>
    </div>
  )
}
