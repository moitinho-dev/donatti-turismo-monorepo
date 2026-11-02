"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Copy, Download, Share2 } from "lucide-react"
import { downloadDataUrl } from "../render"
import { COPY_ERROR, IMAGE_ERROR, NO_SHARE_ERROR, SHARE_ERROR, type Device } from "./publishView"

interface Props {
  device: Device
  /** Arte do canal em JPEG (data URL) */
  getImage?: () => Promise<string>
  /** Várias artes (Publicar todas): vão juntas no compartilhar e baixam numeradas */
  getImages?: () => Promise<string[]>
  /** Vazia: só as imagens (Status do WhatsApp) */
  message: string
  filename: string
  onShared: () => void
  onError: (msg: string) => void
}

const toFile = async (dataUrl: string, filename: string) => {
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], filename, { type: blob.type || "image/jpeg" })
}

/** "arte.jpg" → "arte-2.jpg" quando há mais de uma */
const nameOf = (filename: string, i: number, total: number) => (total > 1 ? filename.replace(/(\.[a-z0-9]+)?$/i, (ext) => `-${i + 1}${ext}`) : filename)

type Prepared = { dataUrl: string; file: File }[]

/**
 * Canal e Status do WhatsApp não têm API: Android abre o compartilhar do sistema com imagem e mensagem;
 * iPhone (que perde o texto junto com imagens) faz em dois passos; computador baixa e copia.
 */
export function ShareWhatsApp({ device, getImage, getImages, message, filename, onShared, onError }: Props) {
  const [copied, setCopied] = useState(false)
  // A arte fica pronta antes do toque: o compartilhar do celular só abre logo depois do toque
  const ready = useRef<Promise<Prepared> | null>(null)
  const withText = !!message

  const prepare = useCallback(async (): Promise<Prepared> => {
    const urls = getImages ? await getImages() : [await getImage!()]
    return Promise.all(urls.map(async (dataUrl, i) => ({ dataUrl, file: await toFile(dataUrl, nameOf(filename, i, urls.length)) })))
  }, [getImage, getImages, filename])

  useEffect(() => {
    const p = prepare()
    p.catch(() => undefined)
    ready.current = p
  }, [prepare])

  const images = async () => {
    try {
      return await (ready.current ?? prepare())
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
      onError(COPY_ERROR)
    }
  }

  const share = async (text: boolean) => {
    const imgs = await images()
    if (!imgs) return
    const files = imgs.map((i) => i.file)
    const data: ShareData = text && withText ? { files, text: message } : { files }
    if (!navigator.canShare?.(data)) {
      onError(NO_SHARE_ERROR)
      return
    }
    try {
      await navigator.share(data)
      onShared()
    } catch (err) {
      // Fechou o compartilhar sem escolher: não marca
      if (err instanceof DOMException && err.name === "AbortError") return
      onError(SHARE_ERROR)
    }
  }

  const download = async () => {
    const imgs = await images()
    if (!imgs) return
    for (const [i, img] of imgs.entries()) {
      // O navegador ignora downloads seguidos sem um respiro
      if (i) await new Promise((r) => window.setTimeout(r, 250))
      downloadDataUrl(img.dataUrl, img.file.name)
    }
    onShared()
  }

  const btn = "inline-flex min-w-max flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[12.5px] font-bold transition-colors"
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
          {withText && (
            <button type="button" className={ghost} onClick={() => void copy()}>
              <Copy className="h-4 w-4" /> {copyLabel}
            </button>
          )}
          <button type="button" className={main} onClick={() => void share(false)}>
            <Share2 className="h-4 w-4" /> Compartilhar imagens
          </button>
        </>
      )}
      {device === "desktop" && (
        <>
          <button type="button" className={withText ? ghost : main} onClick={() => void download()}>
            <Download className="h-4 w-4" /> Baixar imagens
          </button>
          {withText && (
            <button type="button" className={main} onClick={() => void copy()}>
              <Copy className="h-4 w-4" /> {copyLabel}
            </button>
          )}
        </>
      )}
    </div>
  )
}
