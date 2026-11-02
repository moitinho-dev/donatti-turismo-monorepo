"use client"

import { useEffect, useRef, useState } from "react"
import { Copy, Download, Share2 } from "lucide-react"
import { downloadDataUrl } from "../render"
import type { Device } from "./publishView"

interface Props {
  device: Device
  /** Arte do canal em JPEG (data URL) */
  getImage: () => Promise<string>
  message: string
  filename: string
  onShared: () => void
  onError: (msg: string) => void
}

const toFile = async (dataUrl: string, filename: string) => {
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], filename, { type: blob.type || "image/jpeg" })
}

const IMAGE_ERROR = "Não deu para gerar a imagem: alguma foto da arte não permite exportação. Troque a foto e tente de novo."

/**
 * Canal e Status do WhatsApp não têm API: Android abre o compartilhar do sistema com imagem e mensagem;
 * iPhone (que perde o texto junto com imagens) faz em dois passos; computador baixa e copia.
 */
export function ShareWhatsApp({ device, getImage, message, filename, onShared, onError }: Props) {
  const [copied, setCopied] = useState(false)
  // A arte fica pronta antes do toque: o compartilhar do celular só abre logo depois do toque
  const ready = useRef<Promise<{ dataUrl: string; file: File }> | null>(null)

  useEffect(() => {
    const p = getImage().then(async (dataUrl) => ({ dataUrl, file: await toFile(dataUrl, filename) }))
    p.catch(() => undefined)
    ready.current = p
  }, [getImage, filename])

  const image = async () => {
    try {
      return await (ready.current ?? getImage().then(async (dataUrl) => ({ dataUrl, file: await toFile(dataUrl, filename) })))
    } catch {
      onError(IMAGE_ERROR)
      return null
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
      onShared()
    } catch {
      onError("Não deu para copiar a mensagem. Selecione e copie a legenda do WhatsApp.")
    }
  }

  const share = async (withText: boolean) => {
    const img = await image()
    if (!img) return
    const data: ShareData = withText ? { files: [img.file], text: message } : { files: [img.file] }
    if (!navigator.canShare?.(data)) {
      onError("Este aparelho não abre o compartilhar com imagens. Use Baixar e Copiar mensagem.")
      return
    }
    try {
      await navigator.share(data)
      onShared()
    } catch (err) {
      // Fechou o compartilhar sem escolher: não marca
      if (err instanceof DOMException && err.name === "AbortError") return
      onError("Não deu para abrir o compartilhar. Tente de novo.")
    }
  }

  const download = async () => {
    const img = await image()
    if (!img) return
    downloadDataUrl(img.dataUrl, filename)
    onShared()
  }

  const btn = "inline-flex min-w-[136px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[12.5px] font-bold transition-colors"
  const main = `${btn} bg-[#25D366] text-white hover:bg-[#1fb857]`
  const ghost = `${btn} border border-gray-200 bg-white text-gray-700 hover:border-gray-300`
  const copyLabel = copied ? "Mensagem copiada" : "Copiar mensagem"

  return (
    <div className="flex flex-wrap gap-2 border-t border-gray-100 px-3 py-2.5">
      {device === "android" && (
        <button type="button" className={main} onClick={() => void share(true)}>
          <Share2 className="h-4 w-4" /> Compartilhar
        </button>
      )}
      {device === "ios" && (
        <>
          <button type="button" className={ghost} onClick={() => void copy()}>
            <Copy className="h-4 w-4" /> {copyLabel}
          </button>
          <button type="button" className={main} onClick={() => void share(false)}>
            <Share2 className="h-4 w-4" /> Compartilhar imagens
          </button>
        </>
      )}
      {device === "desktop" && (
        <>
          <button type="button" className={ghost} onClick={() => void download()}>
            <Download className="h-4 w-4" /> Baixar imagens
          </button>
          <button type="button" className={main} onClick={() => void copy()}>
            <Copy className="h-4 w-4" /> {copyLabel}
          </button>
        </>
      )}
    </div>
  )
}
