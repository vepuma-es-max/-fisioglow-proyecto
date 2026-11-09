
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AuthGate from './components/AuthGate.jsx'
import SistemaPrincipal from './components/SistemaPrincipal.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate>
      <SistemaPrincipal />
    </AuthGate>
  </StrictMode>
)
