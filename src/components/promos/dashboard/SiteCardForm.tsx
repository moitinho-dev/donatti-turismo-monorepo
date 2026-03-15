"use client"

import { Loader2, Save } from "lucide-react"
import { slugify } from "./types"

const SITE_SECTION_SUGGESTIONS = ["nacionais", "internacionais", "cruzeiros", "lua-de-mel", "religioso", "nordeste"]

interface SiteCardFormProps {
  sitePublished: boolean
  setSitePublished: (v: boolean) => void
  siteSection: string
  setSiteSection: (v: string) => void
  siteSlug: string
  setSiteSlug: (v: string) => void
  siteDescription: string
  setSiteDescription: (v: string) => void
  destinoName: string
  savingSiteCard: boolean
  siteCardError: string | null
  siteCardMessage: string | null
  onSave: () => void
}

export function SiteCardForm({
  sitePublished,
  setSitePublished,
  siteSection,
  setSiteSection,
  siteSlug,
  setSiteSlug,
  siteDescription,
  setSiteDescription,
  destinoName,
  savingSiteCard,
  siteCardError,
  siteCardMessage,
  onSave,
}: SiteCardFormProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Card do site</p>
          <p className="text-[11px] text-gray-400">A foto selecionada aqui e a do card</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-200">
          <input
            type="checkbox"
            checked={sitePublished}
            onChange={(e) => setSitePublished(e.target.checked)}
            className="h-4 w-4 rounded border-gray-500 bg-gray-900 text-blue-500 focus:ring-blue-500"
          />
          Publicar
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] text-gray-400">Secao</label>
        <input
          type="text"
          list="site-section-suggestions"
          value={siteSection}
          onChange={(e) => setSiteSection(e.target.value)}
          placeholder="nacionais, internacionais, cruzeiros..."
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
        />
        <datalist id="site-section-suggestions">
          {SITE_SECTION_SUGGESTIONS.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-gray-400">Slug</label>
          <button
            type="button"
            onClick={() => setSiteSlug(slugify(destinoName))}
            className="text-[11px] text-blue-300 hover:text-blue-200"
          >
            Gerar
          </button>
        </div>
        <input
          type="text"
          value={siteSlug}
          onChange={(e) => setSiteSlug(e.target.value)}
          placeholder="ex: cancun-all-inclusive"
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] text-gray-400">Descricao curta</label>
        <input
          type="text"
          value={siteDescription}
          onChange={(e) => setSiteDescription(e.target.value)}
          placeholder="Resumo para o card"
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {siteCardError && <p className="text-[11px] text-red-400">{siteCardError}</p>}
      {siteCardMessage && <p className="text-[11px] text-green-400">{siteCardMessage}</p>}

      <button
        type="button"
        onClick={onSave}
        disabled={savingSiteCard}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 disabled:opacity-50"
      >
        {savingSiteCard ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar card
      </button>
    </div>
  )
}
