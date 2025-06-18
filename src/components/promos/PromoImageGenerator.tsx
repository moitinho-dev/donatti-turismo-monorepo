"use client"
import { useState, useRef, useEffect } from "react"
import { toPng } from "html-to-image"
import { Loader2, Download, ImageIcon, RefreshCw } from "lucide-react"

interface PromoImageGeneratorProps {
  promo: any
}

export function PromoImageGenerator({ promo }: PromoImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [destinationImage, setDestinationImage] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const templateRef = useRef<HTMLDivElement>(null)

  // Calculate values
  const baseValue = Number.parseFloat(promo.VALOR)
  const parcelas = Number.parseInt(promo.PARCELAS || "15", 10)
  const totalValue = Math.round(baseValue * parcelas * 2)

  // Get region based on destination
  const getRegion = (destination: string) => {
    const northeastCities = [
      "natal",
      "recife",
      "fortaleza",
      "salvador",
      "maceió",
      "joão pessoa",
      "aracaju",
      "são luís",
      "teresina",
      "porto de galinhas",
      "porto seguro",
      "pipa",
    ]

    const southCities = ["florianópolis", "porto alegre", "gramado", "curitiba", "foz do iguaçu", "balneário camboriú"]

    const southeastCities = [
      "rio de janeiro",
      "são paulo",
      "belo horizonte",
      "vitória",
      "búzios",
      "paraty",
      "campos do jordão",
    ]

    const centralCities = ["brasília", "goiânia", "cuiabá", "campo grande", "bonito", "caldas novas"]

    const northCities = ["manaus", "belém", "palmas", "rio branco", "porto velho", "boa vista", "macapá"]

    const internationalCities = ["santiago", "buenos aires", "montevideo", "lima", "bogotá", "caracas"]

    const dest = destination.toLowerCase()

    if (northeastCities.some((city) => dest.includes(city))) return "Nordeste"
    if (southCities.some((city) => dest.includes(city))) return "Sul"
    if (southeastCities.some((city) => dest.includes(city))) return "Sudeste"
    if (centralCities.some((city) => dest.includes(city))) return "Centro-Oeste"
    if (northCities.some((city) => dest.includes(city))) return "Norte"
    if (internationalCities.some((city) => dest.includes(city))) return "Exterior"

    return "Brasil" // Default
  }

  // Get regime de alimentação
  const getRegimeAlimentacao = () => {
    if (promo.ALL_INCLUSIVE) return "All inclusive"
    if (promo.PENSAO_COMPLETA) return "Pensão completa"
    if (promo.MEIA_PENSAO) return "Meia pensão"
    if (promo.COM_CAFE) return "Com café da manhã"
    if (promo.SEM_CAFE) return "Sem café da manhã"
    return "Sem café da manhã"
  }

  // Get departure airport
  const getDepartureAirport = () => {
    if (promo.CG && !promo.SP) return "Campo Grande (CGR)"
    if (promo.SP && !promo.CG) return "São Paulo (GRU)"
    if (promo.CG && promo.SP) return "Campo Grande (CGR) ou São Paulo (GRU)"
    return "Campo Grande (CGR)"
  }

  // Format date range
  const formatDateRange = () => {
    try {
      // Extract dates from DATA_FORMATADA
      const datePattern = /(\d{1,2})\/(\d{1,2}) até (\d{1,2})\/(\d{1,2}) de (\d{4})/
      const match = promo.DATA_FORMATADA.match(datePattern)

      if (match) {
        const [_, startDay, startMonth, endDay, endMonth, year] = match
        return `${startDay}/${startMonth} até ${endDay}/${endMonth} de ${year}`
      }

      return promo.DATA_FORMATADA
    } catch (error) {
      console.error("Error formatting date range:", error)
      return promo.DATA_FORMATADA
    }
  }

  // Fetch destination image
  const fetchDestinationImage = async () => {
    setIsLoadingImage(true)
    setError(null)

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          promo.DESTINO + " tourism",
        )}&orientation=portrait&per_page=1&client_id=RZEIOVfPhS7m9qvjUJJh3hRUz0H3rPqaYuUPf_Wh2mA`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch image")
      }

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        setDestinationImage(data.results[0].urls.regular)
      } else {
        // Fallback to a default image if no results
        setDestinationImage(`https://source.unsplash.com/random/1080x1920/?${encodeURIComponent(promo.DESTINO)}`)
      }
    } catch (error) {
      console.error("Error fetching destination image:", error)
      setError("Erro ao buscar imagem do destino. Tente novamente.")
      // Fallback to a default image
      setDestinationImage(`https://source.unsplash.com/random/1080x1920/?${encodeURIComponent(promo.DESTINO)}`)
    } finally {
      setIsLoadingImage(false)
    }
  }

  // Load Google Fonts
  const loadGoogleFonts = () => {
    return new Promise((resolve) => {
      const link = document.createElement('link')
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
      link.rel = 'stylesheet'
      link.onload = () => resolve(true)
      document.head.appendChild(link)
    })
  }

  // Generate and download image
  const generateImage = async () => {
    if (!templateRef.current) return

    setIsGenerating(true)

    try {
      // Load fonts first
      await loadGoogleFonts()
      
      // Wait a bit for fonts to load
      await new Promise(resolve => setTimeout(resolve, 1000))

      const dataUrl = await toPng(templateRef.current, {
        quality: 1.0,
        width: 1080,
        height: 1920,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        },
        filter: (node) => {
          // Exclude certain elements that might cause issues
          if (node.classList && node.classList.contains('exclude-from-export')) {
            return false
          }
          return true
        },
        cacheBust: true,
      })

      // Create download link
      const link = document.createElement("a")
      link.download = `promo-${promo.DESTINO.toLowerCase().replace(/\s+/g, "-")}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error generating image:", error)
      setError("Erro ao gerar imagem. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Fetch image on component mount
  useEffect(() => {
    fetchDestinationImage()
  }, [promo.DESTINO])

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex gap-4">
        <button
          onClick={fetchDestinationImage}
          disabled={isLoadingImage}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          {isLoadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Trocar imagem
        </button>

        <button
          onClick={generateImage}
          disabled={isGenerating || isLoadingImage || !destinationImage}
          className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Baixar imagem
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm w-full">{error}</div>}

      <div className="relative w-[540px] h-[960px] overflow-hidden border border-gray-300 rounded-lg shadow-lg">
        {isLoadingImage ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-blue mb-2" />
              <p className="text-gray-600 font-mono">Carregando imagem...</p>
            </div>
          </div>
        ) : !destinationImage ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center">
              <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600 font-mono">Imagem não disponível</p>
            </div>
          </div>
        ) : null}

        {/* Template for the promotional image */}
        <div
          ref={templateRef}
          className="w-[540px] h-[960px] relative"
          style={{ 
            transform: "scale(0.5)", 
            transformOrigin: "top left",
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          <div className="absolute inset-0 w-[1080px] h-[1920px] bg-white overflow-hidden" style={{ fontFamily: 'inherit' }}>
            {/* Background image with overlay */}
            {destinationImage && (
              <div className="absolute inset-0">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${destinationImage})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70"></div>
              </div>
            )}

            {/* Content container */}
            <div className="absolute inset-0 flex flex-col p-8" style={{ fontFamily: 'inherit' }}>
              {/* Region tag */}
              <div className="self-end bg-yellow-400 text-red-700 font-black text-[48px] py-4 px-8 rounded-bl-[30px]" style={{ fontFamily: 'inherit' }}>
                {getRegion(promo.DESTINO)}
              </div>

              {/* Main content */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="bg-red-700/95 rounded-[50px] p-8 mt-8 max-w-[900px]" style={{ fontFamily: 'inherit' }}>
                  {/* Destination */}
                  <h1 className="text-yellow-400 font-black text-[100px] leading-tight" style={{ fontFamily: 'inherit' }}>{promo.DESTINO}</h1>

                  {/* Hotel */}
                  <h2 className="text-white font-semibold text-[48px] mb-4" style={{ fontFamily: 'inherit' }}>{promo.HOTEL}</h2>

                  {/* Date */}
                  <p className="text-yellow-400 font-semibold text-[40px] mb-8" style={{ fontFamily: 'inherit' }}>{formatDateRange()}</p>

                  {/* Price */}
                  <div className="bg-yellow-400 text-red-700 rounded-[30px] p-6 inline-block mb-8">
                    <div className="flex items-center">
                      <div className="text-[40px] font-black mr-4" style={{ fontFamily: 'inherit' }}>{parcelas}x de</div>
                      <div>
                        <div className="text-[40px] font-black" style={{ fontFamily: 'inherit' }}>R$</div>
                        <div className="text-[120px] font-black leading-none" style={{ fontFamily: 'inherit' }}>{totalValue}</div>
                      </div>
                    </div>
                    <div className="text-[32px] font-semibold" style={{ fontFamily: 'inherit' }}>no cartão e {parcelas - 1}x no boleto sem juros</div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center text-white text-[36px] font-medium" style={{ fontFamily: 'inherit' }}>
                      <span className="text-yellow-400 mr-4 text-[40px]">✈</span>
                      Aéreo ida e volta
                    </div>
                    <div className="flex items-center text-white text-[36px] font-medium" style={{ fontFamily: 'inherit' }}>
                      <span className="text-yellow-400 mr-4 text-[40px]">👤</span>
                      Valor por pessoa
                    </div>
                    <div className="flex items-center text-white text-[36px] font-medium" style={{ fontFamily: 'inherit' }}>
                      <span className="text-yellow-400 mr-4 text-[40px]">🌙</span>
                      {promo.NUMERO_DE_NOITES} Noites
                    </div>
                    <div className="flex items-center text-white text-[36px] font-medium" style={{ fontFamily: 'inherit' }}>
                      <span className="text-yellow-400 mr-4 text-[40px]">🍽</span>
                      {getRegimeAlimentacao()}
                    </div>
                  </div>

                  {/* Departure */}
                  <div className="bg-yellow-400 text-red-700 rounded-[20px] p-4 inline-block text-[32px] font-bold" style={{ fontFamily: 'inherit' }}>
                    saindo de
                    <br />
                    {getDepartureAirport()}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto">
                <div className="text-white text-[28px] mb-4 text-center font-medium" style={{ fontFamily: 'inherit' }}>
                  Preço por pessoa em apartamento duplo, sujeito a alteração sem aviso prévio. Taxas inclusas.
                </div>

                {/* Contact */}
                <div className="flex items-center bg-yellow-400 text-red-700 p-4 rounded-t-[20px] max-w-[500px]">
                  <div className="bg-yellow-400 p-2 rounded-full mr-4">
                    <span className="text-[60px]">📱</span>
                  </div>
                  <div>
                    <div className="text-[36px] font-bold" style={{ fontFamily: 'inherit' }}>Contato e Whatsapp</div>
                    <div className="text-[40px] font-black" style={{ fontFamily: 'inherit' }}>(67) 9637-2769</div>
                  </div>
                </div>

                {/* Logo area */}
                <div className="bg-gradient-to-r from-red-700 to-yellow-400 h-[200px] flex items-center p-8">
                  <div className="text-white text-[100px] font-black" style={{ fontFamily: 'inherit' }}>
                    Donatti
                    <span className="text-yellow-400">TURISMO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}