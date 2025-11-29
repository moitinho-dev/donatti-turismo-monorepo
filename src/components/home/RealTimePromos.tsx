'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, MapPin, Calendar, DollarSign, Loader2, Phone, MessageCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface PromoData {
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
}

interface UnsplashImage {
  id: string
  urls: {
    regular: string
    small: string
  }
  alt_description: string | null
  user: {
    name: string
  }
}

interface RealTimePromosProps {
  searchQuery?: string
  onNoResults?: (query: string) => void
}

export default function RealTimePromos({ searchQuery = '', onNoResults }: RealTimePromosProps) {
  const [promos, setPromos] = useState<PromoData[]>([])
  const [promosWithImages, setPromosWithImages] = useState<Array<PromoData & { image: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [selectedPromo, setSelectedPromo] = useState<(PromoData & { image: string }) | null>(null)
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    loadPromos()
  }, [])

  const loadPromos = async () => {
    try {
      setIsLoading(true)

      // 1. Buscar promos cadastradas no sistema (banco de dados)
      let allPromos: PromoData[] = []

      try {
        // Primeiro tenta buscar do banco de dados (promos cadastradas no admin)
        const dbPromosRes = await fetch('/api/promos/public')
        if (dbPromosRes.ok) {
          allPromos = await dbPromosRes.json()
        }
      } catch (apiError) {
        console.warn('API de promos do banco não disponível')
      }

      // Se não houver promos do banco, tenta a planilha antiga
      if (allPromos.length === 0) {
        try {
          const promosRes = await fetch('/api/promosenviadas')
          if (promosRes.ok) {
            allPromos = await promosRes.json()
          }
        } catch (apiError) {
          console.warn('API de promos enviadas não disponível')
        }
      }

      // Se ainda não houver promos, usar dados de exemplo
      if (allPromos.length === 0) {
        allPromos = getFallbackPromos()
      }

      // 2. Pegar as 6 primeiras (já vem ordenado por data)
      const selectedPromos = allPromos.slice(0, 6)

      setPromos(selectedPromos)

      // 4. Buscar imagens do Unsplash para cada destino
      const promosWithImagesData = await Promise.all(
        selectedPromos.map(async (promo) => {
          try {
            const imageRes = await fetch(
              `/api/image-search?query=${encodeURIComponent(promo.DESTINO)}&limit=1`
            )
            const imageData = await imageRes.json()
            const image = imageData.results?.[0]?.urls?.regular || '/placeholder-travel.jpg'

            return {
              ...promo,
              image,
            }
          } catch (error) {
            console.error(`Erro ao buscar imagem para ${promo.DESTINO}:`, error)
            return {
              ...promo,
              image: '/placeholder-travel.jpg',
            }
          }
        })
      )

      setPromosWithImages(promosWithImagesData)
    } catch (error) {
      console.error('Erro ao carregar promos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFallbackPromos = (): PromoData[] => {
    const today = new Date()
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`

    return [
      {
        DATA_FORMATADA: formattedDate,
        DESTINO: 'Cancún',
        HOTEL: 'Grand Oasis Cancun All Inclusive',
        VALOR: '160',
        ALL_INCLUSIVE: true,
        NUMERO_DE_NOITES: '7',
        SP: true,
      },
      {
        DATA_FORMATADA: formattedDate,
        DESTINO: 'Punta Cana',
        HOTEL: 'Barceló Bávaro Palace',
        VALOR: '145',
        ALL_INCLUSIVE: true,
        NUMERO_DE_NOITES: '7',
        SP: true,
      },
      {
        DATA_FORMATADA: formattedDate,
        DESTINO: 'Miami',
        HOTEL: 'Fontainebleau Miami Beach',
        VALOR: '120',
        COM_CAFE: true,
        NUMERO_DE_NOITES: '5',
        SP: true,
      },
      {
        DATA_FORMATADA: formattedDate,
        DESTINO: 'Buenos Aires',
        HOTEL: 'Alvear Palace Hotel',
        VALOR: '95',
        COM_CAFE: true,
        NUMERO_DE_NOITES: '4',
        CG: true,
        SP: true,
      },
      {
        DATA_FORMATADA: formattedDate,
        DESTINO: 'Santiago',
        HOTEL: 'W Santiago',
        VALOR: '85',
        COM_CAFE: true,
        NUMERO_DE_NOITES: '5',
        SP: true,
      },
      {
        DATA_FORMATADA: formattedDate,
        DESTINO: 'Orlando',
        HOTEL: 'Universal\'s Cabana Bay Beach Resort',
        VALOR: '110',
        SEM_CAFE: true,
        NUMERO_DE_NOITES: '6',
        SP: true,
      },
    ]
  }

  const parsePromoDate = (dateStr: string): Date => {
    // Formato: DD/MM/YYYY
    const [day, month, year] = dateStr.split('/').map(Number)
    return new Date(year, month - 1, day)
  }

  const parseCurrencyValue = (value: string): number => {
    if (!value) return 0
    // VALOR é o valor total salvo
    const numericValue = parseFloat(value)
    return isNaN(numericValue) ? 0 : numericValue
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const calculateOldPrice = (currentPrice: number, discount: number): number => {
    return currentPrice / (1 - discount / 100)
  }

  const calculatePixPrice = (price: number): number => {
    return price * 0.97 // 3% desconto no Pix
  }

  const calculateInstallment = (price: number): number => {
    return price / 12
  }

  const getRegimeAlimentacao = (promo: PromoData): string => {
    if (promo.ALL_INCLUSIVE) return 'All Inclusive'
    if (promo.PENSAO_COMPLETA) return 'Pensão Completa'
    if (promo.MEIA_PENSAO) return 'Meia Pensão'
    if (promo.COM_CAFE) return 'Com Café'
    if (promo.SEM_CAFE) return 'Sem Café'
    return 'Consulte'
  }

  const getAeroportoSaida = (promo: PromoData): string => {
    if (promo.CG && promo.SP) return 'CG e SP'
    if (promo.CG) return 'Campo Grande'
    if (promo.SP) return 'São Paulo'
    return ''
  }

  const handleOpenLeadModal = (promo: PromoData & { image: string }) => {
    setSelectedPromo(promo)
    setShowLeadModal(true)
  }

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPromo) return

    const regime = getRegimeAlimentacao(selectedPromo)
    const totalValue = parseCurrencyValue(selectedPromo.VALOR)
    const parcelas = selectedPromo.PARCELAS || 12
    const installmentValue = totalValue / parcelas
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(installmentValue)

    // Save lead to database
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: leadForm.name,
          phone: leadForm.phone,
          email: leadForm.email || null,
          source: 'promo_popup',
          destino: selectedPromo.DESTINO,
          hotel: selectedPromo.HOTEL,
          promoDetails: JSON.stringify({
            dataFormatada: selectedPromo.DATA_FORMATADA,
            regime,
            valor: formattedValue,
            parcelas,
          }),
        }),
      })
    } catch (error) {
      console.error('Erro ao salvar lead:', error)
    }

    const message = `Olá! Meu nome é ${leadForm.name}.
Tenho interesse no pacote:
📍 Destino: ${selectedPromo.DESTINO}
🏨 Hotel: ${selectedPromo.HOTEL}
📅 Saída: ${selectedPromo.DATA_FORMATADA}
🍽️ Regime: ${regime}
💰 Valor: ${formattedValue} (${parcelas}x sem juros)

Gostaria de mais informações!`

    const whatsappUrl = `https://wa.me/5567992167694?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    setShowLeadModal(false)
    setLeadForm({ name: '', phone: '', email: '' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // Filtrar promos baseado na busca
  const filteredPromos = searchQuery
    ? promosWithImages.filter((promo) => {
        const query = searchQuery.toLowerCase()
        return (
          promo.DESTINO.toLowerCase().includes(query) ||
          promo.HOTEL.toLowerCase().includes(query)
        )
      })
    : promosWithImages

  if (filteredPromos.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-xl text-gray-600 mb-6">
          {searchQuery
            ? `Não encontramos promoções para "${searchQuery}" no momento.`
            : 'Nenhuma promoção disponível no momento. Volte em breve!'}
        </p>
        {searchQuery && onNoResults && (
          <div className="space-y-4">
            <p className="text-gray-500">
              Mas podemos montar um pacote personalizado para você!
            </p>
            <Button
              onClick={() => onNoResults(searchQuery)}
              className="bg-[#25D366] text-white hover:bg-[#20BA5A] font-semibold min-h-[44px] px-8"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Solicitar orçamento para {searchQuery}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {filteredPromos.map((promo, index) => {
        const regime = getRegimeAlimentacao(promo)
        const aeroporto = getAeroportoSaida(promo)

        return (
          <article
            key={`${promo.DESTINO}-${index}`}
            className="group overflow-hidden rounded-2xl glass card-glow transition-all hover:scale-105"
          >
            {/* Imagem do Destino */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={promo.image}
                alt={`${promo.DESTINO} - ${promo.HOTEL}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                width="400"
                height="300"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
                aria-hidden="true"
              />

              {/* Badge de oferta */}
              <Badge className="absolute right-3 top-3 bg-primary text-white font-semibold">
                Oferta
              </Badge>

              {/* Rating fixo (pode ser dinâmico) */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5">
                <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-gray-900">4.8</span>
              </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-6">
              {/* Destino e Hotel */}
              <div className="mb-4">
                <div className="mb-2 flex items-start gap-2">
                  <MapPin className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                  <h3 className="text-2xl font-bold leading-tight text-gray-900">{promo.DESTINO}</h3>
                </div>
                <p className="text-sm text-gray-600">{promo.HOTEL}</p>
              </div>

              {/* Detalhes */}
              <div className="mb-4 space-y-2 text-sm">
                {/* Data */}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>Saída: {promo.DATA_FORMATADA}</span>
                </div>

                {/* Regime */}
                {regime !== 'Consulte' && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                      {regime}
                    </Badge>
                    {promo.NUMERO_DE_NOITES && (
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                        {promo.NUMERO_DE_NOITES} noites
                      </Badge>
                    )}
                    {aeroporto && (
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                        Saída: {aeroporto}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <DollarSign className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div>
                    {(() => {
                      const totalValue = parseCurrencyValue(promo.VALOR)
                      const parcelas = promo.PARCELAS || 12
                      const installmentValue = totalValue / parcelas
                      return (
                        <>
                          <p className="text-3xl font-bold gradient-text">{formatCurrency(installmentValue)}</p>
                          <p className="text-xs text-gray-500">{parcelas}x sem juros</p>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button
                onClick={() => handleOpenLeadModal(promo)}
                className="w-full bg-primary text-white hover:bg-primary/90 font-semibold min-h-[44px]"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Quero saber mais
              </Button>
            </div>
          </article>
        )
      })}

      {/* Lead Capture Modal */}
      {showLeadModal && selectedPromo && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowLeadModal(false)}
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
                  <h3 className="text-xl font-bold text-gray-900">Quero saber mais</h3>
                  <p className="text-sm text-gray-500">Resposta em minutos</p>
                </div>
              </div>
              <button
                onClick={() => setShowLeadModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Fechar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Promo Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-3">
                <img
                  src={selectedPromo.image}
                  alt={selectedPromo.DESTINO}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-bold text-gray-900">{selectedPromo.DESTINO}</h4>
                  <p className="text-sm text-gray-600">{selectedPromo.HOTEL}</p>
                  <p className="text-xs text-gray-500">Saída: {selectedPromo.DATA_FORMATADA}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div>
                <label htmlFor="lead-name" className="mb-2 block text-sm font-medium text-gray-700">
                  Seu nome *
                </label>
                <Input
                  id="lead-name"
                  type="text"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="Como podemos te chamar?"
                  className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="lead-phone" className="mb-2 block text-sm font-medium text-gray-700">
                  Seu telefone *
                </label>
                <Input
                  id="lead-phone"
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="lead-email" className="mb-2 block text-sm font-medium text-gray-700">
                  Seu e-mail *
                </label>
                <Input
                  id="lead-email"
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="h-12 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#20BA5A]"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Enviar no WhatsApp
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
