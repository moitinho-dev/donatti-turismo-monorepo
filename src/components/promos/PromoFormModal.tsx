"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { usePromo } from "@/hooks/usePromo"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin, Building2, CalendarDays, CalendarRange,
  DollarSign, CreditCard, Moon, UtensilsCrossed,
  Plane, Globe, Trash2, Plus, ChevronDown, X,
  Loader2, FileUp, CheckCircle2, AlertCircle,
} from "lucide-react"

interface PromoFormModalProps {
  promo?: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm hover:border-amber-400/50 text-[14px]"
const labelClass = "flex items-center gap-2 text-gray-900 font-bold text-[12px] uppercase tracking-wider"
const selectClass = "w-full appearance-none bg-gray-50 border border-gray-200 rounded-[14px] pl-4 pr-10 py-3.5 text-gray-900 font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer shadow-sm hover:border-amber-400/50 text-[14px]"

export function PromoFormModal({ promo, isOpen, onClose, onSuccess }: PromoFormModalProps) {
  const [formData, setFormData] = useState({
    id: "", DESTINO: "", HOTEL: "", DE: "", ATE: "", MES_DE: "", MES_ATE: "", ANO: "",
    VALOR: "", PARCELAS: "10", COM_CAFE: false, SEM_CAFE: false, MEIA_PENSAO: false,
    PENSAO_COMPLETA: false, ALL_INCLUSIVE: false, NUMERO_DE_NOITES: "", SP: false, CG: false,
    AEREO: false, DATA_FORMATADA: "", SITE_PUBLISHED: false, SITE_SECTION: "", SITE_SLUG: "",
    SITE_IMAGE: "", SITE_DESCRIPTION: "", SITE_INCLUSIONS: [] as string[], SITE_DEPARTURES: [] as string[],
  })
  const [formattedAmount, setFormattedAmount] = useState("")
  const [regimeAlimentacao, setRegimeAlimentacao] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [deDate, setDeDate] = useState("")
  const [ateDate, setAteDate] = useState("")
  const [isExtractingPdf, setIsExtractingPdf] = useState(false)
  const [pdfResult, setPdfResult] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const { savePromo, isLoading } = usePromo()

  const slugify = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")

  useEffect(() => {
    if (promo) {
      setFormData({
        id: promo.id || "", DESTINO: promo.DESTINO || "", HOTEL: promo.HOTEL || "",
        DE: "", ATE: "", MES_DE: "", MES_ATE: "", ANO: "",
        VALOR: promo.VALOR || "", PARCELAS: promo.PARCELAS || "10",
        COM_CAFE: promo.COM_CAFE || false, SEM_CAFE: promo.SEM_CAFE || false,
        MEIA_PENSAO: promo.MEIA_PENSAO || false, PENSAO_COMPLETA: promo.PENSAO_COMPLETA || false,
        ALL_INCLUSIVE: promo.ALL_INCLUSIVE || false, NUMERO_DE_NOITES: promo.NUMERO_DE_NOITES || "",
        SP: promo.SP || false, CG: promo.CG || false, AEREO: promo.AEREO || false,
        DATA_FORMATADA: promo.DATA_FORMATADA || "", SITE_PUBLISHED: promo.SITE_PUBLISHED || false,
        SITE_SECTION: promo.SITE_SECTION || "", SITE_SLUG: promo.SITE_SLUG || "",
        SITE_IMAGE: promo.SITE_IMAGE || "", SITE_DESCRIPTION: promo.SITE_DESCRIPTION || "",
        SITE_INCLUSIONS: promo.SITE_INCLUSIONS || [], SITE_DEPARTURES: promo.SITE_DEPARTURES || [],
      })
      if (promo.VALOR) {
        const n = parseFloat(promo.VALOR)
        if (!isNaN(n)) setFormattedAmount(n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
      }
      if (promo.ALL_INCLUSIVE) setRegimeAlimentacao("ALL_INCLUSIVE")
      else if (promo.PENSAO_COMPLETA) setRegimeAlimentacao("PENSAO_COMPLETA")
      else if (promo.MEIA_PENSAO) setRegimeAlimentacao("MEIA_PENSAO")
      else if (promo.COM_CAFE) setRegimeAlimentacao("COM_CAFE")
      else if (promo.SEM_CAFE) setRegimeAlimentacao("SEM_CAFE")
    } else {
      resetForm()
    }
  }, [promo, isOpen])

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "DESTINO") {
      const autoSlug = slugify(String(value || ""))
      setFormData((prev) => (!prev.SITE_SLUG || prev.SITE_SLUG === slugify(prev.DESTINO || "")) ? { ...prev, SITE_SLUG: autoSlug } : prev)
    }
  }

  const handleChangeRegime = (v: string) => {
    setRegimeAlimentacao(v)
    setFormData((prev) => ({
      ...prev, COM_CAFE: v === "COM_CAFE", SEM_CAFE: v === "SEM_CAFE",
      MEIA_PENSAO: v === "MEIA_PENSAO", PENSAO_COMPLETA: v === "PENSAO_COMPLETA", ALL_INCLUSIVE: v === "ALL_INCLUSIVE",
    }))
  }

  const handleDeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value; setDeDate(d)
    if (d) {
      const [y, m, day] = d.split("-")
      setFormData((prev) => {
        const u = { ...prev, DE: day, MES_DE: m, ANO: y }
        if (u.DE && u.ATE && u.MES_DE && u.MES_ATE && u.ANO) u.DATA_FORMATADA = `${u.DE}/${u.MES_DE} até ${u.ATE}/${u.MES_ATE} de ${u.ANO}`
        return u
      })
    }
  }

  const handleAteDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value; setAteDate(d)
    if (d) {
      const [y, m, day] = d.split("-")
      setFormData((prev) => {
        const u = { ...prev, ATE: day, MES_ATE: m, ANO: y }
        if (u.DE && u.ATE && u.MES_DE && u.MES_ATE && u.ANO) u.DATA_FORMATADA = `${u.DE}/${u.MES_DE} até ${u.ATE}/${u.MES_ATE} de ${u.ANO}`
        return u
      })
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, "")
    const num = parseFloat(cleaned) / 100
    setFormattedAmount(isNaN(num) ? "R$ 0,00" : num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
    setFormData((prev) => ({ ...prev, VALOR: isNaN(num) ? "0.00" : num.toFixed(2) }))
  }

  const getInstallment = () => {
    const v = parseFloat(formData.VALOR); const p = parseInt(formData.PARCELAS) || 15
    return isNaN(v) || v === 0 ? "R$ 0,00" : (v / p).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null); setFormSuccess(null)
    const missing = ["DESTINO", "HOTEL", "DATA_FORMATADA", "VALOR", "NUMERO_DE_NOITES"].filter((f) => !(formData as any)[f])
    if (missing.length) { setFormError(`Campos obrigatorios: ${missing.join(", ")}`); return }
    if (!regimeAlimentacao) { setFormError("Selecione um regime de alimentacao"); return }
    try {
      await savePromo(formData)
      setFormSuccess(formData.id ? "Promocao atualizada!" : "Promocao criada!")
      if (!formData.id) resetForm()
      setTimeout(onSuccess, 1200)
    } catch { setFormError("Erro ao salvar. Tente novamente.") }
  }

  const resetForm = () => {
    setFormData({ id: "", DESTINO: "", HOTEL: "", DE: "", ATE: "", MES_DE: "", MES_ATE: "", ANO: "", VALOR: "", PARCELAS: "10", COM_CAFE: false, SEM_CAFE: false, MEIA_PENSAO: false, PENSAO_COMPLETA: false, ALL_INCLUSIVE: false, NUMERO_DE_NOITES: "", SP: false, CG: false, AEREO: false, DATA_FORMATADA: "", SITE_PUBLISHED: false, SITE_SECTION: "", SITE_SLUG: "", SITE_IMAGE: "", SITE_DESCRIPTION: "", SITE_INCLUSIONS: [], SITE_DEPARTURES: [] })
    setFormattedAmount(""); setRegimeAlimentacao(""); setDeDate(""); setAteDate(""); setFormError(null); setFormSuccess(null); setPdfResult(null)
  }

  const handlePdfUpload = async (file: File) => {
    if (file.type !== "application/pdf") { setPdfResult({ type: "error", message: "Apenas PDF" }); return }
    setIsExtractingPdf(true); setPdfResult(null)
    try {
      const body = new FormData(); body.append("file", file)
      const res = await fetch("/api/promos/extract-pdf", { method: "POST", body })
      const data = await res.json()
      if (!res.ok) { setPdfResult({ type: "error", message: data.error || "Erro" }); return }
      const f = data.fields || {}; let cnt = 0
      if (f.DESTINO) { handleChange("DESTINO", f.DESTINO); cnt++ }
      if (f.HOTEL) { handleChange("HOTEL", f.HOTEL); cnt++ }
      if (f.NUMERO_DE_NOITES) { handleChange("NUMERO_DE_NOITES", String(f.NUMERO_DE_NOITES)); cnt++ }
      if (f.PARCELAS) { handleChange("PARCELAS", String(f.PARCELAS)); cnt++ }
      if (f.VALOR) { const n = parseFloat(String(f.VALOR)); if (!isNaN(n)) { handleChange("VALOR", n.toFixed(2)); setFormattedAmount(n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })); cnt++ } }
      if (f.DE && f.MES_DE && f.ANO) { setDeDate(`${f.ANO}-${String(f.MES_DE).padStart(2,"0")}-${String(f.DE).padStart(2,"0")}`); handleChange("DE", String(f.DE).padStart(2,"0")); handleChange("MES_DE", String(f.MES_DE).padStart(2,"0")); handleChange("ANO", String(f.ANO)); cnt++ }
      if (f.ATE && f.MES_ATE) { const y = String(f.ANO || new Date().getFullYear()); setAteDate(`${y}-${String(f.MES_ATE).padStart(2,"0")}-${String(f.ATE).padStart(2,"0")}`); handleChange("ATE", String(f.ATE).padStart(2,"0")); handleChange("MES_ATE", String(f.MES_ATE).padStart(2,"0")); cnt++ }
      if (f.DE && f.ATE && f.MES_DE && f.MES_ATE && f.ANO) handleChange("DATA_FORMATADA", `${String(f.DE).padStart(2,"0")}/${String(f.MES_DE).padStart(2,"0")} até ${String(f.ATE).padStart(2,"0")}/${String(f.MES_ATE).padStart(2,"0")} de ${f.ANO}`)
      if (f.regime) { handleChangeRegime(String(f.regime)); cnt++ }
      if (f.AEREO === true) { handleChange("AEREO", true); cnt++ }
      if (f.SP === true) { handleChange("SP", true); cnt++ }
      if (f.CG === true) { handleChange("CG", true); cnt++ }
      setPdfResult({ type: "success", message: `${cnt} campos preenchidos` })
    } catch (err) { setPdfResult({ type: "error", message: err instanceof Error ? err.message : "Erro" }) }
    finally { setIsExtractingPdf(false) }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-white rounded-[28px] shadow-2xl border border-gray-200 w-full max-w-4xl relative overflow-hidden"
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                <Plus size={16} />
              </span>
              {promo ? "Editar Promocao" : "Nova Promocao"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
            {/* PDF Upload */}
            {!promo && (
              <div className="mb-6">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handlePdfUpload(f) }}
                  className={`relative border-2 border-dashed rounded-[18px] p-5 text-center transition-colors ${isDragOver ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-gray-300 bg-gray-50"}`}
                >
                  <input type="file" accept=".pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); e.target.value = "" }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isExtractingPdf} />
                  {isExtractingPdf ? (
                    <div className="flex flex-col items-center gap-2"><Loader2 className="h-6 w-6 text-amber-500 animate-spin" /><p className="text-sm text-gray-500">Extraindo dados...</p></div>
                  ) : (
                    <div className="flex flex-col items-center gap-1"><FileUp className="h-6 w-6 text-gray-400" /><p className="text-sm text-gray-500">Arraste um PDF ou <span className="text-amber-600 font-medium">clique para selecionar</span></p></div>
                  )}
                </div>
                {pdfResult && (
                  <div className={`mt-2 p-2.5 rounded-xl flex items-center gap-2 text-sm ${pdfResult.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {pdfResult.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {pdfResult.message}
                  </div>
                )}
              </div>
            )}

            {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[14px] text-red-700 text-sm">{formError}</div>}
            {formSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-[14px] text-green-700 text-sm">{formSuccess}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destino & Hotel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className={labelClass}><MapPin className="w-4 h-4 text-amber-500" />Destino <span className="text-red-500">*</span></label>
                  <input className={inputClass} type="text" value={formData.DESTINO} onChange={(e) => handleChange("DESTINO", e.target.value)} placeholder="Ex: Rio de Janeiro" required />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}><Building2 className="w-4 h-4 text-amber-500" />Hotel <span className="text-red-500">*</span></label>
                  <input className={inputClass} type="text" value={formData.HOTEL} onChange={(e) => handleChange("HOTEL", e.target.value)} placeholder="Ex: Grand Hotel" required />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className={labelClass}><CalendarDays className="w-4 h-4 text-amber-500" />Data de Ida <span className="text-red-500">*</span></label>
                  <input className={inputClass} type="date" value={deDate} onChange={handleDeDate} required />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}><CalendarRange className="w-4 h-4 text-amber-500" />Data de Volta <span className="text-red-500">*</span></label>
                  <input className={inputClass} type="date" value={ateDate} onChange={handleAteDate} required />
                </div>
              </div>

              {/* Valor, Parcelas, Noites */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className={labelClass}><DollarSign className="w-4 h-4 text-amber-500" />Valor <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[13px]">R$</span>
                    <input className={`${inputClass} pl-10 font-bold`} type="text" inputMode="numeric" value={formattedAmount} onChange={handleAmountChange} placeholder="0,00" required />
                  </div>
                  <p className="text-[11px] text-gray-400">{formData.PARCELAS}x de {getInstallment()}</p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}><CreditCard className="w-4 h-4 text-amber-500" />Parcelas <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select className={selectClass} value={formData.PARCELAS} onChange={(e) => handleChange("PARCELAS", e.target.value)} required>
                      <option value="10">10x</option><option value="12">12x</option><option value="15">15x</option><option value="18">18x</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}><Moon className="w-4 h-4 text-amber-500" />Noites <span className="text-red-500">*</span></label>
                  <input className={`${inputClass} font-bold`} type="number" min="1" value={formData.NUMERO_DE_NOITES} onChange={(e) => handleChange("NUMERO_DE_NOITES", e.target.value)} placeholder="5" required />
                </div>
              </div>

              {/* Regime */}
              <div className="space-y-1.5 md:w-2/3 lg:w-1/2">
                <label className={labelClass}><UtensilsCrossed className="w-4 h-4 text-amber-500" />Regime <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select className={selectClass} value={regimeAlimentacao} onChange={(e) => handleChangeRegime(e.target.value)} required>
                    <option value="">Selecione...</option>
                    <option value="COM_CAFE">Com Cafe</option><option value="SEM_CAFE">Sem Cafe</option>
                    <option value="ALL_INCLUSIVE">All Inclusive</option><option value="MEIA_PENSAO">Meia Pensao</option>
                    <option value="PENSAO_COMPLETA">Pensao Completa</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Toggle switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ToggleCard checked={formData.AEREO} onChange={(v) => handleChange("AEREO", v)} icon={<Plane size={20} />} title="Passagem Aerea" sub="Incluir voos neste pacote" />
                <ToggleCard checked={formData.SITE_PUBLISHED} onChange={(v) => handleChange("SITE_PUBLISHED", v)} icon={<Globe size={20} />} title="Publicar no Site" sub="Exibir pacote na home" />
              </div>

              {/* Airport selection when aereo is checked */}
              {formData.AEREO && (
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 border rounded-[14px] cursor-pointer transition-all ${formData.CG ? "bg-amber-50 border-amber-300" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="checkbox" checked={formData.CG} onChange={() => handleChange("CG", !formData.CG)} className="sr-only" />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${formData.CG ? "bg-amber-500 border-amber-500" : "border-gray-300"}`}>
                      {formData.CG && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">Campo Grande (CGR)</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 border rounded-[14px] cursor-pointer transition-all ${formData.SP ? "bg-amber-50 border-amber-300" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="checkbox" checked={formData.SP} onChange={() => handleChange("SP", !formData.SP)} className="sr-only" />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${formData.SP ? "bg-amber-500 border-amber-500" : "border-gray-300"}`}>
                      {formData.SP && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">Sao Paulo (GRU)</span>
                  </label>
                </div>
              )}
            </form>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/50">
            <button type="button" onClick={() => { resetForm(); onClose() }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-[14px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all text-[14px]">
              <Trash2 className="w-4 h-4" /> Cancelar
            </button>
            <button type="submit" onClick={handleSubmit} disabled={isLoading}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-[14px] font-bold bg-amber-500 text-white hover:bg-amber-400 shadow-[0_4px_14px_rgba(247,158,10,0.3)] hover:shadow-[0_6px_20px_rgba(247,158,10,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 text-[14px]">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Plus className="w-4 h-4" />{promo ? "Atualizar" : "Criar Promocao"}</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ToggleCard({ checked, onChange, icon, title, sub }: { checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <label className={`flex items-center gap-4 p-4 border rounded-[18px] cursor-pointer transition-all duration-300 ${checked ? "bg-amber-50 border-amber-400 shadow-sm" : "bg-white border-gray-200 hover:border-amber-300"}`}>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"}`}>{icon}</div>
      <div className="flex-1">
        <span className="block text-gray-900 font-bold text-[14px]">{title}</span>
        <span className="block text-gray-400 text-[11px] mt-0.5">{sub}</span>
      </div>
      <div className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${checked ? "bg-amber-500" : "bg-gray-300"}`} onClick={() => onChange(!checked)}>
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </label>
  )
}
