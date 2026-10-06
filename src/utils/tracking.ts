// ============================================================
// ANKU — Utilitaires tracking / transporteurs
// ============================================================

/** URL d'accueil Mondial Relay (création d'expédition) */
export const MONDIAL_RELAY_URL = 'https://www.mondialrelay.fr/'

/** URL publique de suivi Mondial Relay */
export function getMondialRelayTrackingUrl(trackingNumber: string): string {
  const clean = trackingNumber.trim()
  if (!clean) return 'https://www.mondialrelay.fr/suivi-de-colis'
  return `https://www.mondialrelay.fr/suivi-de-colis?numeroExpedition=${encodeURIComponent(clean)}`
}

/**
 * Détecte l'URL de suivi selon le format du numéro.
 * Aujourd'hui : Mondial Relay par défaut.
 * Demain : Colissimo (8A/8C...), Chronopost (XY...), etc.
 */
export function getTrackingUrl(trackingNumber: string): string {
  return getMondialRelayTrackingUrl(trackingNumber)
}
