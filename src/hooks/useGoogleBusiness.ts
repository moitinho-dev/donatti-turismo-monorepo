"use client"

import { useState, useCallback } from "react"

interface UseGoogleBusinessOptions {
  userRole: string | null | undefined
  fetchPromos: () => Promise<void>
}

export function useGoogleBusiness({ userRole, fetchPromos }: UseGoogleBusinessOptions) {
  const [gbpConnected, setGbpConnected] = useState(false)
  const [gbpAccountName, setGbpAccountName] = useState("")
  const [gbpLocationName, setGbpLocationName] = useState("")
  const [gbpAccounts, setGbpAccounts] = useState<Array<{ name: string; accountName?: string }>>([])
  const [gbpLocations, setGbpLocations] = useState<Array<{ name: string; title?: string }>>([])
  const [gbpMessage, setGbpMessage] = useState<string | null>(null)
  const [gbpError, setGbpError] = useState<string | null>(null)
  const [gbpBusy, setGbpBusy] = useState(false)

  const refreshGbp = useCallback(async () => {
    if (userRole !== "admin") return
    try {
      const res = await fetch("/api/google-business/settings")
      if (!res.ok) return
      const data = await res.json()
      setGbpConnected(Boolean(data?.connected))
      setGbpAccountName(data?.accountName || "")
      setGbpLocationName(data?.locationName || "")
    } catch {
      // ignore
    }
  }, [userRole])

  const loadGbpAccounts = useCallback(async () => {
    setGbpBusy(true)
    setGbpError(null)
    try {
      const res = await fetch("/api/google-business/accounts")
      if (!res.ok) throw new Error("Nao foi possivel carregar contas do Google")
      const data = await res.json()
      setGbpAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      setGbpError(err instanceof Error ? err.message : "Erro ao carregar contas do Google")
    } finally {
      setGbpBusy(false)
    }
  }, [])

  const loadGbpLocations = useCallback(async (accountName: string) => {
    if (!accountName) return
    setGbpBusy(true)
    setGbpError(null)
    try {
      const res = await fetch(`/api/google-business/locations?accountName=${encodeURIComponent(accountName)}`)
      if (!res.ok) throw new Error("Nao foi possivel carregar locais do Google")
      const data = await res.json()
      setGbpLocations(Array.isArray(data) ? data : [])
    } catch (err) {
      setGbpError(err instanceof Error ? err.message : "Erro ao carregar locais do Google")
    } finally {
      setGbpBusy(false)
    }
  }, [])

  const saveGbpTarget = useCallback(async () => {
    setGbpBusy(true)
    setGbpError(null)
    setGbpMessage(null)
    try {
      const res = await fetch("/api/google-business/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountName: gbpAccountName, locationName: gbpLocationName }),
      })
      if (!res.ok) throw new Error("Nao foi possivel salvar conta/local do Google")
      setGbpMessage("Conta e local salvos.")
      await refreshGbp()
    } catch (err) {
      setGbpError(err instanceof Error ? err.message : "Erro ao salvar configuracao do Google")
    } finally {
      setGbpBusy(false)
    }
  }, [gbpAccountName, gbpLocationName, refreshGbp])

  const syncGbpPosts = useCallback(async () => {
    setGbpBusy(true)
    setGbpError(null)
    setGbpMessage(null)
    try {
      const res = await fetch("/api/google-business/sync", { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erro ao sincronizar posts no Google")
      const okCount = Array.isArray(data?.results) ? data.results.filter((r: { ok?: boolean; skipped?: boolean }) => r.ok && !r.skipped).length : 0
      const skippedCount = Array.isArray(data?.results) ? data.results.filter((r: { ok?: boolean; skipped?: boolean }) => r.ok && r.skipped).length : 0
      setGbpMessage(`Sincronizado: ${okCount} post(s). Ignorados: ${skippedCount}.`)
      await fetchPromos()
    } catch (err) {
      setGbpError(err instanceof Error ? err.message : "Erro ao sincronizar posts no Google")
    } finally {
      setGbpBusy(false)
    }
  }, [fetchPromos])

  const postPromoToGbp = useCallback(async (promoId: string) => {
    setGbpBusy(true)
    setGbpError(null)
    setGbpMessage(null)
    try {
      const res = await fetch("/api/google-business/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erro ao postar no Google")
      setGbpMessage("Post enviado ao Google Business.")
      await fetchPromos()
    } catch (err) {
      setGbpError(err instanceof Error ? err.message : "Erro ao postar no Google")
    } finally {
      setGbpBusy(false)
    }
  }, [fetchPromos])

  return {
    gbpConnected,
    gbpAccountName,
    setGbpAccountName,
    gbpLocationName,
    setGbpLocationName,
    gbpAccounts,
    gbpLocations,
    setGbpLocations,
    gbpMessage,
    gbpError,
    gbpBusy,
    refreshGbp,
    loadGbpAccounts,
    loadGbpLocations,
    saveGbpTarget,
    syncGbpPosts,
    postPromoToGbp,
  }
}
