"use client"

import { useState, useCallback } from "react"

export interface ElementConfig {
  x: number
  y: number
  fontSize: number
  fontWeight: string
  color: string
  fontFamily: string
  visible: boolean
  template?: string // Custom text template with variables like {DESTINO}, {NOITES}, etc.
  isCustom?: boolean // Flag to identify custom elements
}

export interface ImageArea {
  id: string
  name: string
  type: "rectangle" | "polygon"
  points: { x: number; y: number }[]
  zIndex: number
  imageUrl?: string
  fit: "cover" | "contain" | "fill"
  visible: boolean
}

export interface LayoutConfig {
  id: string
  name: string
  type: "png" | "svg" | "custom"
  format: "story" | "feed"
  url?: string
  isDefault?: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  elements: {
    [key: string]: ElementConfig
  }
  imageAreas?: ImageArea[]
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
}

interface UseLayoutsReturn {
  layouts: LayoutConfig[]
  currentLayout: LayoutConfig | null
  isLoading: boolean
  error: string | null
  fetchLayouts: (format?: "story" | "feed") => Promise<void>
  fetchLayout: (id: string) => Promise<LayoutConfig | null>
  createLayout: (data: Partial<LayoutConfig>) => Promise<LayoutConfig | null>
  updateLayout: (id: string, data: Partial<LayoutConfig>) => Promise<LayoutConfig | null>
  deleteLayout: (id: string) => Promise<boolean>
  uploadLayout: (file: File, format: "story" | "feed", name?: string) => Promise<LayoutConfig | null>
  setAsDefault: (id: string) => Promise<boolean>
  setCurrentLayout: (layout: LayoutConfig | null) => void
  updateElement: (elementId: string, updates: Partial<ElementConfig>) => void
  updateColor: (colorKey: string, value: string) => void
  toggleElementVisibility: (elementId: string) => void
  updateImageAreas: (areas: ImageArea[]) => void
  addImageArea: (area: ImageArea) => void
  removeImageArea: (areaId: string) => void
  updateImageArea: (areaId: string, updates: Partial<ImageArea>) => void
  addElement: (elementId: string, config: ElementConfig) => void
  removeElement: (elementId: string) => void
}

import React, { createContext, useContext } from "react"

// Create a context for the layouts state so components can share a single instance
const LayoutsContext = createContext<UseLayoutsReturn | undefined>(undefined)

export function LayoutsProvider({ children }: { children: React.ReactNode }) {
  const value = useLayoutsInstance()
  return <LayoutsContext.Provider value={value}>{children}</LayoutsContext.Provider>
}

export function useLayouts(): UseLayoutsReturn {
  // If a LayoutsProvider is present, use that instance
  const ctx = useContext(LayoutsContext)
  if (ctx) return ctx
  // Otherwise, create a local instance (backwards compatibility)
  return useLayoutsInstance()
}

// Internal hook implementation used by both the provider and fallback
function useLayoutsInstance(): UseLayoutsReturn {
  const [layouts, setLayouts] = useState<LayoutConfig[]>([])
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLayouts = useCallback(async (format?: "story" | "feed") => {
    setIsLoading(true)
    setError(null)
    try {
      const url = format ? `/api/layouts?format=${format}` : "/api/layouts"
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Erro ao buscar layouts")
      }
      const data = await response.json()
      setLayouts(data)

      // Update current layout with fresh data from server, or set default if not set
      if (data.length > 0) {
        // Use functional update to get the latest currentLayout value
        setCurrentLayout((prevLayout) => {
          // If we have a current layout, find its updated version in the new data
          if (prevLayout) {
            const updatedCurrentLayout = data.find((l: LayoutConfig) => l.id === prevLayout.id)
            if (updatedCurrentLayout) {
              console.log("[useLayouts] Updating current layout with server data:", updatedCurrentLayout.id, "Custom elements:", Object.keys(updatedCurrentLayout.elements).filter(k => updatedCurrentLayout.elements[k].isCustom || updatedCurrentLayout.elements[k].template))
              return updatedCurrentLayout
            } else {
              // Current layout was deleted, set to default
              const defaultLayout = data.find((l: LayoutConfig) => l.isDefault) || data[0]
              console.log("[useLayouts] Current layout not found, setting default:", defaultLayout.id)
              return defaultLayout
            }
          } else {
            // No current layout, set default
            const defaultLayout = data.find((l: LayoutConfig) => l.isDefault) || data[0]
            console.log("[useLayouts] Setting current layout:", defaultLayout.id, defaultLayout.name, "Custom elements:", Object.keys(defaultLayout.elements).filter(k => defaultLayout.elements[k].isCustom || defaultLayout.elements[k].template))
            return defaultLayout
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchLayout = useCallback(async (id: string): Promise<LayoutConfig | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/layouts?id=${id}`)
      if (!response.ok) {
        throw new Error("Erro ao buscar layout")
      }
      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createLayout = useCallback(async (data: Partial<LayoutConfig>): Promise<LayoutConfig | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar layout")
      }
      const newLayout = await response.json()
      setLayouts((prev) => [...prev, newLayout])
      // Broadcast that layouts have been created so other components can refresh
      try { window.dispatchEvent(new CustomEvent('layouts:update', { detail: { action: 'create', id: newLayout.id, format: newLayout.format } })) } catch (e) { /* ssr safe */ }
      return newLayout
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateLayout = useCallback(async (id: string, data: Partial<LayoutConfig>): Promise<LayoutConfig | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/layouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar layout")
      }
      const updatedLayout = await response.json()
      setLayouts((prev) => prev.map((l) => (l.id === id ? updatedLayout : l)))
      if (currentLayout?.id === id) {
        setCurrentLayout(updatedLayout)
      }
      // Broadcast that a layout has been updated
      try { window.dispatchEvent(new CustomEvent('layouts:update', { detail: { action: 'update', id: updatedLayout.id, format: updatedLayout.format } })) } catch (e) { /* ssr safe */ }
      return updatedLayout
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentLayout])

  const deleteLayout = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/layouts?id=${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao deletar layout")
      }
      setLayouts((prev) => prev.filter((l) => l.id !== id))
      if (currentLayout?.id === id) {
        setCurrentLayout(null)
      }
      try { window.dispatchEvent(new CustomEvent('layouts:update', { detail: { action: 'delete', id } })) } catch (e) { /* ssr safe */ }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentLayout])

  const uploadLayout = useCallback(async (
    file: File,
    format: "story" | "feed",
    name?: string
  ): Promise<LayoutConfig | null> => {
    console.log("[useLayouts] uploadLayout called:", file.name, format, name)
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("format", format)
      if (name) {
        formData.append("name", name)
      }

      console.log("[useLayouts] Sending request to /api/layouts/upload")
      const response = await fetch("/api/layouts/upload", {
        method: "POST",
        body: formData,
      })
      console.log("[useLayouts] Response status:", response.status)

      if (!response.ok) {
        const errorText = (await response.text().catch(() => "")).trim()
        let message = `Erro ao fazer upload do layout (HTTP ${response.status})`

        if (errorText) {
          if (response.status === 413) {
            message = "Arquivo muito grande para upload"
          } else {
            const looksLikeHtml =
              errorText.startsWith("<!DOCTYPE") || errorText.startsWith("<html") || errorText.startsWith("<")

            if (!looksLikeHtml) {
              try {
                const parsed = JSON.parse(errorText) as { error?: unknown }
                if (typeof parsed?.error === "string" && parsed.error.trim()) {
                  message = parsed.error
                } else {
                  message = errorText.slice(0, 300)
                }
              } catch {
                message = errorText.slice(0, 300)
              }
            }
          }
        }

        console.error("[useLayouts] Upload error response:", { status: response.status, body: errorText.slice(0, 1000) })
        throw new Error(message)
      }

      const newLayout = await response.json()
      console.log("[useLayouts] New layout created:", newLayout.id, newLayout.name)
      setLayouts((prev) => [...prev, newLayout])
      setCurrentLayout(newLayout)
      try { window.dispatchEvent(new CustomEvent('layouts:update', { detail: { action: 'create', id: newLayout.id, format: newLayout.format } })) } catch (e) { /* ssr safe */ }
      return newLayout
    } catch (err) {
      console.error("[useLayouts] Upload exception:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      throw err instanceof Error ? err : new Error("Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setAsDefault = useCallback(async (id: string): Promise<boolean> => {
    const result = await updateLayout(id, { isDefault: true })
    if (result) {
      // Update local state to reflect the change
      setLayouts((prev) =>
        prev.map((l) => ({
          ...l,
          isDefault: l.id === id ? true : l.format === result.format ? false : l.isDefault,
        }))
      )
    }
    try { window.dispatchEvent(new CustomEvent('layouts:update', { detail: { action: 'set-default', id, format: result?.format } })) } catch (e) { /* ssr safe */ }
    return !!result
  }, [updateLayout])

  const updateElement = useCallback((elementId: string, updates: Partial<ElementConfig>) => {
    if (!currentLayout) return
    setCurrentLayout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        elements: {
          ...prev.elements,
          [elementId]: {
            ...prev.elements[elementId],
            ...updates,
          },
        },
      }
    })
  }, [currentLayout])

  const updateColor = useCallback((colorKey: string, value: string) => {
    if (!currentLayout) return
    setCurrentLayout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        colors: {
          ...prev.colors,
          [colorKey]: value,
        },
      }
    })
  }, [currentLayout])

  const toggleElementVisibility = useCallback((elementId: string) => {
    if (!currentLayout) return
    setCurrentLayout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        elements: {
          ...prev.elements,
          [elementId]: {
            ...prev.elements[elementId],
            visible: !prev.elements[elementId].visible,
          },
        },
      }
    })
  }, [currentLayout])

  const updateImageAreas = useCallback((areas: ImageArea[]) => {
    if (!currentLayout) return
    setCurrentLayout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        imageAreas: areas,
      }
    })
  }, [currentLayout])

  const addImageArea = useCallback((area: ImageArea) => {
    if (!currentLayout) return
    setCurrentLayout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        imageAreas: [...(prev.imageAreas || []), area],
      }
    })
  }, [currentLayout])

  const removeImageArea = useCallback((areaId: string) => {
    if (!currentLayout) return
    setCurrentLayout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        imageAreas: (prev.imageAreas || []).filter((a) => a.id !== areaId),
      }
    })
  }, [currentLayout])

  const updateImageArea = useCallback((areaId: string, updates: Partial<ImageArea>) => {
    if (!currentLayout) return
    setCurrentLayout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        imageAreas: (prev.imageAreas || []).map((a) =>
          a.id === areaId ? { ...a, ...updates } : a
        ),
      }
    })
  }, [currentLayout])

  const addElement = useCallback((elementId: string, config: ElementConfig) => {
    if (!currentLayout) return
    setCurrentLayout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        elements: {
          ...prev.elements,
          [elementId]: config,
        },
      }
    })
  }, [currentLayout])

  const removeElement = useCallback((elementId: string) => {
    if (!currentLayout) return
    setCurrentLayout((prev) => {
      if (!prev) return prev
      const { [elementId]: _, ...remainingElements } = prev.elements
      return {
        ...prev,
        elements: remainingElements,
      }
    })
  }, [currentLayout])

  return {
    layouts,
    currentLayout,
    isLoading,
    error,
    fetchLayouts,
    fetchLayout,
    createLayout,
    updateLayout,
    deleteLayout,
    uploadLayout,
    setAsDefault,
    setCurrentLayout,
    updateElement,
    updateColor,
    toggleElementVisibility,
    updateImageAreas,
    addImageArea,
    removeImageArea,
    updateImageArea,
    addElement,
    removeElement,
  }
}
