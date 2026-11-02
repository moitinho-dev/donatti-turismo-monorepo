"use client"

import { CHANNELS, type Channel } from "@/lib/channels"
import { FORMATS } from "../types"
import { Spinner } from "../panels/ui"

interface Props {
  channel: Channel
  /** Arte do canal (JPEG); null enquanto gera */
  image: string | null
  imageError: boolean
  /** Foto da promo (o site usa a foto, não a arte) */
  photo: string | null
  caption: string | null
  title: string
  compact?: boolean
}

const NETWORK: Record<Channel, string> = {
  site: "donattiturismo.com",
  google: "Google · Perfil da empresa",
  "ig-feed": "Instagram",
  "ig-story": "Instagram · stories",
  "fb-feed": "Facebook",
  "fb-story": "Facebook · stories",
  "wa-channel": "Canal do WhatsApp",
  "wa-status": "Status do WhatsApp",
}

function Avatar() {
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1D3153] text-[11px] font-black text-[#F79E08]">D</span>
}

/** Como o post fica no canal em foco */
export function PublishPreview({ channel, image, imageError, photo, caption, title, compact }: Props) {
  const meta = CHANNELS.find((c) => c.id === channel)!
  const format = meta.format
  const story = format === "story"
  const ratio = format ? `${FORMATS[format].width} / ${FORMATS[format].height}` : "16 / 10"
  const src = channel === "site" ? photo : image
  // Celular: prévia baixa para não empurrar os canais para longe
  const width = compact ? (story ? 104 : format === "landscape" ? 250 : format === "feed" ? 140 : 160) : story ? 250 : 300

  const media = (
    <div className="relative w-full overflow-hidden bg-gray-200" style={{ aspectRatio: ratio }}>
      {src ? (
        <img src={src} alt={`Prévia: ${meta.label}`} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-[12px] text-gray-500">
          {imageError || (channel === "site" && !photo) ? (
            channel === "site" ? "Promo sem foto" : "Não deu para gerar a prévia desta arte"
          ) : (
            <Spinner className="h-5 w-5" />
          )}
        </div>
      )}
      {channel === "site" && src && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-white">
          <p className="text-[13px] font-black leading-tight">{title}</p>
          <p className="text-[11px] opacity-80">Página da oferta</p>
        </div>
      )}
    </div>
  )

  return (
    <figure className="flex flex-col items-center" aria-label={`Prévia: ${meta.label}`}>
      <div style={{ width }} className={`overflow-hidden border border-gray-200 bg-white shadow-sm ${story ? "rounded-[22px]" : "rounded-2xl"}`}>
        {!story && (
          <div className="flex items-center gap-2 px-3 py-2">
            <Avatar />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[12px] font-bold text-gray-900">Donatti Turismo</p>
              <p className="truncate text-[10.5px] text-gray-500">{NETWORK[channel]}</p>
            </div>
          </div>
        )}
        {story ? (
          <div className="relative">
            {media}
            <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/50 to-transparent px-3 pb-6 pt-2.5">
              <Avatar />
              <p className="truncate text-[11px] font-bold text-white">{NETWORK[channel]}</p>
            </div>
          </div>
        ) : (
          media
        )}
        {!story && !compact && caption && (
          <p className="line-clamp-4 whitespace-pre-line px-3 py-2.5 text-[11.5px] leading-snug text-gray-700">{caption}</p>
        )}
      </div>
      <figcaption className="mt-2 whitespace-nowrap text-center text-[11px] text-gray-500">
        {meta.label}
        {format ? ` · ${FORMATS[format].label}` : ""}
      </figcaption>
    </figure>
  )
}
