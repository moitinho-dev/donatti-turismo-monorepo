"use client"
import { useState } from "react"
import { usePromo } from "@/hooks/usePromo"
import {
  Calendar,
  MapPin,
  Hotel,
  DollarSign,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Image,
  Clock,
} from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PromoImageGeneratorModal } from "./PromoImageGeneratorModal"

interface PromoData {
  id: string
  DESTINO: string
  HOTEL: string
  DATA_FORMATADA: string
  VALOR: string
  COM_CAFE?: boolean
  SEM_CAFE?: boolean
  MEIA_PENSAO?: boolean
  PENSAO_COMPLETA?: boolean
  ALL_INCLUSIVE?: boolean
  NUMERO_DE_NOITES?: string
  SP?: boolean
  CG?: boolean
  AEREO?: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  createdByName?: string
  PARCELAS?: string | number
}

interface PromosListProps {
  promos: PromoData[]
  onEdit: (promo: PromoData) => void
  onDelete: () => void
}

// Função para formatar data de forma segura
const formatDateSafe = (dateString: string): string => {
  if (!dateString) return "Data não informada"
  
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) {
      // Tentar parse direto se parseISO falhar
      const fallbackDate = new Date(dateString)
      if (!isValid(fallbackDate)) {
        return "Data inválida"
      }
      return format(fallbackDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    }
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch (error) {
    console.error("Erro ao formatar data:", error, "Data original:", dateString)
    return "Data inválida"
  }
}

// Função para obter data relativa (hoje, ontem, etc.)
const getRelativeDate = (dateString: string): string => {
  if (!dateString) return "Data não informada"
  
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) {
      const fallbackDate = new Date(dateString)
      if (!isValid(fallbackDate)) {
        return "Data inválida"
      }
      return formatDateSafe(dateString)
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const promoDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (promoDate.getTime() === today.getTime()) {
      return `Hoje às ${format(date, "HH:mm", { locale: ptBR })}`
    } else if (promoDate.getTime() === yesterday.getTime()) {
      return `Ontem às ${format(date, "HH:mm", { locale: ptBR })}`
    } else {
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    }
  } catch (error) {
    console.error("Erro ao obter data relativa:", error)
    return formatDateSafe(dateString)
  }
}

// Função para agrupar promoções por data
const groupPromosByDate = (promos: PromoData[]) => {
  const groups: { [key: string]: { promos: PromoData[]; displayDate: string } } = {}

  promos.forEach((promo) => {
    if (!promo.createdAt) {
      const unknownKey = "unknown"
      if (!groups[unknownKey]) {
        groups[unknownKey] = { promos: [], displayDate: "Data não informada" }
      }
      groups[unknownKey].promos.push(promo)
      return
    }

    try {
      const date = parseISO(promo.createdAt)
      if (!isValid(date)) {
        const fallbackDate = new Date(promo.createdAt)
        if (!isValid(fallbackDate)) {
          const unknownKey = "unknown"
          if (!groups[unknownKey]) {
            groups[unknownKey] = { promos: [], displayDate: "Data não informada" }
          }
          groups[unknownKey].promos.push(promo)
          return
        }
      }

      const validDate = isValid(date) ? date : new Date(promo.createdAt)
      const dateKey = format(validDate, "yyyy-MM-dd")
      
      if (!groups[dateKey]) {
        const now = new Date()
        const today = format(now, "yyyy-MM-dd")
        const yesterday = format(new Date(now.getTime() - 24 * 60 * 60 * 1000), "yyyy-MM-dd")
        
        let displayDate: string
        if (dateKey === today) {
          displayDate = "Hoje"
        } else if (dateKey === yesterday) {
          displayDate = "Ontem"
        } else {
          displayDate = format(validDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        }
        
        groups[dateKey] = { promos: [], displayDate }
      }
      
      groups[dateKey].promos.push(promo)
    } catch (error) {
      console.error("Erro ao agrupar promoção por data:", error)
      const unknownKey = "unknown"
      if (!groups[unknownKey]) {
        groups[unknownKey] = { promos: [], displayDate: "Data não informada" }
      }
      groups[unknownKey].promos.push(promo)
    }
  })

  // Ordenar grupos por data (mais recente primeiro)
  return Object.entries(groups)
    .sort(([dateA], [dateB]) => {
      if (dateA === "unknown") return 1
      if (dateB === "unknown") return -1
      return dateB.localeCompare(dateA)
    })
    .map(([dateKey, { promos, displayDate }]) => ({
      dateKey,
      displayDate,
      promos: promos.sort((a, b) => {
        // Ordenar promoções dentro do grupo por hora de criação (mais recente primeiro)
        try {
          const dateA = parseISO(a.createdAt) || new Date(a.createdAt)
          const dateB = parseISO(b.createdAt) || new Date(b.createdAt)
          return dateB.getTime() - dateA.getTime()
        } catch (error) {
          return 0
        }
      })
    }))
}

export function PromosList({ promos, onEdit, onDelete }: PromosListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDestino, setSelectedDestino] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedPromoForImage, setSelectedPromoForImage] = useState<PromoData | null>(null)

  const { deletePromo, isLoading } = usePromo()

  const parseCurrencyValue = (value: string) => {
    if (!value) {
      return "0,00"
    }

    const cleanedValue = value.replace(/[^\d.,]/g, "")
    const numericValue = Number.parseFloat(cleanedValue.replace(",", "."))
    const parcelas = 15 // Valor padrão
    const valueAfterCalculation = numericValue * parcelas * 2

    return valueAfterCalculation.toFixed(2).replace(".", ",")
  }

  const getInstallmentValue = (value: string, parcelas: string | number = "15") => {
    if (!value) {
      return "0,00"
    }

    const cleanedValue = value.replace(/[^\d.,]/g, "")
    const numericValue = Number.parseFloat(cleanedValue.replace(",", "."))
    const parcelasNum = typeof parcelas === "number" ? parcelas : Number.parseInt(parcelas, 10)
    const installmentValue = (numericValue * 2 * parcelasNum) / parcelasNum

    return installmentValue.toFixed(2).replace(".", ",")
  }

  const getRegimeAlimentacao = (promo: PromoData): string => {
    if (promo.ALL_INCLUSIVE) return "All Inclusive"
    if (promo.PENSAO_COMPLETA) return "Pensão Completa"
    if (promo.MEIA_PENSAO) return "Meia Pensão"
    if (promo.COM_CAFE) return "Com Café"
    if (promo.SEM_CAFE) return "Sem Café"
    return "Não especificado"
  }

  const getAeroportoSaida = (promo: PromoData): string => {
    if (promo.CG && promo.SP) return "Campo Grande e São Paulo"
    if (promo.CG) return "Campo Grande"
    if (promo.SP) return "São Paulo"
    return "Não especificado"
  }

  // Get unique destinations for filter
  const destinos = [...new Set(promos.map((promo) => promo.DESTINO))].sort()

  // Filter promos
  const filteredPromos = promos.filter((promo) => {
    const matchesSearch =
      searchTerm === "" ||
      promo.DESTINO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.HOTEL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.DATA_FORMATADA.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDestino = selectedDestino === null || promo.DESTINO === selectedDestino

    return matchesSearch && matchesDestino
  })

  // Ordenar promoções por data de criação (mais recente primeiro)
  const sortedPromos = [...filteredPromos].sort((a, b) => {
    try {
      const dateA = parseISO(a.createdAt) || new Date(a.createdAt)
      const dateB = parseISO(b.createdAt) || new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    } catch (error) {
      return 0
    }
  })

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      await deletePromo(deleteConfirmId)
      setDeleteConfirmId(null)
      onDelete()
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const handleGenerateImage = (promo: PromoData) => {
    setSelectedPromoForImage(promo)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-grow">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar promoções..."
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-64">
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                value={selectedDestino || ""}
                onChange={(e) => setSelectedDestino(e.target.value || null)}
              >
                <option value="">Todos os destinos</option>
                {destinos.map((destino) => (
                  <option key={destino} value={destino}>
                    {destino}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {sortedPromos.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mon">
            {promos.length === 0
              ? "Nenhuma promoção cadastrada. Adicione sua primeira promoção!"
              : "Nenhuma promoção encontrada com os filtros atuais."}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groupPromosByDate(sortedPromos).map(({ dateKey, displayDate, promos }) => (
              <div key={dateKey} className="p-4">
                {/* Header da data */}
                <div className="flex items-center mb-4">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className={`px-4 text-sm font-medium ${
                    displayDate === "Hoje" 
                      ? "text-green-600 bg-green-50" 
                      : displayDate === "Ontem" 
                        ? "text-orange-600 bg-orange-50" 
                        : "text-gray-600 bg-gray-50"
                  } rounded-full`}>
                    {displayDate}
                  </span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* Lista de promoções do dia */}
                <div className="space-y-3">
                  {promos.map((promo) => (
                    <div
                      key={promo.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Informações principais */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary-blue" />
                            <span className="font-semibold text-primary-blue text-lg">{promo.DESTINO}</span>
                            <span className="text-gray-400">•</span>
                            <Hotel className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{promo.HOTEL}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Clock className="h-4 w-4" />
                            <span>{getRelativeDate(promo.createdAt)}</span>
                            {promo.createdByName && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span>por {promo.createdByName}</span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Calendar className="h-3 w-3 mr-1" />
                              {promo.DATA_FORMATADA}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {promo.NUMERO_DE_NOITES} noites
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {getRegimeAlimentacao(promo)}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {getAeroportoSaida(promo)}
                            </span>
                          </div>
                        </div>

                        {/* Valores */}
                        <div className="flex flex-col items-end">
                          <div className="text-right mb-2">
                            <div className="text-2xl font-bold text-primary-blue">
                              R$ {parseCurrencyValue(promo.VALOR)}
                            </div>
                            <div className="text-sm text-gray-500">
                              ou {promo.PARCELAS || "15"}x de R$ {getInstallmentValue(promo.VALOR, promo.PARCELAS)}
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center space-x-2">
                          {deleteConfirmId === promo.id ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={handleConfirmDelete}
                                disabled={isLoading}
                                className="text-white bg-red-600 hover:bg-red-700 p-2 rounded-md transition-colors"
                                title="Confirmar exclusão"
                              >
                                {isLoading ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelDelete}
                                className="text-gray-600 hover:text-gray-800 p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
                                title="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleGenerateImage(promo)}
                                className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 transition-colors"
                                title="Gerar imagem promocional"
                              >
                                <Image className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onEdit(promo)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
                                title="Editar promoção"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(promo.id)}
                                className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                                title="Excluir promoção"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Generator Modal */}
      {selectedPromoForImage && (
        <PromoImageGeneratorModal
          isOpen={!!selectedPromoForImage}
          onClose={() => setSelectedPromoForImage(null)}
          promo={selectedPromoForImage}
        />
      )}
    </div>
  )
}