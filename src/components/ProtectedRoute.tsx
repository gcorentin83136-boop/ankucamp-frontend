// ============================================================
// ANKU — ProtectedRoute
// Redirige vers /login si l'utilisateur n'est pas connecté
// ============================================================

import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiresAuth?: boolean
  requiresPro?: boolean
}

export default function ProtectedRoute({
  children,
  requiresAuth = true,
  requiresPro = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  // Route publique : passe direct
  if (!requiresAuth) {
    return <>{children}</>
  }

  // Route protégée : redirige si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Route pro : redirige si pas professionnel
  if (requiresPro && user?.role !== 'professionnel') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
