import { useState } from 'react'
import LegalLayout from '../../components/layout/LegalLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Mail, MessageSquare, Building2, Send } from 'lucide-react'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <LegalLayout
        title="Message envoyé !"
        subtitle="Nous te répondrons dans les plus brefs délais."
      >
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 mb-4">
            <Send size={32} className="text-emerald-300" />
          </div>
          <p className="text-white/90 mb-6">
            Merci de nous avoir contactés. Notre équipe te répondra sous 24-48h.
          </p>
          <Button variant="primary" onClick={() => setSent(false)}>
            Envoyer un autre message
          </Button>
        </div>
      </LegalLayout>
    )
  }

  return (
    <LegalLayout
      title="Contacter ANKU"
      subtitle="Une question, une suggestion ? Nous sommes là."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="p-4 rounded-2xl bg-black/30 border border-white/15">
          <Mail size={20} className="text-emerald-300 mb-2" />
          <p className="text-xs font-bold text-white mb-1">Email</p>
          <a
            href="mailto:contact@ankucamp.com"
            className="text-xs text-emerald-300 hover:underline"
          >
            contact@ankucamp.com
          </a>
        </div>

        <div className="p-4 rounded-2xl bg-black/30 border border-white/15">
          <MessageSquare size={20} className="text-emerald-300 mb-2" />
          <p className="text-xs font-bold text-white mb-1">Support</p>
          <p className="text-xs text-white/70">Réponse sous 24-48h</p>
        </div>

        <div className="p-4 rounded-2xl bg-black/30 border border-white/15">
          <Building2 size={20} className="text-emerald-300 mb-2" />
          <p className="text-xs font-bold text-white mb-1">Pro / Presse</p>
          <a
            href="mailto:pro@ankucamp.com"
            className="text-xs text-emerald-300 hover:underline"
          >
            pro@ankucamp.com
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Ton nom"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            type="email"
            placeholder="Ton email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <Input
          placeholder="Sujet"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          required
        />

        <div className="w-full">
          <textarea
            placeholder="Ton message..."
            rows={6}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            className="w-full px-5 py-4 rounded-3xl border-0
                       bg-white/95 text-gray-800 placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-emerald-400
                       text-sm font-medium shadow-sm resize-none"
          />
        </div>

        <Button type="submit" variant="primary" fullWidth>
          Envoyer le message
        </Button>
      </form>
    </LegalLayout>
  )
}
