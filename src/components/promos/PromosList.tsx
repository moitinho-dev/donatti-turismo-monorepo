"use client"
import { useState } from "react"
import { usePromo } from "@/hooks/usePromo"
import {
  Calendar,
  MapPin,
  Hotel,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  ImageIcon,
  Users,
  Utensils,
  Plane,
} from "lucide-react"
import { format, parseISO } from "date-fns"
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
  PARCELAS?: string
}

interface PromosListProps {
  promos: PromoData[]
  onEdit: (promo: PromoData) => void
  onDelete: () => void
}

// Add this helper function at the top of the component
const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString)
    if (isNaN(date.getTime())) {
      return "Data inválida"
    }
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch (error) {
    console.error("Error formatting date:", error, dateString)
    return "Data inválida"
  }
}

// Adicionar função para formatar data relativa
const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return "Hoje"
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Ontem"
  } else {
    return new Date(date).toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
}

// Modificar a função para agrupar promos por data
const groupPromosByDate = (promos: PromoData[]) => {
  const groups: { [key: string]: PromoData[] } = {}

  promos.forEach((promo) => {
    const date = promo.createdAt ? new Date(promo.createdAt).toISOString().split("T")[0] : "unknown"
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(promo)
  })

  // Sort dates in descending order (newest first)
  return Object.entries(groups)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, promos]) => ({ date, promos }))
}

// Modificar a função para calcular valores por pessoa
const calculateValues = (promo: PromoData) => {
  const baseValue = Number.parseFloat(promo.VALOR.replace(/[^\d.,]/g, "").replace(",", "."))
  if (isNaN(baseValue)) return { total: "0,00", perPerson: "0,00", installment: "0,00" }

  const parcelas = Number.parseInt(promo.PARCELAS || "10", 10)
  const totalValue = baseValue * parcelas * 2
  const perPersonValue = totalValue / 2
  const installmentValue = perPersonValue / parcelas

  return {
    total: totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    perPerson: perPersonValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    installment: installmentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }
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
    const valueAfterCalculation = numericValue * 15 * 2

    return valueAfterCalculation.toFixed(2).replace(".", ",")
  }

  const getInstallmentValue = (value: string) => {
    if (!value) {
      return "0,00"
    }

    const cleanedValue = value.replace(/[^\d.,]/g, "")
    const numericValue = Number.parseFloat(cleanedValue.replace(",", "."))
    const installmentValue = (numericValue * 2 * 15) / 15

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

  // Filter and sort promos
  const filteredPromos = promos
    .filter((promo) => {
      const matchesSearch =
        searchTerm === "" ||
        promo.DESTINO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.HOTEL.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.DATA_FORMATADA.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDestino = selectedDestino === null || promo.DESTINO === selectedDestino

      return matchesSearch && matchesDestino
    })
    .sort((a, b) => {
      let comparison = 0

      if (sortField === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortField === "DESTINO") {
        comparison = a.DESTINO.localeCompare(b.DESTINO)
      } else if (sortField === "VALOR") {
        const valueA = Number.parseFloat(a.VALOR.replace(",", "."))
        const valueB = Number.parseFloat(b.VALOR.replace(",", "."))
        comparison = valueA - valueB
      } else if (sortField === "DATA_FORMATADA") {
        comparison = a.DATA_FORMATADA.localeCompare(b.DATA_FORMATADA)
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

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

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
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
        {filteredPromos.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mon">
            {promos.length === 0
              ? "Nenhuma promoção cadastrada. Adicione sua primeira promoção!"
              : "Nenhuma promoção encontrada com os filtros atuais."}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groupPromosByDate(filteredPromos).map(({ date, promos }) => (
              <div key={date} className="py-2">
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className={`w-full border-t ${
                        date === new Date().toISOString().split("T")[0]
                          ? "border-green-300"
                          : date === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]
                            ? "border-orange-300"
                            : "border-gray-300"
                      }`}
                    ></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span
                      className={`px-3 text-sm ${
                        date === new Date().toISOString().split("T")[0]
                          ? "bg-green-50 text-green-700 font-medium"
                          : date === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split("T")[0]
                            ? "bg-orange-50 text-orange-700 font-medium"
                            : "bg-white text-gray-500"
                      }`}
                    >
                      {formatRelativeDate(date)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  {promos.map((promo) => {
                    const values = calculateValues(promo)
                    return (
                      <div
                        key={promo.id}
                        className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-primary-blue mr-2" />
                              <span className="font-medium text-primary-blue">{promo.DESTINO}</span>
                              <span className="mx-2 text-gray-400">•</span>
                              <Hotel className="h-4 w-4 text-gray-500 mr-1" />
                              <span className="text-gray-700">{promo.HOTEL}</span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Calendar className="h-3 w-3 mr-1" />
                                {promo.DATA_FORMATADA}
                              </span>

                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Users className="h-3 w-3 mr-1" />
                                {promo.NUMERO_DE_NOITES} noites
                              </span>

                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Utensils className="h-3 w-3 mr-1" />
                                {getRegimeAlimentacao(promo)}
                              </span>

                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Plane className="h-3 w-3 mr-1" />
                                {getAeroportoSaida(promo)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Valor total:</div>
                              <div className="text-lg font-bold text-primary-blue">R$ {values.total}</div>
                            </div>

                            <div className="flex gap-4 mt-1 text-sm">
                              <div className="text-right">
                                <div className="text-gray-500">Por pessoa:</div>
                                <div className="font-medium">R$ {values.perPerson}</div>
                              </div>

                              <div className="text-right">
                                <div className="text-gray-500">Em {promo.PARCELAS || 10}x:</div>
                                <div className="font-medium">R$ {values.installment}</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {deleteConfirmId === promo.id ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={handleConfirmDelete}
                                  disabled={isLoading}
                                  className="text-white bg-red-600 hover:bg-red-700 p-1.5 rounded"
                                >
                                  {isLoading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={handleCancelDelete}
                                  className="text-gray-600 hover:text-gray-800 p-1.5 rounded bg-gray-100 hover:bg-gray-200"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleGenerateImage(promo)}
                                  className="text-green-600 hover:text-green-800 p-1.5 rounded hover:bg-green-50"
                                  title="Gerar imagem promocional"
                                >
                                  <ImageIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => onEdit(promo)}
                                  className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(promo.id)}
                                  className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
