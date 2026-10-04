import LegalLayout from '../../components/layout/LegalLayout'

export default function Cookies() {
  return (
    <LegalLayout
      title="Politique de Cookies"
      subtitle="Dernière mise à jour : 3 octobre 2026"
    >
      <h2>1. Qu'est-ce qu'un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur ton appareil (ordinateur,
        smartphone, tablette) lors de la visite d'un site web. Il permet au site
        de mémoriser tes actions et préférences pendant une durée déterminée.
      </p>

      <h2>2. Cookies utilisés par ANKU</h2>

      <h3>🔒 Cookies essentiels</h3>
      <p>
        Indispensables au fonctionnement de la plateforme. Ils gèrent notamment :
      </p>
      <ul>
        <li>La session utilisateur (rester connecté)</li>
        <li>La sécurité (prévention des attaques CSRF)</li>
        <li>La mémorisation de tes choix de cookies</li>
      </ul>
      <p><strong>Ces cookies ne peuvent pas être désactivés.</strong></p>

      <h3>📊 Cookies analytiques</h3>
      <p>
        Ils nous aident à comprendre comment tu utilises ANKU afin d'améliorer
        l'expérience : pages les plus visitées, temps passé, erreurs rencontrées.
      </p>
      <p>
        Les données sont anonymisées et agrégées. Tu peux les refuser sans
        impact sur ton utilisation de la plateforme.
      </p>

      <h3>🎯 Cookies marketing</h3>
      <p>
        Utilisés pour te proposer des contenus et offres pertinents en fonction
        de tes centres d'intérêt. Tu peux les refuser.
      </p>

      <h2>3. Durée de conservation</h2>
      <ul>
        <li><strong>Cookies de session</strong> : supprimés à la fermeture du navigateur.</li>
        <li><strong>Cookies persistants</strong> : 13 mois maximum.</li>
      </ul>

      <h2>4. Comment gérer tes préférences ?</h2>
      <p>
        Tu peux modifier tes choix à tout moment en cliquant sur le lien
        "Cookies" en bas de page. Tu peux également configurer ton navigateur
        pour refuser tous les cookies.
      </p>

      <h2>5. Cookies tiers</h2>
      <p>
        Certains cookies sont déposés par des services tiers :
      </p>
      <ul>
        <li><strong>Google OAuth</strong> (authentification)</li>
        <li><strong>Cloudinary</strong> (hébergement d'images)</li>
        <li><strong>Stripe</strong> (paiements sécurisés)</li>
      </ul>

      <h2>6. Contact</h2>
      <p>
        Pour toute question : <a href="mailto:contact@ankucamp.com">contact@ankucamp.com</a>
      </p>
    </LegalLayout>
  )
}
