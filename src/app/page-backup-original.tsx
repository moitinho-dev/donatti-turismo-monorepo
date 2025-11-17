'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Calendar, Star, Send, X, MessageCircle, Sparkles, ArrowRight, Globe, Shield, Award, ChevronRight, Instagram, Facebook, Mail, Phone, Heart, Target, TrendingUp, Headphones, Plane, Hotel, Compass, Users, DollarSign, Zap, Clock } from 'lucide-react'
import CountdownTimer from '@/components/hero/CountdownTimer'

type InstagramPost = {
  id: string
  image: string
  caption: string
  likes: number
  permalink?: string
  timestamp?: string
}

export default function DonattiTurismo() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([])
  const [instagramLoading, setInstagramLoading] = useState(true)
  const [instagramError, setInstagramError] = useState<string | null>(null)

  const placeholderPosts: InstagramPost[] = [
    {
      id: '1',
      image: '/traveler-at-santorini-greece-blue-domes.jpg',
      caption: 'Santorini nunca decepciona! 🇬🇷✨',
      likes: 1243,
      permalink: 'https://instagram.com/donattiturismo'
    },
    {
      id: '2',
      image: '/couple-at-maldives-beach-sunset.jpg',
      caption: 'O paraíso nas Maldivas. 🇲🇻❤️',
      likes: 2109,
      permalink: 'https://instagram.com/donattiturismo'
    },
    {
      id: '3',
      image: '/woman-in-yellow-dress-in-paris-eiffel-tower.jpg',
      caption: 'Paris, je t\'aime! 🇫🇷🥐',
      likes: 1876,
      permalink: 'https://instagram.com/donattiturismo'
    },
    {
      id: '4',
      image: '/aurora-borealis-in-iceland.jpg',
      caption: 'Dançando com as luzes do norte na Islândia. 🇮🇸🌌',
      likes: 3012,
      permalink: 'https://instagram.com/donattiturismo'
    },
  ]

  useEffect(() => {
    const fetchInstagramPosts = async () => {
      try {
        // Mocking API call for now
        setInstagramPosts(placeholderPosts)
      } catch (error) {
        console.error('[v0] Error fetching Instagram:', error)
        setInstagramError('Could not connect to Instagram')
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Mocking chat response
      setTimeout(() => {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Olá! Como posso te ajudar a planejar sua viagem dos sonhos?' }])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, houve um erro. Por favor, tente novamente.' }
      ])
      setIsLoading(false)
    }
  }

  const categories = [
    { label: 'Praias', icon: Globe, color: 'bg-blue-100 text-blue-600' },
    { label: 'Montanhas', icon: Target, color: 'bg-green-100 text-green-600' },
    { label: 'Cidades', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
    { label: 'Exóticos', icon: Sparkles, color: 'bg-yellow-100 text-yellow-600' },
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

  const processSteps = [
    {
      number: 1,
      title: 'Consulta Inicial',
      description: 'Você nos conta seus sonhos e expectativas. É o ponto de partida para uma viagem inesquecível.',
    },
    {
      number: 2,
      title: 'Roteiro Personalizado',
      description: 'Nossos especialistas montam um roteiro detalhado, com opções de voos, hotéis e passeios.',
    },
    {
      number: 3,
      title: 'Reservas e Confirmação',
      description: 'Após sua aprovação, cuidamos de todas as reservas e documentação necessária.',
    },
    {
      number: 4,
      title: 'Suporte e Viagem',
      description: 'Você recebe seu kit de viagem e conta com nosso suporte 24/7 durante toda a jornada.',
    },
  ]

  const popularDestinations = [
    {
      name: 'Maldivas',
      country: 'Ásia',
      price: 'R$ 12.500',
      rating: 4.9,
      duration: '7 dias',
      image: '/couple-at-maldives-beach-sunset.jpg',
      highlights: ['Bangalôs sobre a água', 'Mergulho'],
    },
    {
      name: 'Paris',
      country: 'França',
      price: 'R$ 7.800',
      rating: 4.8,
      duration: '5 dias',
      image: '/woman-in-yellow-dress-in-paris-eiffel-tower.jpg',
      highlights: ['Torre Eiffel', 'Museu do Louvre'],
    },
    {
      name: 'Santorini',
      country: 'Grécia',
      price: 'R$ 9.200',
      rating: 4.9,
      duration: '6 dias',
      image: '/traveler-at-santorini-greece-blue-domes.jpg',
      highlights: ['Pôr do sol em Oia', 'Casas brancas'],
    },
    {
      name: 'Tóquio',
      country: 'Japão',
      price: 'R$ 15.000',
      rating: 4.7,
      duration: '8 dias',
      image: '/shibuya-crossing-in-tokyo-japan.jpg',
      highlights: ['Cultura pop', 'Templos antigos'],
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOTIPO_PNG_COR-HrrWIVyKTna8rzMaQYpuC0rmVAgCd3.png" 
              alt="Donatti Turismo" 
              className="h-12 w-12 object-contain"
            />
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#destinos" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Destinos
            </a>
            <a href="#pacotes" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Pacotes
            </a>
            <a href="#sobre" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Sobre
            </a>
            <a href="#contato" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Contato
            </a>
          </nav>

          <Button onClick={() => setIsLeadModalOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Consulte Agora
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section 
          className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-cover bg-center py-20 md:py-32"
          style={{ backgroundImage: "url('/couple-at-maldives-beach-sunset.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="container relative z-10 mx-auto px-4">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center text-white">
              <Badge className="animate-pulse border-2 border-yellow-400 bg-yellow-500 text-black hover:bg-yellow-600">
                <Award className="mr-2 h-4 w-4" />
                Black Friday Imperdível
              </Badge>
              <h1 className="text-5xl font-extrabold leading-tight drop-shadow-lg md:text-7xl">
                Black Friday: Sua próxima aventura com até <span className="text-yellow-400">50% OFF</span>
              </h1>
              <p className="max-w-3xl text-lg leading-relaxed text-gray-200 drop-shadow-md md:text-xl">
                Última chance de garantir o seu pacote dos sonhos por preços incríveis.
                <br />
                <span className="mt-2 block font-semibold">Descontos de até 50% em pacotes selecionados e parcelamento em até 12x sem juros.</span>
              </p>
              
              <div className="my-4">
                <CountdownTimer targetDate="2025-11-28T23:59:59" />
              </div>

              <Button size="lg" className="h-14 animate-bounce rounded-full bg-yellow-500 px-10 text-lg font-bold text-black shadow-lg transition-transform hover:scale-105 hover:bg-yellow-400">
                Garanta seu Desconto
              </Button>

              <Card className="mt-8 w-full max-w-3xl overflow-hidden border-0 bg-white/10 shadow-2xl backdrop-blur-md">
                <div className="grid items-center gap-4 p-4 md:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg p-2 md:col-span-2">
                    <MapPin className="h-5 w-5 text-yellow-400" />
                    <Input
                      placeholder="Procure pacotes com desconto (ex: Maldivas, Paris...)"
                      className="border-0 bg-transparent p-0 text-white placeholder:text-gray-300 focus-visible:ring-0"
                    />
                  </div>
                  <Button className="h-full w-full bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50 transition-all hover:bg-primary/90 hover:shadow-lg">
                    <Search className="mr-2 h-5 w-5" />
                    Buscar
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="border-b border-border/40 bg-card py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-center md:gap-8">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400/50 text-yellow-400" />
                <span className="ml-2 font-bold text-foreground">Avaliação 4.9/5</span>
              </div>
              <p className="text-muted-foreground">
                <span className="font-bold text-foreground">Mais de 5.000 viajantes</span> aproveitaram nossas ofertas na última Black Friday!
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-b border-border/40 bg-background py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border/40 bg-background p-6 transition-all hover:border-primary/40 hover:shadow-lg"
                >
                  <div className={`rounded-xl p-4 transition-transform group-hover:scale-110 ${category.color}`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-foreground">{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 bg-accent/10 text-accent hover:bg-accent/20">Entendemos Você</Badge>
              <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
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
                    <point.icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-foreground">{point.problem}</h3>
                  <p className="text-muted-foreground leading-relaxed">{point.solution}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">Por Que Donatti Turismo?</Badge>
              <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
                Mais que uma agência, <span className="text-primary">seu parceiro de viagens</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Combinamos expertise, tecnologia e atendimento humanizado para criar experiências inesquecíveis
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {differentials.map((diff, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                    <diff.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-foreground">{diff.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{diff.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">Como Funciona</Badge>
              <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
                Do sonho à realidade em 4 passos
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Nosso processo é simples, transparente e focado em transformar sua viagem na experiência perfeita
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="mb-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <span className="text-2xl font-bold">{step.number}</span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="absolute -right-4 top-8 hidden lg:block">
                      <ChevronRight className="h-6 w-6 text-primary/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button 
                onClick={() => setIsLeadModalOpen(true)}
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Começar Minha Viagem
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section id="destinos" className="py-20 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">Destinos Populares</Badge>
              <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
                Explore o Mundo
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Selecionamos os destinos mais procurados com experiências autênticas e memoráveis
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {popularDestinations.map((dest, index) => (
                <Card
                  key={index}
                  className="group overflow-hidden border-0 bg-card shadow-lg transition-all hover:shadow-2xl"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={dest.image || "/placeholder.svg"}
                      alt={dest.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <Badge className="absolute right-3 top-3 bg-accent text-accent-foreground">
                      {dest.duration}
                    </Badge>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 backdrop-blur-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-white">{dest.rating}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{dest.name}</h3>
                        <p className="text-sm text-muted-foreground">{dest.country}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">A partir de</p>
                        <p className="font-bold text-primary">{dest.price}</p>
                      </div>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {dest.highlights.slice(0, 2).map((highlight, i) => (
                        <span key={i} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                          {highlight}
                        </span>
                      ))}
                    </div>
                    <Button
                      onClick={() => setIsLeadModalOpen(true)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Ver Detalhes
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <Badge className="mb-4 bg-accent/10 text-accent hover:bg-accent/20">Depoimentos</Badge>
              <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
                O que nossos clientes dizem
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Mais de 5.000 viajantes já realizaram seus sonhos com a Donatti Turismo
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 bg-card p-8 shadow-lg">
                  <div className="mb-4 flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-6 text-muted-foreground leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <div className="border-t border-border/40 pt-4">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Instagram Feed Section */}
        <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                <Instagram className="mr-1 h-3 w-3" />
                @donattiturismo
              </Badge>
              <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
                Acompanhe nossas <span className="text-primary">aventuras</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Inspire-se com as viagens dos nossos clientes e descubra novos destinos no nosso Instagram
              </p>
              {instagramError && (
                <p className="mt-2 text-sm text-yellow-500">
                  ⚠️ {instagramError} - Exibindo posts de exemplo
                </p>
              )}
            </div>

            {instagramLoading ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Carregando posts do Instagram...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="relative mb-8 overflow-hidden">
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {instagramPosts.map((post) => (
                      <a
                        key={post.id}
                        href={post.permalink || 'https://instagram.com/donattiturismo'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex-shrink-0"
                      >
                        <div className="relative h-[400px] w-[250px] overflow-hidden rounded-2xl border-2 border-primary/20 transition-all hover:border-primary hover:shadow-2xl">
                          <img
                            src={post.image || "/placeholder.svg"}
                            alt={post.caption}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className="mb-2 line-clamp-2 text-sm text-white">{post.caption}</p>
                            <div className="flex items-center gap-2 text-white/80">
                              <Heart className="h-4 w-4 fill-white text-white" />
                              <span className="text-xs font-medium">{post.likes.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="absolute right-3 top-3 rounded-full bg-primary/90 p-2 backdrop-blur-sm">
                            <Instagram className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <a
                      href="https://instagram.com/donattiturismo"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="mr-2 h-5 w-5" />
                      Seguir no Instagram
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Social Proof Stats Section */}
        <section className="border-y border-border/40 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="mb-2 text-5xl font-bold text-primary">+15</div>
                <p className="text-muted-foreground">Anos de Experiência</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-5xl font-bold text-primary">5.000+</div>
                <p className="text-muted-foreground">Clientes Satisfeitos</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-5xl font-bold text-primary">50+</div>
                <p className="text-muted-foreground">Destinos Internacionais</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-5xl font-bold text-primary">4.9</div>
                <p className="text-muted-foreground">Avaliação Média</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
                Garantias que fazem a diferença
              </h2>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-foreground">Viagem Segura</h3>
                <p className="text-muted-foreground">Proteção completa e suporte 24/7 em português</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-foreground">Qualidade Premium</h3>
                <p className="text-muted-foreground">Parceiros selecionados e experiências autênticas</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-foreground">Resposta Rápida</h3>
                <p className="text-muted-foreground">Atendimento ágil e personalizado para suas necessidades</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 py-20">
          <div className="container relative z-10 mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-4xl font-bold text-primary-foreground md:text-5xl">
                Pronto para sua próxima aventura?
              </h2>
              <p className="mb-8 text-lg text-primary-foreground/90">
                Fale com nossos especialistas e receba um roteiro personalizado para sua viagem dos sonhos
              </p>
              <Button
                onClick={() => setIsLeadModalOpen(true)}
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Solicitar Consultoria Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="absolute inset-0 bg-[url('/abstract-travel-pattern.png')] opacity-5" />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOTIPO_PNG_COR-HrrWIVyKTna8rzMaQYpuC0rmVAgCd3.png" 
                  alt="Donatti Turismo" 
                  className="h-8 w-8 object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Realizando sonhos de viagem desde 2010
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">Destinos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Europa</a></li>
                <li><a href="#" className="hover:text-primary">Ásia</a></li>
                <li><a href="#" className="hover:text-primary">Américas</a></li>
                <li><a href="#" className="hover:text-primary">Oceania</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Depoimentos</a></li>
                <li><a href="#" className="hover:text-primary">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">Contato</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  (11) 99999-9999
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  contato@donattiturismo.com
                </li>
                <li className="mt-4 flex gap-3">
                  <a href="#" className="rounded-lg bg-secondary p-2 transition-colors hover:bg-primary hover:text-primary-foreground">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="#" className="rounded-lg bg-secondary p-2 transition-colors hover:bg-primary hover:text-primary-foreground">
                    <Facebook className="h-5 w-5" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            © 2025 Donatti Turismo. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* AI Chatbot */}
      {isChatOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-96 border-0 shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-primary p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">Assistente Donatti</h3>
                <p className="text-xs text-primary-foreground/80">Sempre online</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="rounded-lg p-1 text-primary-foreground/80 hover:bg-primary-foreground/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-96 overflow-y-auto bg-background p-4">
            {chatMessages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h4 className="mb-2 font-semibold text-foreground">Como posso ajudar?</h4>
                <p className="text-sm text-muted-foreground">
                  Pergunte sobre destinos, pacotes ou tire suas dúvidas sobre viagens!
                </p>
              </div>
            )}

            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
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
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendMessage()}
                placeholder="Digite sua mensagem..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Lead Modal */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-6">
              <h3 className="text-2xl font-bold text-foreground">
                Solicite sua Consultoria
              </h3>
              <button
                onClick={() => setIsLeadModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="mb-6 text-muted-foreground">
                Preencha seus dados e entraremos em contato para planejar sua viagem perfeita!
              </p>
              <form className="space-y-4">
                <Input placeholder="Seu nome completo" className="bg-secondary/50" />
                <Input type="email" placeholder="Seu melhor e-mail" className="bg-secondary/50" />
                <Input type="tel" placeholder="WhatsApp / Telefone" className="bg-secondary/50" />
                <Input placeholder="Destino de interesse" className="bg-secondary/50" />
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Enviar Solicitação
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
