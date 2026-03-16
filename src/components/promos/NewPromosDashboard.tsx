"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { usePromo } from "@/hooks/usePromo"
import { useGoogleBusiness } from "@/hooks/useGoogleBusiness"
import { useInstagram } from "@/hooks/useInstagram"
import { usePromoImages } from "@/hooks/usePromoImages"
import { X } from "lucide-react"
import { PromoFormModal } from "./PromoFormModal"
import { DashboardHeader } from "./dashboard/DashboardHeader"
import { PromoListPanel } from "./dashboard/PromoListPanel"
import { DonatiStudio } from "./DonatiStudio"
import { StatsPanel } from "./dashboard/StatsPanel"
import { DeleteConfirmModal } from "./dashboard/DeleteConfirmModal"
import type { PromoData, ActivePanel, UserData } from "./dashboard/types"
import { slugify } from "./dashboard/types"

interface NewPromosDashboardProps {
  user: UserData
}

export default function NewPromosDashboard({ user }: NewPromosDashboardProps) {
  const { promos, isLoading, error, fetchPromos, deletePromo, stats, fetchStats, savePromo } = usePromo()
  const gbp = useGoogleBusiness({ userRole: user.role, fetchPromos })
  const ig = useInstagram()
  const { promoImages, loadingPromoImages, updatePromoImage } = usePromoImages(promos)

  const [activePanel, setActivePanel] = useState<ActivePanel>("list")
  const [selectedPromo, setSelectedPromo] = useState<PromoData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)

  // Image gallery state
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<Array<{ id: string; urls: { regular: string; small: string } }>>([])
  const [loadingImages, setLoadingImages] = useState(false)

  // Site card state
  const [sitePublished, setSitePublished] = useState(false)
  const [siteSection, setSiteSection] = useState("")
  const [siteSlug, setSiteSlug] = useState("")
  const [siteDescription, setSiteDescription] = useState("")
  const [savingSiteCard, setSavingSiteCard] = useState(false)
  const [siteCardMessage, setSiteCardMessage] = useState<string | null>(null)
  const [siteCardError, setSiteCardError] = useState<string | null>(null)

  const searchParams = useSearchParams()

  useEffect(() => {
    fetchPromos()
    fetchStats()
    // Auto-open form when coming from Chrome extension
    if (searchParams.get("autofill")) {
      setActivePanel("form")
      setSelectedPromo(null)
      setShowFormModal(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void gbp.refreshGbp()
    void ig.refreshIg()
  }, [gbp.refreshGbp, ig.refreshIg])

  // Sync site card state when promo changes
  useEffect(() => {
    if (!selectedPromo) return
    setSitePublished(!!selectedPromo.SITE_PUBLISHED)
    setSiteSection(selectedPromo.SITE_SECTION || "nacionais")
    setSiteSlug(selectedPromo.SITE_SLUG || slugify(selectedPromo.DESTINO || ""))
    setSiteDescription(selectedPromo.SITE_DESCRIPTION || selectedPromo.HOTEL || "")
    setSiteCardMessage(null)
    setSiteCardError(null)
    if (selectedPromo.SITE_IMAGE && !backgroundImage) {
      setBackgroundImage(selectedPromo.SITE_IMAGE)
    }
  }, [selectedPromo?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveSiteCard = useCallback(async () => {
    if (!selectedPromo?.id) return

    const imageToSave = backgroundImage || selectedPromo.SITE_IMAGE || ""
    if (!imageToSave) {
      setSiteCardError("Selecione uma imagem de fundo para salvar no card.")
      return
    }

    const nextSection = (siteSection || "").trim()
    if (sitePublished && !nextSection) {
      setSiteCardError("Defina a secao antes de publicar (ex.: nacionais, internacionais, cruzeiros).")
      return
    }

    const nextSlug = (siteSlug || slugify(selectedPromo.DESTINO || "")).trim()
    if (sitePublished && !nextSlug) {
      setSiteCardError("Defina o slug antes de publicar.")
      return
    }

    setSavingSiteCard(true)
    setSiteCardError(null)
    setSiteCardMessage(null)
    try {
      const updated = await savePromo({
        ...selectedPromo,
        SITE_PUBLISHED: sitePublished,
        SITE_SECTION: nextSection,
        SITE_SLUG: nextSlug,
        SITE_IMAGE: imageToSave,
        SITE_DESCRIPTION: (siteDescription || selectedPromo.HOTEL || "").trim(),
      })
      setSelectedPromo(updated)
      updatePromoImage(updated.id, updated.SITE_IMAGE || imageToSave)
      setSiteCardMessage(sitePublished ? "Publicado no site com a imagem selecionada." : "Imagem do card salva (nao publicado).")
      await fetchPromos()
    } catch (err) {
      setSiteCardError(err instanceof Error ? err.message : "Erro ao salvar card do site")
    } finally {
      setSavingSiteCard(false)
    }
  }, [backgroundImage, fetchPromos, savePromo, selectedPromo, siteDescription, sitePublished, siteSection, siteSlug, updatePromoImage])

  const handleEdit = (promo: PromoData) => {
    setSelectedPromo(promo)
    setShowFormModal(true)
  }

  const handleDelete = async (id: string) => {
    await deletePromo(id)
    setDeleteConfirm(null)
    fetchPromos()
  }

  const handleGenerateImage = async (promo: PromoData) => {
    setSelectedPromo(promo)
    setSitePublished(!!promo.SITE_PUBLISHED)
    setSiteSection(promo.SITE_SECTION || "nacionais")
    setSiteSlug(promo.SITE_SLUG || slugify(promo.DESTINO || ""))
    setSiteDescription(promo.SITE_DESCRIPTION || promo.HOTEL || "")
    setSiteCardMessage(null)
    setSiteCardError(null)
    setLoadingImages(true)
    setBackgroundImage(promo.SITE_IMAGE || null)

    try {
      const response = await fetch(`/api/image-search?query=${encodeURIComponent(promo.DESTINO)}&limit=20`)
      const data = await response.json()
      if (data.results?.length > 0) {
        setGalleryImages(data.results)
        if (!promo.SITE_IMAGE) {
          setBackgroundImage(data.results[0].urls.regular)
        }
      }
    } catch (err) {
      console.error("Error fetching images:", err)
    } finally {
      setLoadingImages(false)
    }

    setActivePanel("editor")
  }

  const handleFormSuccess = () => {
    setShowFormModal(false)
    setSelectedPromo(null)
    fetchPromos()
    fetchStats()
  }

  const handleNewPromo = () => {
    setSelectedPromo(null)
    setShowFormModal(true)
  }

  const handleCloseEditor = () => {
    setActivePanel("list")
    setSelectedPromo(null)
    setBackgroundImage(null)
    setGalleryImages([])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        user={user}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        onNewPromo={handleNewPromo}
        onOpenModal={handleNewPromo}
      />

      <main className="p-6">
        {(activePanel === "list" || activePanel === "form") && (
          <PromoListPanel
            promos={promos}
            isLoading={isLoading}
            error={error}
            stats={stats}
            promoImages={promoImages}
            loadingPromoImages={loadingPromoImages}
            onEdit={handleEdit}
            onGenerateImage={handleGenerateImage}
            onDelete={(id) => setDeleteConfirm(id)}
            onNewPromo={handleNewPromo}
          />
        )}

        {activePanel === "editor" && selectedPromo && (
          <DonatiStudio
            promo={selectedPromo}
            user={user}
            backgroundImage={backgroundImage}
            setBackgroundImage={setBackgroundImage}
            galleryImages={galleryImages}
            setGalleryImages={setGalleryImages}
            loadingImages={loadingImages}
            setLoadingImages={setLoadingImages}
            sitePublished={sitePublished}
            setSitePublished={setSitePublished}
            siteSection={siteSection}
            setSiteSection={setSiteSection}
            siteSlug={siteSlug}
            setSiteSlug={setSiteSlug}
            siteDescription={siteDescription}
            setSiteDescription={setSiteDescription}
            savingSiteCard={savingSiteCard}
            siteCardError={siteCardError}
            siteCardMessage={siteCardMessage}
            onSaveSiteCard={() => void saveSiteCard()}
            gbp={gbp}
            ig={ig}
            onClose={handleCloseEditor}
          />
        )}

        {activePanel === "stats" && <StatsPanel stats={stats} />}
      </main>

      {deleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <PromoFormModal
        promo={selectedPromo}
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setSelectedPromo(null) }}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
