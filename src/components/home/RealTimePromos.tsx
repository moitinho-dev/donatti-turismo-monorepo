'use client'

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"
import { ArrowRight, Calendar, Clock3, MapPin, Plane, SlidersHorizontal, Star, UtensilsCrossed } from "lucide-react"

type SiteSection = string

interface PromoData {
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
}

type CategoryFilter = SiteSection | "todas"

const knownLabels: Record<string, string> = {
  nacionais: "Pacotes Nacionais",
  internacionais: "Pacotes Internacionais",
  cruzeiros: "Cruzeiros",
  "lua-de-mel": "Lua de Mel",
  religioso: "Turismo Religioso",
  nordeste: "Nordeste",
}

const getSectionLabel = (section?: string | null) => {
  if (!section) return "Pacote"
  if (knownLabels[section]) return knownLabels[section]
  return section.charAt(0).toUpperCase() + section.slice(1)
}

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

const formatInstallment = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const getDepartureCities = (promo: PromoData) => {
  if (promo.SITE_DEPARTURES && promo.SITE_DEPARTURES.length) return promo.SITE_DEPARTURES
  const cities: string[] = []
  if (promo.CG) cities.push("Campo Grande")
  if (promo.SP) cities.push("São Paulo")
  return cities.length ? cities : ["Consulte"]
}

const getPriceNumber = (valor: string) => {
  const raw = String(valor ?? "").trim()
  if (!raw) return 0

  const cleaned = raw.replace(/[^\d.,-]/g, "")
  if (!cleaned) return 0

  if (cleaned.includes(".") && cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(/,/g, ".")
    const n = Number.parseFloat(normalized)
    return Number.isFinite(n) ? n : 0
  }

  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/,/g, ".")
    const n = Number.parseFloat(normalized)
    return Number.isFinite(n) ? n : 0
  }

  if (cleaned.includes(".")) {
    const parts = cleaned.split(".")
    if (parts.length > 2) {
      const normalized = parts.join("")
      const n = Number.parseFloat(normalized)
      return Number.isFinite(n) ? n : 0
    }

    if (parts.length === 2 && parts[1]?.length === 3 && (parts[0]?.length ?? 0) <= 3) {
      const normalized = parts.join("")
      const n = Number.parseFloat(normalized)
      return Number.isFinite(n) ? n : 0
    }
  }

  const n = Number.parseFloat(cleaned)
  if (Number.isFinite(n)) return n

  const digitsOnly = cleaned.replace(/[^\d-]/g, "")
  const fallback = Number.parseFloat(digitsOnly)
  return Number.isFinite(fallback) ? fallback : 0
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

export default function RealTimePromos({ searchQuery = "", onNoResults, limit = 12 }: RealTimePromosProps) {
  const [promos, setPromos] = useState<PromoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todas")
  const [priceFilter, setPriceFilter] = useState("all")
  const [durationFilter, setDurationFilter] = useState("all")
  const [departureFilter, setDepartureFilter] = useState("Todas as saídas")

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/promos/public?limit=${encodeURIComponent(String(limit))}`)
        if (res.ok) {
          const data = await res.json()
          const normalized = data.map((p: PromoData) => ({
            ...p,
            SITE_SECTION: p.SITE_SECTION || "nacionais",
            SITE_SLUG: p.SITE_SLUG || `${slugify(p.DESTINO)}-${p.id?.slice(0, 6)}`,
          }))
          setPromos(normalized)
        } else {
          setPromos([])
        }
      } catch (err) {
        console.error("Erro ao buscar promos públicas", err)
        setPromos([])
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [limit])

  const departuresList = useMemo(() => {
    const cities = promos.flatMap((promo) => getDepartureCities(promo))
    return ["Todas as saídas", ...Array.from(new Set(cities))]
  }, [promos])

  const filteredPackages = useMemo(() => {
    return promos.filter((pkg) => {
      if (!pkg.SITE_SECTION) return false
      const matchCategory = categoryFilter === "todas" ? true : pkg.SITE_SECTION === categoryFilter
      const query = searchQuery.toLowerCase()
      const matchSearch =
        !query ||
        pkg.DESTINO.toLowerCase().includes(query) ||
        pkg.HOTEL.toLowerCase().includes(query) ||
        (pkg.SITE_DESCRIPTION || "").toLowerCase().includes(query)

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

      const departures = getDepartureCities(pkg)
      const matchDeparture =
        departureFilter === "Todas as saídas" ? true : departures.includes(departureFilter)

      return matchCategory && matchSearch && matchPrice && matchDuration && matchDeparture
    })
  }, [promos, categoryFilter, searchQuery, priceFilter, durationFilter, departureFilter])

  const categoriesToRender = useMemo(() => {
    const sections = Array.from(new Set(promos.map((p) => p.SITE_SECTION).filter(Boolean))) as string[]
    return categoryFilter === "todas" ? sections : sections.filter((c) => c === categoryFilter)
  }, [categoryFilter, promos])

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Carregando ofertas em tempo real...</p>
      </div>
    )
  }

  if (filteredPackages.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg text-gray-700 mb-4">
          {searchQuery ? `Não encontramos pacotes para "${searchQuery}" no momento.` : "Nenhum pacote disponível agora."}
        </p>
        {searchQuery && onNoResults && (
          <Button
            onClick={() => onNoResults(searchQuery)}
            className="bg-[#25D366] text-white hover:bg-[#20BA5A] font-semibold min-h-[44px] px-8"
          >
            Montar orçamento personalizado
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {Array.from(new Set(promos.map((p) => p.SITE_SECTION).filter(Boolean))).map((cat) => (
            <button
              key={cat as string}
              onClick={() => {
                setCategoryFilter(cat as string)
                const section = document.getElementById(`pacotes-${cat}`)
                if (section) section.scrollIntoView({ behavior: "smooth" })
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                categoryFilter === cat ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {getSectionLabel(cat as string)}
            </button>
          ))}
          <button
            onClick={() => setCategoryFilter("todas")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              categoryFilter === "todas" ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Todas
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <SlidersHorizontal className="h-4 w-4" />
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
            >
              {priceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <Clock3 className="h-4 w-4" />
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
            >
              {durationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <Plane className="h-4 w-4" />
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={departureFilter}
              onChange={(e) => setDepartureFilter(e.target.value)}
            >
              {departuresList.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {categoriesToRender.map((cat) => {
        const items = filteredPackages.filter((pkg) => pkg.SITE_SECTION === cat)
        if (items.length === 0) return null

        return (
          <div key={cat} id={`pacotes-${cat}`} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary font-semibold">{getSectionLabel(cat)}</p>
                <h3 className="text-2xl font-bold text-gray-900">Seleção de {items.length} pacotes</h3>
              </div>
              <Link href="/destinos" className="text-sm text-primary hover:underline">
                Ver todos os destinos
              </Link>
            </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((pkg) => {
              const total = getPriceNumber(pkg.VALOR)
              const parcelas =
                typeof pkg.PARCELAS === "number" ? pkg.PARCELAS : Number.parseInt(String(pkg.PARCELAS ?? "15"), 10) || 15
              const installment = parcelas > 0 ? total / parcelas : total
              const departures = getDepartureCities(pkg).join(", ")
              const slugLink = pkg.SITE_SLUG ? `/pacotes/${pkg.SITE_SLUG}` : undefined

              return (
                <article
                  key={pkg.id}
                  className="group overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  {slugLink ? (
                    <Link
                      href={slugLink}
                      onClick={() =>
                        trackEvent("select_package", {
                          package_slug: pkg.SITE_SLUG || "sem-slug",
                          package_category: pkg.SITE_SECTION,
                          destination: pkg.DESTINO,
                        })
                      }
                      className="relative block h-64 w-full overflow-hidden"
                      aria-label={`Ver detalhes do pacote ${pkg.DESTINO}`}
                    >
                      <img
                        src={pkg.SITE_IMAGE || "/images/hero-beach.jpg"}
                        alt={pkg.DESTINO}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-[#FFA000] px-4 py-1 text-xs font-semibold text-white shadow-md">Oferta</span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-sm font-semibold drop-shadow">
                        <MapPin className="h-5 w-5" />
                        {pkg.DESTINO}
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow">
                          <Star className="h-4 w-4 text-[#FFA000]" />
                          4.8
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="relative h-64 w-full overflow-hidden">
                      <img
                        src={pkg.SITE_IMAGE || "/images/hero-beach.jpg"}
                        alt={pkg.DESTINO}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-[#FFA000] px-4 py-1 text-xs font-semibold text-white shadow-md">Oferta</span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-sm font-semibold drop-shadow">
                        <MapPin className="h-5 w-5" />
                        {pkg.DESTINO}
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow">
                          <Star className="h-4 w-4 text-[#FFA000]" />
                          4.8
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    <div>
                      {slugLink ? (
                        <Link
                          href={slugLink}
                          onClick={() =>
                            trackEvent("select_package", {
                              package_slug: pkg.SITE_SLUG || "sem-slug",
                              package_category: pkg.SITE_SECTION,
                              destination: pkg.DESTINO,
                              element: "title",
                            })
                          }
                          className="text-2xl font-bold text-gray-900 hover:text-primary transition-colors"
                        >
                          {pkg.DESTINO}
                        </Link>
                      ) : (
                        <h4 className="text-2xl font-bold text-gray-900">{pkg.DESTINO}</h4>
                      )}
                      <p className="text-sm text-gray-600">{pkg.HOTEL}</p>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Saída: {pkg.DATA_FORMATADA}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pkg.ALL_INCLUSIVE && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            All Inclusive
                          </span>
                        )}
                        {pkg.NUMERO_DE_NOITES && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {pkg.NUMERO_DE_NOITES} noites
                          </span>
                        )}
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          Saída: {departures}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-semibold text-[#F5A524]">$</span>
                        <span className="text-4xl font-extrabold text-[#F5A524] leading-tight">{formatInstallment(installment)}</span>
                      </div>
                      <p className="text-xs text-gray-500">{parcelas}x sem juros</p>
                    </div>

                    <Button
                      asChild
                      className="w-full rounded-full bg-[#FFA000] text-white hover:bg-[#e58f00] h-12 text-sm font-semibold"
                      onClick={() =>
                        trackEvent("whatsapp_click", {
                          location: "package_card",
                          package_slug: pkg.SITE_SLUG || "sem-slug",
                          package_category: pkg.SITE_SECTION,
                        })
                      }
                    >
                      <a
                        href={`https://wa.me/5567992167694?text=${encodeURIComponent(
                          `Olá! Quero um orçamento para o pacote ${pkg.DESTINO} (${pkg.DATA_FORMATADA}), saindo de ${departures}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Quero saber mais
                      </a>
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )
      })}
    </div>
  )
}
