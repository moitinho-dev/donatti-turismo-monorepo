'use client'

/**
 * DONATTI TURISMO - Landing Page
 * Em Black Friday (esquenta / ao vivo) troca hero, selos, copy e FAQ pela campanha.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { trackEvent } from '@/lib/analytics'
import RealTimePromos, { usePublicPromos } from '@/components/home/RealTimePromos'
import { Countdown } from '@/components/blackfriday/Countdown'
import {
  blackFriday,
  formatCampaignDate,
  getCountdownTarget,
  isBlackFridayActive,
  type BlackFridayPhase,
} from '@/config/blackFriday'
import {
  Search,
  MapPin,
  Star,
  ArrowRight,
  Shield,
  Plane,
  CreditCard,
  CheckCircle2,
  Mail,
  Building2,
  Phone,
  Send,
  ShieldCheck,
  MessageCircle,
  Compass,
  Luggage,
  ChevronDown,
  Zap,
  X,
} from 'lucide-react'

const LOGO_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOTIPO_PNG_COR-HrrWIVyKTna8rzMaQYpuC0rmVAgCd3.png'
const WHATSAPP_NUMBER = '5567992167694'
const GOOGLE_REVIEWS_URL = 'https://maps.app.goo.gl/xuzhiYXCPC2VE9Tp8'

// Avaliações reais publicadas no Google
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
  { icon: Compass, title: 'Escolha a oferta', description: 'Filtre por destino, preço, duração ou cidade de saída.' },
  {
    icon: MessageCircle,
    title: 'Confirme no WhatsApp',
    description: 'Uma especialista confirma a disponibilidade da data e a tarifa do momento.',
  },
  { icon: Luggage, title: 'Parcele e viaje', description: 'Fechamos a reserva com você e acompanhamos até a volta.' },
]

const benefits = [
  {
    icon: Phone,
    title: 'Atendimento humano no WhatsApp',
    description: 'Você fala com uma especialista, não com um robô. Antes, durante e depois da viagem.',
  },
  {
    icon: Plane,
    title: 'Saídas de Campo Grande e São Paulo',
    description: 'Pacotes montados para quem embarca no MS ou em Guarulhos. Outras cidades, sob consulta.',
  },
  {
    icon: CreditCard,
    title: 'Parcelamento no cartão',
    description: 'Cada oferta mostra em quantas vezes cabe. Também aceitamos Pix e boleto.',
  },
  {
    icon: CheckCircle2,
    title: 'Tudo explicado antes de pagar',
    description: 'Aéreo, hotel e regime de alimentação claros na proposta, sem letra miúda.',
  },
  {
    icon: MapPin,
    title: 'Roteiro sob medida',
    description: 'Não achou o destino? Cotamos datas e hotéis para você.',
  },
  {
    icon: Building2,
    title: 'Agência com endereço em Campo Grande/MS',
    description: 'Avenida Tamandaré, 8 · CNPJ 41.887.394/0001-29.',
  },
]

const getFaqs = (bf: boolean, endsAt: string) => [
  ...(bf
    ? [
        {
          q: 'Até quando valem as ofertas da Black Friday?',
          a: `A campanha vai até ${endsAt}. Mas cada oferta depende da disponibilidade da data: quando o lote do hotel ou do voo acaba, o preço muda, mesmo antes do fim da campanha.`,
        },
      ]
    : []),
  {
    q: 'O valor mostrado é por pessoa?',
    a: 'Sim. O preço é por pessoa, e o valor da parcela usa o número de parcelas indicado no card.',
  },
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
    a: bf
      ? 'Chame no WhatsApp com o destino e as datas. Montamos uma cotação com condição de Black Friday para você.'
      : 'Chame no WhatsApp com o destino e as datas. Montamos uma cotação para você.',
  },
  {
    q: 'Como faço a reserva?',
    a: 'Toque no botão da oferta, deixe nome e WhatsApp e continue a conversa com a especialista. Ela confirma data e tarifa e finaliza a reserva com você.',
  },
]

const emptyLead = { name: '', email: '', phone: '', destination: '', period: '' }

interface HomeLandingProps {
  phase: BlackFridayPhase
}

export default function HomeLanding({ phase }: HomeLandingProps) {
  const bf = isBlackFridayActive(phase)
  const countdownTarget = getCountdownTarget(phase)
  const endsAtLabel = formatCampaignDate(blackFriday.endsAt)

  const promos = usePublicPromos(60)
  const maxParcelas = useMemo(
    () => (promos || []).reduce((max, p) => Math.max(max, Number(p.PARCELAS) || 0), 0),
    [promos],
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [searchedDestination, setSearchedDestination] = useState('')
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState(emptyLead)
  const [modalData, setModalData] = useState({ name: '', phone: '' })
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => setIsMounted(true), [])

  const scrollToOffers = () => document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })

  const openWhatsApp = (location: string, destination = '') => {
    setSearchedDestination(destination)
    trackEvent('whatsapp_click', { location, query: destination || undefined })
    setShowWhatsAppModal(true)
  }

  const runSearch = (query: string) => {
    setSearchQuery(query)
    setActiveSearchQuery(query)
    trackEvent('catalog_filter', { query })
    scrollToOffers()
  }

  const quickChips = bf
    ? ['All inclusive', 'Com aéreo', 'Nordeste', 'Internacionais']
    : ['All inclusive', 'Com aéreo', 'Internacionais', 'Cruzeiros']

  const parcelamento = maxParcelas > 1 ? `em até ${maxParcelas}x no cartão` : 'no cartão'

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormStatus('sending')
    const source = bf ? 'black_friday_lista' : 'contact_form'
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          destino: formData.destination,
          promoDetails: formData.period ? `Período: ${formData.period}` : undefined,
          source,
        }),
      })
      if (!res.ok) throw new Error('lead_error')
      setFormStatus('success')
      trackEvent('lead_form_submit', { source, destination: formData.destination, period: formData.period })
      trackEvent('rdstation_lead', { product: formData.destination || 'formulario' })
      setFormData(emptyLead)
    } catch (error) {
      console.error('Erro ao enviar:', error)
      setFormStatus('error')
    }
  }

  const handleModalSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const source = searchedDestination ? 'search_popup' : bf ? 'black_friday_whatsapp' : 'whatsapp_popup'
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modalData.name,
          phone: modalData.phone,
          source,
          destino: searchedDestination || undefined,
        }),
      })
    } catch (error) {
      console.error('Erro ao salvar lead:', error)
    }
    trackEvent('lead_form_submit', { source, destination: searchedDestination || null })
    trackEvent('whatsapp_click', { location: 'modal', destino: searchedDestination || 'geral' })
    const campaign = bf ? ' da Black Friday' : ''
    const message = searchedDestination
      ? `Olá! Sou ${modalData.name}. Quero uma cotação${campaign} para ${searchedDestination}.`
      : `Olá! Sou ${modalData.name}. Quero receber as ofertas${campaign} da Donatti.`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    setShowWhatsAppModal(false)
    setSearchedDestination('')
    setModalData({ name: '', phone: '' })
  }

  const faqs = getFaqs(bf, endsAtLabel)
  const navLinks = [
    { href: '#ofertas', label: 'Ofertas' },
    { href: '#como-funciona', label: 'Como funciona' },
    { href: '#avaliacoes', label: 'Avaliações' },
    { href: '#duvidas', label: 'Dúvidas' },
  ]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-gray-900">
      <a
        href="#ofertas"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[12000] focus:rounded focus:bg-white focus:px-4 focus:py-2"
      >
        Pular para as ofertas
      </a>

      {/* Barra da campanha */}
      {bf && countdownTarget && (
        <div className="relative z-20 bg-[#FED400] text-black">
          <div className="container mx-auto flex flex-col items-center justify-center gap-2 px-4 py-2 text-center text-sm font-bold sm:flex-row sm:gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 fill-black" aria-hidden="true" />
              {phase === 'esquenta'
                ? 'Esquenta Black Friday: ofertas antecipadas liberadas'
                : `Black Friday Donatti: ofertas até ${endsAtLabel}`}
            </span>
            {/* No celular a contagem fica só na hero, para não empurrar a busca para baixo */}
            <span className="hidden items-center gap-2 font-semibold sm:inline-flex">
              {phase === 'esquenta' ? 'Começa em' : 'Termina em'}
              <Countdown target={countdownTarget} tone="light" size="sm" />
            </span>
          </div>
        </div>
      )}

      <main id="main-content" role="main" className="relative z-10">
        {/* Hero */}
        <section
          aria-labelledby="hero-title"
          className={`relative flex flex-col px-4 ${bf ? 'bg-[#0B0B0F] pb-16' : 'min-h-[92vh] pb-12'}`}
        >
          {bf ? (
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
              <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#FED400]/15 blur-[120px]" />
              <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FEB100]/10 blur-[100px]" />
            </div>
          ) : (
            <div className="absolute inset-0 z-0">
              <img src="/images/hero-beach.jpg" alt="" className="h-full w-full object-cover" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
            </div>
          )}

          <header role="banner" className="relative z-10 w-full py-3">
            <div className="container mx-auto flex h-16 items-center justify-between gap-4">
              <img src={LOGO_URL} alt="Donatti Turismo" className="h-12 w-auto object-contain sm:h-14" width="56" height="56" />

              <nav role="navigation" aria-label="Navegação principal" className="hidden items-center gap-6 md:flex">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-sm px-2 py-1 text-sm font-bold text-white drop-shadow-md transition-colors hover:text-[#FED400] focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <Button
                onClick={() => openWhatsApp('header')}
                className={`min-h-[44px] font-semibold ${bf ? 'bg-[#FED400] text-black hover:bg-[#FED400]/90' : 'bg-primary text-white hover:bg-primary/90'}`}
              >
                <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                <span className="sm:hidden">WhatsApp</span>
                <span className="hidden sm:inline">Falar com especialista</span>
              </Button>
            </div>
          </header>

          <div className="relative z-10 flex flex-1 items-center justify-center pt-8 md:pt-12">
            <div className="container mx-auto max-w-4xl text-center">
              {bf && (
                <img
                  src="/assets/bf_logo.png"
                  alt="Black Friday"
                  width={400}
                  height={216}
                  className="mx-auto mb-3 h-auto w-32 drop-shadow-[0_10px_40px_rgba(254,212,0,0.35)] sm:mb-4 sm:w-64"
                />
              )}

              <p className={`mb-3 text-xs font-bold uppercase tracking-[0.2em] ${bf ? 'text-[#FED400]' : 'text-white/90'}`}>
                {bf
                  ? phase === 'esquenta'
                    ? 'Esquenta Black Friday Donatti'
                    : 'Black Friday Donatti Turismo'
                  : 'Donatti Turismo · Campo Grande/MS'}
              </p>

              <h1
                id="hero-title"
                className="mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl"
              >
                {bf ? (
                  <>
                    Sua próxima viagem com <span className="text-[#FED400]">preço de Black Friday</span>
                  </>
                ) : (
                  <>
                    Pacotes de viagem saindo de <span className="gradient-text">Campo Grande e São Paulo</span>
                  </>
                )}
              </h1>

              <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                {bf
                  ? `Aéreo e hotel com parcelamento ${parcelamento}. As tarifas são por lote: quando o lote acaba, o preço sobe.`
                  : `Aéreo, hotel e parcelamento ${parcelamento}, com atendimento humano no WhatsApp do primeiro contato até a volta.`}
              </p>

              {bf && countdownTarget && (
                <div className="mb-6 flex flex-col items-center gap-2 sm:mb-8 sm:gap-3">
                  <p className="text-sm font-semibold text-white/70">
                    {phase === 'esquenta' ? 'A Black Friday começa em' : 'As ofertas terminam em'}
                  </p>
                  <Countdown target={countdownTarget} tone="dark" />
                </div>
              )}

              {/* Busca */}
              <div className="mx-auto mb-6 max-w-2xl">
                <form
                  role="search"
                  aria-label="Buscar pacotes de viagem"
                  onSubmit={(e) => {
                    e.preventDefault()
                    runSearch(searchQuery.trim())
                  }}
                  className="rounded-2xl bg-white p-3 shadow-2xl sm:p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="relative flex flex-1 items-center">
                      <label htmlFor="hero-search" className="sr-only">
                        Para onde você quer ir?
                      </label>
                      <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                      <Input
                        id="hero-search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Para onde você quer ir?"
                        className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-base text-gray-900 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 sm:text-sm"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className={`h-12 whitespace-nowrap px-6 text-sm font-bold ${bf ? 'bg-black text-[#FED400] hover:bg-gray-900' : 'bg-primary text-white hover:bg-primary/90'}`}
                    >
                      <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                      Buscar ofertas
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => runSearch(chip)}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </form>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => {
                    trackEvent('cta_click', { label: 'ver_ofertas', campaign: bf ? 'black_friday' : undefined })
                    scrollToOffers()
                  }}
                  className={`group h-14 w-full rounded-full px-8 text-base font-bold shadow-xl transition-all hover:scale-[1.02] sm:w-auto ${
                    bf ? 'bg-[#FED400] text-black hover:bg-[#FED400]/90' : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {bf ? 'Ver ofertas da Black Friday' : 'Ver ofertas'}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => openWhatsApp('hero')}
                  className="h-14 w-full rounded-full border-2 border-white/40 bg-transparent px-6 text-base font-semibold text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                  {bf ? 'Receber ofertas no WhatsApp' : 'Falar no WhatsApp'}
                </Button>
              </div>

              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
                <li className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Atendimento humano
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" aria-hidden="true" /> Agência em Campo Grande/MS
                </li>
                <li>
                  <a
                    href={GOOGLE_REVIEWS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
                  >
                    <Star className="h-4 w-4 fill-[#FED400] text-[#FED400]" aria-hidden="true" /> Avaliações no Google
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Ofertas */}
        <section id="ofertas" aria-labelledby="offers-title" className="relative scroll-mt-4 bg-gray-50 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <Badge
                className={
                  bf
                    ? 'mb-4 border-transparent bg-black text-[#FED400] hover:bg-black'
                    : 'mb-4 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
                }
              >
                {bf ? 'Ofertas Black Friday' : 'Ofertas da semana'}
              </Badge>
              <h2 id="offers-title" className="mb-3 text-3xl font-bold text-gray-900 md:text-5xl">
                {bf ? (
                  <>
                    Ofertas da <span className="gradient-text">Black Friday</span>
                  </>
                ) : (
                  <>
                    Pacotes em <span className="gradient-text">destaque</span>
                  </>
                )}
              </h2>
              <p className="mx-auto max-w-2xl text-base text-gray-600 md:text-lg">
                {activeSearchQuery
                  ? `Resultados para "${activeSearchQuery}"`
                  : 'Valores por pessoa. Disponibilidade e tarifa são confirmadas na hora pelo WhatsApp.'}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {activeSearchQuery && (
                  <Button
                    onClick={() => {
                      setActiveSearchQuery('')
                      setSearchQuery('')
                    }}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Limpar busca
                  </Button>
                )}
                <Button asChild variant="ghost" className="text-gray-700 hover:text-primary">
                  <Link href="/destinos" onClick={() => trackEvent('cta_click', { label: 'ver_destinos' })} className="flex items-center gap-2">
                    Ver todos os destinos
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>

            <RealTimePromos
              promos={promos}
              searchQuery={activeSearchQuery}
              onNoResults={(query) => openWhatsApp('no_results', query)}
              blackFriday={bf}
            />
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" aria-labelledby="steps-title" className="scroll-mt-4 bg-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 id="steps-title" className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
                {bf ? 'Como garantir sua oferta' : 'Como funciona'}
              </h2>
              <p className="text-base text-gray-600 md:text-lg">Três passos, sem cadastro e sem pagar nada para cotar.</p>
            </div>
            <ol className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="relative rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <span className="absolute right-5 top-4 text-5xl font-black text-gray-200" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${bf ? 'bg-black' : 'bg-primary/10'}`}>
                    <step.icon className={`h-6 w-6 ${bf ? 'text-[#FED400]' : 'text-primary'}`} aria-hidden="true" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Por que a Donatti */}
        <section id="por-que-donatti" aria-labelledby="benefits-title" className="border-y border-gray-200 bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 id="benefits-title" className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
                Por que viajar com a Donatti
              </h2>
              <p className="text-base text-gray-600 md:text-lg">
                Preço bom é o começo. O que faz a diferença é ter alguém resolvendo por você quando precisa.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {benefits.map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Avaliações */}
        <section id="avaliacoes" aria-labelledby="testimonials-title" className="scroll-mt-4 bg-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 id="testimonials-title" className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
                Quem viaja com a Donatti <span className="gradient-text">recomenda</span>
              </h2>
              <a
                href={GOOGLE_REVIEWS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <Star className="h-4 w-4 fill-primary" aria-hidden="true" />
                Ver todas as avaliações no Google
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.name} className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8">
                  <div className="mb-4 flex gap-1" aria-label="5 de 5 estrelas">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="mb-6 flex-1 leading-relaxed text-gray-700">&ldquo;{t.text}&rdquo;</blockquote>
                  <figcaption className="flex items-center gap-3 border-t border-gray-200 pt-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-bold text-primary" aria-hidden="true">
                      {t.name[0]}
                    </span>
                    <span>
                      <span className="block font-semibold text-gray-900">{t.name}</span>
                      <span className="block text-sm text-gray-500">Avaliação no Google</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Dúvidas */}
        <section id="duvidas" aria-labelledby="faq-title" className="scroll-mt-4 border-t border-gray-200 bg-gray-50 py-16 md:py-20">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 id="faq-title" className="mb-8 text-center text-3xl font-bold text-gray-900 md:text-4xl">
              Dúvidas frequentes
            </h2>
            <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div key={faq.q}>
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`faq-${index}`}
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        {faq.q}
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                    </h3>
                    <div id={`faq-${index}`} hidden={!isOpen} className="px-5 pb-5 text-sm leading-relaxed text-gray-600">
                      {faq.a}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Contato / lista de ofertas */}
        <section id="contato" aria-labelledby="contact-title" className={`relative scroll-mt-4 py-16 md:py-20 ${bf ? 'bg-[#0B0B0F]' : 'bg-white'}`}>
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8 md:p-12">
              <div className="mb-8 text-center">
                {bf ? (
                  <Zap className="mx-auto mb-4 h-12 w-12 fill-[#FED400] text-black" aria-hidden="true" />
                ) : (
                  <Mail className="mx-auto mb-4 h-12 w-12 text-primary" aria-hidden="true" />
                )}
                <h2 id="contact-title" className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                  {bf ? 'Receba as ofertas relâmpago primeiro' : 'Peça sua cotação'}
                </h2>
                <p className="mx-auto max-w-2xl text-base text-gray-600 md:text-lg">
                  {bf
                    ? 'Algumas tarifas aparecem e somem no mesmo dia. Diga para onde quer ir e avisamos no WhatsApp quando sair oferta.'
                    : 'Diga para onde e quando quer ir. Uma especialista responde pelo WhatsApp com as opções.'}
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-gray-700">
                      Nome *
                    </label>
                    <Input
                      id="contact-name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Seu nome"
                      className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="mb-2 block text-sm font-medium text-gray-700">
                      WhatsApp com DDD *
                    </label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(67) 99999-9999"
                      className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-destination" className="mb-2 block text-sm font-medium text-gray-700">
                      Para onde quer ir? *
                    </label>
                    <Input
                      id="contact-destination"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="Ex.: Maceió, Cancún, Gramado"
                      className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-period" className="mb-2 block text-sm font-medium text-gray-700">
                      Quando? (opcional)
                    </label>
                    <Input
                      id="contact-period"
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      placeholder="Ex.: férias de julho, feriado de Carnaval"
                      className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-gray-700">
                    E-mail (opcional)
                  </label>
                  <Input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="voce@exemplo.com"
                    className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={formStatus === 'sending'}
                  className={`h-14 w-full text-base font-bold ${bf ? 'bg-black text-[#FED400] hover:bg-gray-900' : 'bg-primary text-white hover:bg-primary/90'}`}
                >
                  <Send className="mr-2 h-5 w-5" aria-hidden="true" />
                  {formStatus === 'sending' ? 'Enviando...' : bf ? 'Quero receber as ofertas' : 'Pedir cotação'}
                </Button>

                <div aria-live="polite">
                  {formStatus === 'success' && (
                    <p className="text-center text-sm text-green-600">Pronto! Uma especialista vai te chamar no WhatsApp.</p>
                  )}
                  {formStatus === 'error' && (
                    <p className="text-center text-sm text-red-600">Não foi possível enviar. Tente de novo ou fale direto no WhatsApp.</p>
                  )}
                </div>

                <p className="text-center text-xs text-gray-500">
                  Usamos seus dados só para falar sobre a sua viagem, conforme a LGPD.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer role="contentinfo" className="relative border-t border-gray-200 bg-gray-50 py-14">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <img src={LOGO_URL} alt="Donatti Turismo" className="mb-4 h-14 w-auto object-contain" width="56" height="56" />
              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Avenida Tamandaré, 8 - Vila Planalto, Campo Grande/MS - CEP 79009-790
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  CNPJ 41.887.394/0001-29
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Navegue</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#ofertas" className="transition-colors hover:text-primary">Ofertas</a></li>
                <li><Link href="/pacotes" className="transition-colors hover:text-primary">Todos os pacotes</Link></li>
                <li><Link href="/destinos" className="transition-colors hover:text-primary">Destinos</Link></li>
                <li><a href="#duvidas" className="transition-colors hover:text-primary">Dúvidas frequentes</a></li>
                <li><a href="#contato" className="transition-colors hover:text-primary">Pedir cotação</a></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Contato</h3>
              <address className="space-y-3 text-sm not-italic text-gray-600">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                  <a href="tel:+5567992167694" className="transition-colors hover:text-primary">
                    (67) 99216-7694
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                  <a href="mailto:contato@donattiturismo.com.br" className="break-all transition-colors hover:text-primary">
                    contato@donattiturismo.com.br
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
                  Pix, cartão e boleto
                </p>
              </address>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 text-center text-xs text-gray-500 md:flex-row">
            <p>© {new Date().getFullYear()} Donatti Turismo. Todos os direitos reservados.</p>
            {bf && (
              <p>Ofertas sujeitas a disponibilidade e alteração de tarifa pelos fornecedores. Campanha até {endsAtLabel}.</p>
            )}
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Conexão segura
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp flutuante */}
      <button
        onClick={() => openWhatsApp('floating_button')}
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-500/50 sm:h-16 sm:w-16"
      >
        <Phone className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
      </button>

      {/* Modal WhatsApp */}
      {showWhatsAppModal &&
        isMounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[11000] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setShowWhatsAppModal(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="whatsapp-modal-title"
              className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]">
                    <Phone className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 id="whatsapp-modal-title" className="text-xl font-bold text-gray-900">
                      {searchedDestination ? `Cotação para ${searchedDestination}` : 'Falar no WhatsApp'}
                    </h3>
                    <p className="text-sm text-gray-500">Atendimento humano</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false)
                    setSearchedDestination('')
                  }}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label htmlFor="whatsapp-name" className="mb-2 block text-sm font-medium text-gray-700">
                    Seu nome *
                  </label>
                  <Input
                    id="whatsapp-name"
                    autoComplete="name"
                    value={modalData.name}
                    onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                    placeholder="Como podemos te chamar?"
                    className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="whatsapp-phone" className="mb-2 block text-sm font-medium text-gray-700">
                    WhatsApp com DDD *
                  </label>
                  <Input
                    id="whatsapp-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={modalData.phone}
                    onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                    placeholder="(67) 99999-9999"
                    className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>

                <Button type="submit" className="h-12 w-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#20BA5A]">
                  <Phone className="mr-2 h-5 w-5" aria-hidden="true" />
                  Continuar no WhatsApp
                </Button>

                <p className="text-center text-xs text-gray-500">Você será levado para o WhatsApp com a mensagem pronta.</p>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
