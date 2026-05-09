import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined')
      return 'system'
    return (localStorage.getItem('theme') as Theme) || 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined')
      return 'light'
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored === 'dark')
      return 'dark'
    if (stored === 'light')
      return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const updateTheme = () => {
        const isDark = mediaQuery.matches
        if (isDark) {
          root.classList.add('dark')
        }
        else {
          root.classList.remove('dark')
        }
        setResolvedTheme(isDark ? 'dark' : 'light')
      }
      updateTheme()
      mediaQuery.addEventListener('change', updateTheme)
      return () => mediaQuery.removeEventListener('change', updateTheme)
    }

    if (theme === 'dark') {
      root.classList.add('dark')
      setResolvedTheme('dark')
    }
    else {
      root.classList.remove('dark')
      setResolvedTheme('light')
    }
  }, [theme])

  const setThemeValue = (newTheme: Theme) => {
    if (newTheme === 'system') {
      localStorage.removeItem('theme')
    }
    else {
      localStorage.setItem('theme', newTheme)
    }
    setTheme(newTheme)
  }

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeValue,
  }
}
