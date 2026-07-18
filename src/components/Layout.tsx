import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useT } from '../i18n'
import { useTheme } from '../hooks/useTheme'
import {
  Trophy, Calendar, BarChart3, Settings, Home, Users,
  Menu, X, Moon, Sun, Languages, ChevronRight,
} from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, labelKey: 'nav.dashboard' as const },
  { path: '/leagues', icon: Trophy, labelKey: 'nav.leagues' as const },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, toggleLang, lang } = useT()
  const { toggleTheme, isDark } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg text-emerald-400">{t.app.name}</h1>
        <div className="flex gap-2">
          <button onClick={toggleLang} className="p-2 text-slate-400 hover:text-white">
            <Languages className="w-5 h-5" />
            <span className="text-xs ml-1">{lang.toUpperCase()}</span>
          </button>
        </div>
      </header>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-slate-800 border-r border-slate-700 z-50
        transform transition-transform duration-200 lg:transform-none lg:static lg:w-64
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <Trophy className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-lg text-emerald-400">{t.app.name}</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{(t as any).nav[item.labelKey.split('.')[1]] || item.labelKey}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 space-y-2">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/settings'
                ? 'bg-emerald-600/20 text-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>{t.settings.title}</span>
          </Link>
          <div className="flex gap-2 px-4">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="text-xs">{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={toggleLang}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
            >
              <Languages className="w-4 h-4" />
              <span className="text-xs">{lang.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-8">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
