"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Upload,
  Loader2,
  Settings,
  Image,
  Layers,
  Save,
  Trash2,
  Plus,
  Check,
} from "lucide-react"
import { TemplateAreaEditor, type ImageArea } from "@/components/promos/editor/TemplateAreaEditor"

interface Layout {
  id: string
  name: string
  type: string
  format: "story" | "feed"
  url?: string
  imageUrl?: string
  isDefault: boolean
  elements: Record<string, any>
  imageAreas?: ImageArea[]
  colors: Record<string, string>
  createdAt: string
}

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [layouts, setLayouts] = useState<Layout[]>([])
  const [selectedLayout, setSelectedLayout] = useState<Layout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [imageAreas, setImageAreas] = useState<ImageArea[]>([])
  const [activeTab, setActiveTab] = useState<"story" | "feed">("story")

  // Fetch layouts
  const fetchLayouts = useCallback(async () => {
    try {
      const res = await fetch("/api/layouts")
      if (res.ok) {
        const data = await res.json()
        setLayouts(data)
      }
    } catch (error) {
      console.error("Error fetching layouts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/promos/login")
    } else if (status === "authenticated") {
      fetchLayouts()
    }
  }, [status, router, fetchLayouts])

  // Handle upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const name = prompt("Nome do template:")
    if (!name) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("format", activeTab)
      formData.append("name", name)

      const res = await fetch("/api/layouts/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        await fetchLayouts()
      }
    } catch (error) {
      console.error("Error uploading:", error)
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  // Select layout for editing
  const selectLayoutForEditing = (layout: Layout) => {
    setSelectedLayout(layout)
    setImageAreas(layout.imageAreas || [])
    setShowEditor(true)
  }

  // Save image areas
  const handleSaveAreas = async () => {
    if (!selectedLayout) return

    setIsSaving(true)
    try {
      const res = await fetch("/api/layouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedLayout.id,
          imageAreas: imageAreas,
        }),
      })

      if (res.ok) {
        await fetchLayouts()
        setShowEditor(false)
      }
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete layout
  const handleDelete = async (layoutId: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return

    try {
      const res = await fetch(`/api/layouts?id=${layoutId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await fetchLayouts()
      }
    } catch (error) {
      console.error("Error deleting:", error)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Editor view
  if (showEditor && selectedLayout) {
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditor(false)}
              className="p-2 hover:bg-gray-700 rounded text-gray-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Configurar Areas de Imagem</h1>
              <p className="text-sm text-gray-400">{selectedLayout.name}</p>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <TemplateAreaEditor
            templateUrl={selectedLayout.url || selectedLayout.imageUrl || ""}
            imageAreas={imageAreas}
            onAreasChange={setImageAreas}
            onSave={handleSaveAreas}
            format={selectedLayout.format}
          />
        </div>
      </div>
    )
  }

  // List view
  const filteredLayouts = layouts.filter((l) => l.format === activeTab)

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/promos")}
                className="p-2 hover:bg-gray-700 rounded text-gray-400"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Gerenciar Templates</h1>
                <p className="text-sm text-gray-400">Configure as areas onde as fotos serao inseridas</p>
              </div>
            </div>

            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Enviar Template
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("story")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "story"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Stories (1080x1920)
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "feed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Feed (1080x1350)
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredLayouts.length === 0 ? (
          <div className="text-center py-16">
            <Image className="h-16 w-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Nenhum template {activeTab === "story" ? "de Stories" : "de Feed"}
            </h3>
            <p className="text-gray-500 mb-4">
              Envie uma imagem PNG para usar como template
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLayouts.map((layout) => (
              <div
                key={layout.id}
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
              >
                {/* Preview */}
                <div className="relative aspect-[9/16] bg-gray-900">
                  {(layout.url || layout.imageUrl) && (
                    <img
                      src={layout.url || layout.imageUrl}
                      alt={layout.name}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Badge */}
                  {layout.isDefault && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                      Padrao
                    </div>
                  )}

                  {/* Areas indicator */}
                  {layout.imageAreas && layout.imageAreas.length > 0 && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-600 text-white text-xs rounded flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {layout.imageAreas.length} areas
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-200 mb-1">{layout.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {layout.imageAreas?.length || 0} areas de imagem configuradas
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => selectLayoutForEditing(layout)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                    >
                      <Settings className="h-4 w-4" />
                      Configurar Areas
                    </button>

                    {!layout.isDefault && (
                      <button
                        onClick={() => handleDelete(layout.id)}
                        className="p-2 bg-gray-700 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            Como Configurar Areas de Imagem
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-300">
            <div>
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">1</div>
              <h4 className="font-medium mb-1">Envie o Template</h4>
              <p className="text-gray-500">
                Envie a imagem PNG do seu template. O template deve ter areas vazias ou com espacos reservados para as fotos.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">2</div>
              <h4 className="font-medium mb-1">Desenhe as Areas</h4>
              <p className="text-gray-500">
                Use a ferramenta Retangulo ou Caneta para desenhar as areas onde as fotos serao inseridas.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">3</div>
              <h4 className="font-medium mb-1">Defina a Ordem</h4>
              <p className="text-gray-500">
                Configure o Z-Index de cada area. Areas com valor menor ficam atras do template, areas com valor maior ficam na frente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
