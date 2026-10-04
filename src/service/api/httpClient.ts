import axios from 'axios';

// ============================================================
// Configuration de base
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const httpClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s max par requête
});

// ============================================================
// Intercepteur de requête : ajoute le token JWT automatiquement
// ============================================================

httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('anku_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Intercepteur de réponse : gère les erreurs globales
// ============================================================

httpClient.interceptors.response.use(
  // Succès : on renvoie directement les données
  (response) => response,

  // Erreur
  (error) => {
    const status = error.response?.status;

    // 401 = token expiré ou invalide → on déconnecte
    if (status === 401) {
      localStorage.removeItem('anku_token');
      localStorage.removeItem('anku_user');

      // Redirection sauf si on est déjà sur /login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // 429 = trop de requêtes (rate limit)
    if (status === 429) {
      console.warn('⚠️ Trop de requêtes, attends un peu');
    }

    // 500 = erreur serveur
    if (status >= 500) {
      console.error('❌ Erreur serveur ANKU');
    }

    return Promise.reject(error);
  }
);

export default httpClient;