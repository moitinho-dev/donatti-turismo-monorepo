"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { Loader2, Calendar, DollarSign, Hotel, MapPin, Utensils, Plane, Moon } from "lucide-react"

interface PromoFormProps {
  promo: any
  onSuccess: () => void
}

export function PromoForm({ promo, onSuccess }: PromoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    destino: "",
    hotel: "",
    dataIda: "",
    dataVolta: "",
    noites: "",
    valorTotal: "",
    parcelas: "10",
    regimeAlimentacao: "",
    aeroportoSaida: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formattedValue, setFormattedValue] = useState("")

  useEffect(() => {
    if (promo) {
      const dataIdaFormatted = promo.dataIda ? new Date(promo.dataIda).toISOString().split("T")[0] : ""
      const dataVoltaFormatted = promo.dataVolta ? new Date(promo.dataVolta).toISOString().split("T")[0] : ""

      setFormData({
        id: promo.id || "",
        destino: promo.destino || "",
        hotel: promo.hotel || "",
        dataIda: dataIdaFormatted,
        dataVolta: dataVoltaFormatted,
        noites: promo.noites?.toString() || "",
        valorTotal: promo.valorTotal?.toString() || "",
        parcelas: promo.parcelas?.toString() || "10",
        regimeAlimentacao: promo.regimeAlimentacao || "",
        aeroportoSaida: promo.aeroportoSaida || "",
      })

      // Format the value for display
      if (promo.valorTotal) {
        const numericValue = Number.parseFloat(promo.valorTotal)
        setFormattedValue(numericValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
      }
    }
  }, [promo])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === "valorTotal") {
      // Handle currency formatting
      // Remove non-numeric characters
      const numericValue = value.replace(/\D/g, "")

      // Convert to a number with 2 decimal places
      const floatValue = numericValue ? Number.parseFloat(numericValue) / 100 : 0

      // Format for display
      setFormattedValue(floatValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

      // Store the actual numeric value
      setFormData((prev) => ({ ...prev, [name]: floatValue.toString() }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.destino) newErrors.destino = "Destino é obrigatório"
    if (!formData.hotel) newErrors.hotel = "Hotel é obrigatório"
    if (!formData.dataIda) newErrors.dataIda = "Data de ida é obrigatória"
    if (!formData.dataVolta) newErrors.dataVolta = "Data de volta é obrigatória"
    if (!formData.noites) newErrors.noites = "Número de noites é obrigatório"
    if (!formData.valorTotal) newErrors.valorTotal = "Valor total é obrigatório"
    if (!formData.parcelas) newErrors.parcelas = "Número de parcelas é obrigatório"

    // Check if dataVolta is after dataIda
    if (formData.dataIda && formData.dataVolta) {
      const dataIda = new Date(formData.dataIda)
      const dataVolta = new Date(formData.dataVolta)

      if (dataVolta < dataIda) {
        newErrors.dataVolta = "Data de volta deve ser posterior à data de ida"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/promos", {
        method: formData.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to save promo")

      onSuccess()
    } catch (err) {
      console.error("Error saving promo:", err)
      alert("Erro ao salvar promoção")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="destino" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Destino <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="destino"
              name="destino"
              value={formData.destino}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${errors.destino ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue`}
              placeholder="Ex: Rio de Janeiro"
            />
            {errors.destino && <p className="mt-1 text-sm text-red-500">{errors.destino}</p>}
          </div>

          <div>
            <label htmlFor="hotel" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Hotel className="h-4 w-4" />
              Hotel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="hotel"
              name="hotel"
              value={formData.hotel}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${errors.hotel ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue`}
              placeholder="Ex: Grand Hotel"
            />
            {errors.hotel && <p className="mt-1 text-sm text-red-500">{errors.hotel}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dataIda" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Data de Ida <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dataIda"
                name="dataIda"
                value={formData.dataIda}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${errors.dataIda ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue`}
              />
              {errors.dataIda && <p className="mt-1 text-sm text-red-500">{errors.dataIda}</p>}
            </div>

            <div>
              <label
                htmlFor="dataVolta"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                Data de Volta <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dataVolta"
                name="dataVolta"
                value={formData.dataVolta}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${errors.dataVolta ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue`}
              />
              {errors.dataVolta && <p className="mt-1 text-sm text-red-500">{errors.dataVolta}</p>}
            </div>
          </div>

          <div>
            <label
              htmlFor="regimeAlimentacao"
              className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
            >
              <Utensils className="h-4 w-4" />
              Regime de Alimentação
            </label>
            <select
              id="regimeAlimentacao"
              name="regimeAlimentacao"
              value={formData.regimeAlimentacao}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue"
            >
              <option value="">Selecione...</option>
              <option value="Café da Manhã">Café da Manhã</option>
              <option value="Meia Pensão">Meia Pensão</option>
              <option value="Pensão Completa">Pensão Completa</option>
              <option value="All Inclusive">All Inclusive</option>
              <option value="Sem Alimentação">Sem Alimentação</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="aeroportoSaida"
              className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
            >
              <Plane className="h-4 w-4" />
              Aeroporto de Saída
            </label>
            <input
              type="text"
              id="aeroportoSaida"
              name="aeroportoSaida"
              value={formData.aeroportoSaida}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue"
              placeholder="Ex: São Paulo"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="noites" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Moon className="h-4 w-4" />
              Número de Noites <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="noites"
              name="noites"
              value={formData.noites}
              onChange={handleChange}
              min="1"
              className={`w-full px-4 py-2 border ${errors.noites ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue`}
              placeholder="Ex: 5"
            />
            {errors.noites && <p className="mt-1 text-sm text-red-500">{errors.noites}</p>}
          </div>

          <div>
            <label
              htmlFor="valorTotal"
              className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
            >
              <DollarSign className="h-4 w-4" />
              Valor Total <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="text"
                id="valorTotal"
                name="valorTotal"
                value={formattedValue}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border ${errors.valorTotal ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue`}
                placeholder="0,00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Valor total do pacote para duas pessoas.</p>
            {errors.valorTotal && <p className="mt-1 text-sm text-red-500">{errors.valorTotal}</p>}
          </div>

          <div>
            <label htmlFor="parcelas" className="block text-sm font-medium text-gray-700 mb-1">
              Parcelas <span className="text-red-500">*</span>
            </label>
            <select
              id="parcelas"
              name="parcelas"
              value={formData.parcelas}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${errors.parcelas ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-donatti-blue`}
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
              <option value="4">4x</option>
              <option value="5">5x</option>
              <option value="6">6x</option>
              <option value="7">7x</option>
              <option value="8">8x</option>
              <option value="9">9x</option>
              <option value="10">10x</option>
              <option value="11">11x</option>
              <option value="12">12x</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Número de parcelas para dividir o valor.</p>
            {errors.parcelas && <p className="mt-1 text-sm text-red-500">{errors.parcelas}</p>}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Resumo dos Valores</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valor Total:</span>
                <span className="text-sm font-medium">
                  R${" "}
                  {formData.valorTotal
                    ? Number.parseFloat(formData.valorTotal).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0,00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valor por Pessoa:</span>
                <span className="text-sm font-medium">
                  R${" "}
                  {formData.valorTotal
                    ? (Number.parseFloat(formData.valorTotal) / 2).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0,00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valor da Parcela (por pessoa):</span>
                <span className="text-sm font-medium">
                  {formData.parcelas && formData.valorTotal
                    ? `${formData.parcelas}x de R$ ${(Number.parseFloat(formData.valorTotal) / 2 / Number.parseInt(formData.parcelas)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "0x de R$ 0,00"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-donatti-blue text-white rounded-md hover:bg-second-blue transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <span>{formData.id ? "Atualizar" : "Adicionar"} Promoção</span>
          )}
        </button>
      </div>
    </form>
  )
}
