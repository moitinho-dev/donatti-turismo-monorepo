'use client'

import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Search, MapPin, Star, ChevronDown, Calendar, DollarSign,
  Phone, Shield, Award, Clock, Users, Plane, Heart,
  Instagram, Facebook, ArrowRight, MessageCircle, X,
} from 'lucide-react'
import Link from 'next/link'
import RealTimePromos from '@/components/home/RealTimePromos'
import { trackEvent } from '@/lib/analytics'

const WHATSAPP_URL = 'https://wa.me/5567992167694'

const stats = [
  { value: '10+', label: 'Anos de Experiencia' },
  { value: '5K+', label: 'Viajantes Felizes' },
  { value: '24/7', label: 'Suporte WhatsApp' },
  { value: '4.9', label: 'Nota no Google' },
]

const benefits = [
  {
    icon: Phone,
    title: 'Atendimento 24/7',
    description: 'Suporte completo pelo WhatsApp antes, durante e depois da sua viagem.',
  },
  {
    icon: Shield,
    title: 'Preço Garantido',
    description: 'Encontrou mais barato? Cobrimos a diferença. Sem letras miúdas.',
  },
  {
    icon: Award,
    title: 'Nota 4.9 no Google',
    description: 'Mais de 200 avaliações verificadas de clientes satisfeitos.',
  },
]

const testimonials = [
  {
    name: 'Mariana S.',
    destination: 'Cancún',
    text: 'Melhor agência que já contratei! Tudo organizado, desde o aeroporto até o hotel. Viagem perfeita!',
    rating: 5,
  },
  {
    name: 'Carlos R.',
    destination: 'Gramado',
    text: 'Atendimento incrível pelo WhatsApp. Tiraram todas as dúvidas em tempo real. Super recomendo!',
    rating: 5,
  },
  {
    name: 'Ana Paula M.',
    destination: 'Maceió',
    text: 'Preço justo, hotel maravilhoso e suporte impecável. Já estamos planejando a próxima viagem!',
    rating: 5,
  },
]

function FloatingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-5 py-3 rounded-full w-[92%] max-w-6xl transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl'
          : 'bg-white/70 backdrop-blur-lg border border-gray-200/50 shadow-lg'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden">
          <img
            src="/assets/logo-preto.png"
            alt="Donatti Turismo"
            className="h-7 object-contain"
          />
        </div>
        <span className="font-bold text-[15px] tracking-tight text-gray-900 hidden sm:block">Donatti Turismo</span>
      </div>

      <div className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-gray-500">
        <a href="#ofertas" className="hover:text-gray-900 transition-colors">Ofertas</a>
        <a href="#destinos" className="hover:text-gray-900 transition-colors">Destinos</a>
        <a href="#avaliacoes" className="hover:text-gray-900 transition-colors">Avaliações</a>
        <a href="#contato" className="hover:text-gray-900 transition-colors">Contato</a>
      </div>

      <a
        href={`${WHATSAPP_URL}?text=${encodeURIComponent('Olá! Quero saber mais sobre os pacotes de viagem.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#1a1a1a] hover:bg-[#333] text-[#ffa200] font-bold px-5 py-2 rounded-full transition-all text-[12px] shadow-md hover:shadow-lg"
      >
        Fale Conosco
      </a>
    </nav>
  )
}

function HeroIsland() {
  return (
    <div className="p-3 md:p-6 pt-24 max-w-7xl mx-auto">
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative min-h-[65vh] flex flex-col justify-center bg-[#1a1a1a] rounded-[28px] overflow-hidden border border-gray-800 shadow-2xl"
      >
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1600&q=80"
            alt=""
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#1a1a1a]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 px-8 md:px-16 max-w-[700px] flex flex-col gap-6 py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <span className="text-[#ffa200] text-[13px] font-semibold tracking-widest uppercase bg-[#ffa200]/10 px-4 py-1.5 rounded-full border border-[#ffa200]/20 inline-block mb-6">
              Agência de Viagens Campo Grande/MS
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-[42px] md:text-[64px] font-black leading-[1.05] text-white tracking-tight"
          >
            Sua próxima{' '}
            <span className="relative inline-block text-[#ffa200]">
              aventura
              <svg className="absolute -bottom-1 left-0 w-full h-2 text-[#ffa200]/50" viewBox="0 0 100 8" preserveAspectRatio="none">
                <path d="M0,5 Q25,0 50,5 T100,5" stroke="currentColor" strokeWidth="3" fill="transparent" />
              </svg>
            </span>{' '}
            começa aqui
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-gray-400 text-[17px] max-w-[450px] leading-relaxed"
          >
            Pacotes nacionais e internacionais com parcelas que cabem no bolso. Atendimento 24/7 no WhatsApp.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap gap-3 mt-2"
          >
            <a
              href="#ofertas"
              className="bg-[#ffa200] hover:bg-[#e89200] text-[#1a1a1a] font-black px-8 py-3.5 rounded-full text-[14px] transition-all hover:scale-105 shadow-[0_4px_20px_rgba(255,162,0,0.3)]"
            >
              Ver Ofertas
            </a>
            <a
              href={`${WHATSAPP_URL}?text=${encodeURIComponent('Olá! Gostaria de montar um pacote de viagem personalizado.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/15 text-white font-bold px-8 py-3.5 rounded-full text-[14px] transition-all border border-white/20 flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}

function StatsSection() {
  return (
    <section className="px-3 md:px-6 pb-12 max-w-7xl mx-auto -mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-gray-200 rounded-[20px] p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-[#ffa200]/30 transition-all"
          >
            <span className="text-[36px] md:text-[42px] font-black text-gray-900 leading-none mb-1">
              {stat.value.includes('+') ? (
                <>{stat.value.replace('+', '')}<span className="text-[#ffa200]">+</span></>
              ) : stat.value}
            </span>
            <span className="text-[13px] text-gray-500 font-medium">{stat.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function BenefitsSection() {
  return (
    <section id="destinos" className="bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-[#ffa200] text-[13px] font-semibold tracking-widest uppercase border border-gray-800 px-3 py-1 rounded-full inline-block mb-4">
            Benefícios Donatti
          </span>
          <h2 className="text-[32px] md:text-[40px] font-bold text-gray-900 leading-tight">
            Confiança logo no primeiro scroll
          </h2>
          <p className="text-gray-600 text-[18px] mt-3 max-w-xl mx-auto">
            Atendimento 24/7, preço garantido e suporte completo antes, durante e depois da viagem.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-200 rounded-[18px] p-7 shadow-sm hover:shadow-lg hover:border-[#ffa200]/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[#ffa200]/10 group-hover:bg-[#ffa200]/20 transition-colors">
                <b.icon className="h-6 w-6 text-[#ffa200]" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-gray-600 text-[15px] leading-relaxed">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function OffersSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [searchedDestination, setSearchedDestination] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveQuery(searchQuery.trim())
      trackEvent('search', { query: searchQuery.trim(), location: 'hero_search' })
    }
  }

  const handleNoResults = (query: string) => {
    setSearchedDestination(query)
    trackEvent('whatsapp_click', { location: 'no_results', query })
    setShowWhatsAppModal(true)
  }

  return (
    <section id="ofertas" className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[#ffa200] text-[13px] font-semibold tracking-widest uppercase border border-gray-800 px-3 py-1 rounded-full inline-block mb-4">
            Ofertas Imperdíveis
          </span>
          <h2 className="text-[32px] md:text-[40px] font-bold text-gray-900 leading-tight">
            Pacotes em <span className="text-[#ffa200]">destaque</span>
          </h2>
          <p className="text-gray-600 text-[18px] mt-3 max-w-xl mx-auto">
            Confira nossos pacotes com os melhores preços e condições especiais de pagamento.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar destino, hotel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffa200]/40 focus:border-[#ffa200]/50"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-[#1a1a1a] hover:bg-[#333] text-[#ffa200] font-bold px-8 py-3.5 rounded-xl transition-all text-[14px] flex items-center justify-center gap-2 shadow-md"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link
              href="/pacotes"
              className="bg-[#1a1a1a] text-[#ffa200] font-medium text-[14px] h-10 flex items-center px-4 rounded-xl border border-gray-800 hover:bg-[#333] transition-colors"
            >
              Ver todos os pacotes
            </Link>
            <Link
              href="/destinos"
              className="text-gray-700 font-medium text-[14px] h-10 flex items-center gap-2 px-4 rounded-xl hover:text-gray-900 transition-colors"
            >
              Ver todos os destinos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <RealTimePromos searchQuery={activeQuery} onNoResults={handleNoResults} limit={12} />
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Monte seu pacote</h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Não encontramos ofertas para <strong>{searchedDestination}</strong>, mas podemos montar um pacote personalizado!
            </p>
            <a
              href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Olá! Gostaria de um orçamento para ${searchedDestination}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      )}
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section id="avaliacoes" className="bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-[#ffa200] text-[13px] font-semibold tracking-widest uppercase border border-gray-800 px-3 py-1 rounded-full inline-block mb-4">
            Depoimentos Verificados
          </span>
          <h2 className="text-[32px] md:text-[40px] font-bold text-gray-900 leading-tight">
            O que nossos clientes <span className="text-[#ffa200]">dizem</span>
          </h2>
          <p className="text-gray-600 text-[18px] mt-3 max-w-xl mx-auto">
            Mais de 5.000 viajantes já realizaram seus sonhos com a Donatti Turismo
          </p>
          <a
            href="https://maps.app.goo.gl/xuzhiYXCPC2VE9Tp8"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ffa200] text-[14px] font-semibold inline-flex items-center gap-2 mt-4 hover:underline"
          >
            <Star className="h-4 w-4" />
            Ver todas as avaliações no Google
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-200 rounded-[18px] p-7 shadow-sm hover:shadow-lg hover:border-[#ffa200]/30 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-5 w-5 text-[#ffa200] fill-[#ffa200]" />
                ))}
              </div>
              <p className="text-gray-700 text-[15px] leading-relaxed mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ffa200]/10 flex items-center justify-center text-[#ffa200] font-bold text-[14px]">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[14px]">{t.name}</p>
                  <p className="text-gray-500 text-[12px]">Viagem para {t.destination}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section id="contato" className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-[24px] p-10 text-center shadow-lg hover:shadow-xl hover:border-[#ffa200]/30 transition-all">
          <MessageCircle className="h-12 w-12 text-[#ffa200] mx-auto mb-4" />
          <h2 className="text-[32px] md:text-[36px] font-bold text-gray-900 mb-3">
            Pronto para sua próxima viagem?
          </h2>
          <p className="text-gray-600 text-[17px] mb-8 max-w-lg mx-auto">
            Fale com nossa equipe e receba um orçamento personalizado em minutos. Atendimento 24/7.
          </p>
          <a
            href={`${WHATSAPP_URL}?text=${encodeURIComponent('Olá! Quero montar um pacote de viagem personalizado.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold px-10 py-4 rounded-full text-[15px] transition-all hover:scale-105 shadow-[0_4px_20px_rgba(37,211,102,0.3)]"
          >
            <MessageCircle className="h-5 w-5" />
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-400 py-14">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/assets/logo-preto.png" alt="Donatti" className="h-8 brightness-0 invert object-contain" />
            </div>
            <p className="text-[14px] leading-relaxed">
              Sua agência de viagens em Campo Grande/MS. Pacotes nacionais e internacionais com atendimento personalizado.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-[14px] mb-4">Links</h4>
            <div className="flex flex-col gap-2 text-[14px]">
              <Link href="/pacotes" className="hover:text-white transition-colors">Pacotes</Link>
              <Link href="/destinos" className="hover:text-white transition-colors">Destinos</Link>
              <a href="#avaliacoes" className="hover:text-white transition-colors">Avaliações</a>
              <a href="#contato" className="hover:text-white transition-colors">Contato</a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-[14px] mb-4">Contato</h4>
            <div className="flex flex-col gap-2 text-[14px]">
              <a href="tel:+5567992167694" className="hover:text-white transition-colors">(67) 99216-7694</a>
              <a href="mailto:contato@donattiturismo.com.br" className="hover:text-white transition-colors">contato@donattiturismo.com.br</a>
              <span>Av. Tamandaré, 8 - Vila Planalto</span>
              <span>Campo Grande - MS</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-[14px] mb-4">Redes Sociais</h4>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/donattiturismo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ffa200]/20 hover:text-[#ffa200] transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/donattiturismo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ffa200]/20 hover:text-[#ffa200] transition-all"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#25D366]/20 hover:text-[#25D366] transition-all"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px]">
          <p>© 2025 Donatti Turismo. Todos os direitos reservados. CNPJ 41.887.394/0001-29.</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-[#ffa200]" />
              <span>Site seguro SSL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#ffa200]" />
              <span>Cadastur ativo</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Floating WhatsApp button
function WhatsAppFAB() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <motion.a
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      href={`${WHATSAPP_URL}?text=${encodeURIComponent('Olá! Vim pelo site e gostaria de mais informações.')}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="h-7 w-7 text-white" />
    </motion.a>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <FloatingNav />
      <HeroIsland />
      <StatsSection />
      <BenefitsSection />
      <OffersSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <WhatsAppFAB />
    </div>
  )
}
