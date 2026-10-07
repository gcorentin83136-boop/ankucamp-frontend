import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Receipt,
  Loader,
  Euro,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Search,
} from 'lucide-react'
import paymentsApi from '../../service/api/payments.api'
import type { Payment } from '../../types/payment'
import StatCard from '../../components/seller/StatCard'

const ANKU = {
  green: '#6aa84f',
  greenDark: '#4a7a35',
  greenPale: '#f0f9e8',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition'

function formatEuro(v: string | number | null): string {
  if (v === null || v === undefined) return '0,00 €'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '0,00 €'
  return `${n.toFixed(2).replace('.', ',')} €`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function monthKey(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  } catch {
    return ''
  }
}

function monthLabel(key: string): string {
  if (!key) return '—'
  try {
    const [y, m] = key.split('-')
    const d = new Date(parseInt(y), parseInt(m) - 1, 1)
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  } catch {
    return key
  }
}

export default function SellerInvoices() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await paymentsApi.listSellerMine()
      setPayments(res.payments)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // Liste des mois disponibles (avec des paiements)
  const months = useMemo(() => {
    const set = new Set<string>()
    payments.forEach((p) => {
      const k = monthKey(p.created_at)
      if (k) set.add(k)
    })
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [payments])

  // Total prélevé toutes périodes
  const totalAll = useMemo(() => {
    return payments.reduce(
      (sum, p) => sum + parseFloat(p.application_fee_amount ?? '0'),
      0
    )
  }, [payments])

  // Total du mois en cours
  const totalThisMonth = useMemo(() => {
    const current = monthKey(new Date().toISOString())
    return payments
      .filter((p) => monthKey(p.created_at) === current)
      .reduce(
        (sum, p) => sum + parseFloat(p.application_fee_amount ?? '0'),
        0
      )
  }, [payments])

  // Total mois dernier
  const totalLastMonth = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    const last = monthKey(d.toISOString())
    return payments
      .filter((p) => monthKey(p.created_at) === last)
      .reduce(
        (sum, p) => sum + parseFloat(p.application_fee_amount ?? '0'),
        0
      )
  }, [payments])

  // CA total généré (montant TTC des ventes)
  const totalCA = useMemo(() => {
    return payments.reduce(
      (sum, p) => sum + parseFloat(p.amount_ttc ?? '0'),
      0
    )
  }, [payments])

  // Filtres
  const filtered = useMemo(() => {
    let list = payments
    if (monthFilter !== 'all') {
      list = list.filter((p) => monthKey(p.created_at) === monthFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          String(p.order_id).includes(q) ||
          (p.stripe_payment_intent ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [payments, monthFilter, search])

  // Export PDF
  const [exporting, setExporting] = useState(false)
  const handleExportPDF = async () => {
    if (filtered.length === 0) {
      toast.error('Aucune facture à exporter')
      return
    }
    setExporting(true)
    try {
      await paymentsApi.exportPdf(monthFilter)
      toast.success('PDF téléchargé ✅')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur export PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, ${ANKU.greenPale} 0%, #ffffff 100%)`,
          border: `1px solid ${ANKU.green}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <Receipt size={20} style={{ color: ANKU.greenDark }} />
          <h2 className="text-lg font-bold text-gray-900">
            Mes factures ANKU
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Récap des commissions de <strong>2,5%</strong> prélevées par ANKU sur
          tes ventes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Ce mois-ci"
          value={formatEuro(totalThisMonth)}
          icon={<Euro size={18} />}
          hint="Commissions prélevées"
        />
        <StatCard
          label="Mois dernier"
          value={formatEuro(totalLastMonth)}
          icon={<Calendar size={18} />}
        />
        <StatCard
          label="Total commissions"
          value={formatEuro(totalAll)}
          icon={<TrendingUp size={18} />}
          hint={`${payments.length} vente${payments.length > 1 ? 's' : ''}`}
        />
        <StatCard
          label="CA total généré"
          value={formatEuro(totalCA)}
          icon={<Receipt size={18} />}
          hint="Avant commission"
        />
      </div>

      {/* Filtres */}
      <div className="rounded-2xl p-4 border border-gray-200 bg-white space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par commande ou transaction…"
            className={inputCls + ' !pl-10'}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-sm text-gray-500 shrink-0">
              <Filter size={14} />
              <span className="font-semibold">Mois :</span>
            </div>
            <button
              type="button"
              onClick={() => setMonthFilter('all')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                monthFilter === 'all'
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                background: monthFilter === 'all' ? ANKU.green : '#f3f4f6',
              }}
            >
              Tous
            </button>
            {months.slice(0, 6).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonthFilter(m)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  monthFilter === m
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{
                  background: monthFilter === m ? ANKU.green : '#f3f4f6',
                }}
              >
                {monthLabel(m)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exporting}
            className="rounded-full px-4 py-2 text-sm font-bold text-white transition flex items-center gap-2 shrink-0 disabled:opacity-50"
            style={{ background: ANKU.green }}
          >
            {exporting ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Exporter en PDF
          </button>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 text-center">
          <Loader size={20} className="animate-spin text-gray-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-200 text-center">
          <Receipt size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            {payments.length === 0
              ? 'Aucune vente pour l’instant'
              : 'Aucune facture dans ce filtre'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          {/* Header tableau */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wide text-gray-500">
            <div className="col-span-2">Commande</div>
            <div className="col-span-3">Date</div>
            <div className="col-span-2 text-right">Montant vente</div>
            <div className="col-span-3 text-right">Commission ANKU (2,5%)</div>
            <div className="col-span-2 text-right">Tu as reçu</div>
          </div>

          {/* Lignes */}
          <div className="divide-y divide-gray-100">
            {filtered.map((p) => {
              const fee = parseFloat(p.application_fee_amount ?? '0')
              const sellerAmount = parseFloat(
                p.seller_amount ?? String(parseFloat(p.amount_ttc) - fee)
              )
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 px-4 py-3 hover:bg-gray-50 transition text-sm"
                >
                  {/* Commande */}
                  <div className="sm:col-span-2 flex sm:block items-center gap-2">
                    <span className="sm:hidden text-[10px] uppercase text-gray-400 font-bold w-24 shrink-0">
                      Commande
                    </span>
                    <span
                      className="font-mono font-bold text-sm px-2 py-1 rounded-lg"
                      style={{
                        background: ANKU.greenPale,
                        color: ANKU.greenDark,
                      }}
                    >
                      #{p.order_id}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="sm:col-span-3 flex sm:block items-center gap-2">
                    <span className="sm:hidden text-[10px] uppercase text-gray-400 font-bold w-24 shrink-0">
                      Date
                    </span>
                    <span className="text-gray-700">
                      {formatDate(p.created_at)}
                    </span>
                  </div>

                  {/* Montant vente */}
                  <div className="sm:col-span-2 flex sm:block items-center justify-between sm:text-right">
                    <span className="sm:hidden text-[10px] uppercase text-gray-400 font-bold">
                      Montant vente
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatEuro(p.amount_ttc)}
                    </span>
                  </div>

                  {/* Commission */}
                  <div className="sm:col-span-3 flex sm:block items-center justify-between sm:text-right">
                    <span className="sm:hidden text-[10px] uppercase text-gray-400 font-bold">
                      Commission ANKU
                    </span>
                    <span className="font-bold text-red-600">
                      -{formatEuro(fee)}
                    </span>
                  </div>

                  {/* Reçu */}
                  <div className="sm:col-span-2 flex sm:block items-center justify-between sm:text-right">
                    <span className="sm:hidden text-[10px] uppercase text-gray-400 font-bold">
                      Tu as reçu
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: ANKU.greenDark }}
                    >
                      {formatEuro(sellerAmount)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total du filtre */}
          {filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-t-2 border-gray-200 text-sm font-bold">
              <div className="sm:col-span-5 text-gray-700">
                Total {monthFilter !== 'all' ? monthLabel(monthFilter) : 'général'}{' '}
                ({filtered.length} vente{filtered.length > 1 ? 's' : ''})
              </div>
              <div className="sm:col-span-2 sm:text-right text-gray-900">
                {formatEuro(
                  filtered.reduce(
                    (s, p) => s + parseFloat(p.amount_ttc ?? '0'),
                    0
                  )
                )}
              </div>
              <div className="sm:col-span-3 sm:text-right text-red-600">
                -
                {formatEuro(
                  filtered.reduce(
                    (s, p) =>
                      s + parseFloat(p.application_fee_amount ?? '0'),
                    0
                  )
                )}
              </div>
              <div
                className="sm:col-span-2 sm:text-right"
                style={{ color: ANKU.greenDark }}
              >
                {formatEuro(
                  filtered.reduce(
                    (s, p) => s + parseFloat(p.seller_amount ?? '0'),
                    0
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info bas de page */}
      <div
        className="rounded-2xl p-4 border text-xs text-gray-600"
        style={{ borderColor: `${ANKU.green}33`, background: ANKU.greenPale }}
      >
        💡 <strong>Comment ça marche ?</strong> ANKU prélève automatiquement{' '}
        <strong>2,5%</strong> de commission sur chaque vente via Stripe Connect.
        Le reste est versé directement sur ton compte bancaire. Cette page te
        sert de récapitulatif pour ta comptabilité.
      </div>
    </div>
  )
}
