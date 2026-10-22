'use client'

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trackEvent, trackLead } from "@/lib/analytics"
import { getSectionLabel, getPriceNumber, slugify } from "@/lib/utils"
import { Calendar, Clock3, MapPin, Moon, Plane, SlidersHorizontal, UtensilsCrossed, Zap } from "lucide-react"

type SiteSection = string

export interface PublicPromo {
  id: string
  DATA_FORMATADA: string
  DESTINO: string
  HOTEL: string
  VALOR: string
  PARCELAS?: number
  COM_CAFE?: boolean
  SEM_CAFE?: boolean
  MEIA_PENSAO?: boolean
  PENSAO_COMPLETA?: boolean
  ALL_INCLUSIVE?: boolean
  NUMERO_DE_NOITES?: string
  SP?: boolean
  CG?: boolean
  AEREO?: boolean
  SITE_SECTION?: SiteSection | null
  SITE_SLUG?: string | null
  SITE_IMAGE?: string | null
  SITE_DESCRIPTION?: string | null
  SITE_INCLUSIONS?: string[]
  SITE_DEPARTURES?: string[]
}

interface RealTimePromosProps {
  searchQuery?: string
  onNoResults?: (query: string) => void
  limit?: number
  /** Promos já carregadas pela página; se ausente, o componente busca sozinho */
  promos?: PublicPromo[] | null
  /** Destaca os cards como ofertas da Black Friday */
  blackFriday?: boolean
}

type CategoryFilter = SiteSection | "todas"

const FALLBACK_IMAGE = "/images/hero-beach.jpg"
const WHATSAPP_NUMBER = "5567992167694"

const priceOptions = [
  { value: "all", label: "Todos os preços" },
  { value: "até-5000", label: "Até R$ 5.000" },
  { value: "5000-8000", label: "R$ 5.000 a R$ 8.000" },
  { value: "8000+", label: "Acima de R$ 8.000" },
]

const durationOptions = [
  { value: "all", label: "Qualquer duração" },
  { value: "ate-5", label: "Até 5 noites" },
  { value: "6-8", label: "6 a 8 noites" },
  { value: "9+", label: "9+ noites" },
]

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

export const getRegimeLabel = (promo: PublicPromo) => {
  if (promo.ALL_INCLUSIVE) return "All inclusive"
  if (promo.PENSAO_COMPLETA) return "Pensão completa"
  if (promo.MEIA_PENSAO) return "Meia pensão"
  if (promo.COM_CAFE) return "Café da manhã"
  if (promo.SEM_CAFE) return "Sem refeições"
  return null
}

export const getDepartureCities = (promo: PublicPromo) => {
  if (promo.SITE_DEPARTURES && promo.SITE_DEPARTURES.length) return promo.SITE_DEPARTURES
  const cities: string[] = []
  if (promo.CG) cities.push("Campo Grande")
  if (promo.SP) cities.push("São Paulo")
  return cities.length ? cities : ["Consulte"]
}

const getParcelas = (promo: PublicPromo) =>
  typeof promo.PARCELAS === "number" ? promo.PARCELAS : Number.parseInt(String(promo.PARCELAS ?? "10"), 10) || 10

/** Texto pesquisável do pacote, incluindo atributos ("all inclusive", "com aereo", seção, saídas) */
const searchableText = (pkg: PublicPromo) =>
  normalize(
    [
      pkg.DESTINO,
      pkg.HOTEL,
      pkg.SITE_DESCRIPTION,
      getSectionLabel(pkg.SITE_SECTION),
      getRegimeLabel(pkg),
      pkg.AEREO ? "com aereo aereo incluso voo" : "",
      getDepartureCities(pkg).join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  )

export function usePublicPromos(limit = 12, enabled = true) {
  const [promos, setPromos] = useState<PublicPromo[] | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetch(`/api/promos/public?limit=${encodeURIComponent(String(limit))}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PublicPromo[]) => {
        if (cancelled) return
        setPromos(
          (Array.isArray(data) ? data : []).map((p) => ({
            ...p,
            SITE_SECTION: p.SITE_SECTION || "nacionais",
            SITE_SLUG: p.SITE_SLUG || `${slugify(p.DESTINO)}-${p.id?.slice(0, 6)}`,
          })),
        )
      })
      .catch((err) => {
        console.error("Erro ao buscar promos públicas", err)
        if (!cancelled) setPromos([])
      })
    return () => {
      cancelled = true
    }
  }, [limit, enabled])

  return promos
}

export default function RealTimePromos({
  searchQuery = "",
  onNoResults,
  limit = 12,
  promos: promosProp,
  blackFriday = false,
}: RealTimePromosProps) {
  const fetched = usePublicPromos(limit, promosProp === undefined)
  const promos = promosProp === undefined ? fetched : promosProp
  const isLoading = promos === null

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todas")
  const [priceFilter, setPriceFilter] = useState("all")
  const [durationFilter, setDurationFilter] = useState("all")
  const [departureFilter, setDepartureFilter] = useState("Todas as saídas")
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<PublicPromo | null>(null)
  const [isSubmittingLead, setIsSubmittingLead] = useState(false)
  const [leadError, setLeadError] = useState<string | null>(null)
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "" })

  const list = useMemo(() => promos || [], [promos])

  const sections = useMemo(
    () => Array.from(new Set(list.map((p) => p.SITE_SECTION).filter(Boolean))) as string[],
    [list],
  )

  const departuresList = useMemo(() => {
    const cities = list.flatMap((promo) => getDepartureCities(promo))
    return ["Todas as saídas", ...Array.from(new Set(cities))]
  }, [list])

  const filteredPackages = useMemo(() => {
    const terms = normalize(searchQuery).split(/\s+/).filter(Boolean)
    return list.filter((pkg) => {
      const matchCategory = categoryFilter === "todas" || pkg.SITE_SECTION === categoryFilter
      const text = searchableText(pkg)
      const matchSearch = terms.every((term) => text.includes(term))

      const price = getPriceNumber(pkg.VALOR)
      let matchPrice = true
      if (priceFilter === "até-5000") matchPrice = price <= 5000
      if (priceFilter === "5000-8000") matchPrice = price > 5000 && price <= 8000
      if (priceFilter === "8000+") matchPrice = price > 8000

      const nights = parseInt(pkg.NUMERO_DE_NOITES || "0", 10)
      let matchDuration = true
      if (durationFilter === "ate-5") matchDuration = nights <= 5
      if (durationFilter === "6-8") matchDuration = nights >= 6 && nights <= 8
      if (durationFilter === "9+") matchDuration = nights >= 9

      const matchDeparture = departureFilter === "Todas as saídas" || getDepartureCities(pkg).includes(departureFilter)

      return matchCategory && matchSearch && matchPrice && matchDuration && matchDeparture
    })
  }, [list, categoryFilter, searchQuery, priceFilter, durationFilter, departureFilter])

  const categoriesToRender = categoryFilter === "todas" ? sections : sections.filter((c) => c === categoryFilter)

  const hasActiveFilters =
    categoryFilter !== "todas" || priceFilter !== "all" || durationFilter !== "all" || departureFilter !== "Todas as saídas"

  const clearFilters = () => {
    setCategoryFilter("todas")
    setPriceFilter("all")
    setDurationFilter("all")
    setDepartureFilter("Todas as saídas")
  }

  const buildWhatsAppUrl = (pkg: PublicPromo, name?: string) => {
    const departures = getDepartureCities(pkg).join(", ")
    const intro = name ? `Olá! Sou ${name}.` : "Olá!"
    const campaign = blackFriday ? " da Black Friday" : ""
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      `${intro} Quero a oferta${campaign} para ${pkg.DESTINO} (${pkg.DATA_FORMATADA}), saindo de ${departures}. Ainda tem disponibilidade?`,
    )}`
  }

  const openLeadModal = (pkg: PublicPromo) => {
    setSelectedPackage(pkg)
    setLeadError(null)
    setLeadForm({ name: "", phone: "", email: "" })
    setIsLeadModalOpen(true)
    trackEvent("cta_click", {
      location: "package_card",
      package_slug: pkg.SITE_SLUG || "sem-slug",
      package_category: pkg.SITE_SECTION,
      destination: pkg.DESTINO,
      campaign: blackFriday ? "black_friday" : undefined,
    })
  }

  const handleSubmitLead = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedPackage) return

    if (!leadForm.name.trim() || leadForm.phone.replace(/\D/g, "").length < 10) {
      setLeadError("Informe seu nome e um WhatsApp com DDD.")
      return
    }

    setIsSubmittingLead(true)
    setLeadError(null)

    const source = blackFriday ? "black_friday_card" : "realtime_promos_whatsapp"
    const payload = {
      name: leadForm.name.trim(),
      phone: leadForm.phone.trim(),
      email: leadForm.email.trim(),
      source,
      destino: selectedPackage.DESTINO,
      hotel: selectedPackage.HOTEL,
      promoDetails: `${selectedPackage.DATA_FORMATADA} | ${selectedPackage.VALOR} | ${selectedPackage.SITE_SECTION}`,
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error("Erro ao salvar lead")
      }

      trackLead({
        name: payload.name,
        phone: payload.phone,
        email: payload.email || "nao-informado@lead.local",
        destination: payload.destino,
        period: payload.promoDetails,
        source: payload.source,
      })

      trackEvent("whatsapp_click", {
        location: "package_card_after_lead",
        package_slug: selectedPackage.SITE_SLUG || "sem-slug",
        package_category: selectedPackage.SITE_SECTION,
        destination: selectedPackage.DESTINO,
      })

      window.open(buildWhatsAppUrl(selectedPackage, payload.name), "_blank", "noopener,noreferrer")
      setIsLeadModalOpen(false)
      setLeadForm({ name: "", phone: "", email: "" })
      setSelectedPackage(null)
    } catch (err) {
      console.error(err)
      setLeadError("Não conseguimos enviar agora. Tente de novo ou chame direto no WhatsApp.")
    } finally {
      setIsSubmittingLead(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando ofertas">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-sm">
            <div className="h-56 animate-pulse bg-gray-200" />
            <div className="space-y-3 p-6">
              <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
              <div className="h-10 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-12 w-full animate-pulse rounded-full bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="mb-4 text-lg text-gray-700">
          {blackFriday
            ? "As ofertas da Black Friday estão sendo carregadas pela nossa equipe. Chame no WhatsApp e receba em primeira mão."
            : "Estamos atualizando as ofertas. Chame no WhatsApp e montamos um pacote para você."}
        </p>
        {onNoResults && (
          <Button
            onClick={() => onNoResults(searchQuery)}
            className="min-h-[44px] bg-[#25D366] px-8 font-semibold text-white hover:bg-[#20BA5A]"
          >
            Falar com uma especialista
          </Button>
        )}
      </div>
    )
  }

  const selectClass =
    "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {[{ value: "todas", label: "Todas" }, ...sections.map((s) => ({ value: s, label: getSectionLabel(s) }))].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategoryFilter(opt.value)}
              aria-pressed={categoryFilter === opt.value}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                categoryFilter === opt.value ? "bg-gray-900 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3 sm:gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Preço</span>
            <select className={selectClass} value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
              {priceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Duração</span>
            <select className={selectClass} value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)}>
              {durationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <Plane className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Cidade de saída</span>
            <select className={selectClass} value={departureFilter} onChange={(e) => setDepartureFilter(e.target.value)}>
              {departuresList.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredPackages.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-lg text-gray-700">
            {searchQuery
              ? `Ainda não temos oferta publicada para "${searchQuery}". Nossa equipe cota para você.`
              : "Nenhum pacote com esses filtros."}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="min-h-[44px]">
                Limpar filtros
              </Button>
            )}
            {searchQuery && onNoResults && (
              <Button
                onClick={() => onNoResults(searchQuery)}
                className="min-h-[44px] bg-[#25D366] px-8 font-semibold text-white hover:bg-[#20BA5A]"
              >
                Pedir cotação de {searchQuery}
              </Button>
            )}
          </div>
        </div>
      )}

      {categoriesToRender.map((cat) => {
        const items = filteredPackages.filter((pkg) => pkg.SITE_SECTION === cat)
        if (items.length === 0) return null

        return (
          <div key={cat} id={`pacotes-${cat}`} className="scroll-mt-24 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {getSectionLabel(cat)} <span className="text-base font-medium text-gray-500">({items.length})</span>
              </h3>
              <Link href="/destinos" className="shrink-0 text-sm text-primary hover:underline">
                Ver destinos
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((pkg) => {
                const total = getPriceNumber(pkg.VALOR)
                const parcelas = getParcelas(pkg)
                const installment = parcelas > 0 ? total / parcelas : total
                const departures = getDepartureCities(pkg).join(" e ")
                const regime = getRegimeLabel(pkg)
                const slugLink = pkg.SITE_SLUG ? `/pacotes/${pkg.SITE_SLUG}` : undefined
                const trackSelect = (element: string) =>
                  trackEvent("select_package", {
                    package_slug: pkg.SITE_SLUG || "sem-slug",
                    package_category: pkg.SITE_SECTION,
                    destination: pkg.DESTINO,
                    element,
                  })

                const media = (
                  <>
                    <img
                      src={pkg.SITE_IMAGE || FALLBACK_IMAGE}
                      alt={`Foto de ${pkg.DESTINO}`}
                      loading="lazy"
                      onError={(e) => {
                        if (!e.currentTarget.src.endsWith(FALLBACK_IMAGE)) e.currentTarget.src = FALLBACK_IMAGE
                      }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute left-3 top-3">
                      {blackFriday ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#FED400] shadow-md">
                          <Zap className="h-3.5 w-3.5 fill-[#FED400]" aria-hidden="true" />
                          Black Friday
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#FFA000] px-3 py-1 text-xs font-semibold text-white shadow-md">Oferta</span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-sm font-semibold text-white drop-shadow">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">Saindo de {departures}</span>
                    </div>
                  </>
                )

                return (
                  <article
                    key={pkg.id}
                    className="group flex flex-col overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    {slugLink ? (
                      <Link
                        href={slugLink}
                        onClick={() => trackSelect("image")}
                        className="relative block h-56 w-full overflow-hidden"
                        aria-label={`Ver detalhes do pacote ${pkg.DESTINO}`}
                      >
                        {media}
                      </Link>
                    ) : (
                      <div className="relative h-56 w-full overflow-hidden">{media}</div>
                    )}

                    <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                      <div>
                        {slugLink ? (
                          <Link
                            href={slugLink}
                            onClick={() => trackSelect("title")}
                            className="text-xl font-bold text-gray-900 transition-colors hover:text-primary sm:text-2xl"
                          >
                            {pkg.DESTINO}
                          </Link>
                        ) : (
                          <h4 className="text-xl font-bold text-gray-900 sm:text-2xl">{pkg.DESTINO}</h4>
                        )}
                        <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">{pkg.HOTEL}</p>
                      </div>

                      <ul className="flex flex-wrap gap-2 text-xs font-semibold text-gray-700">
                        <li className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                          {pkg.DATA_FORMATADA}
                        </li>
                        {pkg.NUMERO_DE_NOITES && (
                          <li className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                            <Moon className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                            {pkg.NUMERO_DE_NOITES} noites
                          </li>
                        )}
                        {pkg.AEREO && (
                          <li className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                            <Plane className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                            Aéreo incluso
                          </li>
                        )}
                        {regime && (
                          <li className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                            <UtensilsCrossed className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                            {regime}
                          </li>
                        )}
                      </ul>

                      <div className="mt-auto">
                        <p className="text-xs text-gray-500">{parcelas}x de</p>
                        <p className="text-3xl font-extrabold leading-tight text-[#F5A524] sm:text-4xl">{formatBRL(installment)}</p>
                        <p className="text-xs text-gray-500">ou {formatBRL(total)} por pessoa</p>
                      </div>

                      <Button
                        className={`h-12 w-full rounded-full text-sm font-bold ${
                          blackFriday ? "bg-black text-[#FED400] hover:bg-gray-900" : "bg-[#FFA000] text-white hover:bg-[#e58f00]"
                        }`}
                        onClick={() => openLeadModal(pkg)}
                      >
                        {blackFriday ? "Garantir esta oferta" : "Quero esta viagem"}
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )
      })}

      <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{blackFriday ? "Garanta sua oferta" : "Falar com uma especialista"}</DialogTitle>
            <DialogDescription>
              Deixe seu contato para confirmarmos disponibilidade e tarifa desta data. Em seguida abrimos o WhatsApp com a
              oferta já preenchida.
            </DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{selectedPackage.DESTINO}</p>
              <p>{selectedPackage.DATA_FORMATADA}</p>
              <p>{selectedPackage.HOTEL}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmitLead}>
            <div className="space-y-2">
              <Label htmlFor="lead-name">Nome *</Label>
              <Input
                id="lead-name"
                autoComplete="name"
                value={leadForm.name}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Como podemos te chamar?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-phone">WhatsApp com DDD *</Label>
              <Input
                id="lead-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={leadForm.phone}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(67) 99999-9999"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-email">E-mail (opcional)</Label>
              <Input
                id="lead-email"
                type="email"
                autoComplete="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="voce@exemplo.com"
              />
            </div>

            {leadError && <p className="text-sm text-red-600">{leadError}</p>}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsLeadModalOpen(false)} disabled={isSubmittingLead}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#25D366] text-white hover:bg-[#20BA5A]" disabled={isSubmittingLead}>
                {isSubmittingLead ? "Enviando..." : "Continuar no WhatsApp"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
