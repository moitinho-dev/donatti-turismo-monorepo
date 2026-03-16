"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { usePromo } from "@/hooks/usePromo"
import { MapPin, Hotel, Calendar, DollarSign, Users, Utensils, Plane, Loader2, Save, X, CreditCard, FileUp, CheckCircle2, AlertCircle } from "lucide-react"

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
    SITE_PUBLISHED: false,
    SITE_SECTION: "",
    SITE_SLUG: "",
    SITE_IMAGE: "",
    SITE_DESCRIPTION: "",
    SITE_INCLUSIONS: [] as string[],
    SITE_DEPARTURES: [] as string[],
  })
  const siteSectionSuggestions = ["nacionais", "internacionais", "cruzeiros", "lua-de-mel", "religioso", "nordeste"]

  const [formattedAmount, setFormattedAmount] = useState("")
  const [regimeAlimentacao, setRegimeAlimentacao] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [deDate, setDeDate] = useState("")
  const [ateDate, setAteDate] = useState("")

  // PDF extraction state
  const [isExtractingPdf, setIsExtractingPdf] = useState(false)
  const [pdfResult, setPdfResult] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [pdfPacoteDuplo, setPdfPacoteDuplo] = useState(true) // default: PDF vem com valor para 2 adultos

  const { savePromo, isLoading } = usePromo()

  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")

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
        SITE_PUBLISHED: promo.SITE_PUBLISHED || false,
        SITE_SECTION: promo.SITE_SECTION || "",
        SITE_SLUG: promo.SITE_SLUG || "",
        SITE_IMAGE: promo.SITE_IMAGE || "",
        SITE_DESCRIPTION: promo.SITE_DESCRIPTION || "",
        SITE_INCLUSIONS: promo.SITE_INCLUSIONS || [],
        SITE_DEPARTURES: promo.SITE_DEPARTURES || [],
      }))

      // Set formatted amount - VALOR já é o valor total salvo (ex: "5000.00")
      if (promo.VALOR) {
        const numericValue = Number.parseFloat(promo.VALOR)
        if (!isNaN(numericValue)) {
          setFormattedAmount(
            numericValue.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
          )
        }
      }

      // Set regime alimentacao
      if (promo.ALL_INCLUSIVE) setRegimeAlimentacao("ALL_INCLUSIVE")
      else if (promo.PENSAO_COMPLETA) setRegimeAlimentacao("PENSAO_COMPLETA")
      else if (promo.MEIA_PENSAO) setRegimeAlimentacao("MEIA_PENSAO")
      else if (promo.COM_CAFE) setRegimeAlimentacao("COM_CAFE")
      else if (promo.SEM_CAFE) setRegimeAlimentacao("SEM_CAFE")
    }
  }, [promo])

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Auto-gerar slug quando o destino mudar e o campo não foi personalizado
    if (field === "DESTINO") {
      const autoSlug = slugify(String(value || ""))
      setFormData((prev) => {
        if (!prev.SITE_SLUG || prev.SITE_SLUG === slugify(prev.DESTINO || "")) {
          return { ...prev, SITE_SLUG: autoSlug }
        }
        return prev
      })
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
    // Remove tudo exceto números
    const cleanedValue = value.replace(/[^\d]/g, "")
    // Converte centavos para reais (ex: 500000 -> 5000.00)
    const numericValue = Number.parseFloat(cleanedValue) / 100

    if (isNaN(numericValue)) {
      return "0.00"
    }

    // Salva o valor total digitado pelo usuário
    return numericValue.toFixed(2)
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

    if (formData.SITE_PUBLISHED) {
      const missingSiteFields = []
      if (!formData.SITE_SECTION) missingSiteFields.push("Seção")
      if (!formData.SITE_SLUG) missingSiteFields.push("Slug")
      if (!formData.SITE_IMAGE) missingSiteFields.push("Imagem")
      if (!formData.SITE_DESCRIPTION) missingSiteFields.push("Descrição curta")

      if (missingSiteFields.length) {
        setFormError(`Para publicar no site, preencha: ${missingSiteFields.join(", ")}`)
        return
      }
    }

    let payload = { ...formData }

    // Se for publicar e não houver imagem, buscar automaticamente
    if (payload.SITE_PUBLISHED && !payload.SITE_IMAGE) {
      try {
        const resp = await fetch(`/api/image-search?query=${encodeURIComponent(payload.DESTINO)}&limit=1`)
        const data = await resp.json()
        const first = data?.results?.[0]
        if (first?.urls?.regular || first?.urls?.small) {
          payload.SITE_IMAGE = first.urls.regular || first.urls.small
        }
      } catch (err) {
        console.warn("Não foi possível buscar imagem automática", err)
      }
    }

    try {
      await savePromo(payload)
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
      SITE_PUBLISHED: false,
      SITE_SECTION: "",
      SITE_SLUG: "",
      SITE_IMAGE: "",
      SITE_DESCRIPTION: "",
      SITE_INCLUSIONS: [],
      SITE_DEPARTURES: [],
    })
    setFormattedAmount("")
    setRegimeAlimentacao("")
    setDeDate("")
    setAteDate("")
  }

  const handlePdfUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setPdfResult({ type: "error", message: "Apenas arquivos PDF sao aceitos" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfResult({ type: "error", message: "Arquivo muito grande (max 10MB)" })
      return
    }

    setIsExtractingPdf(true)
    setPdfResult(null)

    try {
      const body = new FormData()
      body.append("file", file)

      const res = await fetch("/api/promos/extract-pdf", { method: "POST", body })
      const data = await res.json()

      if (!res.ok) {
        setPdfResult({ type: "error", message: data.error || "Erro ao processar PDF" })
        return
      }

      const f = data.fields || {}
      let filledCount = 0

      // Text fields
      if (f.DESTINO) { handleChange("DESTINO", f.DESTINO); filledCount++ }
      if (f.HOTEL) { handleChange("HOTEL", f.HOTEL); filledCount++ }
      if (f.NUMERO_DE_NOITES) { handleChange("NUMERO_DE_NOITES", String(f.NUMERO_DE_NOITES)); filledCount++ }
      if (f.PARCELAS) { handleChange("PARCELAS", String(f.PARCELAS)); filledCount++ }

      // Price — divide by 2 if "pacote duplo" (PDF has price for 2 adults, system stores per-person)
      if (f.VALOR) {
        let numericValue = parseFloat(String(f.VALOR))
        if (!isNaN(numericValue)) {
          if (pdfPacoteDuplo) {
            numericValue = numericValue / 2
          }
          handleChange("VALOR", numericValue.toFixed(2))
          setFormattedAmount(
            numericValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          )
          filledCount++
        }
      }

      // Dates
      if (f.DE && f.MES_DE && f.ANO) {
        const y = String(f.ANO)
        const m = String(f.MES_DE).padStart(2, "0")
        const d = String(f.DE).padStart(2, "0")
        setDeDate(`${y}-${m}-${d}`)
        handleChange("DE", d)
        handleChange("MES_DE", m)
        handleChange("ANO", y)
        filledCount++
      }
      if (f.ATE && f.MES_ATE) {
        const y = String(f.ANO || new Date().getFullYear())
        const m = String(f.MES_ATE).padStart(2, "0")
        const d = String(f.ATE).padStart(2, "0")
        setAteDate(`${y}-${m}-${d}`)
        handleChange("ATE", d)
        handleChange("MES_ATE", m)
        filledCount++
      }

      // Build DATA_FORMATADA
      if (f.DE && f.ATE && f.MES_DE && f.MES_ATE && f.ANO) {
        const de = String(f.DE).padStart(2, "0")
        const ate = String(f.ATE).padStart(2, "0")
        const mesDE = String(f.MES_DE).padStart(2, "0")
        const mesATE = String(f.MES_ATE).padStart(2, "0")
        handleChange("DATA_FORMATADA", `${de}/${mesDE} até ${ate}/${mesATE} de ${f.ANO}`)
      }

      // Regime
      if (f.regime) {
        handleChangeRegimeAlimentacao(String(f.regime))
        filledCount++
      }

      // Booleans
      if (f.AEREO === true) { handleChange("AEREO", true); filledCount++ }
      if (f.SP === true) { handleChange("SP", true); filledCount++ }
      if (f.CG === true) { handleChange("CG", true); filledCount++ }

      const warnings = data.warnings?.length ? ` (${data.warnings.join("; ")})` : ""
      setPdfResult({
        type: "success",
        message: `${filledCount} campos preenchidos automaticamente${warnings}`,
      })
    } catch (err) {
      setPdfResult({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao processar PDF",
      })
    } finally {
      setIsExtractingPdf(false)
    }
  }

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handlePdfUpload(file)
  }

  const handlePdfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handlePdfUpload(file)
    e.target.value = "" // reset so same file can be re-uploaded
  }

  // Calculate installment value for display
  const getInstallmentValue = () => {
    // formData.VALOR já está no formato "5000.00" (valor total)
    const numericValue = Number.parseFloat(formData.VALOR)

    if (isNaN(numericValue) || numericValue === 0) {
      return "R$ 0,00"
    }

    const parcelas = Number.parseInt(formData.PARCELAS, 10) || 15
    const installmentValue = numericValue / parcelas

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

        {/* PDF Upload Zone - only for new promos */}
        {!promo && (
          <div className="mb-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handlePdfDrop}
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 bg-gray-50"
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isExtractingPdf}
              />
              {isExtractingPdf ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-600 font-mon">Extraindo dados do PDF...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileUp className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600 font-mon">
                    Arraste um PDF de promocao ou <span className="text-blue-600 font-medium">clique para selecionar</span>
                  </p>
                  <p className="text-xs text-gray-400 font-mon">PDF de operadora/hotel — preenche o formulario automaticamente</p>
                </div>
              )}
            </div>

            {/* Package type toggle */}
            <div className="mt-3 flex items-center gap-4 px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pdf-package-type"
                  checked={pdfPacoteDuplo}
                  onChange={() => setPdfPacoteDuplo(true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-mon">
                  Pacote duplo <span className="text-xs text-gray-400">(2 adultos — divide valor por 2)</span>
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pdf-package-type"
                  checked={!pdfPacoteDuplo}
                  onChange={() => setPdfPacoteDuplo(false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-mon">
                  Unitario <span className="text-xs text-gray-400">(valor ja e por pessoa)</span>
                </span>
              </label>
            </div>

            {pdfResult && (
              <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 text-sm font-mon ${
                pdfResult.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}>
                {pdfResult.type === "success"
                  ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                <p>{pdfResult.message}</p>
              </div>
            )}
          </div>
        )}

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

          <div className="mb-6 border-t pt-6">
            <label className="flex items-center gap-2 text-primary-blue font-mon font-medium mb-2">
              Publicar no site
            </label>
            <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md bg-white mb-4">
              <input
                type="checkbox"
                id="SITE_PUBLISHED"
                className="h-4 w-4 rounded text-primary-blue focus:ring-primary-blue"
                checked={formData.SITE_PUBLISHED}
                onChange={() => handleChange("SITE_PUBLISHED", !formData.SITE_PUBLISHED)}
              />
              <label htmlFor="SITE_PUBLISHED" className="text-gray-800 font-mon">
                Exibir este pacote no site (home)
              </label>
            </div>

            {formData.SITE_PUBLISHED && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700 font-mon">
                      Seção (pode criar novas, ex.: religioso, nordeste) <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                      type="text"
                      list="site-section-suggestions"
                      value={formData.SITE_SECTION}
                      onChange={(e) => handleChange("SITE_SECTION", e.target.value)}
                      placeholder="nacionais, internacionais, cruzeiros, lua-de-mel, religioso..."
                      required
                    />
                    <datalist id="site-section-suggestions">
                      {siteSectionSuggestions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700 font-mon">Slug para URL (pacotes/destinos)</label>
                    <input
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                      type="text"
                      value={formData.SITE_SLUG}
                      onChange={(e) => handleChange("SITE_SLUG", e.target.value)}
                      placeholder="ex: cancun-all-inclusive"
                      required
                    />
                    <button
                      type="button"
                      className="text-xs text-primary-blue hover:underline font-mon"
                      onClick={() => handleChange("SITE_SLUG", slugify(formData.DESTINO || ""))}
                    >
                      Gerar automaticamente a partir do destino
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700 font-mon">Descrição curta</label>
                    <input
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                      type="text"
                      value={formData.SITE_DESCRIPTION}
                      onChange={(e) => handleChange("SITE_DESCRIPTION", e.target.value)}
                      placeholder="Resumo para o card no site"
                      required
                    />
                    <p className="text-xs text-gray-500 font-mon">A imagem será buscada automaticamente pelo destino.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700 font-mon">Saídas (separe por vírgula)</label>
                    <input
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                      type="text"
                      value={formData.SITE_DEPARTURES.join(", ")}
                      onChange={(e) =>
                        handleChange(
                          "SITE_DEPARTURES",
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                      placeholder="São Paulo, Campo Grande"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700 font-mon">Inclusões (separe por vírgula)</label>
                    <input
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                      type="text"
                      value={formData.SITE_INCLUSIONS.join(", ")}
                      onChange={(e) =>
                        handleChange(
                          "SITE_INCLUSIONS",
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                      placeholder="Aéreo, Hotel, Traslado, Seguro"
                    />
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
