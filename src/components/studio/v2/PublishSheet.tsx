"use client"

import { Send, X } from "lucide-react"
import type { useMeta } from "@/hooks/useMeta"
import type { ArtFormat } from "../types"
import type { ArtSet, Captions } from "../artSet"

/** O que o painel Publicar recebe do Studio (o painel de verdade entra numa próxima etapa) */
export interface PublishSlotProps {
  set: ArtSet
  promo: Record<string, unknown> & { id: string; DESTINO: string }
  getDataUrl: (format: ArtFormat, mime?: "image/png" | "image/jpeg") => Promise<string>
  setCaptions: (c: Captions) => void
  meta: ReturnType<typeof useMeta>
  isAdmin: boolean
}

/** Painel lateral do Publicar (por enquanto só o lugar dele) */
export function PublishSheet({ onClose }: PublishSlotProps & { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-label="Publicar" className="flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
          <h2 className="flex items-center gap-2 text-[15px] font-black">
            <Send className="h-4 w-4 text-amber-500" />
            Publicar
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-[15px] font-bold text-gray-900">Em breve</p>
          <p className="max-w-[280px] text-[13px] text-gray-500">Daqui você vai publicar a arte no Instagram, Facebook, WhatsApp, Google e no site, tudo de uma vez.</p>
        </div>
      </aside>
    </div>
  )
}
