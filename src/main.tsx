import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import AuthBootstrap from './components/AuthBootstrap'
import CookieBanner from './components/layout/CookieBanner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthBootstrap>
        <App />
        <CookieBanner />

        {/* ✅ Toaster global — nécessaire pour react-hot-toast */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '14px',
              background: '#ffffff',
              color: '#0f1a0f',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              border: '1px solid #e5e7eb',
              padding: '10px 14px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#6aa84f',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </AuthBootstrap>
    </BrowserRouter>
  </StrictMode>,
)
