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
}

export function useLayouts(): UseLayoutsReturn {
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

      // Set current layout to default if not set
      if (!currentLayout && data.length > 0) {
        const defaultLayout = data.find((l: LayoutConfig) => l.isDefault) || data[0]
        setCurrentLayout(defaultLayout)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }, [currentLayout])

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
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("format", format)
      if (name) {
        formData.append("name", name)
      }

      const response = await fetch("/api/layouts/upload", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao fazer upload do layout")
      }
      const newLayout = await response.json()
      setLayouts((prev) => [...prev, newLayout])
      setCurrentLayout(newLayout)
      return newLayout
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      return null
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
  }
}
