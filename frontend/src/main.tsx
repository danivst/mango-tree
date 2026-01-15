import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

// Initialize theme on app load
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('appTheme') as 'dark' | 'purple' | 'cream' | 'light'
  const theme = savedTheme && ['dark', 'purple', 'cream', 'light'].includes(savedTheme) ? savedTheme : 'cream'
  const root = document.documentElement

  switch (theme) {
    case 'dark':
      root.style.setProperty('--theme-bg', '#000000')
      root.style.setProperty('--theme-accent', '#1a1a1a')
      root.style.setProperty('--theme-text', '#FFFFFF')
      break
    case 'purple':
      root.style.setProperty('--theme-bg', '#250B24')
      root.style.setProperty('--theme-accent', '#361134')
      root.style.setProperty('--theme-text', '#F1F0CC')
      break
    case 'cream':
      root.style.setProperty('--theme-bg', '#F1F0CC')
      root.style.setProperty('--theme-accent', '#FCFBE4')
      root.style.setProperty('--theme-text', '#250B24')
      break
    case 'light':
      root.style.setProperty('--theme-bg', '#FFFFFF')
      root.style.setProperty('--theme-accent', '#F5F5F5')
      root.style.setProperty('--theme-text', '#000000')
      break
  }
}

initializeTheme()

// Initialize language on app load
const initializeLanguage = () => {
  const savedLanguage = localStorage.getItem('appLanguage') as 'en' | 'bg'
  const lang = savedLanguage && (savedLanguage === 'en' || savedLanguage === 'bg') ? savedLanguage : 'en'
  document.documentElement.setAttribute('lang', lang)
}

initializeLanguage()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
