function initTheme() {
  const isDark = JSON.parse(localStorage.getItem('wp-clone-color-mode'))?.state?.isDark
  const theme = isDark ? 'dark' : 'light'

  if (theme === 'dark') {
    document.querySelector('html').classList.add('dark')
  }
}

initTheme()
