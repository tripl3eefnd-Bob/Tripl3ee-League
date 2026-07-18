import React from 'react'
import { Settings as SettingsIcon, Moon, Sun, Languages, Info } from 'lucide-react'
import { useT } from '../i18n'
import { useTheme } from '../hooks/useTheme'

export default function Settings() {
  const { t, toggleLang, lang } = useT()
  const { toggleTheme, isDark } = useTheme()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-emerald-400" />
        {t.settings.title}
      </h1>

      <div className="max-w-lg space-y-4">
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
          <h2 className="font-semibold text-white mb-1">{t.settings.language}</h2>
          <p className="text-sm text-slate-400 mb-3">{lang === 'id' ? 'Bahasa Indonesia' : 'English'}</p>
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            <Languages className="w-4 h-4" />
            {lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
          <h2 className="font-semibold text-white mb-1">{t.settings.dark_mode}</h2>
          <p className="text-sm text-slate-400 mb-3">
            {isDark ? 'Dark mode aktif' : 'Light mode aktif'}
          </p>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
          <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            {t.settings.about}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Triple3E League Manager v1.0.0
          </p>
          <p className="text-xs text-slate-500">
            Aplikasi manajemen liga manual untuk PES PS3.
            Built with React + Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}
