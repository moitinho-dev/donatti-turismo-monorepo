"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { usePromo } from "@/hooks/usePromo"
import { MapPin, Hotel, Calendar, DollarSign, Users, Utensils, Plane, Loader2, Save, X, CreditCard } from "lucide-react"

interface PromoFormProps {
  promo?: any
  onSuccess: () => void
}

export function PromoForm({ promo, onSuccess }: PromoFormProps) {
  const [formData, setFormData] = useState({
    id: "",
    DESTINO: "",
    HOTEL: "",
    DE: "",
    ATE: "",
    MES_DE: "",
    MES_ATE: "",
    ANO: "",
    VALOR: "",
    PARCELAS: "10",
    COM_CAFE: false,
    SEM_CAFE: false,
    MEIA_PENSAO: false,
    PENSAO_COMPLETA: false,
    ALL_INCLUSIVE: false,
    NUMERO_DE_NOITES: "",
    SP: false,
    CG: false,
    AEREO: false,
    DATA_FORMATADA: "",
  })

  const [formattedAmount, setFormattedAmount] = useState("")
  const [regimeAlimentacao, setRegimeAlimentacao] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [deDate, setDeDate] = useState("")
  const [ateDate, setAteDate] = useState("")

  const { savePromo, isLoading } = usePromo()

  // Initialize form with promo data if editing
  useEffect(() => {
    if (promo) {
      setFormData((prev) => ({
        id: promo.id || "",
        DESTINO: promo.DESTINO || "",
        HOTEL: promo.HOTEL || "",
        DE: "", // Will be set from DATA_FORMATADA
        ATE: "", // Will be set from DATA_FORMATADA
        MES_DE: "", // Will be set from DATA_FORMATADA
        MES_ATE: "", // Will be set from DATA_FORMATADA
        ANO: "", // Will be set from DATA_FORMATADA
        VALOR: promo.VALOR || "",
        PARCELAS: promo.PARCELAS || "10",
        COM_CAFE: promo.COM_CAFE || false,
        SEM_CAFE: promo.SEM_CAFE || false,
        MEIA_PENSAO: promo.MEIA_PENSAO || false,
        PENSAO_COMPLETA: promo.PENSAO_COMPLETA || false,
        ALL_INCLUSIVE: promo.ALL_INCLUSIVE || false,
        NUMERO_DE_NOITES: promo.NUMERO_DE_NOITES || "",
        SP: promo.SP || false,
        CG: promo.CG || false,
        AEREO: promo.AEREO || false,
        DATA_FORMATADA: promo.DATA_FORMATADA || "",
      }))

      // Set formatted amount
      if (promo.VALOR) {
        const cleanedValue = promo.VALOR.replace(/[^\d.,]/g, "")
        const numericValue = Number.parseFloat(cleanedValue.replace(",", "."))
        const parcelas = Number.parseInt(promo.PARCELAS || "10", 10)
        const valueAfterCalculation = numericValue * parcelas * 2
        setFormattedAmount(
          valueAfterCalculation.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
        )
      }

      // Set regime alimentacao
      if (promo.ALL_INCLUSIVE) setRegimeAlimentacao("ALL_INCLUSIVE")
      else if (promo.PENSAO_COMPLETA) setRegimeAlimentacao("PENSAO_COMPLETA")
      else if (promo.MEIA_PENSAO) setRegimeAlimentacao("MEIA_PENSAO")
      else if (promo.COM_CAFE) setRegimeAlimentacao("COM_CAFE")
      else if (promo.SEM_CAFE) setRegimeAlimentacao("SEM_CAFE")
    }
  }, [promo])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // If changing parcelas, update the formatted amount
    if (field === "PARCELAS" && typeof value === "string") {
      const cleanedValue = formData.VALOR.replace(/[^\d.,]/g, "")
      const numericValue = Number.parseFloat(cleanedValue.replace(",", "."))
      if (!isNaN(numericValue)) {
        const parcelas = Number.parseInt(value, 10)
        const valueAfterCalculation = numericValue * parcelas * 2
        setFormattedAmount(
          valueAfterCalculation.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
        )
      }
    }
  }

  const handleChangeRegimeAlimentacao = (valor: string) => {
    setRegimeAlimentacao(valor)

    setFormData((prev) => {
      const updated = {
        ...prev,
        COM_CAFE: false,
        SEM_CAFE: false,
        MEIA_PENSAO: false,
        PENSAO_COMPLETA: false,
        ALL_INCLUSIVE: false,
      }

      if (valor === "COM_CAFE") updated.COM_CAFE = true
      else if (valor === "SEM_CAFE") updated.SEM_CAFE = true
      else if (valor === "MEIA_PENSAO") updated.MEIA_PENSAO = true
      else if (valor === "PENSAO_COMPLETA") updated.PENSAO_COMPLETA = true
      else if (valor === "ALL_INCLUSIVE") updated.ALL_INCLUSIVE = true

      return updated
    })
  }

  const handleDeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    setDeDate(dateValue)

    if (dateValue) {
      const [year, month, day] = dateValue.split("-")

      setFormData((prev) => ({
        ...prev,
        DE: day,
        MES_DE: month,
        ANO: year,
      }))

      setFormData((prevFormData) => {
        return updateDataFormatada(day, prevFormData.ATE, month, prevFormData.MES_ATE, year, prevFormData)
      })
    }
  }

  const handleAteDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    setAteDate(dateValue)

    if (dateValue) {
      const [year, month, day] = dateValue.split("-")

      setFormData((prev) => ({
        ...prev,
        ATE: day,
        MES_ATE: month,
        ANO: year,
      }))

      setFormData((prevFormData) => {
        return updateDataFormatada(prevFormData.DE, day, prevFormData.MES_DE, month, year, prevFormData)
      })
    }
  }

  const updateDataFormatada = (de: string, ate: string, mesDE: string, mesATE: string, ano: string, prev: any) => {
    if (de && ate && mesDE && mesATE && ano) {
      const dataFormatada = `${de}/${mesDE} até ${ate}/${mesATE} de ${ano}`

      return {
        ...prev,
        DATA_FORMATADA: dataFormatada,
      }
    }
    return prev
  }

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value
    const formattedValue = formatCurrencyValue(inputValue)
    const parsedValue = parseCurrencyValue(inputValue)

    setFormattedAmount(formattedValue)
    setFormData((prev) => ({
      ...prev,
      VALOR: parsedValue,
    }))
  }

  const parseCurrencyValue = (value: string) => {
    const cleanedValue = value.replace(/[^\d,.-]/g, "")
    const numericValue = Number.parseFloat(cleanedValue.replace(/\./g, "").replace(",", "."))

    if (isNaN(numericValue)) {
      return "0.00"
    }

    const parcelas = Number.parseInt(formData.PARCELAS || "10", 10)
    const valueAfterCalculation = ((numericValue * 10) / 2 / parcelas).toFixed(2)
    return valueAfterCalculation
  }

  const formatCurrencyValue = (value: string) => {
    const formattedValue = value.replace(/[^\d]/g, "")
    const numberValue = Number.parseFloat(formattedValue) / 100

    if (isNaN(numberValue)) {
      return "R$ 0,00"
    }

    return numberValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    // Validate required fields
    const requiredFields = ["DESTINO", "HOTEL", "DATA_FORMATADA", "VALOR", "NUMERO_DE_NOITES"]
    const missingFields = requiredFields.filter((field) => !formData[field])

    if (missingFields.length > 0) {
      setFormError(`Campos obrigatórios não preenchidos: ${missingFields.join(", ")}`)
      return
    }

    if (!regimeAlimentacao) {
      setFormError("Por favor, selecione um regime de alimentação")
      return
    }

    try {
      await savePromo(formData)
      setFormSuccess(formData.id ? "Promoção atualizada com sucesso!" : "Promoção adicionada com sucesso!")

      // Reset form if it's a new promo
      if (!formData.id) {
        resetForm()
      }

      // Notify parent component
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      setFormError("Erro ao salvar promoção. Por favor, tente novamente.")
    }
  }

  const resetForm = () => {
    setFormData({
      id: "",
      DESTINO: "",
      HOTEL: "",
      DE: "",
      ATE: "",
      MES_DE: "",
      MES_ATE: "",
      ANO: "",
      VALOR: "",
      PARCELAS: "10",
      COM_CAFE: false,
      SEM_CAFE: false,
      MEIA_PENSAO: false,
      PENSAO_COMPLETA: false,
      ALL_INCLUSIVE: false,
      NUMERO_DE_NOITES: "",
      SP: false,
      CG: false,
      AEREO: false,
      DATA_FORMATADA: "",
    })
    setFormattedAmount("")
    setRegimeAlimentacao("")
    setDeDate("")
    setAteDate("")
  }

  // Calculate installment value for display
  const getInstallmentValue = () => {
    const cleanedValue = formData.VALOR.replace(/[^\d.,]/g, "")
    const numericValue = Number.parseFloat(cleanedValue.replace(",", "."))

    if (isNaN(numericValue)) {
      return "R$ 0,00"
    }

    const parcelas = Number.parseInt(formData.PARCELAS, 10)
    const totalValue = numericValue * parcelas * 2
    const installmentValue = totalValue / parcelas

    return installmentValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-8">
        <h2 className="text-xl font-semibold text-primary-blue mb-6 font-mon">
          {promo ? "Editar Promoção" : "Adicionar Nova Promoção"}
        </h2>

        {formError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-mon">
            <p>{formError}</p>
          </div>
        )}

        {formSuccess && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 font-mon">
            <p>{formSuccess}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <MapPin className="h-4 w-4" />
                Destino <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                type="text"
                id="DESTINO"
                value={formData.DESTINO}
                onChange={(e) => handleChange("DESTINO", e.target.value)}
                placeholder="Ex: Rio de Janeiro"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <Hotel className="h-4 w-4" />
                Hotel <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                type="text"
                id="HOTEL"
                value={formData.HOTEL}
                onChange={(e) => handleChange("HOTEL", e.target.value)}
                placeholder="Ex: Grand Hotel"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <Calendar className="h-4 w-4" />
                Data de Ida <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                id="DE"
                value={deDate}
                onChange={handleDeDateChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <Calendar className="h-4 w-4" />
                Data de Volta <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                id="ATE"
                value={ateDate}
                onChange={handleAteDateChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <DollarSign className="h-4 w-4" />
                Valor <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="R$ 0,00"
                name="amount"
                inputMode="numeric"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                id="VALOR"
                value={formattedAmount}
                onChange={handleAmountChange}
                required
              />
              <p className="text-xs text-gray-500 font-mon">Valor total que será dividido por pessoa e em parcelas</p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <CreditCard className="h-4 w-4" />
                Parcelas <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                id="PARCELAS"
                value={formData.PARCELAS}
                onChange={(e) => handleChange("PARCELAS", e.target.value)}
                required
              >
                <option value="10">10x</option>
                <option value="12">12x</option>
                <option value="15">15x</option>
                <option value="18">18x</option>
              </select>
              <p className="text-xs text-gray-500 font-mon">
                {formData.PARCELAS}x de {getInstallmentValue()}
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <Users className="h-4 w-4" />
                Número de Noites <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                id="NUMERO_DE_NOITES"
                value={formData.NUMERO_DE_NOITES}
                onChange={(e) => handleChange("NUMERO_DE_NOITES", e.target.value)}
                placeholder="Ex: 5"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 text-primary-blue font-mon font-medium mb-2">
              <Utensils className="h-4 w-4" />
              Regime de Alimentação <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
              id="REGIME_ALIMENTACAO"
              value={regimeAlimentacao}
              onChange={(e) => handleChangeRegimeAlimentacao(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              <option value="COM_CAFE">Com Café</option>
              <option value="SEM_CAFE">Sem Café</option>
              <option value="ALL_INCLUSIVE">All Inclusive</option>
              <option value="MEIA_PENSAO">Meia Pensão</option>
              <option value="PENSAO_COMPLETA">Pensão Completa</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 text-primary-blue font-mon font-medium mb-2">
              <Plane className="h-4 w-4" />
              Aéreo
            </label>
            <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md bg-white mb-4">
              <input
                type="checkbox"
                id="AEREO"
                className="h-4 w-4 rounded text-primary-blue focus:ring-primary-blue"
                checked={formData.AEREO}
                onChange={() => handleChange("AEREO", !formData.AEREO)}
              />
              <label htmlFor="AEREO" className="text-gray-800 font-mon">
                Inclui passagem aérea
              </label>
            </div>

            {formData.AEREO && (
              <div>
                <label className="text-sm text-gray-600 font-mon mb-2 block">Aeroporto de Saída</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md bg-white">
                    <input
                      type="checkbox"
                      id="CG"
                      className="h-4 w-4 rounded text-primary-blue focus:ring-primary-blue"
                      checked={formData.CG}
                      onChange={() => handleChange("CG", !formData.CG)}
                    />
                    <label htmlFor="CG" className="text-gray-800 font-mon">
                      Campo Grande
                    </label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md bg-white">
                    <input
                      type="checkbox"
                      id="SP"
                      className="h-4 w-4 rounded text-primary-blue focus:ring-primary-blue"
                      checked={formData.SP}
                      onChange={() => handleChange("SP", !formData.SP)}
                    />
                    <label htmlFor="SP" className="text-gray-800 font-mon">
                      São Paulo
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-mon font-medium flex items-center justify-center"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </button>

            <button
              type="submit"
              className="px-6 py-3 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon font-medium flex items-center justify-center min-w-[160px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {promo ? "Atualizar" : "Adicionar"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

