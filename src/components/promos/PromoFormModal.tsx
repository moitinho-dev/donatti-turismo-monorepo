"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileUp,
  Globe,
  LayoutGrid,
  Loader2,
  MapPin,
  Moon,
  Plane,
  Plus,
  Save,
  Sparkles,
  Tag,
  UtensilsCrossed,
  Wallet,
  X,
  Zap,
} from "lucide-react"
import { usePromo } from "@/hooks/usePromo"
import { useAiStatus } from "@/hooks/useAiStatus"
import { DESTINATIONS, suggestSiteSection } from "@/lib/destinations"
import {
  INCLUSION_SUGGESTIONS,
  PARCELAS_OPTIONS,
  REGIMES,
  SITE_SECTIONS,
  applyExtracted,
  emptyPromoForm,
  fromApiPromo,
  fromExtensionParams,
  nightsBetween,
  toApiPayload,
  validatePromoForm,
  type ExtractedFields,
  type FormErrors,
  type PromoFormState,
} from "@/lib/promoForm"

interface PromoFormModalProps {
  promo?: Record<string, unknown> | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /** Query string vinda da extensão do Chrome (?autofill=...) */
  autofill?: string | null
}

const DRAFT_KEY = "donatti:promo-draft"
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const inputClass =
  "w-full bg-gray-50 border rounded-[14px] px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-[16px] sm:text-[14px]"
const chipClass = (active: boolean) =>
  `px-3.5 py-2 rounded-full text-[13px] font-semibold border transition-all ${
    active ? "bg-amber-500 text-white border-amber-500 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
  }`

function readDraft(): PromoFormState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? { ...emptyPromoForm(), ...JSON.parse(raw) } : null
  } catch {
    return null
  }
}

export function PromoFormModal({ promo, isOpen, onClose, onSuccess, autofill }: PromoFormModalProps) {
  const isEditing = !!promo?.id
  const [form, setForm] = useState<PromoFormState>(emptyPromoForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [aiFilled, setAiFilled] = useState<Set<keyof PromoFormState>>(new Set())
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const { savePromo, isLoading: isSaving } = usePromo()
  const aiStatus = useAiStatus()
  const firstErrorRef = useRef<HTMLDivElement | null>(null)

  // Importação (IA ou PDF legado)
  const [pasteText, setPasteText] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [extraction, setExtraction] = useState<{ fields: ExtractedFields; divisor: number } | null>(null)
  const [isWritingCopy, setIsWritingCopy] = useState(false)

  // Monta o estado ao abrir
  useEffect(() => {
    if (!isOpen) return
    setErrors({})
    setNotice(null)
    setAiFilled(new Set())
    setExtraction(null)
    setPasteText("")
    setDraftRestored(false)
    if (promo?.id) {
      setForm(fromApiPromo(promo))
    } else if (autofill) {
      setForm(fromExtensionParams(autofill))
      setNotice({ type: "info", text: "Dados trazidos da extensão do Chrome. Confira antes de salvar." })
    } else {
      const draft = readDraft()
      setForm(draft || emptyPromoForm())
      setDraftRestored(!!draft)
    }
  }, [isOpen, promo, autofill])

  // Rascunho automático de promo nova
  useEffect(() => {
    if (!isOpen || isEditing) return
    const id = window.setTimeout(() => {
      try {
        const hasContent = form.destino || form.hotel || form.valor
        if (hasContent) localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      } catch {
        // armazenamento indisponível (aba anônima etc.): segue sem rascunho
      }
    }, 600)
    return () => window.clearTimeout(id)
  }, [form, isOpen, isEditing])

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {}
  }

  const update = useCallback(<K extends keyof PromoFormState>(key: K, value: PromoFormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Noites acompanham as datas enquanto o agente não editar à mão
      if ((key === "ida" || key === "volta") && (prev.noites === "" || prev.noites === nightsBetween(prev.ida, prev.volta))) {
        next.noites = nightsBetween(next.ida, next.volta)
      }
      if (key === "destino" && (!prev.secao || prev.secao === suggestSiteSection(prev.destino))) {
        next.secao = suggestSiteSection(String(value)) || prev.secao
      }
      return next
    })
    setAiFilled((prev) => {
      if (!prev.has(key)) return prev
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    setErrors((prev) => (prev[key as keyof FormErrors] ? { ...prev, [key]: undefined } : prev))
  }, [])

  // ---------------------------------------------------------------------------
  // Importar com IA (PDF, print, texto) — ou PDF pelo extrator antigo se a IA não estiver configurada
  // ---------------------------------------------------------------------------
  const runExtraction = async (payload: { file?: File; text?: string }) => {
    setIsExtracting(true)
    setNotice(null)
    try {
      if (aiStatus?.ai) {
        const body = new FormData()
        if (payload.file) body.append("file", payload.file)
        if (payload.text) body.append("text", payload.text)
        const res = await fetch("/api/ai/extract", { method: "POST", body })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Não foi possível ler o material")
        const fields = data.fields as ExtractedFields
        const divisor = fields.VALOR_E_POR_PESSOA ? 1 : 2
        const { form: next, filled } = applyExtracted(form, fields, divisor)
        setForm(next)
        setAiFilled(new Set(filled))
        setExtraction({ fields, divisor })
        setNotice({
          type: filled.length ? "success" : "error",
          text: filled.length
            ? `${filled.length} campos preenchidos pela IA (marcados com ✦). Confira antes de salvar.`
            : "A IA não encontrou dados de promoção neste material.",
        })
      } else {
        if (!payload.file || payload.file.type !== "application/pdf") {
          throw new Error("Sem IA configurada, só é possível importar PDF")
        }
        const body = new FormData()
        body.append("file", payload.file)
        const res = await fetch("/api/promos/extract-pdf", { method: "POST", body })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erro ao ler o PDF")
        const f = data.fields || {}
        const year = f.ANO || String(new Date().getFullYear())
        const legacy: ExtractedFields = {
          DESTINO: f.DESTINO ?? null,
          HOTEL: f.HOTEL ?? null,
          DATA_IDA: f.DE && f.MES_DE ? `${year}-${String(f.MES_DE).padStart(2, "0")}-${String(f.DE).padStart(2, "0")}` : null,
          DATA_VOLTA: f.ATE && f.MES_ATE ? `${year}-${String(f.MES_ATE).padStart(2, "0")}-${String(f.ATE).padStart(2, "0")}` : null,
          NUMERO_DE_NOITES: f.NUMERO_DE_NOITES ? parseInt(f.NUMERO_DE_NOITES, 10) : null,
          VALOR_TOTAL: f.VALOR ? parseFloat(f.VALOR) : null,
          VALOR_E_POR_PESSOA: null,
          VALOR_ORIGINAL: null,
          PARCELAS: f.PARCELAS ? parseInt(f.PARCELAS, 10) : null,
          REGIME: f.regime ?? null,
          AEREO: f.AEREO ?? null,
          SAIDA_CAMPO_GRANDE: f.CG ?? null,
          SAIDA_SAO_PAULO: f.SP ?? null,
          OUTRAS_SAIDAS: [],
          INCLUSOES: [],
          OBSERVACOES: null,
        }
        const { form: next, filled } = applyExtracted(form, legacy, 2)
        setForm(next)
        setAiFilled(new Set(filled))
        setExtraction({ fields: legacy, divisor: 2 })
        setNotice({ type: "success", text: `${filled.length} campos preenchidos a partir do PDF. Confira antes de salvar.` })
      }
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Erro ao importar" })
    } finally {
      setIsExtracting(false)
    }
  }

  // Valor do material é por pessoa ou do casal? Recalcula a partir do total lido
  const setDivisor = (divisor: number) => {
    if (!extraction) return
    const total = extraction.fields.VALOR_TOTAL
    const original = extraction.fields.VALOR_ORIGINAL
    setExtraction({ ...extraction, divisor })
    setForm((prev) => ({
      ...prev,
      valor: total ? Math.round((total / divisor) * 100) / 100 : prev.valor,
      valorOriginal: original ? Math.round((original / divisor) * 100) / 100 : prev.valorOriginal,
    }))
  }

  // Colar um print direto no formulário (Ctrl+V) também importa
  const onPaste = (e: React.ClipboardEvent) => {
    if (isEditing || !aiStatus?.ai) return
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"))
    if (file) {
      e.preventDefault()
      void runExtraction({ file })
    }
  }

  const writeDescription = async () => {
    setIsWritingCopy(true)
    try {
      const res = await fetch("/api/ai/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promo: toApiPayload(form) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao gerar texto")
      update("descricao", String(data.siteDescription || "").slice(0, 200))
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Erro ao gerar texto" })
    } finally {
      setIsWritingCopy(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Salvar
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const found = validatePromoForm(form)
    setErrors(found)
    if (Object.values(found).some(Boolean)) {
      setNotice({ type: "error", text: "Faltam alguns dados. Os campos estão marcados em vermelho." })
      window.setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50)
      return
    }
    try {
      await savePromo(toApiPayload(form))
      if (!isEditing) clearDraft()
      setNotice({ type: "success", text: isEditing ? "Promoção atualizada!" : "Promoção criada!" })
      window.setTimeout(onSuccess, 700)
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error && err.message ? err.message : "Erro ao salvar. Tente novamente." })
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleSubmit()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const installment = form.valor ? form.valor / (form.parcelas || 1) : 0
  const discount = form.valor && form.valorOriginal && form.valorOriginal > form.valor ? Math.round((1 - form.valor / form.valorOriginal) * 100) : 0
  const firstErrorKey = useMemo(
    () => (["destino", "hotel", "ida", "volta", "noites", "valor", "valorOriginal", "regime"] as const).find((k) => errors[k]),
    [errors],
  )

  if (!isOpen) return null

  const field = (key: keyof FormErrors | "none", label: string, icon: React.ReactNode, children: React.ReactNode, hint?: string) => (
    <div className="space-y-1.5" ref={key === firstErrorKey ? firstErrorRef : undefined}>
      <label className="flex items-center gap-2 text-gray-900 font-bold text-[12px] uppercase tracking-wider">
        {icon}
        {label}
        {key !== "none" && aiFilled.has(key as keyof PromoFormState) && (
          <span title="Preenchido pela IA" className="normal-case tracking-normal text-[11px] font-semibold text-violet-600">
            ✦ IA
          </span>
        )}
      </label>
      {children}
      {key !== "none" && errors[key] ? (
        <p className="text-[12px] font-medium text-red-600">{errors[key]}</p>
      ) : hint ? (
        <p className="text-[11px] text-gray-400">{hint}</p>
      ) : null}
    </div>
  )
  const errorRing = (key: keyof FormErrors) => (errors[key] ? "border-red-400 bg-red-50/40" : "border-gray-200 hover:border-amber-400/50")

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-start justify-center overflow-y-auto p-0 sm:p-4 sm:pt-8 sm:pb-8"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-form-title"
          onPaste={onPaste}
          className="bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-gray-200 w-full max-w-4xl relative overflow-hidden"
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-gray-100">
            <h2 id="promo-form-title" className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                {isEditing ? <Save size={16} /> : <Plus size={16} />}
              </span>
              {isEditing ? "Editar promoção" : "Nova promoção"}
            </h2>
            <button onClick={onClose} aria-label="Fechar" className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-8 max-h-[calc(100dvh-170px)] sm:max-h-[75vh] overflow-y-auto overscroll-contain">
            {/* Importar */}
            {!isEditing && (
              <section className="mb-6 rounded-[20px] border border-violet-100 bg-gradient-to-br from-violet-50 to-amber-50 p-4 sm:p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-[15px]">
                      {aiStatus?.ai ? "Preencher com IA" : "Importar PDF da operadora"}
                    </p>
                    <p className="text-[12px] text-gray-500">
                      {aiStatus?.ai
                        ? "Arraste o PDF ou o print da operadora, cole a imagem (Ctrl+V) ou o texto do WhatsApp."
                        : "Arraste o PDF da operadora para preencher os campos."}
                    </p>
                  </div>
                </div>

                <div
                  data-tour="pdf-upload-zone"
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragOver(false)
                    const f = e.dataTransfer.files[0]
                    if (f) void runExtraction({ file: f })
                  }}
                  className={`relative border-2 border-dashed rounded-[16px] p-4 text-center transition-colors bg-white/70 ${
                    isDragOver ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-violet-300"
                  }`}
                >
                  <input
                    type="file"
                    accept={aiStatus?.ai ? ".pdf,image/png,image/jpeg,image/webp" : ".pdf"}
                    aria-label="Selecionar arquivo da operadora"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void runExtraction({ file: f })
                      e.target.value = ""
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isExtracting}
                  />
                  {isExtracting ? (
                    <div className="flex flex-col items-center gap-2 py-1">
                      <Loader2 className="h-6 w-6 text-violet-600 animate-spin" />
                      <p className="text-sm text-gray-600">Lendo o material...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 py-1">
                      <FileUp className="h-6 w-6 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Arraste aqui ou <span className="text-violet-700 font-semibold">escolha o arquivo</span>
                      </p>
                      <p className="text-[11px] text-gray-400">{aiStatus?.ai ? "PDF, PNG, JPG ou WEBP" : "PDF"}</p>
                    </div>
                  )}
                </div>

                {aiStatus?.ai && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      rows={2}
                      placeholder="…ou cole aqui o texto da promoção (WhatsApp, e-mail, site da operadora)"
                      className="flex-1 rounded-[14px] border border-gray-200 bg-white px-3 py-2.5 text-[16px] sm:text-[13px] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                    />
                    <button
                      type="button"
                      disabled={!pasteText.trim() || isExtracting}
                      onClick={() => void runExtraction({ text: pasteText })}
                      className="sm:self-stretch rounded-[14px] bg-violet-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-violet-700 disabled:opacity-40"
                    >
                      Ler texto
                    </button>
                  </div>
                )}

                {extraction?.fields.VALOR_TOTAL ? (
                  <div data-tour="pdf-valor-toggle" className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-gray-600">
                    <span>
                      Valor no material: <strong>{brl(extraction.fields.VALOR_TOTAL)}</strong> é
                    </span>
                    <button type="button" onClick={() => setDivisor(1)} className={chipClass(extraction.divisor === 1)}>
                      por pessoa
                    </button>
                    <button type="button" onClick={() => setDivisor(2)} className={chipClass(extraction.divisor === 2)}>
                      do casal (÷2)
                    </button>
                  </div>
                ) : null}
                {extraction?.fields.OBSERVACOES && (
                  <p className="mt-3 rounded-[12px] bg-amber-100/70 px-3 py-2 text-[12px] text-amber-900">
                    <strong>Conferir:</strong> {extraction.fields.OBSERVACOES}
                  </p>
                )}
              </section>
            )}

            {draftRestored && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-[14px] bg-blue-50 px-4 py-2.5 text-[13px] text-blue-800">
                <span>Recuperamos o rascunho que você não terminou.</span>
                <button
                  type="button"
                  onClick={() => {
                    clearDraft()
                    setForm(emptyPromoForm())
                    setDraftRestored(false)
                  }}
                  className="font-semibold underline"
                >
                  Começar do zero
                </button>
              </div>
            )}

            <AnimatePresence>
              {notice && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role={notice.type === "error" ? "alert" : "status"}
                  className={`mb-4 p-3 rounded-[14px] flex items-start gap-2 text-sm ${
                    notice.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : notice.type === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                  }`}
                >
                  {notice.type === "error" ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
                  {notice.text}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Destino e hotel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {field(
                  "destino",
                  "Destino",
                  <MapPin className="w-4 h-4 text-amber-500" />,
                  <>
                    <input
                      data-tour="form-destino"
                      list="destinos-conhecidos"
                      className={`${inputClass} ${errorRing("destino")}`}
                      value={form.destino}
                      onChange={(e) => update("destino", e.target.value)}
                      placeholder="Ex.: Maceió, Cancún, Gramado"
                      autoComplete="off"
                    />
                    <datalist id="destinos-conhecidos">
                      {DESTINATIONS.map((d) => (
                        <option key={d.name} value={d.name} />
                      ))}
                    </datalist>
                  </>,
                )}
                {field(
                  "hotel",
                  "Hotel",
                  <Building2 className="w-4 h-4 text-amber-500" />,
                  <input
                    className={`${inputClass} ${errorRing("hotel")}`}
                    value={form.hotel}
                    onChange={(e) => update("hotel", e.target.value)}
                    placeholder="Ex.: Ritz Lagoa da Anta"
                  />,
                )}
              </div>

              {/* Datas e noites */}
              <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_120px] gap-4 sm:gap-5">
                {field(
                  "ida",
                  "Ida",
                  <CalendarDays className="w-4 h-4 text-amber-500" />,
                  <input type="date" className={`${inputClass} ${errorRing("ida")}`} value={form.ida} onChange={(e) => update("ida", e.target.value)} />,
                )}
                {field(
                  "volta",
                  "Volta",
                  <CalendarDays className="w-4 h-4 text-amber-500" />,
                  <input
                    type="date"
                    min={form.ida || undefined}
                    className={`${inputClass} ${errorRing("volta")}`}
                    value={form.volta}
                    onChange={(e) => update("volta", e.target.value)}
                  />,
                )}
                <div className="col-span-2 md:col-span-1">
                  {field(
                    "noites",
                    "Noites",
                    <Moon className="w-4 h-4 text-amber-500" />,
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      className={`${inputClass} ${errorRing("noites")} font-bold`}
                      value={form.noites}
                      onChange={(e) => update("noites", e.target.value)}
                    />,
                    "Calculado pelas datas",
                  )}
                </div>
              </div>

              {/* Preço */}
              <div className="rounded-[20px] border border-gray-100 bg-gray-50/60 p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {field(
                    "valor",
                    "Valor por pessoa",
                    <Wallet className="w-4 h-4 text-amber-500" />,
                    <MoneyInput value={form.valor} onChange={(v) => update("valor", v)} invalid={!!errors.valor} />,
                  )}
                  {field(
                    "valorOriginal",
                    "Preço \"de\" (opcional)",
                    <Tag className="w-4 h-4 text-amber-500" />,
                    <MoneyInput value={form.valorOriginal} onChange={(v) => update("valorOriginal", v)} invalid={!!errors.valorOriginal} />,
                    "Aparece riscado no site, com o % de desconto",
                  )}
                  {field(
                    "none",
                    "Parcelas",
                    <Wallet className="w-4 h-4 text-amber-500" />,
                    <div className="flex flex-wrap gap-1.5">
                      {PARCELAS_OPTIONS.map((n) => (
                        <button key={n} type="button" onClick={() => update("parcelas", n)} className={chipClass(form.parcelas === n)}>
                          {n}x
                        </button>
                      ))}
                    </div>,
                  )}
                </div>
                {form.valor ? (
                  <p className="text-[13px] text-gray-600">
                    No site: <strong className="text-amber-600">{form.parcelas}x de {brl(installment)}</strong> ou {brl(form.valor)} por pessoa
                    {discount > 0 && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">-{discount}%</span>}
                  </p>
                ) : null}
              </div>

              {/* Regime */}
              {field(
                "regime",
                "Regime de alimentação",
                <UtensilsCrossed className="w-4 h-4 text-amber-500" />,
                <div className="flex flex-wrap gap-2">
                  {REGIMES.map((r) => (
                    <button key={r.value} type="button" onClick={() => update("regime", r.value)} className={chipClass(form.regime === r.value)}>
                      {r.label}
                    </button>
                  ))}
                </div>,
              )}

              {/* Aéreo e saídas */}
              <div className="space-y-3">
                <ToggleRow checked={form.aereo} onChange={(v) => update("aereo", v)} icon={<Plane size={18} />} title="Inclui passagem aérea" />
                {form.aereo && (
                  <div className="pl-1 space-y-2">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-gray-500">Saídas</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => update("cg", !form.cg)} className={chipClass(form.cg)}>
                        Campo Grande (CGR)
                      </button>
                      <button type="button" onClick={() => update("sp", !form.sp)} className={chipClass(form.sp)}>
                        São Paulo (GRU)
                      </button>
                      {form.outrasSaidas.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => update("outrasSaidas", form.outrasSaidas.filter((x) => x !== c))}
                          className={`${chipClass(true)} inline-flex items-center gap-1`}
                        >
                          {c} <X className="w-3 h-3" />
                        </button>
                      ))}
                      <AddChip placeholder="Outra cidade" onAdd={(c) => update("outrasSaidas", Array.from(new Set([...form.outrasSaidas, c])))} />
                    </div>
                  </div>
                )}
              </div>

              {/* Inclusões */}
              {field(
                "none",
                "O que está incluso",
                <CheckCircle2 className="w-4 h-4 text-amber-500" />,
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...INCLUSION_SUGGESTIONS, ...form.inclusoes])).map((item) => {
                    const active = form.inclusoes.includes(item)
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => update("inclusoes", active ? form.inclusoes.filter((x) => x !== item) : [...form.inclusoes, item])}
                        className={chipClass(active)}
                      >
                        {item}
                      </button>
                    )
                  })}
                  <AddChip placeholder="Outro item" onAdd={(c) => update("inclusoes", Array.from(new Set([...form.inclusoes, c])))} />
                </div>,
                "Aparece na página do pacote",
              )}

              <div className="h-px bg-gray-100" />

              {/* Site */}
              <div className="space-y-4">
                <ToggleRow
                  checked={form.publicar}
                  onChange={(v) => update("publicar", v)}
                  icon={<Globe size={18} />}
                  title="Publicar no site"
                  sub="Sem foto escolhida, o site usa uma foto do próprio destino"
                />
                <ToggleRow
                  checked={form.blackFriday}
                  onChange={(v) => update("blackFriday", v)}
                  icon={<Zap size={18} />}
                  title="Oferta Black Friday"
                  sub="Marca a promo como parte da campanha"
                />
                {field(
                  "none",
                  "Seção no site",
                  <LayoutGrid className="w-4 h-4 text-amber-500" />,
                  <div className="flex flex-wrap gap-2">
                    {SITE_SECTIONS.map((s) => (
                      <button key={s.value} type="button" onClick={() => update("secao", s.value)} className={chipClass(form.secao === s.value)}>
                        {s.label}
                      </button>
                    ))}
                  </div>,
                  "Sugerida pelo destino. Toque para trocar.",
                )}
                {field(
                  "none",
                  "Descrição curta do card",
                  <Sparkles className="w-4 h-4 text-amber-500" />,
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className={`${inputClass} border-gray-200`}
                      value={form.descricao}
                      maxLength={200}
                      onChange={(e) => update("descricao", e.target.value)}
                      placeholder="Ex.: Resort pé na areia com piscinas naturais"
                    />
                    {aiStatus?.ai && (
                      <button
                        type="button"
                        onClick={() => void writeDescription()}
                        disabled={isWritingCopy || !form.destino}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-[14px] border border-violet-200 bg-violet-50 px-4 py-3 text-[13px] font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-40"
                      >
                        {isWritingCopy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Escrever com IA
                      </button>
                    )}
                  </div>,
                )}
              </div>
            </form>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between gap-3 px-5 sm:px-8 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="hidden sm:block text-[11px] text-gray-400">Ctrl + Enter salva · Esc fecha</p>
            <div className="flex flex-1 sm:flex-none gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-[14px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all text-[14px]"
              >
                Cancelar
              </button>
              <button
                data-tour="form-submit"
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSaving}
                className="flex-[2] sm:flex-none flex items-center justify-center gap-2 whitespace-nowrap px-5 sm:px-8 py-3 rounded-[14px] font-bold bg-amber-500 text-white hover:bg-amber-400 shadow-[0_4px_14px_rgba(247,158,10,0.3)] transition-all disabled:opacity-50 text-[14px]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isSaving ? "Salvando..." : isEditing ? "Salvar" : "Criar promoção"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/** Campo de dinheiro: digita só números, os dois últimos são centavos */
function MoneyInput({ value, onChange, invalid }: { value: number | null; onChange: (v: number | null) => void; invalid?: boolean }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[13px]">R$</span>
      <input
        type="text"
        inputMode="numeric"
        className={`${inputClass} pl-10 font-bold ${invalid ? "border-red-400 bg-red-50/40" : "border-gray-200 hover:border-amber-400/50"}`}
        value={value ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
        placeholder="0,00"
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "")
          onChange(digits ? parseInt(digits, 10) / 100 : null)
        }}
      />
    </div>
  )
}

function ToggleRow({
  checked,
  onChange,
  icon,
  title,
  sub,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  icon: React.ReactNode
  title: string
  sub?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-4 p-3.5 border rounded-[18px] text-left transition-all ${
        checked ? "bg-amber-50 border-amber-400" : "bg-white border-gray-200 hover:border-amber-300"
      }`}
    >
      <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${checked ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"}`}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-gray-900 font-bold text-[14px]">{title}</span>
        {sub && <span className="block text-gray-400 text-[11px] mt-0.5">{sub}</span>}
      </span>
      <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-amber-500" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  )
}

/** Chip que vira campo de texto para adicionar um item novo */
function AddChip({ placeholder, onAdd }: { placeholder: string; onAdd: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")
  const commit = () => {
    const v = value.trim()
    if (v) onAdd(v)
    setValue("")
    setEditing(false)
  }
  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="px-3.5 py-2 rounded-full text-[13px] font-semibold border border-dashed border-gray-300 text-gray-500 hover:border-amber-400">
        + {placeholder}
      </button>
    )
  }
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          commit()
        }
        if (e.key === "Escape") {
          e.stopPropagation()
          setEditing(false)
        }
      }}
      placeholder={placeholder}
      className="px-3.5 py-1.5 rounded-full text-[16px] sm:text-[13px] border border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 w-44"
    />
  )
}
