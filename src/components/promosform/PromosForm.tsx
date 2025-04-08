"use client"
import type React from "react"
import { useState } from "react"
import { Loader2, Calendar, Users, MapPin, Hotel, DollarSign, Utensils, Plane } from "lucide-react"

interface FormularioData {
  DESTINO: string
  HOTEL: string
  DE: string
  ATE: string
  MES_DE: string
  MES_ATE: string
  ANO: string
  VALOR: string
  COM_CAFE: string | boolean
  SEM_CAFE: string | boolean
  MEIA_PENSAO: string | boolean
  PENSAO_COMPLETA: string | boolean
  ALL_INCLUSIVE: string | boolean
  NUMERO_DE_NOITES: string
  SP: boolean
  CG: boolean
  AEREO: boolean
  [key: string]: string | boolean
}

interface PromosFormProps {
  updateData: () => void
}

const PromosForm: React.FC<PromosFormProps> = ({ updateData }) => {
  const [formulario, setFormulario] = useState<FormularioData>({
    DESTINO: "",
    HOTEL: "",
    DE: "",
    ATE: "",
    MES_DE: "",
    MES_ATE: "",
    ANO: "",
    VALOR: "",
    COM_CAFE: false,
    SEM_CAFE: false,
    MEIA_PENSAO: false,
    PENSAO_COMPLETA: false,
    ALL_INCLUSIVE: false,
    NUMERO_DE_NOITES: "",
    SP: false,
    CG: false,
    AEREO: false,
  })
  const [formattedAmount, setFormattedAmount] = useState("")
  const [regimeAlimentacao, setRegimeAlimentacao] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const camposObrigatorios = ["DESTINO", "HOTEL", "DE", "ATE", "VALOR", "NUMERO_DE_NOITES"]

  const handleChange = (campo: keyof FormularioData, valor: string | boolean) => {
    setFormulario((prevFormulario) => {
      let updatedAereo: boolean = prevFormulario.AEREO

      if (campo === "CG" || campo === "SP") {
        updatedAereo = valor as boolean
      }

      let updatedValor: string | boolean = valor
      if (campo === "DESTINO" || campo === "HOTEL") {
        updatedValor = (valor as string).toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
      }

      return {
        ...prevFormulario,
        [campo]: updatedValor,
        AEREO: updatedAereo,
      } as FormularioData
    })

    if (campo === "ATE" && typeof valor === "string") {
      const [ano, mes, dia] = valor.split("-")
      setFormulario((prevFormulario) => ({
        ...prevFormulario,
        MES_ATE: mes,
        ANO: ano,
        ATE: `${dia}`,
      }))
    }

    if (campo === "DE" && typeof valor === "string") {
      const [ano, mes, dia] = valor.split("-")
      setFormulario((prevFormulario) => ({
        ...prevFormulario,
        MES_DE: mes,
        DE: `${dia}`,
      }))
    }
  }

  const handleChangeRegimeAlimentacao = (valor: string) => {
    setRegimeAlimentacao(valor)

    setFormulario((prevFormulario) => {
      const updatedFormulario: FormularioData = {
        ...prevFormulario,
        COM_CAFE: false,
        SEM_CAFE: false,
        MEIA_PENSAO: false,
        PENSAO_COMPLETA: false,
        ALL_INCLUSIVE: false,
      }

      if (valor === "COM_CAFE") {
        updatedFormulario.COM_CAFE = true
      } else if (valor === "SEM_CAFE") {
        updatedFormulario.SEM_CAFE = true
      } else if (valor === "MEIA_PENSAO") {
        updatedFormulario.MEIA_PENSAO = true
      } else if (valor === "PENSAO_COMPLETA") {
        updatedFormulario.PENSAO_COMPLETA = true
      } else if (valor === "ALL_INCLUSIVE") {
        updatedFormulario.ALL_INCLUSIVE = true
      }

      return updatedFormulario as FormularioData
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const formularioFormatado: FormularioData = {
      ...formulario,
      DESTINO: formulario.DESTINO.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase()),
      HOTEL: formulario.HOTEL.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase()),
    }

    const camposFaltando = camposObrigatorios.filter((campo) => !formularioFormatado[campo])
    const regimeAlimentacaoPreenchido = !!regimeAlimentacao

    if (camposFaltando.length === 0 && regimeAlimentacaoPreenchido) {
      try {
        setIsSubmitting(true)
        const formData = new FormData()

        Object.entries(formularioFormatado).forEach(([key, value]) => {
          const formattedValue = typeof value === "boolean" ? String(value) : value
          formData.append(key, formattedValue)
        })

        const dataFormatada = `${formulario.DE}/${formulario.MES_DE} até ${formulario.ATE}/${formulario.MES_ATE} de ${formulario.ANO}`
        formData.append("DATA_FORMATADA", dataFormatada)

        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbwD_rEdhSvIzB_tnxYo8tHtyo3p22OudMJ0URskyy8vHQ5oRWoFLm7fA1pxTrrUy2k/exec",
          {
            method: "POST",
            body: formData,
          },
        )

        if (response.ok) {
          setFormSuccess("Promoção adicionada com sucesso!")
          resetFormulario()
          updateData()
        } else {
          setFormError("Ocorreu um erro ao enviar o formulário. Tente novamente mais tarde.")
        }
      } catch (error) {
        console.error("Erro ao enviar o formulário:", error)
        setFormError("Ocorreu um erro ao enviar o formulário. Tente novamente mais tarde.")
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setFormError("Por favor, preencha todos os campos obrigatórios, incluindo o regime de alimentação.")
    }
  }

  const resetFormulario = () => {
    setFormulario({
      DESTINO: "",
      HOTEL: "",
      DE: "",
      ATE: "",
      MES_DE: "",
      MES_ATE: "",
      ANO: "",
      VALOR: "",
      COM_CAFE: false,
      SEM_CAFE: false,
      MEIA_PENSAO: false,
      PENSAO_COMPLETA: false,
      ALL_INCLUSIVE: false,
      NUMERO_DE_NOITES: "",
      SP: false,
      CG: false,
      AEREO: false,
    })

    setFormattedAmount("")
    setRegimeAlimentacao("")

    // Reset date inputs
    const deInput = document.getElementById("DE") as HTMLInputElement | null
    const ateInput = document.getElementById("ATE") as HTMLInputElement | null
    if (deInput) deInput.value = ""
    if (ateInput) ateInput.value = ""
  }

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value
    const formattedValue = formatCurrencyValue(inputValue)
    const parsedValue = parseCurrencyValue(inputValue)

    setFormattedAmount(formattedValue)
    setFormulario((prevFormulario) => ({
      ...prevFormulario,
      VALOR: parsedValue,
    }))
  }

  const parseCurrencyValue = (value: string) => {
    const cleanedValue = value.replace(/[^\d,.-]/g, "")
    const numericValue = Number.parseFloat(cleanedValue.replace(/\./g, "").replace(",", "."))

    if (isNaN(numericValue)) {
      return "0.00"
    }

    const valueAfterCalculation = ((numericValue * 10) / 2 / 15).toFixed(2)
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-primary-blue mb-6 font-mon">Adicionar Nova Promoção</h2>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <MapPin className="h-4 w-4" />
                Destino <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                type="text"
                id="DESTINO"
                value={formulario.DESTINO}
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
                value={formulario.HOTEL}
                onChange={(e) => handleChange("HOTEL", e.target.value)}
                placeholder="Ex: Grand Hotel"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <Calendar className="h-4 w-4" />
                Data de Ida <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                id="DE"
                onChange={(e) => handleChange("DE", e.target.value)}
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
                onChange={(e) => handleChange("ATE", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                <Users className="h-4 w-4" />
                Número de Noites <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                id="NUMERO_DE_NOITES"
                value={formulario.NUMERO_DE_NOITES}
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

          <div className="mb-8">
            <label className="flex items-center gap-2 text-primary-blue font-mon font-medium mb-2">
              <Plane className="h-4 w-4" />
              Aeroporto de Saída
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md bg-white">
                <input
                  type="checkbox"
                  id="CG"
                  className="h-4 w-4 rounded text-primary-blue focus:ring-primary-blue"
                  checked={formulario.CG}
                  onChange={() => handleChange("CG", !formulario.CG)}
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
                  checked={formulario.SP}
                  onChange={() => handleChange("SP", !formulario.SP)}
                />
                <label htmlFor="SP" className="text-gray-800 font-mon">
                  São Paulo
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetFormulario}
              className="px-6 py-3 mr-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-mon font-medium"
              disabled={isSubmitting}
            >
              Limpar
            </button>

            <button
              type="submit"
              className="px-6 py-3 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon font-medium flex items-center justify-center min-w-[120px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Adicionar Promoção"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PromosForm
