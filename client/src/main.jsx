import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { UIProvider } from './context/UIContext'
import ErrorBoundary from './components/ErrorBoundary'
import ReloadPrompt from './components/ReloadPrompt'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
    <ReloadPrompt />
  </StrictMode>,
)
