"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { renderDoc } from "../render"
import { TEMPLATE_FAMILIES, legacyLayoutToDoc, withPhoto, type LegacyLayout } from "../templates"
import type { ArtFormat, StudioDoc } from "../types"
import { Section, Spinner } from "./ui"

interface TeamTemplate {
  id: string
  name: string
  thumbnailUrl: string | null
  createdBy?: { name: string | null }
}

interface TemplatesPanelProps {
  format: ArtFormat
  vars: Record<string, string>
  photoUrl: string | null
  activeFamily: string | null
  onApplyFamily: (familyId: string) => void
  onApplyDoc: (doc: StudioDoc) => void
  refreshKey: number
  hasLegacy: boolean
}

const thumbCache = new Map<string, string>()

export function TemplatesPanel({ format, vars, photoUrl, activeFamily, onApplyFamily, onApplyDoc, refreshKey, hasLegacy }: TemplatesPanelProps) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [team, setTeam] = useState<TeamTemplate[] | null>(null)
  const [legacy, setLegacy] = useState<LegacyLayout[] | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Miniaturas dos modelos prontos já com a foto e os dados desta promo
  useEffect(() => {
    let alive = true
    for (const fam of TEMPLATE_FAMILIES) {
      const key = `${fam.id}|${format}|${photoUrl}|${vars.DESTINO}|${vars.VALOR_PARCELA}`
      const cached = thumbCache.get(key)
      if (cached) {
        setThumbs((prev) => ({ ...prev, [fam.id]: cached }))
        continue
      }
      void renderDoc(withPhoto(fam.build(format), photoUrl), vars, { mime: "image/jpeg", quality: 0.8, maxWidth: 260 }).then((url) => {
        thumbCache.set(key, url)
        if (alive) setThumbs((prev) => ({ ...prev, [fam.id]: url }))
      })
    }
    return () => {
      alive = false
    }
  }, [format, photoUrl, vars])

  useEffect(() => {
    let alive = true
    setTeam(null)
    fetch(`/api/designs?kind=template&format=${format}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => alive && setTeam(d))
      .catch(() => alive && setTeam([]))
    if (format === "story" || format === "feed") {
      fetch(`/api/layouts?format=${format}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => alive && setLegacy(Array.isArray(d) ? d : []))
        .catch(() => alive && setLegacy([]))
    } else {
      setLegacy([])
    }
    return () => {
      alive = false
    }
  }, [format, refreshKey])

  const openTeamTemplate = async (id: string) => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/designs/${id}`)
      if (!res.ok) throw new Error()
      const design = await res.json()
      onApplyDoc(withPhoto(design.data as StudioDoc, photoUrl))
    } finally {
      setLoadingId(null)
    }
  }

  const deleteTeamTemplate = async (id: string, name: string) => {
    if (!window.confirm(`Excluir o template "${name}" da equipe?`)) return
    const res = await fetch(`/api/designs/${id}`, { method: "DELETE" })
    if (res.ok) setTeam((prev) => prev?.filter((t) => t.id !== id) || null)
    else window.alert((await res.json()).error || "Não foi possível excluir")
  }

  const aspect = format === "story" ? "aspect-[9/16]" : format === "feed" ? "aspect-[4/5]" : format === "square" ? "aspect-square" : "aspect-[1.91/1]"

  const legacySection = legacy && legacy.length > 0 && (
    <Section
      title="Templates atuais da equipe"
      action={
        <a href="/promos/templates" target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-amber-700 underline">
          Editar templates
        </a>
      }
    >
      {hasLegacy && (
        <button
          type="button"
          onClick={() => onApplyFamily("legacy")}
          className={`w-full rounded-xl border-2 px-3 py-2 text-left text-[12px] font-semibold ${activeFamily === "legacy" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300"}`}
        >
          Usar o template padrão em todos os formatos
          <span className="block text-[10px] font-normal text-gray-500">Story e feed com o template da equipe; quadrado e paisagem com o modelo Destaque</span>
        </button>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {legacy.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onApplyDoc(withPhoto(legacyLayoutToDoc(l), photoUrl))}
            className="relative overflow-hidden rounded-xl border-2 border-transparent text-left hover:border-amber-300"
          >
            <div className={`${aspect} w-full bg-gray-800`}>{l.url ? <img src={l.url} alt={l.name} className="h-full w-full object-cover" /> : null}</div>
            {l.isDefault && <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">Padrão</span>}
            <p className="truncate px-1 py-1 text-[12px] font-semibold text-gray-800">{l.name}</p>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">Os mesmos templates da tela Templates, agora com textos e fotos editáveis aqui.</p>
    </Section>
  )

  return (
    <div className="space-y-6">
      {legacySection}

      <Section title="Modelos Donatti">
        <div className={`grid gap-2.5 ${format === "landscape" ? "grid-cols-1" : "grid-cols-2"}`}>
          {TEMPLATE_FAMILIES.map((fam) => (
            <button
              key={fam.id}
              type="button"
              onClick={() => onApplyFamily(fam.id)}
              className={`group overflow-hidden rounded-xl border-2 text-left transition-all ${activeFamily === fam.id ? "border-amber-500" : "border-transparent hover:border-amber-300"}`}
            >
              <div className={`${aspect} w-full bg-gray-100`}>
                {thumbs[fam.id] ? (
                  <img src={thumbs[fam.id]} alt={`Modelo ${fam.name}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <Spinner />
                  </div>
                )}
              </div>
              <div className="px-1 py-1.5">
                <p className="text-[12px] font-bold text-gray-900">{fam.name}</p>
                <p className="text-[10px] leading-tight text-gray-500">{fam.description}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400">Os modelos se adaptam aos 4 formatos. Ao trocar de formato, a arte é refeita no mesmo modelo.</p>
      </Section>

      <Section title="Templates da equipe">
        {team === null ? (
          <Spinner />
        ) : team.length === 0 ? (
          <p className="text-[12px] text-gray-500">Nenhum ainda. Em &quot;Publicar&quot;, use &quot;Salvar como template&quot; para a equipe reaproveitar uma arte.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {team.map((t) => (
              <div key={t.id} className="group relative">
                <button
                  type="button"
                  onClick={() => void openTeamTemplate(t.id)}
                  className="w-full overflow-hidden rounded-xl border-2 border-transparent text-left hover:border-amber-300"
                >
                  <div className={`${aspect} w-full bg-gray-100`}>
                    {t.thumbnailUrl ? <img src={t.thumbnailUrl} alt={t.name} className="h-full w-full object-cover" /> : null}
                    {loadingId === t.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <Spinner />
                      </div>
                    )}
                  </div>
                  <p className="truncate px-1 py-1 text-[12px] font-semibold text-gray-800">{t.name}</p>
                </button>
                <button
                  type="button"
                  onClick={() => void deleteTeamTemplate(t.id, t.name)}
                  aria-label={`Excluir template ${t.name}`}
                  className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 text-red-500 opacity-0 shadow group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

    </div>
  )
}
