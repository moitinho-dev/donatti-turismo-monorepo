"use client"

import { useState } from "react"
import { AlertCircle, Check, ImageOff, Layers, RotateCw, Send, X } from "lucide-react"
import { TEMPLATE_FAMILIES } from "../templates"
import { FORMATS, FORMAT_ORDER, type ArtFormat } from "../types"
import { Spinner } from "../panels/ui"

export interface GridItem {
  id: string
  destino: string
  hotel: string
  /** undefined: desenhando; null: sem prévia (foto que não permite exportar) */
  thumb: string | null | undefined
  /** Algum formato ajustado à mão */
  edited: boolean
  published: boolean
  /** Não deu para ler a arte salva: fica fora do "aplicar em todas" até tentar de novo */
  failed: boolean
}

interface MultiGridProps {
  items: GridItem[]
  format: ArtFormat
  onFormat: (f: ArtFormat) => void
  onOpen: (index: number) => void
  onClose: () => void
  /** Todas as artes carregadas: dá para aplicar o template */
  ready: boolean
  /** Aplicando o template: posição atual e total */
  applying: { i: number; n: number } | null
  /** Promos em que o template não foi salvo na última aplicação */
  applyErrors: { destino: string; error: string }[]
  onApply: (familyId: string) => void
  onDismissErrors: () => void
  onRetry: (id: string) => void
  /** Todas as artes lidas e nada sendo aplicado */
  canPublishAll: boolean
  onPublishAll: () => void
}

/** Colunas da grade conforme o formato (celular sempre 2) */
const COLS: Record<ArtFormat, string> = {
  story: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
  feed: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  square: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  landscape: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}

/** Grade de várias promos (como a prévia do "criar em massa"): formato, template para todas e uma arte por promo */
export function MultiGrid({ items, format, onFormat, onOpen, onClose, ready, applying, applyErrors, onApply, onDismissErrors, onRetry, canPublishAll, onPublishAll }: MultiGridProps) {
  const [family, setFamily] = useState("")
  const busy = !!applying
  const { width, height } = FORMATS[format]

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#EEF0F3] text-gray-900">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-2 sm:px-4">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Fechar"
          className="flex items-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          <span className="hidden md:inline">Fechar</span>
        </button>
        <h1 className="flex min-w-0 items-center gap-2 border-l border-gray-200 pl-3 text-[14px] font-black">
          <Layers className="hidden h-4 w-4 shrink-0 text-amber-500 md:block" />
          <span className="truncate">{items.length} promoções</span>
        </h1>
        <button
          type="button"
          onClick={onPublishAll}
          disabled={!canPublishAll}
          title={canPublishAll ? undefined : "Carregando as artes…"}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        >
          <Send className="h-4 w-4" />
          Publicar todas
        </button>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 bg-white px-3 py-2.5 md:px-4">
        <div role="radiogroup" aria-label="Formato" className="flex w-full rounded-xl bg-gray-100 p-1 md:w-auto">
          {FORMAT_ORDER.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={f === format}
              onClick={() => onFormat(f)}
              title={`${FORMATS[f].hint} · ${FORMATS[f].width}×${FORMATS[f].height}`}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[13px] font-bold transition-colors md:flex-none md:px-3 ${f === format ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              {FORMATS[f].label}
            </button>
          ))}
        </div>

        <form
          className="flex w-full min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 md:w-auto md:flex-1 md:flex-nowrap"
          onSubmit={(e) => {
            e.preventDefault()
            if (family) onApply(family)
          }}
        >
          <label htmlFor="multi-family" className="w-full text-[12px] font-semibold text-gray-600 md:w-auto md:text-[13px]">
            Aplicar template em todas
          </label>
          <select
            id="multi-family"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            disabled={busy}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-800 md:w-48 md:flex-none"
          >
            <option value="">Modelo Donatti…</option>
            {TEMPLATE_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!family || !ready || busy}
            title={ready ? undefined : "Carregando as artes…"}
            className="shrink-0 rounded-xl bg-gray-900 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Aplicar
          </button>
        </form>
      </div>

      {(applying || applyErrors.length > 0) && (
        <div className="shrink-0 border-b border-gray-200 bg-white px-3 py-2 sm:px-4" role="status">
          {applying ? (
            <p className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
              <Spinner className="h-3.5 w-3.5 text-amber-500" />
              Aplicando {applying.i}/{applying.n}…
            </p>
          ) : (
            <div className="flex items-start gap-2 text-[13px] text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">Não deu para aplicar o template em {applyErrors.length === 1 ? "1 promoção" : `${applyErrors.length} promoções`}:</p>
                <ul className="mt-0.5 space-y-0.5">
                  {applyErrors.map((e, i) => (
                    <li key={i} className="truncate">
                      {e.destino}: {e.error}
                    </li>
                  ))}
                </ul>
              </div>
              <button type="button" onClick={onDismissErrors} aria-label="Fechar aviso" className="rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <main className="min-h-0 flex-1 overflow-y-auto">
        <ul className={`mx-auto grid max-w-7xl gap-3 p-3 md:gap-5 md:p-6 ${COLS[format]}`} aria-label="Promoções">
          {items.map((item, i) => (
            <li key={item.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onOpen(i)}
                disabled={busy}
                aria-label={`Editar ${item.destino}`}
                className="group block w-full text-left disabled:cursor-wait"
              >
                <span
                  className="relative block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all group-hover:shadow-lg group-hover:ring-2 group-hover:ring-amber-400 group-focus-visible:ring-2 group-focus-visible:ring-amber-500"
                  style={{ aspectRatio: `${width} / ${height}` }}
                >
                  {item.failed ? (
                    <span className="flex h-full flex-col items-center justify-center gap-1 bg-red-50 px-2 text-center text-[11px] font-semibold text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      Não deu para carregar a arte
                    </span>
                  ) : item.thumb ? (
                    <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                  ) : item.thumb === null ? (
                    <span className="flex h-full flex-col items-center justify-center gap-1 bg-gray-100 text-[11px] font-semibold text-gray-400">
                      <ImageOff className="h-5 w-5" />
                      Sem prévia
                    </span>
                  ) : (
                    <span className="block h-full animate-pulse bg-gray-200" aria-label="Desenhando a arte" />
                  )}
                </span>
                <span className="mt-2 flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0 rounded-md bg-gray-900 px-1.5 py-0.5 text-[11px] font-black leading-none tabular-nums text-white">{i + 1}</span>
                  <span className="truncate text-[13px] font-black text-gray-900">{item.destino}</span>
                  {item.published && (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white" title="Publicada">
                      <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                      <span className="sr-only">Publicada</span>
                    </span>
                  )}
                </span>
                <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[12px] text-gray-500">{item.hotel || "\u00a0"}</span>
                  {item.edited && <span className="ml-auto shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">Ajustada</span>}
                </span>
              </button>
              {item.failed && (
                <button
                  type="button"
                  onClick={() => onRetry(item.id)}
                  disabled={busy}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[12px] font-bold text-gray-700 hover:border-amber-400 disabled:opacity-50"
                >
                  <RotateCw className="h-3 w-3" />
                  Tentar de novo
                </button>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
