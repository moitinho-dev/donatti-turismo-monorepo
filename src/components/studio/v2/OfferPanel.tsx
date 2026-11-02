"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { PARCELAS_OPTIONS, REGIMES, type Regime } from "@/lib/promoForm"
import { getPriceNumber } from "@/lib/utils"
import { Section, Spinner } from "../panels/ui"
import { offerOnly } from "./publishView"

type Promo = Record<string, unknown> & { id: string; DESTINO: string }

interface OfferPanelProps {
  promo: Promo
  /** Atualiza a promo na hora (os 4 formatos redesenham com os dados novos) */
  onChange: (next: Promo) => void
  onSavePromo: (promo: Record<string, unknown>) => Promise<Record<string, unknown>>
  /** Resposta do servidor para a versão `sent` */
  onSaved: (updated: Record<string, unknown>, sent: Promo) => void
  /** Demonstração: muda a arte mas não grava */
  readOnly?: boolean
}

const SAVE_DELAY = 800
const REQUIRED: [string, string][] = [
  ["DESTINO", "destino"],
  ["HOTEL", "hotel"],
  ["DATA_FORMATADA", "datas"],
  ["NUMERO_DE_NOITES", "noites"],
  ["VALOR", "valor"],
]

const brl = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v))

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "missing"; fields: string[] } | { kind: "error"; text: string }

/** Os dados da promo usados na arte; editar aqui salva na promo e atualiza os 4 formatos */
export function OfferPanel({ promo, onChange, onSavePromo, onSaved, readOnly }: OfferPanelProps) {
  const [valorText, setValorText] = useState(() => {
    const n = getPriceNumber(str(promo.VALOR))
    return n ? brl(n) : ""
  })
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const pending = useRef<Promo | null>(null)
  const timer = useRef<number | null>(null)
  // Um salvamento por vez; o que chegar no meio espera e só a versão mais nova é enviada
  const running = useRef(false)
  const queued = useRef<Promo | null>(null)

  const save = useCallback(
    async (first: Promo) => {
      pending.current = null
      if (running.current) {
        queued.current = first
        return
      }
      running.current = true
      let next: Promo | null = first
      try {
        while (next) {
          const current: Promo = next
          const missing = REQUIRED.filter(([k]) => !str(current[k]).trim()).map(([, label]) => label)
          if (missing.length) {
            setStatus({ kind: "missing", fields: missing })
          } else {
            setStatus({ kind: "saving" })
            try {
              // Nunca manda SITE_PUBLISHED: salvar a oferta não muda a promo no site (o Publicar é quem muda)
              const updated = await onSavePromo(offerOnly(current))
              onSaved(updated, current)
              setStatus({ kind: "saved" })
            } catch (err) {
              setStatus({ kind: "error", text: err instanceof Error ? err.message : "Não deu para salvar a promo" })
            }
          }
          next = queued.current
          queued.current = null
        }
      } finally {
        running.current = false
      }
    },
    [onSavePromo, onSaved],
  )

  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  }, [save])

  // Saiu do painel (ou fechou o Studio) com alteração na fila: salva já
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
      if (pending.current) void saveRef.current(pending.current)
    },
    [],
  )

  /**
   * "debounce": textos salvam 800 ms depois da última tecla.
   * "hold": preço só muda a arte; salva ao sair do campo ou com Enter (nada de "3,29" no meio da digitação).
   * "now": escolha fechada (parcelas, regime, saída) salva na hora.
   */
  const update = (patch: Record<string, unknown>, mode: "debounce" | "hold" | "now" = "debounce") => {
    const next = { ...promo, ...patch } as Promo
    onChange(next)
    if (readOnly) return
    pending.current = next
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
    if (mode === "now") void saveRef.current(next)
    else if (mode === "debounce") {
      timer.current = window.setTimeout(() => {
        timer.current = null
        if (pending.current) void saveRef.current(pending.current)
      }, SAVE_DELAY)
    }
  }

  /** Fecha a edição do preço: salva o que ficou pendente */
  const flush = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
    if (pending.current) void saveRef.current(pending.current)
  }

  const regime = (REGIMES.find((r) => promo[r.value])?.value || "") as Regime | ""

  return (
    <div className="space-y-5">
      <p className="text-[12px] leading-relaxed text-gray-500">O que mudar aqui aparece nos 4 formatos e fica salvo na promo.</p>

      <Section title="Oferta">
        <Field label="Destino">
          <input value={str(promo.DESTINO)} onChange={(e) => update({ DESTINO: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Hotel">
          <input value={str(promo.HOTEL)} onChange={(e) => update({ HOTEL: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Datas">
          <input
            value={str(promo.DATA_FORMATADA)}
            onChange={(e) => update({ DATA_FORMATADA: e.target.value })}
            placeholder="05/12 até 10/12 de 2026"
            className={inputCls}
          />
        </Field>
        <Field label="Noites">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={str(promo.NUMERO_DE_NOITES)}
            onChange={(e) => update({ NUMERO_DE_NOITES: e.target.value })}
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="Preço">
        <Field label="Valor por pessoa (R$)">
          <input
            value={valorText}
            inputMode="decimal"
            placeholder="3.290,00"
            onChange={(e) => {
              setValorText(e.target.value)
              const n = getPriceNumber(e.target.value)
              update({ VALOR: n ? n.toFixed(2) : "" }, "hold")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") flush()
            }}
            onBlur={() => {
              const n = getPriceNumber(valorText)
              if (n) setValorText(brl(n))
              flush()
            }}
            className={inputCls}
          />
        </Field>
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-gray-500">Parcelas</span>
          <div className="flex flex-wrap gap-1.5">
            {PARCELAS_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update({ PARCELAS: n }, "now")}
                aria-pressed={Number(promo.PARCELAS) === n}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-all ${Number(promo.PARCELAS) === n ? "bg-amber-500 text-white" : "border border-gray-200 bg-white text-gray-600 hover:border-amber-400"}`}
              >
                {n}x
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Pacote">
        <Field label="Regime">
          <select
            value={regime}
            onChange={(e) => update(Object.fromEntries(REGIMES.map((r) => [r.value, r.value === e.target.value])), "now")}
            className={inputCls}
          >
            <option value="">Não informado</option>
            {REGIMES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-gray-500">Saída</span>
          <div className="flex flex-wrap gap-3">
            {[
              ["CG", "Campo Grande"],
              ["SP", "São Paulo"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-[13px] text-gray-700">
                <input type="checkbox" checked={!!promo[key]} onChange={(e) => update({ [key]: e.target.checked }, "now")} className="h-4 w-4 accent-amber-500" />
                {label}
              </label>
            ))}
          </div>
        </div>
      </Section>

      <StatusLine status={status} readOnly={readOnly} />
    </div>
  )
}

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-400"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-semibold text-gray-500">
      {label}
      {children}
    </label>
  )
}

function StatusLine({ status, readOnly }: { status: Status; readOnly?: boolean }) {
  if (readOnly) return <p className="text-[11px] text-gray-400">Demonstração: os dados mudam a arte, mas não são salvos.</p>
  switch (status.kind) {
    case "saving":
      return (
        <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Spinner className="h-3 w-3" /> Salvando na promo…
        </p>
      )
    case "saved":
      return (
        <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Salvo na promo
        </p>
      )
    case "missing":
      return (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-700">
          <AlertCircle className="h-3.5 w-3.5" /> Preencha {status.fields.join(", ")} para salvar.
        </p>
      )
    case "error":
      return (
        <p className="flex items-center gap-1.5 text-[11px] text-red-600">
          <AlertCircle className="h-3.5 w-3.5" /> {status.text}
        </p>
      )
    default:
      return null
  }
}
