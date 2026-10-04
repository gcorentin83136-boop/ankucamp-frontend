import { Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'
import ActivateAccount from './pages/Auth/ActivateAccount'
import OAuthCallback from './pages/Auth/OAuthCallback'
import Kyc from './pages/Auth/Kyc'
import BecomePro from './pages/Auth/BecomePro'

import CGU from './pages/Legal/CGU'
import Cookies from './pages/Legal/Cookies'
import Contact from './pages/Legal/Contact'

import SettingsLayout from './components/settings/SettingsLayout'
import SettingsHub from './pages/Settings/SettingsHub'
import AccountSettings from './pages/Settings/AccountSettings'
import SecuritySettings from './pages/Settings/SecuritySettings'
import SessionsSettings from './pages/Settings/SessionsSettings'
import PrivacySettings from './pages/Settings/PrivacySettings'
import NotificationsSettings from './pages/Settings/NotificationsSettings'
import DangerZone from './pages/Settings/DangerZone'

import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/activate" element={<ActivateAccount />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />

      {/* Legal */}
      <Route path="/legal/cgu" element={<CGU />} />
      <Route path="/legal/cookies" element={<Cookies />} />
      <Route path="/contact" element={<Contact />} />

      {/* Protégées */}
      <Route
        path="/kyc"
        element={
          <ProtectedRoute requiresPro>
            <Kyc />
          </ProtectedRoute>
        }
      />
      <Route
        path="/become-pro"
        element={
          <ProtectedRoute>
            <BecomePro />
          </ProtectedRoute>
        }
      />

      {/* Paramètres */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SettingsHub />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="security" element={<SecuritySettings />} />
        <Route path="sessions" element={<SessionsSettings />} />
        <Route path="privacy" element={<PrivacySettings />} />
        <Route path="notifications" element={<NotificationsSettings />} />
        <Route path="danger" element={<DangerZone />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
