import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useT } from '../i18n'
import { useTheme } from '../hooks/useTheme'
import { Trophy, Home, Settings, Moon, Sun, Languages } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: 'Beranda' },
  { path: '/leagues', icon: Trophy, label: 'Liga' },
  { path: '/settings', icon: Settings, label: 'Pengaturan' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { toggleLang, lang } = useT()
  const { toggleTheme, isDark } = useTheme()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#0f1322] text-slate-200">
      {/* Top Header - Flashscore style */}
      <header className="bg-[#1a1f33] border-b border-[#2a2f45]">
        <div className="max-w-7xl mx-auto px-3 lg:px-6">
          <div className="flex items-center h-12 lg:h-14 gap-2">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm lg:text-base text-white tracking-tight">Triple3E</span>
            </Link>

            {/* Nav items */}
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
                        ? 'bg-emerald-600/15 text-emerald-400'
                        : 'text-slate-400 hover:text-white hover:bg-[#2a2f45]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button onClick={toggleLang} className="px-2 h-8 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-[#2a2f45]">
                {lang.toUpperCase()}
              </button>
              <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#2a2f45]">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 lg:px-6 py-4 lg:py-6">
        {children}
      </main>
    </div>
  )
}
