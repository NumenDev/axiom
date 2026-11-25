import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-mono/latin-400.css'
import 'katex/dist/katex.min.css'
import './presentation/style.css'
import App from './presentation/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
