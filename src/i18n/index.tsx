import React, { createContext, useContext, useState, useCallback } from 'react'
import en from './en'
import id from './id'

export type Lang = 'en' | 'id'
type Translation = typeof en

const translations: Record<Lang, Translation> = { en, id }

interface I18nContextType {
  lang: Lang
  t: Translation
  setLang: (l: Lang) => void
  toggleLang: () => void
}

const I18nContext = createContext<I18nContextType>({
  lang: 'id',
  t: id,
  setLang: () => {},
  toggleLang: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'id'
  })

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'id' ? 'en' : 'id'
      localStorage.setItem('lang', next)
      return next
    })
  }, [])

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT() {
  return useContext(I18nContext)
}
