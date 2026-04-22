export type AppTheme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'glitchmao-theme'

export function useTheme() {
  const theme = useState<AppTheme>('app-theme', () => 'dark')

  function applyTheme(value: AppTheme) {
    if (!import.meta.client)
      return

    document.documentElement.setAttribute('data-theme', value)
    window.localStorage.setItem(THEME_STORAGE_KEY, value)
  }

  function setTheme(value: AppTheme) {
    theme.value = value
    applyTheme(value)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function hydrateTheme() {
    if (!import.meta.client)
      return

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light')
      theme.value = stored

    applyTheme(theme.value)
  }

  return {
    theme: readonly(theme),
    setTheme,
    toggleTheme,
    hydrateTheme,
  }
}
