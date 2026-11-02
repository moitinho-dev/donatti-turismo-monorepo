"use client"

import { useState, type ReactNode } from "react"
import { ImageDown, RotateCcw } from "lucide-react"
import type { FeedMode, WaMode } from "./bulkPlan"
import { groupsSummary } from "./bulkView"
import type { Device } from "./publishView"
import { ShareWhatsApp } from "./ShareWhatsApp"

/** Partes do Publicar todas: escolha do feed, legendas dos carrosséis e o WhatsApp */

const CAPTION_LIMIT = 2200
const textArea =
  "w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-gray-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-50"

export function Heading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
      {children}
    </h3>
  )
}

function Regenerate({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11.5px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40">
      <RotateCcw className="h-3 w-3" /> Gerar de novo com os dados das ofertas
    </button>
  )
}

/** Botões lado a lado com uma escolha (como "Publicar agora | Agendar") */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: T
  options: { id: T; text: string }[]
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          disabled={disabled}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-lg px-2 py-2 text-[12.5px] font-bold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${value === o.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          {o.text}
        </button>
      ))}
    </div>
  )
}

/** "Uma publicação por promo" ou um carrossel (no Facebook, álbum) de até 10 */
export function FeedSection({
  feed,
  onFeed,
  disabled,
  groups,
  instagram,
  facebook,
}: {
  feed: FeedMode
  onFeed: (f: FeedMode) => void
  disabled: boolean
  groups: string[][]
  instagram: boolean
  facebook: boolean
}) {
  const album = !instagram
  return (
    <section aria-labelledby="bulk-feed" className="mt-6">
      <Heading id="bulk-feed">No feed</Heading>
      <Segmented<FeedMode>
        label="Como sai no feed"
        value={feed}
        onChange={onFeed}
        disabled={disabled}
        options={[
          { id: "single", text: "Uma publicação por promo" },
          { id: "carousel", text: album ? "Álbum único" : "Carrossel único" },
        ]}
      />
      <p className="mt-2 text-[11.5px] text-gray-500" data-groups>
        {feed === "carousel"
          ? `${groupsSummary(groups, album)}.${instagram && facebook ? " No Facebook sai como álbum." : ""} Até 10 por vez, na ordem da seleção.`
          : "Cada promo sai num post separado."}
      </p>
    </section>
  )
}

/** Legenda: a de cada promo, ou uma por carrossel (editável) */
export function CaptionSection({
  carousel,
  album,
  groups,
  disabled,
  captionOf,
  onChange,
  onRegenerate,
}: {
  carousel: boolean
  album: boolean
  groups: string[][]
  disabled: boolean
  captionOf: (g: string[]) => string
  onChange: (g: string[], text: string) => void
  onRegenerate: (g: string[]) => void
}) {
  const many = groups.filter((g) => g.length > 1)
  const word = album ? "Álbum" : "Carrossel"
  return (
    <section aria-labelledby="bulk-legenda" className="mt-6">
      <Heading id="bulk-legenda">Legenda</Heading>
      {!carousel || !many.length ? (
        <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-[12.5px] text-gray-600">Cada promo sai com a legenda dela: a salva no Studio ou a gerada com os dados da oferta.</p>
      ) : (
        <div className="space-y-4">
          {many.map((g, i) => {
            const text = captionOf(g)
            return (
              <div key={g.join(",")}>
                <p className="mb-1.5 text-[12.5px] font-bold text-gray-800">
                  {word} {i + 1}/{many.length} · {g.length} promoções
                </p>
                <textarea
                  value={text}
                  disabled={disabled}
                  onChange={(e) => onChange(g, e.target.value)}
                  rows={8}
                  maxLength={CAPTION_LIMIT}
                  aria-label={`Legenda: ${word} ${i + 1}`}
                  className={textArea}
                />
                <div className="mt-1 flex items-center justify-between text-[11.5px] text-gray-400">
                  <Regenerate onClick={() => onRegenerate(g)} disabled={disabled} />
                  <span className={text.length > CAPTION_LIMIT * 0.95 ? "font-semibold text-amber-700" : ""}>
                    {text.length}/{CAPTION_LIMIT}
                  </span>
                </div>
              </div>
            )
          })}
          {groups.some((g) => g.length === 1) && <p className="text-[11.5px] text-gray-500">A última promo sai sozinha, com a legenda dela.</p>}
        </div>
      )}
    </section>
  )
}

type WaChannel = "wa-channel" | "wa-status"

/** Canal e Status do WhatsApp: compartilhados pelo aparelho (Android / iPhone / computador) */
export function WhatsAppSection({
  channel,
  status,
  mode,
  onMode,
  message,
  onMessage,
  onRegenerate,
  running,
  device,
  getSquares,
  getStories,
  filenameBase,
  lazy,
  channelCount,
  statusCount,
  onShared,
}: {
  channel: boolean
  status: boolean
  mode: WaMode
  onMode: (m: WaMode) => void
  message: string
  onMessage: (text: string) => void
  onRegenerate: () => void
  running: boolean
  device: Device
  getSquares: () => Promise<string[]>
  getStories: () => Promise<string[]>
  filenameBase: string
  /** Muitas promos: as imagens só são desenhadas depois do "Preparar imagens" */
  lazy: boolean
  channelCount: number
  statusCount: number
  onShared: (c: WaChannel) => void
}) {
  const [error, setError] = useState<Partial<Record<WaChannel, string>>>({})
  const [prepared, setPrepared] = useState<Partial<Record<WaChannel, true>>>({})
  // Antes de desenhar: um botão (o compartilhar do celular precisa da arte pronta antes do toque)
  const prepare = (c: WaChannel, n: number) => (
    <div className="border-t border-gray-100 px-3 py-2.5">
      <button
        type="button"
        onClick={() => setPrepared((p) => ({ ...p, [c]: true }))}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-[12.5px] font-bold text-gray-700 hover:border-gray-300"
      >
        <ImageDown className="h-4 w-4" /> Preparar as {n} imagens
      </button>
    </div>
  )
  // Uma imagem só ("1 imagem + mensagem") sai direto
  const ready = (c: WaChannel) => !lazy || !!prepared[c] || (c === "wa-channel" ? channelCount : statusCount) === 1
  const share = (c: WaChannel) => {
    setError((e) => ({ ...e, [c]: undefined }))
    onShared(c)
  }
  const errorLine = (c: WaChannel) => error[c] && <p className="px-3 pb-2.5 text-[12px] font-semibold text-red-600">{error[c]}</p>
  return (
    <section aria-labelledby="bulk-wa" className="mt-6 space-y-3">
      <Heading id="bulk-wa">WhatsApp</Heading>
      {channel && (
        <div className="rounded-2xl border border-gray-200 bg-white" data-share="wa-channel">
          <div className="space-y-2 px-3 pb-1 pt-3">
            <p className="text-[13px] font-bold text-gray-900">Canal do WhatsApp</p>
            <Segmented<WaMode>
              label="Como sai no Canal do WhatsApp"
              value={mode}
              onChange={onMode}
              disabled={running}
              options={[
                { id: "batch", text: "Mensagem + lote" },
                { id: "one", text: "1 imagem + mensagem" },
              ]}
            />
            <textarea value={message} disabled={running} onChange={(e) => onMessage(e.target.value)} rows={7} aria-label="Mensagem do Canal do WhatsApp" className={textArea} />
            <Regenerate onClick={onRegenerate} disabled={running} />
          </div>
          {!running && !ready("wa-channel") && prepare("wa-channel", channelCount)}
          {!running && ready("wa-channel") && (
            <ShareWhatsApp
              device={device}
              getImages={getSquares}
              message={message}
              filename={`${filenameBase}-whatsapp-canal.jpg`}
              onShared={() => share("wa-channel")}
              onError={(msg) => setError((e) => ({ ...e, "wa-channel": msg }))}
            />
          )}
          {errorLine("wa-channel")}
        </div>
      )}
      {status && (
        <div className="rounded-2xl border border-gray-200 bg-white" data-share="wa-status">
          <div className="px-3 pt-3">
            <p className="text-[13px] font-bold text-gray-900">Status do WhatsApp</p>
            <p className="text-[11.5px] text-gray-500">Imagens story de todas, sem texto.</p>
          </div>
          {!running && !ready("wa-status") && prepare("wa-status", statusCount)}
          {!running && ready("wa-status") && (
            <ShareWhatsApp
              device={device}
              getImages={getStories}
              message=""
              filename="ofertas-whatsapp-status.jpg"
              onShared={() => share("wa-status")}
              onError={(msg) => setError((e) => ({ ...e, "wa-status": msg }))}
            />
          )}
          {errorLine("wa-status")}
        </div>
      )}
    </section>
  )
}
