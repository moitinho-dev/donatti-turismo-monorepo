"use client"
import { useState, useCallback } from "react"

interface PromoData {
  id: string
  DESTINO: string
  HOTEL: string
  DATA_FORMATADA: string
  VALOR: string
  VALORTOTAL: string
  PARCELAS: string
  COM_CAFE?: boolean
  SEM_CAFE?: boolean
  MEIA_PENSAO?: boolean
  PENSAO_COMPLETA?: boolean
  ALL_INCLUSIVE?: boolean
  NUMERO_DE_NOITES?: string
  SP?: boolean
  CG?: boolean
  AEREO?: boolean
  createdAt: string
  updatedAt: string
}

interface StatsData {
  overall: {
    totalPromos: number
    uniqueDestinations: number
    averageValue: number
    averageNights: number
    mostPopularDestination: {
      name: string
      count: number
    }
  }
  daily: {
    date: string
    label: string
    count: number
  }[]
}

export function usePromo() {
  const [promos, setPromos] = useState<PromoData[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPromos = useCallback(async (startDate?: Date, endDate?: Date) => {
    setIsLoading(true)
    setError(null)

    try {
      let url = "/api/promos"

      // Add date range filter if provided
      if (startDate && endDate) {
        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = endDate.toISOString().split("T")[0]
        url += `?startDate=${startDateStr}&endDate=${endDateStr}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error fetching promos: ${response.statusText}`)
      }

      const data = await response.json()
      setPromos(data)
    } catch (err) {
      console.error("Error fetching promos:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido ao buscar promoções")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/promos/stats")

      if (!response.ok) {
        throw new Error(`Error fetching stats: ${response.statusText}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Error fetching stats:", err)
      // Don't set error state for stats to avoid blocking the UI
    } finally {
      setIsLoading(false)
    }
  }, [])

  const savePromo = useCallback(async (promoData: any) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/promos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promoData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar promoção")
      }

      return await response.json()
    } catch (err) {
      console.error("Error saving promo:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido ao salvar promoção")
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deletePromo = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/promos?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao excluir promoção")
      }

      return await response.json()
    } catch (err) {
      console.error("Error deleting promo:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido ao excluir promoção")
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    promos,
    stats,
    isLoading,
    error,
    fetchPromos,
    fetchStats,
    savePromo,
    deletePromo,
  }
}
