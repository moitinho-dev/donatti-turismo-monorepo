"use client"

import { useState } from "react"
import { Download, Globe, LayoutTemplate, Save, Send } from "lucide-react"
import { Instagram } from "@/components/ui/brand-icons"
import type { useGoogleBusiness } from "@/hooks/useGoogleBusiness"
import type { useInstagram } from "@/hooks/useInstagram"
import { GoogleBusinessPanel } from "@/components/promos/dashboard/GoogleBusinessPanel"
import { FORMATS, FORMAT_ORDER, type ArtFormat } from "../types"
import { Btn, Section, Segmented, Spinner } from "./ui"

interface PublishPanelProps {
  promo: Record<string, unknown>
  format: ArtFormat
  isAdmin: boolean
  photoUrl: string | null
  caption: string
  setCaption: (v: string) => void
  saving: boolean
  savedAt: Date | null
  onSaveDesign: () => Promise<void>
  onSaveTemplate: (name: string) => Promise<void>
  onDownload: (which: ArtFormat | "all", mime: "image/png" | "image/jpeg") => Promise<void>
  onSiteCard: (publish: boolean) => Promise<void>
  getDataUrl: (format: ArtFormat) => Promise<string>
  ig: ReturnType<typeof useInstagram>
  gbp: ReturnType<typeof useGoogleBusiness>
}

export function PublishPanel(props: PublishPanelProps) {
  const { promo, format, isAdmin, photoUrl, caption, setCaption, saving, savedAt, ig, gbp } = props
  const [mime, setMime] = useState<"image/png" | "image/jpeg">("image/png")
  const [downloading, setDownloading] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [siteBusy, setSiteBusy] = useState(false)
  const [igTarget, setIgTarget] = useState<"FEED" | "STORIES">(format === "story" ? "STORIES" : "FEED")
  const [showGbpConfig, setShowGbpConfig] = useState(false)

  const download = async (which: ArtFormat | "all") => {
    setDownloading(which)
    try {
      await props.onDownload(which, mime)
    } finally {
      setDownloading(null)
    }
  }

  const igFormat: ArtFormat = igTarget === "STORIES" ? "story" : format === "story" ? "feed" : format

  return (
    <div className="space-y-6">
      <Section title="Baixar">
        <Segmented<"image/png" | "image/jpeg">
          value={mime}
          onChange={setMime}
          options={[
            { value: "image/png", label: "PNG" },
            { value: "image/jpeg", label: "JPG (menor)" },
          ]}
        />
        <Btn variant="primary" className="w-full" onClick={() => void download(format)} disabled={!!downloading}>
          {downloading === format ? <Spinner /> : <Download className="h-4 w-4" />}
          Baixar {FORMATS[format].label}
        </Btn>
        <Btn className="w-full" onClick={() => void download("all")} disabled={!!downloading}>
          {downloading === "all" ? <Spinner /> : <Download className="h-4 w-4" />}
          Baixar os 4 formatos (.zip)
        </Btn>
        <p className="text-[11px] text-gray-400">{FORMAT_ORDER.map((f) => `${FORMATS[f].label} ${FORMATS[f].width}×${FORMATS[f].height}`).join(" · ")}</p>
      </Section>

      <Section title="Salvar">
        <Btn className="w-full" onClick={() => void props.onSaveDesign()} disabled={saving}>
          {saving ? <Spinner /> : <Save className="h-4 w-4" />}
          Salvar artes desta promo
        </Btn>
        {savedAt && <p className="text-[11px] text-gray-400">Salvo às {savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>}
        <div className="flex gap-2">
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Nome do template"
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-[16px] sm:text-[13px] outline-none focus:border-amber-400"
          />
          <Btn
            onClick={async () => {
              await props.onSaveTemplate(templateName.trim() || `${String(promo.DESTINO || "Arte")} - ${FORMATS[format].label}`)
              setTemplateName("")
            }}
            disabled={saving}
            title="Salvar como template da equipe"
          >
            <LayoutTemplate className="h-4 w-4" />
          </Btn>
        </div>
        <p className="text-[11px] text-gray-400">Template da equipe: qualquer agente reaproveita este layout em outras promos.</p>
      </Section>

      <Section title="Site">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-2.5">
          {photoUrl ? <img src={photoUrl} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-gray-100" />}
          <p className="text-[12px] text-gray-600">
            {promo.SITE_PUBLISHED ? "Promo publicada no site." : "Promo ainda não publicada."} O card do site usa a foto do destino (sem os textos da arte).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Btn
            disabled={!photoUrl || siteBusy}
            onClick={async () => {
              setSiteBusy(true)
              await props.onSiteCard(!!promo.SITE_PUBLISHED).finally(() => setSiteBusy(false))
            }}
          >
            {siteBusy ? <Spinner /> : null}
            Usar esta foto
          </Btn>
          <Btn
            variant={promo.SITE_PUBLISHED ? "default" : "primary"}
            disabled={siteBusy}
            onClick={async () => {
              setSiteBusy(true)
              await props.onSiteCard(!promo.SITE_PUBLISHED).finally(() => setSiteBusy(false))
            }}
          >
            <Globe className="h-4 w-4" />
            {promo.SITE_PUBLISHED ? "Tirar do site" : "Publicar"}
          </Btn>
        </div>
      </Section>

      <Section title="Instagram">
        {ig.igConnected ? (
          <>
            <Segmented<"FEED" | "STORIES">
              value={igTarget}
              onChange={setIgTarget}
              options={[
                { value: "FEED", label: "Feed" },
                { value: "STORIES", label: "Stories" },
              ]}
            />
            {igTarget === "FEED" && (
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={5}
                placeholder="Legenda (a aba IA escreve uma para você)"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[16px] sm:text-[13px] outline-none focus:border-amber-400"
              />
            )}
            <Btn
              variant="primary"
              className="w-full"
              disabled={ig.igBusy}
              onClick={async () => {
                const dataUrl = await props.getDataUrl(igFormat)
                await ig.postToInstagram(dataUrl, caption, igTarget, String(promo.id || "")).catch(() => undefined)
              }}
            >
              {ig.igBusy ? <Spinner /> : <Instagram className="h-4 w-4" />}
              Postar {igTarget === "FEED" ? `no feed (${FORMATS[igFormat].label})` : "nos stories"}
            </Btn>
            {ig.igMessage && <p className="text-[12px] text-green-700">{ig.igMessage}</p>}
            {ig.igError && <p className="text-[12px] text-red-600">{ig.igError}</p>}
          </>
        ) : (
          <p className="text-[12px] text-gray-500">
            Instagram não conectado.{" "}
            {isAdmin ? (
              <a href="/api/instagram/connect" className="font-semibold text-amber-700 underline">
                Conectar conta Business
              </a>
            ) : (
              "Peça a um admin para conectar."
            )}
          </p>
        )}
      </Section>

      <Section title="Google (Perfil da Empresa)">
        <Btn
          className="w-full"
          disabled={!gbp.gbpConnected || gbp.gbpBusy || !promo.id}
          onClick={() => promo.id && void gbp.postPromoToGbp(String(promo.id))}
        >
          {gbp.gbpBusy ? <Spinner /> : <Send className="h-4 w-4" />}
          Postar oferta no Google
        </Btn>
        {gbp.gbpMessage && <p className="text-[12px] text-green-700">{gbp.gbpMessage}</p>}
        {gbp.gbpError && <p className="text-[12px] text-red-600">{gbp.gbpError}</p>}
        {!gbp.gbpConnected && <p className="text-[12px] text-gray-500">Google não conectado.</p>}
        {isAdmin && (
          <>
            <button type="button" onClick={() => setShowGbpConfig((v) => !v)} className="text-[12px] font-semibold text-amber-700 underline">
              {showGbpConfig ? "Fechar configuração" : "Configurar conta do Google (admin)"}
            </button>
            {showGbpConfig && (
              <div className="rounded-xl bg-gray-900 p-2">
                <GoogleBusinessPanel
                  gbpConnected={gbp.gbpConnected}
                  gbpAccountName={gbp.gbpAccountName}
                  setGbpAccountName={gbp.setGbpAccountName}
                  gbpLocationName={gbp.gbpLocationName}
                  setGbpLocationName={gbp.setGbpLocationName}
                  gbpAccounts={gbp.gbpAccounts}
                  gbpLocations={gbp.gbpLocations}
                  setGbpLocations={gbp.setGbpLocations}
                  gbpMessage={gbp.gbpMessage}
                  gbpError={gbp.gbpError}
                  gbpBusy={gbp.gbpBusy}
                  onLoadAccounts={gbp.loadGbpAccounts}
                  onLoadLocations={gbp.loadGbpLocations}
                  onSaveTarget={gbp.saveGbpTarget}
                  onSync={gbp.syncGbpPosts}
                  onPostSelected={() => promo.id && void gbp.postPromoToGbp(String(promo.id))}
                  hasSelectedPromo={!!promo.id}
                />
              </div>
            )}
          </>
        )}
      </Section>
    </div>
  )
}
