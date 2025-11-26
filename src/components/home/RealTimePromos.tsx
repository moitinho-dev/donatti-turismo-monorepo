'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, MapPin, Calendar, DollarSign, Loader2 } from 'lucide-react'

interface PromoData {
  DATA_FORMATADA: string
  DESTINO: string
  HOTEL: string
  VALOR: string
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
}

export default function RealTimePromos({ searchQuery = '' }: RealTimePromosProps) {
  const [promos, setPromos] = useState<PromoData[]>([])
  const [promosWithImages, setPromosWithImages] = useState<Array<PromoData & { image: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPromos()
  }, [])

  const loadPromos = async () => {
    try {
      setIsLoading(true)

      // 1. Buscar promos do dia
      let allPromos: PromoData[] = []

      try {
        const promosRes = await fetch('/api/promosenviadas')
        if (promosRes.ok) {
          allPromos = await promosRes.json()
        }
      } catch (apiError) {
        console.warn('API de promos não disponível, usando dados de exemplo')
      }

      // Se não houver promos da API, usar dados de exemplo
      if (allPromos.length === 0) {
        allPromos = getFallbackPromos()
      }

      // 2. Filtrar promos do dia atual ou anterior (máx 2 dias)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const recentPromos = allPromos.filter((promo) => {
        try {
          const promoDate = parsePromoDate(promo.DATA_FORMATADA)
          return promoDate >= yesterday && promoDate <= today
        } catch {
          return true // Se der erro no parse, incluir a promo
        }
      })

      // 3. Pegar as 6 primeiras ou todas se tiver menos
      const selectedPromos = recentPromos.slice(0, 6)

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

  const calculateDiscount = (): number => {
    // Desconto fixo para Black Friday
    return 40 // Pode ser calculado dinamicamente
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
        <p className="text-xl text-gray-400">
          {searchQuery
            ? `Nenhuma promoção encontrada para "${searchQuery}". Tente outro destino!`
            : 'Nenhuma promoção disponível no momento. Volte em breve!'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {filteredPromos.map((promo, index) => {
        const discount = calculateDiscount()
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
                className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent"
                aria-hidden="true"
              />

              {/* Badge de desconto */}
              <Badge className="absolute right-3 top-3 bg-primary text-black font-semibold">
                {discount}% OFF
              </Badge>

              {/* Rating fixo (pode ser dinâmico) */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg glass px-3 py-1.5">
                <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-white">4.8</span>
              </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-6">
              {/* Destino e Hotel */}
              <div className="mb-4">
                <div className="mb-2 flex items-start gap-2">
                  <MapPin className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                  <h3 className="text-2xl font-bold leading-tight text-white">{promo.DESTINO}</h3>
                </div>
                <p className="text-sm text-gray-400">{promo.HOTEL}</p>
              </div>

              {/* Detalhes */}
              <div className="mb-4 space-y-2 text-sm">
                {/* Data */}
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>Saída: {promo.DATA_FORMATADA}</span>
                </div>

                {/* Regime */}
                {regime !== 'Consulte' && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs bg-white/10 text-gray-300 border-white/20">
                      {regime}
                    </Badge>
                    {promo.NUMERO_DE_NOITES && (
                      <Badge variant="secondary" className="text-xs bg-white/10 text-gray-300 border-white/20">
                        {promo.NUMERO_DE_NOITES} noites
                      </Badge>
                    )}
                    {aeroporto && (
                      <Badge variant="secondary" className="text-xs bg-white/10 text-gray-300 border-white/20">
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
                    <p className="text-3xl font-bold gradient-text">{formatCurrency(parseCurrencyValue(promo.VALOR))}</p>
                    <p className="text-xs text-gray-400">ou 12x sem juros</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button className="w-full bg-primary text-black hover:bg-primary/90 font-semibold min-h-[44px]">
                Ver detalhes
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
