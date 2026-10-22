'use client'

/**
 * DONATTI TURISMO - Home
 * Layout do design system Donatti (src/styles/donatti-ds.css), com ícones Icons8 Pulsar.
 * Em Black Friday (esquenta / ao vivo) aparece só a faixa da campanha no topo.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { trackEvent, trackLead } from '@/lib/analytics'
import { getPriceNumber, getSectionLabel } from '@/lib/utils'
import {
  usePublicPromos,
  getDepartureCities,
  getRegimeLabel,
  type PublicPromo,
} from '@/components/home/RealTimePromos'
import { JsonLd } from '@/components/seo/JsonLd'
import { destinationHeading } from '@/lib/site'
import { Countdown } from '@/components/blackfriday/Countdown'
import {
  blackFriday,
  formatCampaignDate,
  getCountdownTarget,
  isBlackFridayActive,
  type BlackFridayPhase,
} from '@/config/blackFriday'

const WHATSAPP_NUMBER = '5567992167694'
const GOOGLE_REVIEWS_URL = 'https://maps.app.goo.gl/xuzhiYXCPC2VE9Tp8'
const FALLBACK_IMAGE = '/images/hero-beach.jpg'

const icon = {
  ui: (name: string) => `/icons/ui/${name}.png`,
  big: (name: string) => `/icons/destaque/${name}.png`,
}

const testimonials = [
  {
    name: 'Natalia Pamela',
    text: 'Viajo com a Donatti desde 2021, e só tive experiências maravilhosas: preço, atendimento, dúvidas todas esclarecidas. A Tati dá todo apoio e suporte, recomendo de olhos fechados!',
  },
  {
    name: 'Daniel Neves',
    text: 'O atendimento é mega diferenciado, você tem suporte VIP! Eles procuram as melhores opções baseado nas expectativas e no bolso do cliente. Super recomendo!',
  },
  {
    name: 'Milton César Machado',
    text: 'Tati e equipe nota 1000! Viajar com segurança e credibilidade é com a equipe da Tati! Muito obrigado! Até o ano que vem!',
  },
]

const steps = [
  { icon: 'search', title: 'Escolha a oferta', description: 'Filtre por destino, preço, duração ou cidade de saída.' },
  { icon: 'chat', title: 'Confirme no WhatsApp', description: 'Uma especialista confirma a disponibilidade da data e a tarifa do momento.' },
  { icon: 'luggage', title: 'Parcele e viaje', description: 'Fechamos a reserva com você e acompanhamos até a volta.' },
]

const trust = [
  { icon: 'customer-support', title: 'Atendimento humano', text: 'Especialista no WhatsApp, antes e durante a viagem.' },
  { icon: 'bank-card-front-side', title: 'Parcele no cartão', text: 'Pix e boleto também.' },
  { icon: 'shield', title: 'Agência com CNPJ', text: 'Av. Tamandaré, 8 · Campo Grande/MS.' },
  { icon: 'airplane-take-off', title: 'Saídas CGR e GRU', text: 'Outras cidades sob consulta.' },
]

const trendingDestinations = [
  { name: 'Nordeste', from: 'Porto de Galinhas, Maceió, Natal', img: '/images/home/porto-de-galinhas.jpg' },
  { name: 'Caribe', from: 'Punta Cana, Cancún, Aruba', img: '/images/home/caribe.jpg' },
  { name: 'Sudeste', from: 'Rio de Janeiro, Búzios, Arraial', img: '/images/home/rio-de-janeiro.jpg' },
  { name: 'América do Sul', from: 'Buenos Aires, Santiago, Bariloche', img: '/images/home/buenos-aires.jpg' },
]

const faqs = [
  { q: 'O valor mostrado é por pessoa?', a: 'Sim. O preço é por pessoa, e o valor da parcela usa o número de parcelas indicado no card.' },
  {
    q: 'Posso parcelar?',
    a: 'Sim. Cada oferta mostra em quantas vezes pode ser parcelada no cartão. Também aceitamos Pix e boleto; as condições são confirmadas no atendimento.',
  },
  {
    q: 'Não moro em Campo Grande nem em São Paulo. Posso comprar?',
    a: 'Pode. Nossas saídas principais são Campo Grande (CGR) e São Paulo (GRU), mas cotamos saídas de outras cidades pelo WhatsApp.',
  },
  {
    q: 'Não encontrei o destino que queria. E agora?',
    a: 'Chame no WhatsApp com o destino e as datas. Montamos uma cotação para você.',
  },
  {
    q: 'Como faço a reserva?',
    a: 'Toque no botão da oferta, deixe nome e WhatsApp e continue a conversa com a especialista. Ela confirma data e tarifa e finaliza a reserva com você.',
  },
]

/** Ícone da barra de categorias para cada seção do site */
const sectionIcons: Record<string, string> = {
  nacionais: 'beach',
  nordeste: 'palm-tree',
  internacionais: 'globe',
  cruzeiros: 'cruise-ship',
  'lua-de-mel': 'island-on-water',
  religioso: 'city-buildings',
}

const searchTabs = ['Pacotes', 'Hotéis', 'Cruzeiros', 'Roteiro sob medida']

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const formatInt = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value)

const getParcelas = (promo: PublicPromo) =>
  typeof promo.PARCELAS === 'number' ? promo.PARCELAS : Number.parseInt(String(promo.PARCELAS ?? '10'), 10) || 10

const searchableText = (pkg: PublicPromo) =>
  normalize(
    [
      pkg.DESTINO,
      pkg.HOTEL,
      pkg.SITE_DESCRIPTION,
      getSectionLabel(pkg.SITE_SECTION),
      getRegimeLabel(pkg),
      pkg.AEREO ? 'com aereo aereo incluso voo' : '',
      getDepartureCities(pkg).join(' '),
    ]
      .filter(Boolean)
      .join(' '),
  )

const emptyLead = { name: '', phone: '', destination: '', period: '' }

interface HomeLandingProps {
  phase: BlackFridayPhase
  /** Ofertas carregadas no servidor, para virem no HTML (SEO) */
  initialPromos?: PublicPromo[]
  /** Destinos com página própria, para os links internos do rodapé */
  destinations?: { name: string; slug: string }[]
}

export default function HomeLanding({ phase, initialPromos, destinations = [] }: HomeLandingProps) {
  const bf = isBlackFridayActive(phase)
  const countdownTarget = getCountdownTarget(phase)
  const endsAtLabel = formatCampaignDate(blackFriday.endsAt)

  const fetchedPromos = usePublicPromos(60, initialPromos === undefined)
  const promos = initialPromos ?? fetchedPromos
  const list = useMemo(() => promos || [], [promos])

  const [isMounted, setIsMounted] = useState(false)
  const [tab, setTab] = useState(searchTabs[0])
  const [query, setQuery] = useState('')
  const [departure, setDeparture] = useState('Todas')
  const [activeQuery, setActiveQuery] = useState('')
  const [category, setCategory] = useState('todos')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalPkg, setModalPkg] = useState<PublicPromo | null>(null)
  const [modalDestination, setModalDestination] = useState('')
  const [modalData, setModalData] = useState({ name: '', phone: '' })
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalSending, setModalSending] = useState(false)

  const [formData, setFormData] = useState(emptyLead)
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  useEffect(() => setIsMounted(true), [])

  const sections = useMemo(
    () => Array.from(new Set(list.map((p) => p.SITE_SECTION).filter(Boolean))) as string[],
    [list],
  )

  const categories = useMemo(() => {
    const items = [{ value: 'todos', label: 'Todos', icon: 'sparkles' }]
    if (list.some((p) => p.ALL_INCLUSIVE)) items.push({ value: 'all-inclusive', label: 'All inclusive', icon: 'palm-tree' })
    sections.forEach((s) =>
      items.push({ value: s, label: getSectionLabel(s).replace(/^Pacotes /, ''), icon: sectionIcons[s] || 'map-pin' }),
    )
    return items
  }, [list, sections])

  const offers = useMemo(() => {
    const terms = normalize(activeQuery).split(/\s+/).filter(Boolean)
    return list.filter((pkg) => {
      const matchCategory =
        category === 'todos' || (category === 'all-inclusive' ? !!pkg.ALL_INCLUSIVE : pkg.SITE_SECTION === category)
      const text = searchableText(pkg)
      const matchSearch = terms.every((term) => text.includes(term))
      const matchDeparture = departure === 'Todas' || getDepartureCities(pkg).includes(departure)
      return matchCategory && matchSearch && matchDeparture
    })
  }, [list, category, activeQuery, departure])

  const scrollToOffers = () => document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })

  const runSearch = (e: FormEvent) => {
    e.preventDefault()
    setActiveQuery(query)
    trackEvent('catalog_filter', { query, departure, tab })
    scrollToOffers()
  }

  const openLead = (location: string, pkg: PublicPromo | null = null, destination = '') => {
    setModalPkg(pkg)
    setModalDestination(pkg ? pkg.DESTINO : destination)
    setModalError(null)
    setModalOpen(true)
    if (pkg) {
      trackEvent('cta_click', {
        location: 'package_card',
        package_slug: pkg.SITE_SLUG || 'sem-slug',
        package_category: pkg.SITE_SECTION,
        destination: pkg.DESTINO,
      })
    } else {
      trackEvent('whatsapp_click', { location, query: destination || undefined })
    }
  }

  const handleModalSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!modalData.name.trim() || modalData.phone.replace(/\D/g, '').length < 10) {
      setModalError('Informe seu nome e um WhatsApp com DDD.')
      return
    }
    setModalSending(true)
    setModalError(null)
    const source = modalPkg ? 'realtime_promos_whatsapp' : modalDestination ? 'search_popup' : 'whatsapp_popup'
    const payload = {
      name: modalData.name.trim(),
      phone: modalData.phone.trim(),
      source,
      destino: modalDestination || undefined,
      hotel: modalPkg?.HOTEL,
      promoDetails: modalPkg ? `${modalPkg.DATA_FORMATADA} | ${modalPkg.VALOR} | ${modalPkg.SITE_SECTION}` : undefined,
    }
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      trackLead({
        name: payload.name,
        phone: payload.phone,
        email: 'nao-informado@lead.local',
        destination: payload.destino || 'geral',
        period: payload.promoDetails || '',
        source,
      })
    } catch (error) {
      console.error('Erro ao salvar lead:', error)
    }
    trackEvent('whatsapp_click', { location: 'modal', destino: modalDestination || 'geral' })
    const message = modalPkg
      ? `Olá! Sou ${payload.name}. Quero a oferta para ${modalPkg.DESTINO} (${modalPkg.DATA_FORMATADA}), saindo de ${getDepartureCities(
          modalPkg,
        ).join(', ')}. Ainda tem disponibilidade?`
      : modalDestination
        ? `Olá! Sou ${payload.name}. Quero uma cotação para ${modalDestination}.`
        : `Olá! Sou ${payload.name}. Quero receber as ofertas da Donatti.`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    setModalSending(false)
    setModalOpen(false)
    setModalPkg(null)
    setModalDestination('')
    setModalData({ name: '', phone: '' })
  }

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormStatus('sending')
    const source = 'contact_form'
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          destino: formData.destination,
          promoDetails: formData.period ? `Período: ${formData.period}` : undefined,
          source,
        }),
      })
      if (!res.ok) throw new Error('lead_error')
      setFormStatus('success')
      trackEvent('lead_form_submit', { source, destination: formData.destination, period: formData.period })
      setFormData(emptyLead)
    } catch (error) {
      console.error('Erro ao enviar:', error)
      setFormStatus('error')
    }
  }

  const modalText = modalPkg
    ? `Deixe nome e WhatsApp. A especialista já recebe que você quer ${modalPkg.DESTINO}.`
    : modalDestination
      ? `Deixe nome e WhatsApp. A especialista já recebe que você quer ${modalDestination}.`
      : 'Deixe nome e WhatsApp. Uma especialista te chama em minutos.'

  return (
    <div className="dt" style={{ minHeight: '100vh', background: 'var(--dt-bg)', color: 'var(--dt-ink)', fontFamily: 'var(--dt-font-sans)' }}>
      <a
        href="#ofertas"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[12000] focus:rounded focus:bg-white focus:px-4 focus:py-2"
      >
        Pular para as ofertas
      </a>

      {bf && countdownTarget && (
        <div className="dt-urgency" role="region" aria-label="Campanha Black Friday">
          <span>
            {phase === 'esquenta'
              ? 'Esquenta Black Friday Donatti: as ofertas abrem em'
              : `Black Friday Donatti: até 40% OFF em pacotes até ${endsAtLabel} · termina em`}
          </span>
          <Countdown target={countdownTarget} tone="light" size="sm" />
          <a href="#ofertas" style={{ color: 'inherit' }}>
            Ver ofertas
          </a>
        </div>
      )}

      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: '#ffffff', borderBottom: '1px solid var(--dt-border)' }}>
        <div className="dt-wrap" style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <a href="#topo" aria-label="Donatti Turismo, início" style={{ display: 'flex' }}>
            <img src="/images/home/logo-donatti.png" alt="Donatti Turismo" style={{ height: 40, width: 'auto' }} width={140} height={40} />
          </a>
          <nav className="dt-nav" aria-label="Principal">
            <a href="#ofertas">Pacotes</a>
            <a href="/destinos">Destinos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#duvidas">Dúvidas</a>
          </nav>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="dt-btn dt-btn--whatsapp" onClick={() => openLead('header')}>
              <img className="dt-ic" src={icon.ui('whatsapp')} alt="" />
              <span className="dt-hide-sm">Falar com especialista</span>
              <span className="sr-only">Falar no WhatsApp</span>
            </button>
            <a href="/destinos" className="dt-btn dt-btn--ghost dt-menu-btn" aria-label="Ver destinos" style={{ width: 44, padding: 0 }}>
              <img className="dt-ic" src={icon.ui('menu')} alt="" />
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section id="topo" aria-labelledby="hero-title" style={{ position: 'relative', padding: '72px 0 120px', overflow: 'hidden', background: 'var(--dt-brand-navy)' }}>
          <img src="/images/home/caribe.jpg" alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.65) 100%)' }}
          />
          <div className="dt-wrap" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span className="dt-eyebrow" style={{ color: 'var(--dt-brand-yellow)' }}>
                Saídas de Campo Grande e São Paulo
              </span>
              <h1 id="hero-title" className="dt-hero-h1">
                Sua próxima viagem, com aéreo e hotel, no cartão
              </h1>
              <p style={{ margin: 0, font: '400 18px/1.6 var(--dt-font-sans)', color: 'rgba(255,255,255,0.92)', maxWidth: 600 }}>
                Pacotes nacionais e internacionais escolhidos por especialistas. Você confirma tudo no WhatsApp com uma pessoa de verdade.
              </p>
            </div>

            <form className="dt-search" role="search" aria-label="Buscar viagens" style={{ maxWidth: 1100 }} onSubmit={runSearch}>
              <div className="dt-search__tabs" role="tablist">
                {searchTabs.map((t) => (
                  <button key={t} type="button" role="tab" className="dt-search__tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="dt-search__grid">
                <div className="dt-search__cell">
                  <label htmlFor="s-dest">Para onde?</label>
                  <input id="s-dest" placeholder="Destino, cidade ou região" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <div className="dt-search__cell">
                  <label htmlFor="s-orig">Saindo de</label>
                  <select id="s-orig" value={departure} onChange={(e) => setDeparture(e.target.value)}>
                    <option value="Todas">Qualquer cidade</option>
                    <option value="Campo Grande">Campo Grande (CGR)</option>
                    <option value="São Paulo">São Paulo (GRU)</option>
                  </select>
                </div>
                <div className="dt-search__cell">
                  <label htmlFor="s-when">Quando</label>
                  <select id="s-when" defaultValue="Qualquer data">
                    <option>Qualquer data</option>
                    <option>Próximos 3 meses</option>
                    <option>Férias de janeiro</option>
                    <option>Férias de julho</option>
                  </select>
                </div>
                <div className="dt-search__cell">
                  <label htmlFor="s-pax">Pessoas</label>
                  <select id="s-pax" defaultValue="2 adultos">
                    <option>2 adultos</option>
                    <option>1 adulto</option>
                    <option>2 adultos + 1 criança</option>
                    <option>Família</option>
                  </select>
                </div>
                <button type="submit" className="dt-btn dt-btn--primary dt-btn--lg">
                  <img className="dt-ic" src={icon.ui('search')} alt="" />
                  Buscar
                </button>
              </div>
            </form>
          </div>
        </section>

        <div className="dt-wrap" style={{ marginTop: -56, position: 'relative', zIndex: 2 }}>
          <div className="dt-trust4">
            {trust.map((item) => (
              <div key={item.title}>
                <img src={icon.big(item.icon)} alt="" />
                <div>
                  <p className="dt-trust__title">{item.title}</p>
                  <p className="dt-trust__text">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <section id="ofertas" aria-labelledby="offers-title" style={{ padding: '80px 0 96px', scrollMarginTop: 72 }}>
          <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="dt-eyebrow">Ofertas da semana</span>
                <h2 id="offers-title" className="dt-sec-title">
                  Pacotes em destaque
                </h2>
              </div>
              <a href="/pacotes" className="dt-btn dt-btn--outline">
                Ver todos os pacotes
              </a>
            </div>

            {categories.length > 1 && (
              <div className="dt-cats" role="group" aria-label="Filtrar por tipo de viagem">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className="dt-cat"
                    aria-pressed={category === c.value}
                    onClick={() => {
                      setCategory(c.value)
                      trackEvent('catalog_filter', { category: c.value })
                    }}
                  >
                    <img src={icon.big(c.icon)} alt="" />
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {activeQuery && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <span style={{ font: '500 15px/1.4 var(--dt-font-sans)', color: 'var(--dt-ink-secondary)' }}>
                  Resultados para <b style={{ color: 'var(--dt-ink)' }}>{activeQuery}</b>
                </span>
                <button
                  type="button"
                  className="dt-btn dt-btn--outline dt-btn--sm"
                  onClick={() => {
                    setActiveQuery('')
                    setQuery('')
                  }}
                >
                  Limpar busca
                </button>
              </div>
            )}

            {promos === null ? (
              <div className="dt-grid-offers" aria-busy="true" aria-label="Carregando ofertas">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="dt-skeleton" />
                ))}
              </div>
            ) : offers.length === 0 ? (
              <div className="dt-card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
                <img src={icon.big('passport-and-tickets')} alt="" style={{ width: 56, height: 56 }} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <h3 className="dt-card__title">
                    {activeQuery ? `Ainda não temos pacote pronto para "${activeQuery}"` : 'Estamos atualizando as ofertas'}
                  </h3>
                  <p className="dt-card__text">Conte o destino e as datas. A gente cota para você no WhatsApp.</p>
                </div>
                <button type="button" className="dt-btn dt-btn--whatsapp" onClick={() => openLead('no_results', null, activeQuery)}>
                  <img className="dt-ic" src={icon.ui('whatsapp')} alt="" />
                  Cotar no WhatsApp
                </button>
              </div>
            ) : (
              <div className="dt-grid-offers">
                {offers.slice(0, 9).map((pkg) => {
                  const total = getPriceNumber(pkg.VALOR)
                  const parcelas = getParcelas(pkg)
                  const installment = parcelas > 0 ? total / parcelas : total
                  const regime = getRegimeLabel(pkg)
                  const nights = Number.parseInt(pkg.NUMERO_DE_NOITES || '0', 10)
                  const departures = getDepartureCities(pkg).join(' e ')
                  const badge = pkg.ALL_INCLUSIVE ? 'All inclusive' : pkg.AEREO ? 'Com aéreo' : null
                  return (
                    <article key={pkg.id} className="dt-offer">
                      <a
                        href={pkg.SITE_SLUG ? `/pacotes/${pkg.SITE_SLUG}` : '#ofertas'}
                        className="dt-offer__media"
                        onClick={() =>
                          trackEvent('select_package', { package_slug: pkg.SITE_SLUG || 'sem-slug', destination: pkg.DESTINO, element: 'image' })
                        }
                      >
                        <img
                          src={pkg.SITE_IMAGE || FALLBACK_IMAGE}
                          alt={`Foto de ${pkg.DESTINO}`}
                          loading="lazy"
                          onError={(e) => {
                            if (!e.currentTarget.src.endsWith(FALLBACK_IMAGE)) e.currentTarget.src = FALLBACK_IMAGE
                          }}
                        />
                        {badge && (
                          <div className="dt-offer__tags">
                            <span className={`dt-badge ${pkg.ALL_INCLUSIVE ? 'dt-badge--brand' : 'dt-badge--neutral'}`}>{badge}</span>
                          </div>
                        )}
                      </a>
                      <div className="dt-offer__body">
                        <span className="dt-offer__where">
                          {getSectionLabel(pkg.SITE_SECTION).replace(/^Pacotes /, '')} · saída {departures}
                        </span>
                        <h3 className="dt-offer__dest">{pkg.DESTINO}</h3>
                        <div className="dt-offer__meta">
                          {pkg.HOTEL && (
                            <span>
                              <img className="dt-ic-sm" src={icon.ui('bed')} alt="" />
                              {pkg.HOTEL}
                            </span>
                          )}
                          {nights > 0 && (
                            <span>
                              <img className="dt-ic-sm" src={icon.ui('calendar')} alt="" />
                              {nights} noites
                            </span>
                          )}
                          {regime && (
                            <span>
                              <img className="dt-ic-sm" src={icon.ui('coffee')} alt="" />
                              {regime}
                            </span>
                          )}
                          {pkg.AEREO && (
                            <span>
                              <img className="dt-ic-sm" src={icon.ui('airplane-take-off')} alt="" />
                              Aéreo incluso
                            </span>
                          )}
                        </div>
                        {pkg.DATA_FORMATADA && (
                          <span style={{ font: '500 13px/1.4 var(--dt-font-sans)', color: 'var(--dt-ink-muted)' }}>{pkg.DATA_FORMATADA}</span>
                        )}
                        <div className="dt-offer__foot">
                          <div className="dt-price">
                            <span className="dt-price__from">A partir de</span>
                            <span className="dt-price__value">
                              <small>R$</small>
                              {formatInt(total)}
                            </span>
                            <span className="dt-price__inst">
                              ou <b>{parcelas}x {formatBRL(installment)}</b> · por pessoa
                            </span>
                          </div>
                          <button type="button" className="dt-btn dt-btn--primary dt-btn--sm" onClick={() => openLead('package_card', pkg)}>
                            Quero
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section id="destinos" aria-labelledby="dest-title" style={{ padding: '0 0 96px' }}>
          <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="dt-eyebrow">Para todo tipo de viagem</span>
              <h2 id="dest-title" className="dt-sec-title">
                Destinos em alta
              </h2>
            </div>
            <div className="dt-grid-dest">
              {trendingDestinations.map((d) => (
                <Link key={d.name} className="dt-dest" href="/destinos" onClick={() => trackEvent('cta_click', { label: 'destino_tile', destination: d.name })}>
                  <img src={d.img} alt="" loading="lazy" />
                  <div className="dt-dest__label">
                    <p className="dt-dest__name">{d.name}</p>
                    <span className="dt-dest__from">{d.from}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" aria-labelledby="steps-title" style={{ padding: '88px 0', background: 'var(--dt-surface-muted)', scrollMarginTop: 72 }}>
          <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="dt-eyebrow">Sem cadastro, sem pagar para cotar</span>
              <h2 id="steps-title" className="dt-sec-title">
                Como funciona
              </h2>
            </div>
            <ol className="dt-grid-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {steps.map((step, i) => (
                <li key={step.title} className="dt-step">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <img src={icon.big(step.icon)} alt="" style={{ width: 64, height: 64 }} />
                    <span className="dt-step-n" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="dt-card__title" style={{ fontSize: 20 }}>
                    {step.title}
                  </h3>
                  <p className="dt-card__text" style={{ fontSize: 15 }}>
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="avaliacoes" aria-labelledby="reviews-title" style={{ padding: '96px 0' }}>
          <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="dt-eyebrow">Avaliações no Google</span>
                <h2 id="reviews-title" className="dt-sec-title">
                  Quem viaja com a Donatti recomenda
                </h2>
              </div>
              <a
                href={GOOGLE_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 15px/1 var(--dt-font-sans)', color: 'var(--dt-link)' }}
              >
                Ver todas no Google
                <img className="dt-ic-sm" src={icon.ui('external-link')} alt="" />
              </a>
            </div>
            <div className="dt-grid-3">
              {testimonials.map((t) => (
                <figure key={t.name} className="dt-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 16, background: '#ffffff' }}>
                  <div style={{ display: 'flex', gap: 2 }} role="img" aria-label="5 de 5 estrelas">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <img key={i} src={icon.big('star')} alt="" style={{ width: 20, height: 20 }} />
                    ))}
                  </div>
                  <blockquote style={{ margin: 0, font: '400 16px/1.6 var(--dt-font-sans)', color: 'var(--dt-ink)', flex: 1 }}>
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                  <figcaption style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: '1px solid var(--dt-border)' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 9999,
                        background: 'var(--dt-brand-navy)',
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        font: '700 15px/1 var(--dt-font-display)',
                      }}
                    >
                      {t.name.charAt(0)}
                    </span>
                    <span style={{ font: '600 14px/1.3 var(--dt-font-sans)', color: 'var(--dt-ink)' }}>
                      {t.name}
                      <span style={{ display: 'block', fontWeight: 400, color: 'var(--dt-ink-muted)' }}>Avaliação no Google</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" aria-labelledby="custom-title" style={{ padding: '88px 0', background: 'var(--dt-brand-navy)', color: '#ffffff', scrollMarginTop: 72 }}>
          <div className="dt-wrap dt-custom">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span className="dt-eyebrow" style={{ color: 'var(--dt-brand-yellow)' }}>
                Roteiro sob medida
              </span>
              <h2 id="custom-title" className="dt-sec-title" style={{ color: '#ffffff' }}>
                Não achou seu destino? A gente monta para você.
              </h2>
              <p style={{ margin: 0, font: '400 18px/1.6 var(--dt-font-sans)', color: 'rgba(255,255,255,0.88)' }}>
                Conte para onde quer ir e quando. Uma especialista envia opções de voo e hotel no seu WhatsApp, sem compromisso.
              </p>
            </div>
            <form className="dt-custom-form" onSubmit={handleContactSubmit}>
              <div className="dt-field">
                <label className="dt-field__label" htmlFor="c-dest">
                  Destino
                </label>
                <input
                  className="dt-input"
                  id="c-dest"
                  placeholder="Ex.: Gramado"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                />
              </div>
              <div className="dt-field">
                <label className="dt-field__label" htmlFor="c-date">
                  Quando
                </label>
                <input
                  className="dt-input"
                  id="c-date"
                  placeholder="Ex.: julho, 7 noites"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                />
              </div>
              <div className="dt-field">
                <label className="dt-field__label" htmlFor="c-name">
                  Seu nome
                </label>
                <input
                  className="dt-input"
                  id="c-name"
                  autoComplete="name"
                  required
                  placeholder="Como podemos te chamar?"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="dt-field">
                <label className="dt-field__label" htmlFor="c-phone">
                  WhatsApp
                </label>
                <input
                  className="dt-input"
                  id="c-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="(67) 9 0000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <button type="submit" className="dt-btn dt-btn--primary dt-btn--lg" style={{ gridColumn: '1 / -1' }} disabled={formStatus === 'sending'}>
                {formStatus === 'sending' ? 'Enviando…' : 'Quero minha cotação'}
              </button>
              <div aria-live="polite" style={{ gridColumn: '1 / -1' }}>
                {formStatus === 'success' && (
                  <div className="dt-alert dt-alert--success" role="status">
                    <div>
                      <b>Pronto!</b>Uma especialista vai te chamar no WhatsApp.
                    </div>
                  </div>
                )}
                {formStatus === 'error' && (
                  <div className="dt-alert dt-alert--danger" role="alert">
                    <div>
                      <b>Não foi possível enviar</b>Tente de novo ou fale direto no WhatsApp.
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </section>

        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          }}
        />
        <section id="duvidas" aria-labelledby="faq-title" style={{ padding: '96px 0', scrollMarginTop: 72 }}>
          <div className="dt-wrap" style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 32 }}>
            <h2 id="faq-title" className="dt-sec-title">
              Dúvidas frequentes
            </h2>
            <div className="dt-accordion">
              {faqs.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>
                    {f.q}
                    <img className="dt-ic" src={icon.ui('expand-arrow')} alt="" />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer role="contentinfo" style={{ background: 'var(--dt-brand-navy-deep)', color: 'rgba(255,255,255,0.85)', padding: '64px 0 32px' }}>
        <div className="dt-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div className="dt-grid-foot">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <img src="/images/home/selo-donatti.png" alt="Donatti Turismo" style={{ width: 96, height: 96 }} width={96} height={96} />
              <p style={{ margin: 0, font: '400 14px/1.6 var(--dt-font-sans)' }}>
                Avenida Tamandaré, 8 · Vila Planalto · Campo Grande/MS
                <br />
                CNPJ 41.887.394/0001-29
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, font: '400 14px/1.4 var(--dt-font-sans)' }}>
              <strong style={{ color: '#ffffff' }}>Viagens</strong>
              <Link href="/pacotes" style={{ color: 'inherit' }}>
                Pacotes
              </Link>
              <Link href="/destinos" style={{ color: 'inherit' }}>
                Destinos
              </Link>
              <Link href="/saindo-de-campo-grande" style={{ color: 'inherit' }}>
                Saindo de Campo Grande
              </Link>
              <Link href="/saindo-de-sao-paulo" style={{ color: 'inherit' }}>
                Saindo de São Paulo
              </Link>
              <a href="#contato" style={{ color: 'inherit' }}>
                Roteiro sob medida
              </a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, font: '400 14px/1.4 var(--dt-font-sans)' }}>
              <strong style={{ color: '#ffffff' }}>Ajuda</strong>
              <a href="#como-funciona" style={{ color: 'inherit' }}>
                Como funciona
              </a>
              <a href="#duvidas" style={{ color: 'inherit' }}>
                Dúvidas
              </a>
              <a href="#avaliacoes" style={{ color: 'inherit' }}>
                Avaliações
              </a>
            </div>
            {destinations.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, font: '400 14px/1.4 var(--dt-font-sans)' }}>
                <strong style={{ color: '#ffffff' }}>Destinos</strong>
                {destinations.slice(0, 10).map((d) => (
                  <Link key={d.slug} href={`/destinos/${d.slug}`} style={{ color: 'inherit' }}>
                    {destinationHeading(d.name)}
                  </Link>
                ))}
              </div>
            )}
            <address style={{ display: 'flex', flexDirection: 'column', gap: 10, font: '400 14px/1.4 var(--dt-font-sans)', fontStyle: 'normal' }}>
              <strong style={{ color: '#ffffff' }}>Atendimento</strong>
              <a href="tel:+5567992167694" style={{ color: 'inherit' }}>
                WhatsApp (67) 99216-7694
              </a>
              <a href="mailto:contato@donattiturismo.com.br" style={{ color: 'inherit', wordBreak: 'break-all' }}>
                contato@donattiturismo.com.br
              </a>
              <span>Pix, cartão e boleto</span>
            </address>
          </div>
          <p
            style={{
              margin: 0,
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.15)',
              font: '400 12px/1.5 var(--dt-font-sans)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Preços por pessoa, sujeitos a disponibilidade e alteração sem aviso. © {new Date().getFullYear()} Donatti Turismo.
          </p>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => openLead('floating_button')}
        aria-label="Falar no WhatsApp"
        className="dt-btn dt-btn--whatsapp"
        style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 50, width: 60, height: 60, padding: 0, borderRadius: 9999, boxShadow: 'var(--dt-shadow-xl)' }}
      >
        <img src={icon.ui('whatsapp')} alt="" style={{ width: 28, height: 28 }} />
      </button>

      {modalOpen &&
        isMounted &&
        createPortal(
          <div className="dt" style={{ position: 'fixed', inset: 0, zIndex: 11000 }}>
            <div className="dt-dialog-scrim" style={{ position: 'absolute', inset: 0 }} onClick={() => setModalOpen(false)}>
              <div
                className="dt-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="lead-title"
                style={{ position: 'relative' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="dt-btn dt-btn--ghost dt-btn--sm"
                  aria-label="Fechar"
                  onClick={() => setModalOpen(false)}
                  style={{ position: 'absolute', top: 12, right: 12, width: 36, padding: 0 }}
                >
                  <img className="dt-ic" src={icon.ui('multiply')} alt="" />
                </button>
                <img src={icon.big('whatsapp')} alt="" style={{ width: 56, height: 56, marginBottom: 12 }} />
                <h2 className="dt-dialog__title" id="lead-title">
                  Falta pouco para sua viagem
                </h2>
                <p className="dt-dialog__text">{modalText}</p>
                <form className="dt-stack" style={{ gap: 12 }} onSubmit={handleModalSubmit}>
                  <div className="dt-field">
                    <label className="dt-field__label" htmlFor="l-name">
                      Seu nome
                    </label>
                    <input
                      className="dt-input"
                      id="l-name"
                      autoComplete="name"
                      placeholder="Como podemos te chamar?"
                      value={modalData.name}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                    />
                  </div>
                  <div className="dt-field">
                    <label className="dt-field__label" htmlFor="l-phone">
                      WhatsApp com DDD
                    </label>
                    <input
                      className={`dt-input${modalError ? ' dt-input--invalid' : ''}`}
                      id="l-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(67) 9 0000-0000"
                      aria-invalid={!!modalError}
                      aria-describedby={modalError ? 'l-error' : undefined}
                      value={modalData.phone}
                      onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                    />
                    {modalError && (
                      <span className="dt-field__error" id="l-error">
                        {modalError}
                      </span>
                    )}
                  </div>
                  <button type="submit" className="dt-btn dt-btn--whatsapp dt-btn--block dt-btn--lg" disabled={modalSending}>
                    <img className="dt-ic" src={icon.ui('whatsapp')} alt="" />
                    {modalSending ? 'Abrindo…' : 'Continuar no WhatsApp'}
                  </button>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
