import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './oficina.css'
import './cinema.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: registra o service worker só no site publicado (não no `npm run dev`).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}