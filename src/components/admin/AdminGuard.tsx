// ============================================================
// ANKU — AdminGuard
// Vérifie que l'utilisateur est admin, sinon redirige
// ============================================================

import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../../context/AuthContext'

interface AdminGuardProps {
  children: ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  // Non connecté → login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Connecté mais pas admin → home
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
