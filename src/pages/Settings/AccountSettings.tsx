import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { User, Mail, AtSign, KeyRound, Info, CheckCircle2 } from 'lucide-react'
import SettingsSection from '../../components/settings/SettingsSection'
import ConfirmPasswordModal from '../../components/settings/ConfirmPasswordModal'
import { useAuthStore } from '../../context/AuthContext'
import accountApi from '../../service/api/settings/account.api'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

const emailSchema = z.object({
  new_email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})
const usernameSchema = z.object({
  new_username: z
    .string()
    .min(3, 'Min 3 caractères')
    .max(30, 'Max 30 caractères')
    .regex(/^[a-z0-9_]+$/, 'Minuscules, chiffres et _ uniquement'),
  password: z.string().min(1, 'Mot de passe requis'),
})
const infoSchema = z.object({
  first_name: z.string().min(2, 'Trop court').max(100),
  last_name: z.string().min(2, 'Trop court').max(100),
  birth_year: z.coerce
    .number()
    .int()
    .min(1900, 'Invalide')
    .max(new Date().getFullYear() - 13, '13 ans min'),
})
const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Requis'),
    new_password: z
      .string()
      .min(8, 'Min 8 caractères')
      .regex(/[A-Z]/, 'Majuscule requise')
      .regex(/[a-z]/, 'Minuscule requise')
      .regex(/[0-9]/, 'Chiffre requis'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Ne correspondent pas',
    path: ['confirm_password'],
  })

type EmailForm = z.infer<typeof emailSchema>
type UsernameForm = z.infer<typeof usernameSchema>
type InfoFormInput = z.input<typeof infoSchema>
type InfoFormOutput = z.output<typeof infoSchema>
type PasswordForm = z.infer<typeof passwordSchema>

// ============================================================
// Helper : toast de succès unifié
// ============================================================
function toastOk(detail?: string) {
  toast.success(
    <div className="flex items-start gap-2">
      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-sm">Modifications prises en compte ✅</p>
        {detail && <p className="text-xs text-gray-600 mt-0.5">{detail}</p>}
      </div>
    </div>,
    { duration: 4000 }
  )
}

// ============================================================
// Helper : vérifie qu'un champ a bien été enregistré côté backend
// ============================================================
async function verifyField<K extends string>(
  field: K,
  expected: unknown
): Promise<{ ok: boolean; actual: unknown }> {
  try {
    const res = await accountApi.getMe()
    const actual = (res.account as any)?.[field]
    return { ok: actual === expected, actual }
  } catch {
    return { ok: false, actual: undefined }
  }
}

export default function AccountSettings() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const mergeUser = useAuthStore((s) => s.mergeUser)
  const logout = useAuthStore((s) => s.logout)

  const [emailLoading, setEmailLoading] = useState(false)
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [infoLoading, setInfoLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [deactivateLoading, setDeactivateLoading] = useState(false)

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })
  const usernameForm = useForm<UsernameForm>({
    resolver: zodResolver(usernameSchema),
  })

  // z.coerce.number() cree une difference input/output (string -> number).
  // On declare les 3 generics : input, context, output.
  const infoForm = useForm<InfoFormInput, any, InfoFormOutput>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      birth_year: (user?.birth_year ?? '') as any,
    },
  })

  const pwdForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  if (!user) return null

  // ----------------------------------------------------------
  // INFO PERSO
  // ----------------------------------------------------------
  const handleInfo = async (data: InfoFormOutput) => {
    setInfoLoading(true)
    try {
      const res = await accountApi.updateInfo(data)
      mergeUser(res.account)

      const { ok, actual } = await verifyField('first_name', data.first_name)

      if (ok) {
        toastOk(
          `${data.first_name} ${data.last_name} · né(e) en ${data.birth_year}`
        )
      } else {
        toast.error(
          `Sauvegarde OK mais le backend renvoie "${actual}" au lieu de "${data.first_name}"`
        )
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setInfoLoading(false)
    }
  }

  // ----------------------------------------------------------
  // EMAIL
  // ----------------------------------------------------------
  const handleEmail = async (data: EmailForm) => {
    setEmailLoading(true)
    try {
      const res = await accountApi.changeEmail(data)
      mergeUser(res.account)

      const { ok, actual } = await verifyField('email', data.new_email)

      if (ok) {
        toastOk(`${data.new_email} — vérifie ta boîte mail pour confirmer`)
      } else {
        toast.error(
          `Sauvegarde OK mais le backend renvoie "${actual}" au lieu de "${data.new_email}"`
        )
      }
      emailForm.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setEmailLoading(false)
    }
  }

  // ----------------------------------------------------------
  // USERNAME
  // ----------------------------------------------------------
  const handleUsername = async (data: UsernameForm) => {
    setUsernameLoading(true)
    try {
      const res = await accountApi.changeUsername(data)
      mergeUser(res.account)

      const { ok, actual } = await verifyField('username', data.new_username)

      if (ok) {
        toastOk(`@${data.new_username}`)
      } else {
        toast.error(
          `Sauvegarde OK mais le backend renvoie "@${actual}" au lieu de "@${data.new_username}"`
        )
      }
      usernameForm.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setUsernameLoading(false)
    }
  }

  // ----------------------------------------------------------
  // PASSWORD
  // ----------------------------------------------------------
  const handlePassword = async (data: PasswordForm) => {
    setPwdLoading(true)
    try {
      await accountApi.changePassword(data)
      toastOk('Toutes tes sessions ont été révoquées — reconnecte-toi')
      pwdForm.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setPwdLoading(false)
    }
  }

  // ----------------------------------------------------------
  // DEACTIVATE — Logout + redirect après désactivation
  // ----------------------------------------------------------
  const handleDeactivate = async (password: string) => {
    setDeactivateLoading(true)
    try {
      await accountApi.deactivate({
        password,
        reason: deactivateReason || null,
      })
      setConfirmOpen(false)

      // Toast avant la déco
      toastOk('Tu vas être déconnecté dans un instant…')

      // Petit délai pour que le toast soit visible
      setTimeout(async () => {
        await logout()
        navigate('/login')
      }, 1500)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setDeactivateLoading(false)
    }
  }

  const renderError = (msg?: string) =>
    msg ? (
      <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{msg}</p>
    ) : null

  return (
    <div className="space-y-4">
      {/* Infos personnelles */}
      <SettingsSection
        title="Informations personnelles"
        description="Ton nom et ton année de naissance"
        icon={<User size={18} />}
      >
        <form onSubmit={infoForm.handleSubmit(handleInfo)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                {...infoForm.register('first_name')}
                placeholder="Prénom"
                className={inputCls}
              />
              {renderError(infoForm.formState.errors.first_name?.message)}
            </div>
            <div>
              <input
                {...infoForm.register('last_name')}
                placeholder="Nom"
                className={inputCls}
              />
              {renderError(infoForm.formState.errors.last_name?.message)}
            </div>
          </div>
          <div>
            <input
              type="number"
              {...infoForm.register('birth_year')}
              placeholder="Année de naissance"
              className={inputCls}
            />
            {renderError(infoForm.formState.errors.birth_year?.message)}
          </div>
          <button
            type="submit"
            disabled={infoLoading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
            style={{ background: '#6aa84f' }}
          >
            {infoLoading ? '...' : 'Enregistrer'}
          </button>
        </form>
      </SettingsSection>

      {/* Email */}
      <SettingsSection
        title="Adresse email"
        description={`Actuel : ${user.email}`}
        icon={<Mail size={18} />}
      >
        <form onSubmit={emailForm.handleSubmit(handleEmail)} className="space-y-3">
          <div>
            <input
              type="email"
              {...emailForm.register('new_email')}
              placeholder="Nouvel email"
              className={inputCls}
            />
            {renderError(emailForm.formState.errors.new_email?.message)}
          </div>
          <div>
            <input
              type="password"
              {...emailForm.register('password')}
              placeholder="Mot de passe actuel"
              className={inputCls}
            />
            {renderError(emailForm.formState.errors.password?.message)}
          </div>
          <button
            type="submit"
            disabled={emailLoading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
            style={{ background: '#6aa84f' }}
          >
            {emailLoading ? '...' : 'Changer l’email'}
          </button>
        </form>
      </SettingsSection>

      {/* Username */}
      <SettingsSection
        title="Nom d’utilisateur"
        description={`Actuel : @${user.username}`}
        icon={<AtSign size={18} />}
      >
        <form
          onSubmit={usernameForm.handleSubmit(handleUsername)}
          className="space-y-3"
        >
          <div>
            <input
              {...usernameForm.register('new_username')}
              placeholder="Nouveau nom d’utilisateur"
              className={inputCls}
            />
            {renderError(usernameForm.formState.errors.new_username?.message)}
          </div>
          <div>
            <input
              type="password"
              {...usernameForm.register('password')}
              placeholder="Mot de passe actuel"
              className={inputCls}
            />
            {renderError(usernameForm.formState.errors.password?.message)}
          </div>
          <button
            type="submit"
            disabled={usernameLoading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
            style={{ background: '#6aa84f' }}
          >
            {usernameLoading ? '...' : 'Changer le nom'}
          </button>
        </form>
      </SettingsSection>

      {/* Password */}
      <SettingsSection
        title="Mot de passe"
        description="Choisis un mot de passe fort"
        icon={<KeyRound size={18} />}
      >
        <form onSubmit={pwdForm.handleSubmit(handlePassword)} className="space-y-3">
          <div>
            <input
              type="password"
              {...pwdForm.register('current_password')}
              placeholder="Mot de passe actuel"
              className={inputCls}
            />
            {renderError(pwdForm.formState.errors.current_password?.message)}
          </div>
          <div>
            <input
              type="password"
              {...pwdForm.register('new_password')}
              placeholder="Nouveau mot de passe"
              className={inputCls}
            />
            {renderError(pwdForm.formState.errors.new_password?.message)}
          </div>
          <div>
            <input
              type="password"
              {...pwdForm.register('confirm_password')}
              placeholder="Confirmer le nouveau mot de passe"
              className={inputCls}
            />
            {renderError(pwdForm.formState.errors.confirm_password?.message)}
          </div>
          <button
            type="submit"
            disabled={pwdLoading}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
            style={{ background: '#6aa84f' }}
          >
            {pwdLoading ? '...' : 'Changer le mot de passe'}
          </button>
        </form>
      </SettingsSection>

      {/* Désactivation */}
      <SettingsSection
        title="Désactiver le compte"
        description="Ton compte sera masqué mais conservé. Tu pourras le réactiver en te reconnectant."
        icon={<Info size={18} />}
        danger
      >
        <textarea
          value={deactivateReason}
          onChange={(e) => setDeactivateReason(e.target.value)}
          placeholder="Raison (optionnel)"
          rows={3}
          className={inputCls + ' resize-none'}
        />
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="rounded-full px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition"
        >
          Désactiver mon compte
        </button>
      </SettingsSection>

      <ConfirmPasswordModal
        open={confirmOpen}
        title="Désactiver le compte"
        description="Confirme avec ton mot de passe. Tu seras déconnecté immédiatement."
        confirmLabel="Désactiver"
        loading={deactivateLoading}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeactivate}
      />
    </div>
  )
}