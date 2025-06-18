"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"
import { toPng } from "html-to-image"
import { 
  Loader2, 
  Download, 
  ImageIcon, 
  RefreshCw, 
  Edit3, 
  Save, 
  Upload,
  Palette,
  Type,
  Move,
  Settings,
  Trash2
} from "lucide-react"
import { ImageGallery } from "./ImageGallery"

interface PromoImageGeneratorProps {
  promo: any
}

interface LayoutConfig {
  id: string
  name: string
  type: 'png' | 'svg' | 'custom'
  url?: string
  elements: {
    [key: string]: {
      x: number
      y: number
      fontSize: number
      fontWeight: string
      color: string
      fontFamily: string
    }
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
}

const defaultLayouts: LayoutConfig[] = [
  {
    id: 'default-png',
    name: 'Layout Padrão (PNG)',
    type: 'png',
    url: '/assets/LAYOUTFINAL.png',
    colors: {
      primary: '#DC2626',
      secondary: '#FFFFFF',
      accent: '#FED400',
      background: '#1D3153'
    },
    elements: {
      region: { x: 70, y: 270, fontSize: 48, fontWeight: '900', color: '#DC2626', fontFamily: 'Inter' },
      destination: { x: 480, y: 360, fontSize: 60, fontWeight: '900', color: '#FFFFFF', fontFamily: 'Inter' },
      hotel: { x: 480, y: 450, fontSize: 40, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
      dates: { x: 480, y: 530, fontSize: 40, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
      installments: { x: 510, y: 620, fontSize: 30, fontWeight: '700', color: '#DC2626', fontFamily: 'Inter' },
      currency: { x: 510, y: 660, fontSize: 60, fontWeight: '900', color: '#DC2626', fontFamily: 'Inter' },
      price: { x: 600, y: 605, fontSize: 126, fontWeight: '900', color: '#DC2626', fontFamily: 'Inter' },
      installmentText: { x: 518, y: 760, fontSize: 28, fontWeight: '600', color: '#DC2626', fontFamily: 'Inter' },
      flight: { x: 545, y: 835, fontSize: 30, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
      perPerson: { x: 545, y: 885, fontSize: 30, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
      nights: { x: 545, y: 935, fontSize: 30, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
      regime: { x: 545, y: 980, fontSize: 30, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
      departureLabel: { x: 410, y: 1070, fontSize: 20, fontWeight: '700', color: '#DC2626', fontFamily: 'Inter' },
      departure: { x: 410, y: 1100, fontSize: 20, fontWeight: '900', color: '#DC2626', fontFamily: 'Inter' },
      disclaimer: { x: 490, y: 1160, fontSize: 20, fontWeight: '500', color: '#FFFFFF', fontFamily: 'Inter' },
      contactLabel: { x: 580, y: 1250, fontSize: 30, fontWeight: '700', color: '#DC2626', fontFamily: 'Inter' },
      contact: { x: 580, y: 1285, fontSize: 30, fontWeight: '700', color: '#DC2626', fontFamily: 'Inter' }
    }
  }
]

export function PromoImageGenerator({ promo }: PromoImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [destinationImage, setDestinationImage] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableImages, setAvailableImages] = useState<any[]>([])
  const [customSearchQuery, setCustomSearchQuery] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(defaultLayouts[0])
  const [savedLayouts, setSavedLayouts] = useState<LayoutConfig[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [customLayoutFile, setCustomLayoutFile] = useState<File | null>(null)
  const [customLayoutUrl, setCustomLayoutUrl] = useState<string | null>(null)
  
  const templateRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculate values
  const baseValue = Number.parseFloat(promo.VALOR)
  const parcelas = Number.parseInt(promo.PARCELAS || "10", 10)

  // Load saved layouts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('promo-layouts')
    if (saved) {
      try {
        setSavedLayouts(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading saved layouts:', e)
      }
    }
  }, [])

  // Initialize
  useEffect(() => {
    const loadFonts = async () => {
      const link = document.createElement('link')
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    loadFonts()
    setSelectedRegion(getRegion(promo.DESTINO))
  }, [promo.DESTINO])

  // Fetch destination images when component mounts or destination changes
  useEffect(() => {
    if (promo.DESTINO) {
      fetchDestinationImages()
    }
  }, [promo.DESTINO])

  // Handle custom layout file upload
  const handleLayoutUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setCustomLayoutFile(file)
      const url = URL.createObjectURL(file)
      setCustomLayoutUrl(url)
      
      // Create new layout config
      const newLayout: LayoutConfig = {
        id: `custom-${Date.now()}`,
        name: `Layout Personalizado - ${file.name}`,
        type: 'custom',
        url: url,
        colors: currentLayout.colors,
        elements: { ...currentLayout.elements }
      }
      
      setCurrentLayout(newLayout)
    }
  }

  // Function to fetch destination images from API
  const fetchDestinationImages = async (customQuery?: string) => {
    const searchQuery = customQuery || promo.DESTINO
    if (!searchQuery) return

    setIsLoadingImage(true)
    setError(null)
    setCustomSearchQuery(customQuery || null)

    try {
      const response = await fetch(`/api/image-search?query=${encodeURIComponent(searchQuery)}&limit=30`)

      if (!response.ok) {
        throw new Error("Failed to fetch destination images")
      }

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        setAvailableImages(data.results)
        if (!destinationImage) {
          setDestinationImage(data.results[0].urls.regular)
        }
      } else {
        setError("Não foi possível encontrar imagens para este destino")
        setAvailableImages([])
      }
    } catch (err) {
      console.error("Error fetching destination images:", err)
      setError("Erro ao buscar imagens do destino")
      setAvailableImages([])
    } finally {
      setIsLoadingImage(false)
    }
  }

  // Get region based on destination
  const getRegion = (destination: string) => {
    const dest = destination.toLowerCase().trim()

    const northeastCities = [
      "natal", "recife", "fortaleza", "salvador", "maceió", "maceio", "joão pessoa", "joao pessoa", 
      "aracaju", "são luís", "sao luis", "teresina", "porto de galinhas", "porto seguro", "pipa", 
      "maragogi", "jericoacoara", "fernando de noronha", "canoa quebrada", "praia do forte", 
      "costa do sauípe", "costa do sauipe", "ilhéus", "ilheus", "lençóis maranhenses", 
      "lencois maranhenses", "chapada diamantina", "bahia", "ceará", "ceara", "maranhão", 
      "maranhao", "pernambuco", "alagoas", "sergipe", "paraíba", "paraiba", "piauí", "piaui", 
      "rio grande do norte"
    ]

    const southCities = [
      "florianópolis", "florianopolis", "porto alegre", "gramado", "curitiba", "foz do iguaçu", 
      "foz do iguacu", "balneário camboriú", "balneario camboriu", "blumenau", "bombinhas", 
      "canela", "bento gonçalves", "bento goncalves", "santa catarina", "paraná", "parana", 
      "rio grande do sul", "camboriú", "camboriu", "joinville", "londrina", "maringá", "maringa"
    ]

    const southeastCities = [
      "rio de janeiro", "são paulo", "sao paulo", "belo horizonte", "vitória", "vitoria", 
      "búzios", "buzios", "paraty", "campos do jordão", "campos do jordao", "angra dos reis", 
      "cabo frio", "petrópolis", "petropolis", "ouro preto", "tiradentes", "guarujá", "guaruja", 
      "ubatuba", "ilhabela", "minas gerais", "espírito santo", "espirito santo", "arraial do cabo", 
      "são sebastião", "sao sebastiao", "aparecida", "poços de caldas", "pocos de caldas"
    ]

    const centralCities = [
      "brasília", "brasilia", "goiânia", "goiania", "cuiabá", "cuiaba", "campo grande", "bonito", 
      "caldas novas", "pirenópolis", "pirenopolis", "chapada dos veadeiros", "pantanal", "goiás", 
      "goias", "mato grosso", "mato grosso do sul", "distrito federal", "chapada dos guimarães", 
      "chapada dos guimaraes", "corumbá", "corumba"
    ]

    const northCities = [
      "manaus", "belém", "belem", "palmas", "rio branco", "porto velho", "boa vista", "macapá", 
      "macapa", "alter do chão", "alter do chao", "são gabriel da cachoeira", 
      "sao gabriel da cachoeira", "monte roraima", "amazonas", "pará", "para", "tocantins", 
      "acre", "rondônia", "rondonia", "roraima", "amapá", "amapa", "santarém", "santarem"
    ]

    const internationalKeywords = [
      "cancun", "miami", "orlando", "nova york", "las vegas", "paris", "londres", "roma", 
      "madri", "lisboa", "tóquio", "toquio", "dubai", "buenos aires", "santiago", "toronto", 
      "vancouver", "amsterdam", "berlim", "viena", "atenas", "bangkok", "pequim", "sydney", 
      "auckland", "cidade do cabo", "cairo", "istambul", "jerusalém", "jerusalem", "havana", 
      "punta cana", "méxico", "mexico", "eua", "usa", "estados unidos", "europa", "ásia", 
      "asia", "áfrica", "africa", "oceania", "caribe"
    ]

    const brazilKeywords = ["brasil", "brazil"]
    const isBrazilExplicit = brazilKeywords.some((keyword) => dest.includes(keyword))

    if (isBrazilExplicit) {
      if (northeastCities.some((city) => dest.includes(city))) return "Nordeste"
      if (southCities.some((city) => dest.includes(city))) return "Sul"
      if (southeastCities.some((city) => dest.includes(city))) return "Sudeste"
      if (centralCities.some((city) => dest.includes(city))) return "Centro-Oeste"
      if (northCities.some((city) => dest.includes(city))) return "Norte"
      return "Brasil"
    }

    if (internationalKeywords.some((keyword) => dest.includes(keyword))) {
      return "Exterior"
    }

    if (northeastCities.some((city) => dest.includes(city))) return "Nordeste"
    if (southCities.some((city) => dest.includes(city))) return "Sul"
    if (southeastCities.some((city) => dest.includes(city))) return "Sudeste"
    if (centralCities.some((city) => dest.includes(city))) return "Centro-Oeste"
    if (northCities.some((city) => dest.includes(city))) return "Norte"

    const brazilRegions = ["nordeste", "norte", "sul", "sudeste", "centro-oeste", "centro oeste"]
    if (brazilRegions.some((region) => dest.includes(region))) {
      return dest.includes("nordeste")
        ? "Nordeste"
        : dest.includes("norte")
          ? "Norte"
          : dest.includes("sul")
            ? "Sul"
            : dest.includes("sudeste")
              ? "Sudeste"
              : "Centro-Oeste"
    }

    return "Exterior"
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

  // Handle element click for selection
  const handleElementClick = (elementId: string, event: React.MouseEvent) => {
    if (!isEditMode) return
    
    event.stopPropagation()
    setSelectedElement(elementId)
  }

  // Handle element drag
  const handleMouseDown = (elementId: string, event: React.MouseEvent) => {
    if (!isEditMode) return
    
    event.preventDefault()
    setSelectedElement(elementId)
    setIsDragging(true)
    
    const rect = event.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    })
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !templateRef.current) return
    
    const templateRect = templateRef.current.getBoundingClientRect()
    const scale = 0.5 // Template is scaled down
    
    const newX = (event.clientX - templateRect.left - dragOffset.x) / scale
    const newY = (event.clientY - templateRect.top - dragOffset.y) / scale
    
    setCurrentLayout(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [selectedElement]: {
          ...prev.elements[selectedElement],
          x: Math.max(0, Math.min(1080, newX)),
          y: Math.max(0, Math.min(1920, newY))
        }
      }
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Update element property
  const updateElementProperty = (elementId: string, property: string, value: any) => {
    setCurrentLayout(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementId]: {
          ...prev.elements[elementId],
          [property]: value
        }
      }
    }))
  }

  // Update layout colors
  const updateLayoutColor = (colorKey: string, value: string) => {
    setCurrentLayout(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }))
  }

  // Save current layout
  const saveCurrentLayout = () => {
    const layoutName = prompt('Nome do layout:')
    if (!layoutName) return
    
    const newLayout: LayoutConfig = {
      ...currentLayout,
      id: `saved-${Date.now()}`,
      name: layoutName
    }
    
    const updatedLayouts = [...savedLayouts, newLayout]
    setSavedLayouts(updatedLayouts)
    localStorage.setItem('promo-layouts', JSON.stringify(updatedLayouts))
    
    alert('Layout salvo com sucesso!')
  }

  // Delete saved layout
  const deleteLayout = (layoutId: string) => {
    if (confirm('Tem certeza que deseja deletar este layout?')) {
      const updatedLayouts = savedLayouts.filter(layout => layout.id !== layoutId)
      setSavedLayouts(updatedLayouts)
      localStorage.setItem('promo-layouts', JSON.stringify(updatedLayouts))
      
      // If the deleted layout is currently selected, switch to default
      if (currentLayout.id === layoutId) {
        setCurrentLayout(defaultLayouts[0])
      }
      
      alert('Layout deletado com sucesso!')
    }
  }

  // Load saved layout
  const loadLayout = (layout: LayoutConfig) => {
    setCurrentLayout(layout)
  }

  const generateImage = async () => {
    if (!templateRef.current) return

    setIsGenerating(true)

    try {
      const template = templateRef.current
      const originalTransform = template.style.transform
      template.style.transform = ""

      await new Promise(resolve => setTimeout(resolve, 500))

      const dataUrl = await toPng(template, {
        quality: 1.0,
        width: 1080,
        height: 1920,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        style: {
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }
      })

      template.style.transform = originalTransform

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

  // Handle image selection from gallery
  const handleSelectImage = (imageUrl: string) => {
    setDestinationImage(imageUrl)
  }

  // Handle custom search
  const handleCustomSearch = (query: string) => {
    fetchDestinationImages(query)
  }

  // Handle region selection
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegion(e.target.value)
  }

  // Get element content
  const getElementContent = (elementId: string) => {
    switch (elementId) {
      case 'region': return selectedRegion
      case 'destination': return promo.DESTINO
      case 'hotel': return promo.HOTEL
      case 'dates': return formatDateRange()
      case 'installments': return `${parcelas}x de`
      case 'currency': return 'R$'
      case 'price': return baseValue.toFixed(2).replace(".", ",")
      case 'installmentText': return 'no cartão e 10x no boleto sem juros.'
      case 'flight': return 'Aéreo Ida e Volta'
      case 'perPerson': return 'Valor por pessoa'
      case 'nights': return `${promo.NUMERO_DE_NOITES} Noites`
      case 'regime': return getRegimeAlimentacao()
      case 'departureLabel': return 'saindo de'
      case 'departure': return getDepartureAirport()
      case 'disclaimer': return 'Preço por pessoa em apartamento duplo, sujeito a alteração sem aviso prévio, taxas inclusas.'
      case 'contactLabel': return 'Contato e Whatsapp'
      case 'contact': return '(67) 9 9637-2769'
      default: return ''
    }
  }

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Controls */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Layout Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-primary-blue" />
              Layout
            </h3>
            
            <div className="space-y-2">
              <select
                value={currentLayout.id}
                onChange={(e) => {
                  const layout = [...defaultLayouts, ...savedLayouts].find(l => l.id === e.target.value)
                  if (layout) loadLayout(layout)
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={defaultLayouts[0].id}>Layout Padrão</option>
                {savedLayouts.map(layout => (
                  <option key={layout.id} value={layout.id}>{layout.name}</option>
                ))}
              </select>
              
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  <Upload className="h-4 w-4" />
                  Upload Layout
                </button>
                
                <button
                  onClick={saveCurrentLayout}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors text-sm"
                >
                  <Save className="h-4 w-4" />
                  Salvar
                </button>
              </div>
              
              {/* Saved Layouts Management */}
              {savedLayouts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Layouts Salvos:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {savedLayouts.map(layout => (
                      <div key={layout.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="truncate flex-1">{layout.name}</span>
                        <button
                          onClick={() => deleteLayout(layout.id)}
                          className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Deletar layout"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLayoutUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Edit Mode Toggle */}
          <div className="space-y-3">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                isEditMode 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              {isEditMode ? 'Sair da Edição' : 'Editar Layout'}
            </button>
          </div>

          {/* Layout Colors */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <Palette className="h-5 w-5 mr-2 text-primary-blue" />
              Cores do Layout
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(currentLayout.colors).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 capitalize">
                    {key === 'primary' ? 'Primária' : 
                     key === 'secondary' ? 'Secundária' : 
                     key === 'accent' ? 'Destaque' : 'Fundo'}
                  </label>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => updateLayoutColor(key, e.target.value)}
                    className="w-full h-8 rounded border border-gray-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Region Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700">Região</h3>
            <select
              value={selectedRegion}
              onChange={handleRegionChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="Nordeste">Nordeste</option>
              <option value="Sul">Sul</option>
              <option value="Sudeste">Sudeste</option>
              <option value="Norte">Norte</option>
              <option value="Centro-Oeste">Centro-Oeste</option>
              <option value="Exterior">Exterior</option>
              <option value="Brasil">Brasil</option>
            </select>
          </div>

          {/* Element Properties */}
          {isEditMode && selectedElement && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <Type className="h-5 w-5 mr-2 text-primary-blue" />
                Propriedades do Elemento
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Tamanho da Fonte</label>
                  <input
                    type="number"
                    value={currentLayout.elements[selectedElement]?.fontSize || 16}
                    onChange={(e) => updateElementProperty(selectedElement, 'fontSize', parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    min="8"
                    max="200"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600">Peso da Fonte</label>
                  <select
                    value={currentLayout.elements[selectedElement]?.fontWeight || 'normal'}
                    onChange={(e) => updateElementProperty(selectedElement, 'fontWeight', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="400">Normal</option>
                    <option value="500">Medium</option>
                    <option value="600">Semibold</option>
                    <option value="700">Bold</option>
                    <option value="800">Extrabold</option>
                    <option value="900">Black</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600">Cor</label>
                  <input
                    type="color"
                    value={currentLayout.elements[selectedElement]?.color || '#000000'}
                    onChange={(e) => updateElementProperty(selectedElement, 'color', e.target.value)}
                    className="w-full h-8 rounded border border-gray-300"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Posição X</label>
                    <input
                      type="number"
                      value={currentLayout.elements[selectedElement]?.x || 0}
                      onChange={(e) => updateElementProperty(selectedElement, 'x', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Posição Y</label>
                    <input
                      type="number"
                      value={currentLayout.elements[selectedElement]?.y || 0}
                      onChange={(e) => updateElementProperty(selectedElement, 'y', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateImage}
            disabled={isGenerating || !destinationImage}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors disabled:opacity-50 font-medium"
          >
            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            Baixar Imagem
          </button>
        </div>
      </div>

      {/* Center - Template Preview */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm w-full max-w-md">
            {error}
          </div>
        )}

        <div className="relative w-[540px] h-[960px] overflow-hidden border border-gray-300 rounded-lg shadow-lg bg-white">
          <div
            ref={templateRef}
            className="w-[540px] h-[960px] relative cursor-pointer"
            style={{ 
              transform: "scale(0.5)", 
              transformOrigin: "top left",
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={() => setSelectedElement(null)}
          >
            {/* Destination image as background */}
            {destinationImage && (
              <div className="absolute top-0 left-0 w-[1080px] h-[1920px] overflow-hidden z-0">
                <img
                  src={destinationImage || "/placeholder.svg"}
                  alt={promo.DESTINO}
                  className="w-full h-full object-cover opacity-80"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            
            {/* Template overlay */}
            <div className="absolute inset-0 w-[1080px] h-[1920px] z-10">
              {/* Background template image */}
              <img 
                src={customLayoutUrl || currentLayout.url || "/assets/LAYOUTFINAL.png"} 
                alt="Promo Template" 
                className="w-full h-full object-cover" 
              />

              {/* Text Overlays */}
              <div className="absolute inset-0">
                {Object.entries(currentLayout.elements).map(([elementId, element]) => (
                  <div
                    key={elementId}
                    className={`absolute cursor-pointer ${
                      isEditMode ? 'hover:ring-2 hover:ring-blue-400' : ''
                    } ${
                      selectedElement === elementId ? 'ring-2 ring-blue-500 bg-blue-100 bg-opacity-20' : ''
                    }`}
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      fontSize: `${element.fontSize}px`,
                      fontWeight: element.fontWeight,
                      color: element.color,
                      fontFamily: element.fontFamily,
                      userSelect: isEditMode ? 'none' : 'auto'
                    }}
                    onClick={(e) => handleElementClick(elementId, e)}
                    onMouseDown={(e) => handleMouseDown(elementId, e)}
                  >
                    {getElementContent(elementId)}
                    {isEditMode && selectedElement === elementId && (
                      <div className="absolute -top-6 -left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        <Move className="h-3 w-3 inline mr-1" />
                        {elementId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Image Gallery */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <ImageIcon className="h-5 w-5 mr-2 text-primary-blue" />
              Galeria de Imagens
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {customSearchQuery
                ? `Resultados para "${customSearchQuery}"`
                : `Imagens para ${promo.DESTINO}`}
            </p>
          </div>

          <ImageGallery
            images={availableImages}
            onSelectImage={handleSelectImage}
            selectedImageUrl={destinationImage}
            isLoading={isLoadingImage}
            onSearch={handleCustomSearch}
            destination={promo.DESTINO}
          />
        </div>
      </div>
    </div>
  )
}