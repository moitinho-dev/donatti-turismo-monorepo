'use client'

/**
 * DONATTI TURISMO - Landing Page
 * Light Theme Landing Page com UX/Conversão otimizados
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { trackEvent } from '@/lib/analytics'
import {
  Search,
  MapPin,
  Star,
  ArrowRight,
  Shield,
  Award,
  Users,
  Plane,
  Globe,
  Heart,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Mail,
  Building2,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react'
import RealTimePromos from '@/components/home/RealTimePromos'

export default function DonattiTurismoMinimalist() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [searchedDestination, setSearchedDestination] = useState('')
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: '',
    period: '',
  })

  // Handler para quando não encontrar promoção para o destino
  const handleNoResults = (query: string) => {
    setSearchedDestination(query)
    trackEvent('whatsapp_click', { location: 'no_results', query })
    setShowWhatsAppModal(true)
  }

  // Fade in effect
  useEffect(() => {
    setIsVisible(true)
    setIsMounted(true)
  }, [])

  // Stats data
  const stats = [
    { value: '5.000+', label: 'Viajantes Felizes', icon: Users },
    { value: '150+', label: 'Destinos', icon: Globe },
    { value: '4.9/5', label: 'Avaliação Google', icon: Star },
    { value: '15 Anos', label: 'Experiência', icon: Award },
  ]

  // Quick search chips
  const quickChips = [
    { label: 'All Inclusive', icon: Star },
    { label: 'Com aéreo', icon: Plane },
    { label: 'Cancelamento grátis', icon: CheckCircle2 },
  ]

  // Benefits
  const benefits = [
    {
      icon: Phone,
      title: 'Atendimento 24/7 via WhatsApp',
      description: 'Resposta humana em minutos, inclusive finais de semana e feriados',
    },
    {
      icon: Award,
      title: 'Preço garantido',
      description: 'Se baixar, devolvemos a diferença — combinado e documentado',
    },
    {
      icon: ShieldCheck,
      title: 'Cancelamento grátis em ofertas selecionadas',
      description: 'Opções flexíveis para você reagendar ou cancelar quando indicado',
    },
    {
      icon: MapPin,
      title: 'Roteiros personalizados',
      description: 'Criados sob medida para seu estilo de viagem e orçamento',
    },
    {
      icon: Heart,
      title: 'Suporte completo',
      description: 'Antes, durante e depois da viagem, com acompanhamento proativo',
    },
    {
      icon: TrendingUp,
      title: '15 anos de experiência e 5.000+ clientes',
      description: 'Avaliação média 5/5 no Google e histórico sólido de emissões',
    },
  ]

  // Testimonials
  const testimonials = [
    {
      name: 'Ana & Carlos',
      location: 'São Paulo',
      text: 'A Donatti tornou nossa lua de mel nas Maldivas um sonho real. Cada detalhe foi perfeito!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Juliana F.',
      location: 'Rio de Janeiro',
      text: 'Minha viagem solo para a Itália foi incrível. Me senti segura e aproveitei cada segundo.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Família Martins',
      location: 'Belo Horizonte',
      text: 'As crianças amaram a Disney! A organização foi impecável.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Letícia N.',
      location: 'Curitiba',
      text: 'Fechamos cruzeiro no Caribe e o suporte pelo WhatsApp foi 24/7. Recomendo muito!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Rafael & Mariana',
      location: 'Campinas',
      text: 'Gramado com roteiro personalizado e preço garantido. Voltarei a comprar com a Donatti.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1455763916899-e8b50eca9967?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Bruna L.',
      location: 'Florianópolis',
      text: 'Punta Cana all inclusive com cancelamento grátis. Tudo bem explicado e transparente.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    },
  ]
  const googleReviewsUrl = 'https://maps.app.goo.gl/xuzhiYXCPC2VE9Tp8'

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-gray-900">
      {/* Gradient blur from top */}
      <div className="gradient-blur-top" />

      

      {/* Main Content */}
      <main id="main-content" role="main" className="relative z-10">
        {/* Hero Section with Integrated Header */}
        <section
          aria-labelledby="hero-title"
          className={`min-h-screen flex flex-col px-4 transition-all duration-1000 relative ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/hero-beach.jpg"
              alt=""
              className="h-full w-full object-cover blur-[6px] scale-105"
              aria-hidden="true"
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-white" />
          </div>

          {/* Header - Integrated into Hero */}
          <header role="banner" className="w-full py-4 relative z-10">
            <div className="container mx-auto flex h-20 items-center justify-between">
              <div className="flex items-center">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOTIPO_PNG_COR-HrrWIVyKTna8rzMaQYpuC0rmVAgCd3.png"
                  alt="Donatti Turismo"
                  className="h-16 w-auto object-contain"
                  width="64"
                  height="64"
                />
              </div>

              <nav role="navigation" aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
                <a
                  href="#ofertas"
                  className="text-sm font-bold text-white transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-2 py-1 drop-shadow-md"
                >
                  Ofertas
                </a>
                <a
                  href="#destinos"
                  className="text-sm font-bold text-white transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-2 py-1 drop-shadow-md"
                >
                  Destinos
                </a>
                <a
                  href="#avaliacoes"
                  className="text-sm font-bold text-white transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-2 py-1 drop-shadow-md"
                >
                  Avaliações
                </a>
              </nav>

              <Button className="bg-primary text-white hover:bg-primary/90 font-semibold min-h-[44px]">
                <Phone className="mr-2 h-4 w-4" />
                Consulte Agora
              </Button>
            </div>
          </header>

          {/* Hero Content */}
          <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center">
              

              {/* Main Heading */}
              <h1
                id="hero-title"
                className="mb-6 text-6xl leading-[1.1] tracking-tight md:text-7xl lg:text-8xl xl:text-9xl drop-shadow-lg"
              >
                <span className="font-bold text-white">Realize sua</span>
                <br />
                <span className="font-italic text-white">próxima <span className="gradient-text font-semibold">aventura</span></span>
                <br />
                <span className="font-bold text-white">com a</span> <span className="font-bold gradient-text">Donatti</span>
              </h1>

              {/* Subtitle with urgency + social proof */}
              <p className="mx-auto mb-8 max-w-3xl text-lg md:text-xl leading-relaxed font-bold text-white drop-shadow-md">
                Os melhores pacotes de viagem com até 12x sem juros + Suporte 24/7 no WhatsApp
              </p>


              {/* Enhanced Search Bar */}
              <div className="mx-auto mb-6 max-w-3xl">
                <form
                  role="search"
                  aria-label="Buscar pacotes de viagem"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setActiveSearchQuery(searchQuery)
                    document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="glass rounded-2xl p-4 overflow-hidden"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex flex-1 items-center overflow-hidden">
                      <label htmlFor="hero-search" className="sr-only">
                        Digite seu destino dos sonhos
                      </label>
                      <div className="absolute left-3 flex items-center pointer-events-none z-10">
                        <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </div>
                      <Input
                        id="hero-search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Para onde você quer ir?"
                        className="h-12 w-full border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 rounded-lg"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 whitespace-nowrap"
                    >
                      <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                      Buscar
                    </Button>
                  </div>

                  {/* Quick Search Chips */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickChips.map((chip, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSearchQuery(chip.label)
                          setActiveSearchQuery(chip.label)
                          trackEvent('catalog_filter', { chip: chip.label })
                          document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                      >
                        <chip.icon className="h-3 w-3" />
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </form>
              </div>

              {/* CTA Buttons */}
              <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => {
                    trackEvent('cta_click', { label: 'ver_ofertas' })
                    document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="group inline-flex items-center justify-center h-14 rounded-full bg-primary p-4  text-base font-bold text-white shadow-xl hover:shadow-primary/50 hover:bg-primary/90 transition-all hover:scale-105"
                >
                  <span>Ver ofertas</span>
                  <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    trackEvent('whatsapp_click', { location: 'hero' })
                    setShowWhatsAppModal(true)
                  }}
                  className="inline-flex items-center justify-center h-14 rounded-full border-2 border-gray-300 bg-transparent p-4 text-base font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Phone className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>Falar no WhatsApp</span>
                </Button>
              </div>

              
            </div>
          </div>
          </div>

         
        </section>

        {/* Benefits right after hero */}
        <section id="destinos" aria-labelledby="benefits-title" className="relative py-16 bg-gray-50 border-y border-gray-200">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                Benefícios Donatti
              </Badge>
              <h2 id="benefits-title" className="mb-3 text-3xl font-bold md:text-4xl text-gray-900">
                Confiança logo no primeiro scroll
              </h2>
              <p className="text-lg text-gray-600">
                Atendimento 24/7 no WhatsApp, preço garantido e suporte completo antes, durante e depois da viagem.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section aria-label="Estatísticas da empresa" className="relative py-20 border-y border-gray-200">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold md:text-4xl text-gray-900">
                Mais de <span className="gradient-text">5.000 viajantes felizes</span>
              </h2>
              <p className="mt-3 text-lg text-gray-600">Nota média 4,9/5 — Baseado em avaliações verificadas</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="glass card-glow rounded-2xl p-8 text-center transition-all hover:scale-105"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <stat.icon className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <div className="mb-2 text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Offers Section */}
        <section id="ofertas" aria-labelledby="offers-title" className="relative py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                Ofertas Imperdíveis
              </Badge>
              <h2 id="offers-title" className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl text-gray-900">
                Pacotes em <span className="gradient-text">destaque</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                {activeSearchQuery
                  ? `Resultados para "${activeSearchQuery}"`
                  : 'Confira nossos pacotes com os melhores preços e condições especiais de pagamento.'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  <a href="/pacotes">Ver todos os pacotes</a>
                </Button>
                <Button asChild variant="ghost" className="text-gray-700 hover:text-primary" onClick={() => trackEvent('cta_click', { label: 'ver_destinos' })}>
                  <a href="/destinos" className="flex items-center gap-2">
                    Ver todos os destinos
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              {activeSearchQuery && (
                <Button
                  onClick={() => {
                    setActiveSearchQuery('')
                    setSearchQuery('')
                  }}
                  variant="outline"
                  className="mt-4 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                >
                  Limpar filtro
                </Button>
              )}
            </div>

            {/* Real-time promos component */}
            <RealTimePromos searchQuery={activeSearchQuery} onNoResults={handleNoResults} />
          </div>
        </section>

        {/* Testimonials */}
        <section id="avaliacoes" aria-labelledby="testimonials-title" className="relative py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                Depoimentos Verificados
              </Badge>
              <h2 id="testimonials-title" className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl text-gray-900">
                O que nossos clientes <span className="gradient-text">dizem</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                Mais de 5.000 viajantes já realizaram seus sonhos com a Donatti Turismo
              </p>
              <div className="mt-6">
                <a
                  href={googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Star className="h-4 w-4 fill-primary" />
                  Ler mais no Google Reviews
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="glass card-glow rounded-2xl overflow-hidden transition-all hover:scale-105"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={testimonial.image}
                      alt={`Viagem de ${testimonial.name}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                  </div>
                  <div className="p-8">
                    <div className="mb-4 flex items-center gap-2" aria-label={`Avaliação ${testimonial.rating} de 5 estrelas`}>
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-primary text-primary" aria-hidden="true" />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{testimonial.rating}/5</span>
                    </div>
                    <p className="mb-6 italic leading-relaxed text-gray-600">"{testimonial.text}"</p>
                    <div className="border-t border-gray-200 pt-4">
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contato" aria-labelledby="contact-title" className="relative py-20 border-y border-gray-200">
          <div className="container mx-auto px-4">
            <div className="glass card-glow mx-auto max-w-3xl rounded-3xl p-8 md:p-12">
              <div className="mb-8 text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
                <h2 id="cta-title" className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl text-gray-900">
                Sua próxima viagem
                <br />
                <span className="gradient-text">começa aqui</span>
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600">
                Parcele em até 12x sem juros e conte com suporte 24/7 durante toda a viagem.
              </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setFormStatus('idle')
                  try {
                    await fetch('/api/leads', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        name: formData.name,
                        phone: formData.phone,
                        email: formData.email,
                        destination: formData.destination,
                        period: formData.period,
                        source: 'contact_form',
                      }),
                    })
                    setFormStatus('success')
                    trackEvent('lead_form_submit', {
                      source: 'contact_form',
                      destination: formData.destination,
                      period: formData.period,
                    })
                    trackEvent('rdstation_lead', {
                      product: formData.destination || 'formulario',
                    })
                    setFormData({ name: '', email: '', phone: '', destination: '', period: '' })
                  } catch (error) {
                    console.error('Erro ao enviar:', error)
                    setFormStatus('error')
                  }
                }}
                className="space-y-6"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-gray-700">
                      Nome completo *
                    </label>
                    <Input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Seu nome"
                      className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-phone" className="mb-2 block text-sm font-medium text-gray-700">
                      Telefone *
                    </label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-gray-700">
                      E-mail *
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-destination" className="mb-2 block text-sm font-medium text-gray-700">
                      Destino de interesse *
                    </label>
                    <Input
                      id="contact-destination"
                      type="text"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="Ex.: Cancún, Noronha, Cruzeiro Caribe"
                      className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-period" className="mb-2 block text-sm font-medium text-gray-700">
                    Período desejado
                  </label>
                  <Input
                    id="contact-period"
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    placeholder="Ex.: julho/2025 ou 10 a 17/08"
                    className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full bg-primary text-base font-semibold text-white hover:bg-primary/90"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Solicitar Orçamento
                </Button>

                {formStatus === 'success' && (
                  <p className="text-center text-sm text-green-600">Obrigado! Recebemos seu pedido e retornaremos em instantes.</p>
                )}
                {formStatus === 'error' && (
                  <p className="text-center text-sm text-red-600">Não foi possível enviar. Tente novamente ou fale no WhatsApp.</p>
                )}

                <p className="text-center text-xs text-gray-500">
                  Seus dados estão protegidos pela LGPD e usados apenas para retornar seu contato.
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* Marquee Partners */}
        <section aria-label="Nossos diferenciais" className="relative overflow-hidden border-y border-gray-200 py-12 bg-gray-50">
          <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, groupIndex) => (
              <div key={groupIndex} className="flex items-center gap-12">
                {[
                  'Cadastur Certificado',
                  'Pagamento 100% Seguro',
                  'Suporte 24/7',
                  'Melhor Preço Garantido',
                  '15 Anos no Mercado',
                  '5.000+ Clientes Satisfeitos',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />
                    <span className="text-lg font-semibold text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="relative border-t border-gray-200 py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOTIPO_PNG_COR-HrrWIVyKTna8rzMaQYpuC0rmVAgCd3.png"
                  alt="Donatti Turismo"
                  className="h-16 w-auto object-contain"
                  width="64"
                  height="64"
                />
              </div>
              <p className="text-sm text-gray-600 mb-3">Realizando sonhos de viagem há mais de 15 anos.</p>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Avenida Tamandaré, 8 - Vila Planalto, Campo Grande/MS - CEP 79009-790
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-4 w-4 text-primary" />
                  CNPJ: 41.887.394/0001-29
                </p>
                <p className="text-gray-600 text-sm">Atendimento humano 24/7 • Central MS/SP</p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Links Rápidos</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="/destinos" className="hover:text-primary transition-colors">
                    Destinos
                  </a>
                </li>
                <li>
                  <a href="/pacotes" className="hover:text-primary transition-colors">
                    Pacotes
                  </a>
                </li>
                <li>
                  <a href="#destinos" className="hover:text-primary transition-colors">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="#contato" className="hover:text-primary transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Políticas</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="/faq" className="hover:text-primary transition-colors">
                    Perguntas Frequentes
                  </a>
                </li>
                <li>
                  <a href="/politica-cancelamento" className="hover:text-primary transition-colors">
                    Cancelamento e Reembolso
                  </a>
                </li>
                <li>
                  <a href="/termos-uso" className="hover:text-primary transition-colors">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="/politica-privacidade" className="hover:text-primary transition-colors">
                    Privacidade (LGPD)
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Contato</h3>
              <address className="not-italic space-y-3 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href="tel:+5567992167694" className="hover:text-primary transition-colors">
                    (67) 99216-7694
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:contato@donattiturismo.com.br" className="hover:text-primary transition-colors">
                    contato@donattiturismo.com.br
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Site seguro SSL • Proteção de dados certificada
                </p>
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">Formas de pagamento:</p>
                  <div className="flex flex-wrap gap-2">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    <span className="text-xs text-gray-500">Pix, Cartões, Boleto</span>
                  </div>
                </div>
              </address>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-gray-500 md:flex-row">
              <p>© 2025 Donatti Turismo. Todos os direitos reservados. CNPJ 41.887.394/0001-29.</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-xs">Site seguro SSL</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs">Proteção de dados certificada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <button
        onClick={() => {
          trackEvent('whatsapp_click', { location: 'floating_button' })
          setShowWhatsAppModal(true)
        }}
        aria-label="Falar no WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-500/50 animate-float"
      >
        <Phone className="h-7 w-7" aria-hidden="true" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-5 w-5 rounded-full bg-green-500"></span>
        </span>
      </button>

      {/* WhatsApp Lead Modal */}
      {showWhatsAppModal && isMounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowWhatsAppModal(false)}
          >
            <div
              className="bg-white shadow-2xl w-full max-w-md rounded-2xl p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {searchedDestination ? `Orçamento para ${searchedDestination}` : 'Falar no WhatsApp'}
                    </h3>
                    <p className="text-sm text-gray-500">Resposta em minutos</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false)
                    setSearchedDestination('')
                  }}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label="Fechar"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {searchedDestination && (
                <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Destino desejado:</span> {searchedDestination}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Vamos preparar um orçamento personalizado para você!
                  </p>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  // Salvar lead no banco
                  try {
                    await fetch('/api/leads', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        name: formData.name,
                        phone: formData.phone,
                        email: formData.email,
                        source: searchedDestination ? 'search_popup' : 'whatsapp_popup',
                        destino: searchedDestination || null,
                      }),
                    })
                  } catch (error) {
                    console.error('Erro ao salvar lead:', error)
                  }
                  trackEvent('lead_form_submit', {
                    source: searchedDestination ? 'search_popup' : 'whatsapp_popup',
                    destination: searchedDestination || null,
                  })
                  trackEvent('whatsapp_click', { location: 'modal', destino: searchedDestination || 'geral' })
                  const message = searchedDestination
                    ? `Olá! Meu nome é ${formData.name}. Gostaria de um orçamento para ${searchedDestination}. Podem me ajudar?`
                    : `Olá! Meu nome é ${formData.name}. Gostaria de saber mais sobre as ofertas de viagem.`
                  const whatsappUrl = `https://wa.me/5567992167694?text=${encodeURIComponent(message)}`
                  window.open(whatsappUrl, '_blank')
                  setShowWhatsAppModal(false)
                  setSearchedDestination('')
                  setFormData({ name: '', email: '', phone: '', destination: '', period: '' })
                }}
                className="space-y-4"
              >
              <div>
                <label htmlFor="whatsapp-name" className="mb-2 block text-sm font-medium text-gray-700">
                  Seu nome *
                </label>
                <Input
                  id="whatsapp-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Como podemos te chamar?"
                  className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="whatsapp-phone" className="mb-2 block text-sm font-medium text-gray-700">
                  Seu telefone *
                </label>
                <Input
                  id="whatsapp-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="whatsapp-email" className="mb-2 block text-sm font-medium text-gray-700">
                  Seu e-mail *
                </label>
                <Input
                  id="whatsapp-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#20BA5A]"
              >
                <Phone className="mr-2 h-5 w-5" />
                Iniciar Conversa
              </Button>

              <p className="text-center text-xs text-gray-500">
                Ao continuar, você será redirecionado para o WhatsApp
              </p>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
