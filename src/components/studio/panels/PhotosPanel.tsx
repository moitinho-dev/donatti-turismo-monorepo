"use client"

import { useCallback, useEffect, useState } from "react"
import { ImagePlus, Search, Upload } from "lucide-react"
import type { ArtFormat } from "../types"
import { Btn, Section, Segmented, Spinner } from "./ui"

interface UnsplashResult {
  id: string
  urls: { regular: string; small: string }
  user?: { name?: string }
}
interface Asset {
  id: string
  url: string
  source: string
  prompt?: string | null
}

interface PhotosPanelProps {
  destino: string
  format: ArtFormat
  photoUrl: string | null
  onSetPhoto: (url: string) => void
  onAddImage: (url: string) => void
  libraryVersion: number
}

export function PhotosPanel({ destino, format, photoUrl, onSetPhoto, onAddImage, libraryVersion }: PhotosPanelProps) {
  const [tab, setTab] = useState<"busca" | "biblioteca">("busca")
  const [query, setQuery] = useState(destino)
  const [results, setResults] = useState<UnsplashResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [assets, setAssets] = useState<Asset[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const orientation = format === "landscape" ? "landscape" : format === "square" ? "squarish" : "portrait"

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) return
      setSearching(true)
      setSearchError(null)
      try {
        const res = await fetch(`/api/image-search?query=${encodeURIComponent(q)}&limit=24&orientation=${orientation}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Busca indisponível")
        setResults(data.results || [])
        if (!data.results?.length) setSearchError("Nenhuma foto encontrada. Tente outro termo (em inglês costuma render mais).")
      } catch (err) {
        setResults([])
        setSearchError(err instanceof Error ? err.message : "Busca indisponível")
      } finally {
        setSearching(false)
      }
    },
    [orientation],
  )

  useEffect(() => {
    void search(query || destino)
  }, [orientation]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab !== "biblioteca") return
    let alive = true
    fetch("/api/assets")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => alive && setAssets(d))
      .catch(() => alive && setAssets([]))
    return () => {
      alive = false
    }
  }, [tab, libraryVersion])

  const upload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/assets", { method: "POST", body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro no upload")
      setAssets((prev) => [data, ...(prev || [])])
      setTab("biblioteca")
      onSetPhoto(data.url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro no upload")
    } finally {
      setUploading(false)
    }
  }

  const Thumb = ({ url, thumb, label }: { url: string; thumb: string; label?: string }) => (
    <div className={`group relative overflow-hidden rounded-xl border-2 ${photoUrl === url ? "border-amber-500" : "border-transparent"}`}>
      <button type="button" onClick={() => onSetPhoto(url)} className="block w-full" title="Usar como foto do destino">
        <img src={thumb} alt={label || "Foto"} loading="lazy" className="aspect-[3/4] w-full object-cover" />
      </button>
      <button
        type="button"
        onClick={() => onAddImage(url)}
        title="Adicionar como imagem extra"
        aria-label="Adicionar como imagem extra"
        className="absolute bottom-1.5 right-1.5 rounded-lg bg-white/90 p-1.5 text-gray-700 opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <ImagePlus className="h-3.5 w-3.5" />
      </button>
      {photoUrl === url && <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">Em uso</span>}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Segmented<"busca" | "biblioteca">
          value={tab}
          onChange={setTab}
          options={[
            { value: "busca", label: "Buscar" },
            { value: "biblioteca", label: "Biblioteca" },
          ]}
        />
        <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 hover:border-amber-400 ${uploading ? "opacity-50" : ""}`}>
          {uploading ? <Spinner /> : <Upload className="h-4 w-4" />}
          Enviar
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void upload(f)
              e.target.value = ""
            }}
          />
        </label>
      </div>

      {uploadError && <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-700">{uploadError}</p>}

      {tab === "busca" ? (
        <Section title="Fotos do destino">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void search(query)
            }}
            className="flex gap-2"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: Maragogi, praia, resort"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[16px] sm:text-[13px] outline-none focus:border-amber-400"
            />
            <Btn type="submit" variant="primary" title="Buscar">
              {searching ? <Spinner /> : <Search className="h-4 w-4" />}
            </Btn>
          </form>
          {searchError && <p className="text-[12px] text-gray-500">{searchError}</p>}
          <div className="grid grid-cols-2 gap-2">
            {results.map((r) => (
              <Thumb key={r.id} url={r.urls.regular} thumb={r.urls.small} label={r.user?.name ? `Foto de ${r.user.name}` : undefined} />
            ))}
          </div>
          {results.length > 0 && <p className="text-[10px] text-gray-400">Fotos do Unsplash. Toque para usar; o botão + adiciona como imagem extra.</p>}
        </Section>
      ) : (
        <Section title="Biblioteca da equipe">
          {assets === null ? (
            <Spinner />
          ) : assets.length === 0 ? (
            <p className="text-[12px] text-gray-500">Imagens enviadas e geradas pela IA aparecem aqui.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {assets.map((a) => (
                <Thumb key={a.id} url={a.url} thumb={a.url} label={a.prompt || undefined} />
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
