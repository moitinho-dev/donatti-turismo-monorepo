"use client"

import { RotateCcw } from "lucide-react"
import { CHANNELS, type Channel } from "@/lib/channels"
import { Spinner } from "../panels/ui"
import type { BulkJob } from "./bulkPlan"
import type { JobRun, ProgressRow } from "./bulkView"
import { ChannelIcon } from "./ChannelList"
import { friendlyError } from "./publishView"

const SHORT: Record<Channel, string> = {
  site: "Site",
  google: "Google",
  "ig-feed": "Feed",
  "ig-story": "Stories",
  "fb-feed": "Feed",
  "fb-story": "Stories",
  "wa-channel": "Canal",
  "wa-status": "Status",
}
const labelOf = (c: Channel) => CHANNELS.find((x) => x.id === c)!.label

function CellState({ run }: { run: JobRun | undefined }) {
  if (!run || run.phase === "skipped") return <span className="text-gray-300">—</span>
  if (run.phase === "busy") return <Spinner className="h-4 w-4 text-amber-500" />
  if (run.phase === "error") return <span className="font-bold text-red-600">Erro</span>
  if (run.status === "simulated") return <span className="font-bold text-violet-700">Simulado</span>
  if (run.status === "scheduled") return <span className="font-bold text-sky-700">Agendado</span>
  return <span className="font-black text-emerald-600">✓</span>
}

const cellTitle = (run: JobRun | undefined, channel: Channel) => {
  if (!run) return "Ainda não enviado"
  if (run.phase === "skipped") return "Não enviado"
  if (run.phase === "busy") return "Enviando…"
  if (run.phase === "error") return friendlyError(run.error, labelOf(channel))
  return run.status === "simulated" ? "Simulado" : run.status === "scheduled" ? "Agendado" : "Publicado"
}

export interface ProgressError {
  job: BulkJob
  /** "Maceió" ou "Carrossel 1/2 · 10 promoções" */
  title: string
  error: string
}

interface Props {
  rows: ProgressRow[]
  /** Nome de cada promo (destino) */
  names: Record<string, string>
  errors: ProgressError[]
  /** Uma rodada ou um "Tentar de novo" em andamento */
  busy: boolean
  onRetry: (job: BulkJob) => void
}

/** Andamento do Publicar todas: promo × canal, e os erros com "Tentar de novo" por envio */
export function BulkProgress({ rows, names, errors, busy, onRetry }: Props) {
  const cols = rows[0]?.cells.map((c) => c.channel) || []
  if (!cols.length) return null
  return (
    <div>
      {errors.length > 0 && (
        <ul className="mb-3 space-y-1.5" aria-label="Envios com erro">
          {errors.map((e) => (
            <li key={e.job.key} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12.5px]" data-job={e.job.key}>
              <span className="min-w-0 flex-1 text-red-700">
                <span className="font-bold">
                  {e.title} · {labelOf(e.job.channel)}:
                </span>{" "}
                {friendlyError(e.error, labelOf(e.job.channel))}
              </span>
              {!busy && (
                <button
                  type="button"
                  onClick={() => onRetry(e.job)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2 py-1 font-bold text-gray-700 ring-1 ring-red-200 hover:bg-red-100"
                >
                  <RotateCcw className="h-3 w-3" /> Tentar de novo
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-gray-200 bg-white">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th scope="col" className="sticky left-0 z-[1] min-w-[132px] bg-gray-50 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Promoção
              </th>
              {cols.map((c) => (
                <th key={c} scope="col" className="min-w-[64px] px-1.5 py-2 font-semibold text-gray-600" title={labelOf(c)}>
                  <span className="flex flex-col items-center gap-1">
                    <ChannelIcon channel={c} small />
                    <span className="text-[10.5px] leading-none">{SHORT[c]}</span>
                    <span className="sr-only">{labelOf(c)}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.promoId} className="[&>*]:border-b [&>*]:border-gray-100 [&:last-child>*]:border-0" data-promo={row.promoId}>
                <th scope="row" className="sticky left-0 z-[1] max-w-[180px] bg-white px-3 py-2 text-left font-semibold text-gray-800">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="shrink-0 rounded bg-gray-900 px-1 py-0.5 text-[10px] font-black leading-none tabular-nums text-white">{i + 1}</span>
                    <span className="truncate">{names[row.promoId]}</span>
                  </span>
                </th>
                {row.cells.map((cell) => (
                  <td
                    key={cell.channel}
                    className="px-1.5 py-2 text-center align-middle"
                    data-channel={cell.channel}
                    data-state={cell.run ? (cell.run.phase === "done" ? cell.run.status : cell.run.phase) : cell.job ? "idle" : "none"}
                    title={cell.job ? cellTitle(cell.run, cell.channel) : "Esta promo não vai neste canal"}
                  >
                    <span className="flex flex-col items-center gap-0.5">
                      {cell.job ? <CellState run={cell.run} /> : <span className="text-gray-300">—</span>}
                      {cell.label && <span className="whitespace-nowrap text-[10px] leading-none text-gray-400">{cell.label}</span>}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
