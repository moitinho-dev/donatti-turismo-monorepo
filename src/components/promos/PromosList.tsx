"use client"
import { useState } from "react"
import { Edit, Trash2, Eye, Calendar, MapPin, Hotel, DollarSign, Moon, Utensils, Plane, Clock } from "lucide-react"
import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PromosListProps {
  promos: any[]
  onEdit: (promo: any) => void
  onDelete: () => void
}

export function PromosList({ promos, onEdit, onDelete }: PromosListProps) {
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta promoção?")) return

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/promos?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete promo")
      onDelete()
    } catch (err) {
      console.error("Error deleting promo:", err)
      alert("Erro ao excluir promoção")
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      // Parse the date string to a Date object
      const date = parseISO(dateString)

      // Format the date in a user-friendly way
      if (isToday(date)) {
        return `Hoje, ${format(date, "HH:mm")}`
      } else if (isYesterday(date)) {
        return `Ontem, ${format(date, "HH:mm")}`
      } else {
        return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })
      }
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    } catch (error) {
      console.error("Error formatting time ago:", error)
      return ""
    }
  }

  return (
    <div className="space-y-4">
      {promos.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhuma promoção encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {promos.map((promo) => (
            <div key={promo.id} className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-donatti-blue" />
                    <h3 className="text-lg font-semibold text-gray-900">{promo.destino}</h3>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Hotel className="h-3.5 w-3.5" />
                      <span>{promo.hotel}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {new Date(promo.dataIda).toLocaleDateString("pt-BR")} -{" "}
                        {new Date(promo.dataVolta).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Moon className="h-3.5 w-3.5" />
                      <span>{promo.noites} noites</span>
                    </div>

                    {promo.regimeAlimentacao && (
                      <div className="flex items-center gap-1">
                        <Utensils className="h-3.5 w-3.5" />
                        <span>{promo.regimeAlimentacao}</span>
                      </div>
                    )}

                    {promo.aeroportoSaida && (
                      <div className="flex items-center gap-1">
                        <Plane className="h-3.5 w-3.5" />
                        <span>{promo.aeroportoSaida}</span>
                      </div>
                    )}
                  </div>

                  {promo.createdAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Criado {formatTimeAgo(promo.createdAt)}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end">
                  <div className="text-xl font-bold text-donatti-blue">
                    R${" "}
                    {Number.parseFloat(promo.valorTotal).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {promo.parcelas}x de R${" "}
                    {(Number.parseFloat(promo.valorTotal) / Number.parseInt(promo.parcelas)).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedPromo(expandedPromo === promo.id ? null : promo.id)}
                    className="p-2 text-gray-500 hover:text-donatti-blue hover:bg-gray-50 rounded-md transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onEdit(promo)}
                    className="p-2 text-gray-500 hover:text-donatti-blue hover:bg-gray-50 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id)}
                    disabled={isDeleting === promo.id}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
                    title="Excluir"
                  >
                    {isDeleting === promo.id ? (
                      <div className="h-5 w-5 border-2 border-t-transparent border-red-500 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {expandedPromo === promo.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Detalhes da Viagem</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">Data de Ida</div>
                            <div className="text-sm">{formatDate(promo.dataIda)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">Data de Volta</div>
                            <div className="text-sm">{formatDate(promo.dataVolta)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">Noites</div>
                            <div className="text-sm">{promo.noites}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Valores</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">Valor Total</div>
                            <div className="text-sm">
                              R${" "}
                              {Number.parseFloat(promo.valorTotal).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">Valor por Pessoa</div>
                            <div className="text-sm">
                              R${" "}
                              {(Number.parseFloat(promo.valorTotal) / 2).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">Parcelamento</div>
                            <div className="text-sm">
                              {promo.parcelas}x de R${" "}
                              {(Number.parseFloat(promo.valorTotal) / Number.parseInt(promo.parcelas)).toLocaleString(
                                "pt-BR",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Informações Adicionais</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">Regime de Alimentação</div>
                            <div className="text-sm">{promo.regimeAlimentacao || "Não informado"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">Aeroporto de Saída</div>
                            <div className="text-sm">{promo.aeroportoSaida || "Não informado"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">Data de Criação</div>
                            <div className="text-sm">
                              {promo.createdAt ? formatDate(promo.createdAt) : "Não informado"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
