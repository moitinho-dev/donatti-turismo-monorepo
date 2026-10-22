"use client"

import { useState } from "react"
import { Clipboard, Expand, Eraser, ImagePlus, Scissors, Sparkles, Type } from "lucide-react"
import { FORMATS, type ArtFormat, type Layer } from "../types"
import { Btn, Section, Spinner } from "./ui"

interface Copy {
  headlines: string[]
  subheadline: string
  caption: string
  hashtags: string[]
  siteDescription: string
}

interface AiPanelProps {
  enabled: boolean
  promo: Record<string, unknown>
  format: ArtFormat
  photoUrl: string | null
  selected: Layer | null
  onSetPhoto: (url: string) => void
  onAddImage: (url: string) => void
  onUseText: (text: string) => void
  onCaption: (caption: string) => void
  onLibraryChanged: () => void
}

type Busy = "generate" | "extend" | "remove" | "edit" | "copy" | null

export function AiPanel({ enabled, promo, format, photoUrl, selected, onSetPhoto, onAddImage, onUseText, onCaption, onLibraryChanged }: AiPanelProps) {
  const destino = String(promo.DESTINO || "")
  const [prompt, setPrompt] = useState(`Foto realista de ${destino}, luz do fim de tarde, cores vivas, sem pessoas em primeiro plano`)
  const [editTarget, setEditTarget] = useState("")
  const [editPrompt, setEditPrompt] = useState("")
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState<string[]>([])
  const [copy, setCopy] = useState<Copy | null>(null)
  const [tone, setTone] = useState("")

  if (!enabled) {
    return (
      <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-[13px] text-violet-900">
        <p className="font-bold">IA ainda não configurada</p>
        <p>
          Para gerar imagens e textos, configure as credenciais da AWS Bedrock no servidor (variáveis <code>AWS_BEARER_TOKEN_BEDROCK</code> ou{" "}
          <code>AWS_ACCESS_KEY_ID</code>/<code>AWS_SECRET_ACCESS_KEY</code>).
        </p>
      </div>
    )
  }

  const imageCall = async (kind: Exclude<Busy, "copy" | null>, body: Record<string, unknown>) => {
    setBusy(kind)
    setError(null)
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, destino }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "A IA não conseguiu agora")
      onLibraryChanged()
      return (data.assets as { url: string }[]).map((a) => a.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na IA")
      return []
    } finally {
      setBusy(null)
    }
  }

  const selectedImage = selected?.type === "image" && selected.src ? selected.src : null

  const writeCopy = async () => {
    setBusy("copy")
    setError(null)
    try {
      const res = await fetch("/api/ai/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promo, tone: tone || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao gerar texto")
      setCopy(data)
      onCaption(`${data.caption}\n\n${(data.hashtags || []).map((h: string) => `#${h.replace(/^#/, "")}`).join(" ")}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar texto")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>}

      <Section title="Adaptar a foto">
        <div className="grid gap-2">
          <Btn
            variant="ai"
            disabled={!photoUrl || busy !== null}
            onClick={async () => {
              const [url] = await imageCall("extend", { action: "extend", image: photoUrl, format })
              if (url) onSetPhoto(url)
            }}
          >
            {busy === "extend" ? <Spinner /> : <Expand className="h-4 w-4" />}
            Estender a foto para {FORMATS[format].label}
          </Btn>
          <p className="text-[11px] text-gray-500">Completa as bordas da foto para caber no formato sem cortar o destino.</p>
        </div>
        <div className="space-y-2 rounded-xl border border-gray-200 p-3">
          <p className="text-[12px] font-semibold text-gray-700">Editar parte da foto</p>
          <input
            value={editTarget}
            onChange={(e) => setEditTarget(e.target.value)}
            placeholder="O que mudar? Ex.: o céu nublado, as pessoas na areia"
            className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[16px] sm:text-[13px] outline-none focus:border-violet-400"
          />
          <input
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="Trocar por… (vazio = remover)"
            className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[16px] sm:text-[13px] outline-none focus:border-violet-400"
          />
          <Btn
            variant="ai"
            className="w-full"
            disabled={!photoUrl || editTarget.trim().length < 2 || busy !== null}
            onClick={async () => {
              const [url] = await imageCall("edit", { action: "edit", image: photoUrl, target: editTarget, prompt: editPrompt || undefined })
              if (url) onSetPhoto(url)
            }}
          >
            {busy === "edit" ? <Spinner /> : <Eraser className="h-4 w-4" />}
            Aplicar na foto do destino
          </Btn>
        </div>
        <Btn
          disabled={!selectedImage || busy !== null}
          onClick={async () => {
            const [url] = await imageCall("remove", { action: "remove-background", image: selectedImage })
            if (url) onAddImage(url)
          }}
          title={selectedImage ? undefined : "Selecione uma imagem na arte"}
        >
          {busy === "remove" ? <Spinner /> : <Scissors className="h-4 w-4" />}
          Remover fundo da imagem selecionada
        </Btn>
      </Section>

      <Section title="Gerar imagem">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[16px] sm:text-[13px] outline-none focus:border-violet-400"
        />
        <Btn
          variant="ai"
          className="w-full"
          disabled={prompt.trim().length < 3 || busy !== null}
          onClick={async () => setGenerated(await imageCall("generate", { action: "generate", prompt, format, count: 2 }))}
        >
          {busy === "generate" ? <Spinner /> : <Sparkles className="h-4 w-4" />}
          Gerar 2 opções
        </Btn>
        <p className="text-[11px] leading-relaxed text-amber-800 bg-amber-50 rounded-lg px-2.5 py-2">
          Use imagens geradas para fundos e composições. Para mostrar o destino ou o hotel, prefira fotos reais: imagem inventada de um
          lugar real pode frustrar o cliente e configurar propaganda enganosa.
        </p>
        {generated.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {generated.map((url) => (
              <div key={url} className="space-y-1">
                <img src={url} alt="Imagem gerada" className="aspect-[3/4] w-full rounded-xl object-cover" />
                <div className="flex gap-1">
                  <Btn className="flex-1 !px-1 text-[11px]" onClick={() => onSetPhoto(url)}>
                    Usar
                  </Btn>
                  <Btn className="!px-2" onClick={() => onAddImage(url)} title="Adicionar como imagem extra">
                    <ImagePlus className="h-3.5 w-3.5" />
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Textos da arte e legenda">
        <input
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          placeholder="Pedido opcional: Ex.: foco em casais, tom de Black Friday"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[16px] sm:text-[13px] outline-none focus:border-violet-400"
        />
        <Btn variant="ai" className="w-full" disabled={busy !== null} onClick={() => void writeCopy()}>
          {busy === "copy" ? <Spinner /> : <Type className="h-4 w-4" />}
          Escrever títulos e legenda
        </Btn>
        {copy && (
          <div className="space-y-3">
            <p className="text-[11px] text-gray-500">
              Toque num título para {selected?.type === "text" ? "trocar o texto selecionado" : "adicionar à arte"}.
            </p>
            {[...copy.headlines, copy.subheadline].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => onUseText(h)}
                className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-[13px] font-semibold text-gray-800 hover:border-violet-400"
              >
                {h}
              </button>
            ))}
            <div className="rounded-xl bg-gray-50 p-3 text-[12px] whitespace-pre-line text-gray-700">
              {copy.caption}
              <p className="mt-2 text-violet-700">{copy.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}</p>
            </div>
            <Btn
              className="w-full"
              onClick={() => void navigator.clipboard?.writeText(`${copy.caption}\n\n${copy.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`)}
            >
              <Clipboard className="h-4 w-4" /> Copiar legenda
            </Btn>
            <p className="text-[11px] text-gray-400">A legenda já foi para a aba Publicar.</p>
          </div>
        )}
      </Section>
    </div>
  )
}
