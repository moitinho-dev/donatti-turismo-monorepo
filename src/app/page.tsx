'use client'

/**
 * DONATTI TURISMO - BLACK FRIDAY 2025
 * Dark Minimalist Landing Page com UX/Conversão otimizados
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  MapPin,
  Star,
  ArrowRight,
  Shield,
  Award,
  Clock,
  Sparkles,
  Users,
  Plane,
  Globe,
  Heart,
  TrendingUp,
  Zap,
  ChevronRight,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Mail,
  Building2,
  Phone,
  Send,
} from 'lucide-react'
import CountdownTimer from '@/components/hero/CountdownTimer'
import RealTimePromos from '@/components/home/RealTimePromos'

export default function DonattiTurismoMinimalist() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [showStickyCountdown, setShowStickyCountdown] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  // Cursor ring effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Fade in effect
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Sticky countdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCountdown(window.scrollY > 800)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Stats data
  const stats = [
    { value: '5.000+', label: 'Viajantes Felizes', icon: Users },
    { value: '150+', label: 'Destinos', icon: Globe },
    { value: '4.9/5', label: 'Avaliação Google', icon: Star },
    { value: '15 Anos', label: 'Experiência', icon: Award },
  ]

  // Payment methods
  const paymentMethods = [
    { name: 'Pix' },
    { name: 'Visa' },
    { name: 'Mastercard' },
    { name: 'Amex' },
    { name: 'Elo' },
    { name: 'PayPal' },
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
      icon: Shield,
      title: 'Atendimento 24/7 no WhatsApp',
      description: 'Suporte humano a qualquer hora, resposta em minutos',
    },
    {
      icon: Award,
      title: 'Preço garantido',
      description: 'Se baixar, devolvemos a diferença',
    },
    {
      icon: CheckCircle2,
      title: 'Cancelamento grátis',
      description: 'Em ofertas selecionadas, sem burocracia',
    },
    {
      icon: MapPin,
      title: 'Roteiros personalizados',
      description: 'Criados especialmente para você',
    },
    {
      icon: Heart,
      title: 'Suporte completo',
      description: 'Antes, durante e após sua viagem',
    },
    {
      icon: TrendingUp,
      title: '15 anos de expertise',
      description: 'Confiança de 5.000+ viajantes',
    },
  ]

  // Testimonials
  const testimonials = [
    {
      name: 'Ana & Carlos',
      location: 'São Paulo',
      text: 'A Donatti tornou nossa lua de mel nas Maldivas um sonho real. Cada detalhe foi perfeito!',
      rating: 5,
      video: 'https://scontent-bos5-1.cdninstagram.com/o1/v/t16/f2/m69/AQO6iwpuhSSGjub1X7JcI3ejjr8qZm9YJaxBPGzMenP6qs8DxyrjEA2n-ebNg4yx0zW0Pv1ufSuTk3nOoqEKA5KJ.mp4?strext=1&_nc_cat=111&_nc_sid=9ca052&_nc_ht=scontent-bos5-1.cdninstagram.com&_nc_ohc=BuEbMICJCQoQ7kNvwF9_BAQ&efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLmNsaXBzLmMyLUMzLmRhc2hfbG5faGVhYWNfdmJyM19hdWRpbyIsInZpZGVvX2lkIjpudWxsLCJvaWxfdXJsZ2VuX2FwcF9pZCI6OTM2NjE5NzQzMzkyNDU5LCJjbGllbnRfbmFtZSI6ImlnIiwieHB2X2Fzc2V0X2lkIjoxMDc1MzExMjUwNzA3NDUwLCJhc3NldF9hZ2VfZGF5cyI6MTM0LCJ2aV91c2VjYXNlX2lkIjoxMDA5OSwiZHVyYXRpb25fcyI6MTM5LCJiaXRyYXRlIjo1NjQyMywidXJsZ2VuX3NvdXJjZSI6Ind3dyJ9&ccb=17-1&_nc_gid=ErMSouscUQ7IStxU_fIqzQ&_nc_zt=28&oh=00_Afi5M2ulNA0_OGqeJSMKf9jAriJ9MQmQ_rBQ3KYUaxDj4w&oe=69209DC1',
    },
    {
      name: 'Juliana F.',
      location: 'Rio de Janeiro',
      text: 'Minha viagem solo para a Itália foi incrível. Me senti segura e aproveitei cada segundo.',
      rating: 5,
      video: 'https://scontent-ord5-2.cdninstagram.com/o1/v/t16/f2/m69/AQOB6eX0v8zXqgOk6lJv3I8C2WQux6p9HAm0RNDGFIRMmejkSK1H3pVCVfVuNKIoxAJWRoqKohe6x7CYVFzg9hLO.mp4?strext=1&_nc_cat=102&_nc_sid=9ca052&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_ohc=7zGzQwCJ7zYQ7kNvwFJtyQ4&efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLmNsaXBzLmMyLUMzLmRhc2hfbG5faGVhYWNfdmJyM19hdWRpbyIsInZpZGVvX2lkIjpudWxsLCJvaWxfdXJsZ2VuX2FwcF9pZCI6OTM2NjE5NzQzMzkyNDU5LCJjbGllbnRfbmFtZSI6ImlnIiwieHB2X2Fzc2V0X2lkIjoxNDE3OTI5ODU5NDYxNzIyLCJhc3NldF9hZ2VfZGF5cyI6OTAsInZpX3VzZWNhc2VfaWQiOjEwMDk5LCJkdXJhdGlvbl9zIjozNSwiYml0cmF0ZSI6Nzc1MTksInVybGdlbl9zb3VyY2UiOiJ3d3cifQ%3D%3D&ccb=17-1&_nc_gid=zo7wYyUfQ7lBaBFC3tcTCQ&_nc_zt=28&oh=00_AfhwAsN9n_PHJUgWG6H7vl6idO5NWjepAnhgNMgfV70sUw&oe=6920C03E',
    },
    {
      name: 'Família Martins',
      location: 'Belo Horizonte',
      text: 'As crianças amaram a Disney! A organização foi impecável.',
      rating: 5,
      image: '/traveler-at-santorini-greece-blue-domes.jpg',
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      {/* Cursor ring effect */}
      <div
        className="cursor-ring hidden lg:block"
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
        }}
      />

      {/* Gradient blur from top */}
      <div className="gradient-blur-top" />

      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:top-4 focus:left-4 focus:rounded-md"
      >
        Pular para o conteúdo principal
      </a>

      {/* Header */}
      <header role="banner" className="fixed top-0 z-50 w-full border-b border-white/5 glass">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
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
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-2 py-1"
            >
              Ofertas
            </a>
            <a
              href="#destinos"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-2 py-1"
            >
              Destinos
            </a>
            <a
              href="#avaliacoes"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-2 py-1"
            >
              Avaliações
            </a>
          </nav>

          <Button className="bg-primary text-black hover:bg-primary/90 font-semibold min-h-[44px]">
            <Phone className="mr-2 h-4 w-4" />
            Consulte Agora
          </Button>
        </div>
      </header>

      {/* Sticky Countdown */}
      <div className={`sticky-countdown ${showStickyCountdown ? 'visible' : ''}`}>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-white">Oferta termina em:</span>
          <CountdownTimer targetDate="2025-11-29T23:59:59-03:00" />
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" role="main" className="relative z-10">
        {/* Hero Section */}
        <section
          aria-labelledby="hero-title"
          className={`min-h-screen flex items-center justify-center px-4 pt-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="container mx-auto max-w-7xl">
            <div className="text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full glass px-6 py-2">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-sm text-gray-300">Black Friday 2025</span>
              </div>

              {/* Main Heading */}
              <h1
                id="hero-title"
                className="mb-6 text-6xl leading-[1.1] tracking-tight md:text-7xl lg:text-8xl xl:text-9xl"
              >
                <span className="font-bold">Black Friday Donatti:</span>
                <br />
                <span className="font-black">sua próxima <span className="gradient-text">aventura</span></span>
                <br />
                <span className="font-bold">com até</span> <span className="font-black gradient-text">60% OFF</span>
              </h1>

              {/* Subtitle with urgency + social proof */}
              <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-300 md:text-xl leading-relaxed">
                Até <span className="font-bold text-white">60% de desconto</span> em pacotes selecionados +{' '}
                <span className="font-bold text-white">12x sem juros</span> + Suporte{' '}
                <span className="font-bold text-white">24/7 no WhatsApp</span>
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
                        className="h-12 w-full border-0 bg-gray-900/80 pl-10 pr-3 text-sm text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 rounded-lg"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 bg-primary px-6 text-sm font-semibold text-black hover:bg-primary/90 whitespace-nowrap"
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
                        className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
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
                    document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="group h-14 rounded-full bg-primary px-10 text-base font-bold text-black shadow-xl hover:shadow-primary/50 hover:bg-primary/90 transition-all hover:scale-105 min-h-[52px]"
                >
                  Ver ofertas Black Friday
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  asChild
                  variant="outline"
                  className="h-14 rounded-full border-2 border-white/20 bg-transparent px-10 text-base font-semibold text-white hover:bg-white/10 hover:text-white min-h-[52px]"
                >
                  <a
                    href="https://wa.me/5511999999999?text=Olá!%20Quero%20conhecer%20as%20ofertas%20da%20Black%20Friday"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Falar no WhatsApp
                  </a>
                </Button>
              </div>

              {/* Countdown */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Oferta termina em:</span>
                </div>
                <div className="glass rounded-xl px-6 py-3">
                  <CountdownTimer targetDate="2025-11-29T23:59:59-03:00" />
                </div>
              </div>

              {/* Social Proof */}
              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-[#0A0A0A] bg-gradient-to-br from-primary to-orange-500"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="text-xs md:text-sm">
                  <strong className="text-white">2.847 pessoas</strong> visualizando agora
                </span>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
            <ChevronRight className="h-6 w-6 rotate-90 text-gray-600" />
          </div>
        </section>

        {/* Stats Section */}
        <section aria-label="Estatísticas da empresa" className="relative py-20 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                Mais de <span className="gradient-text">5.000 viajantes felizes</span>
              </h2>
              <p className="mt-3 text-lg text-gray-400">Nota média 4,9/5 — Baseado em avaliações verificadas</p>
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
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Offers Section */}
        <section id="ofertas" aria-labelledby="offers-title" className="relative py-20">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                Ofertas Exclusivas Black Friday
              </Badge>
              <h2 id="offers-title" className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">
                Promoções <span className="gradient-text">do dia</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                {activeSearchQuery
                  ? `Resultados para "${activeSearchQuery}"`
                  : 'Promoções atualizadas diariamente com os melhores preços. Aproveite antes que acabem!'}
              </p>
              {activeSearchQuery && (
                <Button
                  onClick={() => {
                    setActiveSearchQuery('')
                    setSearchQuery('')
                  }}
                  variant="outline"
                  className="mt-4 border-white/20 hover:bg-white/10 hover:text-white"
                >
                  Limpar filtro
                </Button>
              )}
            </div>

            {/* Real-time promos component */}
            <RealTimePromos searchQuery={activeSearchQuery} />
          </div>
        </section>

        {/* Benefits */}
        <section id="destinos" aria-labelledby="benefits-title" className="relative py-20 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                Por que Donatti?
              </Badge>
              <h2 id="benefits-title" className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">
                Mais que uma agência,
                <br />
                <span className="gradient-text">seu parceiro de viagens</span>
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((item, index) => (
                <div key={index} className="glass card-glow rounded-2xl p-8 transition-all hover:scale-105">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="avaliacoes" aria-labelledby="testimonials-title" className="relative py-20">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                Depoimentos Verificados
              </Badge>
              <h2 id="testimonials-title" className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">
                O que nossos clientes <span className="gradient-text">dizem</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-400">
                Mais de 5.000 viajantes já realizaram seus sonhos com a Donatti Turismo
              </p>
              <div className="mt-6">
                <a
                  href="#avaliacoes"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Star className="h-4 w-4 fill-primary" />
                  Ler mais 200+ avaliações no Google Reviews
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
                    {'video' in testimonial ? (
                      <video
                        src={testimonial.video}
                        className="h-full w-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={testimonial.image}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                  </div>
                  <div className="p-8">
                    <div className="mb-4 flex gap-1" aria-label={`Avaliação ${testimonial.rating} de 5 estrelas`}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" aria-hidden="true" />
                      ))}
                    </div>
                    <p className="mb-6 italic leading-relaxed text-gray-300">"{testimonial.text}"</p>
                    <div className="border-t border-white/10 pt-4">
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-400">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section aria-labelledby="contact-title" className="relative py-20 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="glass card-glow mx-auto max-w-3xl rounded-3xl p-8 md:p-12">
              <div className="mb-8 text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
                <h2 id="contact-title" className="mb-3 text-3xl font-bold md:text-4xl">
                  Fale com nossos <span className="gradient-text">especialistas</span>
                </h2>
                <p className="text-lg text-gray-400">
                  Preencha o formulário e receba um orçamento personalizado em até 2 horas
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  console.log('Form submitted:', formData)
                  // Aqui você pode adicionar a lógica para enviar o formulário
                }}
                className="space-y-6"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-gray-300">
                      Nome completo *
                    </label>
                    <Input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Seu nome"
                      className="h-12 border-white/20 bg-white/5 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-phone" className="mb-2 block text-sm font-medium text-gray-300">
                      Telefone *
                    </label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="h-12 border-white/20 bg-white/5 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-gray-300">
                    E-mail *
                  </label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="h-12 border-white/20 bg-white/5 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full bg-primary text-base font-semibold text-black hover:bg-primary/90"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Solicitar Orçamento
                </Button>

                <p className="text-center text-xs text-gray-500">
                  Seus dados estão seguros. Não compartilhamos com terceiros.
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* Marquee Partners */}
        <section aria-label="Nossos diferenciais" className="relative overflow-hidden border-y border-white/5 py-12">
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
                    <span className="text-lg font-semibold text-gray-400">{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="cta-title" className="relative border-y border-white/5 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                Última Chance
              </Badge>
              <h2 id="cta-title" className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
                Não perca as ofertas da
                <br />
                <span className="gradient-text">Black Friday</span>
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
                Garanta até 60% de desconto e parcele em até 12x sem juros. Vagas limitadas!
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => {
                    document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="group h-14 rounded-full bg-primary px-10 text-base font-bold text-black hover:bg-primary/90 transition-all hover:scale-105"
                >
                  Ver todas as ofertas
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-14 rounded-full border-2 border-white/20 bg-transparent px-10 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
                >
                  <a
                    href="https://wa.me/5511999999999?text=Olá!%20Quero%20conhecer%20as%20ofertas%20da%20Black%20Friday"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Falar no WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="relative border-t border-white/5 py-16">
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
              <p className="text-sm text-gray-400 mb-3">Realizando sonhos de viagem há mais de 15 anos.</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  CNPJ: 00.000.000/0001-00
                </p>
                <p className="flex items-center gap-2">
                  <Award className="h-3 w-3" />
                  Cadastur: 00.000.000/0001-00
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-white">Links Rápidos</h3>
              <ul className="space-y-2 text-sm text-gray-400">
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
                  <a href="/sobre" className="hover:text-primary transition-colors">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="/contato" className="hover:text-primary transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-white">Políticas</h3>
              <ul className="space-y-2 text-sm text-gray-400">
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
              <h3 className="mb-4 font-semibold text-white">Contato</h3>
              <address className="not-italic space-y-3 text-sm text-gray-400">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href="tel:+5511999999999" className="hover:text-primary transition-colors">
                    (11) 99999-9999
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:contato@donattiturismo.com.br" className="hover:text-primary transition-colors">
                    contato@donattiturismo.com.br
                  </a>
                </p>
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">Formas de pagamento:</p>
                  <div className="flex flex-wrap gap-2">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    <span className="text-xs text-gray-500">Pix, Cartões, PayPal</span>
                  </div>
                </div>
              </address>
            </div>
          </div>

          <div className="mt-12 border-t border-white/5 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-gray-500 md:flex-row">
              <p>© 2025 Donatti Turismo. Todos os direitos reservados.</p>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs">Proteção de dados certificada • Site seguro SSL</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <button
        onClick={() => setShowWhatsAppModal(true)}
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
      {showWhatsAppModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowWhatsAppModal(false)}
        >
          <div
            className="glass card-glow w-full max-w-md rounded-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Falar no WhatsApp</h3>
                  <p className="text-sm text-gray-400">Resposta em minutos</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const message = `Olá! Meu nome é ${formData.name}. Gostaria de saber mais sobre as ofertas de viagem.`
                const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`
                window.open(whatsappUrl, '_blank')
                setShowWhatsAppModal(false)
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="whatsapp-name" className="mb-2 block text-sm font-medium text-gray-300">
                  Seu nome *
                </label>
                <Input
                  id="whatsapp-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Como podemos te chamar?"
                  className="h-12 border-white/20 bg-white/5 text-white placeholder:text-gray-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="whatsapp-phone" className="mb-2 block text-sm font-medium text-gray-300">
                  Seu telefone *
                </label>
                <Input
                  id="whatsapp-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-12 border-white/20 bg-white/5 text-white placeholder:text-gray-500"
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
        </div>
      )}
    </div>
  )
}
