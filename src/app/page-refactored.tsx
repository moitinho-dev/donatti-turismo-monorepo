'use client'

/**
 * DONATTI TURISMO - BLACK FRIDAY 2025
 * Página principal refatorada com foco em:
 * - UX otimizada
 * - Acessibilidade WCAG AA
 * - Performance (Lighthouse >= 90)
 * - SEO com dados estruturados
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  MapPin,
  Star,
  Send,
  X,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Award,
  ChevronRight,
  Instagram,
  Facebook,
  Mail,
  Phone,
  Heart,
  Headphones,
  Compass,
  Users,
  Zap,
  Clock,
} from 'lucide-react'
import CountdownTimer from '@/components/hero/CountdownTimer'

// ============================================
// TIPOS
// ============================================

type InstagramPost = {
  id: string
  image: string
  caption: string
  likes: number
  permalink?: string
  timestamp?: string
}

type OfferData = {
  id: number
  name: string
  country: string
  price: number
  priceOld: number
  rating: number
  duration: string
  image: string
  highlights: string[]
  category: 'praias' | 'montanhas' | 'cidades' | 'exoticos'
  slug: string
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function DonattiTurismoRefactored() {
  // Estados
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([])
  const [instagramLoading, setInstagramLoading] = useState(true)

  // ============================================
  // DADOS
  // ============================================

  const placeholderPosts: InstagramPost[] = [
    {
      id: '1',
      image: '/traveler-at-santorini-greece-blue-domes.jpg',
      caption: 'Santorini nunca decepciona! 🇬🇷✨',
      likes: 1243,
      permalink: 'https://instagram.com/donattiturismo',
    },
    {
      id: '2',
      image: '/couple-at-maldives-beach-sunset.jpg',
      caption: 'O paraíso nas Maldivas. 🇲🇻❤️',
      likes: 2109,
      permalink: 'https://instagram.com/donattiturismo',
    },
    {
      id: '3',
      image: '/woman-in-yellow-dress-in-paris-eiffel-tower.jpg',
      caption: 'Paris, je t\'aime! 🇫🇷🥐',
      likes: 1876,
      permalink: 'https://instagram.com/donattiturismo',
    },
    {
      id: '4',
      image: '/aurora-borealis-in-iceland.jpg',
      caption: 'Dançando com as luzes do norte na Islândia. 🇮🇸🌌',
      likes: 3012,
      permalink: 'https://instagram.com/donattiturismo',
    },
  ]

  const categories = [
    { id: 'praias', label: 'Praias', emoji: '🏖️', count: 32, description: 'Destinos paradisíacos à beira-mar' },
    { id: 'montanhas', label: 'Montanhas', emoji: '🏔️', count: 18, description: 'Aventuras em meio à natureza' },
    { id: 'cidades', label: 'Cidades', emoji: '🏙️', count: 45, description: 'Explore metrópoles e cultura' },
    { id: 'exoticos', label: 'Exóticos', emoji: '🌴', count: 24, description: 'Destinos únicos e inesquecíveis' },
  ]

  const popularDestinations: OfferData[] = [
    {
      id: 1,
      name: 'Cancún All Inclusive',
      country: 'México',
      price: 3499,
      priceOld: 6998,
      rating: 4.9,
      duration: '7 dias',
      image: '/couple-at-maldives-beach-sunset.jpg',
      highlights: ['All inclusive', 'Transfer incluído'],
      category: 'praias',
      slug: 'cancun-all-inclusive',
    },
    {
      id: 2,
      name: 'Paris',
      country: 'França',
      price: 7800,
      priceOld: 12000,
      rating: 4.8,
      duration: '5 dias',
      image: '/woman-in-yellow-dress-in-paris-eiffel-tower.jpg',
      highlights: ['Torre Eiffel', 'Museu do Louvre'],
      category: 'cidades',
      slug: 'paris-romantica',
    },
    {
      id: 3,
      name: 'Santorini',
      country: 'Grécia',
      price: 9200,
      priceOld: 15000,
      rating: 4.9,
      duration: '6 dias',
      image: '/traveler-at-santorini-greece-blue-domes.jpg',
      highlights: ['Pôr do sol em Oia', 'Casas brancas'],
      category: 'praias',
      slug: 'santorini-grecia',
    },
    {
      id: 4,
      name: 'Maldivas',
      country: 'Ásia',
      price: 12500,
      priceOld: 25000,
      rating: 4.9,
      duration: '7 dias',
      image: '/couple-at-maldives-beach-sunset.jpg',
      highlights: ['Bangalôs sobre a água', 'Mergulho'],
      category: 'exoticos',
      slug: 'maldivas-exclusivo',
    },
  ]

  const painPoints = [
    {
      problem: 'Falta de tempo para planejar',
      solution: 'Nós cuidamos de tudo, da pesquisa à reserva, para que você só precise fazer as malas.',
      icon: Clock,
    },
    {
      problem: 'Insegurança com reservas online',
      solution: 'Garantimos fornecedores confiáveis e seguros, com suporte 24h para qualquer imprevisto.',
      icon: Shield,
    },
    {
      problem: 'Dificuldade em montar roteiros',
      solution: 'Criamos roteiros personalizados que otimizam seu tempo e orçamento, com dicas locais exclusivas.',
      icon: MapPin,
    },
  ]

  const differentials = [
    {
      title: 'Atendimento Personalizado',
      description: 'Consultores especialistas que entendem suas necessidades e criam a viagem dos seus sonhos.',
      icon: Headphones,
    },
    {
      title: 'Roteiros Exclusivos',
      description: 'Experiências únicas e autênticas, fugindo do óbvio e explorando o melhor de cada destino.',
      icon: Compass,
    },
    {
      title: 'Melhores Parceiros',
      description: 'Seleção rigorosa de hotéis, companhias aéreas e serviços para garantir sua satisfação.',
      icon: Award,
    },
    {
      title: 'Suporte Total',
      description: 'Assistência completa antes, durante e após a sua viagem, para que você viaje com tranquilidade.',
      icon: Users,
    },
  ]

  const testimonials = [
    {
      name: 'Ana e Carlos',
      location: 'São Paulo, SP',
      rating: 5,
      text: 'A Donatti tornou nossa lua de mel nas Maldivas um sonho real. Cuidaram de cada detalhe com perfeição. Inesquecível!',
    },
    {
      name: 'Juliana F.',
      location: 'Rio de Janeiro, RJ',
      rating: 5,
      text: 'Minha viagem solo para a Itália foi incrível graças ao roteiro personalizado. Me senti segura e aproveitei cada segundo.',
    },
    {
      name: 'Família Martins',
      location: 'Belo Horizonte, MG',
      rating: 5,
      text: 'As crianças amaram a Disney! A organização da Donatti foi impecável, superou nossas expectativas.',
    },
  ]

  // ============================================
  // EFEITOS
  // ============================================

  useEffect(() => {
    const fetchInstagramPosts = async () => {
      try {
        setInstagramPosts(placeholderPosts)
      } catch (error) {
        console.error('Error fetching Instagram:', error)
        setInstagramPosts(placeholderPosts)
      } finally {
        setInstagramLoading(false)
      }
    }

    fetchInstagramPosts()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Dados estruturados JSON-LD para SEO
  useEffect(() => {
    const organizationData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Donatti Turismo',
      url: 'https://donattiturismo.com.br',
      logo: 'https://donattiturismo.com.br/logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+55-11-99999-9999',
        contactType: 'customer service',
        areaServed: 'BR',
        availableLanguage: ['pt-BR'],
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '5000',
      },
    }

    const offerData = {
      '@context': 'https://schema.org',
      '@type': 'Offer',
      name: 'Black Friday - Pacotes de Viagem',
      description: 'Até 50% de desconto em pacotes de viagem selecionados',
      priceCurrency: 'BRL',
      validFrom: '2025-11-25T00:00:00-03:00',
      validThrough: '2025-11-29T23:59:59-03:00',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Donatti Turismo',
      },
    }

    const script1 = document.createElement('script')
    script1.type = 'application/ld+json'
    script1.text = JSON.stringify(organizationData)
    document.head.appendChild(script1)

    const script2 = document.createElement('script')
    script2.type = 'application/ld+json'
    script2.text = JSON.stringify(offerData)
    document.head.appendChild(script2)

    return () => {
      document.head.removeChild(script1)
      document.head.removeChild(script2)
    }
  }, [])

  // ============================================
  // FUNÇÕES
  // ============================================

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Olá! Como posso te ajudar a planejar sua viagem dos sonhos?' },
        ])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, houve um erro. Por favor, tente novamente.' },
      ])
      setIsLoading(false)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory((prev) => (prev === categoryId ? null : categoryId))
  }

  const filteredDestinations = activeCategory
    ? popularDestinations.filter((dest) => dest.category === activeCategory)
    : popularDestinations

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const calculateDiscount = (oldPrice: number, currentPrice: number) => {
    return Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link para acessibilidade */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:top-4 focus:left-4 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Pular para o conteúdo principal
      </a>

      {/* Header - Landmark */}
      <header
        role="banner"
        className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOTIPO_PNG_COR-HrrWIVyKTna8rzMaQYpuC0rmVAgCd3.png"
              alt="Donatti Turismo - Voltar para página inicial"
              className="h-12 w-12 object-contain"
              width="48"
              height="48"
            />
          </div>

          <nav role="navigation" aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
            <a
              href="#destinos"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-2 py-1"
            >
              Destinos
            </a>
            <a
              href="#como-funciona"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-2 py-1"
            >
              Como Funciona
            </a>
            <a
              href="#avaliacoes"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-sm px-2 py-1"
            >
              Avaliações
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsLeadModalOpen(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90 min-h-[44px] min-w-[44px]"
            >
              Consulte Agora
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Landmark */}
      <main id="main-content" role="main">
        {/* Hero Section */}
        <section
          aria-labelledby="hero-title"
          className="relative flex min-h-[75vh] items-center justify-center overflow-hidden bg-cover bg-center py-20"
          style={{ backgroundImage: "url('/couple-at-maldives-beach-sunset.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
          <div className="container relative z-10 mx-auto px-4">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center text-white">
              <Badge className="border-2 border-yellow-400 bg-yellow-500 text-black hover:bg-yellow-600">
                <Award className="mr-2 h-4 w-4" aria-hidden="true" />
                Black Friday Imperdível
              </Badge>

              <h1 id="hero-title" className="text-4xl font-extrabold leading-tight drop-shadow-lg md:text-6xl">
                Black Friday: Sua próxima aventura com até <span className="text-yellow-400">50% OFF</span>
              </h1>

              <p className="max-w-3xl text-lg leading-relaxed text-gray-200 drop-shadow-md md:text-xl">
                <strong>Até 50% de desconto</strong> em pacotes selecionados e <strong>parcelamento em até 12x sem
                juros</strong>.
                <br />
                Mais de 5.000 viajantes já garantiram suas férias com a Donatti Turismo.
              </p>

              {/* Contador acessível */}
              <div className="my-4">
                <CountdownTimer targetDate="2025-11-29T23:59:59-03:00" />
              </div>

              <Button
                size="lg"
                onClick={() => {
                  document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="h-14 rounded-full bg-yellow-500 px-10 text-lg font-bold text-black shadow-lg transition-transform hover:scale-105 hover:bg-yellow-400 min-h-[52px]"
              >
                Ver ofertas da Black Friday
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>

        {/* Search Section - Acima da dobra */}
        <section
          aria-labelledby="search-title"
          className="relative z-10 -mt-16 bg-gradient-to-b from-transparent to-background py-8"
        >
          <div className="container mx-auto px-4">
            <h2 id="search-title" className="sr-only">
              Buscar pacotes de viagem
            </h2>

            <Card className="mx-auto w-full max-w-3xl border-0 bg-card shadow-2xl">
              <form
                role="search"
                aria-label="Buscar pacotes de viagem"
                onSubmit={(e) => {
                  e.preventDefault()
                  console.log('Buscando:', searchQuery)
                }}
                className="grid items-center gap-4 p-4 md:grid-cols-3"
              >
                <div className="flex items-center gap-3 rounded-lg md:col-span-2">
                  <label htmlFor="search-input" className="sr-only">
                    Digite destino, data ou orçamento
                  </label>
                  <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                  <Input
                    id="search-input"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Digite destino, data ou orçamento (ex: Cancún, Janeiro, R$ 3.000)"
                    className="border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0"
                    aria-describedby="search-hint"
                  />
                  <span id="search-hint" className="sr-only">
                    Pesquise por cidade, país, mês ou valor aproximado
                  </span>
                </div>
                <Button
                  type="submit"
                  className="h-full w-full bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50 transition-all hover:bg-primary/90 hover:shadow-lg min-h-[52px]"
                >
                  <Search className="mr-2 h-5 w-5" aria-hidden="true" />
                  Buscar
                </Button>
              </form>
            </Card>
          </div>
        </section>

        {/* Social Proof Bar */}
        <section aria-label="Prova social" className="border-b border-border/40 bg-card py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-center md:gap-8">
              <div className="flex items-center gap-2">
                <div className="flex" aria-label="Avaliação 4,9 de 5 estrelas">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                  ))}
                  <Star className="h-5 w-5 fill-yellow-400/50 text-yellow-400" aria-hidden="true" />
                </div>
                <span className="ml-2 font-bold text-foreground">4,9/5</span>
              </div>
              <p className="text-muted-foreground">
                Baseado em <strong className="text-foreground">5.000+ avaliações</strong> verificadas
              </p>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section id="destinos" aria-labelledby="categories-title" className="border-b border-border/40 bg-background py-12">
          <div className="container mx-auto px-4">
            <h2 id="categories-title" className="mb-3 text-center text-3xl font-bold md:text-4xl">
              Explore por categoria
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-lg text-muted-foreground">
              Encontre o destino perfeito para sua próxima aventura
            </p>

            <div role="group" aria-label="Filtrar por categoria de destino" className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  aria-pressed={activeCategory === category.id}
                  aria-label={`Filtrar por ${category.label}. ${category.count} pacotes disponíveis`}
                  className={`group flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition-all hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/50 ${
                    activeCategory === category.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/40 bg-background hover:border-primary/40'
                  }`}
                >
                  <div className="text-5xl" aria-hidden="true">
                    {category.emoji}
                  </div>
                  <span className="text-lg font-semibold">{category.label}</span>
                  <span className="text-sm opacity-80">{category.count} pacotes</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Offers Section */}
        <section id="ofertas" aria-labelledby="offers-title" className="bg-background py-16">
          <div className="container mx-auto px-4">
            <h2 id="offers-title" className="mb-3 text-center text-3xl font-bold md:text-4xl">
              Ofertas em destaque
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-muted-foreground">
              Pacotes selecionados com os maiores descontos da Black Friday
            </p>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {filteredDestinations.map((dest) => {
                const discount = calculateDiscount(dest.priceOld, dest.price)
                const installmentValue = Math.floor(dest.price / 12)

                return (
                  <article key={dest.id} className="group overflow-hidden rounded-xl border-0 bg-card shadow-lg transition-all hover:shadow-2xl">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={dest.image}
                        alt={`${dest.name} - ${dest.country}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        width="400"
                        height="300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />
                      <Badge className="absolute right-3 top-3 bg-red-500 text-white">{discount}% OFF</Badge>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 backdrop-blur-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                        <span className="text-sm font-semibold text-white">{dest.rating}</span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-foreground">{dest.name}</h3>
                        <p className="text-sm text-muted-foreground">{dest.country} • {dest.duration}</p>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {dest.highlights.map((highlight, i) => (
                          <span key={i} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                            {highlight}
                          </span>
                        ))}
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground line-through">De {formatCurrency(dest.priceOld)}</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(dest.price)}</p>
                        <p className="text-sm text-muted-foreground">ou 12x de {formatCurrency(installmentValue)} sem juros</p>
                      </div>

                      <Button
                        onClick={() => setIsLeadModalOpen(true)}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]"
                      >
                        Ver detalhes
                        <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>

            {activeCategory && filteredDestinations.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-xl text-muted-foreground">Nenhum pacote encontrado nesta categoria.</p>
              </div>
            )}
          </div>
        </section>

        {/* Pain Points Section */}
        <section id="como-funciona" aria-labelledby="pain-points-title" className="bg-gradient-to-b from-secondary/30 to-background py-16">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-accent/10 text-accent hover:bg-accent/20">Entendemos Você</Badge>
              <h2 id="pain-points-title" className="mb-4 text-3xl font-bold md:text-4xl">
                Planejar uma viagem não precisa ser complicado
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Sabemos dos desafios que você enfrenta. Por isso, criamos soluções personalizadas para cada um deles
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {painPoints.map((point, index) => (
                <Card key={index} className="border-2 border-border/40 bg-card p-8 transition-all hover:border-primary/40 hover:shadow-xl">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                    <point.icon className="h-7 w-7 text-accent" aria-hidden="true" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{point.problem}</h3>
                  <p className="leading-relaxed text-muted-foreground">{point.solution}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section aria-labelledby="differentials-title" className="bg-background py-16">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">Por Que Donatti Turismo?</Badge>
              <h2 id="differentials-title" className="mb-4 text-3xl font-bold md:text-4xl">
                Mais que uma agência, <span className="text-primary">seu parceiro de viagens</span>
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {differentials.map((diff, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                    <diff.icon className="h-10 w-10 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{diff.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{diff.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="avaliacoes" aria-labelledby="testimonials-title" className="bg-gradient-to-b from-secondary/30 to-background py-16">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-accent/10 text-accent hover:bg-accent/20">Depoimentos</Badge>
              <h2 id="testimonials-title" className="mb-4 text-3xl font-bold md:text-4xl">
                O que nossos clientes dizem
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Mais de 5.000 viajantes já realizaram seus sonhos com a Donatti Turismo
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 bg-card p-8 shadow-lg">
                  <div className="mb-4 flex gap-1" aria-label={`Avaliação ${testimonial.rating} de 5 estrelas`}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="mb-6 italic leading-relaxed text-muted-foreground">"{testimonial.text}"</p>
                  <div className="border-t border-border/40 pt-4">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust & Guarantees */}
        <section aria-labelledby="trust-title" className="border-y border-border/40 bg-background py-16">
          <div className="container mx-auto px-4">
            <h2 id="trust-title" className="mb-12 text-center text-3xl font-bold md:text-4xl">
              Segurança e confiança garantidas
            </h2>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Pagamento 100% Seguro</h3>
                <p className="text-muted-foreground">Proteção completa em todas as transações</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Award className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Cadastur Certificado</h3>
                <p className="text-muted-foreground">Agência regularizada e confiável</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Zap className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Suporte 24/7</h3>
                <p className="text-muted-foreground">Assistência completa a qualquer hora</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-center text-sm text-muted-foreground">
              <a href="/politica-cancelamento" className="underline hover:text-foreground">
                Política de cancelamento
              </a>
              <span aria-hidden="true">•</span>
              <a href="/politica-privacidade" className="underline hover:text-foreground">
                Política de privacidade
              </a>
              <span aria-hidden="true">•</span>
              <a href="/termos-uso" className="underline hover:text-foreground">
                Termos de uso
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="cta-title" className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 py-20">
          <div className="container relative z-10 mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 id="cta-title" className="mb-6 text-4xl font-bold text-primary-foreground md:text-5xl">
                Não perca as ofertas da Black Friday
              </h2>
              <p className="mb-8 text-lg text-primary-foreground/90">
                Garanta até 50% de desconto e parcele em até 12x sem juros. Vagas limitadas!
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => {
                    document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="bg-background text-foreground hover:bg-background/90 min-h-[52px] min-w-[200px]"
                >
                  Ver todas as ofertas
                </Button>
                <Button
                  size="lg"
                  asChild
                  variant="outline"
                  className="border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary min-h-[52px] min-w-[200px]"
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
          <div className="absolute inset-0 bg-[url('/abstract-travel-pattern.png')] opacity-5" aria-hidden="true" />
        </section>
      </main>

      {/* Footer - Landmark */}
      <footer role="contentinfo" className="border-t border-border/40 bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOTIPO_PNG_COR-HrrWIVyKTna8rzMaQYpuC0rmVAgCd3.png"
                  alt="Donatti Turismo"
                  className="h-8 w-8 object-contain"
                  width="32"
                  height="32"
                />
              </div>
              <p className="text-sm text-muted-foreground">Realizando sonhos de viagem há mais de 15 anos.</p>
              <p className="mt-2 text-xs text-muted-foreground">Cadastur: 00.000.000/0001-00</p>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Links Rápidos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/destinos" className="hover:text-primary">
                    Destinos
                  </a>
                </li>
                <li>
                  <a href="/pacotes" className="hover:text-primary">
                    Pacotes
                  </a>
                </li>
                <li>
                  <a href="/sobre" className="hover:text-primary">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="/contato" className="hover:text-primary">
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Suporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/faq" className="hover:text-primary">
                    Perguntas Frequentes
                  </a>
                </li>
                <li>
                  <a href="/politica-cancelamento" className="hover:text-primary">
                    Política de Cancelamento
                  </a>
                </li>
                <li>
                  <a href="/termos-uso" className="hover:text-primary">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="/politica-privacidade" className="hover:text-primary">
                    Privacidade
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Contato</h3>
              <address className="not-italic text-sm text-muted-foreground">
                <p className="mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                  <a href="tel:+5511999999999" className="hover:text-primary">
                    (11) 99999-9999
                  </a>
                </p>
                <p className="mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                  <a href="mailto:contato@donattiturismo.com.br" className="hover:text-primary">
                    contato@donattiturismo.com.br
                  </a>
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://instagram.com/donattiturismo"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram da Donatti Turismo"
                    className="rounded-lg bg-secondary p-2 transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <Instagram className="h-5 w-5" aria-hidden="true" />
                  </a>
                  <a
                    href="https://facebook.com/donattiturismo"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook da Donatti Turismo"
                    className="rounded-lg bg-secondary p-2 transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <Facebook className="h-5 w-5" aria-hidden="true" />
                  </a>
                </div>
              </address>
            </div>
          </div>

          <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            © 2025 Donatti Turismo. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Chat Bot (mantido do original) */}
      {isChatOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-96 border-0 shadow-2xl" role="dialog" aria-labelledby="chat-title">
          <div className="flex items-center justify-between border-b border-border bg-primary p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <Sparkles className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <div>
                <h3 id="chat-title" className="font-semibold text-primary-foreground">
                  Assistente Donatti
                </h3>
                <p className="text-xs text-primary-foreground/80">Sempre online</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              aria-label="Fechar chat"
              className="rounded-lg p-1 text-primary-foreground/80 hover:bg-primary-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary-foreground min-h-[44px] min-w-[44px]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="h-96 overflow-y-auto bg-background p-4" role="log" aria-live="polite" aria-atomic="false">
            {chatMessages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <MessageCircle className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h4 className="mb-2 font-semibold">Como posso ajudar?</h4>
                <p className="text-sm text-muted-foreground">
                  Pergunte sobre destinos, pacotes ou tire suas dúvidas sobre viagens!
                </p>
              </div>
            )}

            {chatMessages.map((msg, index) => (
              <div key={index} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-secondary px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-border p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex gap-2"
            >
              <label htmlFor="chat-input" className="sr-only">
                Digite sua mensagem
              </label>
              <Input
                id="chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] min-w-[44px]">
                <Send className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Enviar mensagem</span>
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          aria-label="Abrir chat de atendimento"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/50"
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        </button>
      )}

      {/* Lead Modal */}
      {isLeadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 id="modal-title" className="text-2xl font-bold">
                Solicite sua Consultoria
              </h2>
              <button
                onClick={() => setIsLeadModalOpen(false)}
                aria-label="Fechar modal"
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-6">
              <p className="mb-6 text-muted-foreground">
                Preencha seus dados e entraremos em contato para planejar sua viagem perfeita!
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  console.log('Form submitted')
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="name" className="sr-only">
                    Seu nome completo
                  </label>
                  <Input id="name" placeholder="Seu nome completo" className="bg-secondary/50" required />
                </div>
                <div>
                  <label htmlFor="email" className="sr-only">
                    Seu melhor e-mail
                  </label>
                  <Input id="email" type="email" placeholder="Seu melhor e-mail" className="bg-secondary/50" required />
                </div>
                <div>
                  <label htmlFor="phone" className="sr-only">
                    WhatsApp / Telefone
                  </label>
                  <Input id="phone" type="tel" placeholder="WhatsApp / Telefone" className="bg-secondary/50" required />
                </div>
                <div>
                  <label htmlFor="destination" className="sr-only">
                    Destino de interesse
                  </label>
                  <Input id="destination" placeholder="Destino de interesse" className="bg-secondary/50" />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]">
                  Enviar Solicitação
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
